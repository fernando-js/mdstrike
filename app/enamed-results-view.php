<?php
declare(strict_types=1);

function enamed_value(int|float|string|null $value, int $decimals = 0, string $suffix = ''): string {
    if ($value === null || $value === '') return '—';
    return is_string($value) ? $value : number_format($value, $decimals, ',', '.') . $suffix;
}

function enamed_display(array $course): string {
    return $course['institution'] . ' · ' . $course['city'] . '/' . $course['uf'];
}

function enamed_concept_badge(array $course): string {
    $label = enamed_status($course);
    return '<span class="enamed-concept" data-concept="' . h($course['concept'] ?? 'none') . '">' . h($label) . '</span>';
}

function enamed_bars(array $bars): void { ?>
    <ul class="enamed-bars">
    <?php foreach ($bars as [$label, $width, $value, $tone]): ?>
      <li class="enamed-bar">
        <span class="enamed-bar-label"><?= h($label) ?></span>
        <span class="enamed-bar-track" aria-hidden="true"><i class="<?= h($tone) ?>" style="--fill:<?= round(max(0, min(100, $width)), 3) ?>%"></i></span>
        <strong><?= h($value) ?></strong>
      </li>
    <?php endforeach; ?>
    </ul>
<?php }

function enamed_distribution(array $scores, array $bands): void {
    $rows = [];
    foreach ($bands as $i => $band) {
        $count = $scores['bands'][$i];
        $pct = $count / $scores['count'] * 100;
        $rows[] = [$band, $pct, enamed_value($pct, 1, '%') . ' · ' . enamed_value($count), 'enamed-teal'];
    }
    enamed_bars($rows);
}

function enamed_kpis(array $items): void { ?>
    <dl class="enamed-kpis" style="--columns:<?= count($items) ?>">
      <?php foreach ($items as [$label, $value]): ?>
      <div><dt><?= h($label) ?></dt><dd><?= h($value) ?></dd></div>
      <?php endforeach; ?>
    </dl>
<?php }

function enamed_source_footer(array $data): void {
    $sources = $data['sources']; ?>
    <footer class="enamed-footer">
      <p>Inep · Enamed <?= h($data['year']) ?> · planilha atualizada em <?= h(date('d/m/Y', strtotime($sources['indicators']['updated']))) ?></p>
      <div class="row wrap">
        <a href="<?= h($sources['indicators']['page']) ?>">Indicadores oficiais</a>
        <a href="<?= h($sources['microdata']['page']) ?>">Microdados</a>
        <a href="<?= h(ENAMED_RESULTS . '#metodologia') ?>">Metodologia</a>
      </div>
    </footer>
<?php }

function enamed_overview(array $data): void {
    $all = $data['courses'];
    $filter = enamed_filters($all);
    $matches = enamed_filter_courses($all, $filter);
    $total = count($matches);
    $pages = max(1, (int)ceil($total / ENAMED_PAGE_SIZE));
    $page = min($pages, max(1, (int)enamed_param('pagina', '1')));
    $courses = array_slice($matches, ($page - 1) * ENAMED_PAGE_SIZE, ENAMED_PAGE_SIZE);
    $national = $data['national'];
    $states = $data['states'];
    $scores = $national['scores'];
    $other = $data['otherParticipants'];
    $concepts = [];
    foreach ($national['concepts'] as $i => $count) {
        $concepts[] = ['Conceito ' . ($i + 1), 100 * $count / $national['withConcept'], enamed_value($count) . ' · ' . enamed_value($count / $national['withConcept'] * 100, 1, '%'), $i >= 2 ? 'enamed-teal' : 'enamed-amber'];
    }
    $topStates = $states;
    uasort($topStates, fn($a, $b) => ($b['percentage'] ?? -1) <=> ($a['percentage'] ?? -1));
    $stateBars = [];
    foreach (array_slice($topStates, 0, 5, true) as $uf => $stat) {
        if ($stat['percentage'] !== null) $stateBars[] = [$uf, $stat['percentage'], enamed_value($stat['percentage'], 1, '%'), 'enamed-amber'];
    }
    $cities = array_column($all, null, 'cityId');
    uasort($cities, fn($a, $b) => [enamed_filter_text($a['city']), $a['uf']] <=> [enamed_filter_text($b['city']), $b['uf']]);
    $categories = array_values(array_unique(array_column($all, 'category')));
    sort($categories, SORT_STRING);
    $unreported = $national['courses'] - $national['withConcept'];
    ?>
    <section class="enamed-hero">
      <div>
        <h1>Resultados do Enamed <?= h($data['year']) ?></h1>
        <p>Consulte o desempenho dos cursos de Medicina com dados do Inep.</p>
      </div>
      <div class="row wrap enamed-hero-actions"><a class="btn" href="#cursos">Consultar cursos</a><a class="text-button" href="/enamed/2025/">Jogar simulado</a></div>
    </section>

    <?php enamed_kpis([
        ['Cursos na planilha', enamed_value($national['courses'])],
        ['Cursos com conceito', enamed_value($national['withConcept'])],
        ['UFs com cursos avaliados', enamed_value(count($states))],
    ]); ?>

    <div class="enamed-chart-grid">
      <section class="enamed-panel">
        <h2>Distribuição do Conceito Enade</h2>
        <?php enamed_bars($concepts); ?>
        <p class="enamed-note"><?= h(enamed_value($national['withConcept'])) ?> cursos com conceito publicado · <?= h(enamed_value($unreported)) ?> sem faixa numérica.</p>
      </section>
      <section class="enamed-panel">
        <h2>Resultados por UF</h2>
        <?php enamed_bars($stateBars); ?>
        <p class="enamed-note">Maiores percentuais acima do padrão nos cursos com dados publicados. <a href="#estados">Ver todas as UFs</a></p>
      </section>
    </div>

    <section id="cursos" class="enamed-panel enamed-course-list" aria-labelledby="course-search-heading">
      <div class="enamed-section-header">
        <h2 id="course-search-heading">Buscar cursos de Medicina</h2>
        <a class="text-button" href="<?= h(enamed_query($filter, ENAMED_RESULTS . 'dados.csv')) ?>">Baixar CSV</a>
      </div>
      <form class="enamed-filters" action="<?= h(ENAMED_RESULTS) ?>#cursos" method="get">
        <label class="field enamed-search"><span id="enamed-query-label">Buscar</span><input name="q" type="search" aria-labelledby="enamed-query-label" placeholder="Instituição, sigla, município ou código e-MEC" value="<?= h($filter['q']) ?>" maxlength="120"></label>
        <label class="field"><span id="enamed-uf-label">UF</span><select name="uf" id="enamed-uf" aria-labelledby="enamed-uf-label"><option value="">Todas</option>
          <?php foreach (array_keys($states) as $uf): ?><option value="<?= h($uf) ?>"<?= $uf === $filter['uf'] ? ' selected' : '' ?>><?= h($uf) ?></option><?php endforeach; ?>
        </select></label>
        <label class="field"><span id="enamed-city-label">Município</span><select name="municipio" id="enamed-city" aria-labelledby="enamed-city-label"><option value="">Todos</option>
          <?php foreach ($cities as $city): ?><option value="<?= h($city['cityId']) ?>" data-uf="<?= h($city['uf']) ?>"<?= $city['cityId'] === $filter['municipio'] ? ' selected' : '' ?>><?= h($city['city'] . '/' . $city['uf']) ?></option><?php endforeach; ?>
        </select></label>
        <label class="field"><span>Conceito</span><select name="conceito"><option value="">Todos</option>
          <?php foreach (['1'=>'1','2'=>'2','3'=>'3','4'=>'4','5'=>'5','sc'=>'Sem conceito (SC)','suspenso'=>'Suspenso','indisponivel'=>'Indisponível'] as $id => $label): ?><option value="<?= h($id) ?>"<?= (string)$id === $filter['conceito'] ? ' selected' : '' ?>><?= h($label) ?></option><?php endforeach; ?>
        </select></label>
        <label class="field"><span>Categoria</span><select name="categoria"><option value="">Todas</option>
          <?php foreach ($categories as $category): ?><option<?= $category === $filter['categoria'] ? ' selected' : '' ?>><?= h($category) ?></option><?php endforeach; ?>
        </select></label>
        <label class="field"><span>Ordenação</span><select name="ordem">
          <?php foreach (enamed_sort_options() as $id => $label): ?><option value="<?= h($id) ?>"<?= $id === $filter['ordem'] ? ' selected' : '' ?>><?= h($label) ?></option><?php endforeach; ?>
        </select></label>
        <div class="row wrap enamed-filter-actions"><button class="btn small" type="submit">Filtrar</button><a class="text-button" href="<?= h(ENAMED_RESULTS) ?>#cursos">Limpar filtros</a></div>
      </form>
      <p class="enamed-result-count"><strong><?= h(enamed_value($total)) ?></strong> <?= $total === 1 ? 'curso encontrado' : 'cursos encontrados' ?></p>
      <?php if ($courses): ?>
      <form id="enamed-compare-select" action="<?= h(ENAMED_RESULTS) ?>comparar/" method="get">
        <div class="enamed-compare-bar">
          <div><span id="enamed-selected-summary" role="status">Selecione até 3 cursos para comparar.</span><span id="enamed-selection-labels" class="muted"></span></div>
          <div class="row wrap"><button type="button" id="enamed-clear-selection" class="text-button" hidden>Limpar seleção</button><button class="btn outline small" type="submit">Comparar cursos</button></div>
        </div>
        <div class="enamed-table-scroll">
          <table class="enamed-table enamed-results-table">
            <thead><tr><th scope="col"><span class="enamed-sr-only">Selecionar</span></th><th scope="col">Instituição e curso</th><th scope="col">Conceito</th><th scope="col">Acima do padrão</th><th scope="col">Participantes</th><th scope="col">Nota média</th></tr></thead>
            <tbody>
            <?php foreach ($courses as $course): ?>
              <tr>
                <td class="enamed-pick"><input type="checkbox" name="c[]" value="<?= h($course['id']) ?>" data-name="<?= h($course['initials'] ?: $course['institution']) ?>" aria-label="<?= h('Comparar ' . enamed_display($course) . ' · ' . $course['id']) ?>"></td>
                <td class="enamed-institution"><a href="<?= h(enamed_course_url($course['id'])) ?>"><?= h($course['institution']) ?></a><small><?= h($course['city'] . '/' . $course['uf'] . ' · ' . $course['category']) ?></small></td>
                <td><span class="enamed-mobile-label" aria-hidden="true">Conceito</span><?= enamed_concept_badge($course) ?></td>
                <td><span class="enamed-mobile-label" aria-hidden="true">Acima do padrão</span><?= h(enamed_value($course['percentage'], 1, '%')) ?></td>
                <td><span class="enamed-mobile-label" aria-hidden="true">Participantes</span><?= h(enamed_value($course['participants'])) ?></td>
                <td><span class="enamed-mobile-label" aria-hidden="true">Nota média</span><?= h(enamed_value($course['scores']['average'] ?? null, 1)) ?></td>
              </tr>
            <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </form>
      <?php if ($pages > 1): ?>
        <nav class="enamed-pagination" aria-label="Páginas de resultados">
          <?php if ($page > 1): ?><a rel="prev" class="btn outline small" href="<?= h(enamed_query($filter + ['pagina'=>$page - 1])) ?>#cursos">Anterior</a><?php endif; ?>
          <span>Página <?= h($page) ?> de <?= h($pages) ?></span>
          <?php if ($page < $pages): ?><a rel="next" class="btn outline small" href="<?= h(enamed_query($filter + ['pagina'=>$page + 1])) ?>#cursos">Próxima</a><?php endif; ?>
        </nav>
      <?php endif; ?>
      <?php else: ?><div class="enamed-empty"><h3>Nenhum curso encontrado</h3><p>Ajuste a busca ou remova um filtro.</p></div><?php endif; ?>
    </section>

    <div class="enamed-chart-grid enamed-lower-charts">
      <section id="estados" class="enamed-panel">
        <h2>Comparativo por UF</h2>
        <div class="enamed-table-scroll enamed-state-scroll" tabindex="0" aria-label="Tabela de resultados por UF">
          <table class="enamed-table">
            <thead><tr><th scope="col">UF</th><th scope="col">Cursos</th><th scope="col">Acima do padrão</th><th scope="col">Nota média</th></tr></thead>
            <tbody><?php foreach ($states as $uf => $stat): ?>
            <tr><th scope="row"><a href="<?= h(enamed_query(['uf'=>$uf])) ?>#cursos"><?= h($uf) ?></a></th><td><?= h($stat['courses']) ?></td><td><?= h(enamed_value($stat['percentage'], 1, '%')) ?></td><td><?= h(enamed_value($stat['scores']['average'] ?? null, 1)) ?></td></tr>
            <?php endforeach; ?></tbody>
          </table>
        </div>
      </section>
      <section class="enamed-panel">
        <h2>Notas por grupo de participantes</h2>
        <div class="enamed-table-scroll">
        <table class="enamed-table">
          <thead><tr><th scope="col">Grupo</th><th scope="col">Com nota válida</th><th scope="col">Nota média</th></tr></thead>
          <tbody>
            <tr><th scope="row">Concluintes de cursos com conceito publicado</th><td><?= h(enamed_value($scores['count'])) ?></td><td><?= h(enamed_value($scores['average'], 1)) ?></td></tr>
            <tr><th scope="row">Demais participantes</th><td><?= h(enamed_value($other['count'])) ?></td><td><?= h(enamed_value($other['average'], 1)) ?></td></tr>
          </tbody>
        </table>
        </div>
        <p class="enamed-note">Grupos distintos nos microdados públicos. A nota média vem da prova objetiva na escala de 0 a 100.</p>
      </section>
    </div>

    <section id="metodologia" class="enamed-panel enamed-methodology">
      <h2>Metodologia e fontes</h2>
      <details open><summary>Como ler o Conceito Enade</summary><p>O Inep publica a faixa de 1 a 5 para cada código de curso, além do percentual de concluintes acima do padrão. SC significa sem conceito. A planilha registra os conceitos suspensos por decisão judicial.</p><p><a href="<?= h($data['sources']['methodology']) ?>">Nota Técnica do Inep</a> · <a href="<?= h($data['sources']['indicators']['file']) ?>">Baixar planilha oficial</a></p></details>
      <details><summary>Como o MDStrike calcula médias e percentuais por UF</summary><p>O percentual por UF e do Brasil divide o total acima do padrão pelo total de participantes nos cursos com conceito e contagens publicadas. A média da prova usa o campo NT_GER dos concluintes presentes com nota válida. As médias e distribuições por curso, UF e Brasil usam apenas cursos com conceito publicado e grupos de pelo menos <?= h($data['minimumGroup']) ?> notas. O grupo de demais participantes usa seu arquivo próprio.</p></details>
      <details><summary>O que significa NPS do curso</summary><p>É uma medida de recomendação calculada a partir da pergunta QE_I57. O resultado é a porcentagem de respostas de 9 a 10 menos a porcentagem de respostas de 0 a 6, entre os que responderam. As fichas mostram o número de respostas válidas.</p></details>
      <details><summary>Versões dos arquivos do Inep</summary><p><a href="<?= h($data['sources']['indicators']['page']) ?>">Planilha de Conceito Enade</a> · <a href="<?= h($data['sources']['microdata']['file']) ?>">ZIP dos microdados</a></p><dl class="enamed-checksums"><dt>SHA-256 da planilha</dt><dd><?= h($data['sources']['indicators']['sha256']) ?></dd><dt>SHA-256 dos microdados</dt><dd><?= h($data['sources']['microdata']['sha256']) ?></dd></dl></details>
    </section>
<?php }

function enamed_course_detail(array $data, array $course): void {
    $scores = $course['scores'];
    $state = $data['states'][$course['uf']];
    $national = $data['national']; ?>
    <section class="enamed-hero">
      <div><h1><?= h($course['institution']) ?></h1>
      <p>Medicina · <?= h($course['city'] . '/' . $course['uf']) ?> · Código e-MEC <?= h($course['id']) ?> · Enamed <?= h($data['year']) ?></p></div>
      <div class="row wrap enamed-hero-actions"><a class="btn outline" href="<?= h(ENAMED_RESULTS . 'comparar/?cursos=' . $course['id']) ?>">Comparar este curso</a><button class="text-button" type="button" data-copy-course hidden>Copiar link</button></div>
    </section>
    <?php enamed_kpis([
        ['Conceito Enade', enamed_status($course)],
        ['Acima do padrão', enamed_value($course['percentage'], 1, '%')],
        ['Participantes', enamed_value($course['participants'])],
        ['Nota média', enamed_value($scores['average'] ?? null, 1)],
    ]); ?>
    <?php if ($course['status'] !== 'published'): ?>
      <p class="notice"><?= $course['status'] === 'suspended' ? 'O Inep registra a suspensão judicial do conceito deste curso.' : 'A planilha do Inep registra este curso sem conceito numérico.' ?></p>
    <?php endif; ?>
    <div class="enamed-chart-grid">
      <section class="enamed-panel">
        <h2>Distribuição das notas</h2>
        <?php if ($scores): ?>
           <?php enamed_distribution($scores, $data['bands']); ?>
           <p class="enamed-note"><?= h(enamed_value($scores['count'])) ?> concluintes com nota válida nos microdados.</p>
        <?php else: ?><p>Distribuição indisponível para este curso.</p><?php endif; ?>
      </section>
      <section class="enamed-panel">
        <h2>Referências de desempenho</h2>
        <div class="enamed-table-scroll"><table class="enamed-table">
          <thead><tr><th scope="col">Referência</th><th scope="col">Nota média</th><th scope="col">Acima do padrão</th></tr></thead>
          <tbody>
            <tr class="enamed-course-reference"><th scope="row">Este curso</th><td><?= h(enamed_value($scores['average'] ?? null, 1)) ?></td><td><?= h(enamed_value($course['percentage'], 1, '%')) ?></td></tr>
            <tr><th scope="row"><?= h($course['uf']) ?></th><td><?= h(enamed_value($state['scores']['average'] ?? null, 1)) ?></td><td><?= h(enamed_value($state['percentage'], 1, '%')) ?></td></tr>
            <tr><th scope="row">Brasil</th><td><?= h(enamed_value($national['scores']['average'] ?? null, 1)) ?></td><td><?= h(enamed_value($national['percentage'], 1, '%')) ?></td></tr>
          </tbody>
        </table></div>
        <p class="enamed-note">Médias e percentuais de UF e Brasil usam os cursos com conceito e resultados publicados.</p>
      </section>
    </div>
    <section class="enamed-panel enamed-course-facts">
      <h2>Dados complementares</h2>
      <dl class="public-facts">
        <div><dt>Categoria</dt><dd><?= h($course['category']) ?></dd></div>
        <div><dt>Modalidade</dt><dd><?= h($course['modality']) ?></dd></div>
        <div><dt>Código da instituição</dt><dd><?= h($course['institutionId']) ?></dd></div>
        <div><dt>Concluintes inscritos</dt><dd><?= h(enamed_value($course['registered'])) ?></dd></div>
        <div><dt>Concluintes acima do padrão</dt><dd><?= h(enamed_value($course['above'])) ?></dd></div>
        <div><dt>NPS do curso</dt><dd><?= h(enamed_value($course['recommendation']['nps'] ?? null, 1)) ?><?php if ($course['recommendation']): ?><small><?= h(enamed_value($course['recommendation']['count'])) ?> respostas</small><?php endif; ?></dd></div>
      </dl>
    </section>
    <div class="row wrap enamed-detail-links">
      <a class="text-button" href="<?= h(ENAMED_RESULTS) ?>#cursos">Voltar à busca</a>
      <a class="text-button" href="<?= h($data['sources']['indicators']['file']) ?>">Ver planilha do Inep</a>
      <a class="text-button" href="/enamed/2025/">Jogar simulado da edição</a>
    </div>
<?php }

function enamed_compare(array $data): void {
    $filter = ['q'=>'', 'uf'=>'', 'municipio'=>'', 'categoria'=>'', 'conceito'=>'', 'ordem'=>'institution'];
    $all = array_column(enamed_filter_courses($data['courses'], $filter), null, 'id');
    $ids = enamed_comparison_ids($all);
    $courses = array_map(fn($id) => $all[$id], $ids);
    $metrics = [
        'Conceito Enade'=>fn($c) => enamed_status($c),
        'Acima do padrão'=>fn($c) => enamed_value($c['percentage'], 1, '%'),
        'Participantes'=>fn($c) => enamed_value($c['participants']),
        'Nota média'=>fn($c) => enamed_value($c['scores']['average'] ?? null, 1),
        'NPS do curso'=>fn($c) => enamed_value($c['recommendation']['nps'] ?? null, 1),
    ];
    ?>
    <section class="enamed-hero">
      <div><h1>Comparar cursos de Medicina</h1><p>Escolha até três cursos para comparar no Enamed <?= h($data['year']) ?>.</p></div>
      <div class="row wrap enamed-hero-actions"><a class="text-button" href="<?= h(ENAMED_RESULTS) ?>#cursos">Voltar à busca</a><button class="text-button" type="button" data-copy-course hidden>Copiar link</button></div>
    </section>
    <form class="enamed-panel enamed-compare-form" action="<?= h(ENAMED_RESULTS) ?>comparar/" method="get">
      <?php for ($i = 0; $i < 3; $i++): ?>
        <label class="field"><span>Curso <?= $i + 1 ?></span><select name="c[]"><option value="">Escolher curso</option>
          <?php foreach ($all as $c): ?><option value="<?= h($c['id']) ?>"<?= ($ids[$i] ?? '') === $c['id'] ? ' selected' : '' ?>><?= h(enamed_display($c) . ' · ' . $c['id']) ?></option><?php endforeach; ?>
        </select></label>
      <?php endfor; ?>
      <button type="submit" class="btn small">Comparar</button>
    </form>
    <?php if ($courses): ?>
    <div class="enamed-panel enamed-compare-results enamed-table-scroll" tabindex="0" aria-label="Comparação de cursos">
      <table class="enamed-table">
        <thead><tr><th scope="col">Indicador</th><?php foreach ($courses as $c): ?><th scope="col"><a href="<?= h(enamed_course_url($c['id'])) ?>"><?= h($c['institution']) ?></a><small><?= h($c['city'] . '/' . $c['uf'] . ' · ' . $c['id']) ?></small></th><?php endforeach; ?></tr></thead>
        <tbody>
          <?php foreach ($metrics as $label => $value): ?>
          <tr><th scope="row"><?= h($label) ?></th><?php foreach ($courses as $c): ?><td><strong><?= h($value($c)) ?></strong></td><?php endforeach; ?></tr>
          <?php endforeach; ?>
          <tr><th scope="row">Distribuição das notas<small>Percentual com nota válida por faixa</small></th>
          <?php foreach ($courses as $c): ?><td><?php if ($c['scores']): enamed_distribution($c['scores'], $data['bands']); else: ?>—<?php endif; ?></td><?php endforeach; ?>
          </tr>
        </tbody>
      </table>
    </div>
    <?php else: ?><section class="enamed-panel enamed-empty"><h2>Escolha os cursos</h2><p>Você também pode marcar cursos na <a href="<?= h(ENAMED_RESULTS) ?>#cursos">busca de resultados</a>.</p></section><?php endif; ?>
<?php }
