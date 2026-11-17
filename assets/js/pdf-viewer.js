let library;
const documents = new Map();
export async function renderPdf(question, zoom = 1) {
  const host = document.querySelector("#pdf-viewer");
  if (!host) return;
  try {
    library ??= await import("../pdfjs/pdf.min.mjs?v=2.2.1");
    library.GlobalWorkerOptions.workerSrc = new URL(
      "../pdfjs/pdf.worker.min.mjs?v=2.2.1",
      import.meta.url,
    ).href;
    let pdf = documents.get(question.pdf);
    if (!pdf) {
      pdf = await library.getDocument({
        url: new URL(question.pdf, document.baseURI).href,
        standardFontDataUrl: new URL(
          "../pdfjs/standard_fonts/",
          import.meta.url,
        ).href,
        isEvalSupported: false,
        useWasm: false,
        useSystemFonts: true,
      }).promise;
      if (documents.size >= 2) {
        const first = documents.keys().next().value;
        documents.get(first).destroy();
        documents.delete(first);
      }
      documents.set(question.pdf, pdf);
    }
    if (!host.isConnected) return;
    const page = await pdf.getPage(question.page),
      canvas = document.createElement("canvas");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(280, host.clientWidth - 2) * zoom;
    const viewport = page.getViewport({
      scale: (width / page.getViewport({ scale: 1 }).width) * ratio,
    });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${viewport.height / ratio}px`;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      `Página ${question.page} do caderno oficial. Localize a questão ${question.number}.`,
    );
    const context = canvas.getContext("2d", { alpha: false });
    await page.render({
      canvasContext: context,
      viewport,
      background: "#ffffff",
    }).promise;
    if (!host.isConnected) return;
    host.replaceChildren(canvas);
    host.dataset.ready = "true";
    host.dataset.page = String(question.page);
    host.setAttribute("aria-busy", "false");
  } catch (error) {
    if (!host.isConnected) return;
    host.innerHTML =
      '<div class="notice">Não foi possível abrir o leitor. Use “Abrir PDF em outra aba” para consultar o caderno original.</div>';
    host.setAttribute("aria-busy", "false");
    console.warn("Leitor PDF indisponível:", error.message);
  }
}
