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
} from "./core.js?v=2.4.0";
import * as views from "./views.js?v=3.6.3";
import { googleButton, passwordField, setPasswordVisibility } from "./auth-fields.js?v=3.6.0";
import {
  clearSavedViews,
  focusPage,
  previousRoute,
  rememberView,
  restoreActiveUrl,
  restoreView,
  setRouteHistory,
} from "./app-navigation.js?v=3.1.0";
import { mountMedicalResources, renderEnamedProgress } from "./medical-resources.js?v=3.4.1";
import {
  avatarChoices,
  avatarEditor,
  avatarStage,
  loadAvatarCatalog,
  updateAvatarEditor,
} from "./avatar.js?v=2.6.0";
import { Match } from "./game.js?v=2.8.0";
import { renderPdf } from "./pdf-viewer.js?v=2.4.0";
import {
  challengeForm,
  challengePage,
  loadMyChallenges,
  shareChallenge,
  updateChallengeOptions,
} from "./challenges.js?v=3.7.4";
import { openAdmin, stopAdmin } from "./admin.js?v=2.9.3";
import { mountEducation, educationFromForm } from "./education.js?v=2.4.0";
import {
  RevalidaSimulation,
  formatClock,
  revalidaPage,
  revalidaResult,
  revalidaStartForm,
} from "./revalida.js?v=2.9.0";

const modal = $("#modal"),
  view = $("#view");
let routeGeneration = 0,
  timer = null,
  answerBusy = false,
  pendingNavigation = null,
  rankingScope = "global",
  rankingRequest = 0;
const nav = [
  ["lobby", "crosshair", "Visão geral"],
  ["study", "book", "Estudo"],
  ["consulta", "heart", "Consulta rápida"],
  ["maps", "map", "Mapas e especialidades"],
  ["archive", "clipboard", "Arquivo de provas"],
  ["revalida", "clipboard", "Revalida"],
  ["tea", "mask", "Operação TEA"],
  ["competitions", "trophy", "Competições"],
  ["ranking", "ranking", "Ranking"],
  ["profile", "user", "Meu perfil"],
];
const topNav = [
  ["lobby", "Jogar"],
  ["study", "Estudo"],
  ["consulta", "Consulta rápida"],
  ["maps", "Mapas"],
  ["competitions", "Competições"],
  ["ranking", "Ranking"],
  ["archive", "Arquivo"],
  ["revalida", "Revalida"],
  ["tea", "TEA"],
];

function shell() {
  const active =
    state.page === "challenge"
      ? "competitions"
      : state.page === "booklet"
        ? "archive"
        : state.page === "match" || state.page === "result"
        ? "lobby"
        : state.page;
  const links = [
    ...topNav,
    ...(state.user?.isAdmin ? [["admin", "Admin"]] : []),
  ];
  const current = (id) => active === id ? 'aria-current="page"' : "";
  $("#top-nav").innerHTML = links.map(([id, label], index) =>
    `<a href="#${id}" class="nav-tab ${index < 3 ? "nav-primary" : ""} ${active === id ? "active" : ""}" ${current(id)}>${label}</a>`,
  ).join("") + `<details class="mobile-menu" id="mobile-menu">
    <summary>Menu</summary>
    <div>${[...links.slice(3), ["profile", "Meu perfil"]].map(([id, label]) =>
      `<a href="#${id}" ${current(id)}>${label}</a>`,
    ).join("")}</div>
  </details>`;
  $("#side-nav").innerHTML = [
    ...nav,
    ...(state.user?.isAdmin ? [["admin", "shield", "Administração"]] : []),
  ]
    .map(
      ([id, i, label]) =>
        `<a href="#${id}" class="side-link ${active === id ? "active" : ""}" ${current(id)}>${icon(i, 22)}<span>${label}</span></a>`,
    )
    .join("");
  const p = player();
  $("#account-button").innerHTML =
    `<span class="status-dot ${state.user ? "online" : ""}"></span><span>${esc(state.user ? p.nickname : "CONVIDADO")}</span><span aria-hidden="true">⌄</span>`;
  $("#account-button").disabled = state.page === "match";
  $("#logout-button").hidden = !state.user;
  $("#logout-button").disabled = state.page === "match";
  $("#sidebar-profile").innerHTML =
    `<div class="row">${icon(state.user ? "user" : "monitor", 24)}<strong>${state.user ? esc(p.nickname) : "Progresso neste<br>dispositivo"}</strong></div><div class="bar"><i style="width:${(p.xp % 500) / 5}%"></i></div><small>${number(p.xp)} XP · nível ${Math.floor(p.xp / 500) + 1}</small>`;
}

async function route(page, force = false, navigation = "push") {
  if (state.game && state.page === "match" && page !== "match" && !force) {
    if (navigation === "traverse") restoreActiveUrl();
    pendingNavigation = page;
    openModal(
      state.game instanceof RevalidaSimulation
        ? '<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Sair do simulado?</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>As alternativas marcadas ficam salvas. O tempo continua contando.</p><div class="row wrap"><button class="btn" data-save-revalida>Salvar e sair</button><button class="btn secondary" data-close>Continuar simulado</button><button class="text-button" data-abandon>Encerrar tentativa</button></div></div>'
        : state.game.current.mode === "challenge"
          ? `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Continuar depois?</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>Sua tentativa fica salva no link. O relógio da questão atual continua contando, mesmo em outra aba.</p><div class="row wrap"><button class="btn" data-save-challenge>Salvar e sair</button><button class="btn secondary" data-close>Continuar jogando</button><button class="text-button" data-abandon>Encerrar minha tentativa</button></div></div>`
          : `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Sair da partida?</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>A partida será encerrada sem bônus de conclusão ou pontos no ranking.</p><div class="row wrap"><button class="btn" data-abandon>Encerrar partida</button><button class="btn secondary" data-close>Continuar jogando</button></div></div>`,
    );
    return;
  }
  if (state.page === "match" && page === "match") return;
  rememberView(view);
  if (page === "result" && state.game?.result) {
    setRouteHistory("result", navigation);
    renderResult(state.game);
    return;
  }
  const invite = /^challenge\/([a-f0-9]{32})$/.exec(page);
  if (invite) {
    state.challengeId = invite[1];
    page = "challenge";
  }
  const adminRoute =
    /^admin(?:\/(overview|users|matches|challenges|logs))?$/.exec(page);
  if (adminRoute) page = state.user?.isAdmin ? "admin" : "lobby";
  const bookletId = /^caderno\/([a-z0-9-]+)$/.exec(page)?.[1];
  const booklet = catalog.exams.find((exam) => exam.id === bookletId);
  if (booklet) page = "booklet";
  const resetRoute = /^reset-password(?:\/([a-f0-9]{64}))?$/.exec(page);
  if (resetRoute) page = "reset-password";
  const thematicRoute = /^(maps\/(?:codificacao(?:\/(cid10|sigtap|tuss|misto|consulta))?|(historia-medicina|eponimos|medicamentos)))$/.exec(page);
  if (thematicRoute) page = "maps";
  const resourcesRoute = /^(study(?:\/(?:pbl|revisao|enamed|resumo\/[a-z0-9-]+|cursos(?:\/ecg(?:\/[a-z-]+)?)?))?|consulta(?:\/(?:bulas|calculadoras|fontes|tema\/[a-z0-9-]+))?)$/.exec(page);
  if (resourcesRoute) page = resourcesRoute[1].split("/")[0];
  stopAdmin();
  if (
    ![
      "lobby",
      "maps",
      "study",
      "consulta",
      "competitions",
      "ranking",
      "profile",
      "archive",
      "revalida",
      "tea",
      "booklet",
      "sources",
      "privacy",
      "ranking-rules",
      "challenge",
      "admin",
      "reset-password",
    ].includes(page) ||
    (page === "booklet" && !booklet)
  )
    page = "lobby";
  clearInterval(timer);
  state.page = page;
  const generation = ++routeGeneration;
  const path =
    resetRoute?.[0] ??
    thematicRoute?.[1] ??
    resourcesRoute?.[1] ??
    (page === "admin"
      ? "admin/" + (adminRoute?.[1] || "overview")
      : page === "challenge"
        ? "challenge/" + state.challengeId
        : booklet
          ? "caderno/" + booklet.id
          : page);
  setRouteHistory(path, navigation);
  shell();
  if (resetRoute) {
    view.innerHTML = resetPasswordPage(resetRoute[1]);
    restoreView(view, navigation);
    focusPage(view);
    return;
  }
  if (thematicRoute) {
    view.innerHTML = '<p class="loading" role="status">Abrindo o mapa…</p>';
    try {
      const { mountCodingGame } = await import("./coding-game.js?v=3.4.0");
      if (routeGeneration !== generation) return;
      mountCodingGame(view, thematicRoute[2] ?? thematicRoute[3]);
    } catch {
      if (routeGeneration !== generation) return;
      view.innerHTML =
        '<section class="empty"><h1>Mapa indisponível</h1><button class="btn outline" data-page="' +
        path +
        '">Tentar novamente</button></section>';
    }
    restoreView(view, navigation);
    focusPage(view);
    return;
  }
  if (page === "tea") {
    view.innerHTML = '<p class="loading" role="status">Abrindo a Operação TEA…</p>';
    try {
      const { mountTea } = await import("./tea.js?v=1.2.0");
      if (routeGeneration !== generation) return;
      mountTea(view);
    } catch {
      if (routeGeneration !== generation) return;
      view.innerHTML = '<section class="empty"><h1>Operação TEA indisponível</h1><button class="btn outline" data-page="tea">Tentar novamente</button></section>';
    }
    restoreView(view, navigation);
    focusPage(view);
    return;
  }
  if (resourcesRoute) {
    if (path.startsWith("study/cursos")) {
      view.innerHTML = '<p class="loading" role="status">Abrindo o curso…</p>';
      try {
        const { mountEcgCourse } = await import("./ecg-course.js?v=3.0.0");
        if (routeGeneration !== generation) return;
        mountEcgCourse(view, path);
      } catch {
        if (routeGeneration !== generation) return;
        view.innerHTML =
          '<section class="empty"><h1>Curso indisponível</h1><button class="btn outline" data-page="study/cursos">Tentar novamente</button></section>';
      }
      restoreView(view, navigation);
      focusPage(view);
      return;
    }
    mountMedicalResources(view, resourcesRoute[1]);
    restoreView(view, navigation);
    focusPage(view);
    if (resourcesRoute[1] === "study/enamed" && state.user && !state.profile) {
      const progress = view.querySelector("[data-enamed-progress]");
      try {
        const profile = await refreshProfile();
        if (routeGeneration === generation)
          renderEnamedProgress(progress, profile.stats);
      } catch (error) {
        if (routeGeneration === generation) {
          progress.innerHTML =
            "<p>O histórico está indisponível no momento.</p>";
        }
      }
    }
    return;
  }
  view.innerHTML =
    page === "challenge"
      ? '<div class="loading">Abrindo o desafio…</div>'
      : page === "admin"
        ? ""
        : page === "revalida"
          ? revalidaPage(state.profile)
          : page === "booklet"
            ? views.booklet(booklet)
            : page === "ranking-rules"
              ? views.rankingRules()
              : views[page]();
  restoreView(view, navigation);
  if (!["admin", "challenge"].includes(page)) focusPage(view);
  if (page === "ranking") await loadRanking();
  if (page === "admin") {
    const ready = openAdmin(adminRoute?.[1] || "overview");
    restoreView(view, navigation);
    focusPage(view);
    await ready;
  }
  if (page === "competitions") await loadMyChallenges();
  if (page === "revalida") {
    const [profile, comparison] = await Promise.allSettled([
      refreshProfile(),
      api("revalida-comparison"),
    ]);
    if (routeGeneration === generation) {
      const scroll = window.scrollY;
      const focused = view.contains(document.activeElement)
        ? document.activeElement
        : null;
      view.innerHTML = revalidaPage(
        profile.status === "fulfilled" ? profile.value : state.profile,
        comparison.status === "fulfilled" ? comparison.value.editions : null,
      );
      if (comparison.status === "rejected")
        $("#revalida-cohort-status").textContent =
          "Resultados indisponíveis no momento.";
      window.scrollTo({ top: scroll });
      if (focused?.id)
        document.getElementById(focused.id)?.focus({ preventScroll: true });
      else if (focused?.tagName === "H1") focusPage(view);
    }
  }
  if (page === "challenge") {
    try {
      const result = await api("challenge", undefined, {
        id: state.challengeId,
      });
      if (generation === routeGeneration) {
        view.innerHTML = challengePage(result);
        restoreView(view, navigation);
        focusPage(view);
      }
    } catch (error) {
      if (generation === routeGeneration) {
        view.innerHTML = `<div class="empty"><h1>Desafio indisponível.</h1><p>${esc(error.message)}</p><button class="btn" data-page="competitions">Ver competições</button></div>`;
        focusPage(view);
      }
    }
  }
  if (page === "profile" && state.user) {
    try {
      await refreshProfile();
      if (routeGeneration === generation && state.page === "profile") {
        const hadTitleFocus =
          document.activeElement === view.querySelector("h1");
        shell();
        view.innerHTML = views.profile();
        if (hadTitleFocus) focusPage(view);
      }
    } catch (error) {
      toast(error.message);
    }
  }
  if (page === "profile" && routeGeneration === generation) {
    loadAvatarCatalog()
      .then(() => {
        if (routeGeneration === generation) renderProfileAvatar();
      })
      .catch(() => {});
    await mountEducation(player());
  }
}

function renderProfileAvatar() {
  const host = $("#profile-avatar");
  if (host) {
    const { avatar, nickname } = player();
    host.innerHTML = avatarStage(avatar, "Avatar de " + nickname);
  }
}

function openModal(html) {
  modal.innerHTML = html;
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
}
function closeModal() {
  modal.close();
}

function forgotPassword() {
  if (!state.passwordResetAvailable) return;
  openModal(`<div class="modal-content">
    <div class="modal-top"><h2 id="modal-title">Esqueci minha senha</h2><button class="close-button" type="button" data-close aria-label="Fechar">×</button></div>
    <p>Informe o e-mail cadastrado na sua conta.</p>
    <form class="auth-form" id="forgot-password-form">
      <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" maxlength="190" value="${esc(state.user?.email || "")}" required></label>
      <div class="form-error" role="alert"></div>
      <button class="btn" type="submit">Enviar link de recuperação</button>
      <button class="text-button" type="button" data-auth="login">Voltar para entrar</button>
    </form>
  </div>`);
  modal.querySelector('input[name="email"]').focus();
}

function resetPasswordPage(token) {
  const body = token
    ? `<form class="auth-form" id="reset-password-form">
        <input type="hidden" name="token" value="${esc(token)}">
        ${passwordField({ id: "reset-password", label: "Nova senha", isNew: true, showRules: true })}
        ${passwordField({ id: "reset-confirmation", name: "confirmation", label: "Confirme a nova senha", isNew: true })}
        <div class="form-error" role="alert"></div>
        <button class="btn" type="submit">Salvar nova senha</button>
      </form>`
    : "<p>Link inválido ou expirado. Solicite um novo link.</p>";
  return `<section class="panel coding-round">
    <h1>Redefinir senha</h1>
    ${body}
    ${state.passwordResetAvailable ? '<p><button class="text-button" type="button" data-forgot-password>Solicitar novo link</button></p>' : ""}
  </section>`;
}

function registrationFields() {
  return `<label class="field"><span>Especialidade de interesse</span><select name="specialty">${views.specialtyOptions("")}</select></label>
    <label class="check-label"><input type="checkbox" name="consent" required><span>Concordo com a exibição pública do meu nickname, especialidade e resultados no ranking e li as <a href="#ranking-rules" target="_blank" rel="noopener noreferrer">regras do ranking</a> e a <a href="#privacy" target="_blank" rel="noopener noreferrer">política de privacidade</a>. Meu e-mail não aparece na classificação pública.</span></label>`;
}

const nicknameField = '<label class="field"><span>Nickname</span><input name="nickname" placeholder="Seu nome no placar" autocomplete="nickname" minlength="3" maxlength="24" required></label>';

function auth(type = "login", message = "") {
  if (state.user) {
    route("profile");
    return;
  }
  if (state.page === "challenge") state.pendingChallenge = state.challengeId;
  if (state.page === "admin") state.pendingAdmin = true;
  const register = type === "register";
  openModal(`<div class="modal-content">
    <div class="modal-top"><h2 id="modal-title">${register ? "Crie seu operador." : "De volta ao round."}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div>
    <p>${register ? "Seu nickname no placar. Sua evolução salva entre dispositivos." : "Entre para continuar sua preparação."}</p>
    <div class="auth-tabs"><button data-auth="login" class="${register ? "" : "active"}">Entrar</button><button data-auth="register" class="${register ? "active" : ""}">Criar conta</button></div>
    ${!state.configured ? '<div class="notice">O cadastro será liberado quando o banco for conectado na hospedagem. Você já pode jogar como convidado.</div>' : ""}
    <form class="auth-form" id="auth-form" data-kind="${type}">
      ${message ? `<div class="notice" role="status">${esc(message)}</div>` : ""}
      ${state.googleAuthAvailable ? googleButton(register ? "Criar conta com Google" : "Entrar com Google", 'type="button" data-google-start') : ""}
      ${register ? `${nicknameField}<label class="field"><span>E-mail</span><input type="email" name="email" placeholder="voce@exemplo.com" autocomplete="email" maxlength="190" required></label>` : '<label class="field"><span>E-mail ou nickname</span><input name="identity" placeholder="Seu e-mail ou nickname" autocomplete="username" required></label>'}
      ${passwordField({ id: "auth-password", isNew: register, showRules: register })}
      ${register ? registrationFields() : ""}
      <div class="form-error" role="alert"></div>
      <button class="btn" type="submit">${register ? "Criar meu operador" : "Entrar na conta"} ${icon("arrow", 18)}</button>
      ${!register && state.passwordResetAvailable ? '<button class="text-button" type="button" data-forgot-password>Esqueci minha senha</button>' : ""}
      <button class="text-button" type="button" data-close>Continuar como convidado</button>
    </form>
  </div>`);
}

function googleSignup(email) {
  openModal(`<div class="modal-content">
    <div class="modal-top"><h2 id="modal-title">Complete seu cadastro</h2><button class="close-button" type="button" data-close aria-label="Fechar">×</button></div>
    <form class="auth-form" id="auth-form" data-kind="google">
      <label class="field"><span>E-mail do Google</span><input type="email" readonly value="${esc(email)}"></label>
      ${nicknameField}
      ${registrationFields()}
      <div class="form-error" role="alert"></div>
      <button class="btn" type="submit">Criar minha conta</button>
      <button class="text-button" type="button" data-auth="login">Voltar para entrar</button>
    </form>
  </div>`);
}

function googleLink() {
  openModal(`<div class="modal-content">
    <div class="modal-top"><h2 id="modal-title">Vincular conta do Google</h2><button class="close-button" type="button" data-close aria-label="Fechar">×</button></div>
    <p>Confirme sua senha do MDStrike. Na tela do Google, escolha a conta com o e-mail ${esc(state.user.email)}.</p>
    <form class="auth-form" id="google-link-form">
      ${passwordField({ id: "google-current-password", name: "currentPassword", label: "Senha atual" })}
      <div class="form-error" role="alert"></div>
      ${googleButton("Continuar com Google", 'type="submit"')}
    </form>
  </div>`);
}

async function startGoogle(data) {
  const { url } = await api("google-start", data);
  const returnPath = location.hash.slice(1);
  if (/^(?:study|consulta|challenge|tea)(?:\/|$)/.test(returnPath)) {
    try { sessionStorage.setItem("mdstrike_google_return", returnPath); } catch {}
  } else {
    try { sessionStorage.removeItem("mdstrike_google_return"); } catch {}
  }
  try {
    if (returnPath === "tea" && state.pendingCreateChallenge === "tea")
      sessionStorage.setItem("mdstrike_google_tea_challenge", "1");
    else sessionStorage.removeItem("mdstrike_google_tea_challenge");
  } catch {}
  location.assign(url);
}

function mapDetails(id) {
  const s = catalog.specialties.find((s) => s.id === id);
  if (!s) return;
  const exams = catalog.exams.filter((e) => e.specialty === s.id);
  openModal(
    `<img class="modal-hero" src="assets/images/${s.image}.jpg" alt="Ambiente hospitalar ilustrativo"><div class="modal-content"><div class="modal-top"><h2 id="modal-title">${esc(s.name)}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>${esc(s.description)}</p><div class="stat-strip"><div class="stat"><strong>${number(s.questions)}</strong><span>Questões específicas</span></div><div class="stat"><strong>${exams.length}</strong><span>Cadernos oficiais</span></div><div class="stat"><strong>${esc(s.area)}</strong><span>Área-base</span></div></div>${exams.length ? `<h3>Caderno oficial da especialidade</h3>${exams.map((e) => `<div class="source-row"><div><strong>${esc(e.title)}</strong><p>${e.valid} itens válidos · gabarito definitivo</p></div><button class="btn small" data-exam="${e.id}">Jogar ${icon("arrow", 15)}</button></div>`).join("")}` : '<p class="notice">Ainda não há caderno oficial desta especialidade integrado. O treino de base abaixo usa questões da área de formação, sem apresentá-las como prova específica da residência.</p>'}${s.originals ? `<div class="row wrap" style="margin-top:19px"><button class="btn small" data-start="practice" data-map-id="${s.id}">Treinar específicas</button><span class="muted small-text">${s.originals} autorais · sem revisão médica</span></div>` : ""}<div class="row wrap" style="margin-top:16px"><button class="btn outline small" data-start="practice" data-map-id="${s.area}">Treinar base de ${esc(catalog.areas[s.area])}</button>${s.id === "cardiologia" ? '<a class="btn outline small" href="#study/cursos/ecg">Curso rápido de ECG</a>' : ""}</div><p class="small-text muted" style="margin-top:19px">Mapa temático de estudo. Consulte o edital para requisitos de ingresso na residência.</p></div>`,
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
    (e) =>
      e.operation !== "revalida" &&
      normalize(e.title).includes(search) &&
      (!exam || e.exam === exam),
  );
  $("#exam-list").innerHTML = results.length
    ? results.map(views.examRow).join("")
    : '<div class="empty"><h2>Nenhum caderno encontrado.</h2><p>Tente outra busca.</p></div>';
}

async function loadRanking() {
  const request = ++rankingRequest;
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
      "<h2>O ranking global aguarda conexão.</h2><p>Assim que o banco estiver conectado, esta tabela exibirá a classificação do MD Strike.</p></div>";
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
      request === rankingRequest &&
      rankingScope === scope &&
      $("#ranking-content") === container
    )
      container.innerHTML = views.rankingTable(data.rows);
  } catch (error) {
    if (
      container.isConnected &&
      request === rankingRequest &&
      state.page === "ranking"
    )
      container.innerHTML = `<div class="empty"><h2>Placar temporariamente indisponível.</h2><p>${esc(error.message)}</p><button class="btn small" data-retry-ranking>Tentar novamente</button></div>`;
  }
}

async function start(options) {
  closeModal();
  if (state.game && state.page === "match") return;
  const button = document.activeElement;
  const fromResult = state.page === "result";
  if (button?.tagName === "BUTTON") button.disabled = true;
  try {
    const match =
      options.mode === "revalida-exam"
        ? new RevalidaSimulation(options)
        : new Match(options);
    await match.start();
    rememberView(view);
    state.game = match;
    state.page = "match";
    setRouteHistory("match", fromResult ? "replace" : "push");
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

const simulationQuestionLabel = (game, index) =>
  `Questão ${game.current.questions[index].number}${game.current.choices[index] === undefined ? "" : " · marcada"}`;

function simulationControls(game) {
  const questions = game.current.questions;
  return `<section class="panel sim-controls" aria-label="Controles do simulado">
    <div class="row space-between wrap"><span><strong id="sim-answered">${number(Object.keys(game.current.choices).length)}</strong> de ${questions.length} marcadas</span><span>Tempo restante <strong id="sim-clock">${formatClock(game.remaining())}</strong></span></div>
    <div class="row wrap sim-nav">
      <button class="btn outline small" data-sim-step="-1" ${game.index === 0 ? "disabled" : ""}>Anterior</button>
      <div class="field"><select id="sim-question-jump" aria-label="Ir para questão">${questions.map((_, index) => `<option value="${index}" ${index === game.index ? "selected" : ""}>${simulationQuestionLabel(game, index)}</option>`).join("")}</select></div>
      <button class="btn outline small" data-sim-step="1" ${game.index === questions.length - 1 ? "disabled" : ""}>Próxima</button>
      <button class="btn small" data-confirm-sim>Entregar simulado</button>
    </div>
  </section>`;
}

function jumpSimulation(index) {
  const game = state.game;
  if (
    !(game instanceof RevalidaSimulation) ||
    answerBusy ||
    index < 0 ||
    index >= game.current.questions.length
  )
    return;
  game.index = index;
  renderMatch();
}

async function submitSimulation() {
  const game = state.game;
  if (
    !(game instanceof RevalidaSimulation) ||
    answerBusy ||
    state.page !== "match"
  )
    return;
  answerBusy = true;
  closeModal();
  try {
    await game.finish();
    renderResult(game);
  } catch (error) {
    toast(error.message);
  } finally {
    answerBusy = false;
  }
}

function renderMatch() {
  clearInterval(timer);
  answerBusy = false;
  const game = state.game;
  const simulation = game instanceof RevalidaSimulation;
  const c = simulation
    ? {
        ...game.current,
        index: game.index,
        total: game.current.questions.length,
        question: game.question,
      }
    : game.current;
  const q = c.question;
  if (!q) return;
  const versus = c.timeLimit > 0 && c.mode !== "challenge",
    isTeam = c.mode === "competitive",
    official = q.kind === "official";
  const roundDots = Math.min(15, c.total);
  const completedDots = Math.floor(c.index * roundDots / c.total);
  const pdfUrl = official ? `${q.pdf}#page=${q.page}&view=FitH` : "";
  view.innerHTML = `<div class="match-page"><div class="match-header"><div><h1>${esc(modeName(c.mode))}</h1><small>${esc(c.map === "tea" ? "Operação TEA" : specialtyName(c.map))} · ${state.user ? "Conta conectada" : "Treino local de convidado"}</small></div><button class="btn outline small" data-page="${c.map === "tea" ? "challenge/" + c.challengeId : c.map.startsWith("revalida-") ? "revalida" : "lobby"}">${simulation ? "Sair do simulado" : "Sair da partida"}</button></div>${c.mode === "cup" ? `<div class="bracket">${["Quartas de final", "Semifinal", "Final"].map((name, i) => `<div class="bracket-stage ${c.stage === i ? "active" : ""}"><small>FASE ${i + 1}</small><strong>${name}</strong></div>`).join("")}</div>` : ""}
  ${simulation ? simulationControls(game) : `<div class="scoreboard"><div><span class="player-name">${isTeam ? "Seu time" : esc(player().nickname)}</span><strong id="my-score">${number(isTeam ? c.roundsWon : c.score)}</strong></div><div><span class="round-counter">ROUND ${c.index + 1} / ${c.total}</span><div class="round-dots">${Array.from({ length: roundDots }, (_, i) => `<i class="${i < completedDots ? "done" : ""}"></i>`).join("")}</div></div><div><span class="player-name enemy">${versus ? (isTeam ? "Time adversário · bots" : "Adversário · bot") : "Precisão"}</span><strong id="opponent-score">${versus ? number(isTeam ? c.roundsLost : c.botScore) : c.index ? Math.round((c.correct / c.index) * 100) + "%" : "—"}</strong></div></div>`}
  <div class="match-layout" ${official ? 'style="grid-template-columns:minmax(0,1fr)"' : ""}><section class="question-panel ${official ? "pdf-question" : ""}">${c.timeLimit ? `<div class="timer-bar" id="question-timer"><div class="bar"><i id="timer-fill" style="width:100%"></i></div><strong id="time-left">${c.timeLimit}s</strong></div>` : ""}<div class="question-meta"><span>${c.map === "tea" ? "Operação TEA · Ponto " + esc(q.point) : esc(catalog.areas[q.area] || q.area)}</span><span class="tag ${official ? "official" : ""}">${official ? "Caderno oficial" : c.map === "tea" ? "Questão autoral" : "Autoral · demonstração"}</span></div><h2>${esc(q.prompt)}</h2><p class="source-note">${q.sourceUrl ? `<a href="${esc(q.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(q.source)}</a>` : esc(q.source)}${official ? ` · página ${q.page}` : ""}</p>
  ${official ? `<div class="row wrap space-between" style="margin-bottom:14px"><span class="small-text muted">Leia a questão ${q.number} na página ${q.page} do caderno e marque a alternativa abaixo.</span><a class="source-link" href="${esc(pdfUrl)}" target="_blank" rel="noopener noreferrer">Abrir PDF em outra aba ↗</a></div><div id="pdf-viewer" class="pdf-viewer" aria-busy="true" aria-label="Página do caderno oficial"><div class="loading">Abrindo a página original…</div></div>` : ""}
  <div class="answers" role="group" aria-label="Alternativas">${q.options.map((option, i) => `<button class="answer" data-answer="${i}" ${simulation ? `aria-pressed="${game.current.choices[game.index] === i}"` : ""}><span class="answer-letter">${"ABCDE"[i]}</span>${official ? "" : `<span>${esc(option)}</span>`}</button>`).join("")}</div><div id="feedback" aria-live="polite"></div><p class="key-help">Atalhos: ${q.options.length === 5 ? "1–5 ou A–E" : "1–4 ou A–D"} para ${simulation ? "marcar uma alternativa" : "responder · Enter para continuar"}</p><div class="match-tools">${simulation ? "<button data-skip>Limpar resposta</button>" : `<button data-sound>${icon("sound", 16)} ${state.sound ? "Som ligado" : "Som desligado"}</button><button data-skip>Pular questão</button>`}</div></section>${!official ? `<aside class="tactical-panel"><h3>Mapa de operação</h3>${tacticalMap(c)}<p>Avance um round por vez. Cada resposta mostra o raciocínio e alimenta seu histórico de estudo.</p><div class="notice">${versus ? "Adversários e aliados são bots." : c.mode === "challenge" ? "Desafio entre colegas. Cada um joga no seu horário." : "Treino sem relógio."}</div><p>As questões autorais ainda precisam de revisão médica.</p></aside>` : ""}</div></div>`;
  if (official) {
    const host = $("#pdf-viewer");
    host.insertAdjacentHTML(
      "beforebegin",
      '<div class="row space-between pdf-toolbar"><span>Página original · use a rolagem para ler</span><div class="row"><button data-pdf-zoom="-0.25" aria-label="Diminuir página">−</button><span id="pdf-zoom">100%</span><button data-pdf-zoom="0.25" aria-label="Ampliar página">+</button></div></div>',
    );
    host.dataset.zoom = "1";
    renderPdf(q);
  }
  if (simulation) {
    timer = setInterval(() => {
      const left = game.remaining();
      $("#sim-clock").textContent = formatClock(left);
      if (!left && !answerBusy) {
        clearInterval(timer);
        submitSimulation();
      }
    }, 500);
  } else if (c.timeLimit) {
    const deadline =
      performance.now() + (c.timeRemaining ?? c.timeLimit) * 1000;
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
  if (game instanceof RevalidaSimulation) {
    answerBusy = true;
    try {
      await game.mark(choice);
      if (state.game !== game || state.page !== "match") return;
      for (const button of view.querySelectorAll("[data-answer]")) {
        button.setAttribute(
          "aria-pressed",
          String(
            game.current.choices[game.index] === Number(button.dataset.answer),
          ),
        );
      }
      $("#sim-answered").textContent = number(
        Object.keys(game.current.choices).length,
      );
      const option = $("#sim-question-jump").selectedOptions[0];
      option.textContent = simulationQuestionLabel(game, game.index);
    } catch (error) {
      toast(error.message);
    } finally {
      answerBusy = false;
    }
    return;
  }
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
    $("#opponent-score").textContent =
      game.current.timeLimit && game.current.mode !== "challenge"
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
  if (game instanceof RevalidaSimulation) {
    view.innerHTML = revalidaResult(game);
    setRouteHistory("result", "replace");
    window.scrollTo({ top: 0 });
    return;
  }
  if (game.current.map.startsWith("revalida-")) {
    view.innerHTML = `<div class="result-page"><section class="result-hero"><h1>Treino Revalida concluído</h1><p>${esc(specialtyName(game.current.map))} · ${r.correct} acertos em ${r.total} questões</p><div class="row wrap"><button class="btn" data-rematch>Treinar novamente</button><button class="btn outline" data-page="revalida">Voltar à Operação Revalida</button></div></section></div>`;
    setRouteHistory("result", "replace");
    window.scrollTo({ top: 0 });
    return;
  }
  view.innerHTML = `<div class="result-page"><section class="result-hero">${emblem()}<h1>${r.ranked ? (r.win ? "Vitória confirmada." : "Novo round, nova chance.") : game.current.mode === "challenge" ? "Desafio registrado." : "Treino concluído."}</h1><p>${r.correct} acertos em ${r.answered} questões respondidas.${r.ranked ? " Competição contra bots." : ""} ${state.user ? "Seu resultado foi salvo na conta." : "Seu progresso está salvo neste dispositivo."}</p>${views.statsStrip(
    [
      [number(r.score), "Pontos"],
      [`${Math.round((r.correct / r.answered) * 100)}%`, "Precisão"],
      [`+${r.xp}`, "XP"],
      [
        r.ranked ? `${r.ratingDelta > 0 ? "+" : ""}${r.ratingDelta}` : "—",
        "Variação de rating",
      ],
    ],
  )}<div class="row wrap">${game.current.mode === "challenge" ? `<button class="btn" data-open-challenge="${game.current.challengeId}">Ver placar do desafio ${icon("trophy", 18)}</button>` : `<button class="btn" data-rematch>Jogar novamente ${icon("arrow", 18)}</button>`}${game.options.exam?.startsWith("enamed-") ? '<button class="btn outline" data-page="study/enamed">Voltar à Trilha Enamed</button>' : ""}<button class="btn outline" data-page="lobby">Voltar ao lobby</button></div>${!state.user ? '<p class="small-text">Quer entrar no ranking global? <button class="text-button" data-auth="register">Crie sua conta</button>.</p>' : ""}</section></div>`;
  setRouteHistory("result", "replace");
  window.scrollTo({ top: 0 });
}

function leaveMatch(page) {
  if (page === previousRoute()) history.back();
  else return route(page, true, "replace");
}

document.addEventListener("click", async (event) => {
  const mobileMenu = $("#mobile-menu");
  if (mobileMenu?.open && !mobileMenu.contains(event.target))
    mobileMenu.open = false;
  const b = event.target.closest("button, a[href^='#']");
  if (!b || b.disabled) return;
  try {
    if (b.matches("a")) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        b.target ||
        b.hasAttribute("download")
      )
        return;
      const page = b.hash.slice(1);
      if (!page) return;
      event.preventDefault();
      if (page === "main") {
        $("#main").focus();
        return;
      }
      if (mobileMenu) mobileMenu.open = false;
      if (location.hash === b.hash) return;
      closeModal();
      if (b.hasAttribute("data-back-route") && page === previousRoute())
        history.back();
      else await route(page);
    } else if (b.hasAttribute("data-jump-to")) {
      const target = document.getElementById(b.dataset.jumpTo);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start" });
    } else if (b.hasAttribute("data-page")) {
      event.preventDefault();
      closeModal();
      await route(b.dataset.page);
    } else if (b.hasAttribute("data-forgot-password")) {
      forgotPassword();
    } else if (b.hasAttribute("data-password-toggle")) {
      setPasswordVisibility(b);
    } else if (b.hasAttribute("data-google-link")) {
      googleLink();
    } else if (b.hasAttribute("data-google-start")) {
      b.disabled = true;
      const error = b.form.querySelector(".form-error");
      error.textContent = "";
      try {
        await startGoogle({});
      } catch (failure) {
        error.textContent = failure.message;
        b.disabled = false;
      }
    } else if (b.hasAttribute("data-customize-avatar")) {
      await loadAvatarCatalog();
      if (state.page === "profile")
        openModal(avatarEditor(player().avatar, Boolean(state.user)));
    } else if (b.hasAttribute("data-new-challenge")) {
      const tea = b.dataset.newChallenge === "tea";
      if (!state.user) {
        state.pendingCreateChallenge = tea ? "tea" : "all";
        auth("login");
        toast("Entre na sua conta para criar o desafio.");
      } else openModal(challengeForm(tea));
    } else if (b.hasAttribute("data-open-challenge")) {
      closeModal();
      await route("challenge/" + b.dataset.openChallenge);
    } else if (b.hasAttribute("data-join-challenge"))
      await start({ mode: "challenge", challenge: b.dataset.joinChallenge });
    else if (b.hasAttribute("data-reload-challenge"))
      await route("challenge/" + state.challengeId);
    else if (
      b.hasAttribute("data-copy-challenge") ||
      b.hasAttribute("data-copy-challenge-link") ||
      b.hasAttribute("data-share-challenge")
    ) await shareChallenge(b);
    else if (b.hasAttribute("data-close")) {
      if (modal.querySelector("#auth-form")) state.pendingCreateChallenge = null;
      closeModal();
    }
    else if (b.hasAttribute("data-auth")) auth(b.dataset.auth);
    else if (b.hasAttribute("data-privacy")) {
      closeModal();
      await route("privacy");
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
      await start({
        mode: b.dataset.start,
        map: b.dataset.mapId || "all",
        ...(b.dataset.examId ? { exam: b.dataset.examId } : {}),
      });
    else if (b.hasAttribute("data-exam")) {
      const exam = catalog.exams.find((entry) => entry.id === b.dataset.exam);
      if (exam?.operation === "revalida") openModal(revalidaStartForm(exam));
      else if (exam) await start({ mode: "exam", map: "all", exam: exam.id });
    } else if (b.hasAttribute("data-sim-step")) {
      jumpSimulation(state.game.index + Number(b.dataset.simStep));
    } else if (b.hasAttribute("data-confirm-sim")) {
      const game = state.game;
      if (!answerBusy)
        openModal(
          `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Entregar simulado?</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>${Object.keys(game.current.choices).length} de ${game.current.questions.length} questões marcadas. Ao entregar, você pode conferir o gabarito.</p><div class="row wrap"><button class="btn" data-submit-sim>Entregar e corrigir</button><button class="btn outline" data-close>Continuar simulado</button></div></div>`,
        );
    } else if (b.hasAttribute("data-submit-sim")) await submitSimulation();
    else if (b.hasAttribute("data-answer"))
      await answer(Number(b.dataset.answer));
    else if (b.hasAttribute("data-skip")) await answer(-1);
    else if (b.hasAttribute("data-next")) await next();
    else if (b.hasAttribute("data-pdf-zoom")) {
      const host = $("#pdf-viewer");
      const zoom = Math.max(
        0.75,
        Math.min(
          2.5,
          Number(host.dataset.zoom || 1) + Number(b.dataset.pdfZoom),
        ),
      );
      host.dataset.zoom = String(zoom);
      $("#pdf-zoom").textContent = `${Math.round(zoom * 100)}%`;
      await renderPdf(state.game.question ?? state.game.current.question, zoom);
    } else if (b.hasAttribute("data-retry-question")) {
      if (state.game && !state.game.feedback) renderMatch();
    } else if (b.hasAttribute("data-rematch")) {
      const options = state.game.options;
      state.game = null;
      await start(options);
    } else if (
      b.hasAttribute("data-save-challenge") ||
      b.hasAttribute("data-save-revalida")
    ) {
      clearInterval(timer);
      state.game = null;
      closeModal();
      await leaveMatch(
        pendingNavigation ||
          (b.hasAttribute("data-save-revalida") ? "revalida" : "competitions"),
      );
    } else if (b.hasAttribute("data-abandon")) {
      clearInterval(timer);
      await state.game.abort();
      state.game = null;
      closeModal();
      await leaveMatch(pendingNavigation || "lobby");
    } else if (b.hasAttribute("data-sound")) {
      state.sound = !state.sound;
      storage.set("mdstrike_sound", state.sound);
      b.innerHTML = `${icon("sound", 16)} ${state.sound ? "Som ligado" : "Som desligado"}`;
    } else if (b.hasAttribute("data-logout")) {
      b.disabled = true;
      try {
        await api("logout", {});
        clearInterval(timer);
        state.user = null;
        state.profile = null;
        state.game = null;
        state.pendingAdmin = false;
        state.pendingChallenge = null;
        state.pendingCreateChallenge = null;
        pendingNavigation = null;
        closeModal();
        await route("lobby", true, "replace");
        clearSavedViews();
        toast("Você saiu da conta.");
      } finally {
        b.disabled = false;
      }
    } else if (b.hasAttribute("data-ranking")) {
      rankingScope = b.dataset.ranking;
      document.querySelectorAll("[data-ranking]").forEach((el) => {
        el.classList.toggle("active", el === b);
        el.setAttribute("aria-pressed", String(el === b));
      });
      $("#ranking-controls").innerHTML =
        rankingScope === "global"
          ? ""
          : `<div class="filters"><label class="field filter-select"><span>${rankingScope === "relative" ? "Interesse dos jogadores" : "Mapa das partidas"}</span><select id="ranking-specialty"><option value="">Escolha uma especialidade</option>${catalog.specialties.map((s) => `<option value="${s.id}" ${state.user?.specialty === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}${rankingScope === "map" ? '<option value="all">Todas as áreas</option><option value="tea">Operação TEA</option>' + views.areaOptions() : ""}</select></label></div>`;
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
  updateAvatarEditor(event);
  updateChallengeOptions(event.target);
  if (["map-area", "map-content"].includes(event.target.id)) filterMaps();
  if (event.target.id === "exam-filter") filterExams();
  if (event.target.id === "sim-question-jump")
    jumpSimulation(Number(event.target.value));
  if (event.target.id === "ranking-specialty") loadRanking();
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (
    ![
      "auth-form",
      "profile-form",
      "password-form",
      "forgot-password-form",
      "reset-password-form",
      "google-link-form",
      "challenge-form",
      "revalida-start-form",
      "avatar-form",
    ].includes(form.id)
  )
    return;
  event.preventDefault();
  const button = form.querySelector('[type="submit"]'),
    error = form.querySelector(".form-error");
  button.disabled = true;
  error.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    if (form.id === "google-link-form") {
      await startGoogle({ currentPassword: data.currentPassword });
      return;
    }
    if (form.id === "forgot-password-form") {
      const result = await api("request-password-reset", { email: data.email });
      if (form.isConnected) {
        openModal(
          `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Confira seu e-mail</h2><button class="close-button" type="button" data-close aria-label="Fechar">×</button></div><p>${esc(result.message)}</p><button class="btn outline" type="button" data-auth="login">Voltar para entrar</button></div>`,
        );
        modal.querySelector("[data-auth]").focus();
      }
      return;
    }
    if (form.id === "reset-password-form") {
      if (data.password !== data.confirmation)
        throw new Error("As senhas precisam ser iguais.");
      const result = await api("reset-password", {
        token: data.token,
        password: data.password,
      });
      if (result.sessionEnded) {
        state.user = null;
        state.profile = null;
        clearSavedViews();
      }
      if (form.isConnected) {
        await route("lobby", true, "replace");
        toast("Senha redefinida. Entre com a nova senha.");
        if (!state.user) auth("login");
      } else if (result.sessionEnded) shell();
      return;
    }
    if (form.id === "avatar-form") {
      const selection = avatarChoices(form);
      if (state.user) {
        const { avatar } = await api("save-avatar", selection);
        state.user.avatar = avatar;
      } else {
        const previous = guest.avatar;
        guest.avatar = selection;
        if (!saveGuest()) {
          guest.avatar = previous;
          throw new Error("O navegador não conseguiu salvar o avatar.");
        }
      }
      renderProfileAvatar();
      closeModal();
      toast("Avatar salvo.");
    }
    if (form.id === "revalida-start-form")
      await start({
        mode: "revalida-exam",
        map: "revalida-geral",
        exam: form.dataset.exam,
        ...data,
      });
    if (form.id === "challenge-form") {
      const result = await api("create-challenge", data);
      closeModal();
      await route("challenge/" + result.id);
      toast("Desafio criado. Copie o convite para compartilhar.");
    }
    if (form.id === "auth-form") {
      const returnToResources = ["study", "consulta"].includes(state.page)
        ? location.hash.slice(1)
        : "";
      data.consent = !!data.consent;
      const result = await api(
        form.dataset.kind === "google" ? "google-register" : form.dataset.kind,
        data,
      );
      state.user = result.user;
      await refreshProfile();
      closeModal();
      if (state.pendingAdmin) {
        state.pendingAdmin = false;
        await route("admin");
      } else if (state.pendingChallenge) {
        const id = state.pendingChallenge;
        state.pendingChallenge = null;
        await route("challenge/" + id);
      } else if (state.pendingCreateChallenge) {
        const tea = state.pendingCreateChallenge === "tea";
        state.pendingCreateChallenge = null;
        await route(tea ? "tea" : "competitions");
        openModal(challengeForm(tea));
      } else await route(returnToResources || "profile");
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
        const profileFields = Object.fromEntries(
          Object.entries(data).filter(
            ([key]) => !key.startsWith("education") && key !== "institution",
          ),
        );
        Object.assign(guest, profileFields);
        if (data.educationStatus !== "keep") {
          guest.education = educationFromForm(data);
          guest.institution = guest.education?.institution || "";
        }
        saveGuest();
      }
      renderProfileAvatar();
      shell();
      toast("Perfil atualizado.");
    }
    if (form.id === "password-form") {
      await api("change-password", data);
      form.reset();
      form.querySelectorAll("[data-password-toggle]").forEach((button) => setPasswordVisibility(button, false));
      toast("Senha atualizada.");
    }
  } catch (e) {
    error.textContent = e.message;
  } finally {
    if (button.isConnected) button.disabled = false;
  }
});
document.addEventListener("keydown", (event) => {
  const mobileMenu = $("#mobile-menu");
  if (event.key === "Escape" && mobileMenu?.open && !modal.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector("summary").focus();
    return;
  }
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
    index <
      (state.game?.question ?? state.game?.current.question)?.options.length &&
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
window.addEventListener("hashchange", () => {
  if (!state.game || state.page !== "match") closeModal();
  route(location.hash.slice(1) || "lobby", false, "traverse");
});
window.addEventListener("beforeunload", (event) => {
  if (state.page === "match" && state.game) {
    event.preventDefault();
    event.returnValue = "";
  }
});

async function boot() {
  const inviteId = /^\/d\/([a-f0-9]{32})\/?$/.exec(location.pathname)?.[1];
  if (inviteId) history.replaceState(history.state, "", "/#challenge/" + inviteId);
  let googleSignupEmail;
  try {
    const result = await api("session");
    state.csrf = result.csrf;
    state.configured = result.configured;
    state.passwordResetAvailable = Boolean(result.passwordResetAvailable);
    state.googleAuthAvailable = Boolean(result.googleAuthAvailable);
    googleSignupEmail = result.googleSignupEmail;
    state.user = result.user;
  } catch {
    state.configured = false;
  }
  const path = location.hash.slice(1);
  const status = /^google-auth\/([a-z-]+)$/.exec(path)?.[1];
  if (!status) {
    const signup = path === "study/enamed" && new URLSearchParams(location.search).get("cadastro") === "enamed";
    if (signup) history.replaceState(history.state, "", "/#study/enamed");
    await route(path || "lobby", false, "traverse");
    if (signup && !state.user) auth("register");
    return;
  }
  let returnPath;
  let teaChallenge = false;
  try {
    returnPath = sessionStorage.getItem("mdstrike_google_return");
    sessionStorage.removeItem("mdstrike_google_return");
    teaChallenge = returnPath === "tea" &&
      sessionStorage.getItem("mdstrike_google_tea_challenge") === "1";
    sessionStorage.removeItem("mdstrike_google_tea_challenge");
  } catch {}
  await route(returnPath || (state.user ? "profile" : "lobby"), false, "traverse");
  if ((status === "signed-in" || status === "linked") && state.user) {
    if (teaChallenge) openModal(challengeForm(true));
    toast(status === "linked" ? "Conta do Google vinculada." : "Você entrou com Google.");
  } else if (status === "signup" && googleSignupEmail && !state.user) {
    if (state.page === "challenge") state.pendingChallenge = state.challengeId;
    if (teaChallenge) state.pendingCreateChallenge = "tea";
    googleSignup(googleSignupEmail);
  } else {
    const message = {
      existing: "Já tem uma conta com esse e-mail? Entre com sua senha e vincule o Google em Meu perfil.",
      "email-mismatch": "Selecione a conta do Google com o mesmo e-mail do seu perfil.",
      "link-conflict": "Esta conta do Google já está vinculada no MDStrike.",
      "unverified-email": "Para criar uma conta com Google, use um endereço Gmail ou Google Workspace. Você também pode criar a conta com e-mail e senha.",
      cancelled: "Você cancelou a entrada com Google.",
    }[status] || "Não foi possível concluir a entrada com Google. Tente novamente.";
    if (state.user) toast(message);
    else auth("login", message);
  }
}
boot();
