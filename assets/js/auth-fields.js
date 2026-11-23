export function passwordField({
  id,
  name = "password",
  label = "Senha",
  isNew = false,
  showRules = false,
}) {
  return `<div class="field password-field">
    <label for="${id}" id="${id}-label">${label}</label>
    <div class="password-input">
      <input id="${id}" name="${name}" type="password" autocomplete="${isNew ? "new-password" : "current-password"}" ${isNew ? 'minlength="10" maxlength="72"' : ""} ${showRules ? `aria-describedby="${id}-rules"` : ""} required>
      <button type="button" class="password-toggle" data-password-toggle aria-controls="${id}" aria-describedby="${id}-label">Mostrar senha</button>
    </div>
    ${showRules ? `<small id="${id}-rules" class="muted">De 10 a 72 caracteres. Maiúsculas, números e símbolos são opcionais.</small>` : ""}
  </div>`;
}

export function setPasswordVisibility(button, visible) {
  const input = document.getElementById(button.getAttribute("aria-controls"));
  if (!input) return;
  visible ??= input.type === "password";
  input.type = visible ? "text" : "password";
  button.textContent = visible ? "Ocultar senha" : "Mostrar senha";
}

export function googleButton(label, attributes) {
  return `<button class="google-auth-button" ${attributes}><img src="assets/images/google-sign-in.png" width="18" height="18" alt="">${label}</button>`;
}
