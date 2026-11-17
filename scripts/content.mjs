import fs from "node:fs";

const areas = {
  CM: "Clínica Médica",
  CIR: "Cirurgia",
  GO: "Ginecologia e Obstetrícia",
  PED: "Pediatria",
  MFC: "Medicina de Família e Comunidade",
  SM: "Saúde Mental",
  SC: "Saúde Coletiva",
  GERAL: "Formação médica",
};
const rows = [
  ["Acupuntura", "CM"],
  ["Alergia e Imunologia", "CM"],
  ["Anestesiologia", "CIR"],
  ["Angiologia", "CM"],
  ["Cardiologia", "CM"],
  ["Cirurgia Cardiovascular", "CIR"],
  ["Cirurgia da Mão", "CIR"],
  ["Cirurgia de Cabeça e Pescoço", "CIR"],
  ["Cirurgia do Aparelho Digestivo", "CIR"],
  ["Cirurgia Geral", "CIR"],
  ["Cirurgia Oncológica", "CIR"],
  ["Cirurgia Pediátrica", "CIR"],
  ["Cirurgia Plástica", "CIR"],
  ["Cirurgia Torácica", "CIR"],
  ["Cirurgia Vascular", "CIR"],
  ["Clínica Médica", "CM"],
  ["Coloproctologia", "CIR"],
  ["Dermatologia", "CM"],
  ["Endocrinologia e Metabologia", "CM"],
  ["Endoscopia", "CM"],
  ["Gastroenterologia", "CM"],
  ["Genética Médica", "CM"],
  ["Geriatria", "CM"],
  ["Ginecologia e Obstetrícia", "GO"],
  ["Hematologia e Hemoterapia", "CM"],
  ["Homeopatia", "CM"],
  ["Infectologia", "CM"],
  ["Mastologia", "CIR"],
  ["Medicina de Emergência", "CM"],
  ["Medicina de Família e Comunidade", "MFC"],
  ["Medicina do Trabalho", "SC"],
  ["Medicina do Tráfego", "SC"],
  ["Medicina Esportiva", "CM"],
  ["Medicina Física e Reabilitação", "CM"],
  ["Medicina Intensiva", "CM"],
  ["Medicina Legal e Perícia Médica", "SC"],
  ["Medicina Nuclear", "CM"],
  ["Medicina Preventiva e Social", "SC"],
  ["Nefrologia", "CM"],
  ["Neurocirurgia", "CIR"],
  ["Neurologia", "CM"],
  ["Nutrologia", "CM"],
  ["Oftalmologia", "CIR"],
  ["Oncologia Clínica", "CM"],
  ["Ortopedia e Traumatologia", "CIR"],
  ["Otorrinolaringologia", "CIR"],
  ["Patologia", "CM"],
  ["Patologia Clínica / Medicina Laboratorial", "CM"],
  ["Pediatria", "PED"],
  ["Pneumologia", "CM"],
  ["Psiquiatria", "SM"],
  ["Radiologia e Diagnóstico por Imagem", "CM"],
  ["Radioterapia", "CM"],
  ["Reumatologia", "CM"],
  ["Urologia", "CIR"],
];
export const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const specialDescriptions = {
  cardiologia: "Ritmo, diagnóstico e raciocínio cardiovascular.",
  anestesiologia: "Avaliação, preparo e segurança perioperatória.",
  neurologia: "Síndromes, neuroimagem e localização neurológica.",
};
const specialties = rows.map(([name, area], index) => ({
  id: slug(name),
  name,
  area,
  code: `MD-${String(index + 1).padStart(2, "0")}`,
  image: ["cardiologia", "anestesiologia", "neurologia"].includes(slug(name))
    ? slug(name)
    : area === "CIR" || area === "GO"
      ? "anestesiologia"
      : area === "SM"
        ? "neurologia"
        : "cardiologia",
  description:
    specialDescriptions[slug(name)] ||
    `Explore a especialidade e treine fundamentos de ${areas[area].toLowerCase()}.`,
}));
const extra = [
  [
    "anestesiologia",
    "CIR",
    "Qual escala é utilizada para descrever a condição física pré-operatória?",
    [
      "Classificação ASA",
      "Escala de Apgar",
      "Escala de Bristol",
      "Classificação de Child-Pugh",
    ],
    "A classificação do estado físico da ASA descreve a condição clínica pré-operatória; não substitui a avaliação individual de risco.",
  ],
  [
    "anestesiologia",
    "CIR",
    "Que parâmetro a capnografia monitora continuamente?",
    [
      "Dióxido de carbono no gás expirado",
      "Concentração sérica de potássio",
      "Pressão intracraniana",
      "Hemoglobina glicada",
    ],
    "A capnografia representa a concentração ou pressão parcial de CO₂ ao longo do ciclo respiratório.",
  ],
  [
    "anestesiologia",
    "CIR",
    "O bloqueio neuromuscular, isoladamente, garante qual efeito?",
    [
      "Relaxamento da musculatura esquelética",
      "Analgesia cirúrgica",
      "Amnésia",
      "Perda de consciência",
    ],
    "Bloqueadores neuromusculares produzem paralisia muscular, mas não garantem analgesia, amnésia ou hipnose.",
  ],
  [
    "anestesiologia",
    "CIR",
    "A hipertermia maligna está associada a qual grupo de agentes desencadeantes?",
    [
      "Anestésicos voláteis e succinilcolina",
      "Anestésicos locais e paracetamol",
      "Opioides e ondansetrona",
      "Propofol e benzodiazepínicos",
    ],
    "Anestésicos voláteis e succinilcolina são desencadeantes conhecidos em pessoas suscetíveis.",
  ],
  [
    "anestesiologia",
    "CIR",
    "Qual estrutura deve ser identificada na classificação de Mallampati?",
    [
      "Estruturas visíveis da orofaringe",
      "Pulsos arteriais periféricos",
      "Ruídos hidroaéreos",
      "Fundo de olho",
    ],
    "A avaliação de Mallampati observa estruturas orofaríngeas e compõe a avaliação da via aérea.",
  ],
  [
    "anestesiologia",
    "CIR",
    "Qual é a diferença básica entre anestesia e analgesia?",
    [
      "Analgesia descreve alívio da dor; anestesia pode incluir perda de sensibilidade e consciência",
      "Analgesia implica sempre inconsciência",
      "Anestesia significa somente paralisia muscular",
      "São termos obrigatoriamente equivalentes",
    ],
    "Analgesia se refere ao alívio da dor. A anestesia pode ser local, regional ou geral, com efeitos distintos sobre sensibilidade e consciência.",
  ],
  [
    "neurologia",
    "CM",
    "Qual hemisfério é mais frequentemente dominante para linguagem em pessoas destras?",
    ["Esquerdo", "Direito", "Cerebelo", "Tronco encefálico"],
    "Na maior parte das pessoas destras, as redes dominantes para linguagem estão no hemisfério esquerdo.",
  ],
  [
    "neurologia",
    "CM",
    "Uma lesão do neurônio motor superior costuma causar qual conjunto de sinais?",
    [
      "Hiperreflexia e sinal de Babinski",
      "Arreflexia e fasciculações isoladas",
      "Apenas anestesia em luva",
      "Somente tremor de intenção",
    ],
    "Lesões das vias motoras centrais podem produzir hiperreflexia, espasticidade e resposta plantar extensora.",
  ],
  [
    "neurologia",
    "CM",
    "Qual estrutura participa principalmente da coordenação dos movimentos?",
    ["Cerebelo", "Hipófise", "Hipotálamo", "Glândula pineal"],
    "O cerebelo participa da coordenação, do equilíbrio e do ajuste dos movimentos.",
  ],
  [
    "neurologia",
    "CM",
    "Na escala de coma de Glasgow, quais respostas são avaliadas?",
    [
      "Ocular, verbal e motora",
      "Pupilar, auditiva e plantar",
      "Respiratória, pupilar e cardíaca",
      "Memória, atenção e orientação",
    ],
    "A escala de Glasgow soma as melhores respostas ocular, verbal e motora, com registro de fatores que limitem o exame.",
  ],
  [
    "neurologia",
    "CM",
    "Bradicinesia, rigidez e tremor de repouso são características de qual síndrome?",
    [
      "Síndrome parkinsoniana",
      "Síndrome miastênica",
      "Síndrome meníngea",
      "Síndrome vestibular periférica",
    ],
    "Bradicinesia é um elemento central das síndromes parkinsonianas, frequentemente acompanhada de rigidez ou tremor de repouso.",
  ],
  [
    "neurologia",
    "CM",
    "Qual modalidade de exame registra a atividade elétrica cortical?",
    [
      "Eletroencefalograma",
      "Eletroneuromiografia de fibra única",
      "Angiotomografia",
      "Ecocardiograma",
    ],
    "O eletroencefalograma registra a atividade elétrica cerebral por meio de eletrodos na superfície do couro cabeludo.",
  ],
];
let bank = JSON.parse(fs.readFileSync("app/questions.json", "utf8")).filter(
  (q) => q.id.startsWith("seed-"),
);
bank.forEach((q) => {
  q.specialties = [];
  q.reviewed = false;
});
const tags = {
  1: ["cardiologia"],
  2: ["endocrinologia-e-metabologia", "medicina-de-emergencia"],
  3: ["pneumologia"],
  4: ["infectologia", "neurologia"],
  5: ["endocrinologia-e-metabologia"],
  6: ["nefrologia", "cardiologia"],
  7: ["cirurgia-geral"],
  8: ["cirurgia-toracica", "medicina-de-emergencia"],
  9: ["cirurgia-do-aparelho-digestivo"],
  10: ["medicina-de-emergencia"],
  11: ["cirurgia-plastica"],
  12: ["cirurgia-geral"],
  13: ["ginecologia-e-obstetricia"],
  14: ["ginecologia-e-obstetricia"],
  15: ["ginecologia-e-obstetricia"],
  16: ["ginecologia-e-obstetricia"],
  17: ["ginecologia-e-obstetricia"],
  18: ["ginecologia-e-obstetricia"],
  19: ["pediatria"],
  20: ["pediatria"],
  21: ["pediatria"],
  22: ["pediatria"],
  23: ["pediatria"],
  24: ["pediatria"],
  25: ["medicina-de-familia-e-comunidade"],
  26: ["medicina-de-familia-e-comunidade"],
  27: ["medicina-de-familia-e-comunidade"],
  28: ["medicina-de-familia-e-comunidade"],
  29: ["medicina-de-familia-e-comunidade"],
  30: ["medicina-de-familia-e-comunidade"],
  31: ["psiquiatria"],
  32: ["psiquiatria"],
  33: ["psiquiatria"],
  34: ["psiquiatria"],
  35: ["psiquiatria"],
  36: ["psiquiatria"],
  37: ["medicina-preventiva-e-social"],
  38: ["medicina-preventiva-e-social"],
  39: ["medicina-preventiva-e-social"],
  40: ["medicina-preventiva-e-social"],
  41: ["medicina-preventiva-e-social"],
  42: ["medicina-legal-e-pericia-medica"],
};
bank.forEach((q) => (q.specialties = tags[Number(q.id.split("-")[1])] || []));
extra.forEach(([specialty, area, prompt, options, explanation], i) =>
  bank.push({
    id: `original-${i + 1}`,
    area,
    prompt,
    options,
    answer: 0,
    explanation,
    kind: "original",
    source: "MD Strike · questão autoral de demonstração",
    reviewed: false,
    specialties: [specialty],
  }),
);
const official = fs.existsSync("app/official-questions.json")
  ? JSON.parse(fs.readFileSync("app/official-questions.json", "utf8"))
  : [];
bank.push(...official);
const exams = fs.existsSync("app/official-exams.json")
  ? JSON.parse(fs.readFileSync("app/official-exams.json", "utf8"))
  : [];
specialties.forEach((s) => {
  s.questions = bank.filter(
    (q) => q.specialties.includes(s.id) && q.answer !== null,
  ).length;
  s.originals = bank.filter(
    (q) => q.specialties.includes(s.id) && q.kind === "original",
  ).length;
  s.exams = exams.filter((e) => e.specialty === s.id).map((e) => e.id);
  s.foundationQuestions = bank.filter(
    (q) => q.area === s.area && q.kind === "original",
  ).length;
});
const catalog = {
  areas,
  specialties,
  exams,
  sources: [
    {
      title: "ENAMED · provas e gabaritos do Inep",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enamed/provas-e-gabaritos",
    },
    {
      title: "ENARE · cadernos oficiais 2024/2025 (FGV)",
      url: "https://mapa-vagas-enare-ebserh.conhecimento.fgv.br/provas-gabaritos-medica.html",
    },
    {
      title: "Especialidades reconhecidas · CFM / Cremego",
      url: "https://www.cremego.org.br/noticias/cfm-reconhece-duas-novas-areas-de-atuacao-medica",
    },
    {
      title: "ENARE · informações oficiais HU Brasil",
      url: "https://www.gov.br/hubrasil/pt-br/ensino-e-pesquisa/exame-nacional-de-residencia-enare",
    },
  ],
};
fs.writeFileSync("app/catalog.json", JSON.stringify(catalog, null, 2) + "\n");
fs.writeFileSync("app/questions.json", JSON.stringify(bank, null, 2) + "\n");
fs.writeFileSync(
  "assets/js/catalog.js",
  "export default " + JSON.stringify(catalog) + ";\n",
);
fs.writeFileSync(
  "assets/js/practice-bank.js",
  "export default " + JSON.stringify(bank) + ";\n",
);
console.log(
  `${specialties.length} specialties; ${bank.length} questions; ${exams.length} official exams.`,
);
