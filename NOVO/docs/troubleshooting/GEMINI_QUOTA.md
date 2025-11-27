# 🔧 Tratamento de Quota Gemini API

## 📋 Problema

Quando a quota gratuita da API Gemini é excedida, o sistema retorna erro 429. O sistema agora trata isso automaticamente.

## ✅ Solução Implementada

### 1. Sistema de Cooldown

Quando uma chave excede a quota:
- A chave é marcada como "em cooldown"
- O sistema calcula automaticamente quando pode tentar novamente (baseado no `RetryInfo` da API)
- Durante o cooldown, a chave não é usada

### 2. Rotação Inteligente

- Se a chave atual está em cooldown, o sistema rotaciona automaticamente para a próxima chave disponível
- Se todas as chaves estão em cooldown, o sistema usa fallback (insights básicos sem IA)

### 3. Fallback Automático

Quando a IA não está disponível (quota excedida ou erro):
- O sistema retorna insights básicos baseados em análise estatística
- Os insights incluem:
  - Anomalias detectadas (aumentos anormais)
  - Top secretarias/órgãos
  - Top assuntos
  - Tendências mensais

## 🔄 Como Funciona

```
1. Tentativa de usar IA
   ↓
2. Erro 429 (quota excedida)?
   ↓ SIM
3. Extrair tempo de retry do erro
   ↓
4. Marcar chave como em cooldown
   ↓
5. Tentar próxima chave disponível
   ↓
6. Todas em cooldown?
   ↓ SIM
7. Usar fallback (insights básicos)
```

## 📊 Mensagens no Console

- `⚠️ Quota excedida (429) na chave atual` - Chave atual excedeu quota
- `⏳ Chave X em cooldown por Ys` - Chave em período de espera
- `🔄 Rotacionando para chave X/Y` - Mudando para próxima chave
- `⚠️ Todas as chaves em cooldown - usando fallback` - Usando insights básicos

## 🎯 Benefícios

1. **Sem Interrupção**: Sistema continua funcionando mesmo com quota excedida
2. **Rotação Automática**: Usa múltiplas chaves quando disponível
3. **Fallback Inteligente**: Insights básicos quando IA não está disponível
4. **Cooldown Inteligente**: Respeita os tempos de retry da API

## 🔧 Configuração

O sistema usa automaticamente as chaves configuradas no `.env`:
```env
GEMINI_API_KEY=...
GEMINI_API_KEY_2=...
```

## 📝 Notas

- O cooldown é calculado automaticamente baseado no `RetryInfo` da API
- Se não houver `RetryInfo`, usa 60 segundos como padrão
- O cooldown expira automaticamente quando o tempo passa
- Insights básicos são sempre retornados, mesmo sem IA

