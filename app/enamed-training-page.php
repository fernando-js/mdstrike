<?php
declare(strict_types=1);

const ENAMED_TRAINING_PATH = '/enamed/treino/';
if ($path !== ENAMED_TRAINING_PATH) {
    header('Location: ' . ENAMED_TRAINING_PATH, true, 301);
    return;
}
$files = glob(__DIR__ . '/enamed-training/[0-9][0-9][0-9][0-9].json');
rsort($files, SORT_STRING);
$requestedEdition = $_GET['edicao'] ?? null;
$editions = array_map(fn($file) => basename($file, '.json'), $files);
$edition = $requestedEdition ?? $editions[0] ?? null;
$index = array_search($edition, $editions, true);
if ($index === false) {
    http_response_code(404);
    exit('Edição de treino indisponível.');
}
$training = json_decode(file_get_contents($files[$index]), true, 512, JSON_THROW_ON_ERROR);
$areas = json_decode(file_get_contents(__DIR__ . '/catalog.json'), true, 512, JSON_THROW_ON_ERROR)['areas'];
foreach ($training['questions'] as &$question) {
    $question['areaName'] = $areas[$question['area']];
    if (empty($question['comment']['reviewedBy']) || empty($question['comment']['reviewedAt'])) {
        unset($question['comment']);
    }
}
unset($question);
$first = array_column($training['questions'], null, 'number')[$training['initial'][0]];
$encoded = json_encode($training, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
$description = 'Faça um treino curto com questões oficiais do Enamed, confira o gabarito do Inep e revise seus erros.';
header('Content-Type: text/html; charset=UTF-8');
?><!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="<?= h($description) ?>">
  <link rel="canonical" href="<?= h(SITE . ENAMED_TRAINING_PATH) ?>">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/style.css?v=3.7.1">
  <link rel="stylesheet" href="/assets/enamed-training.css?v=1">
  <script type="module" src="/assets/js/enamed-training.js?v=1"></script>
  <title>Treino Enamed <?= h($edition) ?> | MD Strike</title>
</head>
<body>
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="public-header">
    <a class="brand" href="/" aria-label="MD Strike — início"><img src="/assets/favicon.svg" width="39" height="39" alt=""><span>MD <i>/</i> STRIKE</span></a>
    <a class="text-button" href="/enamed/">Provas Enamed</a>
  </header>
  <main id="conteudo" class="public-content enamed-training">
    <header class="training-heading">
      <h1>Treino Enamed <?= h($edition) ?></h1>
      <?php if (count($editions) > 1): ?>
      <nav aria-label="Edições do treino">
        <?php foreach ($editions as $available): ?>
          <a class="text-button" <?= $available === $edition ? 'aria-current="page"' : '' ?> href="?edicao=<?= h($available) ?>"><?= h($available) ?></a>
        <?php endforeach; ?>
      </nav>
      <?php endif; ?>
    </header>
    <div id="enamed-training" data-training="<?= h($encoded) ?>">
      <section class="training-question panel">
        <p class="small-text"><?= h($training['title']) ?> · Questão <?= h($first['number']) ?></p>
        <h2>Questão 1 de <?= count($training['initial']) ?></h2>
        <p><?= h($first['prompt']) ?></p>
        <ol type="A"><?php foreach ($first['options'] as $option): ?><li><?= h($option) ?></li><?php endforeach; ?></ol>
        <noscript><p>Ative o JavaScript para responder e guardar seu progresso neste navegador.</p></noscript>
      </section>
    </div>
    <footer class="public-footer training-footer">
      <p><a href="<?= h($training['originalUrl']) ?>">Caderno original do Inep</a> · <a href="<?= h($training['key']) ?>">Gabarito <?= h(mb_strtolower($training['keyStatus'])) ?></a></p>
      <p><a href="/#privacy">Privacidade</a> · <a href="/enamed/resultados/">Resultados por curso</a></p>
    </footer>
  </main>
</body>
</html>
