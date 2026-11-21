const listControls = [
  "#map-search",
  "#map-area",
  "#map-content",
  "#exam-search",
  "#exam-filter",
  "#coding-search",
  "#coding-system",
  "[data-resource-search]",
  "[data-resource-filter]",
  "[data-resource-bookmarks]",
];
const savedViews = new Map();
let sequence = 0;
let entry = null;

history.scrollRestoration = "manual";

function currentEntry() {
  const saved = history.state?.mdstrike;
  return Number.isSafeInteger(saved?.id) ? saved : null;
}

export function rememberView(view) {
  if (!entry) return;
  const fields = listControls.flatMap((selector) => {
    const field = view.querySelector(selector);
    return field
      ? [[selector, field.type === "checkbox" ? field.checked : field.value]]
      : [];
  });
  const details = [
    ...view.querySelectorAll(".resource-summary, .resource-recall"),
  ].map((element) => element.open);
  savedViews.set(entry.id, { fields, details, scroll: window.scrollY });
  // Keep navigation state in this tab and cap the number of remembered pages.
  if (savedViews.size > 100) savedViews.delete(savedViews.keys().next().value);
}

export function setRouteHistory(path, mode = "push") {
  const samePath = location.hash === "#" + path;
  const existing = mode === "traverse" ? currentEntry() : entry;
  const push = mode === "push" && !samePath;
  const next =
    push || !existing ? { id: ++sequence, previous: entry?.path } : existing;
  entry = { ...next, path };
  sequence = Math.max(sequence, entry.id);
  history[push ? "pushState" : "replaceState"](
    { mdstrike: entry },
    "",
    "#" + path,
  );
}

export function previousRoute() {
  return entry?.previous;
}

export function clearSavedViews() {
  savedViews.clear();
}

export function restoreActiveUrl() {
  if (entry) history.pushState({ mdstrike: entry }, "", "#" + entry.path);
}

export function restoreView(view, mode) {
  const saved = mode === "traverse" && savedViews.get(entry.id);
  if (saved) {
    for (const [selector, value] of saved.fields) {
      const field = view.querySelector(selector);
      if (!field) continue;
      const isCheckbox = field.type === "checkbox";
      if (isCheckbox) field.checked = value;
      else field.value = value;
      field.dispatchEvent(
        new Event(
          isCheckbox || field.tagName === "SELECT" ? "change" : "input",
          { bubbles: true },
        ),
      );
    }
    view
      .querySelectorAll(".resource-summary, .resource-recall")
      .forEach((element, index) => {
        if (saved.details[index] !== undefined)
          element.open = saved.details[index];
      });
  }
  window.scrollTo({ top: saved?.scroll ?? 0 });
}

export function focusPage(view) {
  const title = view.querySelector("h1") || view.closest("main");
  if (!title) return;
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}
