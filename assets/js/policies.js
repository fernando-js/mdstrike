export const policyUpdated = "17/11/2026";

export const rankingSummary =
  "Global e especialidade: rating, pontos e, em empate, ordem de criação da conta. Por mapa: pontos de partidas concluídas no mapa escolhido, com o mesmo desempate por conta. Os 100 primeiros de cada classificação são exibidos. Partidas abandonadas não contam. E-mail, instituição e status da conta não aparecem na classificação pública.";

export const privacyDocument = `
<article class="prose" aria-label="Política de privacidade">
<p class="muted">Atualizada em ${policyUpdated} · Aplicável ao MD Strike em mdstrike.com.</p>
<h2>Dados usados pelo jogo</h2>
<p>Ao criar uma conta, você informa nickname, e-mail e senha. Também pode informar especialidade de interesse, status do perfil e formação acadêmica: faculdade, estado, município e se está cursando ou já se formou. A formação é opcional, autodeclarada e visível apenas no seu perfil e para a administração; não comprova matrícula, diploma ou habilitação profissional. A senha é armazenada como hash, não como texto legível. Administradores não recebem sua senha ou seu hash pelo painel.</p>
<p>A lista de instituições usa uma cópia local do Censo Superior 2024 do Inep, consultada em 17/11/2026, com sedes e municípios de oferta presencial. Ela não garante situação regulatória atual ou a identificação de todo campus. Você pode informar outra instituição manualmente ou deixar a formação em branco. A seleção não envia consultas de perfil ao Inep.</p>
<p>O servidor registra suas partidas, questões respondidas, alternativas escolhidas, acertos, tempo de resposta, pontos, XP, rating e participação em desafios. Esses dados permitem salvar o progresso, corrigir respostas e calcular as classificações.</p>
<p>Não solicitamos dados de pacientes ou informações de saúde para jogar. Evite colocar informações pessoais sensíveis no nickname ou na instituição.</p>
<h2>O que fica público</h2>
<p>O ranking é público e pode ser consultado mesmo sem login. Ele mostra identificador da conta, nickname, especialidade de interesse, patente, rating, pontos e quantidade de partidas concluídas. E-mail, instituição, status do perfil, senha, IP e registros de acesso não fazem parte dessa resposta pública.</p>
<p>Nos desafios, qualquer pessoa com o link pode consultar o nickname do criador, o mapa, os participantes, a situação de cada tentativa e os resultados finais. Pontuações parciais de tentativas em andamento ou abandonadas não são divulgadas. Compartilhe o link apenas com quem deve acompanhar o desafio.</p>
<h2>Administração e finalidade de uso</h2>
<p>A administração autorizada pode consultar e-mail, perfil, histórico de partidas e respostas, desafios e logs para operar o serviço, prestar suporte, investigar falhas e prevenir abuso. O acesso ao painel é conferido no servidor e as consultas administrativas são registradas.</p>
<p>As informações são usadas para cadastro e autenticação, funcionamento do jogo, progresso e ranking público solicitado no cadastro, suporte e proteção do serviço. A versão atual não integra publicidade ou ferramentas externas de análise de audiência.</p>
<h2>Logs e segurança</h2>
<p>Os registros de atividade podem incluir evento, data e horário, identificadores das contas envolvidas, IP recebido pelo servidor, identificação do navegador, identificador da requisição e detalhes limitados da operação. Podem registrar cadastro, login e falhas, logout, expiração da sessão, alterações de perfil ou senha, partidas, respostas, desafios, erros e consultas administrativas. Não registramos a senha nem o corpo bruto das requisições nesses logs.</p>
<p>Usamos HTTPS, cookies protegidos, controle de acesso, validação de entrada e limites de requisições. Erros repetidos podem ser limitados nos logs. Essas medidas reduzem riscos e não representam garantia de invulnerabilidade.</p>
<h2>Cookies e armazenamento no dispositivo</h2>
<p>O cookie essencial <code>mdstrike_session</code> mantém a sessão e a proteção das operações da conta. Em produção, ele usa Secure, HttpOnly e SameSite=Lax. Bloqueá-lo impede o funcionamento do login e das partidas vinculadas à conta.</p>
<p>A autenticação de jogadores expira após duas horas sem atividade na API ou 24 horas desde o login; para administradores, após 30 minutos sem atividade ou oito horas desde o login. Sair encerra a sessão no servidor. Trocar a senha revoga as outras sessões.</p>
<p>No modo convidado, perfil e progresso ficam no armazenamento local do navegador, junto da preferência de som. Esses resultados não são importados para uma conta nem enviados ao ranking. Você pode remover os dados locais nas configurações do navegador; isso não apaga os dados de uma conta no servidor. Mesmo convidados geram requisições à hospedagem, que pode manter registros técnicos.</p>
<h2>Retenção e hospedagem</h2>
<p>Logs de auditoria do aplicativo com mais de 90 dias são removidos gradualmente, em lotes, durante o uso da API. Marcadores de limitação de abuso sem uso há mais de dois dias também são limpos gradualmente. Esses prazos não significam exclusão do perfil ou do histórico de estudo.</p>
<p>Perfis, partidas, respostas e desafios não têm exclusão automática por inatividade nesta versão. O prazo de sete dias de um convite limita o início ou a retomada da tentativa e não apaga seus resultados: o placar continua acessível pelo link; uma tentativa já aberta pode continuar. A disponibilidade não garante guarda permanente.</p>
<p>O serviço utiliza a Hostinger para hospedagem e banco de dados. A infraestrutura pode manter logs e cópias de segurança conforme suas próprias configurações e políticas; a rotina de 90 dias do aplicativo não apaga esses registros ou backups. A localização da infraestrutura e as condições de eventual transferência internacional dependem da contratação da hospedagem e ainda precisam ser confirmadas pelo responsável pelo serviço.</p>
<h2>Seus direitos e ajustes</h2>
<p>Você pode editar nickname, especialidade, formação acadêmica e status em Meu perfil e trocar a senha nessa mesma área. Na formação, selecionar Prefiro não informar e salvar remove esses dados do perfil atual no aplicativo. Essa ação não apaga automaticamente registros técnicos ou cópias de segurança do provedor. Os direitos previstos na LGPD incluem obter informações e acesso aos dados, pedir correção, avaliar portabilidade, oposição, revogação de consentimento e eliminação nas hipóteses aplicáveis. Nem todos esses pedidos têm atendimento automático no jogo.</p>
<p>Para solicitações sobre dados pessoais, entre em contato pelo e-mail <a href="mailto:info@mdstrike.com">info@mdstrike.com</a>. Informe o assunto e os dados necessários para localizar sua conta; a identidade poderá ser confirmada antes do atendimento. Não envie sua senha ou dados de pacientes. A identificação formal do responsável pelo serviço ainda será complementada.</p>
<h2>Fontes e atualizações</h2>
<p>Links para Inep, FGV e outros sites seguem as políticas dos respectivos destinos. PDFs, fontes tipográficas e imagens do jogo são servidos pelo próprio site. Mudanças nas práticas descritas serão refletidas nesta página com nova data.</p>
<p>Consulte a <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer">Lei Geral de Proteção de Dados ↗</a> e as <a href="https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes" target="_blank" rel="noopener noreferrer">orientações da ANPD ↗</a>.</p>
<p><button class="text-button" data-page="ranking-rules">Consultar as regras de ranking e competição ↗</button></p>
</article>`;

export const rankingDocument = `
<article class="prose" aria-label="Regras de ranking e competição">
<p class="muted">Atualizadas em ${policyUpdated} · Regras da versão atual do MD Strike.</p>
<h2>Três classificações públicas</h2>
<div class="table-wrap policy-table"><table><thead><tr><th>Classificação</th><th>Participação</th><th>Ordem</th></tr></thead><tbody>
<tr><td>Global</td><td>Contas com ao menos uma partida concluída.</td><td>Maior rating, depois mais pontos; empate final pela conta criada primeiro.</td></tr>
<tr><td>Por especialidade</td><td>As mesmas contas, filtradas pela especialidade de interesse informada no perfil.</td><td>Maior rating, depois mais pontos; empate final pela conta criada primeiro.</td></tr>
<tr><td>Por mapa jogado</td><td>Contas com partidas concluídas naquele mapa.</td><td>Maior soma de pontos obtidos nesse mapa; empate pela conta criada primeiro.</td></tr>
</tbody></table></div>
<p>São exibidas até 100 contas por classificação. Global e especialidade atribuem posições sequenciais após o desempate. A posição no perfil considera a classificação global completa, mesmo fora dos 100 exibidos. A especialidade do perfil é interesse declarado e não comprovação de formação ou competência clínica. Escolher uma área-base não equivale a concluir todos os mapas de especialidades dessa área.</p>
<h2>Rating, pontos e XP</h2>
<p>Contas começam com 1.000 de rating. Duelo, competitivo e copa contra bots alteram o rating em +20 na vitória e −12 na derrota ou eliminação; o mínimo é zero. Treino, revisão, cadernos oficiais e desafios entre colegas não alteram o rating.</p>
<p>Cada acerto vale 100 pontos. Duelo, competitivo, copa e desafio têm bônus de velocidade de até 50 pontos por acerto, calculado pelo servidor e reduzido com o tempo. Há 60 segundos por questão, com até cinco segundos de tolerância técnica na entrega; depois disso a resposta é considerada não respondida. As pausas de leitura dos comentários não entram no relógio da próxima questão.</p>
<p>Ao concluir, o XP é de 20 por acerto, mais 80 por vitória em modo que altera rating ou mais 10 nos demais resultados. Pontos e XP de conclusão são creditados uma vez. A contagem de respostas e acertos do perfil pode incluir questões de tentativas abandonadas, sem conceder pontos ou XP de conclusão por esse abandono.</p>
<h2>Vitória e derrota</h2>
<p>No duelo, vence a maior pontuação; empate favorece o bot. No competitivo, o primeiro time a vencer cinco rounds ganha; aliados e adversários são simulados. Na copa, é necessário vencer cada fase; empate ou derrota em uma fase elimina e conclui a campanha com derrota. Eliminações legítimas da copa contam como resultado concluído.</p>
<h2>Abandono e histórico</h2>
<p>Encerrar uma tentativa ou substituí-la iniciando outra partida comum marca a anterior como abandonada. Ela permanece no histórico, mas não soma pontos, XP de conclusão ou partidas no ranking por mapa e não altera o rating. Pontuações já salvas de partidas concluídas permanecem válidas.</p>
<p>Sair da conta não apaga perfil ou histórico. Para sair de uma partida, use o fluxo do jogo. Nos desafios, Salvar e sair preserva a tentativa; o relógio da questão já aberta continua correndo. Encerrar minha tentativa abandona definitivamente aquela participação.</p>
<h2>Desafios por link</h2>
<p>Um convite pode reunir vários colegas. Cada conta tem uma tentativa por desafio, com as mesmas questões e alternativas, e pode participar de desafios diferentes. As tentativas são independentes: não há sala simultânea por WebSocket nesta versão.</p>
<p>O prazo de sete dias limita o início e a retomada pelo convite, sem apagar o placar. Uma tentativa já aberta pode continuar. Entre resultados concluídos, a ordem é: mais acertos, mais pontos e menor tempo acumulado nas respostas; o tempo lendo comentários não conta. Empate nos três critérios recebe a mesma posição no desafio. Tentativas em andamento ou abandonadas não recebem posição final nem divulgam pontos parciais.</p>
<h2>Integridade e limites</h2>
<p>O servidor controla a correção, o tempo e o crédito de pontos de contas conectadas; alterações de valores no navegador não são aceitas como resultado. Respostas repetidas e tentativas de operar partidas de outras contas são rejeitadas. Há limites de requisições que podem exigir aguardar e tentar novamente.</p>
<p>As questões e os gabaritos educacionais são públicos. O jogo não garante resistência a robôs que resolvam essas questões. Não há promessa de fiscalização antifraude, premiação ou equivalência com competições oficiais.</p>
<p>Resultados, rating e patentes são do jogo: não correspondem a nota TRI, aprovação, classificação oficial no ENAMED/ENARE ou avaliação de capacidade profissional. Questões autorais de demonstração são identificadas e ainda não têm revisão médica.</p>
<p><button class="text-button" data-page="ranking">Abrir ranking ↗</button> · <button class="text-button" data-page="privacy">Consultar a política de privacidade ↗</button></p>
</article>`;
