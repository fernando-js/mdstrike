export const medicationSources = {
  leaflets: [
    "Bulário Eletrônico da Anvisa",
    "https://consultas.anvisa.gov.br/#/bulario/",
  ],
  registry: [
    "Registros de medicamentos · CSV da Anvisa",
    "https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv",
  ],
  reading: [
    "Anvisa · Perguntas e respostas sobre bulas",
    "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/bulas-e-rotulos/perguntas-e-respostas-sobre-bulas",
  ],
};

export const medications = {
  paracetamol: {
    name: "Paracetamol",
    brand: "Tylenol",
    form: "Comprimidos de 500 mg",
    group: "Dor e febre",
    className: "Analgésico e antitérmico",
    uses: "Alívio temporário de dores leves a moderadas e redução da febre.",
    highlights: [
      "Antigripais e outros analgésicos podem conter paracetamol. A bula orienta evitar a duplicação do princípio ativo.",
      "O excesso de paracetamol pode causar lesão hepática. A bula destaca cuidados para pessoas com doença grave do fígado.",
    ],
    source: [
      "Tylenol 500 e 750 mg · Bula do paciente",
      "https://assets.ctfassets.net/g574hlexgjps/4bTdvTdxHCIdI4msJDOhCo/2e18ab3261d76ebd46f9cb66ca288ca8/Bula_Tylenol-500mg-e-750mg.pdf",
    ],
  },
  dipirona: {
    name: "Dipirona",
    brand: "Novalgina",
    form: "Comprimidos de 500 mg",
    group: "Dor e febre",
    className: "Analgésico e antitérmico",
    uses: "Alívio da dor e da febre.",
    highlights: [
      "A agranulocitose é uma reação rara e grave destacada na bula. Febre, dor de garganta e feridas na boca durante o uso podem ser sinais de alerta.",
      "Histórico de agranulocitose causada por dipirona ou por medicamentos de classes relacionadas consta entre as contraindicações.",
    ],
    source: [
      "Novalgina 500 mg · Bula do paciente",
      "https://www.novalgina.com.br/produtos/adulto/500mg-comprimido/bula",
    ],
  },
  ibuprofeno: {
    name: "Ibuprofeno",
    brand: "Buscofem",
    form: "Cápsulas moles de 400 mg",
    group: "Dor e febre",
    className: "Anti-inflamatório não esteroidal (AINE)",
    uses: "Alívio temporário de dores leves a moderadas, como dor de cabeça e cólicas menstruais, e redução da febre.",
    highlights: [
      "O uso junto de outros AINEs aumenta o risco de reações adversas. A bula também destaca o risco de sangramento com anticoagulantes e antiagregantes.",
      "A bula contraindica essa apresentação no terceiro trimestre da gestação.",
    ],
    source: [
      "Buscofem cápsulas · Bula do paciente",
      "https://www.buscofem.com.br/bula-buscofem",
    ],
  },
  amoxicilina: {
    name: "Amoxicilina",
    brand: "Amoxil",
    form: "Cápsulas de 500 mg",
    group: "Antimicrobianos",
    className: "Antibiótico betalactâmico da família das penicilinas",
    uses: "Tratamento de infecções bacterianas causadas por microrganismos sensíveis à amoxicilina.",
    highlights: [
      "A bula contraindica essa apresentação em pessoas com histórico de hipersensibilidade a antibióticos betalactâmicos.",
      "A bula descreve reações alérgicas graves. O histórico de reações a antibióticos é uma informação relevante antes da prescrição.",
    ],
    source: [
      "GSK · Amoxil cápsulas, bula do profissional",
      "https://br.gsk.com/media/gvug0lie/amoxil-capsulas.pdf",
    ],
  },
  losartana: {
    name: "Losartana potássica",
    brand: "Cozaar",
    form: "Comprimidos revestidos de 50 mg",
    group: "Cardiovascular",
    className: "Bloqueador do receptor da angiotensina II (BRA)",
    uses: "A bula inclui o tratamento da hipertensão arterial entre as indicações.",
    highlights: [
      "Suplementos de potássio, substitutos do sal que contêm potássio e diuréticos poupadores de potássio podem aumentar o risco de hipercalemia.",
      "O documento contraindica o uso no segundo e no terceiro trimestre da gestação e traz advertência também para o primeiro trimestre.",
    ],
    source: [
      "Organon · Cozaar, bula do profissional",
      "https://www.organon.com/brazil/wp-content/uploads/sites/33/2023/06/cozaar_bula_profissional.pdf",
    ],
  },
  omeprazol: {
    name: "Omeprazol",
    brand: "Eurofarma",
    form: "Cápsulas de 20 mg com microgrânulos",
    group: "Gastrointestinal",
    className: "Inibidor da bomba de prótons (IBP)",
    uses: "O documento inclui o tratamento de úlceras pépticas gástricas e duodenais entre as indicações.",
    highlights: [
      "A redução da acidez gástrica pode diminuir a absorção de certos medicamentos, como o cetoconazol.",
      "A bula descreve que o omeprazol pode retardar a eliminação de alguns medicamentos, como diazepam e fenitoína.",
    ],
    source: [
      "Eurofarma · Omeprazol 20 mg, bula do profissional",
      "https://cdn.eurofarma.com.br/wp-content/uploads/2017/03/Omeprazol-Profissional.pdf",
    ],
  },
};
