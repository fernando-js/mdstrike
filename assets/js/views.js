import {
  catalog,
  esc,
  icon,
  emblem,
  number,
  player,
  rank,
  state,
  guest,
  specialtyName,
  modeName,
} from "./core.js?v=2.4.0";
import {
  privacyDocument,
  rankingDocument,
  rankingSummary,
} from "./policies.js?v=3.6.1";
import { passwordField } from "./auth-fields.js?v=3.6.0";
import { educationFields } from "./education.js?v=2.4.0";
import { avatarStage } from "./avatar.js?v=2.6.0";
export const heading = (title, description, action = "") =>
  `<div class="breadcrumb"><span>Jogar</span> / ${esc({ lobby: "Lobby", study: "Estudo", consulta: "Consulta rápida", maps: "Mapas", competitions: "Competições", ranking: "Ranking", profile: "Meu perfil", archive: "Arquivo", sources: "Fontes", challenge: "Desafio", admin: "Administração", privacy: "Privacidade", "ranking-rules": "Regras do ranking" }[state.page] || "Lobby")}</div><div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
export const areaOptions = (selected = "", includeGeneral = false) =>
  Object.entries(catalog.areas)
    .filter(([k]) => includeGeneral || k !== "GERAL")
    .map(
      ([key, label]) =>
        `<option value="${key}" ${selected === key ? "selected" : ""}>${esc(label)}</option>`,
    )
    .join("");
export const specialtyOptions = (selected) =>
  `<option value="">Ainda estou explorando</option>${catalog.specialties.map((s) => `<option value="${s.id}" ${selected === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}`;
export const statsStrip = (items) =>
  `<div class="stat-strip">${items.map(([value, label]) => `<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join("")}</div>`;
export function mapCard(s) {
  return `<article class="map-card"><div class="map-image"><img src="assets/images/${s.image}.jpg" alt="Ambiente hospitalar ilustrativo" loading="lazy" width="480" height="270"><span class="map-code">${s.code} / ${esc(s.area)}</span></div><div class="map-card-body"><h3>${icon(s.id === "cardiologia" ? "heart" : s.id === "neurologia" ? "brain" : s.id === "anestesiologia" ? "mask" : "crosshair", 28)}${esc(s.name)}</h3><p>${esc(s.description)}</p><div class="map-card-footer"><small>${s.questions ? `${number(s.questions)} questões específicas` : `Treino de base · ${esc(s.area)}`}</small><button class="btn outline" data-map="${s.id}">Explorar ${icon("arrow", 15)}</button></div></div></article>`;
}
export function lobby() {
  const p = player();
  return (
    heading(
      "Conhecimento é a sua melhor arma.",
      "Estude Medicina com questões comentadas, simulados, casos PBL e ferramentas de consulta.",
      state.user
        ? `<button class="btn" data-new-challenge>Desafiar colega ${icon("trophy", 18)}</button>`
        : '<button class="btn" data-auth="register">Criar conta</button>',
    ) +
    `
<div class="feature-layout"><section class="operation"><img src="assets/images/hospital.jpg" width="1536" height="1024" alt="Corredor de hospital universitário ao pôr do sol" fetchpriority="high"><div class="operation-copy"><h2>Operação ENAMED</h2><p>As sete áreas da formação médica em uma só missão.</p><div class="operation-bottom"><div class="operation-facts"><span>${icon("crosshair", 21)}7 áreas</span><span>${icon("book", 21)}Questões comentadas</span><span>${icon("layers", 21)}Treino por rounds</span></div><button class="btn" data-start="${state.mode}" data-map-id="all">${state.mode === "review" ? "Revisar erros" : "Iniciar treino"} ${icon("arrow", 20)}</button></div></div></section>
<aside class="operator"><h2>Seu operador <span>///</span></h2>${emblem()}<h3>${esc(rank())}</h3><div class="xp">${number(p.xp)} XP</div><div class="bar" role="progressbar" aria-label="Progresso para o próximo nível" aria-valuenow="${p.xp % 500}" aria-valuemin="0" aria-valuemax="500"><i style="width:${(p.xp % 500) / 5}%"></i></div><p>${state.user ? `${esc(p.nickname)}<br>${number(p.rating)} de rating · nível ${Math.floor(p.xp / 500) + 1}` : "Entre para disputar<br>o ranking global."}</p></aside></div>
<div class="mode-strip" role="group" aria-label="Modo de jogo">${[
      ["practice", "crosshair", "Treino livre"],
      ["duel", "bot", "Duelo com bot"],
      ["exam", "clipboard", "Simulado"],
      ["review", "repeat", "Revisar erros"],
    ]
      .map(
        ([id, i, label]) =>
          `<button class="mode-button ${state.mode === id ? "active" : ""}" data-mode="${id}" aria-pressed="${state.mode === id}">${icon(i)}${label}</button>`,
      )
      .join("")}</div>
<div class="lobby-resources">
  <a class="panel lobby-resource" href="#study">${icon("book", 24)}<span><strong>Estudo</strong><small>Resumos, casos PBL e revisões</small></span>${icon("arrow", 18)}</a>
  <a class="panel lobby-resource" href="#consulta">${icon("heart", 24)}<span><strong>Consulta rápida</strong><small>Protocolos, fontes brasileiras e calculadoras</small></span>${icon("arrow", 18)}</a>
  <a class="panel lobby-resource" href="#study/enamed">${icon("clipboard", 24)}<span><strong>Trilha Enamed</strong><small>Caderno oficial, treino por área e revisão</small></span>${icon("arrow", 18)}</a>
  <a class="panel lobby-resource" href="#maps/codificacao">${icon("map", 24)}<span><strong>Codificação em saúde</strong><small>Treine CID-10, SIGTAP e TUSS</small></span>${icon("arrow", 18)}</a>
</div>
<section class="panel lobby-revalida"><div><h2>Operação Revalida</h2><p>Provas anteriores do Inep, simulados e mapas por área.</p></div><button class="btn outline" data-page="revalida">Entrar na operação ${icon("arrow", 16)}</button></section>
<div class="section-heading"><h2>Escolha seu mapa</h2><button class="text-button" data-page="maps">Ver todas as especialidades ${icon("arrow", 16)}</button></div><div class="map-grid">${["cardiologia", "anestesiologia", "neurologia"].map((id) => mapCard(catalog.specialties.find((s) => s.id === id))).join("")}</div>`
  );
}
export function maps() {
  return (
    heading(
      "O próximo round tem endereço.",
      "55 especialidades. Escolha seu território de estudo.",
    ) +
    `<section class="resource-review-strip"><div><h2>Codificação em saúde</h2><p>Pratique diagnósticos e registros de procedimentos com CID-10, SIGTAP e TUSS.</p></div><a class="btn outline" href="#maps/codificacao">Abrir mapa ${icon("arrow", 16)}</a></section>` +
    `<section class="resource-grid coding-modes thematic-maps" aria-label="Mapas temáticos">
      <article class="panel coding-mode"><h2>História da Medicina</h2><p>Vacinas, descobertas e marcos da saúde no Brasil e no mundo.</p><a class="btn outline" href="#maps/historia-medicina">Jogar História da Medicina ${icon("arrow", 16)}</a></article>
      <article class="panel coding-mode"><h2>Epônimos em Medicina</h2><p>Identifique sinais e manobras da prática clínica.</p><a class="btn outline" href="#maps/eponimos">Jogar Epônimos ${icon("arrow", 16)}</a></article>
      <article class="panel coding-mode"><h2>Medicamentos e bulas</h2><p>Reconheça classes, interações e cuidados lendo bulas.</p><a class="btn outline" href="#maps/medicamentos">Jogar Medicamentos ${icon("arrow", 16)}</a></article>
    </section>` +
    `<div class="filters"><label class="field search-field"><span>Buscar especialidade</span><input id="map-search" type="search" placeholder="Cardiologia, anestesiologia, neurologia…" autocomplete="off"></label><label class="field filter-select"><span>Área de formação</span><select id="map-area"><option value="">Todas as áreas</option>${areaOptions()}</select></label><label class="field filter-select"><span>Conteúdo</span><select id="map-content"><option value="all">Todos os mapas</option><option value="official">Com caderno oficial</option><option value="specific">Com questões específicas</option></select></label><span class="filter-count" id="map-count">55 mapas</span></div><div class="map-grid" id="maps-grid">${catalog.specialties.map(mapCard).join("")}</div><p class="notice">Os mapas sem banco específico oferecem treino da área-base, identificado na seleção. Os cadernos de pré-requisito seguem a especialidade indicada pela banca.</p>`
  );
}
export function competitions() {
  return (
    heading(
      "Entre na competição.",
      "Rounds curtos. Decisões rápidas. Conhecimento que fica.",
    ) +
    `<section class="panel challenge-intro"><div><h2>Convide um colega para o round.</h2><p>Gere um link, responda às mesmas questões e compare os resultados. Cada um joga no seu horário.</p></div><button class="btn" data-new-challenge>Criar desafio ${icon("arrow", 18)}</button></section><section class="panel" style="margin-bottom:24px"><h2>Meus desafios</h2><div id="my-challenges"><p class="muted">Carregando seus links…</p></div></section><div class="competition-list">${[
      [
        "duel",
        "1v1",
        "Duelo tático",
        "Você e um bot encaram sete questões diferentes. Acertos e velocidade definem o placar.",
        "7 questões",
        "60 s por round",
        "+20 / −12 rating",
      ],
      [
        "competitive",
        "5v5",
        "Operação em equipe",
        "Você joga com quatro aliados simulados contra cinco bots. Seu acerto vale duas eliminações. O primeiro time a vencer cinco rounds leva a partida.",
        "Até 9 rounds",
        "Times simulados",
        "Primeiro a 5",
      ],
      [
        "cup",
        "COPA",
        "Copa MD Strike",
        "Passe pelas quartas, semifinal e final. Cada confronto tem cinco questões; empates favorecem o bot. Uma derrota encerra sua campanha.",
        "3 confrontos",
        "Até 15 questões",
        "Mata-mata",
      ],
      [
        "exam",
        "INEP",
        "Cadernos oficiais",
        "Leia as questões no PDF original e responda no jogo. A correção usa o gabarito definitivo; itens anulados ou excluídos não entram na partida.",
        "ENAMED + ENARE R+",
        "Sem limite por questão",
        "Sem alterar rating",
      ],
    ]
      .map(
        ([mode, code, title, desc, a, b, c]) =>
          `<article class="competition"><div class="competition-number">${code}</div><div><h2>${title}</h2><p>${desc}</p><div class="details"><span>${a}</span><span>${b}</span><span>${c}</span></div></div><div class="competition-actions"><button class="btn" ${mode === "exam" ? 'data-page="archive"' : `data-start="${mode}" data-map-id="all"`}>${mode === "exam" ? "Escolher caderno" : "Jogar agora"} ${icon("arrow", 18)}</button>${mode !== "exam" ? `<button class="text-button" data-rules="${mode}">Ver regulamento</button>` : ""}</div></article>`,
      )
      .join(
        "",
      )}</div><div class="notice">Duelo, competitivo e copa são contra bots. Desafios por link comparam colegas reais, cada um no seu horário. O ranking global reúne resultados de contas reais; não representa classificação oficial no ENAMED ou ENARE.</div>`
  );
}
export function archive() {
  const exams = catalog.exams.filter((exam) => exam.operation !== "revalida");
  return (
    heading(
      "Seu arsenal de estudo.",
      "Cadernos originais. Fontes verificáveis. Correção transparente.",
    ) +
    `<div class="stat-strip"><div class="stat"><strong>${number(exams.length)}</strong><span>Cadernos oficiais integrados</span></div><div class="stat"><strong>${number(exams.reduce((sum, exam) => sum + exam.total, 0))}</strong><span>Itens referenciados nos cadernos</span></div><div class="stat"><strong>55</strong><span>Especialidades no catálogo</span></div><div class="stat"><strong>54</strong><span>Questões autorais de treino</span></div></div><div class="filters"><label class="field search-field"><span>Buscar caderno</span><input id="exam-search" type="search" placeholder="ENAMED, cardiologia, cirurgia…"></label><label class="field filter-select"><span>Prova</span><select id="exam-filter"><option value="">Todas as provas</option><option value="ENAMED">ENAMED</option><option value="ENARE R+">ENARE com pré-requisito</option></select></label></div><div class="notice">O ENAMED é realizado desde 2025. No ENARE, a nota do ENAMED é usada para acesso direto; pré-requisito tem cadernos próprios. A seleção do jogo não equivale à inscrição nos exames. <a href="https://www.gov.br/pt-br/servicos/fazer-o-exame-nacional-de-avaliacao-da-formacao-medica" target="_blank" rel="noopener noreferrer">Entenda na fonte oficial ↗</a></div><div class="panel" id="exam-list">${exams.map(examRow).join("")}</div><p class="notice">Esta versão integra ENAMED 2025 e ENARE R+ 2024/25. Para edições mais recentes, consulte os portais oficiais abaixo. As 54 questões autorais são demonstrações e precisam de revisão médica.</p><div class="section-heading" style="margin-top:28px"><h2>Direto da fonte</h2></div><div class="panel">${catalog.sources.map((s) => `<div class="source-row"><h3>${esc(s.title)}</h3><a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Consultar ${icon("arrow", 16)}</a></div>`).join("")}</div>`
  );
}
export function booklet(exam) {
  return (
    heading(
      exam.title,
      `${exam.valid} questões válidas · gabarito ${exam.keyStatus.toLowerCase()}`,
    ) +
    `<p class="section-return"><a class="text-button" data-back-route href="#${exam.operation === "revalida" ? "revalida" : "archive"}">‹ Voltar ${exam.operation === "revalida" ? "ao Revalida" : "ao arquivo de provas"}</a></p>` +
    `<section class="panel"><p>${exam.operation === "revalida" ? "Simulado cronometrado para jogar com conta ou como convidado." : "Resolva o caderno na ordem da prova e confira o gabarito após cada questão."}</p><div class="row wrap"><button class="btn" data-exam="${esc(exam.id)}">Jogar caderno ${icon("arrow", 16)}</button><a class="text-button" href="${esc(exam.originalUrl)}">Caderno original</a><a class="text-button" href="${esc(exam.key)}">Gabarito definitivo</a></div></section>`
  );
}
export function examRow(e) {
  return `<article class="source-row"><div><div class="row wrap"><h3><a href="#caderno/${esc(e.id)}">${esc(e.title)}</a></h3><span class="tag official">${esc(e.keyStatus)}</span></div><p>${e.total} itens no caderno · ${e.valid} válidos para jogar · ${e.cancelled.length} anulados/excluídos</p></div><div class="row"><a class="text-button" href="${esc(e.pdf)}" target="_blank" rel="noopener noreferrer">PDF ↗</a><button class="btn outline" data-exam="${e.id}">Jogar caderno ${icon("arrow", 16)}</button></div></article>`;
}
export function ranking() {
  return (
    heading(
      "O conhecimento sobe de patente.",
      "Compare seu desempenho com jogadores reais do MD Strike.",
    ) +
    `<div class="segmented" role="group" aria-label="Escopo do ranking"><button data-ranking="global" class="active" aria-pressed="true">Ranking global</button><button data-ranking="relative" aria-pressed="false">Por especialidade</button><button data-ranking="map" aria-pressed="false">Por mapa jogado</button></div><div id="ranking-controls"></div><div id="ranking-content"><div class="loading">Consultando classificação…</div></div><div class="notice">${esc(rankingSummary)} <button class="text-button" data-page="ranking-rules">Ler as regras completas ↗</button></div><div class="section-heading" style="margin-top:26px"><h2>Patentes do MD Strike</h2></div><div class="badge-list">${[
      [0, "Recruta"],
      [900, "Prata I"],
      [1000, "Prata Elite"],
      [1100, "Ouro I"],
      [1250, "Ouro Elite"],
      [1400, "Guardião"],
      [1600, "Águia"],
      [1800, "Mestre Supremo"],
      [2000, "Elite Global"],
    ]
      .map(([min, label]) => `<span class="tag">${label} · ${min}+</span>`)
      .join("")}</div>`
  );
}
export function rankingTable(rows) {
  if (!rows.length)
    return `<div class="empty">${icon("trophy", 42)}<h2>O primeiro lugar está em aberto.</h2><p>Conclua uma partida com sua conta para entrar na classificação.</p><button class="btn" ${state.user ? 'data-page="competitions"' : 'data-auth="register"'}>${state.user ? "Escolher competição" : "Criar minha conta"}</button></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Posição</th><th>Operador</th><th>Patente</th><th>Especialidade</th><th>Rating</th><th>Pontos</th><th>Partidas</th></tr></thead><tbody>${rows.map((u, i) => `<tr class="${state.user?.id === u.id ? "you" : ""}"><td class="rank-position">${String(i + 1).padStart(2, "0")}</td><td>${esc(u.nickname)}${state.user?.id === u.id ? " · você" : ""}</td><td>${esc(u.rank)}</td><td>${esc(specialtyName(u.specialty))}</td><td>${number(u.rating)}</td><td>${number(u.points)}</td><td>${number(u.played)}</td></tr>`).join("")}</tbody></table></div>`;
}
function securityPanel(user) {
  const hasPassword = user.hasPassword !== false;
  const password = hasPassword
    ? `<h2>Alterar senha</h2><form id="password-form" class="auth-form">
        ${passwordField({ id: "profile-current-password", name: "currentPassword", label: "Senha atual" })}
        ${passwordField({ id: "profile-new-password", label: "Nova senha", isNew: true, showRules: true })}
        <div class="form-error" role="alert"></div>
        <button class="btn small" type="submit">Atualizar senha</button>
      </form>`
    : `<h2>Senha da conta</h2><p>Você criou a conta com Google.</p>
      ${state.passwordResetAvailable ? '<button class="btn outline small" type="button" data-forgot-password>Criar senha por e-mail</button>' : ""}`;
  const google = state.googleAuthAvailable && !user.isAdmin
    ? `<div class="profile-google"><h3>Conta do Google</h3>${user.googleLinked
      ? '<p class="muted">Conta do Google vinculada.</p>'
      : '<button class="btn outline small" type="button" data-google-link>Vincular conta do Google</button>'}</div>`
    : "";
  return `<section class="panel">${password}${google}</section>`;
}

export function profile() {
  const p = player(),
    data = state.profile;
  const stats = state.user
    ? data?.stats || []
    : Object.entries(guest.stats).map(([area, s]) => ({ area, ...s }));
  return (
    heading(
      "Seu operador. Sua evolução.",
      "Acompanhe cada round da sua preparação.",
    ) +
    `
<div class="profile-header"><div id="profile-avatar">${avatarStage(p.avatar, "Avatar de " + p.nickname)}</div><div><h2>${esc(p.nickname)}</h2><p>${esc(rank())} · ${state.user ? "Conta conectada" : "Convidado · progresso neste dispositivo"}${p.specialty ? " · " + esc(specialtyName(p.specialty)) : ""}</p><div class="row wrap"><button class="btn outline small" data-customize-avatar>Personalizar avatar</button><a class="btn outline small" href="#study/enamed">Trilha Enamed</a></div></div></div>
${!state.user ? `<div class="notice">Seu progresso de convidado fica neste navegador. Crie uma conta para ter histórico no servidor e participar do ranking global. O progresso local não é enviado ao ranking.<div class="row" style="margin-top:14px"><button class="btn small" data-auth="register">Criar conta</button><button class="text-button" data-auth="login">Já tenho conta</button></div></div>` : ""}
${statsStrip([
  [number(p.xp), "XP acumulado"],
  [number(p.points), "Pontos"],
  [
    p.answered ? `${Math.round((p.correct / p.answered) * 100)}%` : "—",
    "Precisão",
  ],
  [
    state.user && p.played ? `#${number(data?.position || 1)}` : "—",
    "Posição global",
  ],
])}
<div class="two-col"><section class="panel"><h2>Identidade do operador</h2><form id="profile-form" class="form-grid"><label class="field"><span>Nickname</span><input name="nickname" value="${esc(p.nickname)}" minlength="3" maxlength="24" required></label>${state.user ? `<label class="field"><span>E-mail da conta (privado)</span><input value="${esc(p.email)}" type="email" readonly></label>` : ""}<label class="field"><span>Especialidade de interesse</span><select name="specialty">${specialtyOptions(p.specialty)}</select></label><label class="field"><span>Status</span><select name="status">${[
      ["available", "Disponível"],
      ["studying", "Estudando"],
      ["away", "Ausente"],
    ]
      .map(
        ([id, n]) =>
          `<option value="${id}" ${p.status === id ? "selected" : ""}>${n}</option>`,
      )
      .join(
        "",
      )}</select></label>${educationFields(p)}<div class="full-width form-error" role="alert"></div><div class="full-width row wrap"><button class="btn small" type="submit">Salvar perfil</button>${state.user ? '<button class="text-button" type="button" data-logout>Sair da conta</button>' : ""}</div></form></section>
<section class="panel"><h2>Precisão por área</h2>${Object.entries(catalog.areas)
      .map(([key, label]) => {
        const s = stats.find((s) => s.area === key);
        if (!s && !["CM", "CIR", "GO", "PED", "MFC", "SM", "SC"].includes(key))
          return "";
        const total = Number(s?.answered || 0),
          correct = Number(s?.correct || 0),
          percent = total ? Math.round((correct / total) * 100) : 0;
        return `<div class="area-stat"><div class="row space-between"><span>${esc(label)}</span><span class="muted">${total ? `${percent}% · ${number(total)}` : "sem respostas"}</span></div><div class="bar"><i style="width:${percent}%"></i></div></div>`;
      })
      .join("")}</section></div>
<div class="two-col" style="margin-top:24px"><section class="panel"><h2>Últimas partidas</h2>${(data?.history || guest.history).length ? (data?.history || guest.history).map((h) => `<div class="history-row"><div>${esc(modeName(h.mode))}<small>${esc(specialtyName(h.map_id))} · ${new Date(Number(h.finished_at) * 1000).toLocaleDateString("pt-BR")}</small></div><strong>${number(h.score)} pts</strong></div>`).join("") : "<p>Nenhuma partida concluída ainda. Seu próximo round começa no lobby.</p>"}</section>${state.user ? securityPanel(p) : `<section class="panel"><h2>Fila de revisão</h2><p>${number(guest.wrong.length)} questões esperando um novo round.</p><button class="btn small" style="margin-top:18px" data-start="review" data-map-id="all">Revisar meus erros</button></section>`}</div>`
  );
}
export function sources() {
  return (
    heading(
      "Transparência faz parte do jogo.",
      "Conteúdo, dados e regras do MD Strike.",
    ) +
    `<div class="prose"><h2>Como o conteúdo funciona</h2><p>Os cadernos oficiais são exibidos em PDF, com identificação da banca, edição e questão. As respostas são comparadas aos gabaritos definitivos. Questões anuladas ou excluídas não entram nas partidas. Comentários clínicos não são atribuídos ao Inep ou à FGV.</p><p>As questões autorais do protótipo são identificadas como demonstração, ainda sem revisão médica. São exercícios educacionais, não orientações para atendimento de pacientes.</p><h2>ENAMED e ENARE</h2><p>O ENAMED começou em 2025. Sua nota pode ser usada na seleção de residência de acesso direto do ENARE, mediante as inscrições e regras dos editais. As seleções com pré-requisito usam provas próprias. Consulte sempre o edital da edição desejada; o jogo não realiza inscrições nem calcula nota TRI.</p><h2>Especialidades e mapas</h2><p>O catálogo reúne as 55 especialidades reconhecidas pelo CFM. Mapas sem questões próprias indicam treino da área-base. A presença no catálogo não significa oferta de vaga de residência, tipo de acesso ou existência de caderno específico no ENARE.</p><h2>Privacidade e regras</h2><p>Os dados usados, os registros de atividade e os prazos de retenção estão descritos na política. As regras explicam pontuação, rating, desempates e desafios.</p><div class="row wrap"><button class="btn secondary small" data-page="privacy">Política de privacidade</button><button class="btn secondary small" data-page="ranking-rules">Regras do ranking</button></div><h2>Fontes consultadas</h2>${catalog.sources.map((s) => `<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></p>`).join("")}<p>Conteúdo e links verificados em 17/11/2026.</p></div>`
  );
}

export function privacy() {
  return (
    heading(
      "Política de privacidade.",
      "Como os dados são usados no MD Strike.",
    ) + privacyDocument
  );
}
export function rankingRules() {
  return (
    heading(
      "Regras do ranking.",
      "Pontuação, classificação e desafios entre colegas.",
    ) + rankingDocument
  );
}
