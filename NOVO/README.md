# 📊 Dashboard Ouvidoria Duque de Caxias

Sistema de dashboard estratégico para análise e gestão de dados da Ouvidoria Geral de Duque de Caxias.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Acessar dashboard
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
NOVO/
├── config/              # Arquivos de configuração e credenciais
│   ├── google-credentials.json
│   ├── gmail-credentials.json
│   └── gmail-token.json
├── data/                # Dados estáticos (JSON)
│   ├── secretarias-distritos.json
│   └── unidades-saude.json
├── docs/                # Documentação organizada
│   ├── setup/           # Guias de configuração
│   ├── system/          # Documentação do sistema
│   └── troubleshooting/ # Solução de problemas
├── prisma/              # Schema do banco de dados
├── public/              # Frontend (HTML, CSS, JS)
│   └── scripts/
│       ├── core/        # Módulos principais
│       ├── pages/       # Páginas do dashboard
│       └── utils/       # Utilitários
├── scripts/             # Scripts Node.js organizados
│   ├── data/            # Importação/atualização de dados
│   ├── email/           # Scripts de email
│   ├── maintenance/     # Manutenção e validação
│   ├── server/          # Scripts de servidor (start/stop/restart)
│   └── test/            # Scripts de teste
└── src/                 # Backend (Node.js/Express)
    ├── api/             # Controllers e rotas
    ├── config/          # Configurações do servidor
    ├── cron/            # Tarefas agendadas
    ├── services/        # Serviços (email, etc)
    └── utils/           # Utilitários do backend
```

## 📚 Documentação

### Setup
- [Google Sheets Setup](docs/setup/GOOGLE_SHEETS_SETUP.md)
- [Pipeline Setup](docs/setup/PIPELINE_SETUP.md)
- [Gmail Setup](docs/setup/SETUP_GMAIL.md)

### Sistema
- [Índice do Sistema](docs/system/INDICE_SISTEMA.md)
- [Mapeamento Completo](docs/system/MAPEAMENTO_COMPLETO_SISTEMA.md)
- [Verificação de Páginas](docs/system/VERIFICACAO_PAGINAS_COMPLETA.md)

### Troubleshooting
- [Gmail Troubleshooting](docs/troubleshooting/TROUBLESHOOTING_GMAIL.md)
- [Teste de Email](docs/troubleshooting/TESTE_EMAIL.md)

## 🛠️ Scripts Disponíveis

### Dados
```bash
npm run update:excel      # Atualizar do Excel
npm run update:sheets     # Atualizar do Google Sheets
npm run import:zeladoria  # Importar dados Zeladoria
npm run pipeline          # Executar pipeline completo
```

### Manutenção
```bash
npm run clean:old         # Limpar arquivos antigos
npm run map:system        # Mapear estrutura do sistema
npm run setup:python      # Instalar Python e dependências
```

### Email
```bash
npm run gmail:auth        # Autorizar Gmail API
npm run email:saude       # Enviar email saúde
npm run email:real        # Enviar email real
```

### Testes
```bash
npm run test              # Executar testes
npm run test:pages        # Testar páginas
npm run test:sheets       # Testar Google Sheets
```

### Servidor
```bash
# Linux/Mac
./scripts/server/start.sh
./scripts/server/stop.sh
./scripts/server/restart.sh
./scripts/server/status.sh

# Windows
.\scripts\server\start.ps1
.\scripts\server\stop.ps1
.\scripts\server\restart.ps1
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# MongoDB
MONGODB_ATLAS_URL=mongodb+srv://...

# Servidor
PORT=3000

# Gemini AI
GEMINI_API_KEY=...

# Google Sheets
GOOGLE_CREDENTIALS_FILE=config/google-credentials.json
GOOGLE_SHEET_ID=...

# Email
EMAIL_REMETENTE=ouvidoria@duquedecaxias.rj.gov.br
```

## 🔧 Tecnologias

- **Backend**: Node.js, Express, Prisma
- **Banco de Dados**: MongoDB Atlas
- **Frontend**: Vanilla JavaScript, Chart.js
- **APIs**: Google Sheets API, Gmail API, Gemini AI

## 📝 Licença

MIT

## 👥 Autor

Ouvidoria Geral de Duque de Caxias

