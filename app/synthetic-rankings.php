<?php
declare(strict_types=1);

function apply_synthetic_migration(PDO $db, string $migration, callable $apply): void {
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
        $apply($now);
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }
}

function synthetic_operator_names(): array {
    $given = [
        'Ana', 'João', 'Letícia', 'Bruno', 'Mariana', 'Felipe', 'Isabela',
        'Rafael', 'Camila', 'Lucas', 'Beatriz', 'Gabriel', 'Júlia', 'Pedro',
        'Larissa', 'André', 'Vitória', 'Mateus', 'Carolina', 'Gustavo',
    ];
    $surnames = [
        'Ribeiro', 'Almeida', 'Carvalho', 'Santos', 'Nascimento', 'Mendes',
        'Silva', 'Rocha', 'Pereira', 'Costa', 'Azevedo', 'Barbosa',
    ];
    $names = [];
    for ($offset = 0; $offset < 6; $offset++) {
        foreach ($given as $index => $first) {
            $names[] = $first . ' ' . $surnames[($index + $offset * 2) % count($surnames)];
        }
    }
    return $names;
}

function available_synthetic_nickname(PDOStatement $find, string $name): string {
    $candidate = $name;
    $counter = 1;
    $find->execute([mb_strtolower($candidate, 'UTF-8')]);
    while ($find->fetchColumn()) {
        $suffix = ' ' . ++$counter;
        $candidate = mb_substr($name, 0, 24 - strlen($suffix), 'UTF-8') . $suffix;
        $find->execute([mb_strtolower($candidate, 'UTF-8')]);
    }
    return $candidate;
}

function rename_legacy_synthetic_operators(PDO $db, array $names): void {
    apply_synthetic_migration($db, 'synthetic_brazilian_names_20261124', static function () use ($db, $names): void {
        $first = ['Atlas', 'Bruma', 'Cedro', 'Delta', 'Eixo', 'Faro', 'Gaia', 'Halo', 'Ion', 'Jade', 'Lume', 'Nexo'];
        $second = ['Aster', 'Cobalto', 'Draco', 'Ember', 'Flux', 'Helix', 'Lince', 'Mira', 'Orion', 'Prisma'];
        $legacy = [];
        foreach ($first as $prefix) {
            foreach ($second as $suffix) $legacy[$prefix . $suffix] = count($legacy);
        }

        $findNickname = $db->prepare('SELECT 1 FROM md_users WHERE LOWER(nickname) = ?');
        $rename = $db->prepare('UPDATE md_users SET nickname = ? WHERE id = ?');
        $operators = $db->query('SELECT u.id, u.nickname FROM md_synthetic_users s JOIN md_users u ON u.id = s.user_id')->fetchAll();
        foreach ($operators as $operator) {
            $base = preg_replace('/-[0-9]+$/D', '', $operator['nickname']);
            $index = $legacy[$base] ?? null;
            if ($index === null) continue;
            $nickname = available_synthetic_nickname($findNickname, $names[$index]);
            $rename->execute([$nickname, $operator['id']]);
        }
    });
}

function seed_synthetic_rankings(PDO $db): void {
    $names = synthetic_operator_names();
    apply_synthetic_migration($db, 'synthetic_rankings_20261124', static function (int $now) use ($db, $names): void {
        $specialties = catalog()['specialties'];
        $anesthesia = array_column($specialties, null, 'id')['anestesiologia'];
        $findNickname = $db->prepare('SELECT 1 FROM md_users WHERE LOWER(nickname) = ?');
        $insertUser = $db->prepare('INSERT INTO md_users (nickname,email,password_hash,specialty,status,xp,points,rating,played,answered,correct,created_at,last_seen) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $mark = $db->prepare('INSERT INTO md_synthetic_users (user_id) VALUES (?)');
        $insertMatch = $db->prepare('INSERT INTO md_matches (id,user_id,mode,map_id,questions_json,question_index,score,correct,started_at,issued_at,finished_at,result_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');

        foreach ($names as $index => $nickname) {
            $specialty = $index < 24 ? $anesthesia : $specialties[($index - 24) % count($specialties)];
            $candidate = available_synthetic_nickname($findNickname, $nickname);
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
    });
    rename_legacy_synthetic_operators($db, $names);
}
