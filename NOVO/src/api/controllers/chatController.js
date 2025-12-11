/**
 * Controllers de Chat
 * /api/chat/*
 * 
 * Gerencia conversas com assistente virtual usando Gemini AI
 * 
 * REFATORAÇÃO: Prisma → Mongoose
 * Data: 03/12/2025
 * CÉREBRO X-3
 */

import { safeQuery } from '../../utils/responseHelper.js';
import { getCurrentGeminiKey, rotateToNextKey, resetToFirstKey, hasGeminiKeys, getGeminiKeysCount } from '../../utils/geminiHelper.js';
import ChatMessage from '../../models/ChatMessage.model.js';

/**
 * GET /api/chat/messages
 * Listar mensagens do chat
 */
export async function getMessages(req, res) {
  // REFATORAÇÃO: sistema migrado para Mongoose
  return safeQuery(res, async () => {
    const limit = Number(req.query.limit ?? 500);
    const messages = await ChatMessage.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
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
export async function createMessage(req, res) {
  // REFATORAÇÃO: sistema migrado para Mongoose
  return safeQuery(res, async () => {
    const { text, sender = 'user', context = 'ouvidoria' } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório' });
    }
    
    // Salvar mensagem do usuário
    const message = await ChatMessage.create({
      text: text.trim(),
      sender: sender
    });
    
    // Se for mensagem do usuário, gerar resposta da Cora via Gemini
    let response = null;
    if (sender === 'user') {
      console.log('\n=== 🚀 NOVA MENSAGEM DO CHAT ===');
      console.log('📝 Texto recebido:', text);
      console.log('📋 Contexto:', context);
      
      // Buscar dados básicos do banco (com contexto)
      const dadosReais = await fetchRelevantData(text, context);
      const dadosFormatados = formatDataForGemini(dadosReais, text, context);
      
      const isZeladoria = context === 'zeladoria';
      const systemPrompt = [
        isZeladoria 
          ? 'Você é a Cora, especialista em análises de zeladoria da Prefeitura de Duque de Caxias.'
          : 'Você é a Cora, especialista em análises de ouvidoria da Prefeitura de Duque de Caxias.',
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
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
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
          const tipoContexto = isZeladoria ? 'zeladoria' : 'ouvidoria';
          parts.push(`📊 **Análise baseada nos dados da ${tipoContexto}:**\n\n`);
          parts.push(dadosFormatados);
          parts.push('\n\n💡 *Nota: Resposta gerada com base nos dados reais do banco de dados.*');
          response = parts.join('');
        } else if (userText.includes('olá') || userText.includes('oi') || userText.includes('bom dia') || userText.includes('boa tarde') || userText.includes('boa noite')) {
          const tipoContexto = isZeladoria ? 'zeladoria' : 'ouvidoria';
          response = `Olá, Gestor Municipal! 👋 Sou a Cora, sua assistente virtual especialista em análises de ${tipoContexto}. Como posso ajudar você hoje?\n\n💡 *Nota: No momento, estou usando respostas baseadas em dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*`;
        } else if (userText.includes('dados') || userText.includes('estatística') || userText.includes('gráfico') || userText.includes('total') || userText.includes('quantas') || userText.includes('quantos')) {
          // Buscar dados básicos se não foram buscados ainda
          if (!dadosFormatados || dadosFormatados.trim().length === 0) {
            const dadosBasicos = await fetchRelevantData(text, context);
            const dadosFormatadosBasicos = formatDataForGemini(dadosBasicos, text, context);
            if (dadosFormatadosBasicos && dadosFormatadosBasicos.trim().length > 0) {
              const tipoContexto = isZeladoria ? 'Zeladoria' : 'Ouvidoria';
              response = `📊 **Dados da ${tipoContexto}:**\n\n${dadosFormatadosBasicos}\n\n💡 *Resposta baseada em dados reais do banco.*`;
            } else {
              const tipoContexto = isZeladoria ? 'zeladoria' : 'ouvidoria';
              const campos = isZeladoria ? 'categorias, departamentos, bairros, status e canais' : 'órgãos, temas, assuntos, status e tempos médios';
              response = `Posso analisar ${campos}. Diga o recorte específico e busco os dados para você.\n\n💡 *No momento, estou usando dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*`;
            }
          } else {
            const tipoContexto = isZeladoria ? 'Zeladoria' : 'Ouvidoria';
            response = `📊 **Dados da ${tipoContexto}:**\n\n${dadosFormatados}\n\n💡 *Resposta baseada em dados reais do banco.*`;
          }
        } else {
          const tipoContexto = isZeladoria ? 'zeladoria' : 'ouvidoria';
          const campos = isZeladoria ? 'categoria/departamento/bairro/status' : 'órgão/tema/assunto/período';
          response = `Certo! Tenho acesso aos dados da ${tipoContexto}. Me diga o recorte específico (${campos}) e retorno os principais achados baseados nos dados reais.\n\n💡 *No momento, estou usando dados diretos do banco. Para análises mais avançadas, a integração com IA será restaurada em breve.*`;
        }
      }
      
      console.log('=== ✅ FIM DO PROCESSAMENTO ===\n');
    }
    
    // Salvar resposta da IA se houver
    if (response && sender === 'user') {
      await ChatMessage.create({
        text: response,
        sender: 'cora'
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
 * Buscar dados relevantes do banco baseado na pergunta e contexto
 */
async function fetchRelevantData(userText, context = 'ouvidoria') {
  const text = userText.toLowerCase();
  const dados = {};
  const isZeladoria = context === 'zeladoria';
  
  try {
    if (isZeladoria) {
      // Buscar dados de Zeladoria
      const Zeladoria = (await import('../../models/Zeladoria.model.js')).default;
      
      // Sempre buscar estatísticas gerais
      const total = await Zeladoria.countDocuments();
      const porStatus = await Zeladoria.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      dados.estatisticasGerais = {
        total,
        porStatus: porStatus
          .map(s => ({ status: s._id || 'Não informado', count: s.count }))
          .sort((a, b) => b.count - a.count)
      };
      
      // Buscar top categorias se mencionar
      if (text.includes('categoria')) {
        const topCategorias = await Zeladoria.aggregate([
          { $match: { categoria: { $ne: null } } },
          { $group: { _id: '$categoria', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topCategorias = topCategorias.map(c => ({ categoria: c._id, _count: { _all: c.count } }));
      }
      
      // Buscar top departamentos se mencionar
      if (text.includes('departamento')) {
        const topDepartamentos = await Zeladoria.aggregate([
          { $match: { departamento: { $ne: null } } },
          { $group: { _id: '$departamento', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topDepartamentos = topDepartamentos.map(d => ({ departamento: d._id, _count: { _all: d.count } }));
      }
      
      // Buscar top bairros se mencionar
      if (text.includes('bairro')) {
        const topBairros = await Zeladoria.aggregate([
          { $match: { bairro: { $ne: null } } },
          { $group: { _id: '$bairro', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topBairros = topBairros.map(b => ({ bairro: b._id, _count: { _all: b.count } }));
      }
      
      // Buscar canais se mencionar
      if (text.includes('canal') || text.includes('origem')) {
        const topCanais = await Zeladoria.aggregate([
          { $match: { canal: { $ne: null } } },
          { $group: { _id: '$canal', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topCanais = topCanais.map(c => ({ canal: c._id, _count: { _all: c.count } }));
      }
    } else {
      // Buscar dados de Ouvidoria (comportamento original)
      const Record = (await import('../../models/Record.model.js')).default;
      
      // Sempre buscar estatísticas gerais
      const total = await Record.countDocuments();
      const porStatus = await Record.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      dados.estatisticasGerais = {
        total,
        porStatus: porStatus
          .map(s => ({ status: s._id || 'Não informado', count: s.count }))
          .sort((a, b) => b.count - a.count)
      };
      
      // Buscar top órgãos se mencionar
      if (text.includes('secretaria') || text.includes('órgão') || text.includes('orgao')) {
        const topOrgaos = await Record.aggregate([
          { $match: { orgaos: { $ne: null } } },
          { $group: { _id: '$orgaos', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topOrgaos = topOrgaos.map(o => ({ orgaos: o._id, _count: { _all: o.count } }));
      }
      
      // Buscar top temas se mencionar
      if (text.includes('tema') || text.includes('categoria')) {
        const topTemas = await Record.aggregate([
          { $match: { tema: { $ne: null } } },
          { $group: { _id: '$tema', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topTemas = topTemas.map(t => ({ tema: t._id, _count: { _all: t.count } }));
      }
      
      // Buscar top assuntos se mencionar
      if (text.includes('assunto')) {
        const topAssuntos = await Record.aggregate([
          { $match: { assunto: { $ne: null } } },
          { $group: { _id: '$assunto', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topAssuntos = topAssuntos.map(a => ({ assunto: a._id, _count: { _all: a.count } }));
      }
      
      // Buscar tipos de manifestação se mencionar
      if (text.includes('reclama') || text.includes('elogio') || text.includes('denúncia') || text.includes('tipo')) {
        const topTipos = await Record.aggregate([
          { $match: { tipoDeManifestacao: { $ne: null } } },
          { $group: { _id: '$tipoDeManifestacao', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        dados.topTiposManifestacao = topTipos.map(t => ({ tipoDeManifestacao: t._id, _count: { _all: t.count } }));
      }
    }
  } catch (error) {
    console.error('❌ Erro ao buscar dados relevantes:', error);
  }
  
  return dados;
}

/**
 * Formatar dados para Gemini
 */
function formatDataForGemini(dados, userText = '', context = 'ouvidoria') {
  const parts = [];
  const userTextLower = userText.toLowerCase();
  const isZeladoria = context === 'zeladoria';
  
  // Estatísticas gerais
  if (dados.estatisticasGerais) {
    const tipoDados = isZeladoria ? 'ocorrências de zeladoria' : 'manifestações';
    parts.push(`📊 **Total de ${tipoDados}: ${dados.estatisticasGerais.total.toLocaleString('pt-BR')}**`);
    
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
  
  if (isZeladoria) {
    // Dados específicos de Zeladoria
    // Top categorias
    if (dados.topCategorias && dados.topCategorias.length > 0) {
      parts.push(`\n🏷️ **Top Categorias:**`);
      dados.topCategorias.forEach((c, i) => {
        parts.push(`${i+1}. ${c.categoria || 'Não informado'}: ${c._count._all.toLocaleString('pt-BR')}`);
      });
    }
    
    // Top departamentos
    if (dados.topDepartamentos && dados.topDepartamentos.length > 0) {
      parts.push(`\n🏢 **Top Departamentos:**`);
      dados.topDepartamentos.forEach((d, i) => {
        parts.push(`${i+1}. ${d.departamento || 'Não informado'}: ${d._count._all.toLocaleString('pt-BR')}`);
      });
    }
    
    // Top bairros
    if (dados.topBairros && dados.topBairros.length > 0) {
      parts.push(`\n📍 **Top Bairros:**`);
      dados.topBairros.forEach((b, i) => {
        parts.push(`${i+1}. ${b.bairro || 'Não informado'}: ${b._count._all.toLocaleString('pt-BR')}`);
      });
    }
    
    // Top canais
    if (dados.topCanais && dados.topCanais.length > 0) {
      parts.push(`\n📞 **Top Canais:**`);
      dados.topCanais.forEach((c, i) => {
        parts.push(`${i+1}. ${c.canal || 'Não informado'}: ${c._count._all.toLocaleString('pt-BR')}`);
      });
    }
  } else {
    // Dados específicos de Ouvidoria
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
  }
  
  return parts.join('\n');
}

