# ⚙️ Página de Configurações Administrativas - Proposta Completa

**CÉREBRO X-3**  
**Data:** 17/12/2025  
**Status:** Em Desenvolvimento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Propostas](#funcionalidades-propostas)
3. [Estrutura da Página](#estrutura-da-página)
4. [Implementação](#implementação)
5. [APIs Necessárias](#apis-necessárias)
6. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

A página de configurações administrativas permite que administradores do sistema gerenciem todas as configurações importantes do dashboard de forma centralizada e intuitiva, sem necessidade de editar código ou arquivos de configuração manualmente.

### Objetivos

- ✅ Centralizar todas as configurações em uma única interface
- ✅ Facilitar ajustes sem necessidade de conhecimento técnico
- ✅ Visualizar status das integrações em tempo real
- ✅ Monitorar estatísticas do sistema
- ✅ Gerenciar cache, logs e notificações

---

## 🚀 Funcionalidades Propostas

### 1. **⚡ Configurações de Cache**

Permite gerenciar os TTLs (Time To Live) do cache para otimizar performance:

- **Dashboard Data**: TTL para dados principais (padrão: 5s)
- **Aggregate by Month**: TTL para agregações mensais (padrão: 10min)
- **Distritos**: TTL para dados de distritos (padrão: 30min)
- **Summary**: TTL para resumo geral (padrão: 5s)

**Ações:**
- 💾 Salvar configurações
- 🗑️ Limpar todo o cache
- 🔄 Restaurar valores padrão

---

### 2. **📧 Configurações de Notificações**

Gerencia o sistema de notificações por email:

- **Horário de Execução**: Horário diário para envio (padrão: 08:00)
- **Alerta Preventivo**: Dias antes do vencimento (padrão: 15 dias)
- **Alerta Crítico**: Dias após vencimento (padrão: 30 dias)
- **Alerta Extrapolação**: Dias após vencimento (padrão: 60 dias)
- **Notificações Ativas**: Toggle para ativar/desativar
- **Resumo Diário**: Toggle para resumo diário à Ouvidoria Geral

**Ações:**
- 💾 Salvar configurações
- 🧪 Testar notificação
- ▶️ Executar notificações agora

---

### 3. **📝 Configurações de Logs**

Controla os níveis de log exibidos no console:

- ❌ **Erros**: Sempre ativo (não pode ser desativado)
- ⚠️ **Avisos**: Sempre ativo (não pode ser desativado)
- ℹ️ **Informações**: Ativo apenas em desenvolvimento
- 🔍 **Debug**: Ativo apenas em desenvolvimento
- ✅ **Sucesso**: Ativo apenas em desenvolvimento
- ⚡ **Performance**: Ativo apenas em desenvolvimento

**Ações:**
- 💾 Salvar configurações
- 🗑️ Limpar console
- 📥 Exportar logs (futuro)

---

### 4. **🔗 Status das Integrações**

Monitora o status das integrações externas:

- **📊 Google Sheets**: Status da sincronização
- **📧 Gmail API**: Status do envio de emails
- **🤖 Gemini AI**: Status do chat inteligente
- **🗄️ MongoDB Atlas**: Status da conexão

**Ações:**
- 🔄 Atualizar status
- 🧪 Testar cada integração
- 📊 Sincronizar Google Sheets manualmente

---

### 5. **⏱️ Configurações de SLA e Prazos**

Define prazos padrão por tipo de manifestação:

- **Prazo Padrão**: Prazo geral (padrão: 30 dias)
- **Prazo E-SIC**: Prazo para pedidos de informação (padrão: 20 dias)
- **Prazo Reclamação**: Prazo para reclamações (padrão: 30 dias)
- **Prazo Denúncia**: Prazo para denúncias (padrão: 30 dias)

**Ações:**
- 💾 Salvar configurações
- 🔄 Restaurar valores padrão

---

### 6. **🏛️ Configurações de Secretarias**

Gerencia emails e informações das secretarias:

- Lista todas as secretarias cadastradas
- Editar email principal de cada secretaria
- Editar email alternativo
- Visualizar total de manifestações por secretaria

**Ações:**
- 💾 Salvar alterações por secretaria
- 🔄 Atualizar lista
- 📥 Exportar CSV

---

### 7. **📊 Estatísticas do Sistema**

Exibe informações sobre o estado atual do sistema:

- **Total de Manifestações**: Número total no sistema
- **Vencidas**: Manifestações com prazo vencido
- **Concluídas**: Manifestações concluídas
- **Notificações Enviadas**: Notificações enviadas hoje
- **Tamanho do Cache**: Tamanho atual do cache
- **Última Sincronização**: Timestamp da última sincronização

**Ações:**
- 🔄 Atualizar estatísticas
- 📥 Exportar relatório completo

---

## 🏗️ Estrutura da Página

### Layout

A página será organizada em **abas/seções** para facilitar navegação:

```
┌─────────────────────────────────────────┐
│  ⚙️ Configurações Administrativas      │
├─────────────────────────────────────────┤
│  [Cache] [Notificações] [Logs] [SLA]   │
│  [Integrações] [Secretarias] [Sistema] │
├─────────────────────────────────────────┤
│                                         │
│  [Conteúdo da seção selecionada]       │
│                                         │
└─────────────────────────────────────────┘
```

### HTML Structure

```html
<section id="page-configuracoes" style="display: none;">
  <header class="glass rounded-2xl p-6 mb-6">
    <h1 class="neon text-3xl font-bold">⚙️ Configurações Administrativas</h1>
    <p class="text-slate-400">Gerencie todas as configurações do sistema</p>
  </header>
  
  <!-- Tabs de navegação -->
  <div class="config-tabs">
    <button class="tab active" onclick="showConfigTab('cache')">⚡ Cache</button>
    <button class="tab" onclick="showConfigTab('notifications')">📧 Notificações</button>
    <button class="tab" onclick="showConfigTab('logs')">📝 Logs</button>
    <button class="tab" onclick="showConfigTab('sla')">⏱️ SLA</button>
    <button class="tab" onclick="showConfigTab('integrations')">🔗 Integrações</button>
    <button class="tab" onclick="showConfigTab('secretarias')">🏛️ Secretarias</button>
    <button class="tab" onclick="showConfigTab('system')">📊 Sistema</button>
  </div>
  
  <!-- Conteúdo das seções -->
  <div id="config-cache" class="config-content"></div>
  <div id="config-notifications" class="config-content" style="display: none;"></div>
  <div id="config-logs" class="config-content" style="display: none;"></div>
  <div id="config-sla" class="config-content" style="display: none;"></div>
  <div id="config-integrations" class="config-content" style="display: none;"></div>
  <div id="config-secretarias" class="config-content" style="display: none;"></div>
  <div id="config-system" class="config-content" style="display: none;"></div>
</section>
```

---

## 💻 Implementação

### ✅ Já Implementado

1. **Arquivo JavaScript**: `NOVO/public/scripts/pages/configuracoes.js`
   - Função `loadConfiguracoes()` para carregar a página
   - Funções de renderização para cada seção
   - Funções de ação (salvar, testar, limpar, etc.)

### ⏳ Pendente

1. **Estrutura HTML**: Adicionar seção no `index.html`
2. **Menu de Navegação**: Adicionar item no menu Central
3. **APIs Backend**: Criar endpoints para gerenciar configurações
4. **Estilos CSS**: Adicionar estilos específicos para a página

---

## 🔌 APIs Necessárias

### 1. **GET /api/config**
Retorna todas as configurações do sistema.

**Resposta:**
```json
{
  "cache": { ... },
  "notifications": { ... },
  "logs": { ... },
  "integrations": { ... },
  "sla": { ... },
  "secretarias": [ ... ],
  "system": { ... }
}
```

### 2. **GET /api/config/cache**
Retorna configurações de cache.

**Resposta:**
```json
{
  "dashboardData": 5000,
  "aggregateByMonth": 600000,
  "distritos": 1800000,
  "summary": 5000
}
```

### 3. **POST /api/config/cache**
Salva configurações de cache.

**Body:**
```json
{
  "dashboardData": 5000,
  "aggregateByMonth": 600000,
  "distritos": 1800000,
  "summary": 5000
}
```

### 4. **POST /api/config/cache/clear**
Limpa todo o cache.

### 5. **GET /api/config/notifications**
Retorna configurações de notificações.

### 6. **POST /api/config/notifications**
Salva configurações de notificações.

### 7. **POST /api/notifications/test**
Envia notificação de teste.

### 8. **GET /api/config/integrations**
Retorna status das integrações.

**Resposta:**
```json
{
  "googleSheets": {
    "status": "connected",
    "message": "Sincronização ativa"
  },
  "gmail": {
    "status": "connected",
    "message": "API funcionando"
  },
  "gemini": {
    "status": "connected",
    "message": "Chat ativo"
  },
  "mongodb": {
    "status": "connected",
    "message": "Conexão estabelecida"
  }
}
```

### 9. **GET /api/config/sla**
Retorna configurações de SLA.

### 10. **POST /api/config/sla**
Salva configurações de SLA.

### 11. **GET /api/config/secretarias**
Retorna lista de secretarias com emails.

### 12. **POST /api/config/secretarias/:id**
Atualiza email de uma secretaria.

### 13. **GET /api/config/system-stats**
Retorna estatísticas do sistema.

**Resposta:**
```json
{
  "totalManifestacoes": 17601,
  "manifestacoesVencidas": 234,
  "manifestacoesConcluidas": 15234,
  "notificacoesEnviadas": 45,
  "cacheSize": 5242880,
  "ultimaSincronizacao": "2025-12-17T10:30:00Z"
}
```

---

## 📝 Próximos Passos

### Fase 1: Estrutura Básica ✅
- [x] Criar arquivo JavaScript da página
- [ ] Adicionar estrutura HTML no `index.html`
- [ ] Adicionar item no menu de navegação
- [ ] Adicionar estilos CSS

### Fase 2: Backend APIs
- [ ] Criar controller de configurações (`src/api/config.controller.js`)
- [ ] Criar rotas de configurações (`src/api/config.routes.js`)
- [ ] Implementar endpoints de cache
- [ ] Implementar endpoints de notificações
- [ ] Implementar endpoints de integrações
- [ ] Implementar endpoints de SLA
- [ ] Implementar endpoints de secretarias
- [ ] Implementar endpoints de estatísticas

### Fase 3: Persistência
- [ ] Criar modelo de Configuração no MongoDB
- [ ] Implementar salvamento de configurações
- [ ] Implementar carregamento de configurações
- [ ] Implementar validação de configurações

### Fase 4: Testes e Refinamento
- [ ] Testar todas as funcionalidades
- [ ] Ajustar UI/UX
- [ ] Adicionar validações de formulário
- [ ] Adicionar feedback visual
- [ ] Documentar uso

---

## 🎨 Estilos CSS Necessários

```css
/* Container principal */
.config-section {
  background: var(--panel);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.config-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.config-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

/* Grid de configurações */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-item label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.config-item input[type="number"],
.config-item input[type="time"],
.config-item input[type="email"] {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.config-item small {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Checkboxes */
.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

/* Botões de ação */
.config-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.btn-primary,
.btn-secondary,
.btn-small {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-connected {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.status-disconnected {
  background: rgba(251, 113, 133, 0.2);
  color: #fb7185;
}

.status-error {
  background: rgba(251, 113, 133, 0.2);
  color: #fb7185;
}

/* Cards de estatísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Lista de secretarias */
.secretarias-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.secretaria-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.secretaria-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.secretaria-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(34, 211, 238, 0.2);
  color: var(--primary);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.secretaria-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

---

## 🔐 Segurança

### Autenticação e Autorização

- ✅ Apenas usuários autenticados podem acessar
- ✅ Apenas administradores podem modificar configurações
- ✅ Validação de permissões no backend
- ✅ Sanitização de inputs

### Validação

- ✅ Validação de tipos de dados
- ✅ Validação de ranges (ex: TTL mínimo/máximo)
- ✅ Validação de formatos (ex: emails, horários)
- ✅ Mensagens de erro claras

---

## 📚 Documentação Adicional

### Para Desenvolvedores

- [Arquitetura do Sistema de Configurações](./ARQUITETURA_CONFIGURACOES.md)
- [Guia de Implementação de Novas Configurações](./GUIA_NOVAS_CONFIGURACOES.md)

### Para Administradores

- [Guia de Uso da Página de Configurações](./GUIA_USO_CONFIGURACOES.md)
- [FAQ de Configurações](./FAQ_CONFIGURACOES.md)

---

## ✅ Checklist de Implementação

- [x] Criar arquivo JavaScript (`configuracoes.js`)
- [ ] Adicionar estrutura HTML no `index.html`
- [ ] Adicionar item no menu Central
- [ ] Criar controller backend (`config.controller.js`)
- [ ] Criar rotas backend (`config.routes.js`)
- [ ] Implementar endpoints de cache
- [ ] Implementar endpoints de notificações
- [ ] Implementar endpoints de integrações
- [ ] Implementar endpoints de SLA
- [ ] Implementar endpoints de secretarias
- [ ] Implementar endpoints de estatísticas
- [ ] Criar modelo de Configuração no MongoDB
- [ ] Adicionar estilos CSS
- [ ] Testar todas as funcionalidades
- [ ] Documentar uso

---

**Documento criado por:** CÉREBRO X-3  
**Última atualização:** 17/12/2025  
**Versão:** 1.0

