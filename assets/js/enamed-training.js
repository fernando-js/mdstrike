import { esc, storage } from "./core.js?v=2.4.0";
import { reportTrainingEvent } from "./enamed-training-metrics.js?v=1";

const root = document.querySelector("#enamed-training");
const training = JSON.parse(root.dataset.training);
const questions = new Map(
  training.questions.map((item) => [item.number, item]),
);
const key = "mdstrike_enamed_training_v1_" + training.edition;
const letters = ["A", "B", "C", "D"];
const day = 24 * 60 * 60 * 1000;

const newRound = (kind, queue) => ({ kind, queue, choices: [], index: 0 });
const emptyProgress = () => ({
  round: newRound("initial", training.initial),
  wrong: [],
  seen: [],
  firstAnswerAt: 0,
  started: false,
  completed: false,
  returned: false,
});

function loadProgress() {
  const saved = storage.get(key, null);
  const round = saved?.round;
  if (
    !round ||
    !["initial", "review", "followup"].includes(round.kind) ||
    !Array.isArray(round.queue) ||
    !round.queue.length ||
    new Set(round.queue).size !== round.queue.length ||
    !round.queue.every((number) => questions.has(number)) ||
    !Array.isArray(round.choices) ||
    !round.choices.every((letter) => letters.includes(letter)) ||
    !Number.isInteger(round.index) ||
    round.index < 0 ||
    round.index > round.queue.length ||
    round.choices.length > round.queue.length ||
    ![round.index, round.index + 1].includes(round.choices.length) ||
    !Array.isArray(saved.wrong) ||
    !Array.isArray(saved.seen)
  )
    return emptyProgress();
  return {
    ...emptyProgress(),
    ...saved,
    wrong: saved.wrong.filter((number) => questions.has(number)),
    seen: saved.seen.filter((number) => questions.has(number)),
  };
}

const progress = loadProgress();
const save = () => storage.set(key, progress);
const titles = {
  initial: "Treino Enamed",
  review: "Revisão dos erros",
  followup: "Questões do mesmo tema",
};
const path = (item) => training.paper + "#page=" + item.page;

function renderQuestion(round) {
  const item = questions.get(round.queue[round.index]);
  const choice = round.choices[round.index];
  const correct = choice === item.answer;
  const comment = item.comment;
  const options = item.options
    .map((option, index) => {
      const letter = letters[index];
      return `<label class="training-option${choice && letter === item.answer ? " is-correct" : ""}">
      <input type="radio" name="choice" value="${letter}" required${choice === letter ? " checked" : ""}>
      <strong>${letter}.</strong><span>${esc(option)}</span>
    </label>`;
    })
    .join("");
  const explanation = comment
    ? `<p>${esc(comment.clue)}</p><p>${esc(comment.distractor)}</p>
      <p><a href="${esc(comment.source)}">${esc(comment.sourceLabel)}</a> · Revisão de ${esc(comment.reviewedBy)} em ${esc(comment.reviewedAt)}.</p>`
    : "<p>Comentário clínico em revisão editorial.</p>";
  const feedback = choice
    ? `<div class="training-feedback" id="training-feedback" tabindex="-1" data-correct="${correct}">
      <strong>${correct ? "Você acertou." : "Você marcou " + esc(choice) + "."} Gabarito oficial ${esc(item.answer)}.</strong>
      ${explanation}
    </div>
    <button class="btn" type="button" data-training-action="next">${round.index + 1 === round.queue.length ? "Ver resultado" : "Próxima questão"}</button>`
    : "";
  return `<section class="training-question panel" aria-labelledby="training-focus">
    <p class="small-text muted">${esc(titles[round.kind])} · ${esc(item.areaName)}</p>
    <h2 id="training-focus" tabindex="-1">Questão ${round.index + 1} de ${round.queue.length}</h2>
    <p>${esc(item.prompt)}</p>
    <form data-training-answer>
      <fieldset class="training-options"${choice ? " disabled" : ""}><legend>Alternativas</legend>${options}</fieldset>
      ${choice ? "" : '<button class="btn" type="submit">Conferir resposta</button>'}
    </form>
    ${feedback}
    <p class="small-text muted">Questão ${item.number} do caderno · <a href="${esc(path(item))}" target="_blank" rel="noopener">Ver página original do Inep</a></p>
  </section>`;
}

function relatedQuestions(round) {
  const relevant = round.queue.filter(
    (number, index) =>
      round.kind === "review" ||
      round.choices[index] !== questions.get(number).answer,
  );
  const topics = new Set(relevant.map((number) => questions.get(number).topic));
  return training.questions
    .filter(
      (item) => topics.has(item.topic) && !progress.seen.includes(item.number),
    )
    .map((item) => item.number);
}

function renderResult(round) {
  const totals = new Map();
  let correctAnswers = 0;
  for (const [index, number] of round.queue.entries()) {
    const item = questions.get(number);
    const correct = Number(round.choices[index] === item.answer);
    const total = totals.get(item.areaName) ?? { answered: 0, correct: 0 };
    total.answered++;
    total.correct += correct;
    totals.set(item.areaName, total);
    correctAnswers += correct;
  }
  const areaResults = [...totals.entries()]
    .map(
      ([area, total]) =>
        `<li>${esc(area)} · ${total.correct} de ${total.answered} corretas</li>`,
    )
    .join("");
  const review = progress.wrong.length
    ? `<button class="btn" type="button" data-training-action="review">Revisar meus erros (${progress.wrong.length})</button>`
    : "";
  const followup = relatedQuestions(round).length
    ? '<button class="btn outline" type="button" data-training-action="followup">Praticar com novas questões do mesmo tema</button>'
    : "";
  return `<section class="training-result panel" aria-labelledby="training-focus">
    <h2 id="training-focus" tabindex="-1">Resultado do ${round.kind === "review" ? "caderno de erros" : "treino"}</h2>
    <p><strong>${correctAnswers} de ${round.queue.length} questões corretas</strong> · ${Math.round((correctAnswers * 100) / round.queue.length)}% de acertos.</p>
    <ul>${areaResults}</ul>
    <div class="training-actions">
      ${review}${followup}
      <button class="btn outline" type="button" data-training-action="restart">Refazer treino inicial</button>
    </div>
    <p class="small-text">O progresso deste treino fica neste navegador. <a class="text-button" href="/?cadastro=enamed#study/enamed">Acessar conta e trilha de estudo</a></p>
  </section>`;
}

function render(focus) {
  const round = progress.round;
  root.innerHTML =
    round.index === round.queue.length
      ? renderResult(round)
      : renderQuestion(round);
  if (focus) {
    document
      .getElementById(focus)
      ?.focus({ preventScroll: focus === "training-focus" });
    if (focus === "training-focus") window.scrollTo({ top: 0 });
  }
}

function recordReturnToReview(now) {
  const elapsed = now - progress.firstAnswerAt;
  if (
    !progress.returned &&
    progress.firstAnswerAt &&
    elapsed >= day &&
    elapsed <= 7 * day
  ) {
    progress.returned = true;
    reportTrainingEvent("review_7d");
    save();
  }
}

root.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-training-answer]")) return;
  event.preventDefault();
  const round = progress.round;
  if (round.index !== round.choices.length) return;
  const choice = new FormData(event.target).get("choice");
  if (!letters.includes(choice)) return;
  const number = round.queue[round.index];
  round.choices.push(choice);
  progress.seen = [...new Set([...progress.seen, number])];
  progress.wrong = progress.wrong.filter((item) => item !== number);
  if (choice !== questions.get(number).answer) progress.wrong.push(number);
  if (!progress.firstAnswerAt) {
    progress.firstAnswerAt = Date.now();
    reportTrainingEvent("first_answer");
  }
  save();
  render("training-feedback");
});

root.addEventListener("click", (event) => {
  const action = event.target.closest("[data-training-action]")?.dataset
    .trainingAction;
  if (!action) return;
  const round = progress.round;
  if (action === "next" && round.choices.length === round.index + 1) {
    round.index++;
    if (
      round.kind === "initial" &&
      round.index === round.queue.length &&
      !progress.completed
    ) {
      progress.completed = true;
      reportTrainingEvent("training_complete");
    }
  } else if (action === "review" && progress.wrong.length) {
    progress.round = newRound("review", [...progress.wrong]);
    recordReturnToReview(Date.now());
  } else if (action === "followup") {
    const queue = relatedQuestions(round);
    if (!queue.length) return;
    progress.round = newRound("followup", queue);
  } else if (action === "restart") {
    progress.round = newRound("initial", training.initial);
  } else {
    return;
  }
  save();
  render("training-focus");
});

render();
reportTrainingEvent("training_view");
if (!progress.started) {
  progress.started = true;
  reportTrainingEvent("training_start");
  save();
}
if (
  progress.round.kind === "review" &&
  progress.round.index < progress.round.queue.length
)
  recordReturnToReview(Date.now());
