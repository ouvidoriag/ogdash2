/**
 * Construtor de Cache Universal
 * Gera cache completo com todos os dados principais do dashboard
 * Executa às 07:00 todos os dias
 */

import cacheManager from './cacheManager.js';

/**
 * Construir cache completo (recebe prisma como parâmetro para evitar dependência circular)
 */
export async function buildUniversalCache(prisma) {
  console.log('🏗️ Construindo cache universal...');
  const startTime = Date.now();
  
  try {
    const cache = {};
    
    // 1. Summary (KPIs principais)
    console.log('📊 Carregando summary...');
    const where = {};
    const total = await prisma.record.count({ where });
    const byStatus = await prisma.record.groupBy({ 
      by: ['status'], 
      where: Object.keys(where).length > 0 ? where : undefined,
      _count: { _all: true } 
    });
    const statusCounts = byStatus.map(r => ({ status: r.status ?? 'Não informado', count: r._count._all }))
      .sort((a,b) => b.count - a.count);
    
    // Últimos 7 e 30 dias (otimizado)
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const last7Str = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const last30Str = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    let last7 = 0;
    let last30 = 0;
    try {
      [last7, last30] = await Promise.all([
        prisma.record.count({ where: { ...where, dataCriacaoIso: { gte: last7Str, lte: todayStr } } }),
        prisma.record.count({ where: { ...where, dataCriacaoIso: { gte: last30Str, lte: todayStr } } })
      ]);
    } catch (e) {
      console.warn('⚠️ Erro ao calcular últimos dias:', e.message);
    }
    
    const top = async (col) => {
      const rows = await prisma.record.groupBy({ 
        by: [col], 
        where: Object.keys(where).length > 0 ? where : undefined,
        _count: { _all: true } 
      });
      return rows.map(r => ({ key: r[col] ?? 'Não informado', count: r._count._all }))
        .sort((a,b) => b.count - a.count).slice(0,10);
    };
    
    const [topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema] = await Promise.all([
      top('orgaos'), top('unidadeCadastro'), top('tipoDeManifestacao'), top('tema')
    ]);
    
    cache['summary'] = { total, last7, last30, statusCounts, topOrgaos, topUnidadeCadastro, topTipoManifestacao, topTema };
    
    // 2. Dados mensais
    console.log('📅 Carregando dados mensais...');
    const byMonthRows = await prisma.record.groupBy({
      by: ['dataCriacaoIso'],
      where: { dataCriacaoIso: { not: null } },
      _count: { _all: true }
    });
    const monthMap = new Map();
    for (const r of byMonthRows) {
      if (!r.dataCriacaoIso) continue;
      const mes = r.dataCriacaoIso.slice(0, 7);
      monthMap.set(mes, (monthMap.get(mes) || 0) + r._count._all);
    }
    cache['by-month'] = Array.from(monthMap.entries()).map(([ym, count]) => ({ ym, count }))
      .sort((a,b) => a.ym.localeCompare(b.ym)).slice(-12);
    
    // 3. Dados diários (últimos 30 dias)
    console.log('📆 Carregando dados diários...');
    const byDayRows = await prisma.record.groupBy({
      by: ['dataCriacaoIso'],
      where: { 
        dataCriacaoIso: { 
          gte: last30Str, 
          lte: todayStr 
        } 
      },
      _count: { _all: true }
    });
    const dayMap = new Map();
    for (const r of byDayRows) {
      if (r.dataCriacaoIso) {
        dayMap.set(r.dataCriacaoIso, r._count._all);
      }
    }
    const byDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      byDay.push({ date: dateKey, count: dayMap.get(dateKey) || 0 });
    }
    cache['by-day'] = byDay;
    
    // 4. Top órgãos
    console.log('🏛️ Carregando top órgãos...');
    cache['count-by-orgaos'] = topOrgaos;
    
    // 5. Top temas
    console.log('📚 Carregando temas...');
    const byTheme = await prisma.record.groupBy({
      by: ['tema'],
      where: { tema: { not: null } },
      _count: { _all: true }
    });
    cache['by-theme'] = byTheme.map(r => ({ 
      tema: r.tema || 'Não informado', 
      quantidade: r._count._all 
    })).sort((a,b) => b.quantidade - a.quantidade);
    
    // 6. Status overview
    console.log('📊 Carregando status overview...');
    cache['status-overview'] = statusCounts;
    
    // Salvar cache
    for (const [key, value] of Object.entries(cache)) {
      cacheManager.set(key, value);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Cache universal construído em ${duration}s com ${Object.keys(cache).length} endpoints`);
    
    return cache;
  } catch (error) {
    console.error('❌ Erro ao construir cache universal:', error);
    throw error;
  }
}

/**
 * Agendar atualização diária às 07:00
 */
export function scheduleDailyUpdate(prisma) {
  const scheduleNext = () => {
    const now = new Date();
    const next7am = new Date(now);
    next7am.setHours(7, 0, 0, 0);
    
    // Se já passou das 07:00 hoje, agendar para amanhã
    if (now >= next7am) {
      next7am.setDate(next7am.getDate() + 1);
    }
    
    const msUntil7am = next7am.getTime() - now.getTime();
    
    console.log(`⏰ Próxima atualização do cache agendada para: ${next7am.toLocaleString('pt-BR')}`);
    
    setTimeout(async () => {
      console.log('🔄 Iniciando atualização diária do cache às 07:00...');
      await buildUniversalCache(prisma);
      // Agendar próxima atualização
      scheduleNext();
    }, msUntil7am);
  };
  
  scheduleNext();
}

