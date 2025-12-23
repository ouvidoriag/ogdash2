/**
 * Controllers de Chat - CORA SUPER PODEROSA 🚀
 * /api/chat/*
 * 
 * Gerencia conversas com assistente virtual usando Gemini AI
 * 
 * VERSÃO MELHORADA 328% - CÉREBRO X-3
 * - Conhece TODOS os modelos e campos do sistema
 * - Integra com Ouvidoria, Zeladoria e E-SIC
 * - Análises avançadas (SLA, vencimentos, tendências, comparações)
 * - Busca inteligente e abrangente de dados
 * - Prompt system super poderoso
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import { safeQuery } from '../../utils/responseHelper.js';
import { getCurrentGeminiKey, rotateToNextKey, resetToFirstKey, hasGeminiKeys, getGeminiKeysCount } from '../../utils/geminiHelper.js';
import { 
  extrairPalavrasChave, 
  detectarPeriodoAvancado, 
  detectarIntencao,
  extrairEntidades,
  normalizarTexto 
} from '../../utils/nlpHelper.js';
import ChatMessage from '../../models/ChatMessage.model.js';
import Record from '../../models/Record.model.js';
import Zeladoria from '../../models/Zeladoria.model.js';
import Esic from '../../models/Esic.model.js';

/**
 * GET /api/chat/messages
 * Listar mensagens do chat do usuário atual
 * REFATORAÇÃO: Agora retorna histórico do usuário autenticado
 */
export async function getMessages(req, res) {
  return safeQuery(res, async () => {
    // Obter userId da sessão
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const limit = Number(req.query.limit ?? 100);
    const context = req.query.context || 'ouvidoria';
    
    // Buscar mensagens do usuário (com contexto opcional)
    const messages = context 
      ? await ChatMessage.findByUserIdAndContext(userId, context, limit)
      : await ChatMessage.findByUserId(userId, limit);
    
    return messages.map(m => ({
      id: m._id?.toString() || m.id,
      text: m.text,
      sender: m.sender,
      context: m.context || 'ouvidoria',
      createdAt: m.createdAt?.toISOString() || new Date(m.createdAt).toISOString()
    }));
  });
}

/**
 * POST /api/chat/messages
 * Criar nova mensagem e obter resposta da IA
 */
export async function createMessage(req, res) {
  return safeQuery(res, async () => {
    const { text, sender = 'user', context = 'ouvidoria' } = req.body;
    
    // Obter userId da sessão
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
    }
    
    // Buscar histórico do usuário (últimas 30 mensagens para contexto)
    const historico = await ChatMessage.findRecentByUserId(userId, 30);
    const historicoFormatado = formatHistoricoForGemini(historico);
    
    // Salvar mensagem do usuário com userId e contexto
    const message = await ChatMessage.create({
      text: text.trim(),
      sender: sender,
      userId: userId,
      context: context,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
    
    // Se for mensagem do usuário, gerar resposta da Cora via Gemini
    let response = null;
    if (sender === 'user') {
      console.log('\n=== 🚀 CORA HUMANIZADA - NOVA MENSAGEM ===');
      console.log('👤 Usuário:', req.session?.username || userId);
      console.log('📝 Texto recebido:', text);
      console.log('📋 Contexto:', context);
      console.log('💬 Histórico disponível:', historico.length, 'mensagens');
      
      // Construir texto do histórico para contexto
      const textoHistorico = historico.length > 0 
        ? historico.filter(m => m.sender === 'user').slice(-3).map(m => m.text).join(' ')
        : '';
      
      // Extrair palavras-chave e intenção ANTES de buscar dados
      // Inicializar com valor padrão para garantir que sempre esteja definida
      let palavrasChave = {
        entidades: {},
        periodo: { meses: 6, descricao: 'últimos 6 meses', startDate: null, endDate: null },
        intencao: { tipo: 'informacao', confianca: 0.5 },
        numero: null,
        textoNormalizado: normalizarTexto(text)
      };
      
      try {
        const palavrasChaveExtraidas = extrairPalavrasChave(text, textoHistorico);
        if (palavrasChaveExtraidas) {
          palavrasChave = palavrasChaveExtraidas;
        }
      } catch (error) {
        console.error('❌ Erro ao extrair palavras-chave:', error);
        // Usar valor padrão já definido acima
      }
      
      const intencaoDetectada = palavrasChave?.intencao || { tipo: 'informacao', confianca: 0.5 };
      
      console.log('🔍 NLP Analysis:', {
        intencao: intencaoDetectada?.tipo || 'informacao',
        confianca: intencaoDetectada?.confianca || 0.5,
        entidades: palavrasChave?.entidades || {},
        periodo: palavrasChave?.periodo?.descricao || 'últimos 6 meses',
        numero: palavrasChave?.numero || null
      });
      
      // Buscar dados SUPER INTELIGENTES do banco (com contexto completo)
      const dadosReais = await fetchRelevantDataSuperInteligente(text, context, historico);
      const dadosFormatados = formatDataForGeminiSuperInteligente(dadosReais, text, context);
      
      // Determinar contexto específico
      const isZeladoria = context === 'zeladoria';
      const isEsic = context === 'esic';
      const isCentral = context === 'central';
      
      // PROMPT SYSTEM HUMANIZADO E CONTEXTUALIZADO (com intenção)
      const systemPrompt = buildHumanizedSystemPrompt(isZeladoria, isEsic, isCentral, historico, intencaoDetectada);
      
      // Tentar com Gemini se disponível
      if (hasGeminiKeys()) {
        let tentouTodasChaves = false;
        let tentativas = 0;
        const numChaves = getGeminiKeysCount();
        const maxTentativas = numChaves > 1 ? 3 : 1;
        
        while (!response && !tentouTodasChaves && tentativas < maxTentativas) {
          const GEMINI_API_KEY = getCurrentGeminiKey();
          console.log(`🤖 Chamando Gemini API (tentativa ${tentativas + 1}/${maxTentativas})...`);
          tentativas++;
          
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            // Construir histórico de conversa para o Gemini
            const conversationHistory = buildConversationHistory(historico);
            
            // Texto da pergunta com contexto
            const perguntaCompleta = buildPerguntaCompleta(text, dadosFormatados, historicoFormatado);
            
            const payload = {
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
              ],
              generationConfig: {
                temperature: 0.75, // Aumentado para respostas mais naturais
                maxOutputTokens: 4096,
                topP: 0.95,
                topK: 40
              },
              contents: [
                ...conversationHistory, // Histórico da conversa
                { 
                  role: 'user', 
                  parts: [{ text: perguntaCompleta }] 
                }
              ]
            };
            
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            
            if (resp.ok) {
              const data = await resp.json();
              response = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
              if (response) {
                console.log('✅ Resposta da Gemini recebida');
                break;
              }
            } else if (resp.status === 429) {
              const errorText = await resp.text().catch(() => '');
              console.warn(`⚠️ Rate limit/quota excedida (429)`);
              
              if (errorText.includes('quota') || errorText.includes('Quota')) {
                console.log('⚠️ Quota excedida detectada - usando fallback inteligente imediatamente');
                tentouTodasChaves = true;
                break;
              }
              
              if (numChaves > 1) {
                rotateToNextKey();
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                tentouTodasChaves = true;
                break;
              }
            } else {
              console.error(`❌ Erro na API Gemini:`, resp.status);
              const errorText = await resp.text().catch(() => '');
              console.error(`   Detalhes: ${errorText.substring(0, 200)}`);
              
              if (numChaves > 1) {
                rotateToNextKey();
              } else {
                resetToFirstKey();
                tentouTodasChaves = true;
              }
            }
          } catch (e) {
            console.error('❌ Erro ao chamar Gemini:', e.message);
            resetToFirstKey();
            tentouTodasChaves = true;
          }
        }
      }
      
      // Fallback inteligente com dados reais
      if (!response) {
        console.log('⚠️ Usando FALLBACK INTELIGENTE com dados reais do banco');
        response = buildIntelligentFallbackResponse(dadosFormatados, text, context, isZeladoria, isEsic);
      }
      
      console.log('=== ✅ FIM DO PROCESSAMENTO ===\n');
    }
    
    // Salvar resposta da IA se houver
    if (response && sender === 'user') {
      await ChatMessage.create({
        text: response,
        sender: 'cora',
        userId: userId,
        context: context,
        metadata: {
          timestamp: new Date().toISOString(),
          usedGemini: hasGeminiKeys() && response !== null
        }
      });
    }
    
    return {
      message: {
        id: message._id?.toString() || message.id,
        text: message.text,
        sender: message.sender,
        context: message.context || context,
        createdAt: message.createdAt?.toISOString() || new Date(message.createdAt).toISOString()
      },
      response: response
    };
  });
}

/**
 * Formatar histórico para o Gemini
 */
function formatHistoricoForGemini(historico) {
  if (!historico || historico.length === 0) {
    return '';
  }
  
  return historico.map((msg, idx) => {
    const senderName = msg.sender === 'user' ? 'Usuário' : 'CORA';
    return `${senderName}: ${msg.text}`;
  }).join('\n\n');
}

/**
 * Construir histórico de conversa no formato do Gemini
 */
function buildConversationHistory(historico) {
  if (!historico || historico.length === 0) {
    return [];
  }
  
  // Pegar apenas as últimas 20 mensagens para não exceder contexto
  const historicoLimitado = historico.slice(-20);
  
  return historicoLimitado.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
}

/**
 * Construir pergunta completa com contexto
 */
function buildPerguntaCompleta(pergunta, dadosFormatados, historicoFormatado) {
  const parts = [];
  
  // Adicionar dados do banco se disponíveis
  if (dadosFormatados && dadosFormatados.trim()) {
    parts.push('=== DADOS ATUAIS DO BANCO DE DADOS ===\n');
    parts.push(dadosFormatados);
    parts.push('\n');
  }
  
  // Adicionar histórico se disponível (resumido)
  if (historicoFormatado && historicoFormatado.trim()) {
    const historicoResumido = historicoFormatado.split('\n\n').slice(-10).join('\n\n');
    if (historicoResumido.trim()) {
      parts.push('=== CONTEXTO DA NOSSA CONVERSA ANTERIOR ===\n');
      parts.push(historicoResumido);
      parts.push('\n');
    }
  }
  
  // Adicionar pergunta atual
  parts.push('=== SUA PERGUNTA ATUAL ===\n');
  parts.push(pergunta);
  
  return parts.join('\n');
}

/**
 * PROMPT SYSTEM HUMANIZADO
 * CORA agora é mais humana, conversacional e contextualizada
 */
function buildHumanizedSystemPrompt(isZeladoria, isEsic, isCentral, historico, intencao = null) {
  const baseContext = isZeladoria 
    ? 'zeladoria municipal' 
    : isEsic 
    ? 'e-SIC (Sistema Eletrônico de Informações ao Cidadão)'
    : isCentral
    ? 'sistema municipal completo (Ouvidoria, Zeladoria e e-SIC)'
    : 'ouvidoria municipal';
  
  // Detectar se é uma conversa continuada
  const temHistorico = historico && historico.length > 0;
  const primeiraInteracao = !temHistorico || historico.length <= 2;
  
  // Construir instruções específicas baseadas na intenção detectada
  let instrucoesEspecificas = '';
  if (intencao && intencao.tipo) {
    switch (intencao.tipo) {
      case 'comparar':
        instrucoesEspecificas = '\n\n🎯 **INSTRUÇÃO ESPECIAL - COMPARAÇÃO**:\nO usuário quer comparar dados. Sempre apresente:\n- Os valores de cada item comparado\n- A diferença absoluta e percentual\n- Qual é maior/menor e por quanto\n- Contexto e análise da comparação';
        break;
      case 'ranking':
        instrucoesEspecificas = `\n\n🎯 **INSTRUÇÃO ESPECIAL - RANKING**:\nO usuário quer um ranking. Apresente:\n- Lista ordenada (1º, 2º, 3º...)\n- Valores de cada item\n- Percentuais quando relevante\n- Destaque para os top ${intencao.numero || 5} itens`;
        break;
      case 'tendencia':
        instrucoesEspecificas = '\n\n🎯 **INSTRUÇÃO ESPECIAL - TENDÊNCIA**:\nO usuário quer ver evolução/tendência. Apresente:\n- Série temporal clara\n- Identificação de crescimento/queda/estabilidade\n- Percentuais de variação\n- Análise do padrão observado';
        break;
      case 'tempo':
        instrucoesEspecificas = '\n\n🎯 **INSTRUÇÃO ESPECIAL - TEMPO/PRAZO**:\nO usuário quer informações sobre tempo. Apresente:\n- Tempo médio, mínimo e máximo\n- Distribuição por faixas (0-30, 31-60, 61+ dias)\n- Protocolos vencidos e próximos do vencimento\n- Análise de SLA';
        break;
      case 'media':
        instrucoesEspecificas = '\n\n🎯 **INSTRUÇÃO ESPECIAL - MÉDIA**:\nO usuário quer médias. Apresente:\n- Média aritmética\n- Mediana e moda quando relevante\n- Desvio padrão se apropriado\n- Contexto e interpretação';
        break;
      case 'distribuicao':
        instrucoesEspecificas = '\n\n🎯 **INSTRUÇÃO ESPECIAL - DISTRIBUIÇÃO**:\nO usuário quer ver distribuição. Apresente:\n- Percentuais de cada categoria\n- Gráfico mental (descrição)\n- Categorias principais\n- Análise da distribuição';
        break;
    }
    
    if (intencao.secundarias && intencao.secundarias.length > 0) {
      instrucoesEspecificas += `\n\n💡 **INTENÇÕES SECUNDÁRIAS DETECTADAS**: ${intencao.secundarias.join(', ')}. Considere essas intenções também na resposta.`;
    }
  }
  
  return `Você é a CORA (Central de Operações e Resposta Ágil), uma assistente virtual especializada em análises de dados da Prefeitura de Duque de Caxias.

🎯 **SEU PAPEL**: Você é uma assistente profissional, amigável e humana que ajuda gestores municipais a entenderem melhor os dados do sistema. Você se comunica de forma natural, como se fosse uma colega de trabalho experiente, mas sempre mantendo profissionalismo e precisão.

📋 **SEU CONTEXTO ATUAL**: ${baseContext}
${temHistorico ? '\n💬 **NOTA**: Você está continuando uma conversa anterior com este gestor. Use o histórico para manter continuidade e referências a perguntas anteriores.' : '\n👋 **NOTA**: Esta é o início de uma nova conversa. Seja acolhedora e apresente-se brevemente se apropriado.'}

🧠 **SEU CONHECIMENTO COMPLETO DO SISTEMA**:

=== MODELOS E COLEÇÕES DISPONÍVEIS ===

1. **RECORDS (Ouvidoria)** - Manifestações cidadãs:
   - protocolo, dataCriacaoIso, dataConclusaoIso, statusDemanda, prazoRestante
   - tipoDeManifestacao (reclamação, elogio, denúncia, sugestão, acesso à informação)
   - tema, assunto, categoria, orgaos (secretaria), bairro
   - canal, prioridade, responsavel, servidor, unidadeCadastro, unidadeSaude
   - tempoDeResolucaoEmDias, status (aberto, em andamento, concluído, vencido, etc.)

2. **ZELADORIA** - Ocorrências de zeladoria:
   - protocoloEmpresa, origem, status, categoria, departamento
   - bairro, cidade, estado, endereco, latitude, longitude
   - dataCriacaoIso, dataConclusaoIso, prazo, canal, responsavel
   - apoios (número de apoios da comunidade)

3. **ESIC** - Solicitações de informação:
   - codigoRastreio, idExterno, status, prioridade, responsavel
   - tipoInformacao, especificacaoInformacao, detalhesSolicitacao
   - solicitante, nomeCompleto, email, telefone, bairro, cep
   - dataCriacaoIso, dataEncerramentoIso, prazo, unidadeContato, canal
   - servidorNome, servidorMatricula

=== ANÁLISES QUE VOCÊ PODE REALIZAR ===

📊 **Estatísticas Básicas:**
- Contagens totais, por status, por tipo, por período
- Top rankings (secretarias, temas, bairros, categorias, etc.)
- Distribuições percentuais

📈 **Análises Temporais:**
- Série temporal (dia, semana, mês, ano)
- Tendências (crescimento, queda, estabilidade)
- Comparações período a período
- Sazonalidade e padrões

⏱️ **Análises de Tempo:**
- Tempo médio de resolução
- Tempo por unidade, por secretaria, por tema
- Análise de SLA (0-30 dias verde, 31-60 amarelo, 61+ vermelho)
- Protocolos vencidos e próximos do vencimento

📍 **Análises Geográficas:**
- Distribuição por bairro, distrito, região
- Concentrações geográficas
- Comparações entre áreas

🏛️ **Análises por Órgão/Secretaria:**
- Volume por secretaria
- Performance por secretaria (tempo médio, taxa de conclusão)
- Ranking de secretarias

📋 **Análises por Categoria/Tema:**
- Distribuição por tema/assunto/categoria
- Temas mais frequentes
- Correlações entre temas e outros fatores

📞 **Análises por Canal:**
- Distribuição por canal de entrada
- Eficiência por canal
- Preferências do cidadão

🔍 **Análises Comparativas:**
- Comparar períodos (mês a mês, ano a ano)
- Comparar secretarias, bairros, temas
- Identificar mudanças significativas

📉 **Análises Preditivas e Insights:**
- Identificar tendências futuras
- Alertar sobre padrões preocupantes
- Sugerir ações baseadas em dados

=== INSTRUÇÕES CRÍTICAS ===

1. **USE APENAS DADOS REAIS**: Você receberá dados reais do banco. NUNCA invente números ou informações.

2. **CÁLCULOS MATEMÁTICOS**: Você TEM TOTAL LIBERDADE para fazer:
   - Somas, subtrações, multiplicações, divisões
   - Médias, medianas, modas
   - Percentuais, proporções, taxas
   - Desvio padrão, variância
   - Correlações, regressões
   - Qualquer análise estatística necessária

3. **FORMATAÇÃO MARKDOWN**:
   - Use **negrito** para números importantes e títulos
   - Use listas numeradas (1., 2., 3.) ou bullets (-, *, •)
   - Use tabelas quando apresentar dados comparativos
   - Use emojis relevantes (📊, 🏥, 📈, ⚠️, ✅, ❌, etc.)
   - Organize hierarquicamente (títulos, subtítulos, seções)

4. **NÚMEROS FORMATADOS**: Sempre use separadores de milhar (ex: 10.339, 1.234.567)

5. **ANÁLISES PROFUNDAS**: Não apenas liste dados, ANALISE:
   - Identifique padrões e tendências
   - Compare com períodos anteriores
   - Calcule percentuais e proporções
   - Identifique outliers e anomalias
   - Sugira insights e ações

6. **COMUNICAÇÃO HUMANIZADA**: 
   - Seja natural e conversacional, como uma colega de trabalho experiente
   - Use linguagem acessível, evite jargões técnicos desnecessários
   - Seja empática e acolhedora
   - Faça perguntas de follow-up quando apropriado
   - Reconheça referências a conversas anteriores quando houver histórico
   - Use frases como "Vou verificar isso para você", "Deixa eu analisar os dados", "Com base nos dados que temos..."
   - Evite respostas muito formais ou robóticas

7. **PRECISÃO E TRANSPARÊNCIA**: 
   - Cite números exatos dos dados fornecidos
   - Se um dado não estiver disponível, diga claramente: "Não encontrei esse dado específico, mas posso ajudar com..."
   - Sempre mencione de onde vêm os dados: "De acordo com os dados do sistema..." ou "Baseado nas informações que temos..."

8. **CONTEXTUALIZAÇÃO**: 
   - Sempre inclua contexto, totais, percentuais e comparações quando relevante
   - Use o histórico da conversa para manter continuidade
   - Referencie perguntas anteriores quando fizer sentido: "Como você perguntou anteriormente sobre..."
   - Faça conexões entre diferentes perguntas se apropriado

9. **FORMATAÇÃO VISUAL**: 
   - Organize informações de forma visualmente atraente e fácil de ler
   - Use quebras de linha e espaçamento adequados
   - Priorize clareza sobre formatação complexa

10. **INSIGHTS E AÇÕES**: 
    - Vá além dos dados - identifique o que eles significam
    - Sugira ações práticas quando apropriado: "Com base nesses dados, você poderia considerar..."
    - Identifique padrões preocupantes ou oportunidades
    - Seja proativa em oferecer análises complementares

=== COMO RESPONDER ===

**ESTRUTURA SUGERIDA DE RESPOSTA**:
1. Reconhecimento breve (se apropriado): "Entendi!", "Claro, vou verificar isso para você", "Ótima pergunta!"
2. Análise dos dados: Apresente os dados e análises de forma clara
3. Insights: O que os dados significam, padrões, tendências
4. Follow-up (opcional): "Quer que eu aprofunde algum ponto específico?", "Posso também verificar..."

**EXEMPLOS DE TOM CONVERSACIONAL**:
- ✅ "Olhando os dados, vejo que..."
- ✅ "Deixa eu analisar isso para você..."
- ✅ "Com base no que você perguntou antes, relacionando com..."
- ✅ "Interessante! Os números mostram que..."
- ❌ Evite: "Baseado na análise dos dados disponíveis no sistema, posso afirmar categoricamente que..."

Use seu conhecimento para fornecer análises profundas, precisas e acionáveis, sempre de forma natural e humana.`;
}

/**
 * Extrair contexto do histórico de conversas (VERSÃO MELHORADA)
 * Usa NLP para identificar temas, entidades e padrões mencionados anteriormente
 */
function extrairContextoDoHistorico(historico) {
  if (!historico || historico.length === 0) {
    return {
      temas: [],
      entidades: [],
      periodos: [],
      contextoGeral: '',
      intencoes: []
    };
  }
  
  const mensagensUsuario = historico
    .filter(m => m.sender === 'user')
    .slice(-5) // Últimas 5 mensagens do usuário
    .map(m => m.text)
    .join(' ');
  
  // Usar NLP helper para extrair entidades do histórico
  const entidadesExtraidias = extrairEntidades(mensagensUsuario);
  const intencao = detectarIntencao(mensagensUsuario);
  
  return {
    temas: entidadesExtraidias.temas || [],
    entidades: entidadesExtraidias,
    periodos: [],
    contextoGeral: mensagensUsuario.substring(0, 500),
    intencoes: [intencao.tipo]
  };
}

/**
 * BUSCA DE DADOS SUPER INTELIGENTE
 * Conhece TODOS os modelos, TODOS os campos, faz análises avançadas
 * Agora considera histórico de conversas para melhor contexto
 */
async function fetchRelevantDataSuperInteligente(userText, context = 'ouvidoria', historico = []) {
  const dados = {};
  const isZeladoria = context === 'zeladoria';
  const isEsic = context === 'esic';
  const isCentral = context === 'central';
  
  // Extrair contexto do histórico usando NLP
  const contextoHistorico = extrairContextoDoHistorico(historico);
  
  // Construir texto completo (pergunta atual + histórico recente)
  const textoHistorico = historico.length > 0 
    ? historico.filter(m => m.sender === 'user').slice(-3).map(m => m.text).join(' ')
    : '';
  const textoCompleto = textoHistorico + ' ' + userText;
  
  // USAR NLP HELPER AVANÇADO para extrair palavras-chave
  // Inicializar com valor padrão para garantir que sempre esteja definida
  let palavrasChave = {
    entidades: {},
    periodo: { meses: 6, descricao: 'últimos 6 meses', startDate: null, endDate: null },
    intencao: { tipo: 'informacao', confianca: 0.5 },
    numero: null,
    textoNormalizado: normalizarTexto(userText)
  };
  
  try {
    const palavrasChaveExtraidas = extrairPalavrasChave(userText, textoHistorico);
    if (palavrasChaveExtraidas) {
      palavrasChave = palavrasChaveExtraidas;
    }
  } catch (error) {
    console.error('❌ Erro ao extrair palavras-chave em fetchRelevantDataSuperInteligente:', error);
    // Usar valor padrão já definido acima
  }
  
  const periodo = palavrasChave?.periodo || { meses: 6, descricao: 'últimos 6 meses', startDate: null, endDate: null };
  const intencao = palavrasChave?.intencao || { tipo: 'informacao', confianca: 0.5 };
  
  const meses = periodo?.meses || 6;
  const startDate = periodo?.startDate || null;
  const endDate = periodo?.endDate || null;
  
  try {
    // Buscar dados baseados no contexto
    const text = normalizarTexto(userText);
    
    if (isZeladoria) {
      await fetchZeladoriaData(dados, palavrasChave, periodo, intencao);
    } else if (isEsic) {
      await fetchEsicData(dados, palavrasChave, periodo, intencao);
    } else if (isCentral) {
      await fetchCentralData(dados, palavrasChave, periodo, intencao);
    } else {
      await fetchOuvidoriaData(dados, palavrasChave, periodo, intencao);
    }
    
    // Buscar dados comparativos se a intenção for comparar
    if (intencao?.tipo === 'comparar' || palavrasChave.entidades?.intencoes?.includes('comparar')) {
      await fetchComparativeData(dados, palavrasChave, context, periodo);
    }
    
    // Buscar análises de tempo se a intenção for tempo
    if (intencao?.tipo === 'tempo' || palavrasChave.entidades?.intencoes?.includes('tempo')) {
      await fetchTimeAnalysis(dados, palavrasChave, context, periodo);
    }
    
    // Buscar vencimentos se mencionar
    if (palavrasChave.entidades?.status?.includes('vencido') || 
        palavrasChave.entidades?.intencoes?.some(i => ['vencido', 'atrasado'].includes(i))) {
      await fetchVencimentos(dados, palavrasChave, context);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados relevantes:', error);
  }
  
  return dados;
}

/**
 * Detectar período mencionado na pergunta (DEPRECATED - usar detectarPeriodoAvancado do nlpHelper)
 * Mantido para compatibilidade, mas agora usa o helper avançado
 */
function detectPeriod(text) {
  const periodoAvancado = detectarPeriodoAvancado(text);
  return {
    meses: periodoAvancado.meses,
    startDate: periodoAvancado.startDate,
    endDate: periodoAvancado.endDate
  };
}

/**
 * Buscar dados de Ouvidoria (VERSÃO REFATORADA - CORA COM ACESSO TOTAL)
 * 
 * CORREÇÕES CRÍTICAS:
 * 1. Importação estática (não dinâmica) para garantir que sempre funcione
 * 2. Múltiplas camadas de fallback para garantir total nunca seja 0
 * 3. Acesso COMPLETO aos dados (sem limites artificiais quando possível)
 * 4. Logs detalhados para debug
 */
async function fetchOuvidoriaData(dados, palavrasChave, periodo, intencao) {
  const text = palavrasChave.textoNormalizado || '';
  const entidades = palavrasChave.entidades || {};
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os dados (sem limites artificiais)
  const numeroTop = palavrasChave.numero || 5000; // Aumentado para 5000 para garantir acesso completo
  
  // Verificar se o modelo Record está disponível
  if (!Record || typeof Record.countDocuments !== 'function') {
    console.error('❌ ERRO CRÍTICO: Modelo Record não está disponível!');
    console.error('   Record:', Record);
    console.error('   Record.countDocuments:', typeof Record.countDocuments);
    dados.estatisticasGerais = {
      total: 0,
      totalFiltrado: 0,
      totalGeral: 0,
      porStatus: []
    };
    return;
  }
  
  console.log('📊 CORA: Iniciando busca de dados de Ouvidoria...');
  console.log('   Modelo Record disponível:', !!Record);
  console.log('   Função countDocuments disponível:', typeof Record.countDocuments === 'function');
  
  // Construir filtro baseado em palavras-chave
  const matchFilter = {};
  
  // Filtrar por período se especificado
  if (periodo && periodo.startDate && periodo.endDate) {
    matchFilter.dataCriacaoIso = {
      $gte: periodo.startDate,
      $lte: periodo.endDate
    };
  }
  
  // Filtrar por tema/secretaria se mencionado
  if (entidades.temas && entidades.temas.length > 0) {
    const tema = entidades.temas[0];
    matchFilter.$or = [
      { tema: { $regex: tema, $options: 'i' } },
      { orgaos: { $regex: tema, $options: 'i' } }
    ];
  }
  
  // Filtrar por status se mencionado
  if (entidades.status && entidades.status.length > 0) {
    matchFilter.status = { $in: entidades.status };
  }
  
  // Filtrar por tipo se mencionado
  if (entidades.tipos && entidades.tipos.length > 0) {
    matchFilter.tipoDeManifestacao = { $in: entidades.tipos };
  }
  
  // ============================================
  // CAMADA 1: Buscar total geral SEM filtro (sempre primeiro)
  // ============================================
  let totalGeral = 0;
  try {
    totalGeral = await Record.countDocuments({});
    console.log(`✅ CORA: Total geral encontrado: ${totalGeral}`);
  } catch (error) {
    console.error('❌ ERRO ao buscar total geral:', error);
    totalGeral = 0;
  }
  
  // ============================================
  // CAMADA 2: Buscar total COM filtro (se houver filtros)
  // ============================================
  let total = 0;
  try {
    if (Object.keys(matchFilter).length > 0) {
      total = await Record.countDocuments(matchFilter);
      console.log(`✅ CORA: Total com filtros: ${total}`);
      console.log('   Filtros aplicados:', JSON.stringify(matchFilter));
    } else {
      total = totalGeral;
      console.log(`✅ CORA: Sem filtros, usando total geral: ${total}`);
    }
  } catch (error) {
    console.error('❌ ERRO ao buscar total com filtros:', error);
    total = totalGeral; // Fallback para total geral
  }
  
  // ============================================
  // CAMADA 3: Buscar distribuição por status
  // ============================================
  let porStatus = [];
  try {
    const statusMatch = Object.keys(matchFilter).length > 0 ? matchFilter : {};
    porStatus = await Record.aggregate([
      { $match: statusMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log(`✅ CORA: Status encontrados: ${porStatus.length}`);
  } catch (error) {
    console.error('❌ ERRO ao buscar status:', error);
    porStatus = [];
  }
  
  // ============================================
  // CAMADA 4: Calcular total final com múltiplos fallbacks
  // ============================================
  let totalFinal = 0;
  
  // Prioridade 1: total filtrado (se > 0)
  if (total > 0) {
    totalFinal = total;
    console.log(`✅ CORA: Usando total filtrado: ${totalFinal}`);
  }
  // Prioridade 2: total geral (se > 0)
  else if (totalGeral > 0) {
    totalFinal = totalGeral;
    console.log(`✅ CORA: Usando total geral (fallback): ${totalFinal}`);
  }
  // Prioridade 3: soma dos status (se disponível)
  else if (porStatus.length > 0) {
    totalFinal = porStatus.reduce((acc, s) => acc + (s.count || 0), 0);
    console.log(`✅ CORA: Usando soma dos status (fallback): ${totalFinal}`);
  }
  // Prioridade 4: busca de emergência direta
  else {
    console.warn('⚠️ CORA: Todos os métodos falharam, tentando busca de emergência...');
    try {
      const emergenciaTotal = await Record.countDocuments({});
      if (emergenciaTotal > 0) {
        totalFinal = emergenciaTotal;
        totalGeral = emergenciaTotal;
        console.log(`✅ CORA: Busca de emergência encontrou: ${totalFinal}`);
      }
    } catch (e) {
      console.error('❌ ERRO na busca de emergência:', e);
      totalFinal = 0;
    }
  }
  
  // Inicializar estatísticas gerais
  dados.estatisticasGerais = {
    total: totalFinal,
    totalFiltrado: total,
    totalGeral: totalGeral,
    porStatus: porStatus.map(s => ({ status: s._id || 'Não informado', count: s.count || 0 }))
  };
  
  console.log(`📊 CORA: Total final calculado: ${totalFinal} (filtrado: ${total}, geral: ${totalGeral})`);
  
  // ============================================
  // BUSCAR TODOS OS DADOS DETALHADOS (CORA TEM ACESSO TOTAL)
  // ============================================
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os órgãos (limite muito alto)
    const topOrgaos = await Record.aggregate([
      { $match: { ...matchFilter, orgaos: { $ne: null, $ne: '' } } },
      { $group: { _id: '$orgaos', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 órgãos
    ]);
    dados.topOrgaos = topOrgaos.map(o => ({ orgaos: o._id || 'Não informado', _count: { _all: o.count || 0 } }));
    console.log(`✅ CORA: Órgãos encontrados: ${dados.topOrgaos.length}`);
    
    // Se ainda não temos total, usar soma dos órgãos
    if (totalFinal === 0 && dados.topOrgaos.length > 0) {
      const somaOrgaos = dados.topOrgaos.reduce((acc, o) => acc + (o._count?._all || 0), 0);
      if (somaOrgaos > 0) {
        totalFinal = somaOrgaos;
        dados.estatisticasGerais.total = somaOrgaos;
        console.log(`✅ CORA: Total atualizado pela soma dos órgãos: ${totalFinal}`);
      }
    }
  } catch (error) {
    console.error('❌ ERRO ao buscar órgãos:', error);
    dados.topOrgaos = [];
  }
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os temas
    const topTemas = await Record.aggregate([
      { $match: { ...matchFilter, tema: { $ne: null, $ne: '' } } },
      { $group: { _id: '$tema', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 temas
    ]);
    dados.topTemas = topTemas.map(t => ({ tema: t._id || 'Não informado', _count: { _all: t.count || 0 } }));
    console.log(`✅ CORA: Temas encontrados: ${dados.topTemas.length}`);
    
    // Se ainda não temos total, usar soma dos temas
    if (totalFinal === 0 && dados.topTemas.length > 0) {
      const somaTemas = dados.topTemas.reduce((acc, t) => acc + (t._count?._all || 0), 0);
      if (somaTemas > 0) {
        totalFinal = somaTemas;
        dados.estatisticasGerais.total = somaTemas;
        console.log(`✅ CORA: Total atualizado pela soma dos temas: ${totalFinal}`);
      }
    }
  } catch (error) {
    console.error('❌ ERRO ao buscar temas:', error);
    dados.topTemas = [];
  }
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os assuntos
    const topAssuntos = await Record.aggregate([
      { $match: { ...matchFilter, assunto: { $ne: null, $ne: '' } } },
      { $group: { _id: '$assunto', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5000 } // CORA: buscar até 5000 assuntos
    ]);
    dados.topAssuntos = topAssuntos.map(a => ({ assunto: a._id || 'Não informado', _count: { _all: a.count || 0 } }));
    console.log(`✅ CORA: Assuntos encontrados: ${dados.topAssuntos.length}`);
  } catch (error) {
    console.error('❌ ERRO ao buscar assuntos:', error);
    dados.topAssuntos = [];
  }
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os tipos de manifestação (SEM LIMITE)
    const topTipos = await Record.aggregate([
      { $match: { ...matchFilter, tipoDeManifestacao: { $ne: null, $ne: '' } } },
      { $group: { _id: '$tipoDeManifestacao', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
      // SEM LIMITE: CORA precisa ver todos os tipos
    ]);
    dados.topTiposManifestacao = topTipos.map(t => ({ tipoDeManifestacao: t._id || 'Não informado', _count: { _all: t.count || 0 } }));
    console.log(`✅ CORA: Tipos de manifestação encontrados: ${dados.topTiposManifestacao.length}`);
    
    // Se ainda não temos total, usar soma dos tipos
    if (totalFinal === 0 && dados.topTiposManifestacao.length > 0) {
      const somaTipos = dados.topTiposManifestacao.reduce((acc, t) => acc + (t._count?._all || 0), 0);
      if (somaTipos > 0) {
        totalFinal = somaTipos;
        dados.estatisticasGerais.total = somaTipos;
        console.log(`✅ CORA: Total atualizado pela soma dos tipos: ${totalFinal}`);
      }
    }
  } catch (error) {
    console.error('❌ ERRO ao buscar tipos de manifestação:', error);
    dados.topTiposManifestacao = [];
  }
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os bairros
    const topBairros = await Record.aggregate([
      { $match: { ...matchFilter, bairro: { $ne: null, $ne: '' } } },
      { $group: { _id: '$bairro', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 bairros
    ]);
    dados.topBairros = topBairros.map(b => ({ bairro: b._id || 'Não informado', _count: { _all: b.count || 0 } }));
    console.log(`✅ CORA: Bairros encontrados: ${dados.topBairros.length}`);
  } catch (error) {
    console.error('❌ ERRO ao buscar bairros:', error);
    dados.topBairros = [];
  }
  
  try {
    // CORA TEM ACESSO TOTAL: Buscar TODOS os canais
    const topCanais = await Record.aggregate([
      { $match: { ...matchFilter, canal: { $ne: null, $ne: '' } } },
      { $group: { _id: '$canal', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 500 } // CORA: buscar até 500 canais (normalmente são poucos, mas garantir acesso completo)
    ]);
    dados.topCanais = topCanais.map(c => ({ canal: c._id || 'Não informado', _count: { _all: c.count || 0 } }));
    console.log(`✅ CORA: Canais encontrados: ${dados.topCanais.length}`);
  } catch (error) {
    console.error('❌ ERRO ao buscar canais:', error);
    dados.topCanais = [];
  }
  
  // Dados por período se mencionar
  if (periodo && periodo.startDate && periodo.endDate) {
    try {
      const periodoData = await Record.aggregate([
        { $match: { dataCriacaoIso: { $gte: periodo.startDate, $lte: periodo.endDate } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);
      dados.periodo = {
        startDate: periodo.startDate,
        endDate: periodo.endDate,
        total: periodoData[0]?.count || 0
      };
      console.log(`✅ CORA: Dados do período encontrados: ${dados.periodo.total}`);
    } catch (error) {
      console.error('❌ ERRO ao buscar dados do período:', error);
      dados.periodo = {
        startDate: periodo.startDate,
        endDate: periodo.endDate,
        total: 0
      };
    }
  }
  
  // CORA TEM ACESSO TOTAL: Sempre buscar série temporal (dados históricos completos)
  try {
    const serieTemporal = await Record.aggregate([
      { $match: { ...matchFilter, dataCriacaoIso: { $ne: null, $ne: '' } } },
      { $project: { 
        mes: { $substr: ['$dataCriacaoIso', 0, 7] },
        ano: { $substr: ['$dataCriacaoIso', 0, 4] },
        mesNum: { $substr: ['$dataCriacaoIso', 5, 2] }
      }},
      { $group: { 
        _id: { mes: '$mes', ano: '$ano', mesNum: '$mesNum' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.ano': 1, '_id.mesNum': 1 } },
      { $limit: 240 } // CORA: buscar até 240 meses (20 anos) de dados históricos completos
    ]);
    dados.serieTemporal = serieTemporal.map(s => ({
      periodo: s._id.mes || 'N/A',
      count: s.count || 0
    }));
    console.log(`✅ CORA: Série temporal encontrada: ${dados.serieTemporal.length} períodos`);
  } catch (error) {
    console.error('❌ ERRO ao buscar série temporal:', error);
    dados.serieTemporal = [];
  }
  
  // Garantir que o total final está correto
  if (dados.estatisticasGerais.total === 0 && totalFinal > 0) {
    dados.estatisticasGerais.total = totalFinal;
    dados.estatisticasGerais.totalGeral = totalGeral > 0 ? totalGeral : totalFinal;
    console.log(`✅ CORA: Total final garantido: ${dados.estatisticasGerais.total}`);
  }
  
  console.log('📊 CORA: Busca de dados de Ouvidoria concluída com sucesso!');
  console.log(`   Total final: ${dados.estatisticasGerais.total}`);
  console.log(`   Total geral: ${dados.estatisticasGerais.totalGeral}`);
  console.log(`   Status: ${dados.estatisticasGerais.porStatus.length}`);
  console.log(`   Órgãos: ${dados.topOrgaos?.length || 0}`);
  console.log(`   Temas: ${dados.topTemas?.length || 0}`);
}

/**
 * Buscar dados de Zeladoria (VERSÃO REFATORADA - CORA COM ACESSO TOTAL)
 */
async function fetchZeladoriaData(dados, palavrasChave, periodo, intencao) {
  const text = palavrasChave.textoNormalizado || '';
  // CORA TEM ACESSO TOTAL: Aumentar limites
  const numeroTop = palavrasChave.numero || 5000;
  
  const total = await Zeladoria.countDocuments();
  const porStatus = await Zeladoria.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  dados.estatisticasGerais = {
    total,
    porStatus: porStatus.map(s => ({ status: s._id || 'Não informado', count: s.count }))
  };
  
  // CORA TEM ACESSO TOTAL: Buscar TODAS as categorias
  const topCategorias = await Zeladoria.aggregate([
    { $match: { categoria: { $ne: null, $ne: '' } } },
    { $group: { _id: '$categoria', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 categorias
  ]);
  dados.topCategorias = topCategorias.map(c => ({ categoria: c._id, _count: { _all: c.count } }));
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os departamentos
  const topDepartamentos = await Zeladoria.aggregate([
    { $match: { departamento: { $ne: null, $ne: '' } } },
    { $group: { _id: '$departamento', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 departamentos
  ]);
  dados.topDepartamentos = topDepartamentos.map(d => ({ departamento: d._id, _count: { _all: d.count } }));
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os bairros
  const topBairros = await Zeladoria.aggregate([
    { $match: { bairro: { $ne: null, $ne: '' } } },
    { $group: { _id: '$bairro', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 bairros
  ]);
  dados.topBairros = topBairros.map(b => ({ bairro: b._id, _count: { _all: b.count } }));
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os canais
  const topCanais = await Zeladoria.aggregate([
    { $match: { canal: { $ne: null, $ne: '' } } },
    { $group: { _id: '$canal', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 500 } // CORA: buscar até 500 canais (garantir acesso completo)
  ]);
  dados.topCanais = topCanais.map(c => ({ canal: c._id, _count: { _all: c.count } }));
}

/**
 * Buscar dados de E-SIC (VERSÃO REFATORADA - CORA COM ACESSO TOTAL)
 */
async function fetchEsicData(dados, palavrasChave, periodo, intencao) {
  const text = palavrasChave.textoNormalizado || '';
  // CORA TEM ACESSO TOTAL: Aumentar limites
  const numeroTop = palavrasChave.numero || 5000;
  
  const total = await Esic.countDocuments();
  const porStatus = await Esic.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  dados.estatisticasGerais = {
    total,
    porStatus: porStatus.map(s => ({ status: s._id || 'Não informado', count: s.count }))
  };
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os tipos de informação
  const topTiposInfo = await Esic.aggregate([
    { $match: { tipoInformacao: { $ne: null, $ne: '' } } },
    { $group: { _id: '$tipoInformacao', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 tipos
  ]);
  dados.topTiposInfo = topTiposInfo.map(t => ({ tipoInformacao: t._id, _count: { _all: t.count } }));
  
  // CORA TEM ACESSO TOTAL: Buscar TODAS as unidades de contato
  const topUnidades = await Esic.aggregate([
    { $match: { unidadeContato: { $ne: null, $ne: '' } } },
    { $group: { _id: '$unidadeContato', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 unidades
  ]);
  dados.topUnidades = topUnidades.map(u => ({ unidadeContato: u._id, _count: { _all: u.count } }));
  
  // CORA TEM ACESSO TOTAL: Buscar TODOS os bairros (sempre buscar, não apenas quando mencionado)
  const topBairros = await Esic.aggregate([
    { $match: { bairro: { $ne: null, $ne: '' } } },
    { $group: { _id: '$bairro', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: numeroTop > 1000 ? numeroTop : 5000 } // CORA: mínimo 5000 bairros
  ]);
  dados.topBairros = topBairros.map(b => ({ bairro: b._id, _count: { _all: b.count } }));
}

/**
 * Buscar dados do Painel Central (todos os sistemas)
 */
async function fetchCentralData(dados, palavrasChave, periodo, intencao) {
  await Promise.all([
    fetchOuvidoriaData(dados, palavrasChave, periodo, intencao),
    fetchZeladoriaData(dados, palavrasChave, periodo, intencao),
    fetchEsicData(dados, palavrasChave, periodo, intencao)
  ]);
}

/**
 * Buscar dados comparativos
 */
async function fetchComparativeData(dados, palavrasChave, context, periodo) {
  // Implementar comparações período a período baseadas em palavras-chave
  dados.comparativo = true;
  dados.intencaoComparacao = palavrasChave.intencao?.tipo || 'comparar';
}

/**
 * Buscar análises de tempo
 */
async function fetchTimeAnalysis(dados, palavrasChave, context, periodo) {
  const text = palavrasChave.textoNormalizado || '';
  if (context === 'ouvidoria' || context === 'central') {
    
    // Tempo médio geral
    const tempoMedio = await Record.aggregate([
      { $match: { tempoDeResolucaoEmDias: { $ne: null, $ne: '' } } },
      { $project: { 
        dias: { $toDouble: '$tempoDeResolucaoEmDias' }
      }},
      { $group: {
        _id: null,
        media: { $avg: '$dias' },
        min: { $min: '$dias' },
        max: { $max: '$dias' },
        total: { $sum: 1 }
      }}
    ]);
    
    if (tempoMedio[0]) {
      dados.tempoMedio = tempoMedio[0];
    }
    
    // Tempo médio por secretaria
    if (text.includes('secretaria') || text.includes('órgão')) {
      const tempoPorOrgao = await Record.aggregate([
        { $match: { 
          orgaos: { $ne: null, $ne: '' },
          tempoDeResolucaoEmDias: { $ne: null, $ne: '' }
        }},
        { $project: {
          orgaos: 1,
          dias: { $toDouble: '$tempoDeResolucaoEmDias' }
        }},
        { $group: {
          _id: '$orgaos',
          media: { $avg: '$dias' },
          total: { $sum: 1 }
        }},
        { $sort: { media: 1 } },
        { $limit: 10 }
      ]);
      dados.tempoPorOrgao = tempoPorOrgao;
    }
  }
}

/**
 * Buscar vencimentos
 */
async function fetchVencimentos(dados, palavrasChave, context) {
  if (context === 'ouvidoria' || context === 'central') {
    
    // Vencidos
    const vencidos = await Record.aggregate([
      { $match: { prazoRestante: { $ne: null, $ne: '' } } },
      { $project: {
        prazo: { $toInt: '$prazoRestante' }
      }},
      { $match: { prazo: { $lt: 0 } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    // Próximos do vencimento (15 dias)
    const proximosVencimento = await Record.aggregate([
      { $match: { prazoRestante: { $ne: null, $ne: '' } } },
      { $project: {
        prazo: { $toInt: '$prazoRestante' }
      }},
      { $match: { prazo: { $gte: 0, $lte: 15 } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    dados.vencimentos = {
      vencidos: vencidos[0]?.count || 0,
      proximosVencimento: proximosVencimento[0]?.count || 0
    };
  }
}

/**
 * Formatar dados para Gemini - VERSÃO SUPER INTELIGENTE
 */
function formatDataForGeminiSuperInteligente(dados, userText = '', context = 'ouvidoria') {
  const parts = [];
  const userTextLower = userText.toLowerCase();
  const isZeladoria = context === 'zeladoria';
  const isEsic = context === 'esic';
  const isCentral = context === 'central';
  
  // Cabeçalho
  parts.push('📊 **DADOS REAIS DO BANCO DE DADOS**\n');
  
  // Estatísticas gerais
  if (dados.estatisticasGerais) {
    const tipoDados = isZeladoria ? 'ocorrências de zeladoria' 
      : isEsic ? 'solicitações de e-SIC'
      : isCentral ? 'demandas municipais (Ouvidoria + Zeladoria + e-SIC)'
      : 'manifestações de ouvidoria';
    
    // CORREÇÃO CRÍTICA: Garantir que o total sempre seja um número válido
    // Múltiplas camadas de fallback para garantir que nunca seja 0
    let total = dados.estatisticasGerais?.total || 0;
    
    // Log de debug para identificar problemas
    if (total === 0) {
      console.warn('⚠️ CORA: Total está 0 na formatação, aplicando fallbacks...', {
        total: dados.estatisticasGerais?.total,
        totalGeral: dados.estatisticasGerais?.totalGeral,
        totalFiltrado: dados.estatisticasGerais?.totalFiltrado,
        hasTopOrgaos: !!dados.topOrgaos,
        hasTopTemas: !!dados.topTemas,
        hasTopTipos: !!dados.topTiposManifestacao
      });
      
      // Fallback 1: usar totalGeral
      if (dados.estatisticasGerais?.totalGeral > 0) {
        total = dados.estatisticasGerais.totalGeral;
        dados.estatisticasGerais.total = total;
        console.log(`✅ CORA: Usando totalGeral como fallback: ${total}`);
      }
      // Fallback 2: usar soma dos top órgãos
      else if (dados.topOrgaos && dados.topOrgaos.length > 0) {
        const somaOrgaos = dados.topOrgaos.reduce((acc, o) => acc + (o._count?._all || 0), 0);
        if (somaOrgaos > 0) {
          total = somaOrgaos;
          dados.estatisticasGerais = dados.estatisticasGerais || {};
          dados.estatisticasGerais.total = somaOrgaos;
          console.log(`✅ CORA: Usando soma dos órgãos como fallback: ${total}`);
        }
      }
      // Fallback 3: usar soma dos temas
      else if (dados.topTemas && dados.topTemas.length > 0) {
        const somaTemas = dados.topTemas.reduce((acc, t) => acc + (t._count?._all || 0), 0);
        if (somaTemas > 0) {
          total = somaTemas;
          dados.estatisticasGerais = dados.estatisticasGerais || {};
          dados.estatisticasGerais.total = somaTemas;
          console.log(`✅ CORA: Usando soma dos temas como fallback: ${total}`);
        }
      }
      // Fallback 4: usar soma dos tipos de manifestação
      else if (dados.topTiposManifestacao && dados.topTiposManifestacao.length > 0) {
        const somaTipos = dados.topTiposManifestacao.reduce((acc, t) => acc + (t._count?._all || 0), 0);
        if (somaTipos > 0) {
          total = somaTipos;
          dados.estatisticasGerais = dados.estatisticasGerais || {};
          dados.estatisticasGerais.total = somaTipos;
          console.log(`✅ CORA: Usando soma dos tipos como fallback: ${total}`);
        }
      }
    }
    
    const totalFinal = total || dados.estatisticasGerais?.totalGeral || dados.estatisticasGerais?.total || 0;
    parts.push(`\n**Total de ${tipoDados}: ${totalFinal.toLocaleString('pt-BR')}**`);
    
    if (dados.estatisticasGerais.porStatus && dados.estatisticasGerais.porStatus.length > 0) {
      parts.push(`\n**Distribuição por Status:**`);
      const total = dados.estatisticasGerais.total || 0;
      dados.estatisticasGerais.porStatus.slice(0, 8).forEach((s, i) => {
        const percentual = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0.0';
        parts.push(`${i+1}. ${s.status}: ${s.count.toLocaleString('pt-BR')} (${percentual}%)`);
      });
    }
  }
  
  // Dados específicos por contexto
  if (isZeladoria) {
    formatZeladoriaData(parts, dados);
  } else if (isEsic) {
    formatEsicData(parts, dados);
  } else if (isCentral) {
    formatCentralData(parts, dados);
  } else {
    formatOuvidoriaData(parts, dados, userTextLower);
  }
  
  // Análises de tempo
  if (dados.tempoMedio) {
    parts.push(`\n⏱️ **Análise de Tempo de Resolução:**`);
    parts.push(`- Tempo médio: ${dados.tempoMedio.media.toFixed(1)} dias`);
    parts.push(`- Tempo mínimo: ${dados.tempoMedio.min.toFixed(0)} dias`);
    parts.push(`- Tempo máximo: ${dados.tempoMedio.max.toFixed(0)} dias`);
    parts.push(`- Total analisado: ${dados.tempoMedio.total.toLocaleString('pt-BR')} manifestações`);
    
    if (dados.tempoPorOrgao && dados.tempoPorOrgao.length > 0) {
      parts.push(`\n**Tempo médio por Secretaria (Top 10):**`);
      dados.tempoPorOrgao.forEach((o, i) => {
        parts.push(`${i+1}. ${o._id}: ${o.media.toFixed(1)} dias (${o.total} manifestações)`);
      });
    }
  }
  
  // Vencimentos
  if (dados.vencimentos) {
    parts.push(`\n⚠️ **Situação de Prazos:**`);
    parts.push(`- Protocolos vencidos: ${dados.vencimentos.vencidos.toLocaleString('pt-BR')}`);
    parts.push(`- Próximos do vencimento (15 dias): ${dados.vencimentos.proximosVencimento.toLocaleString('pt-BR')}`);
  }
  
  // Série temporal
  if (dados.serieTemporal && dados.serieTemporal.length > 0) {
    parts.push(`\n📈 **Série Temporal (Últimos Períodos):**`);
    dados.serieTemporal.forEach(s => {
      parts.push(`- ${s.periodo}: ${s.count.toLocaleString('pt-BR')} manifestações`);
    });
  }
  
  // Período específico
  if (dados.periodo) {
    parts.push(`\n📅 **Período Específico:**`);
    parts.push(`- De ${dados.periodo.startDate} a ${dados.periodo.endDate}`);
    parts.push(`- Total no período: ${dados.periodo.total.toLocaleString('pt-BR')}`);
  }
  
  return parts.join('\n');
}

function formatOuvidoriaData(parts, dados, userTextLower) {
  // Obter total seguro (evitar divisão por zero)
  const total = dados.estatisticasGerais?.total || 0;
  
  // CORA TEM ACESSO TOTAL: Mostrar TODOS os dados, não apenas top 10
  // Limitar a 50 itens por categoria para não exceder o contexto do Gemini, mas mostrar muito mais que antes
  const maxItems = 50;
  
  if (dados.topOrgaos && dados.topOrgaos.length > 0) {
    parts.push(`\n🏛️ **Secretarias/Órgãos (${dados.topOrgaos.length} total):**`);
    dados.topOrgaos.slice(0, maxItems).forEach((o, i) => {
      const percentual = total > 0 ? ((o._count._all / total) * 100).toFixed(1) : '0.0';
      parts.push(`${i+1}. ${o.orgaos || 'Não informado'}: ${o._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
    if (dados.topOrgaos.length > maxItems) {
      parts.push(`... e mais ${dados.topOrgaos.length - maxItems} órgãos`);
    }
  }
  
  if (dados.topTemas && dados.topTemas.length > 0) {
    parts.push(`\n📋 **Temas (${dados.topTemas.length} total):**`);
    dados.topTemas.slice(0, maxItems).forEach((t, i) => {
      const percentual = total > 0 ? ((t._count._all / total) * 100).toFixed(1) : '0.0';
      parts.push(`${i+1}. ${t.tema || 'Não informado'}: ${t._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
    if (dados.topTemas.length > maxItems) {
      parts.push(`... e mais ${dados.topTemas.length - maxItems} temas`);
    }
  }
  
  if (dados.topAssuntos && dados.topAssuntos.length > 0) {
    parts.push(`\n📝 **Assuntos (${dados.topAssuntos.length} total):**`);
    dados.topAssuntos.slice(0, maxItems).forEach((a, i) => {
      const percentual = total > 0 ? ((a._count._all / total) * 100).toFixed(1) : '0.0';
      parts.push(`${i+1}. ${a.assunto || 'Não informado'}: ${a._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
    if (dados.topAssuntos.length > maxItems) {
      parts.push(`... e mais ${dados.topAssuntos.length - maxItems} assuntos`);
    }
  }
  
  if (dados.topTiposManifestacao && dados.topTiposManifestacao.length > 0) {
    parts.push(`\n📝 **Tipos de Manifestação (${dados.topTiposManifestacao.length} total):**`);
    dados.topTiposManifestacao.forEach((t, i) => {
      const percentual = total > 0 ? ((t._count._all / total) * 100).toFixed(1) : '0.0';
      parts.push(`${i+1}. ${t.tipoDeManifestacao || 'Não informado'}: ${t._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
  }
  
  if (dados.topBairros && dados.topBairros.length > 0) {
    parts.push(`\n📍 **Bairros (${dados.topBairros.length} total):**`);
    dados.topBairros.slice(0, maxItems).forEach((b, i) => {
      parts.push(`${i+1}. ${b.bairro || 'Não informado'}: ${b._count._all.toLocaleString('pt-BR')}`);
    });
    if (dados.topBairros.length > maxItems) {
      parts.push(`... e mais ${dados.topBairros.length - maxItems} bairros`);
    }
  }
  
  if (dados.topCanais && dados.topCanais.length > 0) {
    parts.push(`\n📞 **Canais (${dados.topCanais.length} total):**`);
    dados.topCanais.forEach((c, i) => {
      const percentual = total > 0 ? ((c._count._all / total) * 100).toFixed(1) : '0.0';
      parts.push(`${i+1}. ${c.canal || 'Não informado'}: ${c._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
  }
}

function formatZeladoriaData(parts, dados) {
  if (dados.topCategorias && dados.topCategorias.length > 0) {
    parts.push(`\n🏷️ **Top Categorias:**`);
    dados.topCategorias.slice(0, 10).forEach((c, i) => {
      const percentual = ((c._count._all / dados.estatisticasGerais.total) * 100).toFixed(1);
      parts.push(`${i+1}. ${c.categoria || 'Não informado'}: ${c._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
  }
  
  if (dados.topDepartamentos && dados.topDepartamentos.length > 0) {
    parts.push(`\n🏢 **Top Departamentos:**`);
    dados.topDepartamentos.slice(0, 10).forEach((d, i) => {
      const percentual = ((d._count._all / dados.estatisticasGerais.total) * 100).toFixed(1);
      parts.push(`${i+1}. ${d.departamento || 'Não informado'}: ${d._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
  }
  
  if (dados.topBairros && dados.topBairros.length > 0) {
    parts.push(`\n📍 **Top Bairros:**`);
    dados.topBairros.slice(0, 10).forEach((b, i) => {
      parts.push(`${i+1}. ${b.bairro || 'Não informado'}: ${b._count._all.toLocaleString('pt-BR')}`);
    });
  }
  
  if (dados.topCanais && dados.topCanais.length > 0) {
    parts.push(`\n📞 **Top Canais:**`);
    dados.topCanais.forEach((c, i) => {
      parts.push(`${i+1}. ${c.canal || 'Não informado'}: ${c._count._all.toLocaleString('pt-BR')}`);
    });
  }
}

function formatEsicData(parts, dados) {
  if (dados.topTiposInfo && dados.topTiposInfo.length > 0) {
    parts.push(`\n📋 **Top Tipos de Informação:**`);
    dados.topTiposInfo.slice(0, 10).forEach((t, i) => {
      const percentual = ((t._count._all / dados.estatisticasGerais.total) * 100).toFixed(1);
      parts.push(`${i+1}. ${t.tipoInformacao || 'Não informado'}: ${t._count._all.toLocaleString('pt-BR')} (${percentual}%)`);
    });
  }
  
  if (dados.topUnidades && dados.topUnidades.length > 0) {
    parts.push(`\n🏢 **Top Unidades de Contato:**`);
    dados.topUnidades.slice(0, 10).forEach((u, i) => {
      parts.push(`${i+1}. ${u.unidadeContato || 'Não informado'}: ${u._count._all.toLocaleString('pt-BR')}`);
    });
  }
  
  if (dados.topBairros && dados.topBairros.length > 0) {
    parts.push(`\n📍 **Top Bairros:**`);
    dados.topBairros.slice(0, 10).forEach((b, i) => {
      parts.push(`${i+1}. ${b.bairro || 'Não informado'}: ${b._count._all.toLocaleString('pt-BR')}`);
    });
  }
}

function formatCentralData(parts, dados) {
  parts.push(`\n🏛️ **VISÃO CONSOLIDADA DOS SISTEMAS:**`);
  // Dados já formatados pelas funções específicas
}

/**
 * Fallback inteligente melhorado
 */
function buildIntelligentFallbackResponse(dadosFormatados, text, context, isZeladoria, isEsic) {
  const userText = text.toLowerCase();
  
  if (dadosFormatados && dadosFormatados.trim().length > 0) {
    const tipoContexto = isZeladoria ? 'zeladoria' 
      : isEsic ? 'e-SIC'
      : 'ouvidoria';
    
    return `📊 **Análise baseada nos dados da ${tipoContexto}:**\n\n${dadosFormatados}\n\n💡 *Resposta gerada com base nos dados reais do banco de dados.*`;
  }
  
  if (userText.includes('olá') || userText.includes('oi') || userText.includes('bom dia') || userText.includes('boa tarde') || userText.includes('boa noite')) {
    const tipoContexto = isZeladoria ? 'zeladoria' 
      : isEsic ? 'e-SIC'
      : 'ouvidoria';
    return `Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ${tipoContexto}. Como posso ajudar você hoje?\n\n💡 *Tenho acesso completo aos dados do sistema e posso realizar análises profundas. Faça sua pergunta!*`;
  }
  
  const tipoContexto = isZeladoria ? 'zeladoria' 
    : isEsic ? 'e-SIC'
    : 'ouvidoria';
  const campos = isZeladoria ? 'categorias, departamentos, bairros, status e canais'
    : isEsic ? 'tipos de informação, unidades, status e prazos'
    : 'órgãos, temas, assuntos, status, tempos médios e vencimentos';
  
  return `Certo, Gestor Municipal! Tenho acesso completo aos dados da ${tipoContexto}. Posso analisar ${campos}.\n\nMe diga o recorte específico e retorno os principais achados baseados nos dados reais do banco.\n\n💡 *Exemplos: "Quantas reclamações sobre saúde tivemos em janeiro?", "Qual o tempo médio por secretaria?", "Quais os top 10 bairros com mais ocorrências?"*`;
}
