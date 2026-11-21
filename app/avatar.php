<?php
declare(strict_types=1);

function avatar_catalog(): array {
    static $catalog;
    return $catalog ??= json_decode(
        file_get_contents(dirname(__DIR__) . '/assets/data/avatar-catalog.json'),
        true,
        512,
        JSON_THROW_ON_ERROR
    );
}

function avatar_selection(array $data, bool $strict = false): array {
    $catalog = avatar_catalog();
    if ($strict && (array_diff_key($data, $catalog) || array_diff_key($catalog, $data))) {
        fail('A seleção do avatar está incompleta ou contém uma categoria inválida.');
    }
    $avatar = [];
    foreach ($catalog as $slot => $category) {
        $item = $data[$slot] ?? null;
        if (!in_array($item, array_column($category['items'], 'id'), true)) {
            if ($strict) fail('Escolha uma peça disponível na categoria ' . $category['label'] . '.');
            $item = $category['default'];
        }
        $avatar[$slot] = $item;
    }
    return $avatar;
}

function avatar_for_user(int $id): array {
    $json = query('SELECT outfit_json FROM md_avatars WHERE user_id = ?', [$id])->fetchColumn();
    $data = $json ? json_decode($json, true) : null;
    return avatar_selection(is_array($data) ? $data : []);
}

function save_avatar(int $id, array $avatar): void {
    $sqlite = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $update = $sqlite
        ? 'ON CONFLICT(user_id) DO UPDATE SET outfit_json = excluded.outfit_json, updated_at = excluded.updated_at'
        : 'ON DUPLICATE KEY UPDATE outfit_json = VALUES(outfit_json), updated_at = VALUES(updated_at)';
    query('INSERT INTO md_avatars (user_id,outfit_json,updated_at) VALUES (?,?,?) ' . $update, [
        $id, json_encode($avatar, JSON_THROW_ON_ERROR), time(),
    ]);
}
