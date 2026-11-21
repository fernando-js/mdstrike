import {
  api,
  catalog,
  esc,
  icon,
  number,
  state,
  specialtyName,
} from "./core.js?v=2.4.0";
import { heading, areaOptions, statsStrip } from "./views.js?v=2.4.0";

export function challengeForm() {
  return `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">Desafie seu colega.</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>Crie um link e compartilhe. Cada pessoa joga no seu horário, com as mesmas questões e alternativas.</p><form id="challenge-form" class="auth-form"><label class="field"><span>Mapa do desafio</span><select name="map"><option value="all">Operação ENAMED · todas as áreas</option>${areaOptions()}</select></label><div class="notice">Até 7 questões autorais · 60 segundos por questão · link válido por 7 dias. Uma tentativa por conta. O placar compara acertos, pontos e tempo de resposta. Desistir encerra sua tentativa. Este desafio não altera o rating.</div><div class="form-error" role="alert"></div><button class="btn" type="submit">Gerar link de desafio ${icon("arrow", 18)}</button></form></div>`;
}

export function challengePage(c) {
  const finished = c.scores.filter((s) => s.status === "finished").length;
  const canPlay = !c.expired && ["new", "playing"].includes(c.mine);
  const button = !state.user
    ? '<button class="btn" data-auth="login">Entrar para participar</button>'
    : canPlay
      ? `<button class="btn" data-join-challenge="${c.id}">${c.mine === "playing" ? "Continuar minha tentativa" : "Aceitar desafio"} ${icon("arrow", 18)}</button>`
      : "";
  const expired = new Date(c.expiresAt * 1000).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return (
    heading(
      "Um link. O mesmo desafio.",
      `${esc(c.creator)} convidou você para testar seus conhecimentos.`,
    ) +
    `
  <section class="panel challenge-panel"><div class="row space-between wrap"><div><h2>${esc(specialtyName(c.map))}</h2><p>Desafio entre colegas · cada participante joga no seu horário</p></div>${icon("trophy", 42)}</div>
  ${statsStrip([
    [c.total, "Questões iguais para todos"],
    ["60 s", "Por questão"],
    [number(c.scores.length), "Participantes"],
    [c.expired ? "Encerrado" : "7 dias", "Prazo do link"],
  ])}
  <div class="row wrap challenge-actions">${button}${c.mine === "finished" ? '<span class="tag official">Sua tentativa foi concluída</span>' : ""}${c.mine === "aborted" ? '<span class="tag">Sua tentativa foi encerrada ao sair</span>' : ""}${c.expired ? '<span class="tag">Prazo encerrado</span>' : ""}<button class="btn outline" data-reload-challenge>Atualizar placar ${icon("repeat", 18)}</button></div>
  <div class="challenge-share"><label class="field"><span>Link para convidar seu colega</span><input id="challenge-link" type="url" readonly value="${esc(c.url)}" aria-label="Link do desafio"></label><button class="btn small" data-copy-challenge>Copiar link</button><button class="btn secondary small" data-share-challenge>Compartilhar</button></div>
  <p class="small-text muted">Disponível para iniciar até ${esc(expired)}. Quem tiver o link poderá ver os nicknames e o placar final.</p></section>
  <div class="section-heading" style="margin-top:28px"><h2>Placar do desafio</h2><span class="muted small-text">Acertos → pontos → menor tempo</span></div>
  ${c.scores.length ? `<div class="table-wrap"><table><thead><tr><th>Posição</th><th>Operador</th><th>Status</th><th>Acertos</th><th>Pontos</th><th>Tempo nas questões</th></tr></thead><tbody>${c.scores.map((s) => `<tr class="${s.you ? "you" : ""}"><td class="rank-position">${s.position ? "#" + s.position : "—"}</td><td>${esc(s.nickname)}${s.you ? " · você" : ""}</td><td>${{ finished: "Concluído", playing: "Em andamento", aborted: "Tentativa encerrada" }[s.status]}</td><td>${s.correct === null ? "—" : s.correct + "/" + c.total}</td><td>${s.score === null ? "—" : number(s.score)}</td><td>${s.elapsed === null ? "—" : s.elapsed + " s"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty"><h2>Quem aceita o primeiro round?</h2><p>Compartilhe o link e faça sua tentativa. Os resultados aparecerão aqui.</p></div>'}
  <div class="notice">Cada conta tem uma tentativa por desafio. O mesmo link pode reunir vários colegas no placar. Você pode participar de outros desafios em abas separadas; o relógio de cada questão continua contando. Cada participante responde no seu horário.</div>`
  );
}

export async function loadMyChallenges() {
  const host = document.querySelector("#my-challenges");
  if (!host) return;
  if (!state.user) {
    host.innerHTML =
      '<p class="muted">Entre na sua conta para criar desafios e recuperar seus links.</p>';
    return;
  }
  try {
    const data = await api("my-challenges");
    if (!host.isConnected) return;
    host.innerHTML = data.challenges.length
      ? data.challenges
          .map(
            (c) =>
              `<div class="source-row"><div><h3>${esc(specialtyName(c.map))}</h3><p>${esc(c.creator)} · ${c.total} questões · ${c.scores.filter((s) => s.status === "finished").length} resultados${c.expired ? " · encerrado" : ""}</p></div><button class="btn outline small" data-open-challenge="${c.id}">Abrir desafio ${icon("arrow", 16)}</button></div>`,
          )
          .join("")
      : '<p class="muted">Seus desafios criados e aceitos ficam salvos aqui. Comece pelo botão “Criar desafio”.</p>';
  } catch (error) {
    if (host.isConnected) host.textContent = error.message;
  }
}
