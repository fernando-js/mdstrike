import {
  catalog,
  $,
  esc,
  icon,
  emblem,
  number,
  storage,
  state,
  guest,
  player,
  saveGuest,
  rank,
  specialtyName,
  modeName,
  toast,
  api,
  refreshProfile,
  beep,
} from "./core.js";
import * as views from "./views.js";
import { Match } from "./game.js";

const modal = $("#modal"),
  view = $("#view");
let routeGeneration = 0,
  timer = null,
  answerBusy = false,
  pendingNavigation = null,
  rankingScope = "global";
const nav = [
  ["lobby", "crosshair", "Visão geral"],
  ["maps", "map", "Mapas e especialidades"],
  ["competitions", "trophy", "Competições"],
  ["ranking", "ranking", "Ranking"],
  ["profile", "user", "Meu perfil"],
];

function shell() {
  const active =
    state.page === "match" || state.page === "result" ? "lobby" : state.page;
  $("#top-nav").innerHTML = [
    ["lobby", "Jogar"],
    ["maps", "Mapas"],
    ["competitions", "Competições"],
    ["ranking", "Ranking"],
    ["archive", "Arquivo"],
  ]
    .map(
      ([id, label]) =>
        `<button class="nav-tab ${active === id ? "active" : ""}" data-page="${id}" ${active === id ? 'aria-current="page"' : ""}>${label}</button>`,
    )
    .join("");
  $("#side-nav").innerHTML = nav
    .map(
      ([id, i, label]) =>
        `<button class="side-link ${active === id ? "active" : ""}" data-page="${id}" ${active === id ? 'aria-current="page"' : ""}>${icon(i, 22)}<span>${label}</span></button>`,
    )
    .join("");
  const p = player();
  $("#account-button").innerHTML =
    `<span class="status-dot ${state.user ? "online" : ""}"></span><span>${esc(state.user ? p.nickname : "CONVIDADO")}</span><span aria-hidden="true">⌄</span>`;
  $("#account-button").disabled = state.page === "match";
  $("#sidebar-profile").innerHTML =
    `<div class="row">${icon(state.user ? "user" : "monitor", 24)}<strong>${state.user ? esc(p.nickname) : "Progresso neste<br>dispositivo"}</strong></div><div class="bar"><i style="width:${(p.xp % 500) / 5}%"></i></div><small>${number(p.xp)} XP · nível ${Math.floor(p.xp / 500) + 1}</small>`;
}

async function route(page, force = false) {
  if (state.game && state.page === "match" && page !== "match" && !force) {
    pendingNavigation = page;
    openModal(
      `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Sair da partida?</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>A partida será encerrada sem bônus de conclusão ou pontos no ranking.</p><div class="row wrap"><button class="btn" data-abandon>Encerrar partida</button><button class="btn secondary" data-close>Continuar jogando</button></div></div>`,
    );
    return;
  }
  if (
    ![
      "lobby",
      "maps",
      "competitions",
      "ranking",
      "profile",
      "archive",
      "sources",
    ].includes(page)
  )
    page = "lobby";
  clearInterval(timer);
  state.page = page;
  const generation = ++routeGeneration;
  history.replaceState(null, "", `#${page}`);
  shell();
  view.innerHTML = views[page]();
  window.scrollTo({ top: 0 });
  if (page === "ranking") await loadRanking();
  if (page === "profile" && state.user) {
    try {
      await refreshProfile();
      if (routeGeneration === generation && state.page === "profile") {
        shell();
        view.innerHTML = views.profile();
      }
    } catch (error) {
      toast(error.message);
    }
  }
}

function openModal(html) {
  modal.innerHTML = html;
  if (!modal.open) modal.showModal();
}
function closeModal() {
  modal.close();
}

function auth(type = "login") {
  if (state.user) {
    route("profile");
    return;
  }
  const register = type === "register";
  openModal(`<div class="modal-content"><div class="modal-top"><h2 id="modal-title">${register ? "Crie seu operador." : "De volta ao round."}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>${register ? "Seu nickname no placar. Sua evolução salva entre dispositivos." : "Entre para continuar sua preparação."}</p><div class="auth-tabs"><button data-auth="login" class="${register ? "" : "active"}">Entrar</button><button data-auth="register" class="${register ? "active" : ""}">Criar conta</button></div>
  ${!state.configured ? '<div class="notice">O cadastro será liberado quando o banco for conectado na hospedagem. Você já pode jogar como convidado.</div>' : ""}
  <form class="auth-form" id="auth-form" data-kind="${type}">${register ? `<label class="field"><span>Nickname</span><input name="nickname" placeholder="Seu nome no placar" autocomplete="nickname" minlength="3" maxlength="24" required></label><label class="field"><span>E-mail</span><input type="email" name="email" placeholder="voce@exemplo.com" autocomplete="email" maxlength="190" required></label>` : `<label class="field"><span>E-mail ou nickname</span><input name="identity" placeholder="Seu e-mail ou nickname" autocomplete="username" required></label>`}<label class="field"><span>Senha ${register ? "· mínimo de 10 caracteres" : ""}</span><input type="password" name="password" autocomplete="${register ? "new-password" : "current-password"}" ${register ? 'minlength="10" maxlength="72"' : ""} required></label>${register ? `<label class="field"><span>Especialidade de interesse</span><select name="specialty">${views.specialtyOptions("")}</select></label><label class="check-label"><input type="checkbox" name="consent" required><span>Concordo com a exibição do meu nickname e resultados no ranking. Meu e-mail fica privado. <button class="text-button" type="button" data-privacy>Ver privacidade</button></span></label>` : ""}<div class="form-error" role="alert"></div><button class="btn" type="submit">${register ? "Criar meu operador" : "Entrar na conta"} ${icon("arrow", 18)}</button><button class="text-button" type="button" data-close>Continuar como convidado</button></form></div>`);
}

function mapDetails(id) {
  const s = catalog.specialties.find((s) => s.id === id);
  if (!s) return;
  const exams = catalog.exams.filter((e) => e.specialty === s.id);
  openModal(
    `<img class="modal-hero" src="assets/images/${s.image}.jpg" alt="Ambiente hospitalar ilustrativo"><div class="modal-content"><div class="modal-top"><h2 id="modal-title">${esc(s.name)}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>${esc(s.description)}</p><div class="stat-strip"><div class="stat"><strong>${number(s.questions)}</strong><span>Questões específicas</span></div><div class="stat"><strong>${exams.length}</strong><span>Cadernos oficiais</span></div><div class="stat"><strong>${esc(s.area)}</strong><span>Área-base</span></div></div>${exams.length ? `<h3>Caderno oficial da especialidade</h3>${exams.map((e) => `<div class="source-row"><div><strong>${esc(e.title)}</strong><p>${e.valid} itens válidos · gabarito definitivo</p></div><button class="btn small" data-exam="${e.id}">Jogar ${icon("arrow", 15)}</button></div>`).join("")}` : '<p class="notice">Ainda não há caderno oficial desta especialidade integrado. O treino de base abaixo usa questões da área de formação, sem apresentá-las como prova específica da residência.</p>'}${s.originals ? `<div class="row wrap" style="margin-top:19px"><button class="btn small" data-start="practice" data-map-id="${s.id}">Treinar específicas</button><span class="muted small-text">${s.originals} autorais · sem revisão médica</span></div>` : ""}<div class="row wrap" style="margin-top:16px"><button class="btn outline small" data-start="practice" data-map-id="${s.area}">Treinar base de ${esc(catalog.areas[s.area])}</button></div><p class="small-text muted" style="margin-top:19px">Mapa temático de estudo. Consulte o edital para requisitos de ingresso na residência.</p></div>`,
  );
}

function rules(mode) {
  const details = {
    duel: [
      "Duelo tático",
      [
        "7 questões autorais, sem repetição.",
        "60 segundos por questão. O relógio para durante o comentário.",
        "Acerto: 100 pontos; velocidade: até 50 pontos adicionais.",
        "Você enfrenta um bot identificado, com decisões simuladas.",
        "Maior pontuação vence; empate é derrota. Vitória: +20 de rating; derrota: −12.",
      ],
    ],
    competitive: [
      "Competitivo 5v5",
      [
        "Um jogador real e quatro aliados simulados enfrentam cinco bots.",
        "Até 9 questões diferentes, com 60 segundos cada.",
        "Seu acerto vale duas eliminações; cada aliado ou adversário pode acertar uma.",
        "Mais eliminações vencem o round; empate favorece seu time somente se você acertou.",
        "Primeiro time a vencer 5 rounds ganha. Vitória: +20 de rating; derrota: −12.",
      ],
    ],
    cup: [
      "Copa MD Strike",
      [
        "Quartas de final, semifinal e final contra bots.",
        "Cada fase tem 5 questões diferentes, totalizando até 15.",
        "A pontuação de cada confronto é calculada separadamente.",
        "Vença o placar da fase para avançar. Empate elimina.",
        "Conquiste a copa para ganhar +20 de rating; eliminação: −12.",
      ],
    ],
  };
  const [title, items] = details[mode];
  openModal(
    `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">${title}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><ul class="rule-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul><p class="notice">Convidados têm progresso local. Contas conectadas têm placar calculado pelo servidor e resultados no ranking global. Este ranking é do jogo e não representa nota oficial.</p><button class="btn" data-start="${mode}" data-map-id="all">Entrar na partida</button></div>`,
  );
}

function filterMaps() {
  const search = normalize($("#map-search").value),
    area = $("#map-area").value,
    content = $("#map-content").value;
  const results = catalog.specialties.filter(
    (s) =>
      normalize(s.name).includes(search) &&
      (!area || s.area === area) &&
      (content === "all" ||
        (content === "official" && s.exams.length) ||
        (content === "specific" && s.questions)),
  );
  $("#map-count").textContent =
    `${results.length} mapa${results.length === 1 ? "" : "s"}`;
  $("#maps-grid").innerHTML = results.length
    ? results.map(views.mapCard).join("")
    : '<div class="empty full-width"><h2>Nenhum mapa encontrado.</h2><p>Tente outro nome ou remova um filtro.</p></div>';
}
function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function filterExams() {
  const search = normalize($("#exam-search").value),
    exam = $("#exam-filter").value;
  const results = catalog.exams.filter(
    (e) => normalize(e.title).includes(search) && (!exam || e.exam === exam),
  );
  $("#exam-list").innerHTML = results.length
    ? results.map(views.examRow).join("")
    : '<div class="empty"><h2>Nenhum caderno encontrado.</h2><p>Tente outra busca.</p></div>';
}

async function loadRanking() {
  const container = $("#ranking-content");
  if (!container) return;
  container.innerHTML = '<div class="loading">Consultando classificação…</div>';
  const specialty = $("#ranking-specialty")?.value || "";
  const params =
    rankingScope === "relative"
      ? `&specialty=${encodeURIComponent(specialty)}`
      : rankingScope === "map"
        ? `&map=${encodeURIComponent(specialty)}`
        : "";
  if (rankingScope !== "global" && !specialty) {
    container.innerHTML =
      '<div class="empty"><h2>Escolha uma especialidade.</h2><p>O ranking será calculado para a seleção acima.</p></div>';
    return;
  }
  if (!state.configured) {
    container.innerHTML =
      '<div class="empty">' +
      icon("ranking", 40) +
      "<h2>O ranking global aguarda conexão.</h2><p>Assim que o banco estiver conectado, esta tabela exibirá contas e resultados reais.</p></div>";
    return;
  }
  const scope = rankingScope;
  try {
    const response = await fetch(`api/index.php?action=leaderboard${params}`, {
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Não foi possível consultar.");
    if (
      state.page === "ranking" &&
      rankingScope === scope &&
      $("#ranking-content") === container
    )
      container.innerHTML = views.rankingTable(data.rows);
  } catch (error) {
    if (container.isConnected)
      container.innerHTML = `<div class="empty"><h2>Placar temporariamente indisponível.</h2><p>${esc(error.message)}</p><button class="btn small" data-retry-ranking>Tentar novamente</button></div>`;
  }
}

async function start(options) {
  closeModal();
  if (state.game && state.page === "match") return;
  const button = document.activeElement;
  if (button?.tagName === "BUTTON") button.disabled = true;
  try {
    const match = new Match(options);
    await match.start();
    state.game = match;
    state.page = "match";
    history.replaceState(null, "", "#match");
    ++routeGeneration;
    shell();
    renderMatch();
    window.scrollTo({ top: 0 });
  } catch (error) {
    toast(error.message);
  } finally {
    if (button?.isConnected) button.disabled = false;
  }
}

function tacticalMap(current) {
  const progress = Math.min(
    5,
    Math.ceil(((current.index + 1) / current.total) * 5),
  );
  return `<svg viewBox="0 0 180 150" class="tactical-map" role="img" aria-label="Mapa tático: avanço ${progress} de 5 setores"><g fill="#27383e" stroke="#60777e" stroke-width="1"><path d="M12 12h62v38H12zM104 12h62v38h-62zM12 75h49v58H12zM83 73h83v60H83zM74 25h30v12H74zM30 50h14v25H30zM44 88h39v13H44zM128 50h14v23h-14z"/></g><path d="M40 30h95v70H37" stroke="#f5a524" stroke-width="2" stroke-dasharray="4 5" fill="none"/>${[
    [39, 30],
    [92, 30],
    [135, 30],
    [135, 101],
    [40, 101],
  ]
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${i === progress - 1 ? 7 : 4}" fill="${i < progress ? "#f5a524" : "#425861"}" ${i === progress - 1 ? 'stroke="#fff" stroke-width="1.5"' : ""}/>`,
    )
    .join(
      "",
    )}<text x="18" y="145" fill="#9eafb4" font-size="8" font-family="monospace">SETOR ${progress} / FORMAÇÃO MÉDICA</text></svg>`;
}

function renderMatch() {
  clearInterval(timer);
  answerBusy = false;
  const game = state.game,
    c = game.current,
    q = c.question;
  if (!q) return;
  const versus = c.timeLimit > 0,
    isTeam = c.mode === "competitive",
    official = q.kind === "official";
  const pdfUrl = official ? `${q.pdf}#page=${q.page}&view=FitH` : "";
  view.innerHTML = `<div class="match-page"><div class="match-header"><div><h1>${esc(modeName(c.mode))}</h1><small>${esc(specialtyName(c.map))} · ${state.user ? "Conta conectada" : "Treino local de convidado"}</small></div><button class="btn outline small" data-page="lobby">Sair da partida</button></div>${c.mode === "cup" ? `<div class="bracket">${["Quartas de final", "Semifinal", "Final"].map((name, i) => `<div class="bracket-stage ${c.stage === i ? "active" : ""}"><small>FASE ${i + 1}</small><strong>${name}</strong></div>`).join("")}</div>` : ""}
  <div class="scoreboard"><div><span class="player-name">${isTeam ? "Seu time" : esc(player().nickname)}</span><strong id="my-score">${number(isTeam ? c.roundsWon : c.score)}</strong></div><div><span class="round-counter">ROUND ${c.index + 1} / ${c.total}</span><div class="round-dots">${Array.from({ length: Math.min(15, c.total) }, (_, i) => `<i class="${i < c.index ? "done" : ""}"></i>`).join("")}</div></div><div><span class="player-name enemy">${versus ? (isTeam ? "Time adversário · bots" : "Adversário · bot") : "Precisão"}</span><strong id="opponent-score">${versus ? number(isTeam ? c.roundsLost : c.botScore) : c.index ? Math.round((c.correct / c.index) * 100) + "%" : "—"}</strong></div></div>
  <div class="match-layout" ${official ? 'style="grid-template-columns:minmax(0,1fr)"' : ""}><section class="question-panel ${official ? "pdf-question" : ""}">${c.timeLimit ? `<div class="timer-bar" id="question-timer"><div class="bar"><i id="timer-fill" style="width:100%"></i></div><strong id="time-left">${c.timeLimit}s</strong></div>` : ""}<div class="question-meta"><span>${esc(catalog.areas[q.area] || q.area)}</span><span class="tag ${official ? "official" : ""}">${official ? "Caderno oficial" : "Autoral · demonstração"}</span></div><h2>${esc(q.prompt)}</h2><p class="source-note">${esc(q.source)}${official ? ` · página ${q.page}` : ""}</p>
  ${official ? `<div class="row wrap space-between" style="margin-bottom:14px"><span class="small-text muted">Leia a questão ${q.number} no caderno e marque a alternativa abaixo.</span><a class="source-link" href="${esc(pdfUrl)}" target="_blank" rel="noopener noreferrer">Abrir PDF em outra aba ↗</a></div><iframe title="Caderno original — questão ${q.number}" src="${esc(pdfUrl)}"></iframe>` : ""}
  <div class="answers" role="group" aria-label="Alternativas">${q.options.map((option, i) => `<button class="answer" data-answer="${i}"><span class="answer-letter">${"ABCDE"[i]}</span>${official ? "" : `<span>${esc(option)}</span>`}</button>`).join("")}</div><div id="feedback" aria-live="polite"></div><p class="key-help">Atalhos: ${q.options.length === 5 ? "1–5 ou A–E" : "1–4 ou A–D"} para responder · Enter para continuar</p><div class="match-tools"><button data-sound>${icon("sound", 16)} ${state.sound ? "Som ligado" : "Som desligado"}</button><button data-skip>Pular questão</button></div></section>${!official ? `<aside class="tactical-panel"><h3>Mapa de operação</h3>${tacticalMap(c)}<p>Avance um round por vez. Cada resposta mostra o raciocínio e alimenta seu histórico de estudo.</p><div class="notice">${versus ? "Adversários e aliados são bots." : "Treino sem relógio."}</div><p>As questões autorais ainda precisam de revisão médica.</p></aside>` : ""}</div></div>`;
  if (c.timeLimit) {
    const deadline = performance.now() + c.timeLimit * 1000;
    timer = setInterval(() => {
      const left = Math.max(0, (deadline - performance.now()) / 1000);
      if (!$("#time-left")) {
        clearInterval(timer);
        return;
      }
      $("#time-left").textContent = `${Math.ceil(left)}s`;
      $("#timer-fill").style.width = `${(left / c.timeLimit) * 100}%`;
      $("#question-timer").classList.toggle("low", left < 15);
      if (left <= 0) {
        clearInterval(timer);
        answer(-1);
      }
    }, 150);
  }
}

async function answer(choice) {
  const game = state.game;
  if (!game || game.feedback || answerBusy) return;
  answerBusy = true;
  clearInterval(timer);
  const buttons = [...view.querySelectorAll("[data-answer]")];
  buttons.forEach((b) => (b.disabled = true));
  try {
    const feedback = await game.answer(choice);
    beep(feedback.correct);
    buttons.forEach((b, i) => {
      if (i === feedback.answer) b.classList.add("correct");
      else if (i === choice) b.classList.add("incorrect");
    });
    const c = feedback.state,
      isTeam = game.current.mode === "competitive";
    $("#my-score").textContent = number(isTeam ? c.roundsWon : c.score);
    $("#opponent-score").textContent = game.current.timeLimit
      ? number(isTeam ? c.roundsLost : c.botScore)
      : c.index
        ? Math.round((c.correct / c.index) * 100) + "%"
        : "—";
    $("#feedback").innerHTML =
      `<div class="feedback ${feedback.correct ? "" : "wrong"}"><div class="row space-between"><h3>${choice < 0 ? "Questão não respondida" : feedback.correct ? "Alvo confirmado." : "Ajuste a mira."}</h3><strong>+${feedback.points} pts${feedback.headshot ? " · HEADSHOT" : ""}</strong></div><p>${esc(feedback.explanation)}</p><button class="btn" data-next>${feedback.result ? "Ver resultado" : "Próximo round"} ${icon("arrow", 18)}</button></div>`;
    view.querySelector("[data-next]").focus({ preventScroll: true });
    $("#feedback").scrollIntoView({ block: "nearest", behavior: "smooth" });
    shell();
  } catch (error) {
    buttons.forEach((b) => (b.disabled = false));
    $("#feedback").innerHTML =
      `<div class="notice" role="alert">${esc(error.message)} <button class="text-button" data-retry-question>Tentar novamente</button></div>`;
  } finally {
    answerBusy = false;
  }
}

async function next() {
  const game = state.game;
  if (!game?.feedback || answerBusy) return;
  answerBusy = true;
  try {
    const c = await game.next();
    if (!c) {
      renderResult(game);
      return;
    }
    renderMatch();
    window.scrollTo({ top: 0 });
  } catch (error) {
    toast(error.message);
  } finally {
    answerBusy = false;
  }
}

function renderResult(game) {
  clearInterval(timer);
  const r = game.result;
  state.page = "result";
  shell();
  view.innerHTML = `<div class="result-page"><section class="result-hero">${emblem()}<h1>${r.ranked ? (r.win ? "Vitória confirmada." : "Novo round, nova chance.") : "Treino concluído."}</h1><p>${r.correct} acertos em ${r.answered} questões respondidas.${r.ranked ? " Competição contra bots." : ""} ${state.user ? "Seu resultado foi salvo na conta." : "Seu progresso está salvo neste dispositivo."}</p>${views.statsStrip(
    [
      [number(r.score), "Pontos"],
      [`${Math.round((r.correct / r.answered) * 100)}%`, "Precisão"],
      [`+${r.xp}`, "XP"],
      [
        r.ranked ? `${r.ratingDelta > 0 ? "+" : ""}${r.ratingDelta}` : "—",
        "Variação de rating",
      ],
    ],
  )}<div class="row"><button class="btn" data-rematch>Jogar novamente ${icon("arrow", 18)}</button><button class="btn outline" data-page="lobby">Voltar ao lobby</button></div>${!state.user ? '<p class="small-text">Quer entrar no ranking global? <button class="text-button" data-auth="register">Crie sua conta</button>.</p>' : ""}</section></div>`;
  history.replaceState(null, "", "#result");
  window.scrollTo({ top: 0 });
}

document.addEventListener("click", async (event) => {
  const b = event.target.closest("button,a[data-page]");
  if (!b || b.disabled) return;
  try {
    if (b.hasAttribute("data-page")) {
      event.preventDefault();
      closeModal();
      await route(b.dataset.page);
    } else if (b.hasAttribute("data-close")) closeModal();
    else if (b.hasAttribute("data-auth")) auth(b.dataset.auth);
    else if (b.hasAttribute("data-privacy")) {
      closeModal();
      await route("sources");
    } else if (b.hasAttribute("data-map")) mapDetails(b.dataset.map);
    else if (b.hasAttribute("data-rules")) rules(b.dataset.rules);
    else if (b.hasAttribute("data-mode")) {
      if (b.dataset.mode === "exam") {
        await route("archive");
        return;
      }
      state.mode = b.dataset.mode;
      await route("lobby");
    } else if (b.hasAttribute("data-start"))
      await start({ mode: b.dataset.start, map: b.dataset.mapId || "all" });
    else if (b.hasAttribute("data-exam"))
      await start({ mode: "exam", map: "all", exam: b.dataset.exam });
    else if (b.hasAttribute("data-answer"))
      await answer(Number(b.dataset.answer));
    else if (b.hasAttribute("data-skip")) await answer(-1);
    else if (b.hasAttribute("data-next")) await next();
    else if (b.hasAttribute("data-retry-question")) {
      if (state.game && !state.game.feedback) renderMatch();
    } else if (b.hasAttribute("data-rematch")) {
      const options = state.game.options;
      state.game = null;
      await start(options);
    } else if (b.hasAttribute("data-abandon")) {
      clearInterval(timer);
      await state.game.abort();
      state.game = null;
      closeModal();
      await route(pendingNavigation || "lobby", true);
    } else if (b.hasAttribute("data-sound")) {
      state.sound = !state.sound;
      storage.set("mdstrike_sound", state.sound);
      b.innerHTML = `${icon("sound", 16)} ${state.sound ? "Som ligado" : "Som desligado"}`;
    } else if (b.hasAttribute("data-logout")) {
      await api("logout", {});
      state.user = null;
      state.profile = null;
      await route("lobby");
      toast("Você saiu da conta.");
    } else if (b.hasAttribute("data-ranking")) {
      rankingScope = b.dataset.ranking;
      document.querySelectorAll("[data-ranking]").forEach((el) => {
        el.classList.toggle("active", el === b);
        el.setAttribute("aria-pressed", String(el === b));
      });
      $("#ranking-controls").innerHTML =
        rankingScope === "global"
          ? ""
          : `<div class="filters"><label class="field filter-select"><span>${rankingScope === "relative" ? "Interesse dos jogadores" : "Mapa das partidas"}</span><select id="ranking-specialty"><option value="">Escolha uma especialidade</option>${catalog.specialties.map((s) => `<option value="${s.id}" ${state.user?.specialty === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}${rankingScope === "map" ? views.areaOptions() : ""}</select></label></div>`;
      await loadRanking();
    } else if (b.hasAttribute("data-retry-ranking")) await loadRanking();
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "map-search") filterMaps();
  if (event.target.id === "exam-search") filterExams();
});
document.addEventListener("change", (event) => {
  if (["map-area", "map-content"].includes(event.target.id)) filterMaps();
  if (event.target.id === "exam-filter") filterExams();
  if (event.target.id === "ranking-specialty") loadRanking();
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!["auth-form", "profile-form", "password-form"].includes(form.id)) return;
  event.preventDefault();
  const button = form.querySelector('[type="submit"]'),
    error = form.querySelector(".form-error");
  button.disabled = true;
  error.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "auth-form") {
      data.consent = !!data.consent;
      const result = await api(
        form.dataset.kind === "register" ? "register" : "login",
        data,
      );
      state.user = result.user;
      await refreshProfile();
      closeModal();
      await route("profile");
      toast("Operador conectado. Bem-vindo ao round.");
    }
    if (form.id === "profile-form") {
      if (state.user) {
        const response = await api("update-profile", data);
        state.user = response.user;
        state.profile = response;
      } else {
        if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(data.nickname))
          throw new Error(
            "Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.",
          );
        Object.assign(guest, data);
        saveGuest();
      }
      shell();
      toast("Perfil atualizado.");
    }
    if (form.id === "password-form") {
      await api("change-password", data);
      form.reset();
      toast("Senha atualizada.");
    }
  } catch (e) {
    error.textContent = e.message;
  } finally {
    if (button.isConnected) button.disabled = false;
  }
});
document.addEventListener("keydown", (event) => {
  if (
    state.page !== "match" ||
    modal.open ||
    event.repeat ||
    /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (event.key === "Enter" && state.game?.feedback) {
    event.preventDefault();
    next();
    return;
  }
  const key = event.key.toUpperCase(),
    index = "12345".includes(key) ? "12345".indexOf(key) : "ABCDE".indexOf(key);
  if (
    key.length === 1 &&
    index >= 0 &&
    index < state.game?.current.question.options.length &&
    !state.game.feedback
  ) {
    event.preventDefault();
    answer(index);
  }
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeModal();
  }
});
window.addEventListener("hashchange", () =>
  route(location.hash.slice(1) || "lobby"),
);
window.addEventListener("beforeunload", (event) => {
  if (state.page === "match" && state.game) {
    event.preventDefault();
    event.returnValue = "";
  }
});

async function boot() {
  try {
    const result = await api("session");
    state.csrf = result.csrf;
    state.configured = result.configured;
    state.user = result.user;
  } catch {
    state.configured = false;
  }
  await route(location.hash.slice(1) || "lobby");
}
boot();
