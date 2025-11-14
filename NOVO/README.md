# 🏛️ Dashboard de Ouvidoria - Duque de Caxias/RJ

**Versão 3.0 - Refatorada e Otimizada**

Sistema completo de análise e visualização de dados de manifestações da Ouvidoria Municipal.

## 🚀 Instalação Rápida

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
NOVO/
├── src/                    # Backend
│   ├── server.js          # Servidor Express principal
│   ├── config/            # Configurações
│   ├── api/               # Rotas da API organizadas
│   │   ├── routes/        # Rotas por módulo
│   │   └── controllers/   # Controllers
│   ├── services/          # Serviços de negócio
│   ├── utils/             # Utilitários
│   └── middleware/        # Middlewares
├── public/                 # Frontend
│   ├── index.html         # Página principal
│   └── scripts/           # Scripts organizados
│       ├── core/          # Sistemas globais
│       ├── pages/          # Páginas individuais
│       ├── charts/         # Gráficos
│       └── utils/          # Utilitários frontend
├── prisma/                 # Schema do banco
└── scripts/                # Scripts de setup/manutenção
```

## ✨ Melhorias da Versão 3.0

- ✅ **API Organizada**: Rotas separadas por módulo
- ✅ **Código Modular**: Separação clara de responsabilidades
- ✅ **Performance**: Otimizações de queries e cache
- ✅ **Manutenibilidade**: Código limpo e documentado
- ✅ **Escalabilidade**: Estrutura preparada para crescimento

