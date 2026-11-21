import { state, storage, toast } from "./core.js?v=2.4.0";

const key = () => `mdstrike_ecg_v1_${state.user?.id ?? "guest"}`;

export function loadEcgProgress() {
  return {
    lessons: {},
    challenge: { answers: {}, submitted: false, index: 0 },
    reviews: {},
    ...storage.get(key(), {}),
  };
}

export function saveEcgProgress(progress) {
  if (!storage.set(key(), progress))
    toast("O navegador não conseguiu salvar o progresso do curso.");
}

export function dueEcgReviews(progress, now = Date.now()) {
  return Object.entries(progress.reviews)
    .filter(([, review]) => review.due <= now)
    .map(([id]) => id);
}
