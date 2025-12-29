# 🗺️ MAPA ESTRUTURAL DO SISTEMA - Dashboard Ouvidoria Duque de Caxias

**Data de Criação:** 11/12/2025  
**Última Atualização:** 12/12/2025  
**Versão:** 4.0 (Organizada e Limpa)  
**CÉREBRO X-3**

---

## 📋 ÍNDICE GERAL

Este mapa estrutural documenta **TODOS** os arquivos, pastas, sistemas globais, páginas, gráficos e componentes do sistema Dashboard.

### 📚 Documentos Principais (16 documentos)

#### 🏛️ ARQUITETURA
1. **[ARQUITETURA.md](./ARQUITETURA.md)** - Visão geral da arquitetura do sistema
   - Stack tecnológica completa
   - Diagramas de arquitetura
   - Fluxos principais
   - Componentes e estatísticas

#### 🟧 BACKEND
2. **[BACKEND.md](./BACKEND.md)** - Backend completo
   - 19 rotas detalhadas
   - 29 controllers documentados
   - 10 models explicados
   - Services, Utils e Pipelines

#### 🟦 FRONTEND
3. **[FRONTEND.md](./FRONTEND.md)** - Frontend completo
   - 42+ páginas documentadas
   - Sistemas globais
   - Módulos e integrações

4. **[PAGINAS.md](./PAGINAS.md)** - Detalhamento de páginas
   - Ouvidoria (20 páginas)
   - Zeladoria (14 páginas)
   - E-SIC (8 páginas)

5. **[SISTEMAS_GLOBAIS.md](./SISTEMAS_GLOBAIS.md)** - Sistemas globais (core/)
   - ChartFactory, DataLoader, GlobalStore
   - Crossfilter, Chart Communication
   - Config e Cache Config

6. **[GRAFICOS.md](./GRAFICOS.md)** - Sistema de gráficos
   - Chart.js integration
   - Sistema de cores inteligente
   - Tipos de gráficos suportados

#### 🔄 PIPELINE
7. **[PIPELINE.md](./PIPELINE.md)** - Pipeline Python completo
   - Processamento de dados
   - Normalização e validação
   - Integração com MongoDB

#### 📧 EMAILS
8. **[EMAILS.md](./EMAILS.md)** - Sistema de notificações
   - 6 tipos de templates
   - Gmail API (OAuth 2.0)
   - Scheduler automático

#### 💾 DADOS
9. **[DADOS.md](./DADOS.md)** - Modelos e estrutura
   - 10 modelos Mongoose
   - Índices e otimizações
   - Normalização de dados

#### 📚 DOCUMENTAÇÃO
10. **[DOC.md](./DOC.md)** - Índice da documentação técnica
    - 13 documentos organizados em 5 categorias
    - Estrutura: 01-configuracao/, 02-desenvolvimento/, 03-componentes/, 04-troubleshooting/, 05-referencia/
    - Consolidação completa: 24 documentos removidos, ~65% de redução
    - Guias de referência por perfil (Desenvolvedor, Administrador, Troubleshooting)

#### 📋 PLANEJAMENTO E ANÁLISE
11. **[PLANO_ORGANIZACAO.md](./PLANO_ORGANIZACAO.md)** - Plano de organização do sistema
    - Estrutura proposta
    - Fases de execução
    - Cronograma sugerido

12. **[ANALISE_REDUNDANCIAS.md](./ANALISE_REDUNDANCIAS.md)** - Análise completa de redundâncias
    - 23 documentos redundantes identificados
    - Proposta de consolidação
    - Métricas de redução

13. **[CHECKS_SISTEMA.md](./CHECKS_SISTEMA.md)** - Checklist de validação
    - 7 checks principais
    - Status de cada verificação
    - Prioridades de ação

14. **[RESUMO_ORGANIZACAO.md](./RESUMO_ORGANIZACAO.md)** - Resumo executivo
    - Status atual
    - Métricas e impacto
    - Próximos passos

15. **[VISUAL_REDUNDANCIAS.md](./VISUAL_REDUNDANCIAS.md)** - Visualização de redundâncias
    - Mapa visual dos grupos
    - Antes/Depois
    - Checklist de consolidação

---

## 🎯 QUICK START

### Para Entender o Sistema
1. **[ARQUITETURA.md](./ARQUITETURA.md)** - Comece aqui
2. **[README.md](./README.md)** - Este arquivo (índice completo)

### Para Trabalhar no Sistema
- **Backend:** [BACKEND.md](./BACKEND.md)
- **Frontend:** [FRONTEND.md](./FRONTEND.md) + [SISTEMAS_GLOBAIS.md](./SISTEMAS_GLOBAIS.md)
- **Pipeline:** [PIPELINE.md](./PIPELINE.md)
- **Emails:** [EMAILS.md](./EMAILS.md)
- **Dados:** [DADOS.md](./DADOS.md)

### Para Organizar Documentação
- **[PLANO_ORGANIZACAO.md](./PLANO_ORGANIZACAO.md)** - Plano completo
- **[ANALISE_REDUNDANCIAS.md](./ANALISE_REDUNDANCIAS.md)** - Análise detalhada
- **[CHECKS_SISTEMA.md](./CHECKS_SISTEMA.md)** - Checklist de validação
- **[VISUAL_REDUNDANCIAS.md](./VISUAL_REDUNDANCIAS.md)** - Visualização
- **[RESUMO_ORGANIZACAO.md](./RESUMO_ORGANIZACAO.md)** - Resumo executivo

---

## 🏗️ ESTRUTURA DO PROJETO

```
NOVO/
├── public/              # Frontend SPA
│   ├── scripts/
│   │   ├── core/        # Sistemas globais (8+ sistemas)
│   │   ├── pages/       # Páginas (42+ páginas)
│   │   ├── modules/     # Módulos auxiliares
│   │   └── utils/       # Utilitários frontend
│   └── index.html       # Página principal
│
├── src/                 # Backend Node.js
│   ├── api/
│   │   ├── controllers/ # 29 controllers
│   │   ├── routes/      # 19 rotas
│   │   └── middleware/  # Middlewares
│   ├── models/          # 10 modelos Mongoose
│   ├── services/        # Services (Email, Sync, Change Streams)
│   ├── utils/           # 25+ utilitários
│   │   └── pipelines/   # 8 pipelines MongoDB
│   ├── config/          # Configurações
│   └── server.js        # Servidor principal
│
├── config/              # Configurações (Gmail, Google)
├── data/                # Dados estáticos (JSON)
├── scripts/             # Scripts de manutenção
├── docs/                # Documentação técnica (13 docs organizados em 5 categorias)
└── mapa/                # Documentação estrutural (16 docs)
```

---

## 🎯 PRINCIPAIS COMPONENTES

### 🟦 Frontend (SPA Modular)

- **Sistemas Globais:** ChartFactory, DataLoader, GlobalStore, Crossfilter
- **Páginas:** Ouvidoria (20), Zeladoria (14), E-SIC (8)
- **Gráficos:** Chart.js com sistema de cores inteligente
- **Filtros:** Sistema global de filtros multi-dimensionais

### 🟧 Backend (Node.js + Express)

- **API REST:** 19 rotas principais
- **Controllers:** 29 controllers especializados
- **Models:** 10 modelos Mongoose
- **Services:** Email notifications, Data sync, Change streams

### 🟩 Banco de Dados

- **MongoDB Atlas:** Banco principal
- **Mongoose:** ODM para Node.js
- **Cache:** Sistema híbrido (memória + arquivo + banco)

---

## 📊 ESTATÍSTICAS DO PROJETO

### Frontend
- **Total de Páginas:** 42+ 
  - Ouvidoria: 20 páginas
  - Zeladoria: 14 páginas
  - E-SIC: 8 páginas
  - Central: 1+ páginas
- **Sistemas Globais:** 8+ sistemas core
- **Módulos:** Módulos auxiliares
- **Gráficos:** Chart.js com lazy loading

### Backend
- **Total de Controllers:** 29 controllers especializados
- **Total de Rotas:** 19 módulos de rotas
- **Total de Models:** 10 modelos Mongoose
- **Services:** 3 serviços principais
- **Utils:** 25+ utilitários backend
- **Pipelines:** 8 pipelines MongoDB modulares

### Dados
- **Collections:** 10 collections MongoDB
- **Índices:** 30+ índices otimizados
- **Cache:** Sistema híbrido (3 camadas)

### Integrações
- **Google Sheets:** Leitura/escrita automática
- **Gmail API:** Envio de emails automatizado
- **Gemini API:** Chat com IA
- **Colab API:** Integração com sistema Colab

### Documentação
- **Documentos Técnicos:** 13 (em NOVO/docs/ - organizados em 5 categorias)
- **Documentos Mapa:** 16 (nesta pasta - organizados por categoria)
- **Consolidação Realizada:** 24 documentos consolidados (~65% de redução)

---

## 🔍 COMO USAR ESTA DOCUMENTAÇÃO

### 🎯 Início Rápido

**Novo no projeto?** Comece por:
1. [ARQUITETURA.md](./ARQUITETURA.md) - Entenda a arquitetura geral
2. [README.md](./README.md) - Este arquivo (índice completo)

### 📚 Documentação por Categoria

#### 🟧 Backend
- **[BACKEND.md](./BACKEND.md)** - Visão completa do backend
  - 19 rotas detalhadas
  - 29 controllers documentados
  - 10 models explicados
  - Services e Utils

#### 🟦 Frontend
- **[FRONTEND.md](./FRONTEND.md)** - Visão completa do frontend
- **[PAGINAS.md](./PAGINAS.md)** - Detalhamento de todas as páginas
- **[SISTEMAS_GLOBAIS.md](./SISTEMAS_GLOBAIS.md)** - Sistemas globais (core/)
- **[GRAFICOS.md](./GRAFICOS.md)** - Sistema de gráficos e visualizações

#### 🔄 Pipeline
- **[PIPELINE.md](./PIPELINE.md)** - Pipeline Python completo
  - Fluxo de processamento
  - Normalização de dados
  - Integração com MongoDB

#### 📧 Emails
- **[EMAILS.md](./EMAILS.md)** - Sistema de notificações por email
  - 6 tipos de templates
  - Autenticação OAuth 2.0
  - Scheduler automático

#### 💾 Dados
- **[DADOS.md](./DADOS.md)** - Modelos e estrutura de dados
  - 10 modelos Mongoose
  - Índices e otimizações
  - Normalização

#### 📚 Documentação
- **[DOC.md](./DOC.md)** - Índice da documentação existente
  - 13 documentos organizados em 5 categorias
  - Estrutura: 01-configuracao/, 02-desenvolvimento/, 03-componentes/, 04-troubleshooting/, 05-referencia/
  - Consolidação completa realizada

#### 🏛️ Arquitetura
- **[ARQUITETURA.md](./ARQUITETURA.md)** - Visão geral arquitetural
  - Stack tecnológica
  - Fluxos principais
  - Componentes principais

### 🔧 Por Tarefa

**Quer trabalhar em:**
- **Backend?** → [BACKEND.md](./BACKEND.md)
- **Frontend?** → [FRONTEND.md](./FRONTEND.md) + [SISTEMAS_GLOBAIS.md](./SISTEMAS_GLOBAIS.md)
- **Pipeline?** → [PIPELINE.md](./PIPELINE.md)
- **Emails?** → [EMAILS.md](./EMAILS.md)
- **Dados?** → [DADOS.md](./DADOS.md)
- **Gráficos?** → [GRAFICOS.md](./GRAFICOS.md)
- **Filtros?** → [SISTEMAS_GLOBAIS.md](./SISTEMAS_GLOBAIS.md) (Crossfilter)

---

## 🎯 PRINCIPAIS RECURSOS

### Sistema de Filtros
- **Crossfilter multi-dimensional:** Filtros simultâneos (Status + Tema + Órgão + etc.)
- **Banner visual:** Mostra filtros ativos
- **Integração global:** Todos os gráficos reagem aos filtros
- **Histórico:** Sistema de histórico de filtros

### Cache Inteligente
- **3 Camadas:** Memória + Arquivo + Banco
- **TTLs Configuráveis:** Por tipo de dado
- **Invalidação Automática:** Via Change Streams
- **Deduplicação:** Evita requisições duplicadas

### Performance
- **Agregações no Banco:** MongoDB Native Driver
- **Lazy Loading:** Chart.js e Leaflet carregados sob demanda
- **Retry Automático:** Com backoff exponencial
- **Timeouts Adaptativos:** Por tipo de endpoint

### Notificações
- **6 Tipos de Templates:** 15 dias, vencimento, 30 dias, 60 dias, consolidação, resumo
- **Agendamento Automático:** Diário às 8h
- **OAuth 2.0:** Autenticação segura com Gmail API
- **Histórico Completo:** Registro de todos os envios

### IA e Chat
- **Gemini Integration:** Chat inteligente com dados do sistema
- **Reindexação:** Contexto atualizado automaticamente
- **Rotação de Chaves:** Múltiplas chaves API

---

## ⚠️ REGRAS IMPORTANTES

### ❌ NUNCA FAZER
- ❌ Trabalhar na pasta `ANTIGO/` - Sistema legado
- ❌ Ignorar cache e TTLs
- ❌ Gerar código sem explicar decisões importantes
- ❌ Quebrar arquitetura do projeto NOVO
- ❌ Gerar payloads excessivos
- ❌ Modificar planilhas fora da pasta oficial

### ✅ SEMPRE FAZER
- ✅ Trabalhar exclusivamente em `NOVO/`
- ✅ Seguir padrões arquiteturais definidos
- ✅ Manter documentação atualizada
- ✅ Usar cache inteligente
- ✅ Otimizar queries e agregações
- ✅ Validar e sanitizar inputs
- ✅ Documentar decisões importantes

---

## 🔗 LINKS ÚTEIS

### Documentação Externa
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Mongoose Docs](https://mongoosejs.com/)
- [Chart.js Docs](https://www.chartjs.org/)
- [Express.js Docs](https://expressjs.com/)
- [Gmail API](https://developers.google.com/gmail/api)
- [Gemini API](https://ai.google.dev/)

### Documentação Interna
- [NOVO/docs/](../docs/) - 13 documentos técnicos organizados em 5 categorias
- [NOVO/mapa/](./) - Esta documentação estrutural (16 documentos)

---

## 📝 MANUTENÇÃO

### Atualização de Documentação
- **Quando atualizar:** Após mudanças significativas no código
- **O que atualizar:** Documentos relacionados à mudança
- **Como atualizar:** Manter formato e estrutura consistente

### Versionamento
- **Data:** Sempre atualizar data de última modificação
- **Versão:** Incrementar versão em mudanças maiores
- **Changelog:** Documentar mudanças importantes

---

**Última Atualização:** 12/12/2025  
**Versão:** 4.0

