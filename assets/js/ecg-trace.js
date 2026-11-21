import { esc } from "./core.js?v=2.4.0";

const sinus = [0.4, 1.2, 2, 2.8, 3.6];
const traces = {
  tremor: {
    beats: sinus,
    noise: true,
    alt: "Faixa de D2 com cinco complexos igualmente espaçados e oscilação rápida entre eles.",
  },
  "ritmo-75": {
    beats: sinus,
    marker: [1.2, 2, "R–R = 0,8 s"],
    alt: "Faixa de D2 regular, com quatro quadrados grandes entre picos R consecutivos.",
  },
  "pr-160": {
    beats: sinus,
    marker: [1.005, 1.165, "PR = 160 ms"],
    alt: "Faixa de D2 com quatro quadrados pequenos do início de P ao início do QRS.",
  },
  "st-inferior": {
    beats: sinus,
    leads: ["D2", "D3", "aVF", "aVL"],
    st: [0.24, 0.23, 0.25, -0.09],
    marker: [1.255, 1.345, "Segmento ST"],
    alt: "Sinais simulados de D2, D3 e aVF com ST acima da linha de base. aVL tem leve depressão do ST.",
  },
  "ganho-5": {
    beats: sinus,
    gain: 5,
    calibrationOnly: true,
    alt: "Pulso de calibração de cinco milímetros de altura. O ganho indicado é 5 mm/mV.",
  },
  "ritmo-60": {
    beats: [0.4, 1.4, 2.4, 3.4],
    marker: [1.4, 2.4, "R–R = 1,0 s"],
    alt: "Faixa de D2 com cinco quadrados grandes entre os picos R e intervalos regulares.",
  },
  eixo: {
    beats: sinus,
    leads: ["D1", "aVF"],
    amplitude: [1, 0.65],
    alt: "D1 e aVF exibem complexos QRS com deflexão positiva predominante.",
  },
  "pr-240": {
    beats: sinus,
    pr: 0.24,
    marker: [0.925, 1.165, "PR = 240 ms"],
    alt: "Faixa de D2 com seis quadrados pequenos do início de P ao início do QRS e condução 1:1.",
  },
  "st-plano": {
    beats: [0.4, 1.24, 2.08, 2.92, 3.76],
    leads: ["D2", "V2", "V3"],
    alt: "Faixas simuladas com segmento ST aproximadamente isoelétrico nas derivações disponíveis.",
  },
  extrassistole: {
    beats: [0.35, 1.15, 1.62, 2.75, 3.55],
    premature: 1.62,
    marker: [1.56, 1.73, "QRS prematuro"],
    alt: "D2 com um complexo prematuro mais largo e com forma diferente dos outros, sem onda P precedente visível.",
  },
  "real-fa": {
    record: 4117,
    alt: "ECG clínico de 12 derivações. Os intervalos entre QRS variam sem padrão e faltam ondas P organizadas.",
  },
  "real-sinusal": {
    record: 293,
    alt: "ECG clínico de 12 derivações. Observe a relação das ondas P com os complexos QRS e compare a morfologia entre derivações.",
  },
};

const triangle = (time, start, peak, end, height) => {
  if (time <= start || time >= end) return 0;
  return (
    height *
    (time < peak
      ? (time - start) / (peak - start)
      : (end - time) / (end - peak))
  );
};

function simulatedSignal(trace, time, lead) {
  if (trace.calibrationOnly) return time >= 0.36 && time <= 0.56 ? 1 : 0;
  let voltage = trace.noise
    ? 0.14 * Math.sin(time * 2 * Math.PI * 12) +
      0.07 * Math.sin(time * 2 * Math.PI * 9)
    : 0;
  for (const beat of trace.beats) {
    const t = time - beat;
    if (beat === trace.premature) {
      voltage +=
        triangle(t, -0.06, 0.01, 0.11, -1.22) +
        triangle(t, 0.12, 0.2, 0.29, 0.36);
      continue;
    }
    const p = -0.035 - (trace.pr ?? 0.16);
    voltage += triangle(t, p, p + 0.047, p + 0.09, 0.16);
    voltage +=
      (trace.amplitude?.[lead] ?? 1) *
      (triangle(t, -0.035, -0.02, -0.004, -0.13) +
        triangle(t, -0.014, 0, 0.02, 1.05) +
        triangle(t, 0.014, 0.03, 0.055, -0.24));
    if (trace.st?.[lead] && t >= 0.055 && t <= 0.16)
      voltage +=
        trace.st[lead] * Math.min(1, (t - 0.055) / 0.012, (0.16 - t) / 0.012);
    voltage += triangle(t, 0.14, 0.22, 0.34, 0.31);
  }
  return voltage;
}

export function tracePanel(id, prefix) {
  const trace = traces[id];
  return `<figure class="ecg-trace" data-ecg-trace="${id}">
    <figcaption class="ecg-trace-caption"><strong>${trace.record ? "Traçado clínico de 12 derivações" : "Traçado didático simulado"}</strong>
      <span>25 mm/s · ${trace.gain ?? 10} mm/mV</span>
    </figcaption>
    <div class="ecg-trace-controls">
      ${trace.record || trace.leads ? `<label class="field"><span>Derivação</span><select data-ecg-lead aria-label="Derivação"><option>D2</option></select></label>` : ""}
      ${trace.record ? '<label class="field"><span>Janela do registro</span><select data-ecg-window aria-label="Janela do registro"><option value="0">0–4 s</option><option value="3">3–7 s</option><option value="6">6–10 s</option></select></label>' : ""}
      <button class="btn outline small" type="button" data-ecg-zoom aria-pressed="false">Ampliar traçado</button>
    </div>
    <div class="ecg-trace-viewport" tabindex="0" role="region" aria-label="Traçado com rolagem horizontal">
      <canvas width="660" height="275" role="img" aria-describedby="${prefix}-trace-desc">Traçado de ECG. Consulte a descrição acessível abaixo.</canvas>
    </div>
    <p data-ecg-status role="status" ${trace.record ? "" : "hidden"}>${trace.record ? "Carregando traçado…" : ""}</p>
    <details class="ecg-trace-description"><summary>Descrição do traçado</summary><p id="${prefix}-trace-desc">${esc(trace.alt)}</p></details>
    ${trace.record ? `<p class="resource-note">PTB-XL v1.0.3 · registro ${trace.record} (Wagner e colegas). Conversão para mV e visualização em janelas de 4 s a partir da versão de 100 Hz. <a href="https://physionet.org/content/ptb-xl/1.0.3/" target="_blank" rel="noopener noreferrer">Dados originais</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p>` : ""}
  </figure>`;
}

const realRecords = new Map();

async function loadRecord(id) {
  if (!realRecords.has(id)) {
    const request = fetch(`assets/data/ecg-${id}.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Traçado indisponível");
        return response.json();
      })
      .catch((error) => {
        realRecords.delete(id);
        throw error;
      });
    realRecords.set(id, request);
  }
  return realRecords.get(id);
}

function draw(canvas, signal, rate, gain, offset, marker) {
  const ctx = canvas.getContext("2d");
  const origin = 30,
    grid = 6,
    plotWidth = 600;
  let magnitude = 1.75;
  for (const value of signal) magnitude = Math.max(magnitude, Math.abs(value));
  const range = Math.ceil((magnitude * gain) / 5) * 5;
  const zero = 16 + range * grid;
  const height = zero * 2 + 19;
  canvas.height = height;
  ctx.fillStyle = "#fcf7f7";
  ctx.fillRect(0, 0, canvas.width, height);
  const line = (x1, y1, x2, y2, color) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  for (let mm = 0; mm <= 100; mm++) {
    const x = origin + mm * grid;
    line(x, 16, x, height - 35, mm % 5 ? "#f5dce0" : "#d78e96");
  }
  for (let mm = -range; mm <= range; mm++) {
    const y = zero + mm * grid;
    line(origin, y, origin + plotWidth, y, mm % 5 ? "#f5dce0" : "#d78e96");
  }
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#55424a";
  for (let s = 0; s <= 4; s++)
    ctx.fillText(`${offset + s} s`, origin + s * 150 - 8, height - 12);
  ctx.beginPath();
  ctx.strokeStyle = "#192126";
  ctx.lineWidth = 1.7;
  signal.forEach((value, index) => {
    ctx[index ? "lineTo" : "moveTo"](
      origin + 150 * (index / rate),
      zero - value * gain * grid,
    );
  });
  ctx.stroke();
  if (marker) {
    const [start, end, name] = marker;
    const x1 = origin + start * 150,
      x2 = origin + end * 150,
      y = 34;
    line(x1, y, x2, y, "#9a4300");
    line(x1, y - 4, x1, y + 4, "#9a4300");
    line(x2, y - 4, x2, y + 4, "#9a4300");
    ctx.fillStyle = "#7e3300";
    ctx.fillText(name, x2 + 7, y + 4);
  }
}

export async function mountTrace(figure) {
  const trace = traces[figure.dataset.ecgTrace];
  const canvas = figure.querySelector("canvas");
  const select = figure.querySelector("[data-ecg-lead]");
  const windowSelect = figure.querySelector("[data-ecg-window]");
  const status = figure.querySelector("[data-ecg-status]");
  const zoom = figure.querySelector("[data-ecg-zoom]");
  let record;
  zoom.addEventListener("click", () => {
    const enlarged = figure.classList.toggle("ecg-zoomed");
    zoom.ariaPressed = String(enlarged);
    zoom.textContent = enlarged ? "Reduzir traçado" : "Ampliar traçado";
  });
  if (trace.record) {
    try {
      record = await loadRecord(trace.record);
      if (!figure.isConnected) return;
      status.hidden = true;
    } catch {
      canvas.hidden = true;
      status.textContent =
        "O arquivo do traçado está indisponível. A descrição continua acessível.";
      return;
    }
  }
  if (select) {
    const leads = record ? Object.keys(record.leads) : trace.leads;
    select.replaceChildren(...leads.map((lead) => new Option(lead, lead)));
    select.value = leads.includes("D2") ? "D2" : leads[0];
  }
  function redraw() {
    const offset = Number(windowSelect?.value ?? 0);
    const lead = select?.value ?? "D2";
    const leadIndex = select?.selectedIndex ?? 0;
    const signal = record
      ? record.leads[lead]
          .slice(offset * 100, (offset + 4) * 100 + 1)
          .map((value) => value / 1000)
      : Array.from({ length: 601 }, (_, i) =>
          simulatedSignal(trace, i / 150, leadIndex),
        );
    draw(
      canvas,
      signal,
      record?.sampleRateHz ?? 150,
      trace.gain ?? 10,
      offset,
      figure.dataset.ecgMark === "true" ? trace.marker : null,
    );
  }
  figure.addEventListener("change", redraw);
  figure.addEventListener("ecg-mark", () => {
    figure.dataset.ecgMark = "true";
    redraw();
  });
  redraw();
}
