<?php
declare(strict_types=1);

const ENAMED_RESULTS = '/enamed/resultados/';
const ENAMED_PAGE_SIZE = 20;

function enamed_results(): array {
    static $data;
    return $data ??= json_decode(file_get_contents(__DIR__ . '/enamed-results.json'), true, 512, JSON_THROW_ON_ERROR);
}

function enamed_course_url(string $id): string {
    return ENAMED_RESULTS . 'curso/' . $id . '/';
}

function enamed_results_urls(): array {
    return [ENAMED_RESULTS, ...array_map(fn($course) => enamed_course_url($course['id']), enamed_results()['courses'])];
}

function enamed_filter_text(string $value): string {
    return strtr(mb_strtolower(trim($value), 'UTF-8'), [
        'á'=>'a', 'à'=>'a', 'â'=>'a', 'ã'=>'a', 'ä'=>'a', 'é'=>'e', 'ê'=>'e', 'è'=>'e',
        'í'=>'i', 'ì'=>'i', 'ó'=>'o', 'ô'=>'o', 'õ'=>'o', 'ö'=>'o', 'ú'=>'u', 'ü'=>'u', 'ç'=>'c',
    ]);
}

function enamed_param(string $key, string $fallback = ''): string {
    $value = $_GET[$key] ?? $fallback;
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) return $fallback;
    return mb_substr(trim($value), 0, 120, 'UTF-8');
}

function enamed_sort_options(): array {
    return [
        'institution'=>'Instituição (A–Z)', 'concept'=>'Maior Conceito Enade',
        'percentage'=>'Maior percentual acima do padrão', 'average'=>'Maior nota média',
        'participants'=>'Mais participantes', 'nps'=>'Maior NPS do curso',
    ];
}

function enamed_filters(array $courses): array {
    $states = array_values(array_unique(array_column($courses, 'uf')));
    $cities = array_values(array_unique(array_column($courses, 'cityId')));
    $categories = array_values(array_unique(array_column($courses, 'category')));
    $uf = strtoupper(enamed_param('uf'));
    $city = enamed_param('municipio');
    $category = enamed_param('categoria');
    $concept = enamed_param('conceito');
    $sort = enamed_param('ordem', 'institution');
    return [
        'q'=>enamed_param('q'), 'uf'=>in_array($uf, $states, true) ? $uf : '',
        'municipio'=>in_array($city, $cities, true) ? $city : '',
        'categoria'=>in_array($category, $categories, true) ? $category : '',
        'conceito'=>in_array($concept, ['1','2','3','4','5','sc','suspenso','indisponivel'], true) ? $concept : '',
        'ordem'=>isset(enamed_sort_options()[$sort]) ? $sort : 'institution',
    ];
}

function enamed_status(array $course): string {
    return match ($course['status']) {
        'published' => (string)$course['concept'], 'without_concept' => 'SC',
        'suspended' => 'Suspenso', default => 'Indisponível',
    };
}

function enamed_filter_courses(array $courses, array $filter): array {
    $tokens = preg_split('/\s+/u', enamed_filter_text($filter['q']), -1, PREG_SPLIT_NO_EMPTY);
    $concept = ['sc'=>'SC','suspenso'=>'Suspenso','indisponivel'=>'Indisponível'][$filter['conceito']] ?? $filter['conceito'];
    $filtered = array_values(array_filter($courses, static function ($course) use ($filter, $tokens, $concept) {
        if (($filter['uf'] && $course['uf'] !== $filter['uf']) ||
            ($filter['municipio'] && $course['cityId'] !== $filter['municipio']) ||
            ($filter['categoria'] && $course['category'] !== $filter['categoria']) ||
            ($concept && enamed_status($course) !== $concept)) return false;
        $searchable = enamed_filter_text(implode(' ', [
            $course['institution'], $course['initials'], $course['city'], $course['uf'], $course['id'],
        ]));
        foreach ($tokens as $token) if (!str_contains($searchable, $token)) return false;
        return true;
    }));
    $sort = $filter['ordem'];
    $metric = static fn($course) => match ($sort) {
        'average' => $course['scores']['average'] ?? null,
        'nps' => $course['recommendation']['nps'] ?? null,
        'institution' => null,
        default => $course[$sort],
    };
    usort($filtered, static function ($a, $b) use ($metric) {
        $av = $metric($a);
        $bv = $metric($b);
        if ($av !== $bv) {
            if ($av === null) return 1;
            if ($bv === null) return -1;
            if (($value = $bv <=> $av) !== 0) return $value;
        }
        return [enamed_filter_text($a['institution']), enamed_filter_text($a['city']), $a['uf'], $a['id']]
            <=> [enamed_filter_text($b['institution']), enamed_filter_text($b['city']), $b['uf'], $b['id']];
    });
    return $filtered;
}

function enamed_query(array $filter, string $path = ENAMED_RESULTS): string {
    $parameters = array_filter($filter, fn($value) => $value !== '' && $value !== 'institution' && $value !== null);
    return $path . ($parameters ? '?' . http_build_query($parameters, '', '&', PHP_QUERY_RFC3986) : '');
}

function enamed_comparison_ids(array $courses): array {
    $selected = $_GET['c'] ?? explode(',', enamed_param('cursos'));
    if (!is_array($selected)) $selected = [$selected];
    $ids = [];
    foreach (array_slice($selected, 0, 20) as $value) {
        if (is_string($value) && isset($courses[$value]) && !in_array($value, $ids, true)) $ids[] = $value;
        if (count($ids) === 3) break;
    }
    return $ids;
}

function enamed_csv(array $data): never {
    $rows = enamed_filter_courses($data['courses'], enamed_filters($data['courses']));
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="mdstrike-enamed-' . $data['year'] . '.csv"');
    header('X-Robots-Tag: noindex');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, [
        'Edição', 'Código e-MEC', 'Código da IES', 'Instituição', 'Sigla', 'UF', 'Município',
        'Categoria', 'Inscritos', 'Participantes', 'Concluintes acima do padrão',
        'Percentual acima do padrão', 'Conceito Enade', 'Status do conceito',
        'Nota média da prova', 'Concluintes com nota', 'NPS (calculado)', 'Respostas de recomendação',
        'Fonte dos indicadores', 'Atualização da planilha', 'Fonte dos microdados',
    ], ';', '"', '');
    foreach ($rows as $r) {
        $values = [
            $data['year'],$r['id'],$r['institutionId'],$r['institution'],$r['initials'],$r['uf'],$r['city'],$r['category'],
            $r['registered'],$r['participants'],$r['above'],$r['percentage'],$r['concept'],enamed_status($r),
            $r['scores']['average'] ?? null,$r['scores']['count'] ?? null,$r['recommendation']['nps'] ?? null,
            $r['recommendation']['count'] ?? null,$data['sources']['indicators']['page'],
            $data['sources']['indicators']['updated'],$data['sources']['microdata']['page'],
        ];
        $values = array_map(static function ($value) {
            if (is_float($value)) return str_replace('.', ',', (string)$value);
            return is_string($value) && preg_match('/^[=+@\-]/u', $value) ? "'" . $value : $value;
        }, $values);
        fputcsv($out, $values, ';', '"', '');
    }
    fclose($out);
    exit;
}
