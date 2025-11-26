# Documentação do Sistema - Módulo de Vencimentos

## Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Módulo de Vencimentos - Detalhamento](#módulo-de-vencimentos---detalhamento)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Cálculo de Vencimentos](#cálculo-de-vencimentos)
6. [API de Vencimentos](#api-de-vencimentos)
7. [Interface do Usuário](#interface-do-usuário)
8. [Otimizações e Performance](#otimizações-e-performance)

---

## Visão Geral do Sistema

O sistema é um **Dashboard de Gestão de Ouvidoria** desenvolvido para a Prefeitura de Duque de Caxias, construído com tecnologias modernas:

- **Backend**: Node.js com Express.js
- **Banco de Dados**: MongoDB (Atlas) com Prisma ORM
- **Frontend**: SPA (Single Page Application) vanilla JavaScript
- **Estrutura**: Arquitetura modular com separação de responsabilidades

### Objetivo Principal

Gerenciar e monitorar protocolos de manifestações da ouvidoria, incluindo:
- Reclamações
- Denúncias
- Sugestões
- Elogios
- Pedidos de informação (SIC - Serviço de Informação ao Cidadão)

---

## Arquitetura do Sistema

### Estrutura de Diretórios

```
NOVO/
├── src/
│   ├── api/
│   │   ├── controllers/     # Lógica de negócio dos endpoints
│   │   │   └── vencimentoController.js
│   │   └── routes/          # Definição de rotas da API
│   │       └── data.js
│   ├── utils/
│   │   ├── dateUtils.js     # Utilitários de data (normalização, cálculos)
│   │   └── responseHelper.js # Helpers de resposta (cache, formatação)
│   └── server.js            # Servidor Express principal
├── public/
│   ├── scripts/
│   │   ├── pages/
│   │   │   └── vencimento.js  # Página frontend de vencimentos
│   │   ├── core/
│   │   │   └── dataLoader.js  # Gerenciador de carregamento de dados
│   │   └── main.js            # Roteamento de páginas
│   └── index.html            # Página principal do SPA
└── prisma/
    └── schema.prisma         # Schema do banco de dados
```

### Camadas do Sistema

1. **Camada de Dados (Prisma)**
   - Modelo `Record` com campos normalizados
   - Índices otimizados para consultas frequentes
   - Sistema de cache de agregações

2. **Camada de API (Backend)**
   - Controllers especializados por funcionalidade
   - Rotas organizadas por domínio
   - Sistema de cache híbrido (em memória + banco)

3. **Camada de Apresentação (Frontend)**
   - Páginas modulares por assunto
   - Sistema de carregamento assíncrono
   - Comunicação via API REST

---

## Módulo de Vencimentos - Detalhamento

### Objetivo do Módulo

O módulo de vencimentos identifica e exibe protocolos que estão próximos de vencer ou já vencidos, ajudando a equipe a priorizar o atendimento de manifestações que requerem ação imediata.

### Funcionalidades Principais

1. **Identificação de Protocolos em Risco**
   - Protocolos vencidos
   - Protocolos vencendo em 3, 7, 15 ou 30 dias
   - Filtro customizado de dias

2. **Filtros Avançados**
   - Por secretaria/órgão responsável
   - Por prazo de vencimento

3. **Visualização Detalhada**
   - Tabela paginada (100 itens por página)
   - Indicadores visuais de urgência
   - Informações completas do protocolo

---

## Fluxo de Dados

### 1. Requisição do Frontend

Quando o usuário acessa a página de vencimentos:

```javascript
// public/scripts/pages/vencimento.js
async function loadVencimento(forceRefresh = false) {
  // 1. Popular dropdowns de filtros (meses e secretarias)
  await popularDropdownMeses();
  await popularDropdownSecretarias();
  
  // 2. Obter valores dos filtros selecionados
  const filtro = selectFiltro?.value || 'vencidos';
  const mes = selectMesEl?.value || '';
  const secretaria = selectSecretariaEl?.value || '';
  
  // 3. Construir URL da API
  let url = `/api/vencimento?filtro=${encodeURIComponent(filtro)}`;
  if (mes) url += `&mes=${encodeURIComponent(mes)}`;
  if (secretaria) url += `&secretaria=${encodeURIComponent(secretaria)}`;
  
  // 4. Carregar dados (com cache)
  const data = await window.dataLoader?.load(url, {
    useDataStore: !forceRefresh,
    ttl: 2 * 60 * 1000, // Cache de 2 minutos
    fallback: { total: 0, filtro, protocolos: [] }
  });
  
  // 5. Renderizar tabela
  renderVencimentoTable();
  updateVencimentoCounter(data);
}
```

### 2. Processamento no Backend

A requisição chega ao controller:

```javascript
// src/api/controllers/vencimentoController.js
export async function getVencimento(req, res, prisma) {
  // 1. Extrair parâmetros da query
  const filtro = req.query.filtro || 'vencidos';
  const mes = req.query.mes;
  const secretaria = req.query.secretaria;
  
  // 2. Buscar registros do banco de dados
  const rows = await prisma.record.findMany({
    where: { /* filtros */ },
    select: { /* campos necessários */ }
  });
  
  // 3. Processar cada registro
  for (const row of rowsFiltrados) {
    // - Verificar se está concluído (pular se sim)
    // - Obter data de criação
    // - Calcular data de vencimento
    // - Calcular dias restantes
    // - Aplicar filtro de prazo
    // - Adicionar ao array de protocolos
  }
  
  // 4. Ordenar por urgência
  // 5. Retornar resultado
}
```

### 3. Renderização no Frontend

Os dados são exibidos em uma tabela paginada:

```javascript
function renderVencimentoTable() {
  // 1. Calcular itens da página atual
  const inicio = paginaAtual * itensPorPagina;
  const fim = inicio + itensPorPagina;
  protocolosExibidos = protocolosCompletos.slice(inicio, fim);
  
  // 2. Gerar HTML da tabela
  // 3. Aplicar cores baseadas em dias restantes
  // 4. Adicionar botão "Carregar Mais" se necessário
}
```

**Nota**: O filtro de mês foi removido da interface do usuário. A página agora exibe todos os protocolos que atendem aos filtros de prazo e secretaria, independentemente do mês de criação.

---

## Cálculo de Vencimentos

### Sistema de Prazos

O sistema utiliza diferentes prazos dependendo do tipo de manifestação:

#### Prazo por Tipo de Manifestação

1. **SIC (Serviço de Informação ao Cidadão)**: **20 dias**
   - Pedidos de informação
   - Qualquer manifestação contendo "SIC", "pedido de informação", "informação"

2. **Ouvidoria (Padrão)**: **30 dias**
   - Reclamações
   - Denúncias
   - Sugestões
   - Elogios
   - Qualquer outro tipo não classificado como SIC

#### Função de Determinação de Prazo

```javascript
// src/api/controllers/vencimentoController.js
function getPrazoPorTipo(tipoDeManifestacao) {
  if (!tipoDeManifestacao) return 30; // Default: 30 dias
  
  const tipo = String(tipoDeManifestacao).toLowerCase().trim();
  
  // SIC - 20 dias
  if (tipo.includes('sic') || 
      tipo.includes('pedido de informação') || 
      tipo.includes('pedido de informacao') ||
      tipo.includes('informação') ||
      tipo.includes('informacao')) {
    return 20;
  }
  
  // Ouvidoria - 30 dias
  return 30;
}
```

### Cálculo da Data de Vencimento

A data de vencimento é calculada somando o prazo (em dias) à data de criação:

```javascript
function calcularDataVencimentoComPrazo(dataCriacao, prazo) {
  if (!dataCriacao) return null;
  
  // Criar objeto Date a partir da data de criação
  const data = new Date(dataCriacao + 'T00:00:00');
  if (isNaN(data.getTime())) return null;
  
  // Adicionar prazo em dias
  data.setDate(data.getDate() + prazo);
  
  // Retornar em formato YYYY-MM-DD
  return data.toISOString().slice(0, 10);
}
```

**Exemplo:**
- Data de criação: `2025-01-15`
- Tipo: SIC (prazo de 20 dias)
- Data de vencimento: `2025-02-04`

### Cálculo de Dias Restantes

Os dias restantes são calculados comparando a data de vencimento com a data atual:

```javascript
function calcularDiasRestantes(dataVencimento, hoje) {
  if (!dataVencimento) return null;
  
  const vencimento = new Date(dataVencimento + 'T00:00:00');
  if (isNaN(vencimento.getTime())) return null;
  
  // Calcular diferença em milissegundos
  const diff = vencimento - hoje;
  
  // Converter para dias
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return dias; // Negativo se vencido, positivo se ainda não venceu
}
```

**Valores possíveis:**
- **Negativo**: Protocolo vencido (ex: `-5` = vencido há 5 dias)
- **Zero**: Protocolo vence hoje
- **Positivo**: Dias restantes até o vencimento (ex: `3` = vence em 3 dias)

### Sistema de Normalização de Datas

O sistema possui um mecanismo robusto para normalizar datas de diferentes formatos:

```javascript
// src/utils/dateUtils.js
export function normalizeDate(dateInput) {
  // Suporta múltiplos formatos:
  // - YYYY-MM-DD
  // - DD/MM/YYYY
  // - ISO com hora (2025-01-06T03:00:28.000Z)
  // - Objetos Date
}
```

O sistema busca a data de criação na seguinte ordem de prioridade:

1. `record.dataCriacaoIso` (campo normalizado)
2. `record.dataDaCriacao` (campo original da planilha)
3. `record.data.data_da_criacao` (do JSON completo)

---

## API de Vencimentos

### Endpoint

```
GET /api/vencimento
```

### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `filtro` | string | Não | Tipo de filtro: `vencidos`, `3`, `7`, `15`, `30` ou número customizado. Padrão: `vencidos` |
| `secretaria` | string | Não | Filtro por secretaria/órgão responsável |
| `servidor` | string | Não | Filtro por servidor específico |
| `unidadeCadastro` | string | Não | Filtro por unidade de cadastro |
| `prazo` | number | Não | Prazo customizado em dias (sobrescreve o padrão do tipo) |

**Nota**: O parâmetro `mes` ainda é aceito pela API para compatibilidade, mas não é mais usado pela interface do usuário.

### Resposta

```json
{
  "total": 150,
  "filtro": "vencidos",
  "protocolos": [
    {
      "protocolo": "2025001234",
      "setor": "UAC - Unidade de Atendimento Central",
      "secretaria": "Secretaria de Saúde",
      "oQueE": "Reclamação sobre atendimento",
      "tipoManifestacao": "Reclamação",
      "dataCriacao": "2025-01-10",
      "dataVencimento": "2025-02-09",
      "diasRestantes": -5,
      "prazo": 30
    },
    // ... mais protocolos
  ]
}
```

### Processamento Interno

1. **Construção do Filtro Where (Prisma)**
   ```javascript
   const where = {};
   
   // Filtro por mês (aplicado no banco)
   if (mes) {
     where.AND.push({
       OR: [
         { dataCriacaoIso: { startsWith: mes } },
         { dataDaCriacao: { startsWith: mes } }
       ]
     });
   }
   
   // Garantir que tem data de criação
   where.AND.push({
     OR: [
       { dataCriacaoIso: { not: null } },
       { dataDaCriacao: { not: null } }
     ]
   });
   ```

2. **Busca no Banco de Dados**
   - Busca **todos** os registros que atendem aos filtros básicos
   - Seleciona apenas campos necessários (otimização)
   - Sem limite de registros (busca completa)

3. **Filtros em Memória**
   - Filtro de mês (fallback, caso o filtro do banco não funcione)
   - Filtro de secretaria (case-insensitive, correspondência parcial)
   - Verificação de status concluído
   - Cálculo de vencimento e aplicação do filtro de prazo

4. **Processamento Individual**
   Para cada registro:
   - Verifica se está concluído (`isConcluido()`)
   - Obtém data de criação (`getDataCriacao()`)
   - Determina prazo (`getPrazoPorTipo()` ou prazo customizado)
   - Calcula data de vencimento
   - Calcula dias restantes
   - Aplica filtro de prazo (vencidos, 3 dias, 7 dias, etc.)
   - Extrai informações do protocolo

5. **Ordenação**
   - Vencidos primeiro (dias restantes negativos)
   - Depois, ordena por dias restantes (menor = mais urgente)

### Cache

O endpoint utiliza cache de 5 minutos:

```javascript
const key = `vencimento:${filtro}:${mes || ''}:${prazoCustomizado || ''}:${servidor || ''}:${unidadeCadastro || ''}:${secretaria || ''}:v3`;
return withCache(key, 300, res, async () => {
  // ... processamento
}, prisma);
```

**Estratégia de Cache:**
- Cache em memória para respostas rápidas
- Chave baseada em todos os parâmetros de filtro
- TTL de 5 minutos (300 segundos)
- Invalidado quando filtros mudam

---

## Interface do Usuário

### Componentes da Página

A página de vencimentos (`public/scripts/pages/vencimento.js`) possui:

#### 1. Filtros

- **Filtro de Prazo**: Dropdown com opções
  - Vencidos
  - 3 dias
  - 7 dias
  - 15 dias
  - 30 dias
  
- **Filtro de Secretaria**: Dropdown dinâmico
  - Populado do endpoint `/api/distinct?field=Secretaria`
  - Ordenação alfabética
  - Case-insensitive

#### 2. Contador

Exibe o total de protocolos encontrados:
```
150 protocolos vencidos
```

#### 3. Tabela de Protocolos

Colunas:
- **Protocolo**: Número do protocolo (fonte monoespaçada)
- **Setor**: Unidade de cadastro
- **O que é**: Assunto/Tema/Tipo (truncado se muito longo)
- **Secretaria**: Órgão responsável
- **Data Criação**: Data formatada (DD/MM/YYYY)
- **Vencimento**: Data formatada (DD/MM/YYYY) - em vermelho se vencido
- **Prazo**: Prazo em dias + tipo (SIC/Ouvidoria)
- **Dias Restantes**: Badge colorido

#### 4. Sistema de Cores

Os protocolos são destacados por cores baseadas na urgência:

| Dias Restantes | Cor | Classe CSS | Descrição |
|----------------|-----|------------|-----------|
| `< 0` (Vencido) | Vermelho | `text-red-400 bg-red-500/20` | Protocolo vencido |
| `0-3` | Laranja | `text-orange-400 bg-orange-500/20` | Urgente |
| `4-7` | Amarelo | `text-yellow-400 bg-yellow-500/20` | Atenção |
| `> 7` | Cinza | `text-slate-300 bg-slate-800/30` | Normal |

Protocolos vencidos também têm uma borda vermelha à esquerda na linha da tabela.

#### 5. Paginação

- **100 itens por página**
- Botão "Carregar Mais" quando há mais itens
- Contador: "Mostrando 1-100 de 150 protocolos"

### Event Listeners

A página possui listeners para:

1. **Alteração de Filtro de Prazo**
   ```javascript
   selectFiltro.addEventListener('change', async (e) => {
     filtroAtual = e.target.value;
     await recarregarVencimentos();
   });
   ```

2. **Alteração de Filtro de Secretaria**
   ```javascript
   selectSecretaria.addEventListener('change', async (e) => {
     secretariaFiltro = e.target.value || null;
     await recarregarVencimentos();
   });
   ```

4. **Botão "Carregar Mais"**
   ```javascript
   btnCarregarMais.addEventListener('click', () => {
     paginaAtual++;
     renderVencimentoTable();
   });
   ```

### Funções Auxiliares

- `formatarData(dataStr)`: Formata data para DD/MM/YYYY
- `truncateText(text, maxLength)`: Trunca texto longo
- `escapeHtml(text)`: Previne XSS
- `getFiltroLabel(filtro)`: Retorna label amigável do filtro

---

## Otimizações e Performance

### 1. Filtragem em Duas Etapas

**Banco de Dados** (filtro primário):
- Filtro por mês quando possível
- Filtro por servidor/unidade de cadastro
- Garantia de que tem data de criação

**Memória** (filtro secundário):
- Filtro de secretaria (case-insensitive, correspondência parcial)
- Filtro de mês (fallback)
- Verificação de status concluído
- Cálculo de vencimento e filtro de prazo

**Razão**: O MongoDB não suporta facilmente comparações case-insensitive e correspondências parciais complexas. Fazer isso em memória garante maior precisão.

### 2. Seleção de Campos

A query do Prisma seleciona apenas os campos necessários:

```javascript
select: {
  id: true,
  protocolo: true,
  dataCriacaoIso: true,
  dataDaCriacao: true,
  tipoDeManifestacao: true,
  tema: true,
  assunto: true,
  orgaos: true,
  unidadeCadastro: true,
  status: true,
  statusDemanda: true,
  responsavel: true,
  data: true
}
```

Isso reduz o tráfego de rede e o uso de memória.

### 3. Cache Inteligente

- **Chave única** baseada em todos os parâmetros
- **TTL de 5 minutos** para balancear frescor e performance
- **Invalidação automática** quando filtros mudam

### 4. Paginação no Frontend

- Todos os dados são carregados de uma vez
- Paginação feita no cliente (JavaScript)
- Evita múltiplas requisições ao servidor
- Limita renderização inicial (100 itens)

### 5. Sistema de Data Normalizado

O sistema utiliza campos ISO normalizados (`dataCriacaoIso`, `dataConclusaoIso`) quando disponíveis, com fallback para campos originais. Isso garante:
- Consultas mais rápidas (índices otimizados)
- Menos processamento de formatação
- Consistência entre diferentes fontes de dados

### 6. Índices do Banco de Dados

O schema Prisma define índices otimizados:

```prisma
@@index([dataCriacaoIso])
@@index([dataCriacaoIso, status])
@@index([orgaos, status, dataCriacaoIso])
```

Isso acelera as consultas que filtram por data e órgão.

---

## Fluxograma do Processo de Vencimento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa página de Vencimentos                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend popula dropdowns (meses e secretarias)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuário seleciona filtros                                │
│    - Prazo (vencidos, 3, 7, 15, 30 dias)                   │
│    - Secretaria (opcional)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend constrói URL da API                             │
│    GET /api/vencimento?filtro=vencidos&secretaria=...      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Verificar cache                                          │
│    - Cache hit? Retornar dados em cache                     │
│    - Cache miss? Continuar processamento                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend busca registros no banco                         │
│    - Aplica filtros básicos (servidor, etc.)                │
│    - Seleciona apenas campos necessários                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Processa cada registro em memória                        │
│    ✓ Verifica se está concluído (pula se sim)              │
│    ✓ Obtém data de criação                                  │
│    ✓ Determina prazo (SIC=20, Ouvidoria=30)                │
│    ✓ Calcula data de vencimento                             │
│    ✓ Calcula dias restantes                                 │
│    ✓ Aplica filtro de prazo                                 │
│    ✓ Extrai informações do protocolo                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Filtros adicionais em memória                            │
│    - Filtro de secretaria (case-insensitive)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Ordena por urgência                                      │
│    - Vencidos primeiro (negativos)                          │
│    - Depois por dias restantes (menor = mais urgente)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Retorna JSON para o frontend                            │
│     { total, filtro, protocolos: [...] }                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Frontend renderiza tabela                               │
│     - Aplica cores baseadas em dias restantes               │
│     - Pagina (100 itens por página)                         │
│     - Atualiza contador                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Exemplos de Uso

### Exemplo 1: Protocolos Vencidos

**Requisição:**
```
GET /api/vencimento?filtro=vencidos
```

**Resposta:**
Protocolos onde `diasRestantes < 0`

### Exemplo 2: Protocolos Vencendo em 7 Dias

**Requisição:**
```
GET /api/vencimento?filtro=7
```

**Resposta:**
Protocolos onde `diasRestantes >= 0 && diasRestantes <= 7`

### Exemplo 3: Protocolos Vencidos de uma Secretaria Específica

**Requisição:**
```
GET /api/vencimento?filtro=vencidos&secretaria=Secretaria%20de%20Saúde
```

**Resposta:**
Protocolos vencidos da Secretaria de Saúde

---

## Considerações Importantes

### Protocolos Concluídos

O sistema **automaticamente exclui** protocolos concluídos do módulo de vencimentos. Um protocolo é considerado concluído se:

1. Tem data de conclusão (`dataConclusaoIso` ou `dataDaConclusao`)
2. Status contém palavras-chave:
   - "concluída" / "concluida"
   - "encerrada"
   - "finalizada"
   - "resolvida"
   - "arquivamento"

### Limitação de Dados

O sistema busca **todos** os registros do banco que atendem aos filtros básicos. Para bases de dados muito grandes, isso pode impactar a performance. Considerações futuras:

- Limitar busca aos últimos N meses
- Implementar paginação no backend
- Utilizar agregações do MongoDB para cálculo de vencimentos

### Prazo Customizado

É possível passar um prazo customizado via parâmetro `prazo`:

```
GET /api/vencimento?filtro=vencidos&prazo=45
```

Isso sobrescreve o prazo padrão do tipo de manifestação.

---

## Conclusão

O módulo de vencimentos é uma funcionalidade crítica do sistema que ajuda a equipe a:

1. **Priorizar** protocolos que requerem atenção imediata
2. **Monitorar** prazos de resposta
3. **Filtrar** protocolos por diversos critérios
4. **Visualizar** informações importantes de forma clara

O sistema foi projetado para ser:
- **Rápido**: Cache e otimizações de banco
- **Preciso**: Cálculos corretos de prazos e datas
- **Flexível**: Múltiplos filtros e opções
- **Escalável**: Arquitetura modular e otimizada

Para mais informações sobre outras funcionalidades do sistema, consulte:
- `README.md` - Visão geral do projeto
- `AUDITORIA_COMPLETA_SISTEMA.md` - Auditoria técnica completa
- Documentação de outros módulos conforme necessário

