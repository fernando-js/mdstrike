export const teaSources = {
  edital: [
    "Edital TEA 2026 · SBA/AMB",
    "https://www.sbahq.org/wp-content/uploads/2025/02/Edital-TEA-2026-3.pdf#page=15",
  ],
  airway: [
    "Via aérea fisiologicamente difícil · WFSA",
    "https://resources.wfsahq.org/atotw/the-physiologically-difficult-airway/",
  ],
  puma: [
    "Consenso PUMA sobre intubação esofágica",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC9804892/",
  ],
  ventilation: [
    "Fundamentos de ventilação mecânica · WFSA",
    "https://resources.wfsahq.org/atotw/basics-of-mechanical-ventilation-atotw-471/",
  ],
  monitoring: [
    "Padrões de monitorização na anestesia e recuperação · Association of Anaesthetists",
    "https://doi.org/10.1111/anae.15501",
  ],
  volatiles: [
    "Farmacologia dos anestésicos inalatórios · WFSA",
    "https://resources.wfsahq.org/wp-content/uploads/uia-24-2-Pharmacology-of-Inhalational-Anaesthetics.pdf",
  ],
  propofol: [
    "Propofol · Informação de prescrição no DailyMed",
    "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7b9599e0-5bad-742d-e053-2991aa0aee97",
  ],
  neuromuscular: [
    "Monitorização e reversão do bloqueio neuromuscular · ASA",
    "https://doi.org/10.1097/ALN.0000000000004379",
  ],
  local: [
    "Farmacologia dos anestésicos locais em português · WFSA",
    "https://resources.wfsahq.org/atotw/tutorial-de-anestesia-da-semana-farmacologia-dos-anestesicos-locais/",
  ],
  spinal: [
    "Dispersão da anestesia subaracnóidea · WFSA",
    "https://resources.wfsahq.org/atotw/spinal-anaesthetic-spread-anaesthesia-tutorial-of-the-week-37/",
  ],
  neuraxial: [
    "Ultrassom para anestesia do neuroeixo · WFSA",
    "https://resources.wfsahq.org/atotw/ultrasound-guided-neuraxial-anaesthesia/",
  ],
  peripheral: [
    "Bloqueios de nervos periféricos · WFSA",
    "https://resources.wfsahq.org/atotw/peripheral-nerve-blocks-getting-started/",
  ],
  headache: [
    "Cefaleia pós-punção dural · WFSA",
    "https://resources.wfsahq.org/atotw/an-update-on-effective-management-of-the-postdural-puncture-headache/",
  ],
  toxicity: [
    "Checklist de toxicidade sistêmica por anestésico local · ASRA",
    "https://rapm.bmj.com/content/46/1/81",
  ],
  hyperthermia: [
    "Reconhecimento da hipertermia maligna · EMHG",
    "https://www.emhg.org/recommendations-1/2024/11/4/recognising-and-managing-a-malignant-hyperthermia-crisis-v2024",
  ],
  hypothermia: [
    "Hipotermia perioperatória · WFSA",
    "https://resources.wfsahq.org/atotw/perioperative-hypothermia-prevention-and-management-tutorial-of-the-week-number-117/",
  ],
  ponv: [
    "Consenso sobre náuseas e vômitos pós-operatórios",
    "https://doi.org/10.1213/ANE.0000000000007816",
  ],
};

export const teaLibrary = [
  teaSources.edital,
  ["Programa teórico · SBA", "https://www.sbahq.org/programa-tea/"],
  [
    "Tutoriais em português · SBA/WFSA",
    "https://www.sbahq.org/estrutural/tutoriais-wfsa/",
  ],
  [
    "Avaliação ME2 2026 com enunciados e respostas · SBA",
    "https://www.sbahq.org/wp-content/uploads/2026/06/ME2-1o-Quadri-gabarito.pdf",
  ],
  [
    "Avaliação ME3 2026 com enunciados e respostas · SBA",
    "https://www.sbahq.org/wp-content/uploads/2026/06/ME3-1o-Quadri-gabarito.pdf",
  ],
  [
    "Gabarito da 1ª fase do TEA 2023 · SBA",
    "https://www.sbahq.org/gabarito-1a-fase-tea-2023/",
  ],
];

const question = (
  id,
  point,
  source,
  prompt,
  correct,
  alternatives,
  explanation,
) => ({ id, point, source, prompt, correct, alternatives, explanation });

export const teaMissions = [
  {
    id: "via-aerea",
    title: "Via aérea e ventilação",
    description:
      "Interprete capnografia, mecânica respiratória e sinais de falha ventilatória.",
    icon: "mask",
    questions: [
      question(
        "va-preox",
        5,
        "airway",
        "Qual é a finalidade fisiológica da pré-oxigenação antes de um período de apneia?",
        "Aumentar a reserva pulmonar de oxigênio por denitrogenação.",
        [
          "Aumentar a produção de CO₂ para estimular a ventilação.",
          "Aumentar a quantidade de nitrogênio nos alvéolos.",
          "Substituir a ventilação durante todo o período de apneia.",
        ],
        "Substituir parte do nitrogênio alveolar por oxigênio aumenta a reserva disponível e pode retardar a dessaturação durante a apneia.",
      ),
      question(
        "va-puma",
        5,
        "puma",
        "Após intubação e início da ventilação, qual achado fornece evidência de ventilação alveolar pelo tubo?",
        "CO₂ expirado sustentado ao longo de várias ventilações.",
        [
          "Um único pico transitório de CO₂.",
          "Saturação periférica estável logo após a pré-oxigenação.",
          "Condensação na parede do tubo.",
        ],
        "Um capnograma com CO₂ expirado sustentado é a evidência objetiva procurada. Condensação, saturação inicial e picos transitórios isolados podem induzir a erro.",
      ),
      question(
        "va-pico",
        52,
        "ventilation",
        "Em ventilação controlada a volume e com fluxo constante, a pressão de pico sobe enquanto a pressão de platô fica estável. Qual mudança explica melhor essa diferença?",
        "Aumento da resistência das vias aéreas.",
        [
          "Queda isolada da complacência do sistema respiratório.",
          "Aumento da pressão alveolar estática ao fim da inspiração.",
          "Redução da resistência do tubo traqueal.",
        ],
        "A pressão de pico inclui a pressão necessária para vencer a resistência enquanto há fluxo. A pressão de platô é medida durante uma pausa sem fluxo.",
      ),
      question(
        "va-plat",
        52,
        "ventilation",
        "Como obter uma pressão de platô interpretável na ventilação invasiva controlada?",
        "Medir a pressão durante uma pausa inspiratória sem fluxo, sem esforço do paciente.",
        [
          "Usar o maior valor registrado no início da inspiração.",
          "Medir a pressão imediatamente após desconectar o circuito.",
          "Ler a pressão logo antes do início da expiração forçada pelo paciente.",
        ],
        "A pausa inspiratória permite estimar a pressão alveolar estática quando não há fluxo nem esforço respiratório que altere a medida.",
      ),
      question(
        "va-peep",
        52,
        "ventilation",
        "Na curva fluxo-tempo, o fluxo expiratório ainda não voltou a zero quando começa a inspiração seguinte. O que esse padrão sugere?",
        "Esvaziamento expiratório incompleto, com risco de auto-PEEP.",
        [
          "Ausência de qualquer resistência expiratória.",
          "Pressão de platô igual a zero.",
          "Expiração completa em todos os ciclos.",
        ],
        "O ciclo seguinte começa antes que a expiração termine. Isso favorece o aprisionamento de gás e a pressão positiva intrínseca ao fim da expiração.",
      ),
      question(
        "va-predito",
        52,
        "ventilation",
        "Para dimensionar o volume corrente em um adulto com obesidade, qual referência se aproxima melhor do tamanho pulmonar?",
        "Peso predito a partir da altura e do sexo.",
        [
          "Peso corporal total aferido na balança.",
          "Índice de massa corporal usado diretamente como volume.",
          "Massa de tecido adiposo estimada.",
        ],
        "O peso predito estima o tamanho pulmonar de forma mais apropriada em adultos. O peso total pode superestimar o volume corrente quando há obesidade.",
      ),
      question(
        "va-minuto",
        10,
        "ventilation",
        "Se ventilação-minuto é volume corrente multiplicado pela frequência respiratória, qual é o valor para 450 mL e 12 incursões por minuto?",
        "5,4 L/min.",
        ["0,54 L/min.", "3,75 L/min.", "12 L/min."],
        "450 mL × 12 corresponde a 5.400 mL/min. A ventilação alveolar é menor porque parte de cada volume corrente ventila o espaço morto.",
      ),
      question(
        "va-vq",
        10,
        "ventilation",
        "Em uma região pulmonar ventilada, mas sem perfusão, o que a unidade representa?",
        "Espaço morto alveolar.",
        [
          "Shunt intrapulmonar.",
          "Unidade com baixa relação ventilação-perfusão.",
          "Superfície com troca gasosa preservada.",
        ],
        "Há ventilação sem fluxo sanguíneo para participar das trocas. No extremo oposto, o shunt tem perfusão sem ventilação.",
      ),
      question(
        "va-desconexao",
        21,
        "monitoring",
        "Durante ventilação controlada, a pressão de via aérea cai abruptamente e o capnograma desaparece no mesmo ciclo. Qual falha é compatível com os dois achados?",
        "Desconexão do circuito respiratório.",
        [
          "Artefato apenas no sensor de oximetria.",
          "Elevação isolada da produção metabólica de CO₂.",
          "Aumento isolado da resistência do tubo.",
        ],
        "Uma desconexão pode reduzir a pressão e impedir que gás expirado chegue ao capnógrafo. Alterações combinadas ajudam a distinguir uma falha ventilatória de um problema isolado do sensor.",
      ),
      question(
        "va-fisio",
        5,
        "airway",
        "Qual achado caracteriza uma via aérea fisiologicamente difícil mesmo quando se prevê boa visualização da glote?",
        "Hipoxemia importante antes da indução.",
        [
          "Visão ampla da glote à laringoscopia.",
          "Boa abertura oral e mobilidade cervical.",
          "Conexão frouxa do cabo do monitor.",
        ],
        "Uma reserva fisiológica baixa pode causar deterioração durante a abordagem. A facilidade anatômica prevista não elimina esse risco.",
      ),
    ],
  },
  {
    id: "monitorizacao",
    title: "Monitorização e farmacologia",
    description:
      "Relacione o que aparece no monitor aos efeitos dos anestésicos.",
    icon: "heart",
    questions: [
      question(
        "mf-oximetria",
        21,
        "monitoring",
        "Em sedação sob oxigênio suplementar, qual interpretação é correta para uma SpO₂ de 99%?",
        "A saturação informa sobre oxigenação e pode permanecer alta durante hipoventilação.",
        [
          "A saturação exclui retenção de CO₂.",
          "A leitura mede diretamente a ventilação alveolar.",
          "A leitura confirma que o paciente mantém resposta a comandos.",
        ],
        "A oximetria estima a saturação arterial periférica. Sob oxigênio suplementar, ela pode demorar a revelar hipoventilação. A capnografia oferece informação sobre ventilação.",
      ),
      question(
        "mf-tof",
        15,
        "neuromuscular",
        "Qual razão T4/T1, medida quantitativamente no adutor do polegar, a diretriz da ASA recomenda confirmar antes da extubação após bloqueador neuromuscular?",
        "Pelo menos 0,90.",
        [
          "Pelo menos 0,40.",
          "Pelo menos 0,60.",
          "Qualquer valor, se quatro contrações forem visíveis.",
        ],
        "A diretriz recomenda comprovar razão TOF de pelo menos 0,90. Observar quatro respostas qualitativamente não demonstra que a razão atingiu esse valor.",
      ),
      question(
        "mf-razao",
        15,
        "neuromuscular",
        "Na sequência de quatro estímulos (TOF), o que expressa a razão T4/T1?",
        "Amplitude da quarta resposta dividida pela amplitude da primeira.",
        [
          "Número total de respostas dividido por quatro.",
          "Tempo entre o quarto e o primeiro estímulo.",
          "Amplitude da primeira resposta dividida pela quarta.",
        ],
        "A razão compara a quarta resposta muscular à primeira e quantifica o grau de redução das respostas sucessivas.",
      ),
      question(
        "mf-sugamadex",
        15,
        "neuromuscular",
        "Qual bloqueador neuromuscular é compatível com reversão por sugamadex?",
        "Rocurônio.",
        ["Succinilcolina.", "Cisatracúrio.", "Atracúrio."],
        "O sugamadex forma complexos com rocurônio e vecurônio. Atracúrio, cisatracúrio e succinilcolina têm outros mecanismos de término do efeito.",
      ),
      question(
        "mf-cam",
        13,
        "volatiles",
        "Qual resposta é usada na definição clássica da concentração alveolar mínima (CAM)?",
        "Ausência de movimento à incisão em 50% dos indivíduos.",
        [
          "Ausência de lembrança em 50% dos indivíduos.",
          "Redução de 50% da pressão arterial média.",
          "Ausência de resposta pupilar em todos os indivíduos.",
        ],
        "A CAM expressa a potência dos anestésicos inalatórios usando a imobilidade frente a um estímulo cirúrgico como desfecho definido.",
      ),
      question(
        "mf-solubilidade",
        13,
        "volatiles",
        "Em condições comparáveis, qual efeito se espera de um menor coeficiente de partição sangue/gás de um anestésico volátil?",
        "A concentração alveolar acompanha mais rapidamente as mudanças na concentração inspirada.",
        [
          "A concentração alveolar se aproxima mais lentamente da inspirada.",
          "O anestésico fica mais solúvel no sangue.",
          "A CAM obrigatoriamente aumenta.",
        ],
        "Quanto menor a solubilidade no sangue, menor a captação necessária para elevar a pressão parcial. A solubilidade influencia a velocidade, enquanto a CAM expressa potência.",
      ),
      question(
        "mf-propofol",
        12,
        "propofol",
        "Após indução com propofol, qual combinação de efeitos imediatos é reconhecida?",
        "Hipotensão e apneia.",
        [
          "Hipertensão persistente e broncodilatação como regra.",
          "Aumento sustentado do impulso ventilatório e taquicardia obrigatória.",
          "Bloqueio neuromuscular profundo e analgesia cirúrgica.",
        ],
        "Propofol pode reduzir a pressão arterial e deprimir a ventilação, particularmente na indução. É um hipnótico intravenoso, sem função de bloqueador neuromuscular.",
      ),
      question(
        "mf-capno",
        21,
        "monitoring",
        "Qual grandeza o valor de EtCO₂ representa em um capnograma?",
        "CO₂ no fim da expiração.",
        [
          "CO₂ arterial medido por gasometria.",
          "Fração inspirada de oxigênio.",
          "Pressão de via aérea durante a pausa inspiratória.",
        ],
        "EtCO₂ é a medida de CO₂ ao fim da expiração. É influenciado por ventilação, perfusão e produção de CO₂ e pode diferir do CO₂ arterial.",
      ),
      question(
        "mf-o2",
        21,
        "monitoring",
        "O oxímetro mostra queda da saturação com onda pletismográfica irregular logo após o braço se movimentar. Qual informação ajuda a avaliar a confiabilidade da leitura?",
        "Qualidade do sinal e concordância do pulso exibido com outra medida da frequência cardíaca.",
        [
          "O número da saturação isolado.",
          "Somente a pressão arterial medida antes da movimentação.",
          "A temperatura do circuito anestésico.",
        ],
        "Movimento e perfusão periférica ruim podem prejudicar o sinal. Conferir a onda e comparar frequências ajuda a verificar a medida enquanto se avalia o paciente.",
      ),
      question(
        "mf-calor",
        21,
        "monitoring",
        "Qual alternativa contém uma medida diretamente relacionada à temperatura central durante a anestesia?",
        "Temperatura medida com sonda esofágica em posição adequada.",
        [
          "Temperatura do ambiente cirúrgico.",
          "Pressão arterial do manguito no braço.",
          "Temperatura da superfície do campo cirúrgico.",
        ],
        "A medida esofágica adequadamente posicionada pode estimar a temperatura central. O ambiente e a superfície exposta podem apresentar temperaturas bem diferentes.",
      ),
    ],
  },
  {
    id: "regional",
    title: "Neuroeixo e bloqueios",
    description:
      "Revise anatomia, dispersão no líquor, ultrassom e anestésicos locais.",
    icon: "layers",
    questions: [
      question(
        "rb-intratecal",
        17,
        "neuraxial",
        "Em relação à dura-máter, onde é depositada a solução na anestesia subaracnóidea?",
        "No espaço subaracnóideo, em contato com o líquor.",
        [
          "No espaço peridural, fora da dura-máter.",
          "No disco intervertebral.",
          "Entre o ligamento amarelo e o processo espinhoso.",
        ],
        "A anestesia subaracnóidea deposita a solução no líquor. A técnica peridural deposita o anestésico no espaço externo à dura-máter.",
      ),
      question(
        "rb-peridural",
        17,
        "neuraxial",
        "Qual estrutura separa o espaço peridural do compartimento intratecal?",
        "A dura-máter e a aracnoide.",
        [
          "A pele e o tecido subcutâneo.",
          "O ligamento supraespinhoso sozinho.",
          "O corpo vertebral e o disco intervertebral.",
        ],
        "Da posição peridural até o líquor, há a dura-máter e a aracnoide. O espaço subaracnóideo encontra-se após essas membranas.",
      ),
      question(
        "rb-baricidade",
        17,
        "spinal",
        "Como se define a baricidade de uma solução intratecal?",
        "Relação entre a densidade da solução e a densidade do líquor à mesma temperatura.",
        [
          "Relação entre o pH da solução e o pH arterial.",
          "Relação entre o volume injetado e a dose em miligramas.",
          "Relação entre a pressão do líquor e a pressão atmosférica.",
        ],
        "Uma solução hiperbárica é mais densa que o líquor na mesma temperatura. Densidade relativa e posição do paciente influenciam sua distribuição.",
      ),
      question(
        "rb-posicao",
        17,
        "spinal",
        "Qual característica da solução hiperbárica tem implicação na distribuição após a injeção subaracnóidea?",
        "Tende a se deslocar para regiões dependentes da gravidade.",
        [
          "Tende a subir independentemente da posição do paciente.",
          "Permanece necessariamente no ponto de injeção.",
          "Distribui-se apenas de acordo com a pressão arterial.",
        ],
        "A solução hiperbárica se desloca em direção às regiões dependentes. A anatomia do canal e a posição influenciam quais regiões ficam dependentes.",
      ),
      question(
        "rb-sodio",
        14,
        "local",
        "Qual alvo explica o bloqueio da condução nervosa pelos anestésicos locais?",
        "Canais de sódio dependentes de voltagem.",
        [
          "Receptores opioides μ.",
          "Receptores nicotínicos da junção neuromuscular.",
          "Receptores GABA-A como mecanismo principal.",
        ],
        "O bloqueio de canais de sódio prejudica a propagação do potencial de ação ao longo da fibra nervosa.",
      ),
      question(
        "rb-ph",
        14,
        "local",
        "Para um anestésico local do tipo base fraca, o que ocorre com a fração não ionizada em meio mais ácido?",
        "Diminui.",
        [
          "Aumenta.",
          "Permanece fixa em 50%.",
          "Passa a depender apenas da ligação a proteínas.",
        ],
        "O meio ácido favorece a forma protonada. A forma não ionizada atravessa com mais facilidade a membrana lipídica.",
      ),
      question(
        "rb-ultrassom",
        17,
        "neuraxial",
        "Na ultrassonografia pré-procedimento do neuroeixo, qual informação pode orientar o planejamento?",
        "Identificação da linha média, do espaço intervertebral e estimativa de profundidade.",
        [
          "Confirmação de anticoagulação adequada para punção.",
          "Determinação da concentração do anestésico no líquor.",
          "Previsão exata do nível sensitivo após a injeção.",
        ],
        "O ultrassom ajuda a identificar referências anatômicas e estimar a profundidade. A estimativa pode variar com compressão dos tecidos e o trajeto da agulha.",
      ),
      question(
        "rb-plano",
        25,
        "peripheral",
        "Em uma abordagem no plano do ultrassom, como a agulha se relaciona com o feixe de imagem?",
        "O eixo da agulha acompanha o plano do feixe, permitindo visualizar haste e ponta quando bem alinhadas.",
        [
          "A agulha cruza perpendicularmente o plano e é vista do cabo à ponta.",
          "A ponta fica visível automaticamente, mesmo após sair do plano.",
          "O avanço só pode ser acompanhado com Doppler colorido.",
        ],
        "A visão longitudinal depende do alinhamento com o feixe. Perder a ponta da imagem exige recuperar a referência antes de interpretar sua posição.",
      ),
      question(
        "rb-dispersao",
        25,
        "peripheral",
        "Em um bloqueio periférico guiado por ultrassom, o que a imagem em tempo real acrescenta durante a injeção?",
        "Permite observar a dispersão da solução em relação ao nervo e aos planos anatômicos.",
        [
          "Confirma que o paciente ficará livre de complicações.",
          "Calcula automaticamente a dose total absorvida.",
          "Dispensa o acompanhamento da ponta da agulha.",
        ],
        "Além de localizar estruturas e acompanhar a ponta, o ultrassom pode mostrar a dispersão do líquido. A imagem é uma ferramenta de orientação e tem limitações.",
      ),
      question(
        "rb-cefaleia",
        17,
        "headache",
        "Depois de uma punção dural, qual padrão de cefaleia favorece a hipótese de cefaleia pós-punção?",
        "Piora ao sentar ou ficar em pé e melhora ao deitar.",
        [
          "Surge exclusivamente durante o sono e melhora ao levantar.",
          "Depende apenas da exposição a sons altos.",
          "Desaparece ao ficar em pé e piora sistematicamente ao deitar.",
        ],
        "A cefaleia pós-punção dural costuma ter componente postural. Esse padrão ajuda a levantar a hipótese, que deve ser considerada junto ao restante do quadro.",
      ),
    ],
  },
  {
    id: "recuperacao",
    title: "Complicações e recuperação",
    description:
      "Reconheça complicações e interprete os sinais na recuperação pós-anestésica.",
    icon: "shield",
    questions: [
      question(
        "cr-mh",
        18,
        "hyperthermia",
        "Durante anestesia com agente volátil, há aumento progressivo e inexplicado do EtCO₂, taquicardia e rigidez. Qual hipótese integra os achados?",
        "Hipertermia maligna.",
        [
          "Náusea isolada no pós-operatório.",
          "Hipotermia leve por exposição ambiental.",
          "Bloqueio neuromuscular residual isolado.",
        ],
        "Aumento desproporcional da produção de CO₂, taquicardia e rigidez sugerem uma crise hipermetabólica. Temperatura muito alta pode surgir mais tarde.",
      ),
      question(
        "cr-gatilho",
        18,
        "hyperthermia",
        "Qual par inclui dois agentes reconhecidos como gatilhos de hipertermia maligna?",
        "Sevoflurano e succinilcolina.",
        [
          "Propofol e rocurônio.",
          "Óxido nitroso e lidocaína.",
          "Midazolam e fentanil.",
        ],
        "Anestésicos voláteis halogenados e succinilcolina são gatilhos clássicos. A identificação da exposição ajuda na interpretação dos sinais.",
      ),
      question(
        "cr-last",
        18,
        "toxicity",
        "Logo após um bloqueio periférico, aparecem alteração neurológica aguda e uma arritmia. Qual complicação do anestésico local merece consideração imediata nesse contexto?",
        "Toxicidade sistêmica por anestésico local.",
        [
          "Cefaleia pós-punção dural.",
          "Náusea pós-operatória isolada.",
          "Hipotermia por redistribuição térmica.",
        ],
        "A toxicidade sistêmica pode ter manifestações neurológicas e cardiovasculares. A proximidade temporal com a injeção reforça a suspeita no cenário descrito.",
      ),
      question(
        "cr-vt",
        19,
        "monitoring",
        "Na unidade de recuperação, um paciente em oxigênio suplementar mantém SpO₂ de 98%, mas fica muito sonolento e passa a fazer pausas respiratórias. Qual variável ajuda a reconhecer essa alteração?",
        "Ventilação acompanhada por observação e capnografia, quando disponível.",
        [
          "Apenas a saturação atual.",
          "Pressão arterial isolada.",
          "Temperatura da sala.",
        ],
        "A saturação pode permanecer alta enquanto o paciente hipoventila sob oxigênio. Observação respiratória e capnografia ajudam a reconhecer pausas e alterações ventilatórias.",
      ),
      question(
        "cr-bnm",
        19,
        "neuromuscular",
        "Na recuperação, um paciente apresenta fraqueza após uso de rocurônio e razão T4/T1 de 0,62. Como interpretar a medida?",
        "É compatível com bloqueio neuromuscular residual.",
        [
          "Comprova recuperação neuromuscular adequada.",
          "Mede principalmente a intensidade da dor.",
          "Comprova que a ventilação alveolar é adequada.",
        ],
        "A razão de 0,62 está abaixo do limiar de recuperação usado na monitorização quantitativa. O achado ajuda a explicar fraqueza no cenário.",
      ),
      question(
        "cr-hipo",
        44,
        "hypothermia",
        "Qual mecanismo contribui para a queda inicial da temperatura central após indução de anestesia geral?",
        "Redistribuição de calor do compartimento central para tecidos periféricos.",
        [
          "Aumento imediato da produção de calor por tremores.",
          "Transferência inicial de calor dos membros para o compartimento central.",
          "Aumento da temperatura central acompanhado de queda da temperatura periférica.",
        ],
        "A alteração da termorregulação e a vasodilatação favorecem o fluxo de calor do centro para a periferia. Isso ajuda a explicar a queda inicial da temperatura central.",
      ),
      question(
        "cr-tremor",
        44,
        "hypothermia",
        "Qual efeito fisiológico pode acompanhar tremores pós-anestésicos importantes?",
        "Elevação do consumo de oxigênio.",
        [
          "Diminuição sustentada da demanda metabólica.",
          "Desaparecimento da produção de CO₂.",
          "Redução do trabalho muscular.",
        ],
        "A contração muscular repetitiva aumenta a demanda metabólica e o consumo de oxigênio. O tremor também pode dificultar a leitura de monitores.",
      ),
      question(
        "cr-ponv",
        19,
        "ponv",
        "Em um adulto, qual história pessoal é um fator reconhecido de risco para náuseas e vômitos pós-operatórios?",
        "Episódios prévios de náuseas e vômitos pós-operatórios ou cinetose.",
        [
          "Uso habitual de óculos.",
          "Apendicectomia antiga sem intercorrências.",
          "Alergia de contato isolada a bijuteria.",
        ],
        "História de episódios prévios ou cinetose compõe modelos clínicos de risco. A informação pode ser identificada ainda na avaliação pré-operatória.",
      ),
      question(
        "cr-alta",
        19,
        "monitoring",
        "Qual situação indica necessidade de reavaliar a prontidão para alta da unidade de recuperação, mesmo com pressão arterial estável?",
        "Episódios repetidos de obstrução respiratória quando o paciente adormece.",
        [
          "Conforto respiratório com sinais estáveis.",
          "Nível de consciência compatível com o basal.",
          "Ventilação espontânea adequada e sustentada.",
        ],
        "Estabilidade circulatória isolada não garante recuperação. Obstruções repetidas indicam que a ventilação e a capacidade de manter a via aérea ainda precisam ser avaliadas.",
      ),
      question(
        "cr-capno-sinal",
        19,
        "monitoring",
        "Em um paciente que respira espontaneamente na recuperação, que informação o traçado capnográfico pode revelar antes de uma queda da SpO₂?",
        "Pausas ventilatórias e alterações do padrão respiratório.",
        [
          "A concentração sanguínea de anestésico local.",
          "A intensidade subjetiva da dor.",
          "A temperatura central exata.",
        ],
        "A onda de CO₂ expirado acompanha os ciclos ventilatórios. A oximetria acompanha a oxigenação e a dessaturação pode aparecer depois, sobretudo com oxigênio suplementar.",
      ),
    ],
  },
];

export const teaCases = [
  {
    id: "capnograma",
    title: "Capnograma ausente",
    description: "Via aérea · pontos 5 e 21",
    source: "puma",
    steps: [
      {
        scenario:
          "Após a indução para uma cirurgia eletiva, iniciou-se ventilação pelo tubo. Há condensação no tubo e a SpO₂ permanece em 99%, mas não aparece CO₂ expirado sustentado.",
        prompt:
          "Que complicação importante ainda precisa ser excluída? Cite o achado que torna essa hipótese relevante.",
        feedback:
          "A posição esofágica do tubo precisa ser excluída. Falta a evidência de CO₂ expirado sustentado. A saturação inicial pode refletir a pré-oxigenação, e a condensação no tubo pode ocorrer mesmo com posição incorreta.",
      },
      {
        scenario:
          "A equipe restabelece a ventilação e passa a observar uma onda de CO₂ de forma consistente, por várias ventilações consecutivas.",
        prompt:
          "Qual é o valor desse novo achado? Que detalhe do posicionamento do tubo ele não determina?",
        feedback:
          "O CO₂ expirado sustentado fornece evidência de ventilação alveolar. A capnografia, sozinha, não determina a profundidade do tubo nem exclui intubação seletiva.",
      },
    ],
  },
  {
    id: "recuperacao-forca",
    title: "Fraqueza na recuperação",
    description: "Bloqueio neuromuscular · pontos 15 e 19",
    source: "neuromuscular",
    steps: [
      {
        scenario:
          "Na recuperação, uma paciente que recebeu rocurônio está desperta, mas apresenta tosse fraca. A avaliação qualitativa mostra quatro respostas ao estímulo.",
        prompt:
          "Por que a presença de quatro respostas ainda não comprova recuperação adequada?",
        feedback:
          "A contagem identifica que há quatro respostas, mas não mede quanto a quarta se reduziu em relação à primeira. Para isso, use a razão TOF quantitativa no local de monitorização recomendado.",
      },
      {
        scenario:
          "O monitor quantitativo no adutor do polegar mostra razão T4/T1 de 0,67.",
        prompt:
          "Interprete esse valor e indique o limiar de recuperação recomendado pela ASA antes da extubação.",
        feedback:
          "A razão de 0,67 é compatível com bloqueio neuromuscular residual. A recomendação é confirmar uma razão quantitativa de pelo menos 0,90 no adutor do polegar antes da extubação.",
      },
    ],
  },
  {
    id: "co2-em-alta",
    title: "CO₂ em alta no intraoperatório",
    description: "Complicações anestésicas · ponto 18",
    source: "hyperthermia",
    steps: [
      {
        scenario:
          "Sob anestesia com sevoflurano, o EtCO₂ sobe de forma progressiva apesar do aumento da ventilação-minuto. Surge taquicardia sem explicação aparente.",
        prompt:
          "Qual hipótese relacionada ao agente anestésico merece atenção? Que dado do caso favorece essa hipótese?",
        feedback:
          "Hipertermia maligna é uma hipótese importante. A elevação de EtCO₂ apesar do aumento da ventilação é compatível com aumento da produção de CO₂, e ocorreu na presença de um agente desencadeante.",
      },
      {
        scenario:
          "A equipe confirma rigidez muscular. A temperatura medida ainda não está acima do normal.",
        prompt:
          "Como o novo achado altera a suspeita? Explique o valor da temperatura nesse momento.",
        feedback:
          "A rigidez, associada ao EtCO₂ crescente e à taquicardia, reforça a suspeita. Temperatura inicialmente normal não exclui a crise, pois a elevação pode ser mais tardia.",
      },
    ],
  },
];
