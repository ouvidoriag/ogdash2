# 🧹 Limpeza e Organização do Sistema

## 📋 Arquivos que PODEM ser removidos (não afetam o sistema)

### 📄 Documentação Antiga/Obsoleta (Raiz do projeto)

Estes documentos são de análises antigas e podem ser removidos:

1. **`BALANCO_COLAB.md`** - Documento de análise antiga sobre COLAB
2. **`PAGINAS_FALTANTES.md`** - Lista antiga de páginas faltantes (já implementadas)
3. **`PLANO_MELHORIAS_PAGINAS.md`** - Plano antigo de melhorias (já implementado)
4. **`VERIFICACAO_PAGINAS.md`** - Verificação antiga (já concluída)
5. **`VERIFICACAO_ATUALIZACAO_COMPLETA_PAGINA.md`** - Verificação antiga
6. **`VERIFICACAO_INTERLIGACAO_OVERVIEW.md`** - Verificação antiga
7. **`AUDITORIA_COMPLETA_SISTEMA.md`** - Auditoria antiga
8. **`RELATORIO_FINAL_AUDITORIA.md`** - Relatório antigo
9. **`ANALISE_FILTROS_GRAFICOS.md`** - Análise antiga
10. **`OTIMIZACOES_ADICIONAIS.md`** - Análise antiga
11. **`ANALISE_OTIMIZACOES.md`** - Análise antiga
12. **`ANALISE_COMPARATIVA_SISTEMAS.md`** - Análise antiga
13. **`CARDS_VISAO_GERAL.md`** - Documentação antiga
14. **`CORRECOES_CRITICAS_APLICADAS.md`** - Documentação antiga (já aplicadas)
15. **`DOCUMENTACAO_PAGINA_VENCIMENTO.md`** - Documentação antiga
16. **`DOCUMENTACAO_SISTEMA_VENCIMENTOS.md`** - Documentação antiga (duplicada)

### 📄 Documentação NOVO/ (Manter - são atuais)

**MANTER:**
- `NOVO/GOOGLE_SHEETS_SETUP.md` - Setup atual do Google Sheets
- `NOVO/PIPELINE_SETUP.md` - Setup atual do Pipeline
- `NOVO/SETUP_GMAIL.md` - Setup atual do Gmail
- `NOVO/TROUBLESHOOTING_GMAIL.md` - Troubleshooting atual
- `NOVO/TESTE_EMAIL.md` - Documentação de testes de email
- `NOVO/RELATORIO_TESTE_CHAVES_GEMINI.md` - Relatório de testes
- `NOVO/scripts/TESTE_PAGINAS_README.md` - Documentação de testes

### 🗂️ Arquivos Temporários/Backup

1. **`backup_*.csv`** (raiz) - Backups do pipeline Python
   - `backup_status_demanda_tratada_20251127_101305.csv`
   - `backup_tempo_de_resolucao_tratada_20251127_101250.csv`
   - `backup_tratada_antes_patch.csv`

2. **`pipeline_tratamento.log`** (raiz) - Log do pipeline Python

3. **`NOVO/dashboard.log`** - Log do dashboard (pode ser limpo)

4. **`NOVO/dashboard.pid`** - Arquivo PID (pode ser removido se servidor não estiver rodando)

### 📦 Arquivos de Dados Antigos

1. **`Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA (6).xlsx`** (raiz)
   - Planilha antiga, não é mais usada (dados vêm do Google Sheets)

2. **`NOVO.rar`** - Arquivo compactado antigo

### 🗑️ Pasta ANTIGO/ (Manter como referência histórica)

A pasta `ANTIGO/` contém código antigo e pode ser mantida como referência histórica, mas não é usada pelo sistema atual.

### 📝 Scripts de Teste (Manter - são úteis)

**MANTER:**
- `NOVO/scripts/test-all-pages.js` - Testa todas as páginas
- `NOVO/scripts/run-page-tests.js` - Executa testes de páginas
- `NOVO/scripts/testGoogleSheets.js` - Testa conexão Google Sheets
- `NOVO/scripts/testGeminiKeys.js` - Testa chaves Gemini
- `NOVO/public/scripts/test-all-pages.js` - Teste frontend

### 🔧 Scripts Úteis (Manter)

**MANTER:**
- `NOVO/scripts/runPipeline.js` - Pipeline principal
- `NOVO/scripts/setup-python.js` - Setup Python
- `NOVO/scripts/setup.js` - Setup do sistema
- `NOVO/scripts/updateFromGoogleSheets.js` - Atualização do Google Sheets
- `NOVO/scripts/validateUnidadesSaude.js` - Validação de dados
- `NOVO/scripts/importZeladoria.js` - Importação Zeladoria
- `NOVO/scripts/enviar-email-*.js` - Scripts de email
- `NOVO/scripts/check*.js` - Scripts de verificação

## 📊 Estrutura Atual do Sistema

### ✅ NOVO/ (Sistema Atual - MANTER TUDO)

```
NOVO/
├── src/                    # Backend
│   ├── server.js          # Servidor principal
│   ├── api/               # APIs
│   ├── config/            # Configurações
│   ├── cron/              # Tarefas agendadas
│   ├── services/          # Serviços (email, etc)
│   └── utils/             # Utilitários
├── public/                 # Frontend
│   └── scripts/           # Scripts frontend
├── scripts/               # Scripts de manutenção
├── prisma/                # Schema do banco
├── data/                  # Dados estáticos
└── *.md                   # Documentação atual
```

### 📁 Pipeline/ (MANTER)

```
Pipeline/
├── main.py               # Pipeline Python principal
├── requirements.txt      # Dependências Python
└── rodar_pipeline.yml   # GitHub Actions
```

## 🎯 Recomendações de Limpeza

### Fase 1: Remover Documentação Antiga (Seguro)

```bash
# Na raiz do projeto
rm BALANCO_COLAB.md
rm PAGINAS_FALTANTES.md
rm PLANO_MELHORIAS_PAGINAS.md
rm VERIFICACAO_PAGINAS.md
rm VERIFICACAO_ATUALIZACAO_COMPLETA_PAGINA.md
rm VERIFICACAO_INTERLIGACAO_OVERVIEW.md
rm AUDITORIA_COMPLETA_SISTEMA.md
rm RELATORIO_FINAL_AUDITORIA.md
rm ANALISE_FILTROS_GRAFICOS.md
rm OTIMIZACOES_ADICIONAIS.md
rm ANALISE_OTIMIZACOES.md
rm ANALISE_COMPARATIVA_SISTEMAS.md
rm CARDS_VISAO_GERAL.md
rm CORRECOES_CRITICAS_APLICADAS.md
rm DOCUMENTACAO_PAGINA_VENCIMENTO.md
rm DOCUMENTACAO_SISTEMA_VENCIMENTOS.md
```

### Fase 2: Remover Backups Temporários (Seguro)

```bash
# Backups do pipeline (podem ser regenerados)
rm backup_*.csv
rm pipeline_tratamento.log

# Logs (podem ser limpos)
rm NOVO/dashboard.log
# dashboard.pid só remover se servidor não estiver rodando
```

### Fase 3: Remover Arquivos Antigos (Verificar antes)

```bash
# Planilha Excel antiga (verificar se não é usada)
# rm "Dashboard_Duque_de_Caxias_Ouvidoria_Duque_de_Caxias_Tabela_ATUALIZADA (6).xlsx"

# Arquivo RAR antigo
# rm NOVO.rar
```

## 📝 Arquivos Importantes (NUNCA REMOVER)

- `README.md` - Documentação principal
- `NOVO/package.json` - Dependências
- `NOVO/prisma/schema.prisma` - Schema do banco
- `NOVO/.env` - Variáveis de ambiente
- `Pipeline/main.py` - Pipeline Python
- `NOVO/src/server.js` - Servidor principal
- `NOVO/public/index.html` - Frontend principal
- Todos os arquivos em `NOVO/src/` e `NOVO/public/scripts/`

## 🔍 Verificação Antes de Remover

Antes de remover qualquer arquivo, verifique:

1. **Não está sendo importado/usado?**
   ```bash
   grep -r "nome-do-arquivo" NOVO/
   ```

2. **Não é referenciado em documentação?**
   ```bash
   grep -r "nome-do-arquivo" *.md
   ```

3. **Não está no .gitignore?**
   - Se estiver, pode ser seguro remover

## ✅ Checklist de Limpeza

- [ ] Backup do repositório criado
- [ ] Documentação antiga removida (Fase 1)
- [ ] Backups temporários removidos (Fase 2)
- [ ] Logs limpos (Fase 2)
- [ ] Sistema testado após limpeza
- [ ] README.md atualizado se necessário

