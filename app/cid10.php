<?php
declare(strict_types=1);

const CID10_PATH = '/cid-10/';
const CID10_SOURCE = 'https://fhir.saude.gov.br/ria/pt-BR/CodeSystem-BRCID10.html';

function cid10_selection(): array {
    return json_decode(file_get_contents(__DIR__ . '/cid10-selection.json'), true, 512, JSON_THROW_ON_ERROR);
}

function cid10_display(string $code): string {
    return strlen($code) === 4 ? substr($code, 0, 3) . '.' . $code[3] : $code;
}

function cid10_key(string $text): string {
    $lower = mb_strtolower($text, 'UTF-8');
    $plain = strtr($lower, [
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c',
    ]);
    return preg_replace('/\p{M}/u', '', $plain) ?? '';
}

function cid10_search(array $entries, string $query): array {
    $term = cid10_key($query);
    $term = preg_replace('/^cid(?:[- ]?10)?\s+/', '', $term);
    $term = preg_replace('/[^a-z0-9.]+/', ' ', $term);
    $words = preg_split('/\s+/', trim($term), -1, PREG_SPLIT_NO_EMPTY);
    if (!$words) return [];
    $code = str_replace('.', '', trim($term));
    $isCode = preg_match('/^[a-z][0-9]{1,3}$/D', $code);
    $ranked = [];
    foreach ($entries as $entry) {
        [$id, $label, $aliases] = $entry;
        $key = strtolower($id);
        if ($isCode) {
            if (str_starts_with($key, $code)) $ranked[] = [$key === $code ? 0 : 1, $entry];
            continue;
        }
        $haystack = cid10_key($label . ' ' . $aliases);
        foreach ($words as $word) if (!str_contains($haystack, $word)) continue 2;
        $ranked[] = [str_contains(cid10_key($label), $term) ? 0 : 1, $entry];
    }
    usort($ranked, fn(array $a, array $b) => $a[0] <=> $b[0]);
    return array_column($ranked, 1);
}
