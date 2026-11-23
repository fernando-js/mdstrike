export function reportTrainingEvent(event) {
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1") return;
  fetch("/api/enamed-metrics.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    keepalive: true,
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

for (const page of document.querySelectorAll("[data-enamed-entry]")) {
  reportTrainingEvent("entry_view");
  page.addEventListener("click", (event) => {
    if (event.target.closest("[data-enamed-start]"))
      reportTrainingEvent("training_click");
  });
}
