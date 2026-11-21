<?php
declare(strict_types=1);

const SITE = 'https://mdstrike.com';

$families = [
    'enamed' => [
        'tag' => 'ENAMED', 'label' => 'Enamed', 'title' => 'Simulado Enamed com provas e gabaritos oficiais',
        'intro' => 'Resolva o caderno do Exame Nacional de Avaliação da Formação Médica e confira as respostas pelo gabarito definitivo do Inep.',
        'details' => 'O resultado no MD Strike mostra seus acertos. Para a seleção de residência de acesso direto do Enare, consulte as regras de aproveitamento da nota no edital da edição.',
        'source' => 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos',
    ],
    'enare' => [
        'tag' => 'ENARE R+', 'label' => 'Enare', 'title' => 'Provas anteriores do Enare com pré-requisito',
        'intro' => 'Treine para a residência médica com cadernos de provas do Enare organizados por especialidade. O arquivo reúne as provas de pré-requisito da edição 2024/2025.',
        'details' => 'O edital do Enare 2026/2027 usa o resultado do Enamed para as especialidades de acesso direto. Os cadernos abaixo são das seleções com pré-requisito.',
        'source' => 'https://www.gov.br/hubrasil/pt-br/ensino-e-pesquisa/exame-nacional-de-residencia-enare',
    ],
    'revalida' => [
        'tag' => 'REVALIDA', 'label' => 'Revalida', 'title' => 'Simulado Revalida com provas anteriores do Inep',
        'intro' => 'Faça a prova objetiva do Revalida com tempo de prova e correção pelo gabarito definitivo. A operação atende quem se formou no exterior e também quem se formou em Medicina no Brasil e quer testar o próprio desempenho.',
        'details' => 'Na Operação Revalida, você pode treinar em rounds no mapa geral, praticar por área com questões classificadas do caderno 2026/1 e revisar seus erros.',
        'source' => 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/revalida/provas-e-gabaritos',
    ],
];

function h(string|int $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function edition_path(string $family, array $exam): string {
    return '/' . $family . '/' . substr($exam['id'], strlen($family) + 1) . '/';
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
require __DIR__ . '/app/cid10.php';
require __DIR__ . '/app/medical-pages.php';
$canonical = rtrim((string)$path, '/') . '/';
$medicalPages = medical_pages();
if (isset($medicalPages[$canonical]) || $canonical === CID10_PATH ||
    preg_match('~^/cid-10/[a-z][0-9]{2}(?:\.?[0-9])?/$~iD', $canonical)) {
    require __DIR__ . '/app/medical-page.php';
    return;
}
if (is_string($path) && preg_match('~^/enamed/resultados(?:/|$)~', $path)) {
    require __DIR__ . '/app/enamed-results.php';
    require __DIR__ . '/app/enamed-results-page.php';
    return;
}
$catalog = json_decode(file_get_contents(__DIR__ . '/app/catalog.json'), true, 512, JSON_THROW_ON_ERROR);
$exams = [];
foreach ($families as $slug => $info) {
    $exams[$slug] = array_values(array_filter($catalog['exams'], fn($entry) => $entry['exam'] === $info['tag']));
}
if ($path === '/sitemap.xml') {
    require __DIR__ . '/app/enamed-results.php';
    header('Content-Type: application/xml; charset=UTF-8');
    $urls = ['/'];
    foreach ($exams as $slug => $booklets) {
        $urls[] = '/' . $slug . '/';
        foreach ($booklets as $booklet) $urls[] = edition_path($slug, $booklet);
    }
    $urls = [...$urls, ...medical_public_urls(), ...enamed_results_urls()];
    echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    foreach ($urls as $url) echo '  <url><loc>' . h(SITE . $url) . "</loc></url>\n";
    echo "</urlset>\n";
    exit;
}

$parts = explode('/', trim((string)$path, '/'));
$family = $parts[0];
$info = $families[$family] ?? null;
$exam = null;
if ($info && count($parts) === 2) {
    foreach ($exams[$family] as $booklet) if (edition_path($family, $booklet) === '/' . implode('/', $parts) . '/') $exam = $booklet;
}
if (!$info || count($parts) > 2 || (count($parts) === 2 && !$exam)) {
    http_response_code(404);
    exit('Página não encontrada.');
}
$canonical = $exam ? edition_path($family, $exam) : '/' . $family . '/';
if ($path !== $canonical) {
    header('Location: ' . $canonical, true, 301);
    exit;
}
$heading = $exam ? $exam['title'] : $info['title'];
$title = $heading . ' | MD Strike';
$description = $exam
    ? 'Faça o simulado ' . $exam['title'] . ' no MD Strike. Consulte o caderno original, o gabarito definitivo e as questões válidas para jogar.'
    : $info['intro'];
header('Content-Type: text/html; charset=UTF-8');
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#111719">
  <title><?= h($title) ?></title>
  <meta name="description" content="<?= h($description) ?>">
  <link rel="canonical" href="<?= h(SITE . $canonical) ?>">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MD Strike">
  <meta property="og:title" content="<?= h($title) ?>">
  <meta property="og:description" content="<?= h($description) ?>">
  <meta property="og:url" content="<?= h(SITE . $canonical) ?>">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/style.css?v=2.6.0">
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="public-header">
    <a class="brand" href="/" aria-label="MD Strike — início"><img src="/assets/favicon.svg" width="39" height="39" alt=""><span>MD <i>/</i> STRIKE</span></a>
    <nav aria-label="Exames"><?php foreach ($families as $slug => $item): ?><a class="nav-tab" <?= $slug === $family && !$exam ? 'aria-current="page"' : '' ?> href="/<?= h($slug) ?>/"><?= h($item['label']) ?></a><?php endforeach; ?></nav>
  </header>
  <main id="conteudo" class="public-content">
    <?php if ($exam): ?><nav aria-label="Caminho da página"><a class="text-button" href="/<?= h($family) ?>/"><?= h($info['label']) ?> · Todas as provas</a></nav><?php endif; ?>
    <section class="public-intro">
      <h1><?= h($heading) ?></h1>
      <p><?= h($exam ? $description : $info['intro']) ?></p>
      <div class="row wrap">
        <?php if ($exam): ?>
          <a class="btn" href="/#caderno/<?= h($exam['id']) ?>">Iniciar simulado</a>
          <a class="btn outline" href="<?= h($exam['originalUrl']) ?>">Caderno original</a>
          <a class="text-button" href="<?= h($exam['key']) ?>">Gabarito definitivo</a>
          <?php if ($family === 'enamed'): ?><a class="text-button" href="/#study/enamed">Trilha Enamed</a><a class="text-button" href="/enamed/resultados/">Resultados por curso</a><?php endif; ?>
        <?php elseif ($family === 'revalida'): ?>
          <a class="btn" href="/#revalida">Entrar na Operação Revalida</a>
          <a class="btn outline" href="#provas">Ver provas anteriores</a>
        <?php elseif ($family === 'enamed'): ?>
          <a class="btn" href="/#study/enamed">Começar a Trilha Enamed</a>
          <a class="btn outline" href="#provas">Escolher uma prova</a>
          <a class="text-button" href="/enamed/resultados/">Resultados do Enamed por curso</a>
        <?php else: ?>
          <a class="btn" href="#provas">Escolher uma prova</a>
        <?php endif; ?>
      </div>
    </section>
    <?php if ($exam): ?>
      <section class="panel" aria-labelledby="booklet-facts">
        <h2 id="booklet-facts">Dados da prova</h2>
        <dl class="public-facts">
          <div><dt>Edição</dt><dd><?= h($exam['year']) ?></dd></div>
          <div><dt>Questões no caderno</dt><dd><?= h($exam['total']) ?></dd></div>
          <div><dt>Questões válidas</dt><dd><?= h($exam['valid']) ?></dd></div>
          <div><dt>Anuladas ou excluídas</dt><dd><?= count($exam['cancelled']) ?></dd></div>
          <?php if (isset($exam['durationMinutes'])): ?><div><dt>Duração</dt><dd><?= h($exam['durationMinutes'] === 300 ? '5 horas' : $exam['durationMinutes'] . ' minutos') ?></dd></div><?php endif; ?>
          <?php if (isset($exam['cutoff'])): ?><div><dt>Corte da prova objetiva</dt><dd><?= h($exam['cutoff']) ?> pontos</dd></div><?php endif; ?>
        </dl>
        <?php if ($family === 'revalida'): ?>
          <p>Você pode marcar, revisar e alterar respostas durante o tempo de prova. A correção aparece na entrega.</p>
          <?php if (!empty($exam['writtenStage'])): ?><p>Nesta edição, a primeira etapa incluía também uma prova discursiva. Aqui você pratica a prova objetiva.</p><?php endif; ?>
          <?php if (isset($exam['cutoff'])): ?><p>O corte indica o desempenho na prova objetiva. A revalidação também tem uma etapa prática.</p><?php endif; ?>
          <?php if (!empty($exam['creditCancelled'])): ?><p>O edital atribui os pontos dos itens anulados a todos os participantes.</p><?php endif; ?>
          <?php if (!empty($exam['scoringSource'])): ?><p><a href="<?= h($exam['scoringSource']) ?>">Consultar critério oficial da edição</a></p><?php endif; ?>
        <?php else: ?><p>Resolva as questões válidas na ordem do caderno. A correção usa o gabarito definitivo.</p><?php endif; ?>
        <?php if ($exam['cancelled']): ?><p>Itens retirados do simulado: <?= h(implode(', ', $exam['cancelled'])) ?>.</p><?php endif; ?>
      </section>
    <?php else: ?>
      <p class="notice"><?= h($info['details']) ?> <?php if ($family === 'enare'): ?><a href="/enamed/">Ver simulados do Enamed</a> · <a href="https://mecnormas.mec.gov.br/pesquisa/detalhar/12886">Edital de acesso direto</a><?php endif; ?></p>
      <section id="provas" aria-labelledby="booklets">
        <h2 id="booklets">Provas disponíveis</h2>
        <div class="panel">
          <?php foreach ($exams[$family] as $booklet): ?>
          <article class="source-row public-booklet">
            <div><h3><a href="<?= h(edition_path($family, $booklet)) ?>"><?= h($booklet['title']) ?></a></h3><p><?= h($booklet['valid']) ?> questões válidas · gabarito definitivo<?php if (isset($booklet['cutoff'])): ?> · corte da objetiva <?= h($booklet['cutoff']) ?> pontos<?php endif; ?></p></div>
            <a class="btn outline small" href="<?= h(edition_path($family, $booklet)) ?>" aria-label="<?= h('Ver prova ' . $booklet['title']) ?>">Ver prova</a>
          </article>
          <?php endforeach; ?>
        </div>
      </section>
    <?php endif; ?>
    <footer class="public-footer">
      <p><a href="<?= h($exam['archive'] ?? $info['source']) ?>">Consultar a fonte oficial</a></p>
      <p><a href="/medicina/">Estudo de Medicina</a> · <a href="/exames-medicos/">Exames médicos</a> · <a href="/cid-10/">Consulta CID-10</a></p>
      <p>MD Strike é uma plataforma de estudo independente. <a href="/#privacy">Privacidade</a></p>
    </footer>
  </main>
</body>
</html>
