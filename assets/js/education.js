import { esc } from "./core.js?v=2.4.0";
let catalogPromise;
let catalog;
export function educationFields(player) {
  const e = player.education;
  const legacy = !e && !!player.institution;
  const status = e?.status || (legacy ? "keep" : "");
  const manual = e?.mode === "manual" || legacy;
  return `<fieldset id="education-fields" class="education-fields full-width"><legend>Formação acadêmica (opcional)</legend><p class="small-text">Informe a faculdade em que estuda ou se formou. Estes dados ficam no seu perfil e na administração, fora do ranking público. O vínculo é autodeclarado.</p>${legacy ? `<p class="notice">Instituição já informada: ${esc(player.institution)}. Você pode mantê-la ou completar o vínculo abaixo.</p>` : ""}<label class="field"><span>Vínculo com a faculdade</span><select name="educationStatus">${[...(legacy ? [["keep", "Manter instituição já informada"]] : []), ["", "Prefiro não informar"], ["studying", "Atualmente cursando"], ["graduated", "Já formado(a)"]].map(([id, label]) => `<option value="${id}" ${status === id ? "selected" : ""}>${label}</option>`).join("")}</select></label><div class="education-location form-grid" ${["studying", "graduated"].includes(status) ? "" : "hidden"}><input type="hidden" name="educationMode" value="${manual ? "manual" : "listed"}"><label class="field"><span>Estado da faculdade</span><select name="educationState"><option value="">Selecione o estado</option></select></label><label class="field"><span>Município da faculdade</span><select name="educationMunicipality" disabled><option value="">Selecione o estado primeiro</option></select></label><label class="check-label full-width"><input type="checkbox" data-education-manual ${manual ? "checked" : ""}><span>Não encontrei minha faculdade ou estudei no exterior: informar manualmente</span></label><label class="field full-width" data-education-listed><span>Faculdade / instituição</span><select name="educationInstitution" disabled><option value="">Selecione o município primeiro</option></select></label><label class="field full-width" data-education-name ${manual ? "" : "hidden"}><span>Nome da faculdade</span><input name="institution" maxlength="255" value="${esc(e?.institution || player.institution || "")}" placeholder="Nome da instituição, inclusive no exterior"></label><p class="small-text full-width" id="education-feedback" role="status">Carregando a lista de instituições…</p></div></fieldset>`;
}

export async function mountEducation(player) {
  const host = document.querySelector("#education-fields");
  if (!host) return;
  const status = host.querySelector("[name=educationStatus]"),
    uf = host.querySelector("[name=educationState]"),
    city = host.querySelector("[name=educationMunicipality]"),
    school = host.querySelector("[name=educationInstitution]"),
    manual = host.querySelector("[data-education-manual]"),
    name = host.querySelector("[name=institution]");
  const initial = player.education;
  const refresh = () => {
    const active = ["studying", "graduated"].includes(status.value);
    host.querySelector(".education-location").hidden = !active;
    host.querySelector("[name=educationMode]").value = manual.checked
      ? "manual"
      : "listed";
    uf.disabled = !active || !catalog;
    city.disabled = !active || !catalog || !uf.value;
    school.disabled = !active || manual.checked || !catalog || !city.value;
    name.disabled = !active || !manual.checked;
    host.querySelector("[data-education-listed]").hidden = manual.checked;
    host.querySelector("[data-education-name]").hidden = !manual.checked;
  };
  const schools = (selected = "") => {
    const place = catalog?.states
      .find((s) => s.id === uf.value)
      ?.cities.find((c) => c.id === city.value);
    school.innerHTML =
      '<option value="">Selecione a faculdade</option>' +
      (place?.institutions || [])
        .map((id) => {
          const i = catalog.institutions[id];
          return `<option value="${esc(id)}" ${id === selected ? "selected" : ""}>${esc(i.name)}${i.acronym ? " · " + esc(i.acronym) : ""}</option>`;
        })
        .join("");
    refresh();
  };
  const cities = (selected = "", selectedSchool = "") => {
    const region = catalog?.states.find((s) => s.id === uf.value);
    city.innerHTML =
      '<option value="">Selecione o município</option>' +
      (region?.cities || [])
        .map(
          (c) =>
            `<option value="${esc(c.id)}" ${c.id === selected ? "selected" : ""}>${esc(c.name)}</option>`,
        )
        .join("");
    schools(selectedSchool);
  };
  status.addEventListener("change", refresh);
  manual.addEventListener("change", refresh);
  uf.addEventListener("change", () => cities());
  city.addEventListener("change", () => schools());
  refresh();
  try {
    catalogPromise ??= fetch("assets/data/institutions.json?v=2.4.0")
      .then(async (response) => {
        if (!response.ok) throw new Error("Lista indisponível");
        return response.json();
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
    const loaded = await catalogPromise;
    if (!host.isConnected) return;
    catalog = loaded;
    uf.innerHTML =
      '<option value="">Não informado / exterior</option>' +
      catalog.states
        .map(
          (s) =>
            `<option value="${s.id}" ${s.id === initial?.state ? "selected" : ""}>${esc(s.name)} (${s.id})</option>`,
        )
        .join("");
    cities(initial?.municipalityId, initial?.institutionId);
    if (initial?.mode === "listed" && school.value !== initial.institutionId)
      manual.checked = true;
    host.querySelector("#education-feedback").innerHTML =
      `Fonte: <a href="${esc(catalog.sourcePage)}" target="_blank" rel="noopener noreferrer">Inep · Censo Superior ${catalog.referenceYear} ↗</a>. Consulta em ${new Date(catalog.retrievedAt + "T12:00:00").toLocaleDateString("pt-BR")}. Municípios da sede e da oferta presencial; não identifica todos os campi nem comprova situação regulatória atual. Não encontrou? Informe manualmente.`;
    refresh();
  } catch {
    if (!host.isConnected) return;
    manual.checked = true;
    host.querySelector("#education-feedback").textContent =
      "A lista está indisponível no momento. Você pode informar a faculdade manualmente, sem estado ou município.";
    refresh();
  }
}

export function educationFromForm(data) {
  if (!data.educationStatus || data.educationStatus === "keep") return null;
  const state = catalog?.states.find((s) => s.id === data.educationState);
  const city = state?.cities.find((c) => c.id === data.educationMunicipality);
  const manual = data.educationMode === "manual";
  const institution = manual
    ? String(data.institution || "").trim()
    : catalog?.institutions[data.educationInstitution]?.name;
  if (
    !institution ||
    (!manual && !city?.institutions.includes(data.educationInstitution))
  )
    throw new Error(
      "Selecione a faculdade da lista ou informe o nome manualmente.",
    );
  return {
    status: data.educationStatus,
    mode: manual ? "manual" : "listed",
    institutionId: manual ? "" : data.educationInstitution,
    institution,
    state: state?.id || "",
    municipalityId: city?.id || "",
    municipality: city?.name || "",
    sourceVersion: manual ? "self-declared" : catalog.version,
  };
}
