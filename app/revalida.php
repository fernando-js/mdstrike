<?php
declare(strict_types=1);

function revalida_map(string $id): ?array {
    foreach (catalog()['revalidaMaps'] as $map) if ($map['id'] === $id) return $map;
    return null;
}

function revalida_exam(string $id): ?array {
    return exam_definition($id, 'revalida');
}

function exam_definition(string $id, string $operation = ''): ?array {
    foreach (catalog()['exams'] as $exam) {
        if ($exam['id'] === $id && ($exam['operation'] ?? '') === $operation) return $exam;
    }
    return null;
}

function operation_progress(int $id, bool $revalida): array {
    $condition = $revalida ? "LIKE 'revalida-%'" : "NOT LIKE 'revalida-%'";
    $reviewCondition = $revalida ? $condition : "$condition AND map_id <> 'tea'";
    return [
        'history' => query("SELECT id, mode, map_id, exam_id, score, correct, bot_score, result_json, finished_at FROM md_matches WHERE user_id = ? AND finished_at IS NOT NULL AND map_id $condition ORDER BY finished_at DESC, id DESC LIMIT 20", [$id])->fetchAll(),
        'stats' => query("SELECT area, COUNT(*) AS answered, SUM(correct) AS correct FROM md_answers WHERE user_id = ? AND map_id $condition GROUP BY area", [$id])->fetchAll(),
        'wrong' => array_column(query("SELECT question_id FROM md_answers WHERE id IN (SELECT MAX(id) FROM md_answers WHERE user_id = ? AND map_id $reviewCondition GROUP BY question_id) AND correct = 0", [$id])->fetchAll(), 'question_id'),
    ];
}

function revalida_attempt(array $match, array $exam): array {
    $payload = json_decode($match['questions_json'], true, 512, JSON_THROW_ON_ERROR);
    $bank = array_column(question_bank(), null, 'id');
    return [
        'id' => $match['id'],
        'mode' => $match['mode'],
        'map' => $match['map_id'],
        'exam' => $exam['id'],
        'duration' => (int)$payload['duration'],
        'remaining' => max(0, (int)$match['started_at'] + (int)$payload['duration'] - time()),
        'questions' => array_map(fn($item) => question_public($bank[$item['id']], $item['order']), $payload['items']),
        'choices' => (object)$payload['choices'],
    ];
}

function revalida_simulation_write(string $action, array $data, array $user): never {
    $id = $data['match'] ?? '';
    $db = database();
    $db->beginTransaction();
    $mysql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    $match = query("SELECT * FROM md_matches WHERE id = ? AND user_id = ? AND mode = 'revalida-exam'" . ($mysql ? ' FOR UPDATE' : ''), [$id, $user['id']])->fetch();
    if (!$match) {
        $db->rollBack();
        fail('Simulado não encontrado.', 404);
    }
    if ($match['finished_at'] !== null) {
        $result = json_decode($match['result_json'], true);
        $db->commit();
        if ($action === 'revalida-submit' && empty($result['aborted'])) send_json(['result' => $result]);
        fail('Esta tentativa foi encerrada.', 409);
    }
    $payload = json_decode($match['questions_json'], true, 512, JSON_THROW_ON_ERROR);
    $elapsed = time() - (int)$match['started_at'];
    if ($action === 'revalida-mark') {
        $index = $data['index'] ?? null;
        $choice = $data['choice'] ?? null;
        if (!is_int($index) || !is_int($choice) || !isset($payload['items'][$index]) || $choice < -1 || !($choice === -1 || isset($payload['items'][$index]['order'][$choice]))) {
            $db->rollBack();
            fail('Questão ou alternativa inválida.');
        }
        if ($elapsed >= $payload['duration']) {
            $db->rollBack();
            fail('O tempo de prova terminou. Entregue o simulado.', 409);
        }
        if ($choice === -1) unset($payload['choices'][$index]);
        else $payload['choices'][$index] = $choice;
        query('UPDATE md_matches SET questions_json = ? WHERE id = ?', [json_encode($payload, JSON_THROW_ON_ERROR), $id]);
        $db->commit();
        send_json(['ok' => true]);
    }
    $bank = array_column(question_bank(), null, 'id');
    $correct = 0;
    $answers = [];
    foreach ($payload['items'] as $index => $item) {
        $question = $bank[$item['id']];
        $choice = $payload['choices'][$index] ?? -1;
        $right = $choice >= 0 && $item['order'][$choice] === $question['answer'];
        $correct += (int)$right;
        $answers[] = ['number'=>$question['number'], 'choice'=>$choice, 'answer'=>$question['answer'], 'pdf'=>$question['pdf'], 'page'=>$question['page']];
        query('INSERT INTO md_answers (match_id,user_id,question_id,area,map_id,choice,correct,points,elapsed,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)', [$id,$user['id'],$question['id'],$question['area'],$match['map_id'],$choice,(int)$right,(int)$right,0,time()]);
    }
    $cutoff = $payload['cutoff'];
    $formation = $payload['formation'];
    unset($payload['formation']);
    $score = $correct + $payload['cancelledCredit'];
    $result = [
        'exam'=>$match['exam_id'], 'correct'=>$correct, 'score'=>$score,
        'total'=>count($answers), 'answered'=>count($payload['choices']), 'answers'=>$answers,
        'cutoff'=>$cutoff, 'maximum'=>$payload['maximum'], 'cancelledCredit'=>$payload['cancelledCredit'],
        'reachedCutoff'=>$cutoff === null ? null : $score >= $cutoff,
        'elapsed'=>min($elapsed, $payload['duration']),
    ];
    query('UPDATE md_matches SET question_index = ?, correct = ?, score = ?, finished_at = ?, result_json = ?, questions_json = ? WHERE id = ?', [count($answers),$correct,$score,time(),json_encode($result, JSON_THROW_ON_ERROR),json_encode($payload, JSON_THROW_ON_ERROR),$id]);
    if ($cutoff !== null && $result['answered'] > 0) {
        // An empty declaration still reserves the first scored attempt.
        $insert = $mysql ? 'ON DUPLICATE KEY UPDATE user_id = user_id' : 'ON CONFLICT(user_id, exam_id) DO NOTHING';
        query("INSERT INTO md_revalida_first (user_id,exam_id,formation,reached_cutoff) VALUES (?,?,?,?) $insert", [$user['id'],$match['exam_id'],$formation,(int)$result['reachedCutoff']]);
    }
    $db->commit();
    audit_event('match.finished', (int)$user['id'], (int)$user['id'], ['match_id'=>$id,'mode'=>'revalida-exam','score'=>$score,'correct'=>$correct]);
    send_json(['result'=>$result]);
}

function revalida_comparison(): array {
    $rows = query("SELECT exam_id, COUNT(*) AS participants, SUM(reached_cutoff) AS reached FROM md_revalida_first WHERE formation = 'brasil' GROUP BY exam_id")->fetchAll();
    return array_map(fn($row) => ['exam'=>$row['exam_id'],'participants'=>(int)$row['participants'],'reached'=>(int)$row['reached']], $rows);
}
