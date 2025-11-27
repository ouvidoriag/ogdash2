# 📑 Índice Completo do Sistema

## 🎯 Acesso Rápido

### 📚 Documentação
- [README.md](../README.md) - Documentação principal
- [MAPEAMENTO_COMPLETO_SISTEMA.md](./MAPEAMENTO_COMPLETO_SISTEMA.md) - Mapeamento detalhado
- [ORGANIZACAO_ARQUIVOS.md](./ORGANIZACAO_ARQUIVOS.md) - Organização de arquivos
- [LIMPEZA_ARQUIVOS.md](./LIMPEZA_ARQUIVOS.md) - Guia de limpeza

### 🔧 Setup
- [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) - Setup Google Sheets
- [PIPELINE_SETUP.md](./PIPELINE_SETUP.md) - Setup Pipeline Python
- [SETUP_GMAIL.md](./SETUP_GMAIL.md) - Setup Gmail

### 🧪 Testes e Verificação
- [VERIFICACAO_PAGINAS_COMPLETA.md](./VERIFICACAO_PAGINAS_COMPLETA.md) - Verificação de páginas
- [ANALISE_SCRIPTS_SERVIDOR.md](./ANALISE_SCRIPTS_SERVIDOR.md) - Análise de scripts
- [RESUMO_ORGANIZACAO.md](./RESUMO_ORGANIZACAO.md) - Resumo da organização

## 📊 Resumo do Sistema

### Backend
- **19 Controllers** - Lógica de negócio
- **11 Routes** - Rotas da API
- **9 Utils** - Utilitários
- **Total:** ~39 arquivos backend

### Frontend
- **7 Core** - Sistema core
- **34 Pages** - Páginas do sistema
- **5 Utils** - Utilitários frontend
- **Total:** ~46 arquivos frontend

### Scripts
- **23 Scripts** - Manutenção e utilitários

### Total Geral
- **~108 arquivos principais**
- **34 páginas implementadas**
- **~58 endpoints API**

## 🗂️ Estrutura por Categoria

### 🔧 Backend (`src/`)
```
src/
├── server.js                    # Servidor principal
├── api/
│   ├── controllers/            # 19 controllers
│   └── routes/                 # 11 rotas
├── config/                     # Configurações
├── cron/                       # Tarefas agendadas
├── services/                   # Serviços (email)
└── utils/                      # 9 utilitários
```

### 🎨 Frontend (`public/`)
```
public/
├── index.html                  # HTML principal
├── zeladoria.html              # HTML Zeladoria
└── scripts/
    ├── core/                   # 7 arquivos core
    ├── pages/                  # 34 páginas
    ├── modules/                # Módulos
    └── utils/                  # 5 utilitários
```

### 🔧 Scripts (`scripts/`)
```
scripts/
├── runPipeline.js              # Pipeline principal
├── setup.js                    # Setup sistema
├── updateFromGoogleSheets.js   # Atualização
└── ... (20+ scripts)
```

## 🚀 Comandos Úteis

### Sistema
```bash
npm start              # Inicia servidor
npm run pipeline       # Executa pipeline
npm run map:system     # Mapeia sistema
npm run clean:old      # Limpa arquivos antigos
```

### Dados
```bash
npm run update:sheets  # Atualiza do Google Sheets
npm run test:sheets    # Testa Google Sheets
```

### Banco
```bash
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:studio    # Abre Prisma Studio
```

## 📝 Arquivos por Função

### 🎮 Controllers (19)
1. aggregateController - Agregações
2. aiController - IA
3. cacheController - Cache
4. chatController - Chat
5. colabController - Colab
6. complaintsController - Reclamações
7. dashboardController - Dashboard
8. distinctController - Valores distintos
9. filterController - Filtros
10. geographicController - Geografia
11. notificationController - Notificações
12. recordsController - Registros
13. slaController - SLA
14. statsController - Estatísticas
15. summaryController - Resumo
16. unitController - Unidades
17. utilsController - Utilitários
18. vencimentoController - Vencimentos
19. zeladoriaController - Zeladoria

### 🛣️ Routes (11)
1. aggregate.js - /api/aggregate/*
2. ai.js - /api/ai/*
3. cache.js - /api/cache/*
4. chat.js - /api/chat/*
5. colab.js - /api/colab/*
6. data.js - /api/*
7. geographic.js - /api/geographic/*
8. index.js - Rotas principais
9. notifications.js - /api/notifications/*
10. stats.js - /api/stats/*
11. zeladoria.js - /api/zeladoria/*

### 📄 Pages (34)
**Ouvidoria (23):** overview, orgao-mes, tempo-medio, vencimento, tema, assunto, cadastrante, reclamacoes, projecao-2026, canal, secretaria, secretarias-distritos, tipo, status, categoria, setor, responsavel, prioridade, bairro, uac, unidades-saude, unit, cora-chat

**Zeladoria (11):** zeladoria-overview, zeladoria-status, zeladoria-categoria, zeladoria-departamento, zeladoria-bairro, zeladoria-responsavel, zeladoria-canal, zeladoria-tempo, zeladoria-mensal, zeladoria-geografica, zeladoria-colab

## ✅ Status

- ✅ Sistema mapeado
- ✅ Arquivos organizados
- ✅ Documentação completa
- ✅ Estrutura clara
- ✅ Pronto para uso

---

**Última atualização:** 2025-11-27

