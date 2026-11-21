const conitec = "https://www.gov.br/conitec/pt-br";
const protocols = conitec + "/midias/protocolos/";
const lines = "https://linhasdecuidado.saude.gov.br/portal/";
const ministry = "https://www.gov.br/saude/pt-br";

export const checkedOn = "19/11/2026";
export const ambDirectory = [
  "Diretório de sociedades da AMB",
  "https://wordpress.amb.org.br/filiadas-3/sociedades-de-especialidade-contatos/",
];
export const references = [
  [
    "PCDT do SUS",
    conitec +
      "/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas/pcdt",
    "Conitec · Critérios, tratamento e acompanhamento no SUS",
  ],
  [
    "Linhas de Cuidado",
    ministry +
      "/composicao/saps/ecv/linhas-de-cuidado/plataforma-linhas-de-cuidado",
    "Ministério da Saúde · Fluxos assistenciais por ponto de atenção",
  ],
  [
    "Projeto Diretrizes",
    "https://amb.org.br/publicacoes-amb/projeto_diretrizes/",
    "AMB · Diretrizes e consensos das sociedades",
  ],
  [
    "Bulário Eletrônico",
    "https://www.gov.br/anvisa/pt-br/sistemas/bulario-eletronico",
    "Anvisa · Bulas de medicamentos",
  ],
  [
    "Medicamentos por CID e PCDT",
    conitec +
      "/protocolos-clinicos-e-diretrizes-terapeuticas/medicamentos-por-cid-e-pcdt",
    "Conitec · Painel oficial de consulta",
  ],
  [
    "Documentos científicos da SBP",
    "https://www.sbp.com.br/especiais/documentos-cientificos/",
    "Sociedade Brasileira de Pediatria",
  ],
  [
    "Diretrizes da SBC",
    "https://www.portal.cardiol.br/diretrizes",
    "Sociedade Brasileira de Cardiologia",
  ],
  [
    "Diretriz da SBD",
    "https://diretriz.diabetes.org.br/manejo-do-diabetes-mellitus-tipo-2/",
    "Sociedade Brasileira de Diabetes · Manejo de DM2",
  ],
  [
    "API de dados abertos de PCDT",
    "https://dadosabertos.saude.gov.br/dataset/pcdt-protocolos-clinicos-e-diretrizes-terapeuticas/resource/e7b00d9c-d638-4f94-822f-c921f75990ee",
    "Ministério da Saúde · Dados estruturados do catálogo de PCDT",
  ],
];

const pcdt = (title, path) => [
  title,
  protocols + path + "/@@display-file/file",
];
const line = (path) => ["Linha de cuidado · Ministério da Saúde", lines + path];
const topic = (id, title, area, aliases, scope, ...sources) => ({
  id,
  title,
  area,
  aliases,
  scope,
  sources,
});

export const clinicalTopics = [
  topic(
    "hipertensao",
    "Hipertensão arterial sistêmica",
    "Cardiometabólico",
    "HAS pressão alta I10",
    "Confirmação diagnóstica, estratificação de risco cardiovascular, tratamento e seguimento.",
    pcdt("PCDT do SUS · 2025", "pcdt-hipertensao-arterial-sistemica.pdf"),
    [
      "Diretriz de hipertensão · SBC, 2025",
      "https://www.portal.cardiol.br/entidades/dha",
    ],
  ),
  topic(
    "diabetes-2",
    "Diabetes mellitus tipo 2",
    "Cardiometabólico",
    "DM2 diabetes tipo 2 diabete glicemia hiperglicemia E11",
    "Diagnóstico, metas, manejo no SUS e prevenção de complicações.",
    pcdt("PCDT do SUS · 2026", "2026/pcdt-diabete-melito-tipo-2"),
    references[7],
  ),
  topic(
    "diabetes-1",
    "Diabetes mellitus tipo 1",
    "Cardiometabólico",
    "DM1 diabetes tipo 1 diabete insulinoterapia E10",
    "Diagnóstico, insulinoterapia e acompanhamento no SUS.",
    pcdt("PCDT do SUS", "portaria-conjunta-pcdt-diabete-melito-1.pdf"),
  ),
  topic(
    "dislipidemia",
    "Dislipidemia",
    "Cardiometabólico",
    "colesterol LDL HDL triglicerídeos E78",
    "Prevenção de eventos cardiovasculares, estratificação de risco e manejo.",
    pcdt("PCDT do SUS", "pcdt_dislipidemia.pdf"),
    references[6],
  ),
  topic(
    "insuficiencia-cardiaca",
    "Insuficiência cardíaca",
    "Cardiometabólico",
    "IC I50 fração de ejeção",
    "Fluxos da atenção primária, urgência e acompanhamento especializado.",
    line("insuficiencia-cardiaca-(IC)-no-adulto/"),
    references[6],
  ),
  topic(
    "obesidade",
    "Sobrepeso e obesidade em adultos",
    "Cardiometabólico",
    "IMC excesso de peso E66",
    "Avaliação nutricional e cuidado longitudinal de adultos no SUS.",
    [
      "PCDT · Ministério da Saúde",
      ministry + "/assuntos/pcdt/s/sobrepeso-e-obesidade-em-adultos/view",
    ],
  ),
  topic(
    "asma",
    "Asma",
    "Respiratório",
    "chiado broncoespasmo sibilância J45",
    "Diagnóstico, controle, exacerbações e acompanhamento.",
    [
      "PCDT do SUS · anexo atualizado em 2026",
      protocols +
        "2026/asma-portaria-conjunta-saes-sctie-no-43.pdf/@@download/file",
    ],
    pcdt(
      "PCDT resumido · Conitec",
      "2026/pcdt-resumido/pcdt_resumido_asma_f.pdf",
    ),
    line("asma/"),
  ),
  topic(
    "dpoc",
    "Doença pulmonar obstrutiva crônica",
    "Respiratório",
    "DPOC enfisema bronquite crônica J44",
    "Avaliação com espirometria, manejo e acompanhamento de exacerbações.",
    pcdt("PCDT do SUS · 2025", "pcdt-da-doenca-pulmonar-obstrutiva-cronica"),
  ),
  topic(
    "tabagismo",
    "Tabagismo",
    "Respiratório",
    "cigarro nicotina cessação F17",
    "Avaliação da dependência e tratamento para cessação no SUS.",
    ["PCDT do SUS", protocols + "pcdt_tabagismo.pdf"],
  ),
  topic(
    "dengue",
    "Dengue",
    "Infectologia",
    "arbovirose A90 febre",
    "Classificação de risco, sinais de alarme e manejo clínico de adultos e crianças.",
    [
      "Manual de manejo clínico · Ministério da Saúde",
      ministry +
        "/centrais-de-conteudo/publicacoes/svsa/dengue/dengue-diagnostico-e-manejo-clinico-adulto-e-crianca/view",
    ],
  ),
  topic(
    "tuberculose",
    "Tuberculose",
    "Infectologia",
    "TB BK A15 tosse",
    "Investigação, notificação, manejo e acompanhamento de contatos.",
    [
      "Manual de controle · Ministério da Saúde",
      ministry +
        "/centrais-de-conteudo/publicacoes/svsa/tuberculose/manual-de-recomendacoes-e-controle-da-tuberculose-no-brasil-2a-ed.pdf/view",
    ],
    [
      "Tuberculose resistente · atualização de 2026",
      "https://www.gov.br/aids/pt-br/assuntos/noticias/2026/outubro/ministerio-da-saude-atualiza-recomendacoes-para-tratamento-da-tuberculose-resistente-e-amplia-opcoes-no-sus",
    ],
  ),
  topic(
    "hanseniase",
    "Hanseníase",
    "Infectologia",
    "lepra A30 neuropatia",
    "Avaliação dermatoneurológica, tratamento e vigilância de contatos.",
    [
      "PCDT · Ministério da Saúde",
      ministry +
        "/assuntos/saude-de-a-a-z/h/hanseniase/publicacoes/protocolo-clinico-e-diretrizes-terapeuticas-da-hanseniase-2022/view",
    ],
  ),
  topic(
    "hiv",
    "Infecção pelo HIV",
    "Infectologia",
    "aids IST antirretroviral TARV PEP PrEP B20",
    "Protocolos de prevenção, tratamento e acompanhamento por população.",
    [
      "Central de PCDT · Ministério da Saúde",
      "https://www.gov.br/aids/pt-br/central-de-conteudo/pcdts",
    ],
  ),
  topic(
    "avc",
    "Acidente vascular cerebral",
    "Neurologia",
    "AVC AVE derrame I63 I64",
    "Reconhecimento, fluxos de urgência, cuidado hospitalar e reabilitação.",
    line("acidente-vascular-cerebral-(AVC)-no-adulto/"),
  ),
  topic(
    "epilepsia",
    "Epilepsia",
    "Neurologia",
    "convulsão crise epiléptica G40",
    "Classificação das crises, tratamento e acompanhamento.",
    pcdt("PCDT do SUS · anexo atualizado em 2025", "pcdt_epilepsia-1.pdf"),
  ),
  topic(
    "drc",
    "Doença renal crônica",
    "Clínica Médica",
    "DRC insuficiência renal N18 TFG albuminúria",
    "Classificação, seguimento e critérios de encaminhamento por ponto de atenção.",
    line("doenca-renal-cronica-(DRC)-em-adultos/"),
  ),
  topic(
    "dor-lombar",
    "Dor lombar",
    "Clínica Médica",
    "lombalgia lumbago dor costas M54",
    "Avaliação inicial, critérios para investigação e cuidado na rede.",
    line("dor-lombar/"),
  ),
  topic(
    "dermatite-atopica",
    "Dermatite atópica",
    "Clínica Médica",
    "eczema L20",
    "Diagnóstico, avaliação de gravidade e tratamento no SUS.",
    pcdt("PCDT do SUS · 2025", "pcdt-da-dermatite-atopica"),
  ),
  topic(
    "depressao",
    "Depressão no adulto",
    "Saúde Mental",
    "transtorno depressivo humor F32 F33",
    "Avaliação, situações agudas e acompanhamento na rede de saúde.",
    [
      "Linha de cuidado · situações agudas na APS",
      lines + "depressao/unidade-de-atencao-primaria/situacoes-agudas/",
    ],
    [
      "Orientações · Ministério da Saúde",
      ministry + "/assuntos/saude-de-a-a-z/d/depressao",
    ],
  ),
  topic(
    "ansiedade",
    "Transtornos de ansiedade no adulto",
    "Saúde Mental",
    "TAG pânico F41",
    "Reconhecimento e organização da assistência nos diferentes pontos da rede.",
    line("ansiedade/"),
  ),
  topic(
    "endometriose",
    "Endometriose",
    "Ginecologia e Obstetrícia",
    "dor pélvica dismenorreia N80",
    "Critérios diagnósticos e opções terapêuticas no SUS.",
    pcdt(
      "PCDT do SUS · anexo atualizado em 2026",
      "portaria-conjunta-n-54-endometriose.pdf",
    ),
  ),
  topic(
    "pre-natal",
    "Pré-natal",
    "Ginecologia e Obstetrícia",
    "gestação gestante gravidez risco obstétrico",
    "Cuidados de rotina, organização do acompanhamento e avaliação de risco.",
    [
      "Pré-natal de baixo risco · Ministério da Saúde",
      lines +
        "pre-natal-baixo-risco/unidade-de-atencao-primaria/planejamento-terapeutico/",
    ],
    [
      "Saúde materna · Ministério da Saúde",
      ministry + "/assuntos/saude-de-a-a-z/s/saude-da-mulher/saude-materna",
    ],
  ),
  topic(
    "autismo",
    "Transtorno do espectro autista na criança",
    "Pediatria",
    "TEA autismo F84 desenvolvimento",
    "Vigilância do desenvolvimento, avaliação e organização do cuidado.",
    line("transtorno-do-espectro-autista/"),
  ),
];
