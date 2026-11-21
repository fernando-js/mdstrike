const anatomy = "https://openstax.org/books/anatomy-and-physiology-2e/pages/";
const micro = "https://openstax.org/books/microbiology/pages/";
const ministry = "https://www.gov.br/saude/pt-br";
const basic = "Ciclo básico";
const clinical = "Ciclo clínico";
const internship = "Internato";
const summary = (
  id,
  discipline,
  cycle,
  title,
  points,
  question,
  answer,
  source,
  related = "",
) => ({
  id,
  discipline,
  cycle,
  title,
  points,
  question,
  answer,
  source,
  related,
});

export const curriculumSource = [
  "Diretrizes curriculares de Medicina · MEC",
  "https://www.gov.br/mec/pt-br/cne/2025/outubro-2025/rces003_25.pdf",
];

export const summaries = [
  summary(
    "anatomia",
    "Anatomia",
    basic,
    "Trajeto do sangue pelo coração",
    [
      "O lado direito recebe sangue das veias cavas e o envia aos pulmões pelo tronco pulmonar.",
      "As veias pulmonares conduzem sangue oxigenado ao átrio esquerdo. O ventrículo esquerdo o impulsiona pela aorta.",
      "As válvulas abrem e fecham de acordo com os gradientes de pressão que se formam no ciclo cardíaco.",
    ],
    "Qual vaso leva o sangue do ventrículo direito aos pulmões?",
    "O tronco pulmonar sai do ventrículo direito e se divide nas artérias pulmonares direita e esquerda.",
    ["Anatomy and Physiology · coração", anatomy + "19-introduction"],
  ),
  summary(
    "histologia",
    "Histologia",
    basic,
    "Epitélio, forma e função",
    [
      "As células epiteliais se organizam em lâminas com polo apical, polo basal e apoio em uma membrana basal.",
      "Epitélios simples favorecem troca ou absorção. A estratificação amplia a proteção em superfícies submetidas a atrito.",
      "No epitélio pseudoestratificado, todas as células tocam a membrana basal, embora nem todas alcancem a superfície.",
    ],
    "Qual traço distingue um epitélio pseudoestratificado de um estratificado?",
    "Todas as células do pseudoestratificado tocam a membrana basal.",
    [
      "Anatomy and Physiology · tecido epitelial",
      anatomy + "4-2-epithelial-tissue",
    ],
  ),
  summary(
    "embriologia",
    "Embriologia",
    basic,
    "Os três folhetos embrionários",
    [
      "A gastrulação estabelece ectoderma, mesoderma e endoderma.",
      "A epiderme e o sistema nervoso se originam do ectoderma. Músculos, ossos e vasos têm origem predominantemente mesodérmica.",
      "O endoderma contribui para o revestimento epitelial dos tratos digestório e respiratório.",
    ],
    "De qual folheto se origina o epitélio que reveste a maior parte do tubo digestório?",
    "Do endoderma. O tecido muscular da parede tem origem mesodérmica.",
    [
      "Anatomy and Physiology · desenvolvimento embrionário",
      anatomy + "28-2-embryonic-development",
    ],
  ),
  summary(
    "fisiologia",
    "Fisiologia",
    basic,
    "Débito cardíaco e volume sistólico",
    [
      "Débito cardíaco é o volume bombeado por minuto. Multiplique frequência cardíaca pelo volume ejetado a cada batimento.",
      "O volume sistólico corresponde à diferença entre o volume diastólico final e o volume sistólico final.",
      "Pré-carga, pós-carga e contratilidade influenciam o volume sistólico por mecanismos distintos.",
    ],
    "Qual o débito cardíaco com 75 batimentos/min e 80 mL por batimento?",
    "6 L/min, pois 75 × 80 mL = 6.000 mL por minuto.",
    [
      "Anatomy and Physiology · função cardíaca",
      anatomy + "19-4-cardiac-physiology",
    ],
    "insuficiencia-cardiaca",
  ),
  summary(
    "bioquimica",
    "Bioquímica",
    basic,
    "Glicólise e produção de ATP",
    [
      "A glicólise ocorre no citosol e converte uma molécula de glicose em duas de piruvato.",
      "A via consome dois ATP e produz quatro, para um saldo líquido de dois ATP por glicose.",
      "A conversão de piruvato em lactato regenera NAD⁺, permitindo que a glicólise prossiga.",
    ],
    "Por que a regeneração do NAD⁺ importa para a glicólise?",
    "Uma etapa de oxidação da via precisa do NAD⁺ como aceptor de elétrons.",
    [
      "Anatomy and Physiology · metabolismo de carboidratos",
      anatomy + "24-2-carbohydrate-metabolism",
    ],
  ),
  summary(
    "imunologia",
    "Imunologia",
    basic,
    "Resposta imune inata e adaptativa",
    [
      "Barreiras, complemento e fagócitos integram a defesa inata e reconhecem padrões de ameaça.",
      "Linfócitos B e T têm receptores com especificidade para antígenos e participam da resposta adaptativa.",
      "A exposição a um antígeno pode estimular a formação de células de memória, que favorecem a resposta em reexposições.",
    ],
    "Que propriedade explica uma resposta mais rápida após reexposição ao mesmo antígeno?",
    "A memória imunológica, sustentada por populações de linfócitos de memória.",
    [
      "Microbiology · imunidade adaptativa",
      micro + "18-1-overview-of-specific-adaptive-immunity",
    ],
  ),
  summary(
    "microbiologia",
    "Microbiologia",
    basic,
    "Parede bacteriana e coloração de Gram",
    [
      "Bactérias Gram-positivas tipicamente têm uma camada espessa de peptidoglicano. Gram-negativas possuem uma camada mais fina, envolvida por uma membrana externa.",
      "No método de Gram, o complexo cristal violeta–iodo permanece nas Gram-positivas após a descoloração. As Gram-negativas recebem a coloração de contraste.",
      "Morfologia e coloração orientam a investigação microbiológica. A identificação e a sensibilidade exigem os métodos adequados a cada amostra.",
    ],
    "Que estrutura adicional caracteriza a parede celular típica de uma bactéria Gram-negativa?",
    "Uma membrana externa que contém lipopolissacarídeo.",
    [
      "Microbiology · coloração de amostras",
      micro + "2-4-staining-microscopic-specimens",
    ],
  ),
  summary(
    "genetica",
    "Genética Médica",
    basic,
    "Herança autossômica recessiva",
    [
      "Uma condição recessiva pode se manifestar quando a pessoa recebe uma variante patogênica em cada cópia do gene.",
      "No modelo mendeliano clássico, duas pessoas heterozigotas para o mesmo gene têm, em cada gestação, 25% de chance de ter uma criança afetada.",
      "A probabilidade se aplica a cada gestação. Uma gestação anterior com a condição não altera a chance da próxima.",
    ],
    "Em um cruzamento Aa × Aa, qual a chance de um descendente Aa?",
    "50%. Há quatro combinações equiprováveis, e duas produzem o genótipo Aa.",
    [
      "Anatomy and Physiology · padrões de herança",
      anatomy + "28-7-patterns-of-inheritance",
    ],
  ),
  summary(
    "farmacologia",
    "Farmacologia",
    basic,
    "Alvos de antimicrobianos",
    [
      "Antimicrobianos podem interferir na parede celular, na síntese proteica, na replicação de ácidos nucleicos ou em vias metabólicas.",
      "Toxicidade seletiva depende de diferenças entre o alvo no microrganismo e estruturas ou vias no hospedeiro.",
      "Um padrão de sensibilidade microbiológica é uma das informações usadas na avaliação de um antimicrobiano.",
    ],
    "Que processo celular é afetado quando um antimicrobiano se liga ao ribossomo bacteriano?",
    "A síntese de proteínas.",
    [
      "Microbiology · mecanismos de ação",
      micro + "14-3-mechanisms-of-antibacterial-drugs",
    ],
  ),
  summary(
    "semiologia",
    "Semiologia",
    clinical,
    "Aferição de pressão arterial",
    [
      "Padronize postura, repouso e posição do braço antes da medida e use um manguito adequado à circunferência do braço.",
      "Registre os valores e o contexto da aferição. O local e a técnica influenciam a comparação com medidas futuras.",
      "A diretriz orienta quando repetir medidas e quando usar monitorização fora do consultório.",
    ],
    "Quais detalhes da técnica você deve conferir antes de comparar duas medidas?",
    "Tamanho do manguito, repouso, postura, posição do braço e contexto da aferição.",
    [
      "Diretriz Brasileira de Hipertensão · SBC",
      "https://www.portal.cardiol.br/entidades/dha",
    ],
    "hipertensao",
  ),
  summary(
    "clinica",
    "Clínica Médica",
    clinical,
    "Avaliação longitudinal no diabetes tipo 2",
    [
      "O acompanhamento incorpora controle glicêmico e risco cardiovascular e renal.",
      "Compare a tendência dos dados ao longo do tempo. Histórias de hipoglicemia, comorbidades e preferências ajudam a individualizar metas.",
      "A prevenção de complicações envolve acompanhamento dos pés, da visão e da função renal conforme as recomendações aplicáveis.",
    ],
    "Quais dois eixos de risco complementam a avaliação da glicemia?",
    "O risco cardiovascular e o risco renal.",
    [
      "Manejo do diabetes tipo 2 · SBD",
      "https://diretriz.diabetes.org.br/manejo-do-diabetes-mellitus-tipo-2/",
    ],
    "diabetes-2",
  ),
  summary(
    "pediatria",
    "Pediatria",
    clinical,
    "Crescimento e desenvolvimento",
    [
      "Crescimento diz respeito a medidas físicas. Desenvolvimento inclui habilidades motoras, de linguagem, cognitivas e sociais.",
      "Medidas seriadas permitem interpretar trajetórias nas curvas de crescimento.",
      "A vigilância do desenvolvimento reúne observação, relato da família e registro de marcos ao longo das consultas.",
    ],
    "O que uma curva de peso ajuda a avaliar e o que precisa ser avaliado em paralelo?",
    "Ela mostra a trajetória do crescimento. Os marcos do desenvolvimento exigem observação e acompanhamento próprios.",
    [
      "Linha de cuidado · Puericultura",
      "https://linhasdecuidado.saude.gov.br/portal/puericultura/",
    ],
    "autismo",
  ),
  summary(
    "obstetricia",
    "Ginecologia e Obstetrícia",
    clinical,
    "Avaliação de risco no pré-natal",
    [
      "O pré-natal reúne história obstétrica, condições preexistentes, exames e avaliação do bem-estar materno e fetal.",
      "A avaliação de risco começa cedo e é revista conforme surgem novas informações durante a gestação.",
      "A atenção primária coordena o cuidado e a comunicação entre os pontos da rede.",
    ],
    "Quando o risco obstétrico deve ser revisto?",
    "Ao longo do pré-natal. Novos sintomas, achados ou diagnósticos podem alterar a classificação.",
    [
      "Saúde materna · Ministério da Saúde",
      ministry + "/assuntos/saude-de-a-a-z/s/saude-da-mulher/saude-materna",
    ],
    "pre-natal",
  ),
  summary(
    "cirurgia",
    "Cirurgia Geral",
    internship,
    "Lista de verificação de cirurgia segura",
    [
      "A equipe faz verificações antes da indução anestésica, antes da incisão e antes da saída da sala.",
      "A primeira pausa reúne itens como identidade, procedimento, local cirúrgico e riscos relevantes.",
      "A saída inclui verificações como contagem de materiais, identificação de amostras e planejamento de cuidados pós-operatórios.",
    ],
    "Quais são as três pausas da lista de segurança cirúrgica?",
    "Antes da indução anestésica, antes da incisão e antes da saída da sala.",
    [
      "Protocolo de cirurgia segura · Anvisa",
      "https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/servicosdesaude/publicacoes/protocolo-de-cirurgia-segura",
    ],
  ),
  summary(
    "coletiva",
    "Saúde Coletiva e Epidemiologia",
    clinical,
    "Incidência e prevalência",
    [
      "Incidência descreve a ocorrência de casos novos em uma população sob risco ao longo de um período.",
      "Prevalência mede a proporção da população que tem a condição no ponto ou período avaliado.",
      "A duração da condição influencia a prevalência. Doenças de longa duração podem acumular casos ao longo do tempo.",
    ],
    "Para dimensionar o atendimento às pessoas que vivem com uma doença hoje, qual medida é mais direta?",
    "A prevalência ajuda a estimar quantas pessoas convivem com a doença no período ou momento avaliado.",
    [
      "Guia de Vigilância em Saúde · Ministério da Saúde",
      ministry +
        "/centrais-de-conteudo/publicacoes/svsa/vigilancia/guia-de-vigilancia-em-saude-volume-2-6a-edicao/view",
    ],
    "tuberculose",
  ),
  summary(
    "saude-mental",
    "Psiquiatria",
    clinical,
    "Avaliação de sintomas depressivos",
    [
      "A entrevista investiga humor, interesse, sono, energia e repercussão no funcionamento.",
      "A duração, o curso e o contexto dos sintomas ajudam a organizar as hipóteses.",
      "A avaliação também aborda segurança, uso de substâncias e histórico de episódios de elevação de humor.",
    ],
    "Por que é importante perguntar sobre a repercussão no cotidiano?",
    "A repercussão ajuda a interpretar a gravidade e a orientar o plano de acompanhamento.",
    [
      "Depressão · Ministério da Saúde",
      ministry + "/assuntos/saude-de-a-a-z/d/depressao",
    ],
    "depressao",
  ),
  summary(
    "etica",
    "Ética Médica",
    internship,
    "Sigilo e comunicação clínica",
    [
      "A confidencialidade faz parte da relação clínica e alcança informações recebidas no exercício profissional.",
      "A discussão de casos para estudo deve evitar dados que permitam reconhecer a pessoa atendida.",
      "O Código de Ética Médica orienta exceções ao dever de sigilo, como motivo justo, dever legal ou consentimento escrito.",
    ],
    "Remover o nome de um caso basta para proteger a identidade?",
    "Outros dados em conjunto podem identificar a pessoa. Revise datas, locais e características incomuns antes de compartilhar.",
    [
      "Código de Ética Médica · CFM",
      "https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2018/2217",
    ],
  ),
];

export const cases = [
  {
    id: "tosse-noturna",
    title: "Tosse que acorda",
    area: "Respiratório",
    opening:
      "Uma pessoa de 22 anos relata crises de tosse à noite e desconforto ao correr. Entre os episódios, diz sentir-se bem.",
    hypotheses:
      "Descreva o problema em uma frase. Liste duas hipóteses e uma pergunta que ajudaria a distinguir cada uma.",
    clue: "Os episódios variam de intensidade e são mais frequentes após exposição a poeira. Em uma consulta entre crises, a ausculta foi normal.",
    objectives:
      "Estude por que a função pulmonar pode variar na asma, como se pesquisa limitação variável ao fluxo aéreo e o que diferencia o diagnóstico do controle da doença.",
    synthesis:
      "O padrão variável de sintomas justifica investigar asma e outras causas de tosse. O exame normal entre crises pode coexistir com sintomas intermitentes. A espirometria ajuda a buscar evidência objetiva no contexto clínico.",
    topic: "asma",
    review: "semiologia",
  },
  {
    id: "glicemia",
    title: "Dois resultados de glicemia",
    area: "Cardiometabólico",
    opening:
      "Em uma consulta de rotina, uma pessoa de 52 anos traz uma glicemia de jejum elevada e relata nunca ter feito acompanhamento para diabetes.",
    hypotheses:
      "Quais dados faltam para interpretar a medida? Diferencie hipótese diagnóstica, confirmação e avaliação de risco.",
    clue: "A coleta foi feita em laboratório. O resultado anterior, de outra data, também foi elevado. A pessoa relata histórico familiar de doença cardiovascular.",
    objectives:
      "Compare o papel da glicemia de jejum e da hemoglobina glicada. Identifique quais informações ajudam a estimar o risco cardiorrenal.",
    synthesis:
      "Valores, condições de coleta e critérios vigentes são necessários para interpretar ambos os resultados. A avaliação cardiorrenal orienta o seguimento além da glicemia.",
    topic: "diabetes-2",
    review: "clinica",
  },
  {
    id: "febre-comunidade",
    title: "Febre na mesma comunidade",
    area: "Infectologia e Saúde Coletiva",
    opening:
      "Uma unidade de saúde observa vários casos de febre e dor no corpo no mesmo bairro durante uma semana.",
    hypotheses:
      "Separe hipóteses para a pessoa atendida de hipóteses sobre o agrupamento no território. Que informação ajudaria a investigar cada nível?",
    clue: "Duas pessoas vivem na mesma rua. Uma relata piora do bem-estar depois de a febre ceder. O mapa local mostra aumento recente de notificações de dengue.",
    objectives:
      "Relacione sintomas ao dia de doença, revise as categorias de risco do manual oficial e explique como incidência e notificação ajudam a acompanhar o território.",
    synthesis:
      "A vigilância territorial ajuda a levantar hipóteses. O risco individual exige avaliação própria, inclusive na transição para a fase sem febre. O manual do Ministério da Saúde organiza essa avaliação.",
    topic: "dengue",
    review: "coletiva",
  },
  {
    id: "pre-natal",
    title: "Uma mudança no pré-natal",
    area: "Ginecologia e Obstetrícia",
    opening:
      "Uma gestante que iniciou o pré-natal na atenção primária retorna com resultados de exames e relata que a gestação anterior terminou prematuramente.",
    hypotheses:
      "Liste aspectos da história anterior que ajudariam a definir o risco atual. Quais informações você precisa confirmar com a pessoa e no prontuário fictício?",
    clue: "O encaminhamento anterior foi feito para outra unidade e a gestante ainda aguarda retorno. A equipe atual identifica lacunas no registro da avaliação sobre aquela gestação.",
    objectives:
      "Estude a avaliação dinâmica de risco, a continuidade do pré-natal e o papel da comunicação entre atenção primária e especializada.",
    synthesis:
      "História obstétrica e dados da gestação atual orientam a avaliação de risco. O registro compartilhado e a comunicação entre unidades ajudam a manter o acompanhamento durante o encaminhamento.",
    topic: "pre-natal",
    review: "obstetricia",
  },
];
