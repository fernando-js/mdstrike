export const ecgSources = {
  sbc: [
    "SBC · Diretriz de análise e emissão de laudos de ECG (2022), com errata",
    "https://www.scielo.br/j/abc/a/4QcQvX3T6kZBjNQLzrt5cXj/",
  ],
  chest: [
    "SBC · Diretriz Brasileira de Atendimento à Dor Torácica (2025)",
    "https://doi.org/10.36660/abc.20250620",
  ],
  ufmg: [
    "UFMG · Propedêutica cardiovascular na atenção básica",
    "https://www.nescon.medicina.ufmg.br/biblioteca/imagem/propedeutica-cardiovascular-atencao-basica.pdf",
  ],
  electrodes: [
    "Telessaúde MS · Posicionamento dos eletrodos",
    "https://telessaude.saude.ms.gov.br/tele-ecg/",
  ],
  physionet: [
    "Wagner e colegas · PTB-XL v1.0.3",
    "https://physionet.org/content/ptb-xl/1.0.3/",
  ],
};

export const readingSteps = [
  "Confira a qualidade do registro, as derivações, a velocidade e o ganho.",
  "Estime a frequência e examine a regularidade e a origem do ritmo.",
  "Inspecione a onda P, o intervalo PR e a relação entre P e QRS.",
  "Avalie o eixo do QRS, a duração e a morfologia do complexo ventricular.",
  "Examine ST, onda T e QT. Sintetize os achados e considere o contexto clínico.",
];

const question = (id, trace, prompt, options, answer, explanation, source) => ({
  id,
  trace,
  prompt,
  options,
  answer,
  explanation,
  source,
});

export const ecgLessons = [
  {
    id: "qualidade",
    minutes: 10,
    title: "O traçado é confiável?",
    intro:
      "Comece pelo registro. O mesmo coração pode parecer diferente quando mudam a velocidade, a escala vertical ou a posição dos eletrodos.",
    points: [
      "O ECG convencional usa dez eletrodos para obter 12 derivações. As seis derivações dos membros observam o plano frontal. V1 a V6 observam o plano horizontal.",
      "V1 e V2 ficam no quarto espaço intercostal, junto ao esterno, à direita e à esquerda, respectivamente. V4 fica no quinto espaço intercostal esquerdo na linha médio-clavicular. V3 fica entre V2 e V4. V5 e V6 seguem a altura de V4 nas linhas axilares anterior e média.",
      "A 25 mm/s, cada quadrado pequeno representa 40 ms. Com ganho de 10 mm/mV, um quadrado pequeno de altura equivale a 0,1 mV. Leia os ajustes do registro antes de medir.",
      "Tremor e mau contato podem alterar a linha de base. Compare derivações e observe se ainda há complexos reconhecíveis em intervalos regulares.",
    ],
    exercise: question(
      "qualidade-aula",
      "tremor",
      "Há uma oscilação rápida entre os complexos, mas os QRS aparecem em intervalos regulares. O que deve vir primeiro?",
      [
        "Medir o eixo sem verificar a qualidade",
        "Conferir o registro e considerar artefato",
        "Concluir fibrilação atrial pela linha de base",
        "Identificar isquemia pelo aspecto da linha de base",
      ],
      1,
      "A oscilação rápida da linha de base pode ser um artefato. Os QRS regulares são uma pista para revisar a qualidade e comparar derivações antes de interpretar o ritmo.",
      "sbc",
    ),
    sources: ["sbc", "electrodes", "ufmg"],
  },
  {
    id: "ritmo",
    minutes: 12,
    title: "Frequência e ritmo",
    intro:
      "Separe duas perguntas. Quantos batimentos ocorrem por minuto? De onde parece partir a ativação?",
    points: [
      "Em ritmo regular, divida 60 pela duração do intervalo R–R em segundos. A 25 mm/s, o atalho é dividir 300 pelo número de quadrados grandes entre duas ondas R.",
      "Se o ritmo for irregular, estime a frequência média em um trecho de duração conhecida. Em 10 segundos, multiplique por seis a contagem de complexos QRS.",
      "Para avaliar origem sinusal, procure ondas P com morfologia e polaridade compatíveis, especialmente em D1 e D2, e descreva sua relação com cada QRS. Avalie o PR e a regularidade em seguida.",
    ],
    exercise: question(
      "ritmo-aula",
      "ritmo-75",
      "O ritmo é regular. No traçado de 25 mm/s, há quatro quadrados grandes entre dois picos de R. Qual é a frequência?",
      ["60 bpm", "75 bpm", "100 bpm", "125 bpm"],
      1,
      "Quatro quadrados grandes equivalem a 0,8 s. Assim, 60 ÷ 0,8 = 75 bpm. O atalho 300 ÷ 4 dá o mesmo valor.",
      "ufmg",
    ),
    sources: ["sbc", "ufmg"],
  },
  {
    id: "medidas",
    minutes: 12,
    title: "Ondas, intervalos e eixo",
    intro:
      "Meça sempre a partir de referências anatômicas no próprio traçado. A ampliação ajuda a encontrar o início e o fim de cada evento.",
    points: [
      "A onda P representa a despolarização atrial. O PR vai do início de P ao início do QRS. O QRS representa a despolarização ventricular.",
      "A onda T integra a repolarização ventricular. O QT vai do início do QRS ao fim de T e varia com a frequência. Em uma leitura completa, registre a fórmula usada ao apresentar QT corrigido.",
      "Para triagem do eixo frontal de QRS, observe a polaridade líquida em D1 e aVF. Se D1 for positivo e aVF negativo, D2 ajuda a refinar a classificação. A análise definitiva exige o conjunto das derivações.",
    ],
    exercise: question(
      "medidas-aula",
      "pr-160",
      "Do início da onda P ao início do QRS há quatro quadrados pequenos em 25 mm/s. Qual intervalo foi medido e quanto ele dura?",
      ["QT de 160 ms", "PR de 80 ms", "PR de 160 ms", "QRS de 200 ms"],
      2,
      "A distância entre o início de P e o início do QRS define o PR. Quatro quadrados pequenos de 40 ms somam 160 ms.",
      "sbc",
    ),
    sources: ["sbc", "ufmg"],
  },
  {
    id: "arritmias",
    minutes: 12,
    title: "Arritmias e bloqueios",
    intro:
      "Olhe o padrão ao longo de vários batimentos. O intervalo entre dois complexos raramente descreve o ritmo inteiro.",
    points: [
      "Na fibrilação atrial típica, os intervalos R–R são irregularmente irregulares e faltam ondas P discretas repetíveis. Artefatos e outros ritmos também podem parecer irregulares.",
      "Na extrassístole ventricular, procure um batimento prematuro com QRS de morfologia diferente, em geral largo, e examine a relação com a ativação atrial.",
      "No bloqueio AV de primeiro grau, todos os impulsos atriais são conduzidos, com PR prolongado. Em Mobitz I clássico, o PR prolonga progressivamente até uma onda P que não conduz.",
    ],
    exercise: question(
      "arritmias-aula",
      "real-fa",
      "O registro tem R–R irregularmente irregulares e não mostra onda P discreta que se repita antes dos QRS. Qual hipótese eletrocardiográfica é mais compatível?",
      [
        "Ritmo sinusal regular",
        "Bloqueio AV de primeiro grau",
        "Fibrilação atrial",
        "Ritmo ventricular regularmente espaçado",
      ],
      2,
      "A irregularidade sem padrão e a ausência de P organizadas favorecem fibrilação atrial. Compare derivações e descarte artefato em uma avaliação real.",
      "sbc",
    ),
    sources: ["sbc", "physionet"],
  },
  {
    id: "repolarizacao",
    minutes: 12,
    title: "ST, onda T e dor torácica",
    intro:
      "Avalie a repolarização por grupos de derivações. Depois, interprete os achados à luz dos sintomas e dos exames seriados.",
    points: [
      "Identifique o ponto J na transição entre QRS e ST e compare sua posição com uma linha de base adequada.",
      "Procure alterações de ST e T em derivações contíguas. Os critérios de elevação de ST variam por derivação e, em V2–V3, também conforme sexo e idade.",
      "Elevação de ST tem mais de uma causa. Em suspeita de síndrome coronariana aguda, um ECG inicial sem alterações diagnósticas exige correlação clínica e reavaliação conforme o protocolo.",
    ],
    exercise: question(
      "st-aula",
      "st-inferior",
      "Nos trechos simulados de D2, D3 e aVF, o ST está acima da linha de base. Qual descrição é a mais precisa?",
      [
        "Alteração de ST em derivações inferiores contíguas",
        "Alteração isolada de aVR",
        "Aumento de PR em derivações anteriores",
        "Frequência baixa com QRS ausentes",
      ],
      0,
      "D2, D3 e aVF observam a parede inferior. Registre as derivações envolvidas e avalie o significado junto ao contexto, aos critérios e às demais derivações.",
      "chest",
    ),
    sources: ["sbc", "chest"],
  },
  {
    id: "leitura",
    minutes: 12,
    title: "Leitura completa",
    intro:
      "Use a mesma ordem para todos os traçados. Primeiro descreva o que é observável. Depois formule a síntese.",
    points: readingSteps,
    exercise: question(
      "leitura-aula",
      "real-sinusal",
      "No conjunto das 12 derivações, qual sequência organiza melhor uma leitura descritiva?",
      [
        "Começar pelo diagnóstico automático e copiar o restante",
        "Descrever só o segmento ST e o QT",
        "Ler D2 e concluir sem revisar as demais derivações",
        "Verificar qualidade, ritmo, frequência, condução, eixo e repolarização",
      ],
      3,
      "A sequência reduz omissões e permite separar medidas observadas da conclusão. Mude a derivação e compare o que você consegue descrever sem depender do texto do aparelho.",
      "sbc",
    ),
    sources: ["sbc", "physionet"],
  },
];

export const ecgChallenge = [
  question(
    "final-escala",
    "ganho-5",
    "A calibração indicada é 5 mm/mV. Uma deflexão mede 5 mm de altura. Qual é a amplitude?",
    ["0,25 mV", "0,5 mV", "1 mV", "5 mV"],
    2,
    "Divida a altura pelo ganho. Uma deflexão de 5 mm em um registro de 5 mm/mV corresponde a 1 mV.",
    "sbc",
  ),
  question(
    "final-frequencia",
    "ritmo-60",
    "Em um ritmo regular a 25 mm/s, o intervalo R–R ocupa cinco quadrados grandes. Qual é a frequência?",
    ["50 bpm", "60 bpm", "75 bpm", "100 bpm"],
    1,
    "Cinco quadrados grandes somam 1 s. O atalho de dividir 300 por 5 também resulta em 60 bpm.",
    "ufmg",
  ),
  question(
    "final-eixo",
    "eixo",
    "O QRS tem polaridade líquida positiva em D1 e também em aVF. Qual quadrante é compatível com o eixo frontal?",
    [
      "Entre 0° e +90°",
      "Entre −180° e −90°",
      "Entre +90° e +180°",
      "Entre −90° e −30°",
    ],
    0,
    "QRS positivos em D1 e aVF indicam o quadrante entre 0° e +90°. Essa é uma triagem de eixo, que pode ser refinada com as outras derivações.",
    "sbc",
  ),
  question(
    "final-pr",
    "pr-240",
    "No exemplo de um adulto com ritmo regular a 75 bpm, o PR mede 240 ms e toda onda P é seguida de QRS. O que o padrão sugere?",
    [
      "PR curto",
      "Fibrilação atrial",
      "Bloqueio AV de primeiro grau",
      "Bloqueio AV total",
    ],
    2,
    "O PR supera 200 ms, e a condução permanece 1:1. Nesse contexto, o achado é compatível com bloqueio AV de primeiro grau.",
    "sbc",
  ),
  question(
    "final-st",
    "st-plano",
    "Em um cenário fictício de dor torácica recente, o primeiro ECG não mostra alterações diagnósticas de ST. Qual interpretação descreve melhor o resultado?",
    [
      "O traçado exclui síndrome coronariana aguda",
      "O ECG isolado é inconclusivo e deve ser correlacionado ao quadro e à avaliação seriada",
      "A ausência de supra confirma causa não cardíaca",
      "O traçado tem valor apenas se houver arritmia",
    ],
    1,
    "Um ECG inicial sem alterações diagnósticas pode ocorrer na síndrome coronariana aguda. A interpretação depende dos sintomas e de reavaliação conforme o protocolo.",
    "chest",
  ),
  question(
    "final-extrassistole",
    "extrassistole",
    "Um QRS aparece antes do esperado, é mais largo e tem morfologia diferente dos demais. Não se observa P precedente ao batimento prematuro. Qual achado é mais compatível?",
    [
      "Extrassístole ventricular",
      "Fibrilação atrial sustentada",
      "Bloqueio AV de primeiro grau",
      "Bradicardia sinusal sem ectopia",
    ],
    0,
    "Um batimento prematuro com QRS largo e diferente, sem P precedente identificável, é compatível com extrassístole ventricular neste traçado didático.",
    "sbc",
  ),
];
