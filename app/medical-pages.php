<?php
declare(strict_types=1);

const PCDT = 'https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas/pcdt';

function medical_pages(): array {
    return [
        '/tea/' => [
            'title' => 'Operação TEA · Título de Especialista em Anestesiologia',
            'description' => 'Estude para o TEA de Anestesiologia com sete missões, 70 questões comentadas, casos discursivos, desafios entre colegas e revisão de erros.',
            'action' => ['Jogar Operação TEA', '/#tea'],
            'sections' => [
                ['Missões por tema', 'Pratique via aérea e ventilação, monitorização e farmacologia, neuroeixo e bloqueios, complicações e recuperação, avaliação pré-anestésica, anestesia obstétrica e pediátrica. São 70 questões autorais relacionadas aos pontos do edital de 2026. O navegador guarda seu progresso.',
                    [['Abrir as missões no MD Strike', '/#tea'], ['Programa teórico do TEA na SBA', 'https://www.sbahq.org/programa-tea/']]],
                ['Desafios entre colegas', 'Gere um convite com um tema específico ou combine os assuntos em um desafio de até 20 questões. Os participantes recebem as mesmas perguntas e alternativas e comparam o desempenho em um placar próprio.',
                    [['Abrir a Operação TEA', '/#tea']]],
                ['Casos clínicos discursivos', 'Escreva uma resposta curta antes de comparar com o espelho comentado. Em seguida, veja como o cenário evolui. Os casos são fictícios e a revisão médica independente do material está pendente.',
                    [['Edital do exame de suficiência de 2026', 'https://www.sbahq.org/wp-content/uploads/2025/02/Edital-TEA-2026-3.pdf#page=9']]],
                ['Materiais públicos da SBA', 'Consulte o gabarito histórico do TEA e use as avaliações de Médicos em Especialização e os tutoriais da WFSA para complementar o estudo.',
                    [['Gabarito da primeira fase do TEA 2023', 'https://www.sbahq.org/gabarito-1a-fase-tea-2023/'], ['Avaliação ME2 de 2026 com enunciados e respostas', 'https://www.sbahq.org/wp-content/uploads/2026/06/ME2-1o-Quadri-gabarito.pdf'], ['Tutoriais em português da SBA e da WFSA', 'https://www.sbahq.org/estrutural/tutoriais-wfsa/']]],
            ],
        ],
        '/medicina/' => [
            'title' => 'Estudo de Medicina, provas e ferramentas clínicas',
            'description' => 'Encontre resumos por disciplina, casos PBL, questões de provas médicas e ferramentas de consulta para a graduação e o início da prática médica.',
            'sections' => [
                ['Graduação em Medicina', 'Comece pelo resumo da disciplina e depois aplique o que estudou em um caso de aprendizagem baseada em problemas (PBL). A revisão espaçada ajuda a retomar o que você precisa recordar.',
                    [['Resumos por disciplina', '/#study'], ['Casos PBL', '/#study/pbl'], ['Revisão espaçada', '/#study/revisao']]],
                ['Enamed, Enare e Revalida', 'Compare seu desempenho em provas anteriores e verifique as respostas nos gabaritos oficiais. Para treinar uma área, use os mapas e volte às questões que errou.',
                    [['Simulados do Enamed', '/enamed/'], ['Provas anteriores do Enare', '/enare/'], ['Simulados do Revalida', '/revalida/']]],
                ['Título de Especialista em Anestesiologia', 'Pratique questões autorais por tema e casos clínicos discursivos na Operação TEA.',
                    [['Conhecer a Operação TEA', '/tea/']]],
                ['Exames, protocolos e codificação', 'Alterne entre a leitura de exames, a busca de fontes clínicas e os exercícios de registro de diagnósticos e procedimentos.',
                    [['Exames médicos', '/exames-medicos/'], ['Consulta clínica', '/consulta-clinica/'], ['Consultar CID-10', CID10_PATH], ['CID-10, SIGTAP e TUSS', '/codificacao-em-saude/']]],
            ],
        ],
        '/consulta-clinica/' => [
            'title' => 'Consulta clínica, protocolos do SUS e calculadoras médicas',
            'description' => 'Busque protocolos clínicos por tema, encontre diretrizes brasileiras e acesse as calculadoras médicas e a consulta de CID-10 do MD Strike.',
            'sections' => [
                ['Protocolos por tema', 'Use a busca para encontrar fontes sobre condições como hipertensão, diabetes tipo 2, dor torácica e asma. Antes de aplicar um protocolo, confira a população, o cenário de atendimento e a versão do documento.',
                    [['Buscar protocolos clínicos', '/#consulta'], ['Consultar bulas resumidas', '/#consulta/bulas'], ['Protocolos Clínicos e Diretrizes Terapêuticas do SUS', PCDT]]],
                ['Calculadoras médicas', 'Encontre fórmulas e escores para estudo e consulta, com os campos e as fontes de cada ferramenta.',
                    [['Abrir as calculadoras', '/#consulta/calculadoras']]],
                ['Classificação e fontes brasileiras', 'A CID-10 ajuda a localizar o código de uma condição já documentada. Para estudar diagnóstico e tratamento, consulte os protocolos e as diretrizes da área.',
                    [['Consultar CID-10 por código ou nome', CID10_PATH], ['Diretório de fontes brasileiras', '/#consulta/fontes'], ['Diretrizes da Sociedade Brasileira de Cardiologia', 'https://www.portal.cardiol.br/diretrizes']]],
            ],
        ],
        '/exames-medicos/' => [
            'title' => 'Exames médicos na prática',
            'description' => 'Estude a leitura de exames com exercícios e aprenda a pesquisar códigos de procedimentos no SUS e na saúde suplementar.',
            'sections' => [
                ['Eletrocardiograma (ECG)', 'Aprenda uma sequência de leitura, pratique com traçados interativos e teste sua interpretação no desafio do curso de ECG.',
                    [['Estudar eletrocardiograma e interpretação de ECG', '/exames-medicos/eletrocardiograma/']]],
                ['Registro de exames e procedimentos', 'O mapa de codificação inclui exemplos de hemograma, creatinina, radiografia, ultrassonografia e eletrocardiograma. Pratique a seleção da tabela de acordo com o contexto do atendimento.',
                    [['Estudar SIGTAP e TUSS', '/codificacao-em-saude/'], ['Buscar códigos da seleção de treino', '/#maps/codificacao/consulta']]],
            ],
        ],
        '/exames-medicos/eletrocardiograma/' => [
            'title' => 'Eletrocardiograma (ECG) na prática',
            'description' => 'Curso rápido de ECG com seis aulas, traçados interativos e questões comentadas sobre ritmo, eixo, intervalos, arritmias e alterações de ST.',
            'sections' => [
                ['O que é um eletrocardiograma?', 'O eletrocardiograma registra a atividade elétrica do coração. No curso, você pratica uma ordem de leitura que começa pela qualidade do traçado e passa por frequência, ritmo, eixo, intervalos e alterações de repolarização.',
                    [['Começar o curso rápido de ECG', '/#study/cursos/ecg']]],
                ['Aprenda com traçados e questões', 'As seis aulas usam traçados simulados e registros de pesquisa identificados. Use as derivações para reconhecer os padrões, responda às questões e retome os itens que errou na revisão.',
                    [['Abrir o desafio de ECG', '/#study/cursos/ecg/desafio'], ['Referências da Sociedade Brasileira de Cardiologia', 'https://www.portal.cardiol.br/diretrizes']]],
                ['Como pesquisar o código do exame', 'O jogo de codificação mostra como localizar o eletrocardiograma na tabela do SUS e a descrição correspondente ao exame que foi realizado na saúde suplementar.',
                    [['Treinar codificação de exames', '/codificacao-em-saude/']]],
            ],
        ],
        '/codificacao-em-saude/' => [
            'title' => 'CID-10, SIGTAP e TUSS na prática',
            'description' => 'Aprenda a diferença entre códigos de diagnóstico e de procedimentos. Pratique a codificação com questões comentadas sobre prontuário, SUS e saúde suplementar.',
            'sections' => [
                ['CID-10 para o diagnóstico documentado', 'Comece pela condição ou pelo sintoma descrito no prontuário. Uma categoria pode ter subcategorias que especificam a condição. Confira esse nível de detalhe na fonte.',
                    [['Pesquisar CID-10', CID10_PATH], ['Treinar questões de CID-10', '/#maps/codificacao/cid10']]],
                ['SIGTAP no SUS e TUSS na saúde suplementar', 'Consulte o SIGTAP para o procedimento no SUS e a tabela correspondente da TUSS para a troca de informações na saúde suplementar. Confira a competência do SIGTAP e a versão da TUSS. A cobertura de um exame depende das regras aplicáveis e do plano.',
                    [['Treinar SIGTAP', '/#maps/codificacao/sigtap'], ['Treinar TUSS', '/#maps/codificacao/tuss'], ['Documentação do SIGTAP', 'https://wiki.datasus.gov.br/sigtap/index.php/P%C3%A1gina_principal'], ['Códigos TUSS na ANS', 'https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss']]],
                ['Desafio misto', 'Em nove questões, escolha a tabela, encontre o código e confira a explicação com a fonte. O navegador guarda sua rodada para você retomar e revisar os erros.',
                    [['Jogar o desafio misto', '/#maps/codificacao/misto']]],
            ],
        ],
    ];
}

function featured_cid10(): array {
    return [
        'I10' => ['Use a descrição do prontuário para distinguir hipertensão primária de hipertensão secundária, que a classificação agrupa em I15.',
            [['Hipertensão secundária, CID-10 I15', CID10_PATH . 'i15/'], ['Fontes sobre hipertensão arterial', '/#consulta/tema/hipertensao']]],
        'E119' => ['O último caractere identifica a subcategoria sem complicações. Consulte a categoria E11 para comparar as subcategorias da condição documentada.',
            [['Fontes sobre diabetes tipo 2', '/#consulta/tema/diabetes-2']]],
        'R074' => ['A classificação registra aqui o sintoma inespecífico de dor torácica. Use o diagnóstico documentado se a causa já tiver sido identificada e registrada.',
            [['Estudar leitura de eletrocardiograma', '/exames-medicos/eletrocardiograma/'], ['Consulta clínica', '/consulta-clinica/']]],
        'J459' => ['O código identifica asma quando o tipo não está especificado na informação clínica usada no registro.',
            [['Fontes sobre asma', '/#consulta/tema/asma']]],
        'N390' => ['A descrição indica que a localização da infecção urinária não foi especificada. Quando o prontuário identifica o local, confira a classificação desse diagnóstico.',
            [['Ver cistite aguda, CID-10 N30.0', CID10_PATH . 'n300/']]],
    ];
}

function medical_public_urls(): array {
    $featured = array_map(fn(string $code) => CID10_PATH . strtolower($code) . '/', array_keys(featured_cid10()));
    return [...array_keys(medical_pages()), CID10_PATH, ...$featured];
}
