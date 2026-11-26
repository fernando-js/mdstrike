import { esc, icon, storage } from "./core.js?v=2.4.0";
import {
  teaCases,
  teaLibrary,
  teaMissions,
  teaSources,
} from "./tea-content.js?v=1.1.0";

const questions = new Map(
  teaMissions.flatMap(({ questions }) =>
    questions.map((question) => [question.id, question]),
  ),
);
const key = (id) => `mdstrike_tea_${id}`;
const read = (id, fallback) => storage.get(key(id), fallback);
const returnButton =
  '<button class="text-button" data-tea="map">‹ Voltar ao mapa do TEA</button>';
const sourceLink = ([label, url]) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

function shuffle(values) {
  const ordered = [...values];
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  return ordered;
}

function checkpoints(section, total) {
  return `<p class="tea-checkpoint"><span>${section + 1} de ${total}</span><progress max="${total}" value="${section + 1}" aria-label="Posição na atividade"></progress></p>`;
}

function missionCard(mission, outcomes, readLocal) {
  const ids = mission.questions.map(({ id }) => id);
  const seen = ids.filter((id) => Object.hasOwn(outcomes, id)).length;
  const score = readLocal(`result_${mission.id}`, null);
  const draft = readLocal(`active_${mission.id}`, null);
  const points = [...new Set(mission.questions.map(({ point }) => point))].sort(
    (a, b) => a - b,
  );
  return `<article class="panel tea-mission">
    <h3>${icon(mission.icon, 23)} ${esc(mission.title)}</h3>
    <p>${esc(mission.description)}</p>
    <div class="tea-mission-progress">
      <progress value="${seen}" max="${ids.length}" aria-label="Questões praticadas em ${esc(mission.title)}"></progress>
      <small>${seen}/${ids.length} praticadas${score !== null ? ` · ${score}/${ids.length} acertos na última missão` : ""}</small>
      <small>Edital · pontos ${points.join(", ")}</small>
    </div>
    <button class="btn outline" data-tea="mission" data-id="${mission.id}">${draft ? "Retomar missão" : score === null ? "Iniciar missão" : "Refazer missão"} ${icon("arrow", 15)}</button>
  </article>`;
}

function mapPage(readLocal) {
  const outcomes = readLocal("outcomes", {});
  const missed = [...questions.keys()].filter(
    (id) => outcomes[id] === false,
  ).length;
  const practiced = [...questions.keys()].filter((id) =>
    Object.hasOwn(outcomes, id),
  ).length;
  const completedCases = teaCases.filter(({ id }) =>
    readLocal(`complete_${id}`, false),
  ).length;
  return `<section class="operation tea-hero">
    <img src="/assets/images/anestesiologia.jpg" width="1672" height="941" alt="" fetchpriority="high">
    <div class="operation-copy">
      <h1>Operação TEA</h1>
      <p>Prepare-se para o Título de Especialista em Anestesiologia com questões comentadas e casos clínicos.</p>
      <button class="btn" data-jump-to="tea-missions">Ver missões ${icon("arrow", 16)}</button>
    </div>
  </section>
  <div class="tea-overview" aria-label="Seu progresso">
    <span><strong>${practiced}/${questions.size}</strong> questões praticadas</span>
    <span><strong>${completedCases}/${teaCases.length}</strong> casos concluídos</span>
    <span><strong>${missed}</strong> ${missed === 1 ? "questão para revisar" : "questões para revisar"}</span>
  </div>
  <section class="panel lobby-revalida">
    <div><h2>Desafie um colega no TEA</h2><p>Escolha uma missão ou misture os temas. Compartilhe o link para jogar as mesmas questões e comparar os resultados.</p></div>
    <button class="btn outline" data-new-challenge="tea">Criar desafio TEA ${icon("trophy", 16)}</button>
  </section>
  <section class="operation-section">
    <div class="section-heading"><h2 class="section-anchor" id="tea-missions" tabindex="-1">Missões por tema</h2></div>
    <div class="operation-maps">${teaMissions
      .map((mission) => missionCard(mission, outcomes, readLocal))
      .join("")}</div>
  </section>
  <section class="operation-section">
    <div class="section-heading"><h2>Casos clínicos</h2></div>
    <p>Escreva uma resposta curta em cada etapa e compare com o espelho comentado antes de ver a evolução.</p>
    <div class="operation-maps">${teaCases
      .map((entry) => {
        const active = readLocal(`active_${entry.id}`, null);
        const complete = readLocal(`complete_${entry.id}`, false);
        return `<article class="panel tea-mission">
        <h3>${esc(entry.title)}</h3><p>${esc(entry.description)}</p>
        <button class="btn outline" data-tea="case" data-id="${entry.id}">${active ? "Retomar caso" : complete ? "Refazer caso" : "Abrir caso"} ${icon("arrow", 15)}</button>
      </article>`;
      })
      .join("")}</div>
  </section>
  <section class="panel lobby-revalida">
    <div><h2>Revisão de erros</h2><p>${missed ? "Pratique novamente as questões que ficaram na revisão." : "As questões que você errar aparecem aqui."}</p></div>
    <button class="btn outline" data-tea="review" ${missed ? "" : "disabled"}>Revisar erros ${icon("repeat", 16)}</button>
  </section>
  <details class="panel operation-section tea-sources">
    <summary>Fontes e materiais da SBA</summary>
    <ul>${teaLibrary.map((entry) => `<li>${sourceLink(entry)}</li>`).join("")}</ul>
  </details>
  <p class="tea-note">Treino autoral do MD Strike baseado no edital de 2026, com revisão médica independente pendente. O progresso é salvo neste navegador.</p>`;
}

function quizPage(run) {
  const item = questions.get(run.ids[run.step]);
  const correct = run.picks[item.id] === 0;
  const checked = Object.hasOwn(run.picks, item.id);
  const options = [item.correct, ...item.alternatives];
  return `<div class="tea-activity">${returnButton}
    <h1>${esc(run.title)}</h1>
    ${checkpoints(run.step, run.ids.length)}
    <section class="panel">
      <p class="tea-note">Ponto ${item.point} do edital</p>
      <h2>${esc(item.prompt)}</h2>
      <div class="answers">${run.orders[item.id]
        .map((index, position) => {
          const mark =
            checked &&
            (index === 0
              ? "correct"
              : index === run.picks[item.id]
                ? "incorrect"
                : "");
          const status =
            mark === "correct"
              ? " · alternativa correta"
              : mark === "incorrect"
                ? " · resposta incorreta"
                : "";
          return `<button class="answer ${mark || ""}" data-tea="pick" data-index="${index}" ${checked ? "disabled" : ""}>
          <span class="answer-letter" aria-hidden="true">${"ABCD"[position]}</span><span>${esc(options[index])}${status ? `<span class="sr-only">${status}</span>` : ""}</span></button>`;
        })
        .join("")}</div>
      ${
        checked
          ? `<div class="tea-feedback">
        <h3 tabindex="-1" data-tea-feedback>${correct ? "Resposta correta" : "Resposta incorreta"}</h3>
        <p>${esc(item.explanation)}</p><p>${sourceLink(teaSources[item.source])}</p>
        <button class="btn" data-tea="next">${run.step + 1 === run.ids.length ? "Ver resultado" : "Próxima questão"} ${icon("arrow", 15)}</button>
      </div>`
          : ""
      }
    </section>
  </div>`;
}

function casePage(entry, run) {
  const item = entry.steps[run.step];
  return `<div class="tea-activity">${returnButton}
    <h1>${esc(entry.title)}</h1>
    <p class="tea-note">${esc(entry.description)}</p>
    ${checkpoints(run.step, entry.steps.length)}
    <section class="panel">
      <p class="tea-scenario">${esc(item.scenario)}</p>
      <form data-tea-case-form>
        <label class="field"><span>${esc(item.prompt)}</span>
          <textarea name="response" required maxlength="1200" rows="4" ${run.revealed ? "readonly" : ""} placeholder="Escreva sua resposta…">${esc(run.text)}</textarea>
        </label>
        ${run.revealed ? "" : '<button class="btn" type="submit">Conferir espelho</button>'}
      </form>
      ${
        run.revealed
          ? `<div class="tea-feedback">
        <h2 tabindex="-1" data-tea-feedback>Espelho comentado</h2>
        <p>${esc(item.feedback)}</p><p>${sourceLink(teaSources[entry.source])}</p>
        <button class="btn" data-tea="next">${run.step + 1 === entry.steps.length ? "Concluir caso" : "Ver evolução"} ${icon("arrow", 15)}</button>
      </div>`
          : ""
      }
    </section>
  </div>`;
}

function resultPage(run, entry) {
  const correct = Object.values(run.picks ?? {}).filter(
    (answer) => answer === 0,
  ).length;
  return `<div class="tea-activity"><section class="panel tea-result">
    <h1>${entry ? "Caso concluído" : run.id === "review" ? "Revisão concluída" : "Missão concluída"}</h1>
    <p>${entry ? esc(entry.title) + " · " + entry.steps.length + " etapas" : `${correct} de ${run.ids.length} questões corretas`}</p>
    <button class="btn" data-tea="map">Voltar ao mapa do TEA ${icon("arrow", 15)}</button>
  </section></div>`;
}

function newQuiz(id, title, ids) {
  return {
    id,
    title,
    ids: shuffle(ids),
    step: 0,
    picks: {},
    orders: Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3])])),
  };
}

export function mountTea(view) {
  const host = document.createElement("div");
  host.className = "tea-operation";
  view.replaceChildren(host);
  let run = null;
  let entry = null;
  let completed = false;
  let storageFailed = false;
  const memory = new Map();
  const readLocal = (id, fallback) =>
    memory.has(id) ? (memory.get(id) ?? fallback) : read(id, fallback);

  function save(id, value) {
    const persisted = storage.set(key(id), value);
    if (persisted) memory.delete(id);
    else {
      memory.set(id, value);
      storageFailed = true;
    }
  }

  function render(focus) {
    host.innerHTML =
      (completed
        ? resultPage(run, entry)
        : entry
          ? casePage(entry, run)
          : run
            ? quizPage(run)
            : mapPage(readLocal)) +
      `<p class="tea-note" role="status" data-tea-storage ${storageFailed ? "" : "hidden"}>O navegador não conseguiu salvar o progresso.</p>`;
    if (!focus) return;
    if (focus === "heading") window.scrollTo({ top: 0 });
    const target = host.querySelector(
      focus === "feedback" ? "[data-tea-feedback]" : "h1",
    );
    target.tabIndex = -1;
    target.focus({ preventScroll: focus === "heading" });
  }

  function saveActive() {
    if (run.id !== "review") save(`active_${run.id}`, run);
  }

  host.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tea]");
    if (!button || button.disabled) return;
    const { tea: action, id } = button.dataset;
    if (action === "map") {
      run = null;
      entry = null;
      completed = false;
    } else if (action === "mission") {
      const mission = teaMissions.find((item) => item.id === id);
      run =
        readLocal(`active_${id}`, null) ??
        newQuiz(
          id,
          mission.title,
          mission.questions.map(({ id }) => id),
        );
      saveActive();
    } else if (action === "review") {
      const outcomes = readLocal("outcomes", {});
      const ids = [...questions.keys()].filter((id) => outcomes[id] === false);
      if (!ids.length) return render("heading");
      run = newQuiz("review", "Revisão de erros", ids);
    } else if (action === "case") {
      entry = teaCases.find((item) => item.id === id);
      run = readLocal(`active_${id}`, null) ?? {
        id,
        step: 0,
        text: "",
        revealed: false,
      };
      saveActive();
    } else if (action === "pick") {
      const questionId = run.ids[run.step];
      if (Object.hasOwn(run.picks, questionId)) return;
      const answer = Number(button.dataset.index);
      run.picks[questionId] = answer;
      save("outcomes", {
        ...readLocal("outcomes", {}),
        [questionId]: answer === 0,
      });
      saveActive();
      return render("feedback");
    } else if (action === "next") {
      if (run.step + 1 === (entry?.steps.length ?? run.ids?.length)) {
        completed = true;
        if (entry) save(`complete_${run.id}`, true);
        else if (run.id !== "review") {
          save(
            `result_${run.id}`,
            Object.values(run.picks).filter((answer) => answer === 0).length,
          );
        }
        if (run.id !== "review") save(`active_${run.id}`, null);
      } else {
        run.step++;
        if (entry) {
          run.text = "";
          run.revealed = false;
        }
        saveActive();
      }
    }
    render("heading");
  });

  host.addEventListener("input", (event) => {
    if (event.target.name !== "response" || !entry || run.revealed) return;
    run.text = event.target.value;
    saveActive();
    host.querySelector("[data-tea-storage]").hidden = !storageFailed;
    event.target.setCustomValidity("");
  });

  host.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-tea-case-form]")) return;
    event.preventDefault();
    if (!entry || run.revealed) return;
    const field = event.target.elements.response;
    if (!field.value.trim()) {
      field.setCustomValidity("Escreva uma resposta para conferir o espelho.");
      field.reportValidity();
      return;
    }
    run.text = field.value.trim();
    run.revealed = true;
    saveActive();
    render("feedback");
  });

  render();
}
