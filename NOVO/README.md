# 📊 Dashboard Ouvidoria - Sistema NOVO

**Este é o diretório principal do sistema.**  
Para documentação completa, consulte o [README.md principal](../../README.md).

---

## 🚀 Início Rápido Local

```bash
# Dentro de NOVO/
npm install
npm start

# Acessar
http://localhost:3000
```

---

## 📁 Estrutura Rápida

```
NOVO/
├── src/              # Backend (Express + MongoDB)
├── public/           # Frontend (SPA vanilla)
├── scripts/          # Scripts de manutenção
├── docs/             # Documentação completa
├── maps/             # Mapeamentos automáticos
├── config/           # Credenciais (não versionadas)
└── data/             # Dados estáticos
```

---

## 📚 Documentação Principal

### ⭐ Comece Aqui

- **[README Principal](../../README.md)** - Documentação completa do sistema
- **[Resumo Executivo](maps/RESUMO_EXECUTIVO_GERAL.md)** - Status e progresso

### Setup

- [Google Sheets](docs/setup/GOOGLE_SHEETS_SETUP.md)
- [Pipeline Python](docs/setup/PIPELINE_SETUP.md)
- [Gmail API](docs/setup/SETUP_GMAIL.md)

### Sistema

- [Índice Completo](docs/system/INDICE_SISTEMA.md)
- [Sistemas de Cache](docs/system/SISTEMAS_CACHE.md)
- [Guia de Logging](docs/system/GUIA_LOGGING.md)
- [Mapeamento Ultra Detalhado](maps/SISTEMA_ULTRA_DETALHADO.md)

---

## 🛠️ Scripts Principais

```bash
# Servidor
npm start

# Dados
npm run update:sheets
npm run pipeline

# Manutenção
npm run setup
npm run map:system

# Email
npm run gmail:auth
```

**Veja todos os scripts**: `package.json`

---

## ⚙️ Configuração Rápida

### Variáveis Obrigatórias (.env)

```env
MONGODB_ATLAS_URL=mongodb+srv://...
GOOGLE_SHEET_ID=...
EMAIL_REMETENTE=...
```

### Credenciais

- Google Sheets: `config/google-credentials.json`
- Gmail: `config/gmail-credentials.json` (após autorização)

---

## 📊 Componentes Principais

### Backend
- **19 Controllers** - Lógica de negócio
- **14 Rotas** - API modular
- **Sistema Winston** - Logging profissional
- **8 Sistemas de Cache** - Performance otimizada

### Frontend
- **34 Páginas** - Dashboard completo
- **SPA Modular** - Zero frameworks
- **ChartFactory** - Gráficos padronizados
- **DataLoader** - Carregamento unificado

### Scripts
- **Pipeline Python** - Processamento de dados
- **Notificações Email** - Automatizado
- **Cron Jobs** - Agendamento diário

---

## ✅ Status

✅ **Sistema 100% Pronto para Produção**

- Limpeza: 100% completa (49 arquivos removidos)
- Otimização: 90% completa (Winston + cache)
- Documentação: Completa e atualizada

---

**Para mais informações, consulte o [README principal](../../README.md)**
