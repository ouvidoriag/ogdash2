/**
 * Página: Tipos de Manifestação
 * 
 * Recriada com estrutura otimizada
 */

async function loadTipo() {
  if (window.Logger) {
    window.Logger.debug('📋 loadTipo: Iniciando');
  }
  
  const page = document.getElementById('page-tipo');
  if (!page || page.style.display === 'none') {
    return Promise.resolve();
  }
  
  try {
    const data = await window.dataLoader?.load('/api/aggregate/count-by?field=Tipo', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    const top20 = data.slice(0, 20);
    const labels = top20.map(x => x.key || x._id || 'N/A');
    const values = top20.map(x => x.count || 0);
    
    await window.chartFactory?.createDoughnutChart('chartTipo', labels, values, {
      type: 'pie',
      field: 'tipoDeManifestacao',
      onClick: true, // Habilitar comunicação e filtros
      legendContainer: 'legendTipo'
    });
    
    // Renderizar ranking com cores por tipo de manifestação
    const rankEl = document.getElementById('rankTipo');
    if (rankEl) {
      rankEl.innerHTML = top20.map((item, idx) => {
        const tipo = item.key || item._id || 'N/A';
        const color = window.config?.getColorByTipoManifestacao?.(tipo);
        const isLight = document.body?.classList.contains('light-mode');
        const defaultBgColor = isLight ? 'rgba(30, 41, 59, 0.2)' : 'rgba(148, 163, 184, 0.2)';
        const defaultTextColor = isLight ? '#334155' : '#cbd5e1';
        const defaultCountColor = isLight ? '#0891b2' : '#22d3ee';
        
        return `
          <li class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
            <span class="font-mono px-2 py-1 rounded text-sm" style="background-color: ${color ? `${color}20` : defaultBgColor}; color: ${color || defaultTextColor}">${tipo}</span>
            <span class="font-bold" style="color: ${color || defaultCountColor}">${(item.count || 0).toLocaleString('pt-BR')}</span>
          </li>
        `;
      }).join('');
    }
    
    if (window.Logger) {
      window.Logger.success('📋 loadTipo: Concluído');
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.error('Erro ao carregar Tipo:', error);
    }
  }
}

window.loadTipo = loadTipo;

