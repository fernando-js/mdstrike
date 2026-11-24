<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/bootstrap.php';
require dirname(__DIR__) . '/app/challenges.php';
require dirname(__DIR__) . '/app/admin.php';
require dirname(__DIR__) . '/app/revalida.php';
require dirname(__DIR__) . '/app/password-reset.php';
require dirname(__DIR__) . '/app/google-auth.php';
header_remove('X-Powered-By');
if (!development()) { ini_set('display_errors', '0'); ini_set('log_errors', '1'); }

function player_payload(array $u): array {
    $id = (int)$u['id'];
    return [
        'user' => public_user($u, true),
        'position' => 1 + (int)query('SELECT COUNT(*) FROM md_users WHERE played > 0 AND (rating > ? OR (rating = ? AND points > ?) OR (rating = ? AND points = ? AND id < ?))', [$u['rating'],$u['rating'],$u['points'],$u['rating'],$u['points'],$id])->fetchColumn(),
        ...operation_progress($id, false),
        'revalida' => operation_progress($id, true),
    ];
}

function register_account(array $data, ?array $google = null): never {
    rate_limit('register', 5, 3600);
    $nickname = trim($data['nickname'] ?? '');
    $email = $google['email'] ?? strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    if (!preg_match('/^[\p{L}\p{N}_.-]{3,24}$/u', $nickname)) fail('Use um nickname de 3 a 24 letras, números, ponto, hífen ou sublinhado.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) fail('Informe um e-mail válido.');
    if (!$google && (strlen($password) < 10 || strlen($password) > 72 || str_contains($password, "\0"))) {
        fail('Use uma senha de 10 a 72 caracteres.');
    }
    if (empty($data['consent'])) fail('Confirme o uso do nickname no ranking público.');
    $specialty = $data['specialty'] ?? '';
    if ($specialty && !in_array($specialty, array_column(catalog()['specialties'], 'id'), true)) fail('Especialidade inválida.');

    $db = database();
    $hash = $google ? '' : password_hash($password, PASSWORD_DEFAULT);
    if ($google) $db->beginTransaction();
    try {
        $now = time();
        query('INSERT INTO md_users (nickname,email,password_hash,specialty,created_at,last_seen) VALUES (?,?,?,?,?,?)', [$nickname, $email, $hash, $specialty, $now, $now]);
        $id = (int)$db->lastInsertId();
        if ($google) {
            query('INSERT INTO md_google_accounts (user_id, google_subject, linked_at) VALUES (?, ?, ?)', [$id, $google['subject'], $now]);
            $db->commit();
        }
    } catch (PDOException $error) {
        if ($db->inTransaction()) $db->rollBack();
        if (in_array((string)$error->getCode(), ['23000', '23505'], true)) fail('Nickname ou e-mail já cadastrado.', 409);
        throw $error;
    }
    $user = query('SELECT * FROM md_users WHERE id = ?', [$id])->fetch();
    begin_auth($user, $google ? 'google' : 'password');
    audit_event('account.registered', $id, $id, $google ? ['method' => 'google'] : []);
    send_json(['user' => public_user($user, true), 'csrf' => $_SESSION['csrf']], 201);
}

function match_state(array $m, array $payload): array {
    $items = $payload['items']; $cursor = (int)$m['question_index'];
    $bank = array_column(match_question_bank($m['map_id']), null, 'id');
    $item = $items[$cursor] ?? null;
    $q = $item ? $bank[$item['id']] : null;
    return [
        'id' => $m['id'], 'mode' => $m['mode'], 'map' => $m['map_id'],
        'index' => $cursor, 'total' => count($items), 'score' => (int)$m['score'],
        'botScore' => (int)$m['bot_score'], 'correct' => (int)$m['correct'],
        'roundsWon' => $payload['roundsWon'] ?? 0, 'roundsLost' => $payload['roundsLost'] ?? 0,
        'stage' => min(2, (int)floor($cursor / 5)),
        'timeLimit' => in_array($m['mode'], ['duel','competitive','cup','challenge'], true) ? 60 : 0,
        'timeRemaining' => max(0,60-(time()-(int)$m['issued_at'])),
        'challengeId' => $payload['challengeId'] ?? null,
        'question' => $q ? question_public($q, $item['order']) : null,
    ];
}

function finish_match(array $m, array $payload): array {
    $mode = $m['mode']; $n = (int)$m['question_index']; $correct = (int)$m['correct'];
    $win = match($mode) {
        'competitive' => ($payload['roundsWon'] ?? 0) > ($payload['roundsLost'] ?? 0),
        'cup' => $n === count($payload['items']) && empty($payload['eliminated']),
        default => (int)$m['score'] > (int)$m['bot_score'],
    };
    $ranked = in_array($mode, ['duel','competitive','cup'], true);
    $delta = $ranked ? ($win ? 20 : -12) : 0;
    $xp = $correct * 20 + ($ranked && $win ? 80 : 10);
    $result = ['win'=>$win,'ranked'=>$ranked,'ratingDelta'=>$delta,'xp'=>$xp,'score'=>(int)$m['score'],'botScore'=>(int)$m['bot_score'],'correct'=>$correct,'answered'=>$n,'total'=>count($payload['items']),'roundsWon'=>$payload['roundsWon'] ?? 0,'roundsLost'=>$payload['roundsLost'] ?? 0,'eliminated'=>$payload['eliminated'] ?? false];
    query('UPDATE md_matches SET finished_at = ?, result_json = ? WHERE id = ?', [time(),json_encode($result),$m['id']]);
    if (!str_starts_with($m['map_id'], 'revalida-')) {
        query('UPDATE md_users SET xp = xp + ?, points = points + ?, rating = CASE WHEN rating + ? < 0 THEN 0 ELSE rating + ? END, played = played + 1, wins = wins + ?, last_seen = ? WHERE id = ?', [$xp,$m['score'],$delta,$delta,($ranked && $win) ? 1 : 0,time(),$m['user_id']]);
    }
    return $result;
}

try {
    guard_request();
    start_session();
    if (($_GET['action'] ?? 'session') !== 'catalog' && (development() || configuration()['db_password'])) {
        rate_limit('api', 600, 60);
        security_maintenance();
    }
    $action = $_GET['action'] ?? 'session';
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET' && $action === 'catalog') send_json(catalog());
    if ($method === 'GET' && $action === 'revalida-comparison') {
        send_json(['editions'=>(development() || configuration()['db_password']) ? revalida_comparison() : []]);
    }
    if ($method === 'GET' && $action === 'session') {
        $configured = development() || (bool)configuration()['db_password'];
        $u = $configured ? current_user() : null;
        if ($u) query('UPDATE md_users SET last_seen = ? WHERE id = ?', [time(),$u['id']]);
        send_json([
            'csrf' => $_SESSION['csrf'],
            'configured' => $configured,
            'passwordResetAvailable' => $configured && password_reset_ready(),
            'googleAuthAvailable' => $configured && google_auth_ready(configuration()),
            'googleSignupEmail' => $configured && !$u ? (pending_google_signup()['email'] ?? null) : null,
            'adminConfigured' => $configured && (bool)query('SELECT COUNT(*) FROM md_admins')->fetchColumn(),
            'user' => $u ? public_user($u, true) : null,
        ]);
    }
    if (str_starts_with($action,'admin-')) {
        $operator=require_admin();
        if($method!=='GET')fail('O painel permite consultas por GET.',405);
        send_json(admin_dispatch($action,$_GET,$operator));
    }
    if ($method === 'GET' && $action === 'profile') send_json(player_payload(require_user()));
    if ($method === 'GET' && $action === 'challenge') send_json(challenge_public(challenge_record((string)($_GET['id']??'')),current_user()));
    if ($method === 'GET' && $action === 'my-challenges') {
        $u=require_user();
        $rows=query('SELECT c.*, u.nickname AS creator_nickname FROM md_challenges c JOIN md_users u ON u.id = c.creator_id WHERE c.creator_id = ? OR c.id IN (SELECT challenge_id FROM md_challenge_runs WHERE user_id = ?) ORDER BY c.created_at DESC LIMIT 20',[$u['id'],$u['id']])->fetchAll();
        send_json(['challenges'=>array_map(fn($c)=>challenge_public($c,$u),$rows)]);
    }
    if ($method === 'GET' && $action === 'leaderboard') {
        $map = substr((string)($_GET['map'] ?? ''),0,90);
        $specialty = substr((string)($_GET['specialty'] ?? ''),0,90);
        $rows = $map !== ''
            ? query('SELECT u.id, u.nickname, u.specialty, u.rating, SUM(m.score) AS points, COUNT(*) AS played FROM md_users u JOIN md_matches m ON m.user_id = u.id WHERE ' . completed_match_filter() . " AND m.map_id NOT LIKE 'revalida-%' AND m.map_id = ? GROUP BY u.id,u.nickname,u.specialty,u.rating ORDER BY points DESC, u.id ASC LIMIT 100", [$map])->fetchAll()
            : ($specialty !== ''
                ? query('SELECT id,nickname,specialty,rating,points,played FROM md_users WHERE played > 0 AND specialty = ? ORDER BY rating DESC,points DESC,id ASC LIMIT 100',[$specialty])->fetchAll()
                : query('SELECT id,nickname,specialty,rating,points,played FROM md_users WHERE played > 0 ORDER BY rating DESC,points DESC,id ASC LIMIT 100')->fetchAll());
        foreach ($rows as &$row) { foreach (['id','rating','points','played'] as $key) $row[$key]=(int)$row[$key]; $row['rank']=rank_name($row['rating']); }
        send_json(['rows'=>$rows,'scope'=>$map ?: ($specialty ?: 'global')]);
    }
    if ($method !== 'POST') fail('Rota não encontrada.',404);
    require_csrf(); $data = input();
    if ($action === 'request-password-reset') request_password_reset($data);
    if ($action === 'reset-password') reset_password($data);
    if ($action === 'google-start') start_google_auth($data);
    if ($action === 'google-register') {
        $google = pending_google_signup();
        if (!$google || current_user()) fail('Seu cadastro com Google expirou. Entre com Google novamente.', 409);
        register_account($data, $google);
    }
    if ($action === 'register') register_account($data);
    if ($action === 'login') {
        rate_limit('login',12,900);
        $identity = strtolower(trim((string)($data['identity'] ?? '')));
        $u = query('SELECT u.* FROM md_users u LEFT JOIN md_synthetic_users s ON s.user_id = u.id WHERE (u.email = ? OR LOWER(u.nickname) = ?) AND s.user_id IS NULL',[$identity,$identity])->fetch();
        $loginSubject = $u ? 'user:' . $u['id'] : 'identity:' . $identity;
        rate_limit('login-account', 20, 900, $loginSubject);
        // Always perform a password hash check, including unknown accounts.
        $hash = $u['password_hash'] ?? '';
        $valid = password_verify($data['password'] ?? '', $hash ?: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        if (!$hash || !$valid) { audit_event('auth.login_failed',null,$u?(int)$u['id']:null);fail('E-mail, nickname ou senha incorretos.',401); }
        if (password_needs_rehash($u['password_hash'],PASSWORD_DEFAULT)) {
            $u['password_hash']=password_hash($data['password'],PASSWORD_DEFAULT);
            query('UPDATE md_users SET password_hash = ? WHERE id = ?',[$u['password_hash'],$u['id']]);
        }
        query('DELETE FROM md_auth_limits WHERE bucket = ?', [limit_key('login-account', $loginSubject)]);
        begin_auth($u); audit_event('auth.login',(int)$u['id'],(int)$u['id']);send_json(['user'=>public_user($u,true),'csrf'=>$_SESSION['csrf']]);
    }
    if ($action === 'logout') {
        $loggingOut=current_user();if($loggingOut)audit_event('auth.logout',(int)$loggingOut['id'],(int)$loggingOut['id']);
        $_SESSION=[]; session_regenerate_id(true); $_SESSION['csrf']=bin2hex(random_bytes(32));
        send_json(['csrf'=>$_SESSION['csrf']]);
    }
    $user = require_user();
    rate_limit('write-user', 180, 60, 'user:' . $user['id']);
    if (in_array($action, ['revalida-mark', 'revalida-submit'], true)) revalida_simulation_write($action, $data, $user);
    if ($action === 'create-challenge') send_json(create_challenge($data,$user),201);
    if ($action === 'join-challenge') send_json(join_challenge((string)($data['challenge']??''),$user));
    if ($action === 'save-avatar') {
        $avatar = avatar_selection($data, true);
        save_avatar((int)$user['id'], $avatar);
        audit_event('avatar.updated', (int)$user['id'], (int)$user['id']);
        send_json(['avatar'=>$avatar]);
    }
    if ($action === 'update-profile') {
        $nick = trim((string)($data['nickname'] ?? $user['nickname']));
        $specialty = (string)($data['specialty'] ?? '');
        $status = (string)($data['status'] ?? 'available');
        if (!preg_match('/^[\p{L}\p{N}_.-]{3,24}$/u',$nick)) fail('Nickname inválido.');
        if (!in_array($status,['available','studying','away'],true)) fail('Status inválido.');
        if ($specialty && !in_array($specialty,array_column(catalog()['specialties'],'id'),true)) fail('Especialidade inválida.');
        $keepEducation = ($data['educationStatus'] ?? '') === 'keep';
        $hasEducation = array_key_exists('educationStatus', $data) && !$keepEducation;
        $education = $hasEducation ? education_input($data) : null;
        $institution = $keepEducation ? $user['institution'] : ($hasEducation ? ($education['institution'] ?? '') : trim((string)($data['institution'] ?? '')));
        $db=database(); $db->beginTransaction();
        try {
            query('UPDATE md_users SET nickname = ?, specialty = ?, institution = ?, status = ? WHERE id = ?',[$nick,$specialty,mb_substr($institution,0,100),$status,$user['id']]);
            if ($hasEducation) save_education((int)$user['id'], $education);
            $db->commit();
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            if ((string)$e->getCode()==='23000') fail('Esse nickname já está em uso.',409); throw $e;
        }
        audit_event('profile.updated',(int)$user['id'],(int)$user['id'],['fields'=>['nickname','specialty','institution','status',...($hasEducation?['education']:[])]]);
        send_json(player_payload(require_user()));
    }
    if ($action === 'change-password') {
        rate_limit('change-password',8,900);
        if (!password_verify((string)($data['currentPassword'] ?? ''),$user['password_hash'])) fail('Senha atual incorreta.',401);
        $password = (string)($data['password'] ?? '');
        if (strlen($password)<10 || strlen($password)>72) fail('Use uma senha de 10 a 72 caracteres.');
        query('UPDATE md_users SET password_hash = ?, password_changed_at = ? WHERE id = ?',[password_hash($password,PASSWORD_DEFAULT),time(),$user['id']]);
        $updated = query('SELECT * FROM md_users WHERE id = ?',[$user['id']])->fetch();
        audit_event('auth.password_changed',(int)$user['id'],(int)$user['id']);
        begin_auth($updated); send_json(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if ($action === 'start-match') {
        rate_limit('start-match',60,3600);
        $mode = (string)($data['mode'] ?? 'practice');
        $map = (string)($data['map'] ?? 'all');
        $exam = (string)($data['exam'] ?? '');
        if (!in_array($mode,['practice','duel','competitive','cup','exam','review','revalida-exam'],true)) fail('Modo inválido.');
        $revalida = revalida_map($map);
        $simulation = $mode === 'revalida-exam';
        if (!$revalida && $map !== 'all' && !in_array($map,array_merge(array_column(catalog()['specialties'],'id'),array_keys(catalog()['areas'])),true)) fail('Mapa inválido.');
        if ($simulation && ($map !== 'revalida-geral' || !($edition = revalida_exam($exam)))) fail('Escolha uma edição do Revalida.');
        if ($revalida && !$simulation && ($exam !== '' || !in_array($mode,['practice','review'],true))) fail('Modo indisponível na Operação Revalida.');
        if (!$revalida && $exam !== '' && !exam_definition($exam)) fail('Caderno inválido.');
        $formation = $data['formation'] ?? '';
        if (!in_array($formation, ['', 'brasil', 'exterior'], true)) fail('Escolha uma opção de formação válida.');
        $pool = array_values(array_filter(question_bank(), static function ($q) use ($revalida, $exam, $mode, $map) {
            if ($q['answer'] === null || (($q['operation'] ?? '') === 'revalida') !== (bool)$revalida) return false;
            if ($exam !== '' && ($q['exam'] ?? '') !== $exam) return false;
            if ($revalida) return $revalida['area'] === '' || $q['area'] === $revalida['area'];
            if ($exam === '' && $mode !== 'review' && $q['kind'] !== 'original') return false;
            return $map === 'all' || $q['area'] === $map || in_array($map,$q['specialties'] ?? [],true);
        }));
        if ($mode === 'review') {
            $wrong = array_flip(operation_progress((int)$user['id'], (bool)$revalida)['wrong']);
            $pool = array_values(array_filter($pool, fn($q) => isset($wrong[$q['id']])));
        }
        if (!$pool) fail($mode==='review'?'Você não tem erros pendentes nesta seleção.':'Este mapa ainda não tem questões disponíveis.');
        if ($mode==='exam' && $exam==='') fail('Escolha um caderno oficial para o simulado.');
        if ($mode==='exam' || $simulation) usort($pool,fn($a,$b)=>$a['number']<=>$b['number']); else shuffle($pool);
        $count = match($mode) { 'duel'=>7,'competitive'=>9,'cup'=>15,'exam','revalida-exam'=>count($pool),default=>10 };
        if (in_array($mode,['duel','competitive','cup'],true) && count($pool)<$count) fail('Este modo precisa de pelo menos '.$count.' questões diferentes. Escolha uma área maior.');
        $selected = array_slice($pool,0,$count);
        $items=[];
        foreach ($selected as $q) { $order=range(0,count($q['options'])-1); if ($q['kind']==='original') shuffle($order); $items[]=['id'=>$q['id'],'order'=>$order]; }
        $id=bin2hex(random_bytes(24));
        $payload=['items'=>$items,'roundsWon'=>0,'roundsLost'=>0,'stageMe'=>0,'stageBot'=>0];
        $db = database();
        $db->beginTransaction();
        $mysql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
        if ($simulation) {
            if ($mysql) query('SELECT id FROM md_users WHERE id = ? FOR UPDATE', [$user['id']])->fetch();
            $active = query("SELECT * FROM md_matches WHERE user_id = ? AND exam_id = ? AND mode = 'revalida-exam' AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1" . ($mysql ? ' FOR UPDATE' : ''), [$user['id'],$exam])->fetch();
            if ($active) {
                $db->commit();
                send_json(revalida_attempt($active,$edition));
            }
            $payload += [
                'duration'=>$edition['durationMinutes'] * 60,
                'cutoff'=>$edition['cutoff'] ?? null,
                'cancelledCredit'=>($edition['creditCancelled'] ?? false) ? count($edition['cancelled']) : 0,
                'maximum'=>($edition['creditCancelled'] ?? false) ? $edition['total'] : $edition['valid'],
                'formation'=>isset($edition['cutoff']) ? $formation : '',
                'choices'=>[],
            ];
        } else {
            // Each operation has one active round-based match; simulations and invitations can be resumed.
            $scope = $revalida ? "LIKE 'revalida-%'" : "NOT LIKE 'revalida-%'";
            query("UPDATE md_matches SET finished_at = ?, result_json = ? WHERE user_id = ? AND finished_at IS NULL AND mode NOT IN ('challenge','revalida-exam') AND map_id $scope", [time(),json_encode(['aborted'=>true]),$user['id']]);
        }
        query('INSERT INTO md_matches (id,user_id,mode,map_id,exam_id,questions_json,started_at,issued_at) VALUES (?,?,?,?,?,?,?,?)',[$id,$user['id'],$mode,$map,$exam,json_encode($payload),time(),time()]);
        $m=query('SELECT * FROM md_matches WHERE id = ?',[$id])->fetch();
        $db->commit();
        audit_event('match.started',(int)$user['id'],(int)$user['id'],['match_id'=>$id,'mode'=>$mode,'map'=>$map,'exam'=>$exam]);
        if ($simulation) send_json(revalida_attempt($m,$edition));
        send_json(match_state($m,$payload));
    }
    if ($action === 'answer') {
        $db=database(); $db->beginTransaction();
        $lock=$db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':'';
        $m=query('SELECT * FROM md_matches WHERE id = ? AND user_id = ?'.$lock,[(string)($data['match'] ?? ''),$user['id']])->fetch();
        if (!$m || $m['finished_at']!==null || $m['mode']==='revalida-exam') { $db->rollBack(); fail('Partida encerrada ou não encontrada.',409); }
        $payload=json_decode($m['questions_json'],true,512,JSON_THROW_ON_ERROR);
        if (!empty($payload['awaitingNext'])) { $db->rollBack(); fail('Pressione Continuar para iniciar a próxima questão.',409); }
        $item=$payload['items'][(int)$m['question_index']] ?? null;
        if (!$item || $item['id']!==($data['question'] ?? '')) { $db->rollBack(); fail('Questão fora de ordem. Atualize a partida.',409); }
        $bank=array_column(match_question_bank($m['map_id']),null,'id'); $q=$bank[$item['id']];
        $choice=$data['choice'] ?? -1;
        if (!is_int($choice) || $choice < -1 || $choice >= count($q['options'])) { $db->rollBack(); fail('Alternativa inválida.'); }
        $elapsed=max(0,time()-(int)$m['issued_at']);
        $timed=in_array($m['mode'],['duel','competitive','cup','challenge'],true);
        if ($timed && $elapsed>65) $choice=-1;
        $correct=$choice>=0 && $item['order'][$choice]===$q['answer'];
        $headshot=$correct && $timed && $elapsed<18;
        $points=$correct ? 100 + ($timed?max(0,50-(int)round($elapsed*50/60)):0) : 0;
        $botPoints=$timed && $m['mode']!=='challenge' && random_int(1,100)<=60 ? random_int(105,145):0;
        $m['score']=(int)$m['score']+$points; $m['bot_score']=(int)$m['bot_score']+$botPoints;
        $m['correct']=(int)$m['correct']+($correct?1:0); $m['question_index']=(int)$m['question_index']+1;
        if ($m['mode']==='competitive') {
            $allies=0; $enemies=0;
            for($i=0;$i<4;$i++) $allies+=random_int(0,1);
            for($i=0;$i<5;$i++) $enemies+=random_int(0,1);
            $team=$allies+($correct?2:0); $won=$team>$enemies || ($team===$enemies && $correct);
            $payload[$won?'roundsWon':'roundsLost']++;
        }
        if ($m['mode']==='cup') {
            $payload['stageMe']+=$points; $payload['stageBot']+=$botPoints;
            if ($m['question_index']%5===0) {
                if ($payload['stageMe']<=$payload['stageBot']) $payload['eliminated']=true;
                $payload['stageMe']=0; $payload['stageBot']=0;
            }
        }
        query('INSERT INTO md_answers (match_id,user_id,question_id,area,map_id,choice,correct,points,elapsed,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',[$m['id'],$user['id'],$q['id'],$q['area'],$m['map_id'],$choice,$correct?1:0,$points,$elapsed,time()]);
        query('UPDATE md_matches SET question_index = ?, score = ?, correct = ?, bot_score = ?, questions_json = ? WHERE id = ?',[$m['question_index'],$m['score'],$m['correct'],$m['bot_score'],json_encode($payload),$m['id']]);
        if (!str_starts_with($m['map_id'], 'revalida-')) {
            query('UPDATE md_users SET answered = answered + 1, correct = correct + ? WHERE id = ?',[$correct?1:0,$user['id']]);
        }
        $finished=$m['question_index']>=count($payload['items']) || !empty($payload['eliminated']) || $payload['roundsWon']>=5 || $payload['roundsLost']>=5;
        // The next question clock starts only when the player presses Continue.
        $payload['awaitingNext']=!$finished;
        query('UPDATE md_matches SET questions_json = ? WHERE id = ?',[json_encode($payload),$m['id']]);
        $result=$finished?finish_match($m,$payload):null;
        $db->commit();
        audit_event('answer.submitted',(int)$user['id'],(int)$user['id'],['match_id'=>$m['id'],'question_id'=>$q['id'],'choice'=>$choice,'correct'=>$correct,'points'=>$points,'elapsed'=>$elapsed]);
        if($result)audit_event('match.finished',(int)$user['id'],(int)$user['id'],['match_id'=>$m['id'],'mode'=>$m['mode'],'score'=>$result['score'],'correct'=>$result['correct'],'xp'=>$result['xp'],'rating_delta'=>$result['ratingDelta']]);
        send_json(['correct'=>$correct,'answer'=>array_search($q['answer'],$item['order'],true),'explanation'=>$q['explanation'],'points'=>$points,'headshot'=>$headshot,'botPoints'=>$botPoints,'state'=>array_diff_key(match_state($m,$payload),['question'=>true]),'result'=>$result]);
    }
    if ($action === 'next-question') {
        $db=database(); $db->beginTransaction();
        $lock=$db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':'';
        $m=query('SELECT * FROM md_matches WHERE id = ? AND user_id = ?'.$lock,[(string)($data['match'] ?? ''),$user['id']])->fetch();
        if (!$m || $m['finished_at']!==null || $m['mode']==='revalida-exam') { $db->rollBack(); fail('Partida encerrada.',409); }
        $payload=json_decode($m['questions_json'],true);
        if (!empty($payload['awaitingNext'])) {
            $payload['awaitingNext']=false; $m['issued_at']=time();
            query('UPDATE md_matches SET issued_at = ?, questions_json = ? WHERE id = ?',[$m['issued_at'],json_encode($payload),$m['id']]);
        }
        $db->commit(); send_json(match_state($m,$payload));
    }
    if ($action === 'abort-match') {
        $aborted=query("UPDATE md_matches SET finished_at = ?, result_json = ?, questions_json = CASE WHEN mode = 'revalida-exam' THEN JSON_REMOVE(questions_json, '$.formation') ELSE questions_json END WHERE id = ? AND user_id = ? AND finished_at IS NULL",[time(),json_encode(['aborted'=>true]),(string)($data['match'] ?? ''),$user['id']]);
        if($aborted->rowCount())audit_event('match.aborted',(int)$user['id'],(int)$user['id'],['match_id'=>(string)$data['match']]);
        send_json(['ok'=>true]);
    }
    fail('Rota não encontrada.',404);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('MD Strike API: '.get_class($error).' '.($error instanceof PDOException ? 'database error' : $error->getMessage()));
    if($error->getMessage()!=='database_not_configured')audit_event('api.error',isset($_SESSION['user_id'])?(int)$_SESSION['user_id']:null,null,['action'=>substr((string)($action??''),0,80),'type'=>get_class($error),'code'=>(string)$error->getCode()]);
    send_json(['error'=>'Não foi possível concluir. Verifique a conexão e tente novamente.','code'=>($error->getMessage()==='database_not_configured'?'setup_required':'server_error')],503);
}
