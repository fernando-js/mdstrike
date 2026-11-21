# Mapa de arquivos do MD Strike

Comece por `index.html` para entender a entrada da aplicação, `assets/js/app.js` para seguir uma tela e `api/index.php` para seguir uma ação que usa a conta. O [guia de operação](operacao.md) mostra como testar as mudanças antes de gerar um pacote.

## Raiz e publicação

| Arquivo ou diretório | Função |
| --- | --- |
| [index.html](../index.html) | Estrutura do site, menu, metadados e script principal |
| [exam.php](../exam.php) | Entrada PHP das páginas públicas, dos cadernos e do sitemap |
| [.htaccess](../.htaccess) | Reescritas de URL e cabeçalhos da hospedagem |
| [robots.txt](../robots.txt) e [indexnow.txt](../indexnow.txt) | Referência ao sitemap e arquivo público de verificação do IndexNow |
| [package.json](../package.json) e [package-lock.json](../package-lock.json) | Comandos npm, dependências e versões fixadas |
| [.env.example](../.env.example) e [app/config.example.php](../app/config.example.php) | Modelos de configuração. Credenciais reais ficam na configuração privada da hospedagem |
| `index-legacy.html` e `indexold.html` | Versões antigas de referência |
| `node_modules/`, `.runtime/`, `release/`, `backups/` | Dependências, banco local, pacote gerado e backups. Pastas de trabalho ignoradas pelo Git |

## PHP e API

| Arquivo | Função |
| --- | --- |
| [api/index.php](../api/index.php) | Entrada da API. Cadastro, sessão, perfil, ranking, partida e encaminhamento para rotinas específicas |
| [app/bootstrap.php](../app/bootstrap.php) | Configuração, PDO, esquema, sessões, autenticação e auditoria |
| [app/security.php](../app/security.php) | Validação da rota e do método, limites de uso, manutenção e filtro de partidas elegíveis |
| [app/admin.php](../app/admin.php) | Consultas administrativas |
| [app/challenges.php](../app/challenges.php) | Geração de convites, vínculo de tentativas e placares de desafios |
| [app/revalida.php](../app/revalida.php) | Histórico da operação, marcações, entrega, correção e agregados do Revalida |
| [app/education.php](../app/education.php) e [app/avatar.php](../app/avatar.php) | Validação e persistência da formação e do avatar |
| [app/cid10.php](../app/cid10.php) | Normalização e busca por código, nome e termos associados no índice local |
| [app/medical-pages.php](../app/medical-pages.php) e [app/medical-page.php](../app/medical-page.php) | Conteúdo e renderização das páginas públicas de Medicina e CID-10 |
| [app/enamed-results.php](../app/enamed-results.php), [app/enamed-results-page.php](../app/enamed-results-page.php) e [app/enamed-results-view.php](../app/enamed-results-view.php) | Dados, roteamento e HTML da central de resultados do Enamed |
| [scripts/router.php](../scripts/router.php) | Roteador do servidor PHP de desenvolvimento |

## Interface e lógica de jogo

Os arquivos abaixo estão em [assets/js/](../assets/js/).

| Arquivos | Responsabilidade |
| --- | --- |
| `app.js`, `app-navigation.js`, `views.js`, `core.js` | Rotas, eventos, histórico de navegação, componentes de tela, sessão, API e armazenamento |
| `game.js`, `challenges.js`, `revalida.js` | Partidas, desafios por link e fluxo de simulado Revalida |
| `catalog.js`, `practice-bank.js` | Catálogo e banco de treino gerados para o navegador |
| `admin.js`, `avatar.js`, `education.js` | Painel, editor de avatar e formulário de formação |
| `pdf-viewer.js`, `enamed-results.js` | Leitor de cadernos e interações na central pública do Enamed |
| `medical-resources.js`, `medical-tools.js` | Telas de estudo e consulta, filtros, agenda de revisão e cálculo das fórmulas |
| `study-content.js`, `clinical-content.js`, `medical-societies.js` | Resumos, PBL, protocolos e links de sociedades brasileiras |
| `medication-content.js` | Fichas de medicamentos e referências de bulas |
| `ecg-course.js`, `ecg-content.js`, `ecg-progress.js`, `ecg-trace.js` | Aulas, questões, progresso e desenho dos traçados de ECG |
| `coding-game.js`, `coding-content.js`, `medical-quiz-content.js` | Jogo de codificação, busca de códigos e rodadas de História, Epônimos e Medicamentos |
| `policies.js` | Textos públicos de privacidade e regras de ranking |

[assets/style.css](../assets/style.css) concentra o estilo do site. [assets/enamed-results.css](../assets/enamed-results.css) cuida do layout específico da central de resultados.

## Dados e arquivos estáticos

| Arquivo ou diretório | Conteúdo |
| --- | --- |
| `app/catalog.json` e `app/questions.json` | Catálogo e banco consolidado usados pelo PHP |
| `app/official-exams.json` e `app/official-questions.json` | Manifesto e itens importados de Enamed e Enare |
| `app/revalida-exams.json` e `app/revalida-questions.json` | Manifesto, critérios e itens importados das edições do Revalida |
| `app/enamed-results.json` | Resultados públicos agregados de cursos, estados e Brasil |
| `app/cid10-selection.json` | Seleção de códigos, rótulos oficiais e termos de busca para a página de CID-10 |
| `app/institutions.json` e `assets/data/institutions.json` | Dados de referência das instituições usados pelo PHP e pelo navegador |
| `assets/data/avatar-catalog.json` | IDs de peças, retratos e pontos de encaixe dos avatares |
| `assets/data/ecg-293.json` e `assets/data/ecg-4117.json` | Amostras dos dois traçados do PTB-XL usados no curso |
| `assets/documents/` | PDFs dos cadernos e gabaritos |
| `assets/images/` e `assets/images/avatars/` | Artes dos mapas, retratos e peças |
| `assets/fonts/` e `assets/pdfjs/` | Fontes do site, biblioteca PDF.js, fontes do leitor e licenças |
| `favicon.ico`, `assets/favicon.svg`, `assets/favicon-32.png`, `assets/apple-touch-icon.png` | Ícones do site |

`scripts/content.mjs` gera os catálogos consolidados do servidor e do navegador. Para mudar uma prova, mantenha seus arquivos de origem e regenere os derivados juntos. [Gerador de catálogo](../scripts/content.mjs)

## Ferramentas de manutenção e testes

| Arquivo ou diretório | Responsabilidade |
| --- | --- |
| `scripts/check.mjs` | Validação de sintaxe PHP e JavaScript e consistência de mapas, questões e cadernos |
| `scripts/content.mjs` | Consolidação de conteúdo e atualização dos dados do navegador |
| `scripts/import-official.py`, `scripts/import-revalida.mjs` | Importação de PDFs e gabaritos |
| `scripts/import-institutions.py`, `scripts/import-enamed-results.py` | Importação de catálogo acadêmico e resultados agregados do Inep |
| `scripts/package.mjs` | Geração da pasta pública e do ZIP de publicação |
| `scripts/vendor-pdf.mjs` | Cópia da versão instalada de PDF.js para os arquivos estáticos |
| `scripts/qa-capture.mjs` | Capturas de interface e geração de ícones raster |
| `tests/*.test.mjs` | Testes de conteúdo, banco, segurança, fórmulas e pacote |
| `tests/browser/*.spec.js` e `playwright.config.js` | Testes no Chrome e configuração do servidor local |

Para listar os arquivos do projeto a partir da raiz, incluindo alterações locais ainda sem commit, use o Git. Para conferir exatamente o que entrou no pacote público, liste a pasta gerada após o empacotamento.

```sh
git ls-files --cached --others --exclude-standard
find release/public_html -type f | sort
```
