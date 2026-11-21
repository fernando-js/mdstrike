import { esc } from "./core.js?v=2.4.0";

const imageFolder = "/assets/images/avatars/";
let catalog;
let catalogRequest;

export function loadAvatarCatalog() {
  catalogRequest ??= fetch("/assets/data/avatar-catalog.json?v=2.6.0")
    .then(async (response) => {
      if (!response.ok)
        throw new Error("Não foi possível carregar as peças do avatar.");
      catalog = await response.json();
    })
    .catch((error) => {
      catalogRequest = undefined;
      throw error;
    });
  return catalogRequest;
}

function selectedItem(category, id) {
  return (
    category.items.find((item) => item.id === id) ??
    category.items.find((item) => item.id === category.default)
  );
}

function imageUrl(image) {
  return `${imageFolder}${esc(image)}.webp`;
}

function layer(slot, image, position) {
  const [left, top, width, height] = position.map((value) => value.toFixed(2));
  return `<img class="avatar-layer" data-avatar-slot="${slot}" src="${imageUrl(image)}" alt="" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%">`;
}

function equipmentLayers(slot, item, portrait) {
  const [left, top, right] = portrait.neck;
  if (slot === "coat") {
    const center = (left + right) / 2;
    const width = Math.max(109, Math.min(118, (right - left) * 3.55));
    const y = top - 1.5;
    return `<div class="avatar-coat-shape" style="--avatar-shape:url('${imageUrl(portrait.image)}')">${layer(slot, item.image, [center - width / 2, y, width, 102 - y])}</div>`;
  }
  if (slot === "stethoscope") {
    const height = Math.min(34, 96 - top);
    return (
      layer(slot, item.parts[0], [left - 14, top + 0.2, 16, height - 1]) +
      layer(slot, item.parts[1], [right - 1.6, top + 0.2, 15, height])
    );
  }
  return layer(slot, item.image, item.layer);
}

export function avatarStage(selection, label, className = "") {
  const portrait = catalog
    ? selectedItem(catalog.portrait, selection?.portrait)
    : { image: "iris" };
  const equipment = catalog
    ? Object.entries(catalog)
        .filter(([slot]) => slot !== "portrait")
        .map(([slot, category]) => {
          const item = selectedItem(category, selection?.[slot]);
          return item.image ? equipmentLayers(slot, item, portrait) : "";
        })
        .join("")
    : "";
  return `<div class="avatar-stage ${className}" role="img" aria-label="${esc(label)}">${layer("portrait", portrait.image, [0, 0, 100, 100])}${equipment}</div>`;
}

export function avatarChoices(form) {
  return Object.fromEntries(
    Object.keys(catalog).map((slot) => [
      slot,
      form.elements.namedItem(slot).value,
    ]),
  );
}

function itemOptions(slot, selection) {
  const category = catalog[slot];
  return `<legend>${esc(category.label)}</legend><div class="avatar-options" data-slot="${slot}">${category.items
    .map(
      (item) => `
    <label class="avatar-option">
      <input type="radio" name="avatar-item" value="${esc(item.id)}" ${selection[slot] === item.id ? "checked" : ""}>
      <span class="avatar-option-card">
        <span class="avatar-option-image">${item.image ? `<img src="${imageUrl(item.image)}" alt="">` : '<span class="avatar-option-empty" aria-hidden="true">—</span>'}</span>
        <span>${esc(item.name)}</span>
      </span>
    </label>`,
    )
    .join("")}</div>`;
}

export function avatarEditor(value, signedIn) {
  const selection = Object.fromEntries(
    Object.entries(catalog).map(([slot, category]) => [
      slot,
      selectedItem(category, value?.[slot]).id,
    ]),
  );
  return `<form id="avatar-form" class="modal-content avatar-editor">
    <div class="modal-top"><h2 id="modal-title">Personalizar avatar</h2><button type="button" class="close-button" data-close aria-label="Fechar">×</button></div>
    <div class="avatar-editor-layout">
      <div id="avatar-preview">${avatarStage(selection, "Prévia do avatar", "avatar-preview-stage")}</div>
      <div class="avatar-picker">
        <label class="field"><span>Categoria</span><select id="avatar-category">${Object.entries(
          catalog,
        )
          .map(
            ([slot, category]) =>
              `<option value="${esc(slot)}">${esc(category.label)}</option>`,
          )
          .join("")}</select></label>
        <fieldset id="avatar-items">${itemOptions("portrait", selection)}</fieldset>
        ${Object.entries(selection)
          .map(
            ([slot, id]) =>
              `<input type="hidden" name="${esc(slot)}" value="${esc(id)}">`,
          )
          .join("")}
      </div>
    </div>
    <div class="form-error" role="alert"></div>
    <div class="avatar-editor-actions row wrap">
      <button class="btn" type="submit">Salvar avatar</button>
      <button class="btn outline" type="button" data-close>Cancelar</button>
      <span class="muted small-text">${signedIn ? "Salvo na sua conta." : "Salvo neste navegador."}</span>
    </div>
  </form>`;
}

export function updateAvatarEditor(event) {
  const input = event.target;
  const form = input.closest("#avatar-form");
  if (!form) return;
  const slot = form.querySelector("#avatar-category").value;
  if (input.id === "avatar-category") {
    form.querySelector("#avatar-items").innerHTML = itemOptions(
      slot,
      avatarChoices(form),
    );
  } else if (input.name === "avatar-item") {
    form.elements.namedItem(slot).value = input.value;
    form.querySelector("#avatar-preview").innerHTML = avatarStage(
      avatarChoices(form),
      "Prévia do avatar",
      "avatar-preview-stage",
    );
  }
}
