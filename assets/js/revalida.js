import {
  api,
  catalog,
  esc,
  icon,
  modeName,
  number,
  refreshProfile,
  revalidaGuest,
  saveRevalidaGuest,
  specialtyName,
  state,
  storage,
} from "./core.js?v=2.4.0";

const localAttempt = (id) => `mdstrike_attempt_${id}`;
const letter = (choice) => "ABCD"[choice] || "—";
const editions = catalog.exams.filter((exam) => exam.operation === "revalida");

export class RevalidaSimulation {
  constructor(options) {
    this.options = options;
    this.edition = editions.find((e) => e.id === options.exam);
    this.online = Boolean(state.user);
    this.index = 0;
  }

  async start() {
    if (this.online) {
      this.current = await api("start-match", this.options);
      this.deadline = Date.now() + this.current.remaining * 1000;
    } else {
      const { default: bank } = await import("./practice-bank.js?v=2.8.0");
      const saved = storage.get(localAttempt(this.edition.id), null);
      const duration = this.edition.durationMinutes * 60;
      this.deadline = saved?.deadline ?? Date.now() + duration * 1000;
      this.current = {
        mode: this.options.mode,
        map: this.options.map,
        exam: this.edition.id,
        duration,
        choices: saved?.choices ?? {},
        questions: bank.filter(
          (q) => q.exam === this.edition.id && q.answer !== null,
        ),
      };
      this.saveAttempt();
    }
    const firstBlank = this.current.questions.findIndex(
      (_, i) => this.current.choices[i] === undefined,
    );
    if (firstBlank >= 0) this.index = firstBlank;
  }

  saveAttempt() {
    storage.set(localAttempt(this.edition.id), {
      deadline: this.deadline,
      choices: this.current.choices,
    });
  }

  remaining() {
    return Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
  }

  get question() {
    return this.current.questions[this.index];
  }

  async mark(choice) {
    if (!this.remaining()) return;
    if (this.online)
      await api("revalida-mark", {
        match: this.current.id,
        index: this.index,
        choice,
      });
    if (choice < 0) delete this.current.choices[this.index];
    else this.current.choices[this.index] = choice;
    if (!this.online) this.saveAttempt();
  }

  async abort() {
    if (this.online) await api("abort-match", { match: this.current.id });
    else storage.set(localAttempt(this.edition.id), null);
  }

  async finish() {
    if (this.online) {
      this.result = (
        await api("revalida-submit", { match: this.current.id })
      ).result;
      await refreshProfile().catch(() => {});
      return this.result;
    }
    const { choices, questions, duration } = this.current;
    let correct = 0;
    const answers = questions.map((q, i) => {
      const choice = choices[i] ?? -1;
      const right = q.answer === choice;
      correct += Number(right);
      revalidaGuest.stats[q.area] ??= { answered: 0, correct: 0 };
      revalidaGuest.stats[q.area].answered++;
      revalidaGuest.stats[q.area].correct += Number(right);
      return {
        number: q.number,
        choice,
        answer: q.answer,
        pdf: q.pdf,
        page: q.page,
      };
    });
    const wrong = new Set(revalidaGuest.wrong);
    questions.forEach((q, i) => {
      if (answers[i].choice === q.answer) wrong.delete(q.id);
      else wrong.add(q.id);
    });
    revalidaGuest.wrong = [...wrong];
    const cancelledCredit = this.edition.creditCancelled
      ? this.edition.cancelled.length
      : 0;
    const cutoff = this.edition.cutoff ?? null;
    const score = correct + cancelledCredit;
    this.result = {
      exam: this.edition.id,
      correct,
      score,
      total: questions.length,
      answered: Object.keys(choices).length,
      answers,
      cutoff,
      maximum: this.edition.valid + cancelledCredit,
      cancelledCredit,
      reachedCutoff: cutoff === null ? null : score >= cutoff,
      elapsed: duration - this.remaining(),
    };
    revalidaGuest.history.unshift({
      exam_id: this.edition.id,
      map_id: this.current.map,
      mode: this.current.mode,
      score,
      correct,
      finished_at: Math.floor(Date.now() / 1000),
      result_json: JSON.stringify({ ...this.result, answers: undefined }),
    });
    revalidaGuest.history = revalidaGuest.history.slice(0, 20);
    saveRevalidaGuest();
    storage.set(localAttempt(this.edition.id), null);
    return this.result;
  }
}

export function formatClock(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export const revalidaStartForm = (exam) => `
  <form class="modal-content" id="revalida-start-form" data-exam="${esc(exam.id)}">
    <div class="modal-top"><h2 id="modal-title">${esc(exam.title)}</h2><button type="button" class="close-button" data-close aria-label="Fechar">×</button></div>
    <p>${exam.valid} questões válidas · ${exam.durationMinutes / 60} horas · correção na entrega.</p>
    ${exam.cutoff ? `<p>Corte da prova objetiva: ${exam.cutoff} pontos.</p>` : ""}
    ${exam.writtenStage ? "<p>Esta edição também teve prova discursiva. O simulado cobre a objetiva.</p>" : ""}
    ${state.user && exam.cutoff ? `<label class="field"><span>Onde você se formou em Medicina? (opcional)</span><select name="formation"><option value="">Prefiro não informar</option><option value="brasil">Brasil</option><option value="exterior">Exterior</option></select></label><p class="small-text">A declaração serve para uma comparação agregada por edição, baseada na primeira entrega com respostas de cada conta.</p>` : ""}
    <p class="small-text">Se houver uma tentativa em andamento, você volta para ela. O relógio continua ao sair.</p>
    <div class="form-error" role="alert"></div><div class="row wrap"><button type="submit" class="btn">Iniciar ou retomar ${icon("arrow", 16)}</button><a class="text-button" href="/revalida/${esc(exam.id.slice("revalida-".length))}/">Ver dados da prova</a></div>
  </form>`;

function revalidaHistory(history) {
  if (!history.length)
    return "<p>Seu histórico aparece após a primeira partida.</p>";
  return history
    .map((entry) => {
      const result = JSON.parse(entry.result_json || "{}");
      const title =
        editions.find((e) => e.id === entry.exam_id)?.title ??
        specialtyName(entry.map_id);
      return `<div class="history-row"><div>${esc(title)}<small>${esc(modeName(entry.mode))} · ${new Date(Number(entry.finished_at) * 1000).toLocaleDateString("pt-BR")}</small></div><strong>${result.aborted ? "Encerrado" : `${number(entry.correct)} acertos`}</strong></div>`;
    })
    .join("");
}

export function revalidaPage(profile, cohorts) {
  const progress = state.user ? profile?.revalida : revalidaGuest;
  const comparison = editions
    .filter((exam) => exam.cutoff)
    .map((exam) => {
      const row = cohorts?.find((entry) => entry.exam === exam.id);
      const participants = row?.participants || 0;
      return `<div class="history-row"><div>Revalida ${esc(exam.year)}<small>${number(participants)} ${participants === 1 ? "participante" : "participantes"} · primeira entrega por conta</small></div><strong>${participants ? `${number(Math.round((row.reached / participants) * 1000) / 10)}% no corte` : "Sem resultados"}</strong></div>`;
    })
    .join("");
  return `<section class="public-intro operation-intro"><h1>Operação Revalida</h1><p>Prepare-se para a prova objetiva do Inep ou teste seu desempenho com os mesmos cadernos. A operação é aberta também a médicos formados no Brasil.</p><div class="row wrap"><button class="btn" data-start="practice" data-map-id="revalida-geral">Jogar Revalida Geral ${icon("arrow", 16)}</button><button class="btn outline" data-start="review" data-map-id="revalida-geral">Revisar erros${progress?.wrong.length ? ` · ${number(progress.wrong.length)}` : ""}</button><a class="text-button" href="/revalida/">Provas e fontes oficiais</a></div></section>
    <div class="section-jumps" role="group" aria-label="Seções da Operação Revalida"><button class="text-button" data-jump-to="revalida-edicoes">Simulados por edição</button><button class="text-button" data-jump-to="revalida-mapas">Mapas por área</button><button class="text-button" data-jump-to="revalida-historico">Seu histórico</button></div>
    <section class="operation-section"><h2 id="revalida-edicoes" class="section-anchor" tabindex="-1">Simulados por edição</h2><div class="panel">${editions.map((exam) => `<article class="source-row"><div><h3>${esc(exam.title)}</h3><p>${exam.valid} questões válidas · ${exam.durationMinutes / 60} horas${exam.cutoff ? ` · corte ${exam.cutoff} pontos` : ""}</p></div><div class="row wrap"><a class="text-button" href="/revalida/${esc(exam.id.slice("revalida-".length))}/">Caderno e gabarito</a><button class="btn outline small" data-exam="${esc(exam.id)}">Abrir simulado</button></div></article>`).join("")}</div></section>
    <section class="operation-section"><h2 id="revalida-mapas" class="section-anchor" tabindex="-1">Mapas por área</h2><p>As questões classificadas no caderno 2026/1 alimentam os mapas temáticos. O mapa geral reúne todas as edições.</p><div class="operation-maps">${catalog.revalidaMaps
      .filter((map) => map.area && map.questions)
      .map(
        (map) =>
          `<article class="panel"><h3>${esc(map.name)}</h3><p>${map.questions} questões</p><button class="btn outline small" data-start="practice" data-map-id="${esc(map.id)}">Treinar ${icon("arrow", 14)}</button></article>`,
      )
      .join("")}</div></section>
    <div class="two-col operation-section"><section class="panel"><h2 id="revalida-historico" class="section-anchor" tabindex="-1">Seu histórico no Revalida</h2>${revalidaHistory(progress?.history || [])}</section><section class="panel"><h2>Desempenho de formados no Brasil</h2><p>Amostra voluntária, com formação autodeclarada. Percentual de participantes que atingiram ou superaram o corte da prova objetiva.</p>${cohorts ? comparison : '<p id="revalida-cohort-status" role="status">Carregando resultados…</p>'}</section></div>`;
}

export function revalidaResult(game) {
  const r = game.result;
  return `<div class="result-page"><section class="result-hero"><h1>Resultado do simulado</h1><p>${esc(game.edition.title)} · ${formatClock(r.elapsed)} · ${r.answered} respondidas</p>
    <div class="stat-strip"><div class="stat"><strong>${r.score}/${r.maximum}</strong><span>${r.cutoff === null ? "Acertos em questões válidas" : "Pontos na prova objetiva"}</span></div>
    ${r.cutoff === null ? "" : `<div class="stat"><strong>${r.cutoff}</strong><span>Corte da edição</span></div><div class="stat"><strong>${r.reachedCutoff ? "Atingido" : "Abaixo"}</strong><span>Em relação ao corte</span></div>`}</div>
    ${r.cancelledCredit ? `<p>${r.correct} acertos e ${r.cancelledCredit} pontos atribuídos pelos itens anulados.</p>` : ""}
    ${game.edition.writtenStage ? "<p>A primeira etapa desta edição também incluía prova discursiva.</p>" : ""}
    <div class="row wrap"><button class="btn" data-page="revalida">Voltar à Operação Revalida</button><button class="btn outline" data-start="review" data-map-id="revalida-geral">Revisar erros</button></div></section>
    <section class="panel operation-section"><h2>Correção questão a questão</h2><div class="table-wrap"><table><thead><tr><th>Questão</th><th>Sua resposta</th><th>Gabarito</th></tr></thead><tbody>${r.answers.map((entry) => `<tr><td><a href="/${esc(entry.pdf)}#page=${entry.page}" target="_blank" rel="noopener noreferrer">${entry.number}</a></td><td>${letter(entry.choice)}${entry.choice === entry.answer ? " ✓" : ""}</td><td>${letter(entry.answer)}</td></tr>`).join("")}</tbody></table></div></section></div>`;
}
