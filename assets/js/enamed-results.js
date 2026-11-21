const state = document.querySelector("#enamed-uf");
const city = document.querySelector("#enamed-city");
if (state && city) {
  const options = [...city.options];
  const applyState = () => {
    const current = city.value;
    const visible = options.filter(
      (option) =>
        !option.value || !state.value || option.dataset.uf === state.value,
    );
    city.replaceChildren(...visible);
    city.value = visible.some((option) => option.value === current)
      ? current
      : "";
  };
  state.addEventListener("change", applyState);
  applyState();
}

const form = document.querySelector("#enamed-compare-select");
if (form) {
  const storageKey = "mdstrike_enamed_comparison";
  const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
  const summary = document.querySelector("#enamed-selected-summary");
  const labels = document.querySelector("#enamed-selection-labels");
  const clear = document.querySelector("#enamed-clear-selection");
  let selected = new Map();
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) {
      selected = new Map(
        saved
          .filter(
            (row) =>
              Array.isArray(row) &&
              /^\d{1,12}$/.test(row[0]) &&
              typeof row[1] === "string",
          )
          .slice(0, 3),
      );
    }
  } catch {
    /* Comparison still works with storage disabled. */
  }

  const render = () => {
    for (const input of inputs) {
      input.checked = selected.has(input.value);
      input.disabled = selected.size === 3 && !input.checked;
    }
    summary.textContent = selected.size
      ? `${selected.size} de 3 cursos selecionados.`
      : "Selecione até 3 cursos para comparar.";
    labels.textContent = [...selected.values()].join(" · ");
    clear.hidden = !selected.size;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...selected]));
    } catch {
      /* Optional across-page selection. */
    }
  };
  form.addEventListener("change", (event) => {
    const input = event.target;
    if (!inputs.includes(input)) return;
    if (input.checked && selected.size < 3)
      selected.set(input.value, input.dataset.name);
    if (!input.checked) selected.delete(input.value);
    render();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = new URL(form.action);
    if (selected.size)
      url.searchParams.set("cursos", [...selected.keys()].join(","));
    location.assign(url);
  });
  clear.addEventListener("click", () => {
    selected.clear();
    render();
    inputs[0]?.focus();
  });
  render();
}

if (navigator.clipboard?.writeText) {
  for (const button of document.querySelectorAll("[data-copy-course]")) {
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href.split("#")[0]);
        button.textContent = "Link copiado";
        document.querySelector("#enamed-action-status").textContent =
          "Link copiado.";
      } catch {
        document.querySelector("#enamed-action-status").textContent =
          "Copie o link pela barra de endereço.";
        button.textContent = "Use a barra de endereço";
      }
    });
  }
}
