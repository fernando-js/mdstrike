<?php
declare(strict_types=1);

function find_challenge(string $id): ?array {
    if (!preg_match('/\A[a-f0-9]{32}\z/', $id)) return null;
    return query('SELECT c.*, u.nickname AS creator_nickname FROM md_challenges c JOIN md_users u ON u.id = c.creator_id WHERE c.id = ?', [$id])->fetch() ?: null;
}

function challenge_record(string $id): array {
    return find_challenge($id) ?? fail('Desafio não encontrado.', 404);
}

function challenge_invite(array $challenge): array {
    $map = $challenge['map_id'];
    $topics = catalog()['areas'] + array_column(catalog()['specialties'], 'name', 'id');
    $title = isset($topics[$map]) ? 'Desafio de ' . $topics[$map] : 'Desafio de Medicina · todas as áreas';
    $total = count(json_decode($challenge['questions_json'], true));
    $expired = time() > (int)$challenge['expires_at'];
    return [
        'title' => $title,
        'description' => $expired
            ? "$total questões. O prazo de participação terminou. Confira o placar."
            : "$total questões, 60 segundos por questão. Jogue no seu horário e compare seus acertos com os colegas.",
        'total' => $total,
        'expired' => $expired,
        'url' => rtrim(configuration()['app_origin'], '/') . '/d/' . $challenge['id'],
    ];
}

function challenge_public(array $challenge, ?array $viewer): array {
    $rows = query('SELECT r.user_id, u.nickname, m.score, m.correct, m.question_index, m.finished_at, m.result_json, (SELECT COALESCE(SUM(a.elapsed), 0) FROM md_answers a WHERE a.match_id = m.id) AS elapsed FROM md_challenge_runs r JOIN md_users u ON u.id = r.user_id JOIN md_matches m ON m.id = r.match_id WHERE r.challenge_id = ? ORDER BY m.correct DESC, m.score DESC, elapsed ASC, m.finished_at ASC, r.id ASC', [$challenge['id']])->fetchAll();
    $scores = [];
    foreach ($rows as $row) {
        $result = $row['result_json'] ? json_decode($row['result_json'], true) : null;
        $status = !$row['finished_at'] ? 'playing' : (!empty($result['aborted']) ? 'aborted' : 'finished');
        // Live and abandoned attempts never reveal answers, partial scores or timings.
        $scores[] = ['nickname'=>$row['nickname'], 'status'=>$status, 'you'=>$viewer && (int)$viewer['id']===(int)$row['user_id'], 'score'=>$status==='finished'?(int)$row['score']:null, 'correct'=>$status==='finished'?(int)$row['correct']:null, 'elapsed'=>$status==='finished'?(int)$row['elapsed']:null];
    }
    usort($scores, function ($a,$b) {
        $priority=['finished'=>0,'playing'=>1,'aborted'=>2];
        return ($priority[$a['status']]<=>$priority[$b['status']]) ?: (($b['correct']??0)<=>($a['correct']??0)) ?: (($b['score']??0)<=>($a['score']??0)) ?: (($a['elapsed']??0)<=>($b['elapsed']??0));
    });
    $position=0; $previous=null;
    foreach ($scores as $i=>&$score) {
        if ($score['status']!=='finished') { $score['position']=null; continue; }
        $key=[$score['correct'],$score['score'],$score['elapsed']];
        if ($key!==$previous) $position=$i+1;
        $score['position']=$position; $previous=$key;
    }
    unset($score);
    $own = $viewer ? query('SELECT m.finished_at, m.result_json FROM md_challenge_runs r JOIN md_matches m ON m.id = r.match_id WHERE r.challenge_id = ? AND r.user_id = ?', [$challenge['id'],$viewer['id']])->fetch() : false;
    $ownResult = $own && $own['result_json'] ? json_decode($own['result_json'],true) : null;
    $mine = !$own ? 'new' : (!$own['finished_at'] ? 'playing' : (!empty($ownResult['aborted'])?'aborted':'finished'));
    return ['id'=>$challenge['id'], 'creator'=>$challenge['creator_nickname'], 'map'=>$challenge['map_id'], 'createdAt'=>(int)$challenge['created_at'], 'expiresAt'=>(int)$challenge['expires_at'], 'mine'=>$mine, 'scores'=>$scores, ...challenge_invite($challenge)];
}

function create_challenge(array $data, array $user): array {
    rate_limit('create-challenge', 15, 3600);
    $map=(string)($data['map']??'all');
    if ($map!=='all' && !in_array($map,array_merge(array_column(catalog()['specialties'],'id'),array_keys(catalog()['areas'])),true)) fail('Mapa inválido.');
    $pool=array_values(array_filter(question_bank(),fn($q)=>$q['kind']==='original' && ($map==='all'||$q['area']===$map||in_array($map,$q['specialties']??[],true))));
    if (count($pool)<3) fail('Escolha um mapa com pelo menos três questões autorais ou uma área mais ampla.');
    shuffle($pool);$items=[];
    foreach (array_slice($pool,0,7) as $q) { $order=range(0,count($q['options'])-1);shuffle($order);$items[]=['id'=>$q['id'],'order'=>$order]; }
    $id=bin2hex(random_bytes(16));
    query('INSERT INTO md_challenges (id, creator_id, map_id, questions_json, created_at, expires_at) VALUES (?,?,?,?,?,?)',[$id,$user['id'],$map,json_encode($items),time(),time()+7*86400]);
    audit_event('challenge.created',(int)$user['id'],(int)$user['id'],['challenge_id'=>$id,'map'=>$map,'questions'=>count($items)]);
    return challenge_public(challenge_record($id),$user);
}

function join_challenge(string $id, array $user): array {
    rate_limit('join-challenge',60,3600);
    $challenge=challenge_record($id);
    if (time()>(int)$challenge['expires_at']) fail('O prazo de sete dias deste desafio terminou.',410);
    $db=database();$db->beginTransaction();
    try {
        $lock=$db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':'';
        // Serialize attempts for the same player, including simultaneous joins in two tabs.
        query('SELECT id FROM md_users WHERE id = ?'.$lock,[$user['id']])->fetch();
        $existing=query('SELECT m.* FROM md_challenge_runs r JOIN md_matches m ON m.id = r.match_id WHERE r.challenge_id = ? AND r.user_id = ?'.$lock,[$id,$user['id']])->fetch();
        if ($existing) {
            if ($existing['finished_at']!==null) { $db->rollBack();fail('Você já usou sua tentativa neste desafio. Confira o placar.',409); }
            $payload=json_decode($existing['questions_json'],true);
            if (!empty($payload['awaitingNext'])) {
                $payload['awaitingNext']=false;$existing['issued_at']=time();
                query('UPDATE md_matches SET issued_at = ?, questions_json = ? WHERE id = ?',[time(),json_encode($payload),$existing['id']]);
            }
            $db->commit();audit_event('challenge.resumed',(int)$user['id'],(int)$user['id'],['challenge_id'=>$id,'match_id'=>$existing['id']]);return match_state($existing,$payload);
        }
        $match=bin2hex(random_bytes(24));
        $payload=['items'=>json_decode($challenge['questions_json'],true),'challengeId'=>$id,'roundsWon'=>0,'roundsLost'=>0,'stageMe'=>0,'stageBot'=>0];
        // Each invitation is independent: opening B must not abort the player's run in A.
        query('INSERT INTO md_matches (id,user_id,mode,map_id,questions_json,started_at,issued_at) VALUES (?,?,?,?,?,?,?)',[$match,$user['id'],'challenge',$challenge['map_id'],json_encode($payload),time(),time()]);
        query('INSERT INTO md_challenge_runs (challenge_id,user_id,match_id) VALUES (?,?,?)',[$id,$user['id'],$match]);
        $row=query('SELECT * FROM md_matches WHERE id = ?',[$match])->fetch();
        $db->commit();audit_event('challenge.joined',(int)$user['id'],(int)$user['id'],['challenge_id'=>$id,'match_id'=>$match]);return match_state($row,$payload);
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack();throw $error; }
}
