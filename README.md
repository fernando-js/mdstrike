# MD Strike

Jogo de estudo com interface tática inspirada em jogos competitivos. PHP puro + MySQL na Hostinger, HTML/CSS e JavaScript modular, sem Laravel e sem build de frontend.

## Incluído

- Lobby responsivo, favicon SVG/PNG/ICO e identidade própria.
- Catálogo das 55 especialidades; busca, filtros e distinção entre conteúdo específico e treino da área-base.
- 23 cadernos oficiais: ENAMED 2025 (caderno 1, gabarito definitivo v2) e 22 cadernos de pré-requisito do ENARE 2024/2025. São 1.860 referências de itens, incluindo anulados. O jogo exclui os anulados/excluídos e exibe a página correspondente do PDF original em um leitor PDF.js próprio, com ampliação e rolagem.
- 54 questões autorais de demonstração, sem revisão médica, identificadas separadamente.
- Treino, duelo com bot, competitivo com times simulados, copa em três fases e revisão de erros.
- Cadastro, login por e-mail/nickname, senha com hash, alteração de senha, status, especialidade, histórico, XP e pontos.
- Ranking global, por especialidade de interesse e por mapa, entre contas reais.
- Desafios por link entre colegas: mesmas questões e alternativas, uma tentativa por conta, prazo de sete dias e placar por acertos, pontos e tempo. Cada pessoa joga no seu horário; não depende de WebSocket.

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
5. Abra `https://mdstrike.com`. As tabelas `md_users`, `md_matches`, `md_answers` e `md_auth_limits` são criadas de forma aditiva na primeira operação de conta. Não é feito `DROP`, limpeza ou importação de usuários fictícios.
6. Crie uma conta real, termine um treino e confira o histórico e o ranking. Confirme no servidor que o arquivo privado está fora da raiz pública.

O backend responde em `api/index.php?action=...`. Pontos/XP/rating são calculados no servidor; valores enviados pelo navegador não são aceitos como resultado. A chave de sessão usa cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`. POST exige token CSRF. As rotas privadas usam consultas preparadas. O e-mail não é retornado nos rankings. Uma troca de senha revoga as outras sessões.

O `.htaccess` protege `app/` e diretórios de desenvolvimento e define cabeçalhos de segurança. O servidor deve respeitar as regras Apache/LiteSpeed; não publique em outro servidor sem regras equivalentes. Isso não remove automaticamente um bloqueio do SmartScreen: a contestação deve ser enviada à Microsoft.

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

`app/questions.json` é o banco usado pelo servidor. `app/catalog.json` reúne mapas e fontes. `assets/js/practice-bank.js` permite o treino local; questões educacionais e gabaritos são públicos, portanto o servidor impede adulteração de placar, mas esta versão não promete resistência a automação de respostas.

Para reconstruir o catálogo após alterações, execute `node scripts/content.mjs`. A importação dos PDFs oficiais está em `scripts/import-official.py` e requer Python com `pypdf`, apenas para manutenção. O importador valida a presença dos números e gabaritos e mantém itens anulados como `answer: null`; nunca cria justificativas clínicas atribuídas à banca. Os PDFs são distribuídos sem alterar o conteúdo e mantêm a fonte original no catálogo.

O ENARE de acesso direto 2024 não foi integrado porque houve retificação posterior de gabarito. Edições 2026 são acessíveis pelos links das fontes oficiais, sem serem apresentadas como já integradas.

O progresso legado em `mds_profile` é preservado no modo convidado. O HTML anterior está em `index-legacy.html`; os arquivos legados não vão no pacote público.

Fontes Barlow/Barlow Condensed hospedadas localmente sob SIL OFL (`assets/fonts/OFL.txt`). Arte hospitalar gerada para o MD Strike; marcas e recursos visuais de Counter-Strike não foram copiados.

O leitor PDF.js e suas fontes são hospedados em `assets/pdfjs/`, sob as licenças distribuídas nessa pasta. Após atualizar a dependência `pdfjs-dist`, execute `npm run vendor:pdf` para copiar a versão correspondente. Não é necessário Node.js no servidor PHP.

## Limites de validação

A suíte automatizada local usa SQLite. A conexão ao MySQL da Hostinger depende do `.env` privado e deve ser verificada após publicação. O arquivo SQL público nunca contém a senha. Sem SMTP configurado, não há verificação de e-mail ou recuperação por e-mail; o cadastro não afirma que o e-mail foi verificado.
