# Operação e manutenção do MD Strike

Este guia usa o ambiente local para aprender e testar, o GitHub para revisar e guardar o histórico e a Hostinger para servir a versão pública.

## Rodar o projeto na sua máquina

Instale PHP 8.2 ou superior com PDO SQLite, sessões, JSON, mbstring e cURL. Use Node.js com npm. Para verificar a interface, tenha o Google Chrome instalado. O pacote de publicação usa o comando `zip`.

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:8088`. O primeiro fluxo que usa o banco inicializa `.runtime/mdstrike.sqlite`. Use contas fictícias para treinamento e teste. A configuração de desenvolvimento é passada pelo comando npm e pode ser conferida em [package.json](../package.json).

### Testes e empacotamento

Em outro terminal, na mesma raiz do projeto, execute as verificações após uma alteração.

```sh
npm run check
npm test
npm run test:e2e
```

- `check` valida o código PHP e JavaScript e verifica os totais e vínculos de conteúdo.
- `test` roda testes de regras, migrações, fórmulas, dados e pacote.
- `test:e2e` usa o Chrome para executar os fluxos de conta, jogos, consultas e páginas públicas em um servidor local.

Em uma cópia de testes nova, inicialize as tabelas antes dos testes de navegador que consultam o banco diretamente.

```sh
MDSTRIKE_ENV=development MDSTRIKE_DB_DRIVER=sqlite MDSTRIKE_PRIVATE_DIR=.runtime \
  php -r 'require "app/bootstrap.php"; database();'
```

O Playwright reutiliza o servidor da porta 8088 quando ele está rodando. Para uma validação completa de publicação, use uma cópia isolada com banco de testes limpo e garanta que o servidor dessa cópia atenda a porta usada na configuração. Execuções repetidas no mesmo banco acumulam contas de teste no ranking. [Configuração do Playwright](../playwright.config.js)

## Atualizar conteúdo sem quebrar a referência

| Alteração | Arquivo de partida e verificação |
| --- | --- |
| Fichas de bulas | Edite `assets/js/medication-content.js`. Confira princípio ativo, marca, apresentação, cuidados e link para o documento. As questões que reaproveitam as fichas ficam em `assets/js/medical-quiz-content.js` |
| Calculadoras | Edite `assets/js/medical-tools.js`. Confira fórmula, unidades, população aplicável e um exemplo com resultado calculado à parte |
| Protocolos, resumos e PBL | Edite `assets/js/clinical-content.js` ou `assets/js/study-content.js`. Confira fonte, versão e vínculo entre os recursos |
| Codificação | Edite `assets/js/coding-content.js` para o treino. Mantenha fonte e competência ou versão de SIGTAP e TUSS. O índice da consulta pública de CID-10 fica em `app/cid10-selection.json` |
| ECG | Edite `assets/js/ecg-content.js`. Confira os traçados, a fonte e o desafio em desktop e celular |
| Cadernos oficiais | Atualize o importador da família e os PDFs de origem. Regenere o catálogo e o banco com `node scripts/content.mjs`. Confira versão do gabarito e a página de cada questão |
| Formação e indicadores | Use os importadores de instituições e resultados do Enamed descritos no [README](../README.md#conteúdo-e-manutenção). Mantenha os dados brutos de origem em armazenamento privado e confira a saída agregada |

IDs de questões, provas e mapas já publicados são usados no histórico. Preserve esses identificadores ao corrigir textos. Use um novo ID para novos itens. Uma mudança no identificador exige avaliar os vínculos em partidas, revisões e rodadas salvas no navegador.

## GitHub e Hostinger

A publicação na Hostinger usa o pacote montado a partir da cópia local. A última versão incorporada à branch `main` do GitHub foi a 3.4.0. [Pull request incorporado](https://github.com/fernando-js/mdstrike/pull/1)

| Versão web | Entregas registradas |
| --- | --- |
| 3.0.0 | Curso rápido de ECG, traçados e desafio |
| 3.2.0 | Jogo de codificação, consulta CID-10 e páginas públicas de Medicina com sitemap |
| 3.3.0 | Catálogo com 12 calculadoras e mapas de História da Medicina e Epônimos |
| 3.4.0 | Aba de bulas resumidas e jogo de medicamentos |

### Fluxo para sincronizar e publicar

1. Confira o estado local com `git status --short` e o remoto com `git ls-remote origin refs/heads/main`. Separe apenas código, conteúdo e testes que pertencem ao projeto.
2. Revise e registre as mudanças em um commit. Uma branch com pull request permite conferir o conjunto antes de atualizar a `main`. Use `.gitignore` para manter fora do histórico credenciais, bancos locais, backups, dependências instaladas e arquivos de publicação.
3. Rode os testes com o código que será publicado. Para JS ou CSS alterado, confira as versões nos links e imports que carregam o arquivo para que o navegador busque a atualização.
4. Rode `npm run package`. O comando gera `release/public_html/` com o conteúdo do site e `release/mdstrike-hostinger.zip` com o pacote de distribuição. A publicação manual usa o conteúdo da pasta pública. O [script de empacotamento](../scripts/package.mjs) define exatamente o que entra.
5. Antes da troca, guarde a versão publicada e o backup do banco. Na Hostinger, publique os arquivos em `public_html/` do domínio `mdstrike.com`. As credenciais permanecem no `.mdstrike/.env` privado, ao lado de `public_html/`. PHP e MySQL rodam na hospedagem. Node.js e Python fazem parte da manutenção local.
6. Confira em produção a versão em `index.html`, a página inicial, a funcionalidade alterada e as rotas de sessão e ranking. Para páginas públicas, confira também o retorno HTTP, a URL canônica e o sitemap.
7. Registre a data da publicação, o domínio, a versão e o SHA do commit publicado. Guarde o pacote correspondente para poder restaurar os arquivos da versão anterior.

Em um rollback de código, restaure o pacote anterior e repita as verificações de produção. Se a versão publicada alterou o esquema, avalie a compatibilidade dos dados antes de restaurar o banco. [Instruções de produção no README](../README.md#publicar-na-hostinger)

## Onde investigar um problema

| Sintoma | Onde começar |
| --- | --- |
| Tela vazia ou rota com `#` abre a seção errada | Console do navegador, aba Rede, versão do JS e roteamento em `assets/js/app.js) |
| Página pública retorna 404 | Reescrita em `.htaccess`, roteamento em `exam.php` e equivalente local em `scripts/router.php` |
| Login, histórico ou ranking com erro | Resposta da API na aba Rede, configuração privada do MySQL, logs do PHP e leitura de esquema pelo [guia do banco](banco-de-dados.md) |
| Revisão ou rodada temática ausente em outro aparelho | Armazenamento local do navegador usado no momento do estudo |
| Prova com gabarito ou imagem incorretos | Manifestos de prova, PDF de origem e registros correspondentes em `app/questions.json` |
| Busca de bula ou fórmula desatualizada | Arquivo de conteúdo, documento de referência e testes do fluxo |
