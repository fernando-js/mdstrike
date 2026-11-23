<?php
declare(strict_types=1);

$info = $medicalPages[$canonical] ?? null;
$entry = null;
$query = '';
$indexable = true;

if (!$info) {
    $entries = cid10_selection();
    $catalog = array_column($entries, null, 0);
    if ($canonical === CID10_PATH) {
        $query = is_string($_GET['q'] ?? null) ? trim(mb_substr($_GET['q'], 0, 120, 'UTF-8')) : '';
        $indexable = !isset($_GET['q']);
        $featuredCodes = array_keys(featured_cid10());
        $results = $query !== ''
            ? cid10_search($entries, $query)
            : array_map(fn(string $code) => $catalog[$code], $featuredCodes);
        $info = [
            'title' => 'Consulta CID-10 por código ou nome',
            'description' => 'Pesquise códigos e termos da CID-10 em português. Consulte exemplos como I10, E11.9 e R07.4 e acesse a classificação do Ministério da Saúde.',
        ];
    } else {
        $code = strtoupper(str_replace('.', '', basename($canonical)));
        $entry = $catalog[$code] ?? null;
        if (!$entry) {
            http_response_code(404);
            exit('Código fora da seleção do MD Strike. Consulte a base oficial da CID-10.');
        }
        $canonical = CID10_PATH . strtolower($code) . '/';
        [$code, $label] = $entry;
        $display = cid10_display($code);
        $featured = featured_cid10()[$code] ?? null;
        $indexable = $featured !== null;
        $info = [
            'title' => 'CID-10 ' . $display . ' · ' . $label,
            'description' => 'Veja a descrição de ' . $display . ' na CID-10 em português e confira a fonte do Ministério da Saúde.',
        ];
        $related = array_values(array_filter($entries, fn(array $item) => $item[0] !== $code && str_starts_with($item[0], substr($code, 0, 3))));
    }
}

if ($path !== $canonical) {
    $encodedQuery = $query === '' ? '' : '?' . http_build_query(['q' => $query], '', '&', PHP_QUERY_RFC3986);
    header('Location: ' . $canonical . $encodedQuery, true, 301);
    exit;
}
$title = $info['title'] . ' | MD Strike';
header('Content-Type: text/html; charset=UTF-8');
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111719">
  <title><?= h($title) ?></title>
  <meta name="description" content="<?= h($info['description']) ?>">
  <?php if (!$indexable): ?><meta name="robots" content="noindex,follow"><?php endif; ?>
  <link rel="canonical" href="<?= h(SITE . $canonical) ?>">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MD Strike">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="<?= h($title) ?>">
  <meta property="og:description" content="<?= h($info['description']) ?>">
  <meta property="og:url" content="<?= h(SITE . $canonical) ?>">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/style.css?v=3.7.1">
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="public-header">
    <a class="brand" href="/" aria-label="MD Strike — início"><img src="/assets/favicon.svg" width="39" height="39" alt=""><span>MD <i>/</i> STRIKE</span></a>
    <nav aria-label="Conteúdos médicos">
      <?php foreach (['/medicina/' => 'Medicina', '/exames-medicos/' => 'Exames', '/consulta-clinica/' => 'Consulta clínica', CID10_PATH => 'CID-10'] as $url => $label): ?>
      <a class="nav-tab" <?= $url === $canonical ? 'aria-current="page"' : '' ?> href="<?= h($url) ?>"><?= h($label) ?></a>
      <?php endforeach; ?>
    </nav>
  </header>
  <main class="public-content medical-public" id="conteudo">
    <?php if ($entry || $canonical === '/exames-medicos/eletrocardiograma/'): ?>
    <nav class="medical-public-back" aria-label="Caminho da página"><a href="<?= $entry ? CID10_PATH : '/exames-medicos/' ?>"><?= $entry ? 'Consulta CID-10' : 'Exames médicos' ?></a></nav>
    <?php endif; ?>
    <section class="public-intro">
      <h1><?= h($info['title']) ?></h1>
      <?php if (!$entry): ?><p><?= h($info['description']) ?></p><?php endif; ?>
      <?php if (isset($info['action'])): ?>
      <div class="row wrap"><a class="btn" href="<?= h($info['action'][1]) ?>"><?= h($info['action'][0]) ?></a></div>
      <?php endif; ?>
      <?php if ($canonical === CID10_PATH): ?>
      <form class="medical-cid-search" action="<?= CID10_PATH ?>" method="get" role="search" aria-label="Consulta CID-10">
        <label class="field"><span>Código ou nome</span><input name="q" type="search" maxlength="120" placeholder="Ex. E11.9, pressão alta ou cefaleia" value="<?= h($query) ?>" required></label>
        <button class="btn" type="submit">Buscar</button>
      </form>
      <?php endif; ?>
    </section>

    <?php if ($canonical === CID10_PATH): ?>
    <section class="panel">
      <h2><?= $query === '' ? 'Exemplos da seleção' : 'Resultados da consulta' ?></h2>
      <p>Busca em <?= count($entries) ?> códigos frequentes. Para outras categorias e termos, consulte a classificação integral.</p>
      <?php if ($results): ?>
      <ul class="medical-cid-results">
        <?php foreach ($results as [$code, $label]): ?>
        <li><a href="<?= h(CID10_PATH . strtolower($code) . '/') ?>"><strong><?= h(cid10_display($code)) ?></strong> <span><?= h($label) ?></span></a></li>
        <?php endforeach; ?>
      </ul>
      <?php else: ?><p>Nenhum termo encontrado na seleção. Tente outro nome, pesquise só pelo código ou abra a fonte oficial.</p><?php endif; ?>
      <p><a href="<?= CID10_SOURCE ?>">Abrir a lista completa da CID-10 na RNDS</a></p>
    </section>
    <section class="panel">
      <h2>Como ler a CID-10</h2>
      <p>Uma categoria tem três caracteres, como E11. A subcategoria acrescenta um caractere, como E11.9. A busca aceita o código com ou sem ponto. Use o código correspondente à informação documentada.</p>
      <a href="/codificacao-em-saude/">Estudar CID-10, SIGTAP e TUSS</a>
    </section>
    <?php elseif ($entry): ?>
    <section class="panel">
      <h2><?= strlen($entry[0]) === 3 ? 'Categoria' : 'Subcategoria' ?> na CID-10</h2>
      <p><?= h($featured[0] ?? 'Consulte na classificação oficial as notas e os demais códigos do grupo para conferir o registro.') ?></p>
      <ul class="medical-public-links">
        <?php foreach ($featured[1] ?? [] as [$label, $url]): ?><li><a href="<?= h($url) ?>"><?= h($label) ?></a></li><?php endforeach; ?>
        <?php foreach ($related as [$relatedCode, $relatedLabel]): ?>
        <li><a href="<?= h(CID10_PATH . strtolower($relatedCode) . '/') ?>"><?= h(cid10_display($relatedCode) . ' · ' . $relatedLabel) ?></a></li>
        <?php endforeach; ?>
        <li><a href="<?= CID10_SOURCE ?>">Confirmar o termo na CID-10 da RNDS</a></li>
      </ul>
    </section>
    <?php else: ?>
    <?php foreach ($info['sections'] as [$heading, $body, $links]): ?>
    <section class="panel">
      <h2><?= h($heading) ?></h2>
      <p><?= h($body) ?></p>
      <ul class="medical-public-links">
        <?php foreach ($links as [$label, $url]): ?><li><a href="<?= h($url) ?>"><?= h($label) ?></a></li><?php endforeach; ?>
      </ul>
    </section>
    <?php endforeach; ?>
    <?php endif; ?>

    <footer class="public-footer">
      <?php if ($entry || $canonical === CID10_PATH): ?>
      <p>CID-10 da Organização Mundial da Saúde. Termos em português conferidos na <a href="<?= CID10_SOURCE ?>">Rede Nacional de Dados em Saúde, Ministério da Saúde</a>.</p>
      <?php endif; ?>
      <p>MD Strike · Material educacional para estudo em saúde. <a href="/#privacy">Privacidade</a></p>
    </footer>
  </main>
</body>
</html>
