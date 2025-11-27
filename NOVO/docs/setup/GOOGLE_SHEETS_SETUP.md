# Configuração para Importar Dados do Google Sheets

Este guia explica como configurar o sistema para importar dados diretamente de uma planilha do Google Sheets.

## 📋 Pré-requisitos

1. Uma conta Google com acesso à planilha
2. Um arquivo JSON de credenciais do Google (Service Account)
3. ID da planilha do Google Sheets

## 🔧 Passo 1: Criar Service Account no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **Service Account**
5. Preencha os dados e clique em **Create and Continue**
6. Na etapa de **Grant this service account access to project**, você pode pular (Role: None)
7. Clique em **Done**

## 🔑 Passo 2: Gerar Chave JSON

1. Na lista de Service Accounts, clique no que você acabou de criar
2. Vá na aba **Keys**
3. Clique em **Add Key** > **Create new key**
4. Selecione **JSON** e clique em **Create**
5. O arquivo JSON será baixado automaticamente

## 📊 Passo 3: Compartilhar Planilha com Service Account

1. Abra sua planilha do Google Sheets
2. Clique em **Compartilhar** (botão no canto superior direito)
3. No arquivo JSON baixado, encontre o campo `client_email` (algo como `nome@projeto.iam.gserviceaccount.com`)
4. Cole esse email no campo de compartilhamento
5. Dê permissão de **Visualizador** (Viewer) - apenas leitura é suficiente
6. Clique em **Enviar**

## 🆔 Passo 4: Obter ID da Planilha

O ID da planilha está na URL:
```
https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
```

Copie apenas a parte `SEU_ID_AQUI` (a string longa entre `/d/` e `/edit`)

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env` na raiz do projeto:

```env
# Google Sheets Configuration
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=seu_id_da_planilha_aqui
GOOGLE_SHEET_RANGE=  # Opcional: ex. "Aba1!A1:Z1000" ou apenas "Aba1"
```

### Explicação das Variáveis:

- **GOOGLE_CREDENTIALS_FILE**: Caminho para o arquivo JSON de credenciais (pode ser relativo à raiz do projeto ou absoluto)
- **GOOGLE_SHEET_ID**: ID da planilha do Google Sheets
- **GOOGLE_SHEET_RANGE**: (Opcional) Range específico para ler. Se não especificado, lê toda a primeira aba

## 📁 Passo 6: Colocar Arquivo de Credenciais

Coloque o arquivo JSON de credenciais baixado na raiz do projeto (ou no caminho especificado em `GOOGLE_CREDENTIALS_FILE`).

**⚠️ IMPORTANTE**: Adicione o arquivo JSON ao `.gitignore` para não commitar credenciais!

```gitignore
# Credenciais Google
google-credentials.json
*-credentials.json
```

## 🚀 Passo 7: Executar Importação

Execute o comando:

```bash
npm run update:sheets
```

Ou diretamente:

```bash
node scripts/updateFromGoogleSheets.js
```

## 📝 Exemplo de Uso

### Exemplo 1: Ler toda a primeira aba
```env
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### Exemplo 2: Ler range específico
```env
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEET_RANGE=Dados!A1:Z1000
```

### Exemplo 3: Ler aba específica (toda)
```env
GOOGLE_CREDENTIALS_FILE=google-credentials.json
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SHEET_RANGE=Dados
```

## 🔍 Como Funciona

O script:

1. **Autentica** usando o arquivo JSON de credenciais
2. **Lê** os dados da planilha do Google Sheets
3. **Normaliza** os dados (mesma lógica do script de Excel)
4. **Verifica** quais protocolos já existem no banco
5. **Atualiza** registros existentes
6. **Insere** novos registros

## ⚠️ Troubleshooting

### Erro: "GOOGLE_CREDENTIALS_FILE não definido"
- Verifique se a variável está no `.env`
- Verifique se o caminho está correto

### Erro: "Arquivo de credenciais não encontrado"
- Verifique se o arquivo JSON existe no caminho especificado
- Verifique se o caminho está correto (relativo ou absoluto)

### Erro: "Planilha não encontrada"
- Verifique se o `GOOGLE_SHEET_ID` está correto
- Verifique se a planilha foi compartilhada com o email do Service Account

### Erro: "Acesso negado"
- Verifique se a planilha foi compartilhada com o email do Service Account
- Verifique se o Service Account tem pelo menos permissão de **Visualizador**

### Erro: "API não habilitada"
- Vá no Google Cloud Console
- **APIs & Services** > **Library**
- Procure por "Google Sheets API"
- Clique em **Enable**

## 📚 Diferenças entre Excel e Google Sheets

| Característica | Excel | Google Sheets |
|----------------|-------|---------------|
| Arquivo necessário | ✅ Sim (físico) | ❌ Não |
| Atualização automática | ❌ Manual | ✅ Pode ser automatizada |
| Acesso remoto | ❌ Precisa do arquivo | ✅ Via API |
| Autenticação | ❌ Não precisa | ✅ Service Account |

## 🔄 Automação

Você pode criar um cron job para atualizar automaticamente:

```javascript
// Exemplo: Atualizar a cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Atualizando dados do Google Sheets...');
  // Executar script
});
```

## 💡 Dicas

1. **Primeira linha como cabeçalho**: O script assume que a primeira linha contém os cabeçalhos das colunas
2. **Protocolo obrigatório**: Registros sem protocolo serão ignorados
3. **Normalização automática**: Os dados são normalizados da mesma forma que o script de Excel
4. **Batch processing**: Os dados são processados em lotes de 500 para melhor performance

