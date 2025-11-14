/**
 * Página: Secretarias
 * Análise por secretarias
 * 
 * Recriada com estrutura otimizada
 */

async function loadSecretaria() {
  if (window.Logger) {
    window.Logger.debug('🏛️ loadSecretaria: Iniciando');
  }
  
  const page = document.getElementById('page-secretaria');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Secretaria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top10 = data.slice(0, 10);
    const labels = top10.map(x => x.key || x._id || 'N/A');
    const values = top10.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartSecretaria', labels, values, {
      horizontal: true,
      colorIndex: 0,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankSecretaria');
    if (rankEl) {
      rankEl.innerHTML = top10.map((item, idx) => `
        <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-cyan-300 font-mono">${item.key || item._id || 'N/A'}</span>
          <span class="font-bold text-violet-300">${(item.count || 0).toLocaleString('pt-BR')}</span>
        </li>
      `).join('');
    }
    
    // Carregar dados mensais
    const dataMes = await window.dataLoader?.load('/api/aggregate/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (dataMes.length > 0) {
      const labelsMes = dataMes.map(x => {
        const ym = x.ym || x.month || '';
        return window.dateUtils?.formatMonthYear?.(ym) || ym || 'Data inválida';
      });
      const valuesMes = dataMes.map(x => x.count || 0);
      
      await window.chartFactory?.createBarChart('chartSecretariaMes', labelsMes, valuesMes, {
        colorIndex: 0,
        label: 'Manifestações'
      });
    }
    
    if (window.Logger) {
      window.Logger.success('🏛️ loadSecretaria: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Secretaria:', error);
    }
  }
}

window.loadSecretaria = loadSecretaria;

