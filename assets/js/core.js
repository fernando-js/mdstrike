import catalog from "./catalog.js?v=2.1.0";
export { catalog };
export const $ = (selector) => document.querySelector(selector);
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const number = (value) => Number(value || 0).toLocaleString("pt-BR");
export const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
const old = storage.get("mds_profile", null);
export const guest = storage.get("mdstrike_guest_v2", {
  nickname: old?.nick || "Convidado",
  rating: old?.elo || 1000,
  xp: old?.xp || 0,
  points: 0,
  played: old?.played || 0,
  wins: old?.wins || 0,
  answered: 0,
  correct: 0,
  stats: {},
  wrong: [],
  history: [],
  specialty: "",
  status: "available",
});
export const state = {
  user: null,
  csrf: "",
  configured: false,
  page: "lobby",
  mode: "practice",
  sound: storage.get("mdstrike_sound", true),
  profile: null,
  game: null,
  challengeId: null,
  pendingChallenge: null,
};
export const player = () => state.user || guest;
export const saveGuest = () => storage.set("mdstrike_guest_v2", guest);
export const specialtyName = (id) =>
  catalog.specialties.find((s) => s.id === id)?.name ||
  catalog.areas[id] ||
  "Todas as áreas";
export const modeName = (mode) =>
  ({
    practice: "Treino livre",
    duel: "Duelo com bot",
    competitive: "Competitivo 5v5",
    cup: "Copa MD Strike",
    exam: "Caderno oficial",
    review: "Revisar erros",
    challenge: "Desafio entre colegas",
  })[mode] || mode;
export function rankName(rating) {
  let rank = "Recruta";
  for (const [min, name] of [
    [900, "Prata I"],
    [1000, "Prata Elite"],
    [1100, "Ouro I"],
    [1250, "Ouro Elite"],
    [1400, "Guardião"],
    [1600, "Águia"],
    [1800, "Mestre Supremo"],
    [2000, "Elite Global"],
  ])
    if (rating >= min) rank = name;
  return rank;
}
export const rank = () =>
  player().played ? rankName(player().rating) : "Recruta";
const paths = {
  crosshair:
    '<circle cx="12" cy="12" r="7"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  trophy:
    '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v6m-4 2h8"/>',
  ranking: '<path d="M4 21V12h4v9m2 0V7h4v14m2 0V3h4v18"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3H4Z"/>',
  book: '<path d="M12 5v16M3 4c4-1 7-1 9 1 2-2 5-2 9-1v15c-4-1-7-1-9 1-2-2-5-2-9-1V4Z"/>',
  bot: '<path d="M5 7h14v13H5V7Zm7-4v4M2 11v5m20-5v5M8 16h8"/><path d="M8 11h1m6 0h1"/>',
  clipboard: '<path d="M9 4H5v18h14V4h-4M9 2h6v5H9V2Zm-1 9h8m-8 4h8m-8 4h5"/>',
  repeat:
    '<path d="M4 7a8 8 0 0 1 14-2l3 3m0-6v6h-6M20 17a8 8 0 0 1-14 2l-3-3m0 6v-6h6"/>',
  heart:
    '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/><path d="M5 12h3l2-4 3 8 2-4h4"/>',
  brain:
    '<path d="M12 4c-3-4-8-1-7 3-4 1-4 6-1 7-2 4 1 7 4 6 1 3 4 2 4 0V4Zm0 0c3-4 8-1 7 3 4 1 4 6 1 7 2 4-1 7-4 6-1 3-4 2-4 0M7 7l2 2m-4 5h3m9-7-2 2m4 5h-3"/>',
  mask: '<path d="M4 10 9 3h6l5 7v8l-8 4-8-4v-8Z"/><path d="M8 13h8v4H8v-4ZM4 10l4 3m12-3-4 3"/>',
  monitor: '<path d="M2 3h20v14H2V3Zm6 18h8m-4-4v4"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  layers: '<path d="m12 2 10 6-10 6L2 8l10-6ZM2 12l10 6 10-6M2 16l10 6 10-6"/>',
  sound:
    '<path d="m3 9 5 0 5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
};
export const icon = (name, size = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.crosshair}</svg>`;
export const emblem = () =>
  `<svg class="rank-emblem" viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="33" stroke="#899394" stroke-width="3"/><path d="M50 4v23m0 46v23M4 50h23m46 0h23" stroke="#899394" stroke-width="3"/><path d="m36 47 14-9 14 9v7l-14-9-14 9v-7Zm0 12 14-9 14 9v7l-14-9-14 9v-7Z" fill="currentColor"/></svg>`;
export function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(
    () => $("#toast").classList.remove("visible"),
    4200,
  );
}
export async function api(action, data, params = {}) {
  const response = await fetch(
    `api/index.php?${new URLSearchParams({ action, ...params })}`,
    {
      method: data === undefined ? "GET" : "POST",
      credentials: "same-origin",
      headers:
        data === undefined
          ? {}
          : { "Content-Type": "application/json", "X-CSRF-Token": state.csrf },
      body: data === undefined ? undefined : JSON.stringify(data),
    },
  );
  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      "O servidor de contas está indisponível. O treino de convidado continua disponível.",
    );
  }
  if (!response.ok)
    throw new Error(
      json.code === "setup_required"
        ? "O banco de dados ainda precisa ser conectado na hospedagem."
        : json.error || "Não foi possível concluir.",
    );
  if (json.csrf) state.csrf = json.csrf;
  return json;
}
export async function refreshProfile() {
  if (!state.user) return null;
  state.profile = await api("profile");
  state.user = state.profile.user;
  return state.profile;
}
export const shuffle = (values) => {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
let audio;
export function beep(correct) {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 740 : 160;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.13);
  } catch {}
}
