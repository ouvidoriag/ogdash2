/**
 * Controllers de Chat
 * /api/chat/*
 * 
 * Baseado no sistema antigo, adaptado para o modelo novo
 */

import { safeQuery } from '../../utils/responseHelper.js';
import { getCurrentGeminiKey, rotateToNextKey, resetToFirstKey, hasGeminiKeys, getGeminiKeysCount } from '../../utils/geminiHelper.js';

/**
 * GET /api/chat/messages
 * Listar mensagens do chat
 */
export async function getMessages(req, res, prisma) {
  return safeQuery(res, async () => {
    const limit = Number(req.query.limit ?? 500);
    const messages = await prisma.chatMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    return messages.map(m => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      createdAt: m.createdAt.toISOString()
    })).reverse(); // Reverter para ordem cronológica
  });
}

/**
 * POST /api/chat/messages
 * Criar nova mensagem e obter resposta da IA
 */
export async function createMessage(req, res, prisma) {
  return safeQuery(res, async () => {
    const { text, sender = 'user' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
    }
    
    // Salvar mensagem do usuário
    const message = await prisma.chatMessage.create({
      data: {
        text: text.trim(),
        sender: sender
      }
    });
    
    // Se for mensagem do usuário, gerar resposta da Cora via Gemini
    let response = null;
    if (sender === 'user') {
      console.log('\n=== 🚀 NOVA MENSAGEM DO CHAT ===');
      console.log('📝 Texto recebido:', text);
      
      // Buscar dados básicos do banco
      const dadosReais = await fetchRelevantData(text, prisma);
      const dadosFormatados = formatDataForGemini(dadosReais, text);
      
      const systemPrompt = [
        'Você é a Cora, especialista em análises de ouvidoria da Prefeitura de Duque de Caxias.',
        '',
        'IMPORTANTE: Você receberá dados reais do banco de dados em tempo real. USE ESSES DADOS para responder.',
        'NÃO invente números ou informações. Use APENAS os dados fornecidos.',
        '',
        'FORMATAÇÃO DAS RESPOSTAS:',
        '- Use formatação Markdown para melhorar a legibilidade',
        '- Use **negrito** para destacar números importantes e títulos',
        '- Use listas numeradas ou com bullets para organizar informações',
        '- Quando apresentar rankings ou listas, use formatação clara e hierárquica',
        '- Adicione emojis relevantes quando apropriado (📊, 🏥, 📈, etc.)',
        '- Use tabelas quando apresentar dados comparativos',
        '- Sempre inclua o total e percentuais quando relevante',
        '- Organize as informações de forma lógica e fácil de ler',
        '',
        'INSTRUÇÕES:',
        '1. SEMPRE use os dados reais fornecidos na seção "DADOS REAIS DO BANCO DE DADOS"',
        '2. Cite números exatos dos dados fornecidos, formatados com separadores de milhar (ex: 10.339)',
        '3. FAÇA CÁLCULOS MATEMÁTICOS quando necessário: somas, subtrações, médias, percentuais, etc.',
        '4. Quando apresentar listas/rankings, organize de forma clara e hierárquica',
        '5. Responda de forma direta e objetiva, citando os números exatos dos dados',
        '6. Seja profissional mas amigável, sempre se referindo ao usuário como "Gestor Municipal"',
        '7. NÃO diga "preciso acessar os dados" ou "não posso fazer cálculos" - você JÁ TEM os dados e PODE fazer qualquer cálculo necessário',
        '8. Quando o Gestor Municipal pedir cálculos, percentuais, somas, médias, etc., FAÇA os cálculos usando os dados fornecidos',
        '9. Você tem total liberdade para realizar operações matemáticas, análises estatísticas e qualquer tipo de cálculo solicitado',
        '10. Sempre apresente os dados de forma visualmente atraente e organizada',
        '11. Quando apresentar rankings, inclua o número de posição e destaque os valores principais'
      ].join('\n');
      
      // Tentar com Gemini se disponível
      if (hasGeminiKeys()) {
        let tentouTodasChaves = false;
        let tentativas = 0;
        const numChaves = getGeminiKeysCount();
        const maxTentativas = numChaves > 1 ? 3 : 1; // Se só tem 1 chave, tentar apenas 1 vez
        
        while (!response && !tentouTodasChaves && tentativas < maxTentativas) {
          const GEMINI_API_KEY = getCurrentGeminiKey();
          console.log(`🤖 Chamando Gemini API (tentativa ${tentativas + 1}/${maxTentativas})...`);
          tentativas++;
          
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
            
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
                temperature: 0.7
              },
              contents: [
                { 
                  role: 'user', 
                  parts: [{ 
                    text: `${dadosFormatados ? dadosFormatados + '\n\n' : ''}PERGUNTA DO GESTOR MUNICIPAL: ${text}\n\nINSTRUÇÕES PARA RESPOSTA:\n- Use os dados reais fornecidos acima para responder de forma precisa e objetiva\n- Cite números exatos formatados com separadores de milhar (ex: 10.339)\n- FAÇA CÁLCULOS MATEMÁTICOS quando necessário (somas, subtrações, médias, percentuais, etc.)\n- Formate a resposta usando Markdown: use **negrito** para destacar números e títulos, listas numeradas ou bullets para organizar, e emojis quando apropriado\n- Organize as informações de forma clara e hierárquica\n- Quando apresentar rankings ou listas, use formatação visualmente atraente\n- Sempre inclua totais e percentuais quando relevante\n- Você tem total liberdade para realizar qualquer operação matemática ou análise estatística solicitada pelo Gestor Municipal` 
                  }] 
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
              
              // Se for quota excedida, não tentar mais - usar fallback imediatamente
              if (errorText.includes('quota') || errorText.includes('Quota')) {
                console.log('⚠️ Quota excedida detectada - usando fallback inteligente imediatamente');
                tentouTodasChaves = true;
                break;
              }
              
              // Se for rate limit temporário, tentar próxima chave ou aguardar
              if (numChaves > 1) {
                rotateToNextKey();
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                // Só tem uma chave e deu rate limit - usar fallback
                tentouTodasChaves = true;
                break;
              }
            } else {
              console.error(`❌ Erro na API Gemini:`, resp.status);
              const errorText = await resp.text().catch(() => '');
              console.error(`   Detalhes: ${errorText.substring(0, 200)}`);
              
              // Se for erro diferente de 429, tentar próxima chave se houver
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
        const userText = text.toLowerCase();
        
        // Se temos dados formatados, criar resposta inteligente
        if (dadosFormatados && dadosFormatados.trim().length > 0) {
          // Criar resposta formatada baseada nos dados
          const parts = [];
          parts.push('📊 **Análise baseada nos dados da ouvidoria:**\n\n');
          parts.push(dadosFormatados);
          parts.push('\n\n💡 *Nota: Resposta gerada com base nos dados reais do banco de dados.*');
          response = parts.join('');
        } else if (userText.includes('olá') || userText.includes('oi') || userText.includes('bom dia') || userText.includes('boa tarde') || userText.includes('boa noite')) {
          response = 'Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ouvidoria. Como posso ajudar você hoje?\n\n💡 *Nota: No momento, estou usando respostas baseadas em dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*';
        } else if (userText.includes('dados') || userText.includes('estatística') || userText.includes('gráfico') || userText.includes('total') || userText.includes('quantas') || userText.includes('quantos')) {
          // Buscar dados básicos se não foram buscados ainda
          if (!dadosFormatados || dadosFormatados.trim().length === 0) {
            const dadosBasicos = await fetchRelevantData(text, prisma);
            const dadosFormatadosBasicos = formatDataForGemini(dadosBasicos, text);
            if (dadosFormatadosBasicos && dadosFormatadosBasicos.trim().length > 0) {
              response = `📊 **Dados da Ouvidoria:**\n\n${dadosFormatadosBasicos}\n\n💡 *Resposta baseada em dados reais do banco.*`;
            } else {
              response = 'Posso analisar órgãos, temas, assuntos, status e tempos médios. Diga o recorte específico e busco os dados para você.\n\n💡 *No momento, estou usando dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*';
            }
          } else {
            response = `📊 **Dados da Ouvidoria:**\n\n${dadosFormatados}\n\n💡 *Resposta baseada em dados reais do banco.*`;
          }
        } else {
          response = 'Certo! Tenho acesso aos dados da ouvidoria. Me diga o recorte específico (órgão/tema/assunto/período) e retorno os principais achados baseados nos dados reais.\n\n💡 *No momento, estou usando dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*';
        }
      }
      
      console.log('=== ✅ FIM DO PROCESSAMENTO ===\n');
    }
    
    // Salvar resposta da IA se houver
    if (response && sender === 'user') {
    await prisma.chatMessage.create({
      data: {
        text: response,
        sender: 'cora'
      }
    });
    }
    
    return {
      message: {
        id: message.id,
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt.toISOString()
      },
      response: response
    };
  });
}

/**
 * Buscar dados relevantes do banco baseado na pergunta
 */
async function fetchRelevantData(userText, prisma) {
  const text = userText.toLowerCase();
  const dados = {};
  
  try {
    // Sempre buscar estatísticas gerais
    const total = await prisma.record.count();
    const porStatus = await prisma.record.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    dados.estatisticasGerais = {
      total,
      porStatus: porStatus
        .map(s => ({ status: s.status || 'Não informado', count: s._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
    
    // Buscar top órgãos se mencionar
    if (text.includes('secretaria') || text.includes('órgão') || text.includes('orgao')) {
      const topOrgaos = await prisma.record.groupBy({
        by: ['orgaos'],
        _count: { _all: true }
      });
      dados.topOrgaos = topOrgaos
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10);
    }
    
    // Buscar top temas se mencionar
    if (text.includes('tema') || text.includes('categoria')) {
      const topTemas = await prisma.record.groupBy({
        by: ['tema'],
        _count: { _all: true }
      });
      dados.topTemas = topTemas
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10);
    }
    
    // Buscar top assuntos se mencionar
    if (text.includes('assunto')) {
      const topAssuntos = await prisma.record.groupBy({
        by: ['assunto'],
        _count: { _all: true }
      });
      dados.topAssuntos = topAssuntos
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10);
    }
    
    // Buscar tipos de manifestação se mencionar
    if (text.includes('reclama') || text.includes('elogio') || text.includes('denúncia') || text.includes('tipo')) {
      const topTipos = await prisma.record.groupBy({
        by: ['tipoDeManifestacao'],
        _count: { _all: true }
      });
      dados.topTiposManifestacao = topTipos
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, 10);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados relevantes:', error);
  }
  
  return dados;
}

/**
 * Formatar dados para Gemini
 */
function formatDataForGemini(dados, userText = '') {
  const parts = [];
  const userTextLower = userText.toLowerCase();
  
  // Estatísticas gerais
  if (dados.estatisticasGerais) {
    parts.push(`📊 **Total de manifestações: ${dados.estatisticasGerais.total.toLocaleString('pt-BR')}**`);
    
    if (userTextLower.includes('status') || userTextLower.includes('total')) {
      const topStatus = dados.estatisticasGerais.porStatus.slice(0, 5);
      if (topStatus.length > 0) {
        parts.push(`\n**Status principais:**`);
        topStatus.forEach((s, i) => {
          parts.push(`${i+1}. ${s.status}: ${s.count.toLocaleString('pt-BR')}`);
        });
      }
    }
  }
  
  // Top órgãos
  if (dados.topOrgaos && dados.topOrgaos.length > 0) {
    parts.push(`\n🏛️ **Top Secretarias/Órgãos:**`);
    dados.topOrgaos.forEach((o, i) => {
      parts.push(`${i+1}. ${o.orgaos || 'Não informado'}: ${o._count._all.toLocaleString('pt-BR')}`);
    });
  }
  
  // Top temas
  if (dados.topTemas && dados.topTemas.length > 0) {
    parts.push(`\n📋 **Top Temas:**`);
    dados.topTemas.forEach((t, i) => {
      parts.push(`${i+1}. ${t.tema || 'Não informado'}: ${t._count._all.toLocaleString('pt-BR')}`);
    });
  }
  
  // Top assuntos
  if (dados.topAssuntos && dados.topAssuntos.length > 0) {
    parts.push(`\n📝 **Top Assuntos:**`);
    dados.topAssuntos.forEach((a, i) => {
      parts.push(`${i+1}. ${a.assunto || 'Não informado'}: ${a._count._all.toLocaleString('pt-BR')}`);
    });
  }
  
  // Tipos de manifestação
  if (dados.topTiposManifestacao && dados.topTiposManifestacao.length > 0) {
    const isReclamacao = userTextLower.includes('reclama');
    const isElogio = userTextLower.includes('elogio');
    const isDenuncia = userTextLower.includes('denúncia') || userTextLower.includes('denuncia');
    
    if (isReclamacao || isElogio || isDenuncia) {
      const tipoRelevante = dados.topTiposManifestacao.find(t => {
        const tipo = (t.tipoDeManifestacao || '').toLowerCase();
        return (isReclamacao && tipo.includes('reclama')) ||
               (isElogio && tipo.includes('elogio')) ||
               (isDenuncia && (tipo.includes('denúncia') || tipo.includes('denuncia')));
      });
      if (tipoRelevante) {
        if (isReclamacao) {
          parts.push(`\n📝 **Total de Reclamações: ${tipoRelevante._count._all.toLocaleString('pt-BR')}**`);
        } else {
          parts.push(`\n📝 **${tipoRelevante.tipoDeManifestacao}**: ${tipoRelevante._count._all.toLocaleString('pt-BR')} manifestações`);
        }
      }
    } else {
      const topTipos = dados.topTiposManifestacao.slice(0, 6);
      parts.push(`\n📝 **Tipos de Manifestação:**`);
      topTipos.forEach((t, i) => {
        parts.push(`${i+1}. ${t.tipoDeManifestacao || 'Não informado'}: ${t._count._all.toLocaleString('pt-BR')}`);
      });
    }
  }
  
  return parts.join('\n');
}

