# 📊 Dashboard Ouvidoria - Prefeitura de Duque de Caxias

**Sistema completo de análise e gestão de dados da Ouvidoria Geral**

[![Status](https://img.shields.io/badge/status-100%25%20operacional-brightgreen)]()
[![Versão](https://img.shields.io/badge/versão-3.0.0-blue)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)]()

---

## 🚀 Início Rápido

```bash
# Entrar na pasta do sistema
cd NOVO

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar servidor
npm start

# Acessar dashboard
http://localhost:3000
```

**Documentação completa**: [NOVO/README.md](NOVO/README.md)

---

## 📁 Estrutura do Repositório

```
Dashboard/
├── NOVO/                    # ⭐ Sistema principal (backend + frontend)
│   ├── src/                 # Backend (Express + MongoDB)
│   │   ├── api/             # Controllers e rotas (19 controllers, 14 rotas)
│   │   ├── services/        # Serviços (email, cache, etc)
│   │   ├── models/          # Modelos Mongoose (9 modelos)
│   │   ├── utils/           # Utilitários (23 arquivos)
│   │   ├── config/          # Configurações
│   │   ├── cron/            # Tarefas agendadas
│   │   └── server.js        # Servidor principal
│   │
│   ├── public/              # Frontend (SPA vanilla)
│   │   ├── scripts/         # JavaScript modular
│   │   │   ├── core/        # Sistemas globais (8 sistemas)
│   │   │   ├── pages/       # Páginas do dashboard (42 páginas)
│   │   │   ├── modules/     # Módulos reutilizáveis
│   │   │   └── utils/       # Utilitários frontend
│   │   ├── index.html       # Página principal
│   │   ├── zeladoria.html   # Dashboard Zeladoria
│   │   └── esic.html        # Dashboard ESIC
│   │
│   ├── scripts/             # Scripts de manutenção
│   │   ├── data/            # Sincronização de dados
│   │   ├── email/           # Notificações
│   │   ├── maintenance/     # Manutenção
│   │   ├── server/          # Controle do servidor
│   │   ├── setup/           # Configuração inicial
│   │   └── test/            # Testes
│   │
│   ├── docs/                # Documentação completa
│   │   ├── setup/           # Guias de configuração
│   │   ├── system/          # Documentação técnica
│   │   └── troubleshooting/ # Solução de problemas
│   │
│   ├── config/              # Configurações (não versionadas)
│   ├── data/                # Dados estáticos
│   └── db-data/             # Cache persistente
│
├── Pipeline/                # Pipeline Python para processamento
│   ├── main.py             # Pipeline principal
│   ├── utils/              # Utilitários Python
│   └── requirements.txt    # Dependências Python
│
└── README.md               # Este arquivo
```

---

## 🎯 Funcionalidades Principais

### 📊 Dashboard Analytics

- **Visão Geral**: KPIs, gráficos e análises consolidadas
- **Por Órgão e Mês**: Análise detalhada por secretaria
- **Tempo Médio**: Análise de tempo de atendimento
- **Vencimentos**: Controle de prazos e alertas
- **Filtros Inteligentes**: Sistema crossfilter multi-dimensional
- **34 Páginas**: Dashboard completo com análises detalhadas

### 🤖 Automação

- **Sincronização automática** com Google Sheets
- **Notificações por email** automáticas (15 dias, vencimento, 30 dias, 60 dias)
- **Processamento de dados** via pipeline Python
- **Cache híbrido** (memória + arquivo + banco) - 8 sistemas de cache
- **Cron jobs** para agendamento diário

### 🔗 Integrações

- **Google Sheets API**: Sincronização de dados
- **Gmail API** (OAuth 2.0): Envio de notificações
- **Gemini AI**: Chat inteligente com contexto dos dados
- **MongoDB Atlas**: Banco de dados principal

### 📧 Sistema de Notificações

- **Alertas automáticos** por email para secretarias
- **Notificações de vencimento** (15 dias antes, vencimento, 30 dias, 60 dias)
- **Resumo diário** para Ouvidoria Geral
- **Prevenção de duplicatas** e rastreamento completo

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `NOVO/`:

```env
# MongoDB
MONGODB_ATLAS_URL=mongodb+srv://...

# Google Sheets
GOOGLE_SHEET_ID=1aF0I8pxABXhqyO2DmzBV9aoWHQN2h7LpTN-qdkGLc_g
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_RANGE=Dados!A1:Z1000
GOOGLE_FOLDER_BRUTA=1qXj9eGauvOREKVgRPOfKjRlLSKhefXI5

# Email
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
NOME_REMETENTE=Ouvidoria Geral de Duque de Caxias
EMAIL_PADRAO_SECRETARIAS=ouvidoria@duquedecaxias.rj.gov.br
EMAIL_OUVIDORIA_GERAL=ouvgeral.gestao@gmail.com

# Gemini AI
GEMINI_API_KEY=...

# Pipeline
SKIP_PYTHON=false
```

### Credenciais Necessárias

- **Google Sheets**: `config/google-credentials.json` (Service Account)
- **Gmail API**: `config/gmail-credentials.json` (após autorização OAuth)
- **MongoDB Atlas**: String de conexão no `.env`

**Guia completo de setup**: [NOVO/docs/setup/](NOVO/docs/setup/)

---

## 🛠️ Scripts Principais

```bash
# Servidor
cd NOVO
npm start                  # Iniciar servidor
npm run dev               # Modo desenvolvimento

# Dados
npm run update:sheets     # Atualizar do Google Sheets
npm run pipeline          # Executar pipeline Python
npm run import:zeladoria  # Importar dados Zeladoria
npm run import:esic       # Importar dados ESIC

# Email
npm run gmail:auth        # Autenticar Gmail

# Testes
npm run test:all          # Executar todos os testes
npm run test:pages        # Testar páginas
npm run test:apis         # Testar APIs

# Manutenção
npm run setup             # Setup inicial
npm run map:system        # Mapear sistema
```

---

## 🏗️ Arquitetura

### Backend

- **Node.js + Express.js**
- **MongoDB Atlas** (Mongoose + Native Driver)
- **Sistema de Cache** híbrido (8 sistemas)
- **Logging** estruturado (Winston)
- **Rotas modulares** por domínio
- **19 Controllers** - Lógica de negócio
- **14 Rotas** - API modular
- **9 Modelos** - Schemas Mongoose
- **23 Utilitários** - Funções auxiliares

### Frontend

- **SPA vanilla** (sem frameworks)
- **ChartFactory** para gráficos padronizados
- **DataLoader** para carregamento unificado
- **Crossfilter** para filtros inteligentes
- **Lazy loading** de bibliotecas (Chart.js, Leaflet)
- **8 Sistemas Globais** - Funcionalidades compartilhadas
- **42 Páginas** - Dashboard completo

### Scripts

- **Pipeline Python** para processamento de dados
- **Cron jobs** para automação (vencimentos diários)
- **Sincronização** Google Sheets → MongoDB
- **Scripts de manutenção** e testes

---

## 📚 Documentação

### Documentação Principal

- **[NOVO/README.md](NOVO/README.md)** - Documentação completa do sistema
- **[NOVO/docs/README.md](NOVO/docs/README.md)** - Índice da documentação

### Setup e Configuração

- [Google Sheets Setup](NOVO/docs/setup/GOOGLE_SHEETS_SETUP.md) - Configuração de sincronização
- [Pipeline Setup](NOVO/docs/setup/PIPELINE_SETUP.md) - Configuração do pipeline Python
- [Gmail Setup](NOVO/docs/setup/SETUP_GMAIL.md) - Configuração de notificações por email

### Sistema Técnico

- [Índice do Sistema](NOVO/docs/system/INDICE_SISTEMA.md) - Índice completo
- [Sistemas de Cache](NOVO/docs/system/SISTEMAS_CACHE.md) - Guia de cache
- [Sistemas Globais](NOVO/docs/system/SISTEMAS_GLOBAIS_COMPLETO.md) - Documentação dos sistemas globais
- [Guia de Logging](NOVO/docs/system/GUIA_LOGGING.md) - Sistema de logging
- [Planilhas, Pipeline e Emails](NOVO/docs/system/PLANILHAS_PIPELINE_EMAILS.md) - Sistema completo

### Troubleshooting

- [Troubleshooting Gmail](NOVO/docs/troubleshooting/TROUBLESHOOTING_GMAIL.md) - Problemas com email
- [Gemini Quota](NOVO/docs/troubleshooting/GEMINI_QUOTA.md) - Gestão de quota da API

---

## 🔧 Tecnologias

### Backend
- **Node.js** (>=18.0.0)
- **Express.js** - Framework web
- **MongoDB Atlas** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **Winston** - Sistema de logging
- **Node-cache** - Cache em memória
- **Node-cron** - Agendamento de tarefas

### Frontend
- **Vanilla JavaScript** (ES Modules)
- **Chart.js** - Gráficos (lazy loaded)
- **Leaflet** - Mapas (lazy loaded)
- **Crossfilter** - Filtros multi-dimensionais

### Scripts e Integrações
- **Python 3** - Pipeline de processamento
- **Pandas** - Manipulação de dados
- **Gspread** - Integração Google Sheets
- **Google APIs** - Sheets, Drive, Gmail
- **Gemini AI** - Chat inteligente

---

## 📊 Estatísticas do Sistema

### Backend
- **19 Controllers** - Lógica de negócio
- **14 Rotas** - API modular
- **9 Modelos** - Schemas Mongoose
- **23 Utilitários** - Funções auxiliares
- **~58 Endpoints** - API completa

### Frontend
- **42 Páginas** - Dashboard completo
- **8 Sistemas Globais** - Funcionalidades compartilhadas
- **SPA Modular** - Zero frameworks
- **ChartFactory** - Gráficos padronizados

### Scripts
- **30+ Scripts** - Manutenção e utilitários
- **Pipeline Python** - Processamento de dados
- **Cron Jobs** - Automação diária

---

## ✅ Status do Sistema

✅ **100% Operacional e Pronto para Produção**

- ✅ Backend completo e otimizado
- ✅ Frontend modular e responsivo
- ✅ Sistema de filtros inteligentes
- ✅ Notificações automáticas
- ✅ Integração com Google Sheets
- ✅ Cache híbrido implementado (8 sistemas)
- ✅ Logging estruturado
- ✅ Documentação completa
- ✅ Pipeline Python funcional
- ✅ Sistema de emails automatizado
- ✅ Integração com Gemini AI

---

## 📝 Notas Importantes

### Regras do Sistema (CÉREBRO X-3)

- Trabalha **exclusivamente** na pasta `NOVO/`
- **Nunca** trabalha no sistema ANTIGO
- Sempre modular, escalável e otimizado
- Mantém separação de responsabilidades
- Respeita caching e TTLs
- Sempre documenta decisões importantes

### Normalização de Dados

- Campos padronizados: `protocolo`, `dataCriacaoIso`, `statusDemanda`, etc.
- Pipeline Python normaliza antes de importar
- Validação automática de campos obrigatórios
- Datas sempre em formato ISO (YYYY-MM-DD)

### Sistema de Cache

O sistema possui **8 sistemas de cache** diferentes:
1. Cache em memória (Node-cache)
2. Cache em arquivo (JSON)
3. Cache no MongoDB
4. Cache de agregações
5. Cache de endpoints
6. Cache de dados globais
7. Cache de templates
8. Cache de configurações

---

## 🔄 Fluxo de Dados

```
Google Sheets (Bruta)
    ↓
Pipeline Python (Normalização)
    ↓
Google Sheets (Tratada)
    ↓
Node.js (Importação)
    ↓
MongoDB Atlas
    ↓
Dashboard (Visualização)
    ↓
Sistema de Notificações (Emails)
```

---

## 🆘 Suporte

Para problemas ou dúvidas:

1. Consulte a [documentação](NOVO/docs/)
2. Verifique os [logs](NOVO/logs/)
3. Revise o [troubleshooting](NOVO/docs/troubleshooting/)
4. Execute testes: `npm run test:all`

---

## 📄 Licença

MIT

---

## 👥 Autores

**CÉREBRO X-3**  
**Sistema de Ouvidoria - Prefeitura de Duque de Caxias**  
**Última atualização**: Dezembro 2025

---

## 🔗 Links Úteis

- [Repositório GitHub](https://github.com/ouvidoriag/ogdash2)
- [Documentação Completa](NOVO/docs/)
- [Guia de Setup](NOVO/docs/setup/)

---

**Desenvolvido com ❤️ para a Prefeitura de Duque de Caxias**
