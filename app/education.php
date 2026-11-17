<?php
declare(strict_types=1);

function institution_catalog(): array {
    static $catalog;
    return $catalog ??= json_decode(file_get_contents(__DIR__ . '/institutions.json'), true, 512, JSON_THROW_ON_ERROR);
}

function education_for_user(int $id): ?array {
    $row = query('SELECT education_status,selection_mode,institution_id,institution_name,state,municipality_id,municipality_name,source_version FROM md_education WHERE user_id = ?', [$id])->fetch();
    if (!$row) return null;
    return ['status'=>$row['education_status'],'mode'=>$row['selection_mode'],'institutionId'=>$row['institution_id'],'institution'=>$row['institution_name'],'state'=>$row['state'],'municipalityId'=>$row['municipality_id'],'municipality'=>$row['municipality_name'],'sourceVersion'=>$row['source_version']];
}

function education_input(array $data): ?array {
    $status = $data['educationStatus'] ?? '';
    if ($status === '') return null;
    if (!in_array($status, ['studying','graduated'], true)) fail('Vínculo acadêmico inválido.');
    $mode = $data['educationMode'] ?? 'listed';
    if (!in_array($mode, ['listed','manual'], true)) fail('Seleção de faculdade inválida.');
    $uf = (string)($data['educationState'] ?? ''); $cityId = (string)($data['educationMunicipality'] ?? '');
    $id = (string)($data['educationInstitution'] ?? '');
    $catalog = institution_catalog(); $city = null;
    if ($uf !== '') {
        $states = array_column($catalog['states'], null, 'id');
        if (!isset($states[$uf])) fail('Estado inválido.');
        $cities = array_column($states[$uf]['cities'], null, 'id');
        if ($cityId !== '' && !isset($cities[$cityId])) fail('Município inválido para o estado selecionado.');
        $city = $cities[$cityId] ?? null;
    } elseif ($cityId !== '') fail('Selecione o estado do município.');
    if ($mode === 'listed') {
        if (!$city || !in_array($id, $city['institutions'], true) || !isset($catalog['institutions'][$id])) fail('Selecione uma faculdade da lista desse estado e município ou informe manualmente.');
        $name = $catalog['institutions'][$id]['name'];
    } else {
        $name = trim((string)($data['institution'] ?? '')); $id = '';
        if (mb_strlen($name) < 2 || mb_strlen($name) > 255) fail('Informe o nome da faculdade com 2 a 255 caracteres.');
    }
    return ['status'=>$status,'mode'=>$mode,'institutionId'=>$id,'institution'=>$name,'state'=>$uf,'municipalityId'=>$cityId,'municipality'=>$city['name'] ?? '','sourceVersion'=>$mode==='listed'?$catalog['version']:'self-declared'];
}

function save_education(int $userId, ?array $education): void {
    if (!$education) { query('DELETE FROM md_education WHERE user_id = ?', [$userId]); return; }
    $columns = 'user_id,education_status,selection_mode,institution_id,institution_name,state,municipality_id,municipality_name,source_version,updated_at';
    $updates = ['education_status','selection_mode','institution_id','institution_name','state','municipality_id','municipality_name','source_version','updated_at'];
    $sqlite = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $sql = 'INSERT INTO md_education (' . $columns . ') VALUES (?,?,?,?,?,?,?,?,?,?) ' . ($sqlite ? 'ON CONFLICT(user_id) DO UPDATE SET ' : 'ON DUPLICATE KEY UPDATE ');
    $sql .= implode(',', array_map(fn($key) => $key . ($sqlite ? '=excluded.' . $key : '=VALUES(' . $key . ')'), $updates));
    query($sql, [$userId,$education['status'],$education['mode'],$education['institutionId'],$education['institution'],$education['state'],$education['municipalityId'],$education['municipality'],$education['sourceVersion'],time()]);
}
