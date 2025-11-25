# 📊 Dashboard Ouvidoria – Documentação Unificada

## 1. Objetivo do Sistema
O repositório concentra a versão 3.0 do dashboard analítico da Ouvidoria e da Zeladoria de Duque de Caxias/RJ. O sistema entrega:
- **Monitoramento em tempo real** das manifestações (protocolos, temas, status, SLA).
- **Painel Zeladoria** com métricas próprias (categorias, bairros, departamentos e geolocalização).
- **Camada de cache híbrida** (memória + MongoDB + arquivo) para acelerar agregações.
- **Camada de IA/Chat** (Gemini) para responder dúvidas com base nos dados indexados.

## 2. Organização do Repositório
- `NOVO/` – Código da versão refatorada (backend Express/Prisma + frontend vanilla modular). Todos os comandos `npm` do root apontam para cá.
- `ANTIGO/` – Snapshot da versão anterior para referência histórica. O código ainda pode ser consultado, mas não recebe mais evoluções.
- `package.json` (root) – Scripts que encapsulam a operação dentro de `NOVO/` e travas de versão (`node >= 18`, `npm >= 9`).
- `render.yaml`, `Procfile`, `DEPLOY_RENDER` (removidos) – substituídos por esta documentação, mas o pipeline Render/Heroku continua válido via scripts atuais.
- `data/`, `db-data/` – Seeds auxiliares (secretarias, unidades de saúde) e artefatos de cache persistente (`universal-cache.json`).

## 3. Arquitetura Geral
| Camada | Descrição |
| --- | --- |
| **Backend** | `NOVO/src/server.js` levanta Express com `compression`, `cors`, `morgan`, estáticos de `public/` e health check `/api/health`. Usa Prisma + MongoDB Atlas e mantém também um cliente nativo (`getMongoClient`) para operações especiais. |
| **API Modular** | `src/api/routes` organiza rotas por domínio: `aggregate`, `stats`, `data`, `cache`, `chat`, `ai`, `geographic` e `zeladoria`. Cada rota injeta `prisma` e, quando necessário, o cliente Mongo nativo. |
| **Camada de Dados** | Prisma (`prisma/schema.prisma`) define `Record`, `Zeladoria`, `ChatMessage` e `AggregationCache` com índices específicos para as consultas do dashboard. |
| **Cache Híbrido** | `src/utils/cacheManager.js` mantém cache em arquivo, `cacheBuilder.js` pré-computa agregações e agenda atualizações diárias; `src/config/cache.js` inicia o pipeline. |
| **Frontend** | `public/` serve o SPA vanilla. `scripts/main.js` controla a navegação, `core/` concentra `global-store`, `dataLoader`, `chart-factory`, `chart-communication`, `chart-legend` e `config` global; `pages/` traz loaders por assunto (tema, bairro, canal etc.) e `zeladoria-*.js` para o módulo paralelo. |
| **Integração IA/Chat** | `src/utils/geminiHelper.js` gerencia rotação de chaves Gemini (`GEMINI_API_KEY*`), e as rotas `chat`/`ai` expõem reindexação e insights. |

## 4. Backend em Detalhes
### 4.1 Inicialização
1. Validação das variáveis (`MONGODB_ATLAS_URL`, `PORT`, chaves Gemini).
2. Prisma conecta, conta registros de chat e injeta `DATABASE_URL` dinamicamente.
3. `initializeCache(prisma)` carrega o cache persistente (`db-data/universal-cache.json`) e agenda rebuild diário.
4. `initializeGemini()` lista as chaves disponíveis.
5. Servidor inicia e expõe logs operacionais (cache híbrido, otimizações ativas).

### 4.2 Rotas Principais
- `GET /api/summary` – KPIs, totais por tipo/categoria.
- `GET /api/dashboard-data` – pacote com agregações paralelas (mês, dia, status, tema, órgão etc.).
- `GET /api/records` + `POST /api/filter` – listagem paginada e filtros avançados.
- `GET /api/distinct`, `/api/unit/:unitName`, `/api/complaints-denunciations`, `/api/sla/summary` – endpoints específicos usados pelos cards.
- `GET /api/meta/aliases`, `POST /api/chat/reindex`, `GET /api/export/database` – utilidades para manutenção e suporte.
- `GET /api/aggregate/*` e `GET /api/stats/*` – agregações especializadas (mês, SLA, top ocorrências, projeções).
- `GET /api/cache/*` – inspeção/invalidação do cache universal.
- `GET /api/secretarias`, `/api/distritos`, `/api/unidades-saude` – dados estáticos carregados de `NOVO/data`.
- `GET /api/zeladoria/*` – espelha a mesma estrutura para o dataset secundário.

### 4.3 Scripts e Automação
- `NOVO/scripts/setup.js` roda em `postinstall/prestart`: gera o Prisma Client com retries, verifica o banco e orienta o operador.
- `scripts/importZeladoria.js`, `normalizeFields.js`, `updateFromExcel.js` – pipeline para normalizar planilhas/CSVs e popular Mongo.
- `scripts/restart-server.*`, `start*.sh` – utilidades de infraestrutura (Render, cPanel, deploy manual).

## 5. Frontend em Detalhes
### 5.1 Navegação e Estados Globais
- `public/index.html` carrega os bundles `scripts/main.js`, `scripts/zeladoria-main.js` e ativa menus paralelos (Ouvidoria vs Zeladoria).
- `main.js` controla SPA: seleção de seção, roteamento via `data-page`, listeners globais (`Esc` limpa filtros) e prefetch de `/api/summary` e `/api/dashboard-data`.
- `core/global-store.js` é a “single source of truth”: TTL dinâmico por endpoint, cache persistente (`localStorage`), listeners e métricas internas.
- `core/dataLoader.js` unifica fetch/timeout/retry, deduplica requests paralelos e injeta no `dataStore` (inclusive replicando partes de `dashboard-data` em chaves derivadas).

### 5.2 Gráficos e Comunicação
- `core/chart-factory.js` padroniza criação dos gráficos (Chart.js + plugin datalabels), aplica paleta dinâmica e integra com `chartCommunication` para filtros cruzados.
- `core/chart-communication.js` propaga cliques para o sistema de filtros, gerando feedback visual e mantendo coerência entre cards.
- `core/chart-legend.js` monta legendas interativas e mantém estado consistente nas páginas densas.

### 5.3 Páginas e Módulos
- `public/scripts/pages/*.js` contém o loader de cada tela (tema, assunto, canal, categoria, prioridade, unidade etc.), sempre consumindo `dataLoader` e `chartFactory`.
- `pages/overview.js` (arquivo extenso) centraliza dashboards complexos (KPIs hero, timeline mensal/diária, ranking de órgãos, semáforo SLA).
- `pages/zeladoria-*.js` atendem ao conjunto Zeladoria (status, categoria, departamento, mapa geográfico).
- `modules/data-tables.js` gera tabelas responsivas reutilizáveis e aplica filtros condizentes com o resto do SPA.
- `utils/logger.js`, `utils/dateUtils.js`, `utils/generate-unit-pages.js` e `utils/lazy-libraries.js` completam a fundação com logging, manipulação temporal, geração dinâmica de páginas e carregamento sob demanda (Chart.js, Leaflet, etc.).

## 6. Fluxo de Dados End-to-End
1. **Ingestão** – Planilhas/CSVs são normalizados via scripts e gravados no Mongo (`records`, `zeladoria`). Campos derivados (`dataCriacaoIso`, índices compostos) otimizam os filtros pesados.
2. **Servidor** – Ao iniciar, Express expõe rotas, carrega cache universal e, conforme os endpoints são acessados, usa Prisma + agregações Mongo nativas para obter dados. Resultados críticos são salvos em `AggregationCache` ou no arquivo persistente.
3. **Frontend** – O SPA requisita `summary`/`dashboard-data` logo após o load, armazena no `dataStore` e injeta os blocos em múltiplos componentes. Interações (cliques, filtros, troca Ouvidoria/Zeladoria) apenas reutilizam o cache local antes de refazer chamadas (com TTLs configuráveis).
4. **Chat/IA** – O endpoint `/api/chat/reindex` reconstrói o contexto no banco e os controllers `chat`/`ai` usam as chaves Gemini para gerar respostas contextualizadas.

## 7. Configuração, Execução e Deploy
1. **Pré-requisitos**: Node 18+, npm 9+, MongoDB Atlas (ou instância compatível), chaves Gemini (opcional, mas recomendado), acesso a variáveis de ambiente.
2. **Variáveis**:
   - `MONGODB_ATLAS_URL` (obrigatória; o sistema adiciona parâmetros de timeout/SSL automaticamente).
   - `PORT` (opcional, default 3000).
   - `GEMINI_API_KEY`, `GEMINI_API_KEY_2` (opcional, para IA).
3. **Instalação**:
   ```bash
   npm install        # executa postinstall -> NOVO/scripts/setup.js
   npm run setup      # reexecuta setup se necessário
   npm start          # inicia Express + frontend estático
   ```
4. **Deploy**: 
   - Render/Heroku/CPanel usam os scripts existentes (`start.sh`, `Procfile`, `render.yaml`). Basta apontar o build command para `npm install` na raiz e configurar `MONGODB_ATLAS_URL` + `GEMINI_API_KEY*` no ambiente.
   - Para rodar em hosts compartilhados (cPanel), há scripts auxiliares em `NOVO/scripts/` (`restart-server.*`, `COMO_RODAR_NO_CPANEL.md` foi substituído por esta seção).

## 8. Observabilidade e Manutenção
- **Logs**: `morgan` (HTTP) + console estruturado no backend; no frontend, `public/scripts/utils/logger.js` expõe `window.Logger` para controlar nível de verbosidade e aplicar prefixos visuais.
- **Health Check**: `/api/health` retorna `status`, `version` e confirma dependências básicas.
- **Tratamento de Erros**: `src/utils/responseHelper.js` encapsula respostas JSON padronizadas, aplica timeouts e traduz falhas de conexão em códigos 503/504.
- **Cache**: `cacheManager` registra carregamentos/salvamentos com emojis para rápida inspeção via logs de servidor.
- **Shutdown Seguro**: handlers `beforeExit`, `SIGINT`, `SIGTERM` garantem `prisma.$disconnect()` e fechamento do cliente Mongo nativo.

## 9. Extensões e Pontos de Atenção
- **Novos KPIs**: implemente consultas em `src/api/controllers/*`, exponha via rota adequada e consuma com um loader em `public/scripts/pages/`. Reaproveite `chartFactory` e registre o gráfico em `chartCommunication` para filtros globais.
- **Data Lake Alternativo**: caso novas planilhas sejam adicionadas, atualize `prisma/schema.prisma`, rode `npm run prisma:generate` e adapte `scripts/normalizeFields.js`.
- **Zeladoria**: mantém modelo isolado (`Zeladoria`) para evitar colisões de schema. Sempre utilizar os scripts dedicados para importação e checar `public/scripts/pages/zeladoria-*` para refletir campos adicionais.
- **IA**: ao incluir novas fontes para o chat, reindexe com `POST /api/chat/reindex` e valide o balanceamento das chaves Gemini (`geminiHelper` já rotaciona automaticamente).

---
Esta documentação substitui todos os relatórios e guias anteriores. Qualquer atualização futura deve partir deste arquivo para manter o histórico simples e auditável.

