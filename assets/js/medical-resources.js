import {
  catalog,
  esc,
  guest,
  icon,
  state,
  storage,
  toast,
} from "./core.js?v=2.4.0";
import { heading } from "./views.js?v=3.0.0";
import { dueEcgReviews, loadEcgProgress } from "./ecg-progress.js?v=3.0.0";
import { cases, curriculumSource, summaries } from "./study-content.js?v=2.8.0";
import {
  ambDirectory,
  checkedOn,
  clinicalTopics,
  references,
} from "./clinical-content.js?v=2.8.0";
import { societies } from "./medical-societies.js?v=2.8.0";
import {
  medications,
  medicationSources,
} from "./medication-content.js?v=3.4.0";
import {
  calculators,
  calculateMedicalValue,
  nextReview,
} from "./medical-tools.js?v=3.3.0";

const studyTabs = [
  ["study", "Resumos"],
  ["study/pbl", "Casos PBL"],
  ["study/cursos", "Cursos rápidos"],
  ["study/revisao", "Minhas revisões"],
  ["study/enamed", "Trilha Enamed"],
];
const consultationTabs = [
  ["consulta", "Protocolos"],
  ["consulta/bulas", "Bulas resumidas"],
  ["consulta/calculadoras", "Calculadoras"],
  ["consulta/fontes", "Fontes brasileiras"],
];

const normalize = (value) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
const external = ([label, url]) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const internal = (route, label) => `<a href="#${route}">${esc(label)}</a>`;
const returnLink = (route, label) =>
  `<p class="section-return"><a class="text-button" data-back-route href="#${route}">‹ ${label}</a></p>`;
const dateLabel = (due) =>
  new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(
    due,
  );

function tabs(items, route) {
  return `<nav class="resource-tabs" aria-label="Nesta seção">${items
    .map(
      ([id, label]) =>
        `<a href="#${id}" ${route === id ? 'aria-current="page"' : ""}>${esc(label)}</a>`,
    )
    .join("")}</nav>`;
}

function searchBox(label, placeholder, filterLabel, filterValues, filterFirst) {
  return `<div class="resource-filters">
    <label class="field"><span>${label}</span><input type="search" data-resource-search placeholder="${placeholder}" autocomplete="off" maxlength="100"></label>
    ${filterLabel ? `<label class="field"><span>${filterLabel}</span><select data-resource-filter><option value="">${filterFirst}</option>${[...new Set(filterValues)].map((label) => `<option>${esc(label)}</option>`).join("")}</select></label>` : ""}
  </div>
  <p class="resource-count" role="status" data-resource-count></p>`;
}

const searchable = (group, ...terms) =>
  `data-resource-item data-search="${esc(normalize(terms.join(" ")))}" data-group="${esc(group)}"`;
const emptyResults = (message) =>
  `<p class="empty" data-resource-empty hidden>${message}</p>`;

function summaryCard(item, saved, open) {
  const review = saved.reviews[item.id];
  const topic = clinicalTopics.find(({ id }) => id === item.related);
  return `<details class="resource-card resource-summary" ${open ? "open" : ""} ${searchable(item.cycle, item.discipline, item.title, item.cycle)}>
    <summary><span><span class="resource-meta">${esc(item.cycle)}</span><strong>${esc(item.discipline)}</strong><span>${esc(item.title)}</span></span></summary>
    <div class="resource-body">
      <ul>${item.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
      <details class="resource-recall">
        <summary><strong>Pergunta de memória</strong><span>${esc(item.question)}</span><small>Tente responder antes de abrir.</small></summary>
        <div class="resource-answer"><p>${esc(item.answer)}</p>
          <div class="resource-actions">
            <button class="btn outline" type="button" data-review="${item.id}" data-recalled="true">Lembrei</button>
            <button class="btn outline" type="button" data-review="${item.id}" data-recalled="false">Preciso rever</button>
          </div>
          <p class="resource-meta" data-review-date role="status">${review ? `Próxima revisão: ${dateLabel(review.due)}` : ""}</p>
        </div>
      </details>
      <div class="resource-links">${external(item.source)}${topic ? internal("consulta/tema/" + topic.id, topic.title) : ""}</div>
    </div>
  </details>`;
}

const stages = ["Abertura", "Novos dados e objetivos", "Síntese"];

function caseCard(item, saved, open) {
  const step = saved.cases[item.id] ?? 0;
  const source = clinicalTopics.find(({ id }) => id === item.topic);
  const summary = summaries.find(({ id }) => id === item.review);
  return `<details class="resource-card resource-summary" data-case="${item.id}" ${open ? "open" : ""}>
    <summary><span><span class="resource-meta">${esc(item.area)}</span><strong>${esc(item.title)}</strong><span data-case-status>${caseStatus(step)}</span></span></summary>
    <div class="resource-body">
      <section class="resource-stage" data-case-stage="0">
        <h3>${stages[0]}</h3><p>${esc(item.opening)}</p><p>${esc(item.hypotheses)}</p>
        <button type="button" class="btn outline" data-case-next="1" ${step >= 1 ? "hidden" : ""}>Revelar novos dados</button>
      </section>
      <section class="resource-stage" data-case-stage="1" ${step < 1 ? "hidden" : ""}>
        <h3 tabindex="-1">${stages[1]}</h3><p>${esc(item.clue)}</p><p>${esc(item.objectives)}</p>
        <div class="resource-links">${external(source.sources[0])}</div>
        <button type="button" class="btn outline" data-case-next="2" ${step >= 2 ? "hidden" : ""}>Conferir síntese</button>
      </section>
      <section class="resource-stage" data-case-stage="2" ${step < 2 ? "hidden" : ""}>
        <h3 tabindex="-1">${stages[2]}</h3><p>${esc(item.synthesis)}</p>
        <div class="resource-links">${internal("study/resumo/" + summary.id, "Revisar " + summary.discipline)}${internal("consulta/tema/" + source.id, "Consultar " + source.title)}</div>
        <button type="button" class="btn outline" data-case-next="3" ${step >= 3 ? "hidden" : ""}>Concluir caso</button>
      </section>
      <p class="resource-meta" data-case-complete tabindex="-1" ${step < 3 ? "hidden" : ""}>Caso concluído</p>
    </div>
  </details>`;
}

function caseStatus(step) {
  return [
    "Começar caso",
    "Em andamento · objetivos",
    "Em andamento · síntese",
    "Concluído",
  ][step];
}

const enamed = catalog.exams.find((exam) => exam.id === "enamed-2025");
const enamedAreas = Object.entries(catalog.areas).filter(
  ([id]) => id !== "GERAL",
);
const enamedLaw = [
  "Lei nº 15.527/2026",
  "https://legis.senado.leg.br/norma/44363487/publicacao/44365692",
];
const enamedRules = [
  "Editais e legislação · Inep",
  "https://www.gov.br/inep/pt-br/centrais-de-conteudo/legislacao/enamed",
];
const enamedExams = [
  "Provas e gabaritos · Inep",
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos",
];

function enamedProgress(stats) {
  if (!stats) return "<p>Consultando seu histórico…</p>";
  const areas = enamedAreas.map(([id, name]) => {
    const row = stats.find(({ area }) => area === id);
    const total = Number(row?.answered ?? 0);
    return {
      id,
      name,
      total,
      ratio: total ? Number(row.correct) / total : null,
    };
  });
  const lowest = areas
    .filter(({ total }) => total > 0)
    .sort(
      (first, second) =>
        first.ratio - second.ratio || second.total - first.total,
    )[0]?.id;
  return `<ul class="resource-area-list">${areas
    .map(
      ({ id, name, total, ratio }) => `<li>
    <div><strong>${esc(name)}</strong><span>${total ? `${Math.round(ratio * 100)}% de acertos · ${total} ${total === 1 ? "resposta" : "respostas"}` : "Ainda sem respostas"}${id === lowest ? " · menor acerto até agora" : ""}</span></div>
    <button type="button" class="btn outline small" data-start="practice" data-map-id="${id}" data-exam-id="${enamed.id}" aria-label="Treinar ${esc(name)}">Treinar área</button>
  </li>`,
    )
    .join("")}</ul>`;
}

export function renderEnamedProgress(container, stats) {
  container.innerHTML = enamedProgress(stats);
}

function enamedTrack() {
  const stats = state.user
    ? state.profile?.stats
    : Object.entries(guest.stats).map(([area, row]) => ({ area, ...row }));
  return `<section class="resource-review-strip"><div><h2>Preparação para o Enamed</h2><p>Resolva o caderno de 2025 com correção pelo gabarito definitivo. Use os acertos por área para decidir o próximo treino.</p></div><button type="button" class="btn" data-exam="${enamed.id}">Resolver Enamed 2025</button></section>
    ${state.user ? "" : '<p class="resource-note">Com uma conta, o histórico de questões e os acertos por área acompanham você. <button type="button" class="text-button" data-auth="register">Criar conta</button> <button type="button" class="text-button" data-auth="login">Entrar</button></p>'}
    <div class="section-jumps" role="group" aria-label="Seções da Trilha Enamed"><button class="text-button" data-jump-to="enamed-treino">Treino por área</button><button class="text-button" data-jump-to="enamed-revisao">Revisão</button><button class="text-button" data-jump-to="enamed-proficiencia">Regras do Enamed</button></div>
    <section class="resource-card resource-track-card"><h2 id="enamed-treino" class="section-anchor" tabindex="-1">Treino e diagnóstico por área</h2><p>Os indicadores reúnem seu histórico de treino no MD Strike. As questões do Enamed 2025 são organizadas por área pelo MD Strike.</p><div data-enamed-progress>${enamedProgress(stats)}</div></section>
    <section class="resource-card resource-track-card"><h2 id="enamed-revisao" class="section-anchor" tabindex="-1">Revise antes de tentar de novo</h2><p>Refaça as questões em que errou e retome os resumos programados. Use os casos PBL para explicar o raciocínio por trás das respostas.</p><div class="resource-actions"><button type="button" class="btn outline" data-start="review" data-map-id="all">Revisar meus erros</button><a class="btn outline" href="#study/revisao">Minhas revisões</a><a class="btn outline" href="#study/pbl">Casos PBL</a></div></section>
    <section class="resource-card resource-track-card"><h2 id="enamed-proficiencia" class="section-anchor" tabindex="-1">Quem precisa comprovar proficiência</h2><p>A Lei nº 15.527, de 6 de novembro de 2026, exige resultado final proficiente para o registro no CRM de quem ingressou no curso de Medicina a partir de 19 de junho de 2026. Quem já estava matriculado antes dessa data segue as regras da época de ingresso.</p><p>Quem não atingir a proficiência pode refazer a terceira etapa em edição posterior. A lei também cria a Inscrição de Egresso de Medicina (IEM) para atividades técnico-científicas, sem assistência a pacientes. Consulte o Inep para regras de inscrição e calendário.</p><div class="resource-links">${[enamedLaw, enamedRules, enamedExams].map(external).join("")}</div></section>`;
}

function renderStudy(route, saved) {
  const due = summaries.filter(
    ({ id }) => saved.reviews[id]?.due <= Date.now(),
  );
  const subtitle =
    "Estude por disciplina, aplique o conteúdo em casos fictícios e treine a memória.";
  let body;
  if (route === "study/pbl") {
    body = `<div class="resource-intro"><h2>Aprendizagem baseada em problemas</h2><p>Formule hipóteses antes de avançar. Anote o que precisa investigar, consulte a referência e compare seu raciocínio com a síntese.</p></div>
      <div class="resource-grid">${cases.map((item) => caseCard(item, saved, false)).join("")}</div>`;
  } else if (route === "study/enamed") {
    body = enamedTrack();
  } else if (route === "study/revisao") {
    const ecg = loadEcgProgress();
    const pendingEcg = dueEcgReviews(ecg).length;
    const upcoming = summaries
      .filter(({ id }) => saved.reviews[id]?.due > Date.now())
      .sort((a, b) => saved.reviews[a.id].due - saved.reviews[b.id].due);
    body = `${Object.keys(ecg.reviews).length ? `<section class="resource-review-strip"><div><h2>Revisões de ECG</h2><p>${pendingEcg} ${pendingEcg === 1 ? "questão disponível" : "questões disponíveis"} hoje.</p></div><a class="btn outline" href="#study/cursos/ecg/revisao">Abrir revisões de ECG</a></section>` : ""}
      <div class="resource-intro"><h2>Resumos para revisar hoje <span>${due.length}</span></h2><p>Responda à pergunta de memória e registre como foi para agendar a próxima revisão.</p></div>
      ${due.length ? `<div class="resource-grid">${due.map((item) => summaryCard(item, saved, false)).join("")}</div>` : `<div class="empty"><p>${upcoming.length ? "Suas revisões estão em dia." : "Responda à primeira pergunta de memória para começar."}</p>${internal("study", "Explorar resumos")}</div>`}
      ${upcoming.length ? `<section class="resource-upcoming"><h2>Próximas revisões</h2><ul>${upcoming.map((item) => `<li>${internal("study/resumo/" + item.id, item.discipline)}<span>${dateLabel(saved.reviews[item.id].due)}</span></li>`).join("")}</ul></section>` : ""}`;
  } else if (route.startsWith("study/resumo/")) {
    const item = summaries.find(({ id }) => id === route.split("/")[2]);
    body =
      returnLink("study", "Todos os resumos") +
      (item
        ? `<div class="resource-grid">${summaryCard(item, saved, true)}</div>`
        : '<p class="empty">Resumo indisponível.</p>');
  } else {
    body = `<section class="resource-review-strip"><div><h2>ECG na prática</h2><p>Seis aulas, traçados de 12 derivações e um desafio final.</p></div><a href="#study/cursos/ecg" class="btn outline">Abrir curso de ECG ${icon("arrow", 16)}</a></section>
      <section class="resource-review-strip"><div><h2>${due.length ? `${due.length} ${due.length === 1 ? "revisão disponível" : "revisões disponíveis"}` : "Crie sua rotina de revisão"}</h2><p>Abra um resumo e teste o que você lembra.</p></div><a href="#study/revisao" class="btn outline">Minhas revisões ${icon("arrow", 16)}</a></section>
      ${searchBox(
        "Buscar disciplina ou assunto",
        "Ex.: anatomia, glicemia",
        "Ciclo",
        summaries.map(({ cycle }) => cycle),
        "Todos os ciclos",
      )}
      <div class="resource-grid">${summaries.map((item) => summaryCard(item, saved, false)).join("")}</div>
      ${emptyResults("Nenhum resumo corresponde à busca.")}
      <p class="resource-note">A organização por ciclos é uma trilha de estudo. Cada faculdade define sua matriz curricular. ${external(curriculumSource)}</p>`;
  }
  return `${heading("Estudo", subtitle)}
    ${tabs(studyTabs, route.startsWith("study/resumo/") ? "study" : route)}
    ${body}
    <p class="resource-note">O progresso fica salvo neste navegador. Resumos e casos são materiais educacionais autorais em versão inicial, ainda sem revisão médica independente.</p>`;
}

function protocolCard(item, saved, detail) {
  const marked = saved.protocols.includes(item.id);
  return `<article class="resource-card resource-topic" data-protocol="${item.id}" ${searchable(item.area, item.title, item.aliases, item.area)}>
    <div><p class="resource-meta">${esc(item.area)}</p><h2>${detail ? esc(item.title) : internal("consulta/tema/" + item.id, item.title)}</h2></div>
    <p>${esc(item.scope)}</p>
    <ul class="resource-links">${item.sources.map((source) => `<li>${external(source)}</li>`).join("")}</ul>
    <button type="button" class="btn outline" aria-label="Favoritar ${esc(item.title)}" aria-pressed="${marked}" data-bookmark="${item.id}">${marked ? "Favoritado" : "Favoritar"}</button>
  </article>`;
}

function renderSources() {
  return `<section class="resource-intro"><h2>Acervos e bases oficiais</h2></section>
    <div class="resource-grid resource-source-grid">${references.map((source) => `<article class="resource-card"><h3>${external(source)}</h3><p>${esc(source[2])}</p></article>`).join("")}</div>
    <section class="resource-intro resource-directory"><h2>Sociedades brasileiras por especialidade</h2><p>Links institucionais para as 55 especialidades do MD Strike. ${external(ambDirectory)} · consultado em ${checkedOn}.</p></section>
    ${searchBox("Buscar especialidade ou sociedade", "Ex.: Cardiologia, SBP")}
    <ul class="resource-directory-list">${catalog.specialties
      .map((item) => {
        const source = societies[item.id];
        return `<li ${searchable("", item.name, source[0])}><strong>${esc(item.name)}</strong>${external(source)}</li>`;
      })
      .join("")}</ul>
    ${emptyResults("Nenhuma sociedade encontrada.")}
    <p class="resource-note">Os links levam aos sites de origem, onde você pode conferir a versão do documento e suas condições de uso.</p>`;
}

function renderCalculators() {
  const filters = searchBox(
    "Buscar calculadora",
    "Ex.: filtração glomerular, QTc, IMC",
    "Área",
    calculators.map(({ group }) => group),
    "Todas as áreas",
  );
  return `${filters}<div class="resource-grid resource-calculators">${calculators
    .map(
      (
        calculator,
      ) => `<article class="resource-card" ${searchable(calculator.group, calculator.title, calculator.aliases ?? "", calculator.group)}>
    <p class="resource-meta">${esc(calculator.group)}</p>
    <h2>${esc(calculator.title)}</h2><p>${esc(calculator.description)}</p>
    <form data-medical-calculator="${calculator.id}" novalidate>
      <div class="resource-calculator-fields">${calculator.fields
        .map(({ key, label, example, options, integer }) => {
          const control = options
            ? `<select name="${key}" required><option value="">Selecione</option>${options.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join("")}</select>`
            : `<input name="${key}" type="text" inputmode="${integer ? "numeric" : "decimal"}" maxlength="12" placeholder="Ex.: ${esc(example)}" required>`;
          return `<label class="field"><span>${esc(label)}</span>${control}</label>`;
        })
        .join("")}</div>
      <div class="resource-actions"><button type="submit" class="btn">Calcular</button><button type="reset" class="btn outline">Limpar</button></div>
      <output role="status" class="resource-calculator-result"></output>
    </form>
    <p class="resource-formula">${esc(calculator.formula)}</p>
    <div class="resource-links">${external(calculator.source)}</div>
  </article>`,
    )
    .join(
      "",
    )}</div>${emptyResults("Nenhuma calculadora corresponde à busca.")}<p class="resource-note">Uso educacional. Os valores digitados são calculados no navegador e descartados ao sair desta tela.</p>`;
}

function renderMedicationLeaflets() {
  const items = Object.values(medications);
  const [leafletRegistryName, leafletRegistryUrl] = medicationSources.leaflets;
  return `<section class="resource-review-strip">
    <div><h2>Bulas resumidas</h2><p>Busque por princípio ativo ou nome comercial. Compare a forma e a concentração com as da embalagem.</p></div>
    <a class="btn outline" href="${esc(leafletRegistryUrl)}" target="_blank" rel="noopener noreferrer">${esc(leafletRegistryName)} ${icon("arrow", 16)}</a>
  </section>
  ${searchBox(
    "Buscar medicamento",
    "Ex.: dipirona, Amoxil, 500 mg",
    "Categoria",
    items.map(({ group }) => group),
    "Todas as categorias",
  )}
  <div class="resource-grid">
    ${items
      .map(
        ({ name, brand, form, group, className, uses, highlights, source }) => `
    <details class="resource-card resource-summary" ${searchable(group, name, brand, form, className, group)}>
      <summary><span><strong>${esc(name)}</strong><span>${esc(brand)} · ${esc(form)}</span></span></summary>
      <div class="resource-body">
        <p>${esc(className)}</p>
        <h3>Indicações em destaque</h3><p>${esc(uses)}</p>
        <h3>Cuidados em destaque</h3><ul>${highlights.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        <div class="resource-links">${external(source)}</div>
      </div>
    </details>`,
      )
      .join("")}
  </div>
  ${emptyResults(`Nenhuma ficha encontrada. Para outros produtos, abra o ${external(medicationSources.leaflets)}.`)}
  <p class="resource-note">Fichas de estudo referentes às apresentações indicadas. Confira no Bulário a edição vigente, a posologia e a lista completa de contraindicações e interações.</p>
  <section class="resource-review-strip">
    <div><h2>Treine leitura de bulas</h2><p>Resolva questões sobre classes, interações e cuidados ao identificar um medicamento.</p></div>
    <a class="btn outline" href="#maps/medicamentos">Iniciar desafio ${icon("arrow", 16)}</a>
  </section>
  <div class="resource-links">${external(medicationSources.reading)}${external(medicationSources.registry)}</div>`;
}

function renderConsultation(route, saved) {
  const detail = route.startsWith("consulta/tema/");
  const leaflets = route === "consulta/bulas";
  let body;
  if (route === "consulta/fontes") body = renderSources();
  else if (route === "consulta/calculadoras") body = renderCalculators();
  else if (leaflets) body = renderMedicationLeaflets();
  else if (detail) {
    const topic = clinicalTopics.find(({ id }) => id === route.split("/")[2]);
    body =
      returnLink("consulta", "Voltar aos protocolos") +
      (topic
        ? `<div class="resource-grid">${protocolCard(topic, saved, true)}</div>`
        : '<p class="empty">Tema indisponível.</p>');
  } else {
    body = `${searchBox(
      "Buscar condição, sigla ou CID-10",
      "Ex.: pressão alta, DM2, J45",
      "Área",
      clinicalTopics.map(({ area }) => area),
      "Todas as áreas",
    )}
      <label class="resource-checkbox"><input type="checkbox" data-resource-bookmarks> Apenas favoritos</label>
      <div class="resource-grid">${clinicalTopics.map((item) => protocolCard(item, saved, false)).join("")}</div>
      ${emptyResults(`Nenhum tema neste filtro. Consulte ${external(references[0])} para outros protocolos.`)}
      <p class="resource-note">Curadoria inicial · fontes consultadas em ${checkedOn}. Os favoritos ficam salvos neste navegador.</p>`;
  }
  return `${heading("Consulta rápida", "Encontre protocolos brasileiros, bulas, diretrizes e fórmulas médicas.")}
    ${tabs(consultationTabs, detail ? "consulta" : route)}
    ${leaflets ? "" : '<p class="resource-note"><a href="/cid-10/">Consultar CID-10 por código ou nome</a></p>'}
    ${body}
    ${!leaflets && route !== "consulta/calculadoras" && route !== "consulta/fontes" ? '<p class="resource-note">Consulta educacional. Abra o documento original para conferir a população, as indicações e a versão aplicável.</p>' : ""}`;
}

function updateSearch(root) {
  const field = root.querySelector("[data-resource-search]");
  if (!field) return;
  const terms = normalize(field.value)
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/^([a-z]\d{2})\.\d+$/, "$1"));
  const group = root.querySelector("[data-resource-filter]")?.value;
  const onlyBookmarks = root.querySelector(
    "[data-resource-bookmarks]",
  )?.checked;
  let count = 0;
  for (const item of root.querySelectorAll("[data-resource-item]")) {
    const result =
      (!group || item.dataset.group === group) &&
      (!onlyBookmarks ||
        item.querySelector("[data-bookmark]").ariaPressed === "true") &&
      terms.every((term) => item.dataset.search.includes(term));
    item.hidden = !result;
    if (result) count++;
  }
  root.querySelector("[data-resource-count]").textContent =
    `${count} ${count === 1 ? "resultado" : "resultados"}`;
  root.querySelector("[data-resource-empty]").hidden = count !== 0;
}

export function mountMedicalResources(container, route) {
  const key = `mdstrike_learning_v1_${state.user?.id ?? "guest"}`;
  const saved = {
    reviews: {},
    cases: {},
    protocols: [],
    ...storage.get(key, {}),
  };
  const save = () => {
    if (!storage.set(key, saved))
      toast("O navegador não conseguiu salvar seu progresso.");
  };
  const isStudy = route.startsWith("study");
  container.innerHTML = `<div class="medical-resources">${isStudy ? renderStudy(route, saved) : renderConsultation(route, saved)}</div>`;
  const root = container.firstElementChild;
  updateSearch(root);

  function clearResult(form) {
    const output = form.querySelector("output");
    output.textContent = "";
    output.classList.remove("error");
  }

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-resource-search]")) updateSearch(root);
    if (event.target.form?.matches("[data-medical-calculator]")) {
      event.target.removeAttribute("aria-invalid");
      clearResult(event.target.form);
    }
  });

  root.addEventListener("change", (event) => {
    if (
      event.target.matches("[data-resource-filter], [data-resource-bookmarks]")
    )
      updateSearch(root);
  });

  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.review) {
      const id = button.dataset.review;
      const previous = saved.reviews[id];
      const next = nextReview(previous, button.dataset.recalled === "true");
      // Multiple answers on the same day must not advance the review interval repeatedly.
      if (
        !previous ||
        previous.due <= Date.now() ||
        button.dataset.recalled === "false"
      )
        saved.reviews[id] = next;
      save();
      button
        .closest(".resource-answer")
        .querySelector("[data-review-date]").textContent =
        `Próxima revisão: ${dateLabel(saved.reviews[id].due)}`;
      if (route === "study/revisao") {
        const scroll = window.scrollY;
        mountMedicalResources(container, route);
        container.querySelector("h2").setAttribute("tabindex", "-1");
        container.querySelector("h2").focus({ preventScroll: true });
        window.scrollTo(0, scroll);
      }
    }
    if (button.dataset.caseNext) {
      const card = button.closest("[data-case]");
      const step = Number(button.dataset.caseNext);
      saved.cases[card.dataset.case] = step;
      save();
      const next = card.querySelector(
        step === 3 ? "[data-case-complete]" : `[data-case-stage="${step}"]`,
      );
      next.hidden = false;
      button.hidden = true;
      card.querySelector("[data-case-status]").textContent = caseStatus(step);
      (next.querySelector("h3") ?? next).focus();
    }
    if (button.dataset.bookmark) {
      const id = button.dataset.bookmark;
      const add = !saved.protocols.includes(id);
      saved.protocols = add
        ? [...saved.protocols, id]
        : saved.protocols.filter((item) => item !== id);
      save();
      button.ariaPressed = String(add);
      button.textContent = add ? "Favoritado" : "Favoritar";
      updateSearch(root);
      if (button.closest("[data-protocol]").hidden)
        root.querySelector("[data-resource-bookmarks]").focus();
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target;
    const calculator = calculators.find(
      ({ id }) => id === form.dataset.medicalCalculator,
    );
    if (!calculator) return;
    event.preventDefault();
    const result = calculateMedicalValue(
      calculator,
      Object.fromEntries(new FormData(form)),
    );
    const output = form.querySelector("output");
    output.classList.toggle("error", Boolean(result.error));
    for (const field of form.querySelectorAll("input, select"))
      field.removeAttribute("aria-invalid");
    if (result.error) {
      output.textContent = result.error;
      if (result.field) {
        const field = form.elements.namedItem(result.field);
        field.setAttribute("aria-invalid", "true");
        field.focus();
      }
      return;
    }
    const value = new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: calculator.precision,
    }).format(result.value);
    output.textContent = [value, calculator.unit].filter(Boolean).join(" ");
  });
  root.addEventListener("reset", (event) => {
    const form = event.target;
    if (!form.matches("[data-medical-calculator]")) return;
    for (const field of form.querySelectorAll("input, select"))
      field.removeAttribute("aria-invalid");
    clearResult(form);
  });
}
