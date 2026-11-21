<?php
declare(strict_types=1);

require __DIR__ . '/enamed-results-view.php';

$data = enamed_results();
$year = $data['year'];
$course = null;
$comparePage = false;
$canonical = rtrim($path, '/') . '/';
if ($path === ENAMED_RESULTS . 'dados.csv') enamed_csv($data);
if ($canonical === ENAMED_RESULTS . 'comparar/') {
    $comparePage = true;
} elseif (preg_match('~^/enamed/resultados/curso/(\d{1,12})/$~D', $canonical, $match)) {
    $course = array_column($data['courses'], null, 'id')[$match[1]] ?? null;
    if (!$course) {
        http_response_code(404);
        exit('Curso não encontrado.');
    }
} elseif ($canonical !== ENAMED_RESULTS) {
    http_response_code(404);
    exit('Página não encontrada.');
}
if ($path !== $canonical) {
    $query = $_GET ? '?' . http_build_query($_GET, '', '&', PHP_QUERY_RFC3986) : '';
    header('Location: ' . $canonical . $query, true, 301);
    exit;
}

$heading = match (true) {
    $comparePage => 'Comparar cursos de Medicina no Enamed ' . $year,
    $course !== null => 'Enamed ' . $year . ' · ' . $course['institution'] . ' · ' . $course['city'] . '/' . $course['uf'],
    default => 'Resultados do Enamed ' . $year . ' por curso de Medicina',
};
$title = $heading . ' | MD Strike';
$description = $course
    ? 'Consulte o Conceito Enade, participantes e desempenho do curso de Medicina em ' . $course['city'] . '/' . $course['uf'] . ', código e-MEC ' . $course['id'] . '.'
    : 'Consulte os resultados do Enamed ' . $year . ' por curso e estado. Busque faculdades, compare indicadores oficiais do Inep e baixe os dados.';
header('Content-Type: text/html; charset=UTF-8');
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111719">
  <title><?= h($title) ?></title>
  <meta name="description" content="<?= h($description) ?>">
  <?php if ($comparePage): ?><meta name="robots" content="noindex,follow"><?php endif; ?>
  <link rel="canonical" href="<?= h(SITE . $canonical) ?>">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MD Strike">
  <meta property="og:title" content="<?= h($title) ?>">
  <meta property="og:description" content="<?= h($description) ?>">
  <meta property="og:url" content="<?= h(SITE . $canonical) ?>">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/style.css?v=2.6.0">
  <link rel="stylesheet" href="/assets/enamed-results.css?v=2.7.0">
  <script type="module" src="/assets/js/enamed-results.js?v=2.7.0"></script>
</head>
<body class="enamed-page">
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="public-header enamed-header">
    <a class="brand" href="/" aria-label="MD Strike — início"><img src="/assets/favicon.svg" width="39" height="39" alt=""><span>MD <i>/</i> STRIKE</span></a>
    <nav aria-label="Exames"><?php foreach ($families as $slug => $item): ?><a class="nav-tab"<?= $slug === 'enamed' ? ' data-section="active"' : '' ?> href="/<?= h($slug) ?>/"><?= h($item['label']) ?></a><?php endforeach; ?></nav>
  </header>
  <main class="public-content enamed-content" id="conteudo">
    <nav class="enamed-breadcrumb" aria-label="Caminho da página">
      <a href="/enamed/">Enamed</a><span aria-hidden="true">›</span>
      <?php if ($course || $comparePage): ?><a href="<?= h(ENAMED_RESULTS) ?>">Resultados</a><span aria-hidden="true">›</span><span aria-current="page"><?= $comparePage ? 'Comparar cursos' : 'Ficha do curso' ?></span>
      <?php else: ?><span aria-current="page">Resultados</span><?php endif; ?>
    </nav>
    <?php if ($course): enamed_course_detail($data, $course);
          elseif ($comparePage): enamed_compare($data);
          else: enamed_overview($data); endif; ?>
    <p id="enamed-action-status" role="status" class="enamed-sr-only"></p>
    <?php enamed_source_footer($data); ?>
  </main>
</body>
</html>
