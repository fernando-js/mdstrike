import {
  $,
  api,
  catalog,
  esc,
  icon,
  number,
  state,
  specialtyName,
  modeName,
} from "./core.js?v=2.2.2";
import { heading, statsStrip } from "./views.js?v=2.2.2";

let generation = 0;
let section = "overview";
let params = { page: 1, size: 25 };
const tabs = [
  ["overview", "Visão geral"],
  ["users", "Usuários"],
  ["matches", "Partidas"],
  ["challenges", "Desafios"],
  ["logs", "Logs"],
];
const labels = {
  "admin.granted": "Permissão de administrador concedida",
  "account.registered": "Conta criada",
  "auth.login": "Login realizado",
  "auth.login_failed": "Falha no login",
  "auth.logout": "Logout realizado",
  "auth.session_expired": "Sessão expirada",
  "auth.password_changed": "Senha alterada",
  "profile.updated": "Perfil atualizado",
  "match.started": "Partida iniciada",
  "answer.submitted": "Resposta registrada",
  "match.finished": "Partida concluída",
  "match.aborted": "Partida encerrada",
  "challenge.created": "Desafio criado",
  "challenge.joined": "Participação em desafio",
  "challenge.resumed": "Desafio retomado",
  "admin.viewed": "Consulta administrativa",
  "admin.denied": "Acesso administrativo negado",
  "api.error": "Erro na API",
};
const stamp = (value) =>
  value
    ? new Date(Number(value) * 1000).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
const statusLabel = (value) =>
  ({
    available: "Disponível",
    studying: "Estudando",
    away: "Ausente",
    playing: "Em andamento",
    finished: "Concluída",
    aborted: "Encerrada",
  })[value] || value;
const userButton = (id, name) =>
  id
    ? `<button class="text-button" data-admin-user="${Number(id)}">${esc(name || "#" + id)}</button>`
    : esc(name || "Sistema");

export function stopAdmin() {
  generation++;
}
export async function openAdmin(initial = "overview") {
  section = tabs.some(([id]) => id === initial) ? initial : "overview";
  params = { page: 1, size: 25 };
  if (!state.user) {
    $("#view").innerHTML =
      heading(
        "Área administrativa.",
        "Acesso exclusivo à administração do MD Strike.",
      ) +
      '<div class="empty">' +
      icon("shield", 44) +
      '<h2>Entre com sua conta de administrador.</h2><p>Os dados de usuários e os logs são restritos.</p><button class="btn" data-auth="login">Entrar como administrador</button></div>';
    return;
  }
  if (!state.user.isAdmin) {
    $("#view").innerHTML =
      heading(
        "Acesso restrito.",
        "Sua conta não tem permissão para consultar o painel administrativo.",
      ) +
      '<div class="empty"><h2>Permissão de administrador necessária.</h2><button class="btn" data-page="lobby">Voltar ao jogo</button></div>';
    return;
  }
  await load();
}

function filters() {
  if (section === "overview") return "";
  return `<form id="admin-filter-form" class="filters admin-filters"><label class="field search-field"><span>Busca</span><input type="search" name="search" maxlength="100" value="${esc(params.search || "")}" placeholder="${section === "logs" ? "Usuário, evento ou ID da requisição" : section === "challenges" ? "Criador, código ou mapa" : "Nickname ou e-mail"}"></label>${
    section === "logs"
      ? `<label class="field"><span>Evento</span><select name="event"><option value="">Todos os eventos</option>${Object.entries(
          labels,
        )
          .map(
            ([id, label]) =>
              `<option value="${id}" ${params.event === id ? "selected" : ""}>${label}</option>`,
          )
          .join("")}</select></label>`
      : ""
  }${section === "matches" ? `<label class="field"><span>Modo</span><select name="mode"><option value="">Todos os modos</option>${["practice", "duel", "competitive", "cup", "exam", "review", "challenge"].map((id) => `<option value="${id}" ${params.mode === id ? "selected" : ""}>${modeName(id)}</option>`).join("")}</select></label>` : ""}<label class="field"><span>Desde</span><input type="date" name="from" value="${esc(params.from || "")}"></label><label class="field"><span>Até</span><input type="date" name="to" value="${esc(params.to || "")}"></label><button class="btn small" type="submit">Filtrar</button><button class="text-button" type="button" data-admin-clear>Limpar</button></form>${params.user ? `<p class="notice">Filtrando registros do usuário #${Number(params.user)}. <button class="text-button" data-admin-clear>Remover filtro</button></p>` : ""}`;
}

function pagination(data) {
  return `<div class="row space-between admin-pagination"><span class="muted small-text">${number(data.total)} registros · página ${number(data.page)} de ${number(data.pages)}</span><div class="row"><button class="btn secondary small" data-admin-page="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""}>Anterior</button><button class="btn secondary small" data-admin-page="${data.page + 1}" ${data.page >= data.pages ? "disabled" : ""}>Próxima</button></div></div>`;
}
function table(head, rows) {
  return rows.length
    ? `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
    : '<div class="empty"><h2>Nenhum registro encontrado.</h2><p>Experimente outro filtro ou período.</p></div>';
}
function activity(rows, full = false) {
  return table(
    [
      "Data",
      "Evento",
      "Responsável",
      "Usuário",
      ...(full ? ["IP recebido", "Detalhes"] : []),
    ],
    rows.map(
      (r) =>
        `<tr><td>${stamp(r.created_at)}</td><td><strong>${esc(labels[r.event] || r.event)}</strong><small class="admin-subtext">${esc(r.event)}</small></td><td>${userButton(r.actor_id, r.actor_nickname)}</td><td>${userButton(r.subject_id, r.subject_nickname)}</td>${full ? `<td>${esc(r.client_ip || "Servidor")}</td><td><details class="audit-details"><summary>Ver detalhes</summary><pre>${esc(JSON.stringify(parseMetadata(r.metadata_json), null, 2))}</pre><p>ID: ${esc(r.request_id)}</p><p>Navegador: ${esc(r.user_agent || "Não informado")}</p></details></td>` : ""}</tr>`,
    ),
  );
}
function parseMetadata(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function body(data) {
  if (section === "overview") {
    const s = data.summary;
    return (
      statsStrip([
        [number(s.users), "Usuários cadastrados"],
        [number(s.active7d), "Ativos nos últimos 7 dias"],
        [number(s.matches), "Partidas concluídas"],
        [number(s.challenges), "Desafios criados"],
      ]) +
      `<div class="two-col admin-overview"><section class="panel"><h2>Respostas e desempenho</h2><div class="row space-between"><span>${number(s.answers)} respostas registradas</span><strong class="display accent">${s.answers ? Math.round((s.correct / s.answers) * 100) + "%" : "—"}</strong></div><p class="small-text" style="margin-top:12px">${number(s.correct)} respostas corretas no total.</p><button class="text-button" data-admin-tab="matches" style="margin-top:20px">Consultar histórico de partidas ↗</button></section><section class="panel"><h2>Atividade do sistema</h2><p>${number(s.errors7d)} erros registrados nos últimos 7 dias.</p><p class="small-text" style="margin-top:12px">Início dos logs: ${stamp(s.startedAt)}.</p><button class="text-button" data-admin-tab="logs" style="margin-top:20px">Abrir logs de atividade ↗</button></section></div><div class="section-heading" style="margin-top:28px"><h2>Atividade recente</h2><button class="text-button" data-admin-tab="logs">Ver todos os registros ↗</button></div>${activity(data.recent)}`
    );
  }
  if (section === "users")
    return (
      table(
        [
          "Usuário",
          "E-mail",
          "Especialidade",
          "Status",
          "Rating / XP",
          "Partidas",
          "Cadastro",
          "Última visita",
        ],
        data.rows.map(
          (u) =>
            `<tr><td>${userButton(u.id, u.nickname)}${u.admin_since ? '<small class="admin-subtext accent">Administrador</small>' : ""}</td><td>${esc(u.email)}</td><td>${esc(specialtyName(u.specialty))}</td><td>${esc(statusLabel(u.status))}</td><td>${number(u.rating)} / ${number(u.xp)} XP</td><td>${number(u.played)}</td><td>${stamp(u.created_at)}</td><td>${stamp(u.last_seen)}</td></tr>`,
        ),
      ) + pagination(data)
    );
  if (section === "matches") return matchesTable(data.rows) + pagination(data);
  if (section === "challenges")
    return (
      table(
        [
          "Criador",
          "Mapa",
          "Participantes",
          "Criado em",
          "Validade",
          "Convite",
        ],
        data.rows.map(
          (c) =>
            `<tr><td>${userButton(c.creator_id, c.nickname)}</td><td>${esc(specialtyName(c.map_id))}</td><td>${number(c.participants)}</td><td>${stamp(c.created_at)}</td><td>${stamp(c.expires_at)}</td><td><button class="text-button" data-open-challenge="${esc(c.id)}">Abrir desafio ↗</button><small class="admin-subtext">${esc(c.id)}</small></td></tr>`,
        ),
      ) + pagination(data)
    );
  return activity(data.rows, true) + pagination(data);
}

function matchesTable(rows) {
  return table(
    [
      "Usuário",
      "Modo / mapa",
      "Situação",
      "Pontos",
      "Acertos",
      "Início",
      "Fim",
    ],
    rows.map(
      (m) =>
        `<tr><td>${m.nickname ? userButton(m.user_id, m.nickname) : "#" + m.user_id}</td><td>${esc(modeName(m.mode))}<small class="admin-subtext">${esc(specialtyName(m.map_id))}</small><small class="admin-subtext admin-id">${esc(m.id)}</small></td><td>${statusLabel(m.state)}</td><td>${number(m.score)}</td><td>${m.correct}/${m.question_index}</td><td>${stamp(m.started_at)}</td><td>${stamp(m.finished_at)}</td></tr>`,
    ),
  );
}

async function load() {
  if (state.page !== "admin" || !state.user?.isAdmin) return;
  const current = ++generation;
  history.replaceState(null, "", `#admin/${section}`);
  $("#view").innerHTML =
    heading(
      "Central de comando.",
      "Usuários, partidas e atividade do MD Strike.",
      '<button class="btn outline small" data-admin-reload>Atualizar ' +
        icon("repeat", 18) +
        "</button>",
    ) +
    `<div class="segmented admin-tabs" role="group" aria-label="Consultas administrativas">${tabs.map(([id, label]) => `<button data-admin-tab="${id}" class="${id === section ? "active" : ""}" aria-pressed="${id === section}">${label}</button>`).join("")}</div>${filters()}<div id="admin-content"><div class="loading">Consultando os dados…</div></div><p class="notice">Os logs de atividade têm retenção de 90 dias. Partidas e respostas anteriores permanecem no histórico. Consultas administrativas são registradas; eventos de erro repetidos são limitados para evitar excesso de registros.</p>`;
  try {
    const data = await api("admin-" + section, undefined, params);
    if (current === generation && state.page === "admin")
      $("#admin-content").innerHTML = body(data);
  } catch (error) {
    if (current === generation && $("#admin-content"))
      $("#admin-content").innerHTML =
        `<div class="empty"><h2>Não foi possível consultar.</h2><p>${esc(error.message)}</p><button class="btn small" data-admin-reload>Tentar novamente</button></div>`;
  }
}

async function userDetail(id) {
  const current = ++generation;
  $("#admin-content").innerHTML =
    '<div class="loading">Abrindo o usuário…</div>';
  try {
    const data = await api("admin-user", undefined, { id });
    if (current !== generation || state.page !== "admin") return;
    const u = data.user;
    $("#admin-content").innerHTML =
      `<section class="panel admin-user-detail"><div class="row space-between wrap"><div><h2>${esc(u.nickname)}</h2><p>${esc(u.email)}${u.isAdmin ? " · Administrador" : ""}</p></div><button class="btn secondary small" data-admin-tab="users">Voltar aos usuários</button></div>${statsStrip(
        [
          [number(u.rating), "Rating"],
          [number(u.xp), "XP"],
          [number(u.played), "Partidas concluídas"],
          [
            u.answered ? Math.round((u.correct / u.answered) * 100) + "%" : "—",
            "Precisão",
          ],
        ],
      )}<div class="row wrap"><span class="tag">Cadastro: ${stamp(u.created_at)}</span><span class="tag">Última visita: ${stamp(u.last_seen)}</span><span class="tag">${esc(specialtyName(u.specialty))}</span><span class="tag">${esc(statusLabel(u.status))}</span></div>${u.institution ? `<p class="small-text" style="margin-top:12px">Instituição: ${esc(u.institution)}</p>` : ""}<button class="text-button" data-admin-user-logs="${Number(u.id)}" style="margin-top:20px">Consultar logs deste usuário ↗</button></section><div class="section-heading" style="margin-top:26px"><h2>Últimas partidas</h2></div>${matchesTable(data.matches)}<div class="section-heading" style="margin-top:26px"><h2>Últimas respostas</h2></div>${table(
        [
          "Questão",
          "Área",
          "Alternativa",
          "Resultado",
          "Pontos",
          "Tempo",
          "Data",
        ],
        data.answers.map(
          (a) =>
            `<tr><td>${esc(a.question_id)}</td><td>${esc(catalog.areas[a.area] || a.area)}</td><td>${Number(a.choice) >= 0 ? "ABCDE"[Number(a.choice)] : "Não respondeu"}</td><td>${Number(a.correct) ? "Correta" : "Incorreta"}</td><td>${number(a.points)}</td><td>${number(a.elapsed)} s</td><td>${stamp(a.created_at)}</td></tr>`,
        ),
      )}`;
  } catch (error) {
    if (current === generation)
      $("#admin-content").innerHTML =
        `<div class="empty"><p>${esc(error.message)}</p></div>`;
  }
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (
    !button ||
    button.disabled ||
    state.page !== "admin" ||
    !state.user?.isAdmin
  )
    return;
  if (button.hasAttribute("data-admin-tab")) {
    section = button.dataset.adminTab;
    params = { page: 1, size: 25 };
    await load();
  } else if (button.hasAttribute("data-admin-page")) {
    params.page = Number(button.dataset.adminPage);
    await load();
  } else if (button.hasAttribute("data-admin-reload")) await load();
  else if (button.hasAttribute("data-admin-clear")) {
    params = { page: 1, size: 25 };
    await load();
  } else if (button.hasAttribute("data-admin-user"))
    await userDetail(Number(button.dataset.adminUser));
  else if (button.hasAttribute("data-admin-user-logs")) {
    section = "logs";
    params = { page: 1, size: 25, user: Number(button.dataset.adminUserLogs) };
    await load();
  }
});
document.addEventListener("submit", async (event) => {
  if (event.target.id !== "admin-filter-form") return;
  event.preventDefault();
  params = {
    ...Object.fromEntries(new FormData(event.target)),
    page: 1,
    size: 25,
    ...(params.user ? { user: params.user } : {}),
  };
  await load();
});
