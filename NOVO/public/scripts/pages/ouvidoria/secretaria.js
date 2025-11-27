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
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createBarChart('chartSecretaria', labels, values, {
      horizontal: true,
      colorIndex: 0,
      label: 'Manifestações',
      onClick: true // Habilitar comunicação e filtros
    });
    
    // Renderizar ranking
    const rankEl = document.getElementById('rankSecretaria');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => `
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
    
    // Atualizar KPIs
    updateSecretariaKPIs(data);
    
    if (window.Logger) {
      window.Logger.success('🏛️ loadSecretaria: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Secretaria:', error);
    }
  }
}

/**
 * Atualizar KPIs da página Secretaria
 */
function updateSecretariaKPIs(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }
  
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const secretariasUnicas = data.length;
  const mediaSecretaria = secretariasUnicas > 0 ? Math.round(total / secretariasUnicas) : 0;
  const secretariaMaisAtiva = data.length > 0 ? (data[0].key || data[0]._id || 'N/A') : 'N/A';
  
  // Atualizar elementos
  const kpiTotal = document.getElementById('kpiTotalSecretaria');
  const kpiUnicas = document.getElementById('kpiSecretariasUnicas');
  const kpiMedia = document.getElementById('kpiMediaSecretaria');
  const kpiMaisAtiva = document.getElementById('kpiSecretariaMaisAtiva');
  
  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('pt-BR');
  if (kpiUnicas) kpiUnicas.textContent = secretariasUnicas.toLocaleString('pt-BR');
  if (kpiMedia) kpiMedia.textContent = mediaSecretaria.toLocaleString('pt-BR');
  if (kpiMaisAtiva) {
    kpiMaisAtiva.textContent = secretariaMaisAtiva.length > 20 ? secretariaMaisAtiva.substring(0, 20) + '...' : secretariaMaisAtiva;
    kpiMaisAtiva.title = secretariaMaisAtiva; // Tooltip com nome completo
  }
}

window.loadSecretaria = loadSecretaria;

