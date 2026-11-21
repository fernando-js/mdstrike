import { esc, icon, shuffle, state, storage } from "./core.js?v=2.4.0";
import { entries, questions, systems } from "./coding-content.js?v=3.1.0";
import { themes } from "./medical-quiz-content.js?v=3.4.0";

const baseRoute = "#maps/codificacao";
const byId = new Map(
  [
    ...questions,
    ...Object.values(themes).flatMap((theme) => theme.questions),
  ].map((question) => [question.id, question]),
);
const modes = {
  ...systems,
  misto: {
    name: "Desafio misto",
    description:
      "Alterne entre as três tabelas e pratique decisões de registro.",
  },
};
const normalize = (text) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const compact = (text) => normalize(text).replace(/[^a-z0-9]/g, "");

function sourceLink(system, source) {
  const [label, url] = source ?? [systems[system].version, systems[system].url];
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
}

function startRound(mode) {
  const selected =
    themes[mode]?.questions ??
    Object.keys(systems).flatMap((system) => {
      const pool = questions.filter((question) => question.system === system);
      if (mode === system) return shuffle(pool);
      if (mode !== "misto") return [];
      const codeQuestions = pool.filter((question) => !question.workflow);
      const workflow = pool.filter((question) => question.workflow);
      return [...shuffle(codeQuestions).slice(0, 2), ...workflow];
    });
  return {
    cursor: 0,
    items: shuffle(selected).map(({ id, answer, alternatives }) => ({
      id,
      options: shuffle([answer, ...shuffle(alternatives).slice(0, 3)]),
      choice: null,
    })),
  };
}

function countCorrect(round) {
  return round.items.filter((item) => item.choice === byId.get(item.id).answer)
    .length;
}

function renderStart(modesProgress, records) {
  return `<div class="resource-grid coding-modes">
    ${Object.entries(modes)
      .map(([id, { name, description }]) => {
        const round = modesProgress[id];
        const action = round
          ? round.cursor < round.items.length
            ? "Continuar"
            : "Ver resultado"
          : "Iniciar treino";
        return `<article class="panel coding-mode">
        <h2>${name}</h2><p>${description}</p>
        ${records[id] ? `<small>Melhor rodada · ${records[id].score}/${records[id].total}</small>` : ""}
        <a class="btn ${id === "misto" ? "" : "outline"}" href="${baseRoute}/${id}" aria-label="${action} · ${name}">${action} ${icon("arrow", 16)}</a>
      </article>`;
      })
      .join("")}
  </div>
  <section class="panel coding-sources">
    <h2>Fontes dos exercícios</h2>
    <ul>${Object.keys(systems)
      .map((system) => `<li>${sourceLink(system)}</li>`)
      .join("")}</ul>
    <p><a href="/cid-10/">Abrir a consulta de CID-10</a></p>
    <p>O histórico das rodadas fica neste navegador.</p>
  </section>`;
}

function renderRound(mode, round, record) {
  const { items, cursor } = round;
  const item = items[cursor];
  if (!item) {
    const score = countCorrect(round);
    const wrong = items.filter(
      ({ id, choice }) => byId.get(id).answer !== choice,
    );
    return `<section class="panel coding-round">
      <h2 data-coding-focus tabindex="-1">Rodada concluída</h2>
      <p><strong class="coding-score">${score}/${items.length}</strong> acertos</p>
      <p>Melhor rodada neste navegador · ${record.score}/${record.total}</p>
      <div class="row wrap"><button class="btn" type="button" data-coding-repeat>Nova rodada</button>${themes[mode] ? '<a class="btn outline" href="#maps">Ver outros mapas</a>' : `<a class="btn outline" href="${baseRoute}/consulta">Consultar códigos</a>`}</div>
      ${
        wrong.length
          ? `<section class="coding-review"><h3>Revise suas respostas</h3>
        ${wrong
          .map(({ id, choice }) => {
            const { prompt, explanation, answer, system, source } =
              byId.get(id);
            return `<details class="resource-recall"><summary>${esc(prompt)}</summary>
            <p>Sua resposta · ${esc(choice)}</p>
            <p>Resposta certa · ${esc(answer)}</p><p>${esc(explanation)}</p>
            <p>${sourceLink(system, source)}</p></details>`;
          })
          .join("")}</section>`
          : ""
      }
    </section>`;
  }
  const { prompt, answer, explanation, system, source } = byId.get(item.id);
  const answered = item.choice !== null;
  return `<section class="panel coding-round">
    <div class="coding-round-meta"><span>Questão ${cursor + 1} de ${items.length}</span><span>${countCorrect(round)} acertos</span></div>
    <progress value="${cursor + Number(answered)}" max="${items.length}" aria-label="Progresso da rodada"></progress>
    <form data-coding-answer>
      <h2 id="coding-question" data-coding-focus tabindex="-1">${esc(prompt)}</h2>
      <fieldset aria-labelledby="coding-question" ${answered ? "disabled" : ""}>
        ${item.options
          .map(
            (
              option,
              index,
            ) => `<label class="coding-option ${answered && option === answer ? "is-correct" : ""}">
          <input type="radio" name="option" value="${index}" required ${option === item.choice ? "checked" : ""}>
          <span>${esc(option)}${answered && option === answer ? " <small>· Resposta certa</small>" : ""}</span>
        </label>`,
          )
          .join("")}
      </fieldset>
      ${
        answered
          ? `<div class="coding-feedback">
          <h3 tabindex="-1" data-coding-feedback>${item.choice === answer ? "Você acertou" : "Confira a resposta"}</h3>
          <p>${esc(explanation)}</p><p>${sourceLink(system, source)}</p>
        </div>
        <button class="btn" type="button" data-coding-next>${cursor + 1 < items.length ? "Próxima questão" : "Ver resultado"}</button>`
          : '<button class="btn" type="submit">Confirmar resposta</button>'
      }
    </form>
    ${mode === "misto" || themes[mode] ? "" : `<a class="coding-reference" href="${baseRoute}/consulta">Consultar códigos</a>`}
  </section>`;
}

function mountLookup(root) {
  root.insertAdjacentHTML(
    "beforeend",
    `<section class="panel coding-lookup">
    <div class="resource-filters">
      <label class="field"><span>Buscar por código ou termo</span><input id="coding-search" type="search" placeholder="Ex. ECG, E11.9, hemograma" autocomplete="off"></label>
      <label class="field"><span>Tabela</span><select id="coding-system"><option value="">Todas as tabelas</option>
        ${Object.entries(systems)
          .map(([id, { name }]) => `<option value="${id}">${name}</option>`)
          .join("")}
      </select></label>
    </div>
    <p role="status" data-coding-count></p>
    <ul class="coding-results" data-coding-results></ul>
  </section>`,
  );
  const search = root.querySelector("#coding-search");
  const table = root.querySelector("#coding-system");
  const count = root.querySelector("[data-coding-count]");
  const results = root.querySelector("[data-coding-results]");

  function filter() {
    const query = normalize(search.value.trim());
    const code = compact(query);
    const words = query.split(/\s+/);
    const visible = entries.filter(
      (entry) =>
        (!table.value || entry.system === table.value) &&
        (!query ||
          (code && compact(entry.code).includes(code)) ||
          words.every((word) =>
            normalize(entry.label + " " + entry.aliases).includes(word),
          )),
    );
    count.textContent =
      visible.length === 1
        ? "1 código na seleção de treino."
        : `${visible.length} códigos na seleção de treino.`;
    results.innerHTML = visible.length
      ? visible
          .map(
            ({ code, label, system }) =>
              `<li><strong>${esc(code)}</strong><div>${esc(label)}<small>${sourceLink(system)}</small></div><span>${systems[system].name}</span></li>`,
          )
          .join("")
      : "<li>Experimente outro termo ou confira a tabela selecionada.</li>";
  }

  search.addEventListener("input", filter);
  table.addEventListener("change", filter);
  filter();
}

export function mountCodingGame(view, mode) {
  const theme = themes[mode];
  const storageKey = `mdstrike_${theme ? "thematic" : "coding"}_v1_${state.user?.id ?? "guest"}`;
  const { rounds = {}, records = {} } = storage.get(storageKey, {});
  const title =
    mode === "consulta"
      ? "Consultar códigos"
      : (theme?.name ?? modes[mode]?.name ?? "Codificação em saúde");
  const subtitle =
    mode === "consulta"
      ? "Pesquise os códigos selecionados para o treino e abra a tabela de origem."
      : (theme?.description ??
        modes[mode]?.description ??
        "Pratique quando usar CID-10, SIGTAP e TUSS com situações de prontuário e registro de procedimentos.");
  view.innerHTML = `<div class="coding-page">
    <div class="breadcrumb"><a href="#maps" data-back-route>Mapas</a>${mode && !theme ? ` / <a href="${baseRoute}" data-back-route>Codificação em saúde</a>` : ""}</div>
    <div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>
    ${mode ? "" : `<a class="btn outline" href="${baseRoute}/consulta">Consultar códigos ${icon("arrow", 16)}</a>`}</div>
    ${mode === "medicamentos" ? '<p class="section-return"><a href="#consulta/bulas" data-back-route>Consultar bulas resumidas</a></p>' : ""}
    <div data-coding-body></div>
  </div>`;
  const root = view.querySelector("[data-coding-body]");
  if (mode === "consulta") {
    mountLookup(root);
    return;
  }
  if (!mode) {
    root.innerHTML = renderStart(rounds, records);
    return;
  }

  let round = rounds[mode] ?? startRound(mode);
  let record = records[mode];
  const render = (focus) => {
    root.innerHTML = renderRound(mode, round, record);
    if (focus) root.querySelector(focus)?.focus();
  };
  const save = () => {
    const latest = storage.get(storageKey, {});
    const nextRecords = latest.records ?? {};
    const previous = nextRecords[mode];
    if (previous && (!record || previous.score > record.score))
      record = previous;
    if (record) nextRecords[mode] = record;
    storage.set(storageKey, {
      rounds: { ...latest.rounds, [mode]: round },
      records: nextRecords,
    });
  };
  root.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-coding-answer]")) return;
    event.preventDefault();
    const selected = new FormData(event.target).get("option");
    const item = round.items[round.cursor];
    if (selected === null || !item || item.choice !== null) return;
    const choice = item.options[Number(selected)];
    if (choice === undefined) return;
    item.choice = choice;
    save();
    render("[data-coding-feedback]");
  });
  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-coding-next]")) {
      round.cursor += 1;
      if (round.cursor === round.items.length) {
        const score = countCorrect(round);
        if (!record || score > record.score)
          record = { score, total: round.items.length };
      }
    } else if (event.target.closest("[data-coding-repeat]")) {
      round = startRound(mode);
    } else {
      return;
    }
    save();
    render("[data-coding-focus]");
  });
  render();
}
