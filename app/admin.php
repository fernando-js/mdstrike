<?php
declare(strict_types=1);

function admin_page(array $params): array {
    $size=in_array((int)($params['size']??25),[10,25,50,100],true)?(int)($params['size']??25):25;
    $page=max(1,min(100000,(int)($params['page']??1)));
    return [$page,$size,($page-1)*$size];
}

function admin_date_conditions(array $params, string $column, array &$where, array &$bindings): void {
    foreach (['from','to'] as $key) {
        $date=trim((string)($params[$key]??''));if($date==='')continue;
        $value=DateTimeImmutable::createFromFormat('!Y-m-d',$date,new DateTimeZone('America/Sao_Paulo'));
        if (!$value || $value->format('Y-m-d')!==$date) fail('Data inválida.');
        if($key==='to')$value=$value->modify('+1 day');
        $where[]=$column.($key==='from'?' >= ?':' < ?');$bindings[]=$value->getTimestamp();
    }
}

function admin_rows(string $from, string $select, array $where, array $bindings, string $order, array $params): array {
    [$page,$size,$offset]=admin_page($params);
    $condition=$where?' WHERE '.implode(' AND ',$where):'';
    $total=(int)query('SELECT COUNT(*) '.$from.$condition,$bindings)->fetchColumn();
    $rows=query('SELECT '.$select.' '.$from.$condition.' ORDER BY '.$order.' LIMIT '.$size.' OFFSET '.$offset,$bindings)->fetchAll();
    return ['rows'=>$rows,'page'=>$page,'size'=>$size,'total'=>$total,'pages'=>max(1,(int)ceil($total/$size))];
}

function admin_match(array $row): array {
    $result=$row['result_json']?json_decode($row['result_json'],true):null;
    $row['state']=!$row['finished_at']?'playing':(!empty($result['aborted'])?'aborted':'finished');
    foreach (['score','correct','question_index','started_at','issued_at','user_id'] as $key) if(isset($row[$key]))$row[$key]=(int)$row[$key];
    $row['finished_at']=$row['finished_at']!==null?(int)$row['finished_at']:null;
    unset($row['result_json']);
    return $row;
}

function admin_dispatch(string $action, array $params, array $operator): array {
    $operatorId=(int)$operator['id'];
    if($action==='admin-overview'){
        $since=time()-7*86400;
        $summary=[
            'users'=>(int)query('SELECT COUNT(*) FROM md_users')->fetchColumn(),
            'active7d'=>(int)query('SELECT COUNT(*) FROM md_users WHERE last_seen >= ?',[$since])->fetchColumn(),
            'matches'=>(int)query('SELECT COUNT(*) FROM md_matches WHERE finished_at IS NOT NULL AND result_json <> ?',[json_encode(['aborted'=>true])])->fetchColumn(),
            'challenges'=>(int)query('SELECT COUNT(*) FROM md_challenges')->fetchColumn(),
            'answers'=>(int)query('SELECT COUNT(*) FROM md_answers')->fetchColumn(),
            'correct'=>(int)query('SELECT COALESCE(SUM(correct),0) FROM md_answers')->fetchColumn(),
            'errors7d'=>(int)query('SELECT COUNT(*) FROM md_audit_logs WHERE event = ? AND created_at >= ?',['api.error',$since])->fetchColumn(),
            'startedAt'=>(int)query('SELECT COALESCE(MIN(created_at),0) FROM md_audit_logs')->fetchColumn(),
        ];
        $recent=query('SELECT a.id,a.event,a.actor_id,a.subject_id,a.metadata_json,a.created_at,u.nickname AS actor_nickname,s.nickname AS subject_nickname FROM md_audit_logs a LEFT JOIN md_users u ON u.id = a.actor_id LEFT JOIN md_users s ON s.id = a.subject_id ORDER BY a.id DESC LIMIT 12')->fetchAll();
        audit_event('admin.viewed',$operatorId,null,['section'=>'overview']);
        return ['summary'=>$summary,'recent'=>$recent];
    }
    if($action==='admin-users'){
        $where=[];$bindings=[];$search=mb_substr(trim((string)($params['search']??'')),0,100);
        if($search!==''){$where[]='(u.nickname LIKE ? OR u.email LIKE ? OR u.institution LIKE ?)';array_push($bindings,'%'.$search.'%','%'.$search.'%','%'.$search.'%');}
        if(($params['status']??'')!==''){
            if(!in_array($params['status'],['available','studying','away'],true))fail('Status inválido.');
            $where[]='u.status = ?';$bindings[]=$params['status'];
        }
        admin_date_conditions($params,'u.created_at',$where,$bindings);
        $response=admin_rows('FROM md_users u LEFT JOIN md_admins ad ON ad.user_id = u.id','u.id,u.nickname,u.email,u.specialty,u.institution,u.status,u.xp,u.points,u.rating,u.played,u.correct,u.answered,u.created_at,u.last_seen,ad.granted_at AS admin_since',$where,$bindings,'u.id DESC',$params);
        audit_event('admin.viewed',$operatorId,null,['section'=>'users','page'=>$response['page']]);return $response;
    }
    if($action==='admin-user'){
        $id=(int)($params['id']??0);if($id<1)fail('Usuário inválido.');
        $user=query('SELECT id,nickname,email,specialty,institution,status,xp,points,rating,played,wins,answered,correct,created_at,last_seen FROM md_users WHERE id = ?',[$id])->fetch();
        if(!$user)fail('Usuário não encontrado.',404);
        $user['isAdmin']=is_admin($user);
        $stats=query('SELECT area,COUNT(*) AS answered,SUM(correct) AS correct FROM md_answers WHERE user_id = ? GROUP BY area',[$id])->fetchAll();
        $matches=query('SELECT id,user_id,mode,map_id,score,correct,question_index,started_at,issued_at,finished_at,result_json FROM md_matches WHERE user_id = ? ORDER BY started_at DESC LIMIT 30',[$id])->fetchAll();
        $answers=query('SELECT question_id,area,match_id,choice,correct,points,elapsed,created_at FROM md_answers WHERE user_id = ? ORDER BY id DESC LIMIT 50',[$id])->fetchAll();
        audit_event('admin.viewed',$operatorId,$id,['section'=>'user']);
        return ['user'=>$user,'stats'=>$stats,'matches'=>array_map('admin_match',$matches),'answers'=>$answers];
    }
    if($action==='admin-matches'){
        $where=[];$bindings=[];
        $search=mb_substr(trim((string)($params['search']??'')),0,100);
        if($search!==''){$where[]='(u.nickname LIKE ? OR u.email LIKE ? OR m.id LIKE ?)';array_push($bindings,'%'.$search.'%','%'.$search.'%','%'.$search.'%');}
        if((int)($params['user']??0)>0){$where[]='m.user_id = ?';$bindings[]=(int)$params['user'];}
        if(($params['mode']??'')!==''){
            if(!in_array($params['mode'],['practice','duel','competitive','cup','exam','review','challenge'],true))fail('Modo inválido.');
            $where[]='m.mode = ?';$bindings[]=$params['mode'];
        }
        admin_date_conditions($params,'m.started_at',$where,$bindings);
        $response=admin_rows('FROM md_matches m JOIN md_users u ON u.id = m.user_id','m.id,m.user_id,u.nickname,m.mode,m.map_id,m.score,m.correct,m.question_index,m.started_at,m.issued_at,m.finished_at,m.result_json',$where,$bindings,'m.started_at DESC,m.id DESC',$params);
        $response['rows']=array_map('admin_match',$response['rows']);
        audit_event('admin.viewed',$operatorId,null,['section'=>'matches','page'=>$response['page']]);return $response;
    }
    if($action==='admin-challenges'){
        $where=[];$bindings=[];$search=mb_substr(trim((string)($params['search']??'')),0,100);
        if($search!==''){$where[]='(u.nickname LIKE ? OR c.id LIKE ? OR c.map_id LIKE ?)';array_push($bindings,'%'.$search.'%','%'.$search.'%','%'.$search.'%');}
        admin_date_conditions($params,'c.created_at',$where,$bindings);
        $response=admin_rows('FROM md_challenges c JOIN md_users u ON u.id = c.creator_id','c.id,c.creator_id,u.nickname,c.map_id,c.created_at,c.expires_at,(SELECT COUNT(*) FROM md_challenge_runs r WHERE r.challenge_id=c.id) AS participants',$where,$bindings,'c.created_at DESC,c.id DESC',$params);
        audit_event('admin.viewed',$operatorId,null,['section'=>'challenges','page'=>$response['page']]);return $response;
    }
    if($action==='admin-logs'){
        $where=[];$bindings=[];
        $search=mb_substr(trim((string)($params['search']??'')),0,100);
        if($search!==''){$where[]='(u.nickname LIKE ? OR s.nickname LIKE ? OR a.event LIKE ? OR a.request_id = ?)';array_push($bindings,'%'.$search.'%','%'.$search.'%','%'.$search.'%',$search);}
        if(($params['event']??'')!==''){$where[]='a.event = ?';$bindings[]=substr((string)$params['event'],0,80);}
        if((int)($params['user']??0)>0){$where[]='(a.actor_id = ? OR a.subject_id = ?)';array_push($bindings,(int)$params['user'],(int)$params['user']);}
        admin_date_conditions($params,'a.created_at',$where,$bindings);
        $response=admin_rows('FROM md_audit_logs a LEFT JOIN md_users u ON u.id = a.actor_id LEFT JOIN md_users s ON s.id = a.subject_id','a.id,a.event,a.actor_id,a.subject_id,a.metadata_json,a.client_ip,a.user_agent,a.request_id,a.created_at,u.nickname AS actor_nickname,s.nickname AS subject_nickname',$where,$bindings,'a.id DESC',$params);
        audit_event('admin.viewed',$operatorId,null,['section'=>'logs','page'=>$response['page']]);return $response;
    }
    fail('Consulta administrativa não encontrada.',404);
}
