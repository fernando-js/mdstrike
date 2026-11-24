import {
  api,
  catalog,
  esc,
  icon,
  number,
  state,
  specialtyName,
  toast,
} from "./core.js?v=2.4.0";
import { heading, areaOptions, statsStrip } from "./views.js?v=3.6.0";

export function challengeForm(tea = false) {
  const specialties = catalog.specialties
    .filter((specialty) => specialty.originals >= 3)
    .map(({ id, name }) => `<option value="${esc(id)}">${esc(name)}</option>`)
    .join("");
  const theme = tea
    ? '<input type="hidden" name="map" value="tea">'
    : `<label class="field"><span>Tema do desafio</span><select name="map"><option value="all">Todas as áreas</option><option value="tea">Operação TEA</option><optgroup label="Áreas">${areaOptions()}</optgroup>${specialties ? `<optgroup label="Especialidades">${specialties}</optgroup>` : ""}</select></label>`;
  return `<div class="modal-content"><div class="modal-top"><h2 id="modal-title">${tea ? "Criar desafio TEA" : "Desafie seu colega."}</h2><button class="close-button" data-close aria-label="Fechar">×</button></div><p>${tea ? "Compartilhe um convite com sete questões da Operação TEA de Anestesiologia." : "Escolha o tema. O convite inclui o assunto, o número de questões e o link para participar."}</p><form id="challenge-form" class="auth-form">${theme}<div class="notice">Até 7 questões autorais · 60 segundos por questão · link válido por 7 dias. Uma tentativa por conta. O placar compara acertos, pontos e tempo de resposta. Desistir encerra sua tentativa. Este desafio não altera o rating.</div><div class="form-error" role="alert"></div><button class="btn" type="submit">Gerar link de desafio ${icon("arrow", 18)}</button></form></div>`;
}

function challengeShare(c) {
  const title = `${c.title} no MDStrike`;
  const message = `${title}\n${c.description}\n\n${c.url}`;
  return `<div class="challenge-share" data-invite-url="${esc(c.url)}" data-invite-title="${esc(title)}">
    <label class="field"><span>Mensagem do convite</span><textarea id="challenge-invite-text" rows="4" readonly>${esc(message)}</textarea></label>
    <div class="row wrap">
      <button class="btn small" type="button" data-copy-challenge>Copiar convite</button>
      <button class="btn outline small" type="button" data-share-challenge>Compartilhar</button>
      <button class="text-button" type="button" data-copy-challenge-link>Copiar só o link</button>
    </div>
  </div>`;
}

export async function shareChallenge(button) {
  const share = button.closest(".challenge-share");
  const field = share.querySelector("textarea");
  const { inviteUrl, inviteTitle } = share.dataset;
  const linkOnly = button.hasAttribute("data-copy-challenge-link");
  if (button.hasAttribute("data-share-challenge") && navigator.share) {
    try {
      await navigator.share({
        title: inviteTitle,
        text: field.value.slice(0, -inviteUrl.length).trimEnd(),
        url: inviteUrl,
      });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(linkOnly ? inviteUrl : field.value);
    toast(linkOnly ? "Link copiado." : "Convite copiado. Cole na conversa com seu colega.");
  } catch {
    field.focus();
    field.setSelectionRange(linkOnly ? field.value.length - inviteUrl.length : 0, field.value.length);
    toast(linkOnly ? "Link selecionado para copiar." : "Convite selecionado para copiar.");
  }
}

export function challengePage(c) {
  const canPlay = !c.expired && ["new", "playing"].includes(c.mine);
  const button = canPlay && !state.user
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
      esc(c.title),
      `${esc(c.creator)} convidou você para testar seus conhecimentos.`,
    ) +
    `
  ${c.map === "tea" ? '<p class="section-return"><a class="text-button" href="#tea">‹ Voltar à Operação TEA</a></p>' : ""}
  <section class="panel challenge-panel">
  ${statsStrip([
    [c.total, "Questões iguais para todos"],
    ["60 s", "Por questão"],
    [number(c.scores.length), "Participantes"],
    [c.expired ? "Encerrado" : "7 dias", "Prazo do link"],
  ])}
  <div class="row wrap challenge-actions">${button}${c.mine === "finished" ? '<span class="tag official">Sua tentativa foi concluída</span>' : ""}${c.mine === "aborted" ? '<span class="tag">Sua tentativa foi encerrada ao sair</span>' : ""}${c.expired ? '<span class="tag">Prazo encerrado</span>' : ""}<button class="btn outline" data-reload-challenge>Atualizar placar ${icon("repeat", 18)}</button></div>
  ${canPlay && !state.user ? '<p class="small-text muted">Você pode consultar o placar como convidado. Entre ou crie uma conta para jogar e registrar seu resultado.</p>' : ""}
  ${challengeShare(c)}
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
              `<div class="source-row"><div><h3>${esc(c.map === "tea" ? c.title : specialtyName(c.map))}</h3><p>${esc(c.creator)} · ${c.total} questões · ${c.scores.filter((s) => s.status === "finished").length} resultados${c.expired ? " · encerrado" : ""}</p></div><button class="btn outline small" data-open-challenge="${c.id}">Abrir desafio ${icon("arrow", 16)}</button></div>`,
          )
          .join("")
      : '<p class="muted">Seus desafios criados e aceitos ficam salvos aqui. Comece pelo botão “Criar desafio”.</p>';
  } catch (error) {
    if (host.isConnected) host.textContent = error.message;
  }
}
