const weight = {
  key: "weight",
  label: "Peso (kg)",
  example: "70",
  min: 1,
  max: 700,
};
const height = {
  key: "height",
  label: "Altura (cm)",
  example: "175",
  min: 30,
  max: 300,
};

const numeric = (key, label, example, min, max) => ({
  key,
  label,
  example,
  min,
  max,
});
const systolic = numeric("systolic", "Sistólica (mmHg)", "120", 1, 350);
const diastolic = numeric("diastolic", "Diastólica (mmHg)", "80", 1, 300);
const heartRate = numeric(
  "heartRate",
  "Frequência cardíaca (bpm)",
  "75",
  1,
  350,
);
const sodium = numeric("sodium", "Sódio sérico (mmol/L)", "140", 1, 250);
const glucose = numeric("glucose", "Glicemia (mg/dL)", "90", 1, 2500);
const creatinine = numeric(
  "creatinine",
  "Creatinina sérica (mg/dL)",
  "1,0",
  0.05,
  40,
);
const validatePressure = ({ systolic, diastolic }) =>
  systolic > diastolic
    ? ""
    : "A pressão sistólica precisa ser maior que a diastólica.";

export const calculators = [
  {
    id: "imc",
    group: "Antropometria",
    title: "Índice de massa corporal (IMC)",
    unit: "kg/m²",
    formula: "peso (kg) ÷ altura (m)²",
    precision: 2,
    fields: [weight, height],
    description:
      "Expressa a relação entre peso e altura. A interpretação depende da população avaliada.",
    source: [
      "Ministério da Saúde · IMC no adulto",
      "https://linhasdecuidado.saude.gov.br/portal/obesidade-no-adulto/definicao-obesidade-no-adulto/indice-massa-corporal/",
    ],
    calculate: ({ weight, height }) => weight / (height / 100) ** 2,
  },
  {
    id: "superficie",
    group: "Antropometria",
    title: "Superfície corporal",
    unit: "m²",
    formula: "√(altura (cm) × peso (kg) ÷ 3600)",
    precision: 2,
    fields: [weight, height],
    description: "Estimativa pela fórmula de Mosteller.",
    source: [
      "Mosteller · artigo original",
      "https://pubmed.ncbi.nlm.nih.gov/3657876/",
    ],
    calculate: ({ weight, height }) => Math.sqrt((height * weight) / 3600),
  },
  {
    id: "pam",
    group: "Cardiovascular",
    title: "Pressão arterial média estimada (PAM)",
    unit: "mmHg",
    formula: "(PAS + 2 × PAD) ÷ 3",
    precision: 1,
    fields: [systolic, diastolic],
    description: "Estimativa a partir da pressão sistólica e diastólica.",
    source: [
      "Anvisa · Manual de tecnovigilância",
      "https://bibliotecadigital.anvisa.gov.br/jspui/bitstream/anvisa/1756/1/ANVISA_Manual%20de%20tecnovigil%C3%A2ncia_aborgagens%20de%20vigil%C3%A2ncia%20sanit%C3%A1ria%20de%20produtos%20para%20a%20sa%C3%BAde%20comercializados%20no%20Brasil_1ed_2010.pdf",
    ],
    validate: validatePressure,
    calculate: ({ systolic, diastolic }) => (systolic + 2 * diastolic) / 3,
  },
  {
    id: "pressao-pulso",
    group: "Cardiovascular",
    title: "Pressão de pulso",
    unit: "mmHg",
    formula: "PAS − PAD",
    precision: 1,
    fields: [systolic, diastolic],
    description:
      "Diferença entre as pressões sistólica e diastólica medidas no mesmo momento.",
    source: [
      "American Heart Association · Medição da pressão arterial",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC11409525/",
    ],
    validate: validatePressure,
    calculate: ({ systolic, diastolic }) => systolic - diastolic,
  },
  {
    id: "indice-choque",
    group: "Cardiovascular",
    title: "Índice de choque",
    aliases: "shock index",
    unit: "",
    formula: "frequência cardíaca (bpm) ÷ PAS (mmHg)",
    precision: 2,
    fields: [heartRate, systolic],
    description:
      "Relaciona frequência cardíaca e pressão sistólica. Medicamentos e idade podem afetar a interpretação.",
    source: [
      "Allgöwer e Burri · Descrição do índice",
      "https://doi.org/10.1055/s-0028-1106070",
    ],
    calculate: ({ heartRate, systolic }) => heartRate / systolic,
  },
  {
    id: "qtc-fridericia",
    group: "Cardiovascular",
    title: "QT corrigido por Fridericia (QTcF)",
    aliases: "ECG eletrocardiograma",
    unit: "ms",
    formula: "QT (ms) ÷ ∛[RR (ms) ÷ 1000]",
    precision: 0,
    fields: [
      numeric("qt", "Intervalo QT (ms)", "400", 100, 1000),
      numeric("rr", "Intervalo RR (ms)", "800", 200, 4000),
    ],
    description:
      "Corrige o intervalo QT pela frequência cardíaca. Use QT e RR do mesmo traçado.",
    source: [
      "ICH E14 · Correção do intervalo QT",
      "https://www.ema.europa.eu/en/documents/scientific-guideline/ich-e-14-clinical-evaluation-qtqts-interval-prolongation-and-proarrhythmic-potential-non-antiarrhythmic-drugs-step-5_en.pdf",
    ],
    calculate: ({ qt, rr }) => qt / Math.cbrt(rr / 1000),
  },
  {
    id: "pao2-fio2",
    group: "Respiratório",
    title: "Relação PaO₂/FiO₂",
    aliases: "pao2 fio2 pf oxigenacao gasometria",
    unit: "mmHg",
    formula: "PaO₂ (mmHg) ÷ [FiO₂ (%) ÷ 100]",
    precision: 1,
    fields: [
      numeric("pao2", "PaO₂ na gasometria arterial (mmHg)", "80", 1, 800),
      numeric("fio2", "FiO₂ (%)", "40", 21, 100),
    ],
    description:
      "Relaciona a pressão arterial de oxigênio à fração inspirada. Informe FiO₂ em porcentagem, como 40 para 40%.",
    source: [
      "JAMA · Definição de Berlim para SDRA",
      "https://pubmed.ncbi.nlm.nih.gov/22797452/",
    ],
    calculate: ({ pao2, fio2 }) => pao2 / (fio2 / 100),
  },
  {
    id: "anion-gap",
    group: "Eletrólitos",
    title: "Ânion gap sérico",
    aliases: "hiato aniônico acidose gasometria anion gap",
    unit: "mmol/L",
    formula: "Na⁺ − (Cl⁻ + HCO₃⁻)",
    precision: 1,
    fields: [
      sodium,
      numeric("chloride", "Cloreto sérico (mmol/L)", "104", 1, 250),
      numeric("bicarbonate", "Bicarbonato sérico (mmol/L)", "24", 0, 80),
    ],
    description:
      "Calculado sem potássio. Na interpretação, considere a albumina e o intervalo de referência do laboratório.",
    source: [
      "Artigo clínico · Cálculo do ânion gap",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5757582/",
    ],
    calculate: ({ sodium, chloride, bicarbonate }) =>
      sodium - chloride - bicarbonate,
  },
  {
    id: "sodio-hiperglicemia",
    group: "Eletrólitos",
    title: "Sódio corrigido na hiperglicemia",
    unit: "mmol/L",
    formula: "Na⁺ medido + 1,6 × [(glicemia (mg/dL) − 100) ÷ 100]",
    precision: 1,
    fields: [sodium, { ...glucose, example: "300", min: 100 }],
    description:
      "Estimativa pelo fator de Katz. Na hiperglicemia intensa, o fator de correção pode variar.",
    source: [
      "Katz · Artigo original",
      "https://www.nejm.org/doi/10.1056/NEJM197310182891607",
    ],
    calculate: ({ sodium, glucose }) => sodium + 1.6 * ((glucose - 100) / 100),
  },
  {
    id: "osmolalidade",
    group: "Eletrólitos",
    title: "Osmolalidade sérica calculada",
    aliases: "osmolaridade bun ureia",
    unit: "mOsm/kg",
    formula: "2 × Na⁺ + glicemia ÷ 18 + BUN ÷ 2,8",
    precision: 1,
    fields: [
      sodium,
      glucose,
      {
        key: "lab",
        label: "Exame informado",
        options: [
          ["urea", "Ureia"],
          ["bun", "Nitrogênio ureico (BUN)"],
        ],
      },
      numeric("ureaOrBun", "Valor da ureia ou do BUN (mg/dL)", "30", 0, 600),
    ],
    description:
      "Escolha o exame exibido no laudo. Quando o valor é informado como ureia, a fórmula converte para BUN dividindo por 2,14.",
    source: [
      "Equações de osmolalidade · Referência",
      "https://pubmed.ncbi.nlm.nih.gov/27343561/",
    ],
    calculate: ({ sodium, glucose, lab, ureaOrBun }) =>
      2 * sodium +
      glucose / 18 +
      ureaOrBun / (lab === "urea" ? 2.14 * 2.8 : 2.8),
  },
  {
    id: "fena",
    group: "Renal",
    title: "Fração de excreção de sódio (FENa)",
    unit: "%",
    formula:
      "100 × (Na⁺ urinário × creatinina sérica) ÷ (Na⁺ sérico × creatinina urinária)",
    precision: 2,
    fields: [
      sodium,
      creatinine,
      numeric("urineSodium", "Sódio urinário (mmol/L)", "20", 0, 500),
      numeric(
        "urineCreatinine",
        "Creatinina urinária (mg/dL)",
        "100",
        0.1,
        1000,
      ),
    ],
    description:
      "Use amostras colhidas em períodos próximos. Diuréticos e doença renal crônica podem alterar a interpretação.",
    source: [
      "Estudo clínico · Cálculo da FENa",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5516416/",
    ],
    calculate: ({ sodium, creatinine, urineSodium, urineCreatinine }) =>
      (100 * urineSodium * creatinine) / (sodium * urineCreatinine),
  },
  {
    id: "ckd-epi-2021",
    group: "Renal",
    title: "TFG estimada por CKD-EPI 2021",
    aliases: "egfr função renal taxa filtração glomerular",
    unit: "mL/min/1,73 m²",
    formula: "CKD-EPI 2021 por creatinina · equação completa na referência",
    precision: 1,
    fields: [
      {
        ...numeric("age", "Idade (anos completos)", "55", 18, 120),
        integer: true,
      },
      {
        key: "sex",
        label: "Sexo para a equação",
        options: [
          ["female", "Feminino"],
          ["male", "Masculino"],
        ],
      },
      creatinine,
    ],
    description:
      "Estima a filtração glomerular em adultos com creatinina estável. Em lesão renal aguda, a creatinina pode mudar rapidamente.",
    source: [
      "NIDDK · Equação para adultos",
      "https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults",
    ],
    calculate: ({ age, sex, creatinine }) => {
      const female = sex === "female";
      const ratio = creatinine / (female ? 0.7 : 0.9);
      const exponent = female ? -0.241 : -0.302;
      return (
        142 *
        Math.min(ratio, 1) ** exponent *
        Math.max(ratio, 1) ** -1.2 *
        0.9938 ** age *
        (female ? 1.012 : 1)
      );
    },
  },
];

export function calculateMedicalValue(calculator, fields) {
  const values = {};
  for (const { key, label, min, max, options, integer } of calculator.fields) {
    const raw = String(fields[key] ?? "").trim();
    if (options) {
      if (!options.some(([choice]) => choice === raw))
        return {
          error: `Selecione uma opção em ${label.toLowerCase()}.`,
          field: key,
        };
      values[key] = raw;
      continue;
    }
    const value = /^\d+(?:[.,]\d+)?$/.test(raw)
      ? Number(raw.replace(",", "."))
      : NaN;
    if (!Number.isFinite(value) || value < min || value > max)
      return {
        error: `Informe um valor de ${min} a ${max} para ${label.toLowerCase()}.`,
        field: key,
      };
    if (integer && !Number.isInteger(value))
      return {
        error: `Informe um número inteiro para ${label.toLowerCase()}.`,
        field: key,
      };
    values[key] = value;
  }
  const error = calculator.validate?.(values);
  return error ? { error } : { value: calculator.calculate(values) };
}

export function nextReview(previous, recalled, now = new Date()) {
  const intervals = [1, 3, 7, 14];
  const level = recalled
    ? Math.min((previous?.level ?? -1) + 1, intervals.length - 1)
    : -1;
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + (intervals[level] ?? intervals[0]));
  return { level, due: date.getTime() };
}
