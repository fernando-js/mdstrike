# MD Strike

Jogo de estudo com interface tática inspirada em jogos competitivos. PHP puro + MySQL na Hostinger, HTML/CSS e JavaScript modular, sem Laravel e sem build de frontend.

O [manual técnico](docs/README.md) explica a arquitetura, as rotas, o esquema com as 12 tabelas, os arquivos e o processo de manutenção do projeto.

## Incluído

- Lobby responsivo, favicon SVG/PNG/ICO e identidade própria.
- Catálogo das 55 especialidades; busca, filtros e distinção entre conteúdo específico e treino da área-base.
- 23 cadernos oficiais: ENAMED 2025 (caderno 1, gabarito definitivo v2) e 22 cadernos de pré-requisito do ENARE 2024/2025. São 1.860 referências de itens, incluindo anulados. O jogo exclui os anulados/excluídos e exibe a página correspondente do PDF original em um leitor PDF.js próprio, com ampliação e rolagem.
- A Operação Revalida inclui os cadernos objetivos 2024/1, 2024/2, 2025/1, 2025/2 e 2026/1. Tem mapa geral, sete mapas temáticos baseados no caderno 2026/1, revisão e histórico próprios. Os simulados permitem rever alternativas antes da entrega, guardam as marcações ao sair e aplicam as regras de corte da prova objetiva de 2025/2 e 2026/1.
- As páginas públicas `/enamed/`, `/enare/` e `/revalida/` e as páginas de cada caderno vêm do catálogo. O `/sitemap.xml` inclui as URLs públicas e o `robots.txt` indica onde encontrá-lo. O arquivo público `/indexnow.txt` permite informar novas URLs ao Bing pelo IndexNow.
- As páginas de Medicina, exames médicos, ECG, consulta clínica, codificação e CID-10 têm HTML renderizado no servidor e URLs canônicas em `mdstrike.com`. O sitemap inclui as páginas temáticas e as fichas de CID-10 com orientação editorial.
- Em `/enamed/resultados/`, a central pública do Enamed 2025 oferece busca, filtros, fichas por curso, comparação de até três cursos e exportação CSV. A planilha do Inep define os indicadores publicados e o status dos conceitos. Médias, distribuições e NPS são agregados dos microdados, com metodologia e versões das fontes na página.
- 54 questões autorais de demonstração, sem revisão médica, identificadas separadamente.
- Treino, duelo com bot, competitivo com times simulados, copa em três fases e revisão de erros.
- Cadastro, login por e-mail/nickname, senha com hash, alteração de senha, status, especialidade, histórico, XP e pontos.
- O perfil tem avatar personalizável, com 12 retratos e peças de uniforme, gorro, máscara, estetoscópio e acessório. Jalecos e estetoscópios usam pontos de encaixe próprios de cada retrato. As peças do catálogo inicial são cosméticas. O avatar fica salvo na conta ou, para convidados, no navegador.
- Ranking global, por especialidade de interesse e por mapa, entre contas reais.
- Desafios por link entre colegas: mesmas questões e alternativas, uma tentativa por conta, prazo de sete dias e placar por acertos, pontos e tempo. Cada pessoa joga no seu horário; não depende de WebSocket.
- Estudo com 17 resumos por disciplina, quatro casos PBL fictícios e revisão espaçada. A Trilha Enamed usa o caderno de 2025 e a classificação temática do MD Strike para oferecer treino nas sete áreas e exibir o histórico por área após o cadastro.
- Em Estudo → Cursos rápidos, ECG na prática reúne seis aulas, traçados interativos, um desafio final e revisão espaçada. O mapa de Cardiologia dá acesso ao curso.
- Em Mapas → Codificação em saúde, o aluno pratica CID-10, SIGTAP e TUSS em três trilhas e um desafio misto. O navegador guarda o progresso e o melhor resultado de cada rodada.
- Em Mapas, História da Medicina e Epônimos em Medicina têm dez questões cada, com explicação, fonte e revisão dos erros.
- Consulta rápida com busca por condição, sigla e CID-10, 23 temas com links aos documentos oficiais e o diretório de sociedades da AMB para as 55 especialidades. A aba Calculadoras reúne 12 ferramentas com pesquisa e filtro por área.
- Em Consulta rápida → Bulas resumidas, as fichas são pesquisáveis por princípio ativo ou nome comercial, com indicação da apresentação e link para a bula consultada. O mapa Medicamentos e bulas tem oito questões com fontes. As fichas ficam em `assets/js/medication-content.js` e apontam também para o Bulário da Anvisa e a base pública de registros.

Duelo, competitivo e copa são contra bots. O desafio por link compara tentativas reais de colegas, realizadas de forma independente. Não há sala simultânea por WebSocket nesta versão. O rating pertence ao jogo e não é nota TRI nem classificação oficial. Mapas sem questões específicas oferecem treino da área-base, explicitamente identificado. Não há recuperação de senha por e-mail nesta versão.

## Convidar um colega

1. Entre na sua conta em `https://mdstrike.com`.
2. Abra **Competições → Criar desafio** (ou **Desafiar colega**, no lobby).
3. Escolha a área e clique em **Gerar link de desafio**.
4. Use **Copiar link** ou **Compartilhar** e envie ao colega.
5. Cada participante abre o link, entra na própria conta e escolhe **Aceitar desafio**. O convite é preservado após o login.
6. Consulte o mesmo link para comparar os resultados. Seus links ficam em **Competições → Meus desafios**.

O link vale sete dias e pode reunir vários colegas no mesmo placar. O jogo seleciona até sete questões autorais da área. Cada conta tem uma tentativa por desafio e pode participar de desafios diferentes em abas separadas, com progressos independentes. Use **Salvar e sair** para retomar depois; apenas **Encerrar minha tentativa** abandona definitivamente. O relógio da questão atual continua correndo e reabrir não o reinicia. O placar prioriza acertos, pontos e menor tempo acumulado nas questões; o período de leitura dos comentários não conta. O desafio rende pontos e XP de conclusão, sem alterar o rating. Nicknames e resultados finais ficam visíveis a quem tiver o link.

## Onde colocar a senha do banco

Na Hostinger, crie o diretório privado **fora de `public_html`**:

```text
/home/u586486438/domains/mdstrike.com/
├── .mdstrike/
│   └── .env           ← a senha fica aqui
└── public_html/
    ├── index.html
    ├── .htaccess
    ├── favicon.ico
    ├── assets/
    ├── api/
    └── app/
```

Copie `.env.example` para esse `.mdstrike/.env` e preencha pelo Gerenciador de Arquivos da Hostinger:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u586486438_mdstrike_db
DB_USER=u586486438_mdstrike_user
DB_PASSWORD="SUA_SENHA_DO_MYSQL"
APP_ORIGIN=https://mdstrike.com
```

Mantenha a senha entre aspas. A senha é a do usuário MySQL informado, não a senha do painel da Hostinger. Não envie esse arquivo ao GitHub nem coloque a senha em HTML/JS. Permissão sugerida: diretório `0700`, arquivo `0600`. Se o `.env` não estiver configurado, o jogo de convidado funciona e a interface informa que o cadastro/ranking aguarda conexão.

## Publicar na Hostinger

Requer PHP **8.2+**, extensões `pdo_mysql`, `mbstring`, `json` e sessões. Ative PHP 8.2 ou superior no hPanel. MySQL na mesma hospedagem usa `127.0.0.1:3306`, conforme a API da Hostinger.

1. Faça backup do site atual e do banco antes de substituir a versão publicada.
2. Execute `npm run package` para gerar `release/mdstrike-hostinger.zip`. Não precisa instalar Node.js na hospedagem.
3. Envie o conteúdo de `release/public_html/` à pasta pública do domínio, incluindo `.htaccess`. Não envie a raiz do repositório inteira.
4. Crie o `.mdstrike/.env` privado conforme acima. Ele não é incluído no pacote com uma senha real.
5. Abra `https://mdstrike.com`. O PHP cria as [12 tabelas da aplicação](docs/banco-de-dados.md) de forma aditiva ao inicializar a conexão com o banco.
6. Crie uma conta real, termine um treino e confira o histórico e o ranking. Confirme no servidor que o arquivo privado está fora da raiz pública.

O backend responde em `api/index.php?action=...`. Pontos/XP/rating são calculados no servidor; valores enviados pelo navegador não são aceitos como resultado. A chave de sessão usa cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`. POST exige token CSRF. As rotas privadas usam consultas preparadas. O e-mail não é retornado nos rankings. Uma troca de senha revoga as outras sessões.

O `.htaccess` protege `app/` e diretórios de desenvolvimento e define cabeçalhos de segurança. O servidor deve respeitar as regras Apache/LiteSpeed; não publique em outro servidor sem regras equivalentes. Isso não remove automaticamente um bloqueio do SmartScreen: a contestação deve ser enviada à Microsoft.

## Painel administrativo

Entre com a conta autorizada e abra `https://mdstrike.com/#admin`. A navegação inclui **Administração** somente para administradores. Visitantes e contas comuns que tentam abrir um endereço administrativo são levados ao lobby, sem renderizar a página ou consultar dados administrativos; a API também exige permissão. O painel consulta usuários (incluindo e-mail, rating e XP), histórico de partidas e respostas, desafios e logs, com busca, período e paginação. Senhas, hashes de senha e configurações privadas nunca são retornados.

O botão **Sair** fica no topo da tela inicial e nas demais telas fora de uma partida. Encerra a sessão no servidor e retorna ao lobby como convidado; não apaga o perfil nem o histórico. Durante a partida, saia primeiro pelo fluxo do jogo para salvar ou encerrar a tentativa.

As tabelas aditivas `md_admins`, `md_migrations` e `md_audit_logs` são criadas automaticamente. A migração `owner_admin_20261117` concede acesso à conta do proprietário já existente no momento da implantação e guarda o ID dessa conta. Ela roda uma vez: cadastrar posteriormente o mesmo e-mail, enviar `isAdmin` no navegador ou alterar o perfil não concede acesso. A permissão é conferida no servidor em toda consulta; remover a associação em `md_admins` revoga o acesso imediatamente.

Os logs registram criação de conta, login/falhas, logout, expiração da sessão, alteração de perfil/senha, partidas, respostas, desafios, consultas administrativas e erros da API. Registram horário, IDs dos envolvidos, metadados limitados, IP recebido, navegador e ID da requisição; nunca o corpo bruto da requisição nem senhas. O painel é de consulta, sem exclusão ou edição de contas. O acesso às consultas também é registrado. Logs com mais de 90 dias são removidos gradualmente em lotes de até 1.000, no máximo a cada dez minutos durante o uso da API. Perfis, partidas e respostas permanecem no histórico. Erros repetidos e acessos administrativos negados têm limite de cinco registros por evento/IP/minuto; eventos de conta e senha continuam registrados.

## Privacidade e regras públicas

As páginas `/#privacy` e `/#ranking-rules` descrevem coleta, visibilidade, sessão, retenção, hospedagem, pontuação, desempates e desafios. Os links ficam no rodapé, em Fontes e no cadastro; no cadastro, abrem em outra aba para preservar o formulário. Textos em `assets/js/policies.js`, atualizados em 17/11/2026. Contato público indicado pelo proprietário: `info@mdstrike.com`. A identificação formal do responsável permanece pendente; a publicação não declara conformidade integral com a LGPD nem inventa CNPJ. A caixa desse endereço precisa estar ativa e acompanhada; incluir o link não provisiona e-mail. Infraestrutura internacional e retenção de backups do provedor precisam de confirmação operacional.

A API pública de ranking retorna apenas ID, nickname, especialidade, rating/patente, pontos e partidas. Instituição e status do perfil ficam restritos ao próprio usuário e à administração; não compõem a resposta pública. Trocas rápidas de filtro descartam respostas antigas para manter o placar correspondente à seleção atual. Ranking global/especialidade usa rating, pontos e ID crescente; por mapa usa pontos e ID crescente. Tentativas abandonadas não pontuam; empates no placar do desafio seguem acertos, pontos e tempo, com a mesma posição para resultados idênticos.

## Formação acadêmica opcional

Em **Meu perfil → Formação acadêmica**, o jogador pode indicar se está cursando ou se formou, escolher estado, município e faculdade, ou informar uma instituição manualmente (inclusive no exterior). A opção **Prefiro não informar** remove a formação atual ao salvar. Informações legadas de instituição são preservadas até o usuário decidir atualizar/remover. O vínculo é autodeclarado, visível ao titular e aos administradores, fora do ranking público; não comprova matrícula ou diploma. Convidados mantêm a informação somente no navegador.

O catálogo de 2.561 instituições em 1.125 municípios e 27 UFs vem do **Censo Superior 2024**, a edição mais recente disponível na página do Inep consultada em 17/11/2026. Inclui sedes e municípios de oferta presencial, sem garantir todos os campi ou a situação regulatória em tempo real. Novas instituições, nomes antigos e faculdades estrangeiras podem ser informados manualmente. Fontes e SHA256 ficam em `app/institutions.json` e sua cópia pública `assets/data/institutions.json`, sem endereços ou dados individuais de estudantes. Nenhuma busca do usuário é enviada ao Inep.

Para atualizar a lista, baixe o ZIP oficial indicado no catálogo para fora do repositório e execute `python3 scripts/import-institutions.py /caminho/arquivo.zip`. O gerador exporta somente nomes, siglas, códigos e localidades das IES; não publique o ZIP bruto. O backend valida as combinações escolhidas e deriva o nome a partir do catálogo. A tabela aditiva `md_education` guarda um vínculo opcional por conta; editar perfil e formação é uma operação atômica.

## Proteções contra abuso

Entradas com rota, método, parâmetros ou tipos inválidos são rejeitadas antes de gerar exceções. O corpo deve ser um objeto JSON de até 32 KiB, com leitura limitada aos bytes reais. O catálogo público e o treino de convidado continuam disponíveis sem banco configurado.

A API conectada ao banco aceita até 600 requisições por minuto/IP, usando somente `REMOTE_ADDR`; cabeçalhos encaminhados enviados pelo cliente não trocam a identidade do limitador. Escritas autenticadas têm limite adicional de 180 por minuto/conta. O catálogo público não abre conexão com o banco. As cotas usam incremento atômico e retornam HTTP 429 com `Retry-After`. Redes de universidades/hospitais podem compartilhar um IP; monitore os 429 antes de ajustar os limites em `app/security.php` e `api/index.php`.

Login mantém o limite de 12 tentativas/IP em 15 minutos e adiciona 20 tentativas/conta no mesmo período. E-mail e nickname da mesma conta compartilham a cota; um login bem-sucedido limpa a cota da conta. Muitas falhas podem bloquear novas tentativas por até 15 minutos, inclusive com a senha correta; sessões já autenticadas não são encerradas por esse bloqueio. Cotas antigas, sem uso há dois dias, são removidas em lotes indexados. Os demais limites de cadastro, início de partida, desafios e troca de senha continuam ativos.

Sessões de jogadores expiram após duas horas sem atividade na API ou 24 horas desde o login. Para administradores: 30 minutos sem atividade ou oito horas desde o login. Trocar a senha continua revogando outras sessões. A conexão HTTPS envia HSTS por sete dias, sem forçar subdomínios ou preload.

Ranking por mapa e contador de partidas concluídas do painel usam a mesma regra de conclusão: JSON válido com resultado de vitória/derrota, respostas e ausência de abandono. Tentativas abandonadas permanecem no histórico, sem crédito no ranking. Não há resistência garantida a robôs que resolvem o banco educacional público.

Esses controles não substituem WAF/CDN, 2FA nas contas, backups com restauração testada ou monitoramento da hospedagem. MFA dentro do jogo ainda não foi configurado. O pacote de publicação não inclui as contas de teste, o banco local nem o `.env` privado.

## Desenvolvimento local

```sh
npm install
npm run dev
```

Abra `http://127.0.0.1:8088`. O ambiente local usa SQLite em `.runtime/` para testar as contas sem credenciais de produção. PHP precisa de `pdo_sqlite`. MySQL é a configuração de produção. A pasta local, sessões e contas de teste não vão no pacote.

```sh
npm run check
npm test
npm run test:e2e
```

Os testes de navegador usam Playwright com o Google Chrome instalado. `scripts/qa-capture.mjs` captura desktop/mobile e gera PNG/ICO a partir do favicon SVG. Capturas de QA ficam em `/private/tmp`, fora do pacote.

## Conteúdo e manutenção

O curso de ECG usa as diretrizes da SBC de laudos eletrocardiográficos (2022, com errata) e de dor torácica (2025). O conteúdo autoral está em `assets/js/ecg-content.js` e aguarda revisão clínica independente. Os registros 293 e 4117 do [PTB-XL v1.0.3](https://physionet.org/content/ptb-xl/1.0.3/) (Wagner e colegas, DOI 10.13026/kfzx-aw45) foram convertidos a partir dos sinais de 100 Hz para 12 séries em microvolts, com rótulos D1, D2 e D3 para I, II e III. Os arquivos `assets/data/ecg-293.json` e `assets/data/ecg-4117.json` contêm apenas as amostras e a identificação do registro, sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Os demais traçados são simulações didáticas. O navegador guarda o progresso e os erros do desafio por conta ou convidado.

Os resumos e casos estão em `assets/js/study-content.js`. A busca e o diretório usam `assets/js/clinical-content.js` e `assets/js/medical-societies.js`. Confira os documentos vigentes antes de atualizar o índice. A API de dados abertos de PCDT é referenciada na aba Fontes brasileiras. A busca usa o catálogo versionado no projeto e abre os documentos nas páginas de origem.

O mapa de codificação usa uma seleção didática em `assets/js/coding-content.js`. Os termos foram conferidos na CID-10 da RNDS, na edição de novembro de 2026 do SIGTAP e na Tabela 22 do componente de representação de conceitos da ANS, versão 202609. As rodadas e a busca usam essa seleção local. Os links do mapa apontam para as fontes de cada tabela.

A consulta pública `/cid-10/` pesquisa a seleção de `app/cid10-selection.json` por código, descrição ou termo de busca. A [classificação da RNDS](https://fhir.saude.gov.br/ria/pt-BR/CodeSystem-BRCID10.html) fornece os termos oficiais e a lista integral. Os resultados de pesquisa e as fichas sem conteúdo editorial têm `noindex`.

Favoritos, estágios dos casos e fila de revisões ficam no navegador, com chaves separadas por conta ou convidado. O histórico de questões da Trilha Enamed usa o perfil do jogo. As calculadoras realizam as operações no navegador sem gravar valores digitados. As fórmulas, unidades, faixas de entrada e referências ficam em `assets/js/medical-tools.js`. Os resumos e os casos iniciais aguardam revisão médica independente.

`app/questions.json` é o banco usado pelo servidor. `app/catalog.json` reúne mapas e fontes. `assets/js/practice-bank.js` permite o treino local; questões educacionais e gabaritos são públicos, portanto o servidor impede adulteração de placar, mas esta versão não promete resistência a automação de respostas.

Para reconstruir o catálogo após alterações, execute `node scripts/content.mjs`. A importação dos PDFs oficiais está em `scripts/import-official.py` e requer Python com `pypdf`, apenas para manutenção. O importador valida a presença dos números e gabaritos e mantém itens anulados como `answer: null`; nunca cria justificativas clínicas atribuídas à banca. Os PDFs são distribuídos sem alterar o conteúdo e mantêm a fonte original no catálogo.

O ENARE de acesso direto 2024 não foi integrado porque houve retificação posterior de gabarito. Cadernos de Enamed e Enare posteriores aos das páginas públicas podem ser consultados nas fontes oficiais.

`node scripts/import-revalida.mjs` valida e importa os PDFs listados no manifesto do Revalida. Em seguida, rode `node scripts/content.mjs`. O simulado usa o gabarito definitivo e contabiliza os itens anulados conforme o edital quando há nota de corte comparável. A tabela aditiva `md_revalida_first` registra a primeira entrega com respostas por conta e edição para a comparação de desempenho. O visitante pode concluir simulados com progresso local.

Para regenerar os resultados do Enamed 2025, obtenha a planilha Conceito Enade Medicina e o ZIP dos microdados nas fontes registradas em `app/enamed-results.json`. Rode `python3 scripts/import-enamed-results.py /caminho/conceito.xlsx /caminho/microdados.zip` na raiz. O script grava contagens, médias, distribuições e metadados de origem. As linhas individuais dos microdados permanecem nos arquivos de origem.

O progresso legado em `mds_profile` é preservado no modo convidado. O HTML anterior está em `index-legacy.html`; os arquivos legados não vão no pacote público.

Fontes Barlow/Barlow Condensed hospedadas localmente sob SIL OFL (`assets/fonts/OFL.txt`). Arte hospitalar gerada para o MD Strike; marcas e recursos visuais de Counter-Strike não foram copiados.

O leitor PDF.js e suas fontes são hospedados em `assets/pdfjs/`, sob as licenças distribuídas nessa pasta. Após atualizar a dependência `pdfjs-dist`, execute `npm run vendor:pdf` para copiar a versão correspondente. Não é necessário Node.js no servidor PHP.

## Limites de validação

A suíte automatizada local usa SQLite. A conexão ao MySQL da Hostinger depende do `.env` privado e deve ser verificada após publicação. O arquivo SQL público nunca contém a senha. Sem SMTP configurado, não há verificação de e-mail ou recuperação por e-mail; o cadastro não afirma que o e-mail foi verificado.
