import { esc } from "./core.js?v=2.4.0";
import { nextReview } from "./medical-tools.js?v=2.8.0";
import {
  loadEcgProgress,
  saveEcgProgress,
  dueEcgReviews,
} from "./ecg-progress.js?v=3.0.0";
import { ecgChallenge, ecgLessons, ecgSources } from "./ecg-content.js?v=3.0.0";
import { mountTrace, tracePanel } from "./ecg-trace.js?v=3.0.0";

const base = "study/cursos/ecg";
const questionIndex = new Map([
  ...ecgLessons.map(({ exercise }) => [exercise.id, exercise]),
  ...ecgChallenge.map((question) => [question.id, question]),
]);
const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

function heading(title, description) {
  return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>`;
}

function link(path, label, className = "") {
  return `<a class="${className}" href="#${path}">${esc(label)}</a>`;
}

function sources(ids) {
  return `<ul class="ecg-sources">${ids
    .map((id) => {
      const [title, url] = ecgSources[id];
      return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></li>`;
    })
    .join("")}</ul>`;
}

function card(title, body, label, path) {
  return `<article class="resource-card ecg-card"><h2>${esc(title)}</h2><p>${esc(body)}</p>
    ${link(path, label, "btn outline")}</article>`;
}

function library() {
  return (
    heading(
      "Cursos rápidos",
      "Aulas curtas para praticar habilidades clínicas com exercícios comentados.",
    ) +
    `<div class="resource-grid">${card("ECG na prática", "6 aulas · 85 minutos · traçados de 12 derivações e desafio final.", "Abrir curso de ECG", base)}</div>`
  );
}

function overview(progress) {
  const completed = ecgLessons.filter(({ id }) =>
    Number.isInteger(progress.lessons[id]),
  ).length;
  const next = ecgLessons.find(
    ({ id }) => !Number.isInteger(progress.lessons[id]),
  );
  return (
    heading(
      "ECG na prática",
      "Aprenda a descrever um ECG de 12 derivações com um roteiro que se repete em cada caso.",
    ) +
    `<div class="resource-review-strip">
      <div><h2>${completed} de ${ecgLessons.length} aulas concluídas</h2><p>85 minutos · estudantes de Medicina e recém-formados</p></div>
      ${
        next
          ? link(
              base + "/" + next.id,
              completed ? "Retomar aula" : "Começar curso",
              "btn",
            )
          : link(base + "/desafio", "Abrir desafio final", "btn")
      }
    </div>
    <div class="ecg-lessons">${ecgLessons
      .map(
        (lesson, index) => `<article class="resource-card ecg-card">
      <p class="resource-meta">Aula ${index + 1} · ${lesson.minutes} min${Number.isInteger(progress.lessons[lesson.id]) ? " · Concluída" : ""}</p>
      <h2>${link(base + "/" + lesson.id, lesson.title)}</h2><p>${esc(lesson.intro)}</p>
    </article>`,
      )
      .join("")}</div>
    <div class="resource-grid ecg-followup">
      ${card("Desafio final", "Seis traçados e correção comentada. As questões erradas entram em Minhas revisões.", progress.challenge.submitted ? "Ver resultado do desafio" : "Abrir desafio final", base + "/desafio")}
      ${card("Revisões de ECG", "Refaça as questões que errou e retome a prática em outros dias.", "Abrir revisões de ECG", base + "/revisao")}
    </div>
    <section class="ecg-reference"><h2>Referências do curso</h2>${sources(Object.keys(ecgSources))}</section>`
  );
}

function optionsPanel(question, { kind, selected, disabled = false }) {
  return `<form class="ecg-question" data-ecg-form="${kind}" data-ecg-question="${question.id}">
    <fieldset><legend>${esc(question.prompt)}</legend>
      ${question.options
        .map(
          (option, index) => `<label class="ecg-option">
        <input type="radio" name="choice" value="${index}" ${selected === index ? "checked" : ""} ${disabled ? "disabled" : ""} required>
        <span>${esc(option)}</span>
      </label>`,
        )
        .join("")}
    </fieldset>
    ${kind !== "challenge" && !disabled ? '<button class="btn" type="submit">Conferir resposta</button>' : ""}
  </form>`;
}

function feedback(question, selected) {
  return `<div class="ecg-feedback" tabindex="-1" data-ecg-feedback>
    <h3>${selected === question.answer ? "Resposta correta" : "Revise este ponto"}</h3>
    <p><strong>Resposta esperada.</strong> ${esc(question.options[question.answer])}</p>
    <p>${esc(question.explanation)}</p>
    ${sources([question.source])}
  </div>`;
}

function lessonPage(lesson, progress) {
  const index = ecgLessons.indexOf(lesson);
  const next = ecgLessons[index + 1];
  const prev = ecgLessons[index - 1];
  const question = lesson.exercise;
  const selected = progress.lessons[lesson.id];
  const finished = Number.isInteger(selected);
  return (
    heading(
      lesson.title,
      `Aula ${index + 1} de ${ecgLessons.length} · ${lesson.minutes} minutos`,
    ) +
    `<div class="ecg-reading"><p>${esc(lesson.intro)}</p>
      <ul>${lesson.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
      ${sources(lesson.sources)}
    </div>
    <section class="ecg-exercise">
      <h2>Pratique com o traçado</h2>
      ${lesson.id === "leitura" ? "<p>Use o roteiro acima para descrever o registro. Compare pelo menos uma derivação dos membros e uma precordial antes de responder.</p>" : ""}
      ${tracePanel(question.trace, question.id)}
      ${optionsPanel(question, { kind: "lesson", selected, disabled: finished })}
      ${finished ? feedback(question, selected) : ""}
    </section>
    <div class="ecg-actions">
      ${prev ? link(base + "/" + prev.id, "Aula anterior", "btn outline") : link(base, "Ver todas as aulas", "btn outline")}
      ${link(next ? base + "/" + next.id : base + "/desafio", next ? "Próxima aula" : "Ir ao desafio final", "btn")}
    </div>`
  );
}

function challengePage(progress) {
  const { answers, submitted, index } = progress.challenge;
  if (submitted) {
    const correct = ecgChallenge.filter(
      (question) => answers[question.id] === question.answer,
    ).length;
    return (
      heading(
        "Resultado do desafio",
        `${correct} de ${ecgChallenge.length} questões corretas`,
      ) +
      `<div class="ecg-actions">
        ${link(base + "/revisao", "Abrir revisões de ECG", "btn")}
        <button class="btn outline" type="button" data-ecg-restart>Refazer desafio</button>
      </div>
      <div class="ecg-results">${ecgChallenge
        .map(
          (question, position) => `<details class="resource-card ecg-result">
        <summary>Questão ${position + 1} · ${answers[question.id] === question.answer ? "Acerto" : "Revisar"}</summary>
        <p>${esc(question.prompt)}</p>
        <p><strong>Sua resposta.</strong> ${esc(question.options[answers[question.id]])}</p>
        ${feedback(question, answers[question.id])}
      </details>`,
        )
        .join("")}</div>`
    );
  }
  const question = ecgChallenge[index];
  const count = ecgChallenge.filter((item) =>
    Number.isInteger(answers[item.id]),
  ).length;
  return (
    heading(
      "Desafio final de ECG",
      "Reserve cerca de 15 minutos. A correção aparece na entrega.",
    ) +
    `<section class="ecg-exercise">
      <div class="ecg-question-heading">
        <h2>Questão ${index + 1} de ${ecgChallenge.length}</h2><p role="status" data-ecg-count>${count} respondidas</p>
      </div>
      ${tracePanel(question.trace, question.id)}
      ${optionsPanel(question, { kind: "challenge", selected: answers[question.id] })}
      <div class="ecg-actions">
        <button class="btn outline small" type="button" data-ecg-step="-1" ${index === 0 ? "disabled" : ""}>Anterior</button>
        <button class="btn outline small" type="button" data-ecg-step="1" ${index === ecgChallenge.length - 1 ? "disabled" : ""}>Próxima</button>
        <button class="btn small" type="button" data-ecg-finish ${count < ecgChallenge.length ? "disabled" : ""}>Entregar desafio</button>
      </div>
    </section>`
  );
}

function reviewPage(progress, feedbackEntry) {
  const due = dueEcgReviews(progress).filter((id) => questionIndex.has(id));
  const upcoming = Object.entries(progress.reviews)
    .filter(([id]) => !due.includes(id) && questionIndex.has(id))
    .sort((a, b) => a[1].due - b[1].due);
  const active = feedbackEntry?.question ?? questionIndex.get(due[0]);
  return (
    heading(
      "Revisões de ECG",
      `${due.length} ${due.length === 1 ? "questão disponível" : "questões disponíveis"} hoje`,
    ) +
    (active
      ? `<section class="ecg-exercise"><h2>Pratique novamente</h2>
      ${tracePanel(active.trace, active.id)}
      ${optionsPanel(active, { kind: "review", selected: feedbackEntry?.selected, disabled: Boolean(feedbackEntry) })}
      ${feedbackEntry ? feedback(active, feedbackEntry.selected) + `<div class="ecg-actions"><button class="btn outline" type="button" data-ecg-continue>${due.length ? "Próxima revisão" : "Ver fila de revisão"}</button></div>` : ""}
    </section>`
      : `<div class="resource-card"><p>${upcoming.length ? "Você concluiu as revisões de hoje." : "Erre uma questão nas aulas ou no desafio para começar sua fila."}</p>
      ${link(base, "Voltar ao curso")}</div>`) +
    (upcoming.length
      ? `<section class="ecg-reference"><h2>Próximas revisões</h2>
      <ul class="ecg-sources">${upcoming.map(([id, review]) => `<li>${dateLabel.format(review.due)} · ${esc(questionIndex.get(id).prompt)}</li>`).join("")}</ul>
    </section>`
      : "")
  );
}

function queueError(progress, question, selected) {
  if (selected !== question.answer)
    progress.reviews[question.id] = { due: Date.now(), level: -1 };
}

export function mountEcgCourse(container, path) {
  const progress = loadEcgProgress();
  const screen = path.split("/")[3];
  const lesson = ecgLessons.find(({ id }) => id === screen);
  let feedbackEntry;
  const host = document.createElement("div");
  host.className = "medical-resources ecg-course";
  container.replaceChildren(host);

  function render() {
    const body =
      path === "study/cursos"
        ? library()
        : path === base
          ? overview(progress)
          : lesson
            ? lessonPage(lesson, progress)
            : screen === "desafio"
              ? challengePage(progress)
              : screen === "revisao"
                ? reviewPage(progress, feedbackEntry)
                : heading(
                    "Aula indisponível",
                    "Volte à página do curso para escolher uma aula.",
                  );
    host.innerHTML = `<nav class="ecg-path" aria-label="Caminho do curso">
      ${link("study", "Estudo")}
      ${path !== "study/cursos" ? link("study/cursos", "Cursos rápidos") : ""}
      ${screen ? link(base, "ECG na prática") : ""}
    </nav>${body}
    ${path !== "study/cursos" ? '<p class="resource-note">Material educacional autoral. A revisão clínica independente está pendente. O progresso e as revisões ficam salvos neste navegador.</p>' : ""}`;
    const figure = host.querySelector("[data-ecg-trace]");
    if (figure) {
      if (host.querySelector("[data-ecg-feedback]"))
        figure.dataset.ecgMark = "true";
      mountTrace(figure);
    }
  }

  function refresh(target) {
    render();
    const focus = host.querySelector(target);
    focus?.setAttribute("tabindex", "-1");
    focus?.focus({ preventScroll: true });
    focus?.scrollIntoView({ block: "nearest" });
  }

  host.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.dataset.ecgForm) return;
    event.preventDefault();
    if (form.dataset.ecgForm === "challenge") return;
    const question = questionIndex.get(form.dataset.ecgQuestion);
    const choice = new FormData(form).get("choice");
    if (choice === null) return;
    const selected = Number(choice);
    if (form.dataset.ecgForm === "lesson") {
      if (Number.isInteger(progress.lessons[lesson.id])) return;
      progress.lessons[lesson.id] = selected;
      queueError(progress, question, selected);
    } else {
      progress.reviews[question.id] = nextReview(
        progress.reviews[question.id],
        selected === question.answer,
      );
      feedbackEntry = { question, selected };
    }
    saveEcgProgress(progress);
    refresh("[data-ecg-feedback]");
  });

  host.addEventListener("change", (event) => {
    const form = event.target.form;
    if (form?.dataset.ecgForm !== "challenge") return;
    progress.challenge.answers[form.dataset.ecgQuestion] = Number(
      event.target.value,
    );
    saveEcgProgress(progress);
    const count = Object.keys(progress.challenge.answers).length;
    host.querySelector("[data-ecg-count]").textContent = `${count} respondidas`;
    host.querySelector("[data-ecg-finish]").disabled =
      count !== ecgChallenge.length;
  });

  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.hasAttribute("data-ecg-step")) {
      progress.challenge.index += Number(button.dataset.ecgStep);
      saveEcgProgress(progress);
      refresh(".ecg-question-heading h2");
    } else if (button.hasAttribute("data-ecg-finish")) {
      if (
        !ecgChallenge.every((question) =>
          Number.isInteger(progress.challenge.answers[question.id]),
        )
      )
        return;
      for (const question of ecgChallenge)
        queueError(progress, question, progress.challenge.answers[question.id]);
      progress.challenge.submitted = true;
      saveEcgProgress(progress);
      refresh("h1");
    } else if (button.hasAttribute("data-ecg-restart")) {
      progress.challenge = { answers: {}, submitted: false, index: 0 };
      saveEcgProgress(progress);
      refresh("h1");
    } else if (button.hasAttribute("data-ecg-continue")) {
      feedbackEntry = null;
      refresh("h1");
    }
  });
  render();
}
