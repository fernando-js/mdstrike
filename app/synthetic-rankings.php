<?php
declare(strict_types=1);

function seed_synthetic_rankings(PDO $db): void {
    $migration = 'synthetic_rankings_20261124';
    $applied = $db->prepare('SELECT 1 FROM md_migrations WHERE name = ?');
    $applied->execute([$migration]);
    if ($applied->fetchColumn()) return;

    $sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $claim = $db->prepare(($sqlite ? 'INSERT OR IGNORE' : 'INSERT IGNORE') . ' INTO md_migrations (name, applied_at) VALUES (?, ?)');
    $db->beginTransaction();
    try {
        $now = time();
        $claim->execute([$migration, $now]);
        if (!$claim->rowCount()) {
            $db->rollBack();
            return;
        }

        $specialties = catalog()['specialties'];
        $anesthesia = array_column($specialties, null, 'id')['anestesiologia'];
        $first = ['Atlas', 'Bruma', 'Cedro', 'Delta', 'Eixo', 'Faro', 'Gaia', 'Halo', 'Ion', 'Jade', 'Lume', 'Nexo'];
        $second = ['Aster', 'Cobalto', 'Draco', 'Ember', 'Flux', 'Helix', 'Lince', 'Mira', 'Orion', 'Prisma'];
        $findNickname = $db->prepare('SELECT 1 FROM md_users WHERE LOWER(nickname) = ?');
        $insertUser = $db->prepare('INSERT INTO md_users (nickname,email,password_hash,specialty,status,xp,points,rating,played,answered,correct,created_at,last_seen) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $mark = $db->prepare('INSERT INTO md_synthetic_users (user_id) VALUES (?)');
        $insertMatch = $db->prepare('INSERT INTO md_matches (id,user_id,mode,map_id,questions_json,question_index,score,correct,started_at,issued_at,finished_at,result_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');

        foreach ($first as $row => $prefix) {
            foreach ($second as $col => $suffix) {
                $index = $row * count($second) + $col;
                $specialty = $index < 24 ? $anesthesia : $specialties[($index - 24) % count($specialties)];
                $nickname = $prefix . $suffix;
                $candidate = $nickname;
                $counter = 1;
                $findNickname->execute([strtolower($candidate)]);
                while ($findNickname->fetchColumn()) {
                    $candidate = $nickname . '-' . ++$counter;
                    $findNickname->execute([strtolower($candidate)]);
                }
                $played = 4 + ($index * 7) % 10;
                $created = $now - (10 + $index % 30) * 86400;
                $rounds = [];
                $correct = 0;
                $maps = ['all', $specialty['id'], $specialty['area']];
                if ($specialty['id'] === 'anestesiologia') $maps[] = 'tea';
                for ($game = 0; $game < $played; $game++) {
                    $hits = 3 + ($index * 3 + $game * 5 + intdiv($index, 8)) % 7;
                    $correct += $hits;
                    $rounds[] = [$maps[$game % count($maps)], $hits, $created + $game * 7200];
                }
                $insertUser->execute([
                    $candidate, 'treino-' . bin2hex(random_bytes(12)) . '@mdstrike.invalid', '',
                    $specialty['id'], 'away', $correct * 20 + $played * 10,
                    $correct * 100, 880 + ($index * 17) % 351, $played, $played * 10,
                    $correct, $created, 0,
                ]);
                $id = (int)$db->lastInsertId();
                $mark->execute([$id]);
                foreach ($rounds as [$map, $hits, $start]) {
                    $result = [
                        'win' => $hits > 0, 'ranked' => false, 'ratingDelta' => 0,
                        'xp' => $hits * 20 + 10, 'score' => $hits * 100, 'botScore' => 0,
                        'correct' => $hits, 'answered' => 10, 'total' => 10,
                    ];
                    $insertMatch->execute([
                        bin2hex(random_bytes(24)), $id, 'practice', $map, '{"items":[]}',
                        10, $result['score'], $hits, $start, $start, $start + 300,
                        json_encode($result, JSON_THROW_ON_ERROR),
                    ]);
                }
            }
        }
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }
}
