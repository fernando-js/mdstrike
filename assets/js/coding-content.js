export const systems = {
  cid10: {
    name: "CID-10",
    description:
      "Localize a categoria ou subcategoria do diagnóstico ou sintoma registrado.",
    version: "CID-10 em português · RNDS",
    url: "https://fhir.saude.gov.br/ria/pt-BR/CodeSystem-BRCID10.html",
    guidance:
      "Use a informação registrada no prontuário. Consulte as notas da classificação quando houver dúvida sobre o nível de detalhe.",
  },
  sigtap: {
    name: "SIGTAP",
    description:
      "Identifique procedimentos e confira a competência da tabela do SUS.",
    version: "DATASUS · competência 11/2026",
    url: "https://saudedigital.sorocaba.sp.gov.br/corrige-faturamento/arquivos-datasus?aba=sigtap",
    guidance:
      "Na rotina do SUS, consulte a competência do atendimento e confira os atributos e as compatibilidades do item no SIGTAP.",
  },
  tuss: {
    name: "TUSS",
    description:
      "Encontre procedimentos da saúde suplementar na Tabela 22 do padrão TISS.",
    version: "ANS · Tabela 22 · versão 202609",
    url: "https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-setembro-2026",
    guidance:
      "O termo TUSS identifica o item na troca de informações. Para verificar cobertura, consulte o Rol, as regras aplicáveis e o plano.",
  },
};

const records = {
  cid10: [
    [
      "I10",
      "Hipertensão essencial (primária)",
      "hipertensão arterial primária.",
    ],
    [
      "E11.9",
      "Diabetes Mellitus não-insulino-dependente - sem complicações",
      "diabetes mellitus tipo 2, sem complicações.",
    ],
    ["J45.9", "Asma não especificada", "asma sem especificação do tipo."],
    [
      "R07.4",
      "Dor torácica, não especificada",
      "dor torácica sem especificação.",
    ],
    [
      "N39.0",
      "Infecção do trato urinário de localização não especificada",
      "infecção urinária sem localização informada.",
    ],
    ["M54.5", "Dor lombar baixa", "dor lombar baixa."],
    ["J18.9", "Pneumonia não especificada", "pneumonia sem especificação."],
    ["R51", "Cefaléia", "cefaleia."],
  ],
  sigtap: [
    ["02.11.02.003-6", "Eletrocardiograma", "eletrocardiograma", "ECG"],
    ["02.02.02.038-0", "Hemograma completo", "hemograma completo"],
    ["02.02.01.031-7", "Dosagem de creatinina", "dosagem de creatinina"],
    [
      "02.02.01.050-3",
      "Dosagem de hemoglobina glicosilada",
      "dosagem de hemoglobina glicosilada",
      "HbA1c hemoglobina glicada",
    ],
    [
      "02.04.03.015-3",
      "Radiografia de torax (PA e perfil)",
      "radiografia de tórax nas incidências PA e perfil",
      "raio x RX",
    ],
    [
      "02.05.02.004-6",
      "Ultrassonografia de abdomen total",
      "ultrassonografia de abdome total",
      "USG ultrassom abdominal",
    ],
    [
      "03.01.01.007-2",
      "Consulta medica em atenção especializada",
      "consulta médica em atenção especializada",
    ],
    [
      "02.02.05.001-7",
      "Analise de caracteres fisicos, elementos e sedimento da urina",
      "análise de caracteres físicos, elementos e sedimento da urina",
      "urina tipo 1 EAS",
    ],
  ],
  tuss: [
    [
      "40101010",
      "ECG convencional de até 12 derivações",
      "o ECG convencional de até 12 derivações",
      "eletrocardiograma",
    ],
    [
      "40304361",
      "Hemograma com contagem de plaquetas ou frações (eritrograma, leucograma, plaquetas)",
      "o hemograma com contagem de plaquetas",
      "hemograma completo",
    ],
    [
      "40301630",
      "Creatinina - pesquisa e/ou dosagem",
      "a pesquisa ou dosagem de creatinina",
    ],
    [
      "40302733",
      "Hemoglobina glicada (Fração A1c) - pesquisa e/ou dosagem",
      "a pesquisa ou dosagem de hemoglobina glicada, fração A1c",
      "HbA1c hemoglobina glicosilada",
    ],
    [
      "40805026",
      "RX - Tórax - 2 incidências",
      "a radiografia de tórax em duas incidências",
      "raio x",
    ],
    [
      "40901122",
      "US - Abdome total (abdome superior, rins, bexiga, aorta, veia cava inferior e adrenais)",
      "a ultrassonografia de abdome total",
      "USG ultrassom abdominal",
    ],
    [
      "10101012",
      "Consulta em consultório (no horário normal ou preestabelecido)",
      "a consulta em consultório no horário normal ou preestabelecido",
    ],
    [
      "40311210",
      "Rotina de urina (caracteres físicos, elementos anormais e sedimentoscopia)",
      "o exame de rotina de urina com sedimentoscopia",
      "urina tipo 1 EAS",
    ],
  ],
};

export const entries = Object.entries(records).flatMap(([system, items]) =>
  items.map(([code, label, scenario, aliases]) => ({
    system,
    code,
    label,
    scenario,
    aliases: aliases || "",
  })),
);

const codeQuestions = entries.map(({ system, code, label, scenario }) => ({
  id: `${system}-${code}`,
  system,
  prompt:
    system === "cid10"
      ? `O prontuário registra ${scenario} Qual código CID-10 corresponde?`
      : `No registro ${system === "sigtap" ? "do SUS" : "da saúde suplementar"}, qual código identifica ${scenario}?`,
  answer: code,
  alternatives: records[system]
    .map(([candidate]) => candidate)
    .filter((candidate) => candidate !== code),
  explanation: `${code} identifica “${label}”. ${systems[system].guidance}`,
}));

const workflowQuestions = [
  {
    id: "diagnostico-e-procedimento",
    system: "cid10",
    prompt:
      "A ficha registra hipertensão arterial primária e um eletrocardiograma realizado no SUS. Qual é o caminho para pesquisar os dois registros?",
    answer: "Diagnóstico na CID-10 e procedimento no SIGTAP.",
    alternatives: [
      "Diagnóstico e procedimento no SIGTAP.",
      "Diagnóstico no SIGTAP e procedimento na CID-10.",
      "Diagnóstico na CID-10 e procedimento sempre na TUSS.",
    ],
    explanation:
      "A CID-10 classifica a hipertensão documentada. O ECG realizado no SUS é pesquisado no SIGTAP.",
  },
  {
    id: "competencia-sus",
    system: "sigtap",
    prompt:
      "Você revisa em novembro um registro de radiografia realizado em outubro no SUS. Qual versão da tabela deve consultar para conferir o registro de outubro?",
    answer: "A competência de outubro, referente ao atendimento.",
    alternatives: [
      "A competência de novembro, data da revisão.",
      "A versão da TUSS publicada em setembro.",
      "Qualquer versão, se o código tiver dez dígitos.",
    ],
    explanation:
      "O SIGTAP disponibiliza a tabela por competência. Confira a competência aplicável ao atendimento e as regras do item naquele período.",
  },
  {
    id: "tuss-e-rol",
    system: "tuss",
    prompt:
      "Você encontra o código de um exame na TUSS. O que é possível concluir a partir desse código?",
    answer:
      "O exame tem uma identificação padronizada para a troca de informações.",
    alternatives: [
      "O exame é automaticamente coberto em qualquer plano.",
      "A autorização da operadora já foi concedida.",
      "O valor a cobrar é fixado pelo próprio código.",
    ],
    explanation:
      "A TUSS padroniza termos. Para avaliar cobertura, verifique o Rol da ANS, as regras aplicáveis e as condições do plano.",
  },
];

export const questions = [
  ...codeQuestions,
  ...workflowQuestions.map((question) => ({ ...question, workflow: true })),
];
