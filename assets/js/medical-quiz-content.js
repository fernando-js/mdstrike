import {
  medications,
  medicationSources,
} from "./medication-content.js?v=3.4.0";

const knee = [
  "Stanford Medicine 25 · Exame do joelho",
  "https://stanfordmedicine25.stanford.edu/the25/knee.html",
];
const tunnel = [
  "NINDS · Síndrome do túnel do carpo",
  "https://www.ninds.nih.gov/sites/default/files/migrate-documents/carpal_tunnel_syndrome_e_march_2020_508c_0.pdf",
];
const hypocalcemia = [
  "Manual MSD · Hipocalcemia",
  "https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hypocalcemia",
];

const history = [
  [
    "jenner",
    "Em 1796, Edward Jenner usou material de uma lesão de varíola bovina em um experimento de imunização. Qual doença humana ele investigava?",
    "Varíola",
    ["Sarampo", "Poliomielite", "Febre amarela"],
    "Jenner estudava a prevenção da varíola. Séculos depois, campanhas com vacinação e vigilância levaram à erradicação, declarada pela OMS em 1980.",
    [
      "OMS · História da varíola",
      "https://www.who.int/emergencies/situations/smallpox",
    ],
  ],
  [
    "semmelweis",
    "Em uma maternidade de Viena, Ignaz Semmelweis buscou reduzir as mortes por febre puerperal. Qual medida ele introduziu na clínica em 1847?",
    "Desinfecção das mãos antes do atendimento",
    [
      "Vacinação contra a varíola na admissão",
      "Uso rotineiro de penicilina",
      "Triagem por radiografia",
    ],
    "Semmelweis introduziu a desinfecção das mãos com uma solução clorada. A mortalidade por febre puerperal caiu após a mudança na clínica.",
    [
      "OMS · Perspectiva histórica da higiene das mãos",
      "https://www.ncbi.nlm.nih.gov/books/NBK144018/",
    ],
  ],
  [
    "snow",
    "Em 1854, John Snow comparou a localização de casos de cólera em Londres com uma fonte de exposição. O que ele identificou na Broad Street?",
    "Uma bomba pública de água",
    [
      "Um mercado de leite",
      "Uma fábrica de tecidos",
      "Um hospital de isolamento",
    ],
    "A investigação associou os casos de cólera à água de uma bomba pública. Ela ilustra como rastrear uma exposição comum durante um surto.",
    [
      "CDC · John Snow e a bomba da Broad Street",
      "https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5334a1.htm",
    ],
  ],
  [
    "rontgen",
    "Qual descoberta rendeu a Wilhelm Conrad Röntgen o Nobel de Física de 1901 e permitiu visualizar ossos sem cirurgia?",
    "Raios X",
    ["Ultrassom", "Ressonância magnética", "Radioatividade artificial"],
    "Röntgen descobriu os raios X em 1895. A descoberta deu origem à radiografia e abriu caminho para o diagnóstico por imagem.",
    [
      "Nobel Prize · Física de 1901",
      "https://www.nobelprize.org/prizes/physics/1901/summary/",
    ],
  ],
  [
    "revolta",
    "Qual vacinação obrigatória esteve no centro da Revolta da Vacina, no Rio de Janeiro em 1904?",
    "Contra a varíola",
    [
      "Contra a febre amarela",
      "Contra a peste bubônica",
      "Contra a tuberculose",
    ],
    "A vacinação obrigatória contra a varíola desencadeou protestos em meio a reformas urbanas e à insatisfação com a forma de intervenção do governo.",
    [
      "Fiocruz · Revolta da Vacina",
      "https://invivo.fiocruz.br/historia/revolta-da-vacina/",
    ],
  ],
  [
    "chagas",
    "Em 1909, em Lassance, Minas Gerais, Carlos Chagas encontrou no sangue de uma criança o parasita associado à doença que leva seu nome. Qual era?",
    "Trypanosoma cruzi",
    ["Leishmania infantum", "Plasmodium vivax", "Schistosoma mansoni"],
    "A descoberta ligou Trypanosoma cruzi à tripanossomíase americana. As pesquisas em Lassance também ajudaram a estabelecer o papel dos barbeiros na transmissão.",
    [
      "Fiocruz · Carlos Chagas e a descoberta",
      "https://chagas.fiocruz.br/historia/carlos-chagas/",
    ],
  ],
  [
    "insulina",
    "Que descoberta foi reconhecida pelo Nobel de Fisiologia ou Medicina de 1923, concedido a Frederick Banting e John Macleod?",
    "Insulina",
    ["Heparina", "Vitamina B12", "Cortisona"],
    "A descoberta da insulina envolveu a equipe de Toronto e transformou o tratamento do diabetes. Charles Best e James Collip também participaram do trabalho.",
    [
      "Nobel Prize · Palestra de Frederick Banting",
      "https://www.nobelprize.org/prizes/medicine/1923/banting/lecture/",
    ],
  ],
  [
    "einthoven",
    "Qual exame foi central para o trabalho de Willem Einthoven reconhecido pelo Nobel de Fisiologia ou Medicina de 1924?",
    "Eletrocardiograma",
    ["Eletroencefalograma", "Espirometria", "Ecocardiograma"],
    "Einthoven aprimorou o registro da atividade elétrica do coração. As derivações bipolares dos membros são associadas ao seu trabalho.",
    [
      "Nobel Prize · Medicina de 1924",
      "https://www.nobelprize.org/prizes/medicine/1924/summary/",
    ],
  ],
  [
    "penicilina",
    "O Nobel de Fisiologia ou Medicina de 1945 foi compartilhado por Alexander Fleming, Ernst Chain e Howard Florey. Qual descoberta e aplicação foram reconhecidas?",
    "Penicilina e seu efeito terapêutico",
    [
      "Vacina contra a tuberculose",
      "Insulina e seu efeito na glicemia",
      "Purificação da estreptomicina",
    ],
    "Fleming observou a inibição bacteriana pelo fungo. Chain e Florey contribuíram para transformar a observação em tratamento.",
    [
      "Nobel Prize · Medicina de 1945",
      "https://www.nobelprize.org/prizes/medicine/1945/summary/",
    ],
  ],
  [
    "sus",
    "Qual documento brasileiro de 1988 reconheceu a saúde como direito de todos e dever do Estado e estabeleceu as bases do SUS?",
    "Constituição Federal",
    [
      "Código Civil",
      "Estatuto da Criança e do Adolescente",
      "Código de Ética Médica",
    ],
    "A Constituição de 1988 estabeleceu o direito à saúde no artigo 196 e definiu as diretrizes do SUS no artigo 198. A Lei 8.080 detalhou sua organização em 1990.",
    [
      "Conselho Nacional de Saúde · Artigos 196 a 200",
      "https://www.gov.br/conselho-nacional-de-saude/pt-br/acesso-a-informacao/legislacao/outras-normativas/constituicaofederal.pdf/view",
    ],
  ],
];

const eponyms = [
  [
    "babinski",
    "Ao examinar um adulto, um estímulo plantar provoca extensão do hálux. Qual epônimo descreve essa resposta?",
    "Sinal de Babinski",
    ["Sinal de Chvostek", "Sinal de Tinel", "Sinal de Romberg"],
    "Babinski é o nome da resposta plantar extensora. No exame de adultos, ela pode sugerir alteração da via corticoespinal.",
    [
      "Manual MSD · Avaliação dos reflexos",
      "https://www.msdmanuals.com/professional/neurologic-disorders/neurologic-examination/how-to-assess-reflexes",
    ],
  ],
  [
    "romberg",
    "Uma pessoa se mantém em pé com os pés juntos e olhos abertos, mas perde estabilidade ao fechar os olhos. Qual teste foi descrito?",
    "Teste de Romberg",
    ["Teste de Lachman", "Teste de Phalen", "Teste de McMurray"],
    "O teste de Romberg compara a estabilidade com e sem referência visual. Perda de equilíbrio ao fechar os olhos é o achado clássico de positividade.",
    [
      "Stanford Medicine 25 · Exame da marcha e equilíbrio",
      "https://stanfordmedicine25.stanford.edu/the25/gait.html",
    ],
  ],
  [
    "lachman",
    "Em um exame do joelho, a translação anterior da tíbia é avaliada com o joelho levemente flexionado. Qual é o nome do teste?",
    "Teste de Lachman",
    ["Teste de McMurray", "Teste de Phalen", "Teste de Romberg"],
    "O teste de Lachman avalia a integridade do ligamento cruzado anterior pela translação anterior da tíbia e a sensação do ponto final.",
    knee,
  ],
  [
    "mcmurray",
    "Que manobra do joelho usa rotação e movimento de flexão e extensão para investigar lesão meniscal?",
    "Teste de McMurray",
    ["Teste de Lachman", "Teste de Romberg", "Teste de Phalen"],
    "Dor ou ressalto na interlinha durante McMurray pode sugerir lesão meniscal. O achado é interpretado com o restante do exame.",
    knee,
  ],
  [
    "murphy",
    "A palpação do hipocôndrio direito provoca dor e interrompe a inspiração profunda. Qual epônimo descreve o achado?",
    "Sinal de Murphy",
    ["Sinal de Rovsing", "Sinal de Chvostek", "Sinal de Babinski"],
    "O sinal de Murphy é a interrupção inspiratória dolorosa durante a palpação da região da vesícula. É um achado associado à colecistite aguda.",
    [
      "Manual MSD · Colecistite aguda",
      "https://www.msdmanuals.com/professional/hepatic-and-biliary-disorders/gallbladder-and-bile-duct-disorders/acute-cholecystitis",
    ],
  ],
  [
    "rovsing",
    "A palpação do quadrante inferior esquerdo do abdome desencadeia dor no quadrante inferior direito. Qual sinal foi descrito?",
    "Sinal de Rovsing",
    ["Sinal de Murphy", "Sinal de Tinel", "Sinal de Trousseau"],
    "Em Rovsing, a dor é sentida à direita ao palpar à esquerda. O achado pode aparecer na avaliação de apendicite.",
    [
      "Manual MSD · Apendicite",
      "https://www.msdmanuals.com/professional/gastrointestinal-disorders/acute-abdomen-and-surgical-gastroenterology/appendicitis",
    ],
  ],
  [
    "tinel",
    "No punho, a percussão sobre o trajeto do nervo mediano reproduz formigamento nos dedos inervados por ele. Qual sinal é esse?",
    "Sinal de Tinel",
    ["Teste de Phalen", "Sinal de Chvostek", "Teste de Romberg"],
    "No túnel do carpo, Tinel descreve parestesia reproduzida pela percussão sobre o nervo mediano. Phalen provoca sintomas pela flexão sustentada do punho.",
    tunnel,
  ],
  [
    "phalen",
    "Qual teste reproduz sintomas no território do nervo mediano com flexão sustentada dos punhos?",
    "Teste de Phalen",
    ["Sinal de Tinel", "Teste de McMurray", "Sinal de Murphy"],
    "Phalen é um teste provocativo usado no exame de suspeita de síndrome do túnel do carpo. A história clínica ajuda a interpretar o resultado.",
    tunnel,
  ],
  [
    "chvostek",
    "A percussão sobre o nervo facial desencadeia contração dos músculos da face do mesmo lado. Qual o nome do sinal?",
    "Sinal de Chvostek",
    ["Sinal de Trousseau", "Sinal de Babinski", "Sinal de Tinel"],
    "Chvostek descreve a contração facial em resposta à percussão. Pode aparecer na hipocalcemia, mas também ocorre em pessoas com cálcio normal.",
    hypocalcemia,
  ],
  [
    "trousseau",
    "Na avaliação de possível hipocalcemia, a insuflação de um manguito no braço provoca espasmo carpopedal. Qual sinal foi descrito?",
    "Sinal de Trousseau",
    ["Sinal de Chvostek", "Sinal de Romberg", "Sinal de Rovsing"],
    "Nesse contexto, Trousseau designa o espasmo carpopedal provocado pelo manguito. Ele é um achado de hiperexcitabilidade neuromuscular.",
    hypocalcemia,
  ],
];

const medicationQuestions = [
  [
    "medicamentos-paracetamol",
    "Uma caixa lista paracetamol como princípio ativo. Qual informação de um antigripal ajuda a identificar uma possível duplicação?",
    "A composição e os princípios ativos",
    ["O número do lote", "O tamanho da caixa", "A data de fabricação"],
    medications.paracetamol.highlights[0],
    medications.paracetamol.source,
  ],
  [
    "medicamentos-dipirona",
    "Qual reação rara destacada na bula da dipirona envolve queda acentuada de granulócitos?",
    "Agranulocitose",
    ["Trombocitose", "Policitemia", "Eosinofilia"],
    medications.dipirona.highlights[0],
    medications.dipirona.source,
  ],
  [
    "medicamentos-ibuprofeno",
    "A bula de ibuprofeno destaca risco adicional de sangramento na presença de varfarina. A que classe pertence a varfarina?",
    "Anticoagulantes",
    [
      "Antitérmicos",
      "Antibióticos betalactâmicos",
      "Inibidores da bomba de prótons",
    ],
    medications.ibuprofeno.highlights[0],
    medications.ibuprofeno.source,
  ],
  [
    "medicamentos-amoxicilina",
    "A história de hipersensibilidade a penicilinas é relevante ao conferir a bula de qual medicamento?",
    "Amoxicilina",
    ["Ibuprofeno", "Losartana potássica", "Omeprazol"],
    "A amoxicilina é uma penicilina. " + medications.amoxicilina.highlights[0],
    medications.amoxicilina.source,
  ],
  [
    "medicamentos-losartana",
    "Qual eletrólito merece atenção ao conferir na bula a associação de losartana com espironolactona?",
    "Potássio",
    ["Cloreto", "Fosfato", "Bicarbonato"],
    medications.losartana.highlights[0],
    medications.losartana.source,
  ],
  [
    "medicamentos-omeprazol",
    "A qual classe pertence o omeprazol?",
    "Inibidores da bomba de prótons",
    [
      "Antibióticos betalactâmicos",
      "Bloqueadores do receptor da angiotensina II",
      "Anti-inflamatórios não esteroidais",
    ],
    "O omeprazol reduz a secreção de ácido gástrico. " +
      medications.omeprazol.highlights[0],
    medications.omeprazol.source,
  ],
  [
    "medicamentos-duas-bulas",
    "No Bulário Eletrônico, qual versão traz informações farmacológicas em linguagem técnica para a prática clínica?",
    "Bula do profissional de saúde",
    ["Bula do paciente", "Tabela de preços da CMED", "Cadastro da empresa"],
    "A versão do profissional reúne informações técnicas. A versão do paciente apresenta orientações em linguagem mais acessível.",
    medicationSources.reading,
  ],
  [
    "medicamentos-apresentacao",
    "Um mesmo princípio ativo aparece em comprimidos e em gotas. O que conferir antes de usar uma bula como referência?",
    "Produto, forma farmacêutica e concentração",
    [
      "Apenas o nome do princípio ativo",
      "A cor da caixa e a farmácia",
      "A página em que apareceu na busca",
    ],
    "Confirme se a bula corresponde ao medicamento e à apresentação. A forma farmacêutica e a concentração ajudam a distinguir versões.",
    medicationSources.reading,
  ],
];

function asQuestions(items) {
  return items.map(
    ([id, prompt, answer, alternatives, explanation, source]) => ({
      id,
      prompt,
      answer,
      alternatives,
      explanation,
      source,
    }),
  );
}

export const themes = {
  "historia-medicina": {
    name: "História da Medicina",
    description:
      "Relacione descobertas, epidemias e marcos da saúde pública ao que mudou na prática.",
    questions: asQuestions(history),
  },
  eponimos: {
    name: "Epônimos em Medicina",
    description:
      "Associe sinais e manobras ao que você observa no exame físico.",
    questions: asQuestions(eponyms),
  },
  medicamentos: {
    name: "Medicamentos e bulas",
    description:
      "Treine classes, interações e a leitura do documento de cada apresentação.",
    questions: asQuestions(medicationQuestions),
  },
};
