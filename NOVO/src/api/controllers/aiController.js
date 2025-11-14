/**
 * Controller de IA
 * /api/ai/insights
 */

import { withCache } from '../../utils/responseHelper.js';
import { getMes } from '../../utils/dateUtils.js';
import { getCurrentGeminiKey, rotateToNextKey, hasGeminiKeys } from '../../utils/geminiHelper.js';

/**
 * Detecta padrões e anomalias nos dados
 */
async function detectPatternsAndAnomalies(prisma, servidor, unidadeCadastro) {
  const where = {};
  if (servidor) where.servidor = servidor;
  if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
  
  // Buscar dados dos últimos 3 meses para comparação
  const hoje = new Date();
  const tresMesesAtras = new Date(hoje);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  
  // Buscar registros e agrupar por mês manualmente
  const registros = await prisma.record.findMany({
    where: {
      ...where,
      dataDaCriacao: { not: null }
    },
    select: {
      dataCriacaoIso: true,
      dataDaCriacao: true,
      data: true
    },
    take: 50000
  });
  
  // Agrupar por mês usando a função getMes
  const porMes = new Map();
  registros.forEach(r => {
    const mes = getMes(r);
    if (mes) {
      porMes.set(mes, (porMes.get(mes) || 0) + 1);
    }
  });
  
  const meses = Array.from(porMes.entries()).sort();
  const anomalias = [];
  
  // Detectar aumentos anormais (mais de 30% de aumento)
  if (meses.length >= 2) {
    const ultimoMes = meses[meses.length - 1];
    const penultimoMes = meses[meses.length - 2];
    const aumento = penultimoMes[1] > 0 
      ? ((ultimoMes[1] - penultimoMes[1]) / penultimoMes[1]) * 100 
      : (ultimoMes[1] > 0 ? 100 : 0);
    
    if (aumento > 30) {
      anomalias.push({
        tipo: 'aumento_anormal',
        mes: ultimoMes[0],
        valor: ultimoMes[1],
        aumento: aumento.toFixed(1),
        mensagem: `Aumento anormal de ${aumento.toFixed(1)}% em ${ultimoMes[0]}`
      });
    }
  }
  
  // Executar agregações em paralelo
  const [porSecretaria, porAssunto, porUnidade] = await Promise.all([
    prisma.record.groupBy({
      by: ['orgaos'],
      where: { ...where, orgaos: { not: null } },
      _count: true
    }),
    prisma.record.groupBy({
      by: ['assunto'],
      where: { ...where, assunto: { not: null } },
      _count: true
    }),
    prisma.record.groupBy({
      by: ['unidadeCadastro'],
      where: { ...where, unidadeCadastro: { not: null } },
      _count: true
    })
  ]);
  
  return {
    anomalias,
    topSecretarias: porSecretaria
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(s => ({ nome: s.orgaos, count: s._count })),
    topAssuntos: porAssunto
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(a => ({ nome: a.assunto, count: a._count })),
    topUnidades: porUnidade
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map(u => ({ nome: u.unidadeCadastro, count: u._count })),
    tendenciaMensal: meses.map(([mes, count]) => ({ mes, count }))
  };
}

/**
 * GET /api/ai/insights
 * Gera insights com IA (Gemini)
 */
export async function getInsights(req, res, prisma) {
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  
  const cacheKey = servidor ? `aiInsights:servidor:${servidor}:v1` : 
                    unidadeCadastro ? `aiInsights:uac:${unidadeCadastro}:v1` : 
                    'aiInsights:v1';
  
  return withCache(cacheKey, 1800, res, async () => {
    try {
      // Detectar padrões e anomalias
      const patterns = await detectPatternsAndAnomalies(prisma, servidor, unidadeCadastro);
      
      // Se não houver chave Gemini, retornar insights básicos
      if (!hasGeminiKeys()) {
        const insights = [];
        
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        
        if (patterns.topSecretarias.length > 0) {
          insights.push({
            tipo: 'volume',
            insight: `Maior volume: ${patterns.topSecretarias[0].nome} com ${patterns.topSecretarias[0].count.toLocaleString('pt-BR')} manifestações.`,
            recomendacao: 'Monitorar de perto e garantir recursos adequados.',
            severidade: 'media'
          });
        }
        
        return { insights, patterns };
      }
      
      // Gerar insights com IA (Gemini)
      const GEMINI_API_KEY = getCurrentGeminiKey();
      
      if (!GEMINI_API_KEY) {
        console.warn('⚠️ Nenhuma chave Gemini disponível para insights');
        // Fallback para insights básicos
        const insights = [];
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        if (patterns.topSecretarias.length > 0) {
          insights.push({
            tipo: 'volume',
            insight: `Maior volume: ${patterns.topSecretarias[0].nome} com ${patterns.topSecretarias[0].count.toLocaleString('pt-BR')} manifestações.`,
            recomendacao: 'Monitorar de perto e garantir recursos adequados.',
            severidade: 'media'
          });
        }
        return { insights, patterns, geradoPorIA: false };
      }
      
      console.log('🤖 Gerando insights com Gemini...');
      
      const dadosTexto = `
ANÁLISE DE DADOS DA OUVIDORIA DE DUQUE DE CAXIAS

TENDÊNCIA MENSAL:
${patterns.tendenciaMensal.map(t => `- ${t.mes}: ${t.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 SECRETARIAS/ÓRGÃOS:
${patterns.topSecretarias.slice(0, 5).map((s, i) => `${i+1}. ${s.nome}: ${s.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 ASSUNTOS:
${patterns.topAssuntos.slice(0, 5).map((a, i) => `${i+1}. ${a.nome}: ${a.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

TOP 5 UNIDADES DE CADASTRO:
${patterns.topUnidades.slice(0, 5).map((u, i) => `${i+1}. ${u.nome}: ${u.count.toLocaleString('pt-BR')} manifestações`).join('\n')}

${patterns.anomalias.length > 0 ? `\nANOMALIAS DETECTADAS:\n${patterns.anomalias.map(a => `- ${a.mensagem}`).join('\n')}` : ''}
      `.trim();
      
      const systemPrompt = `Você é um analista especializado em dados de ouvidoria municipal. 
Analise os dados fornecidos e gere insights acionáveis em português brasileiro.
Seja objetivo, use números reais e forneça recomendações práticas.`;
      
      const userPrompt = `${dadosTexto}

Gere 3-5 insights principais baseados nestes dados. Para cada insight:
1. Identifique padrões, tendências ou anomalias importantes
2. Explique o que isso significa em linguagem clara
3. Forneça uma recomendação acionável

Formato JSON:
{
  "insights": [
    {
      "tipo": "anomalia|tendencia|volume|tempo",
      "insight": "Descrição clara do que foi detectado (ex: 'A Secretaria de Saúde teve aumento de 32% em manifestações no último mês')",
      "recomendacao": "Ação sugerida (ex: 'Revisar fluxo de triagem e reforçar equipe médica no local')",
      "severidade": "alta|media|baixa"
    }
  ]
}

Retorne APENAS o JSON, sem markdown, sem explicações adicionais.`;
      
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
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          },
          contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
          ]
        };
        
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!resp.ok) {
          const errorText = await resp.text().catch(() => '');
          console.error(`❌ Gemini API error ${resp.status}:`, errorText);
          throw new Error(`Gemini API error: ${resp.status} - ${errorText.substring(0, 200)}`);
        }
        
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        console.log('✅ Resposta recebida da Gemini para insights');
        
        // Tentar extrair JSON mesmo se vier com markdown
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        
        let aiInsights;
        try {
          aiInsights = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do JSON da Gemini:', parseError);
          throw new Error('Resposta da Gemini não é um JSON válido');
        }
        
        console.log(`✅ ${aiInsights.insights?.length || 0} insights gerados pela IA`);
        
        return {
          insights: aiInsights.insights || [],
          patterns,
          geradoPorIA: true
        };
      } catch (geminiError) {
        console.error('❌ Erro ao chamar Gemini para insights:', geminiError);
        rotateToNextKey();
        
        // Fallback para insights básicos
        const insights = [];
        if (patterns.anomalias.length > 0) {
          patterns.anomalias.forEach(a => {
            insights.push({
              tipo: 'anomalia',
              insight: a.mensagem,
              recomendacao: 'Revisar causas do aumento e implementar medidas preventivas.',
              severidade: 'alta'
            });
          });
        }
        return { insights, patterns, geradoPorIA: false };
      }
    } catch (error) {
      console.error('❌ Erro ao gerar insights:', error);
      return { insights: [], patterns: {}, geradoPorIA: false, erro: error.message };
    }
  }, prisma);
}

