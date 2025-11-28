/**
 * ============================================================================
 * PÁGINA: ZELADORIA - VISÃO GERAL
 * ============================================================================
 * 
 * Esta página apresenta uma visão consolidada e abrangente de todas as
 * ocorrências de zeladoria, fornecendo um dashboard executivo com os
 * principais indicadores e gráficos de síntese.
 * 
 * DADOS EXIBIDOS:
 * - KPIs principais (total, fechados, abertos, tempo médio)
 * - Distribuição por status (gráfico de rosca)
 * - Top categorias (gráfico de barras horizontal)
 * - Distribuição por departamento (gráfico de barras horizontal)
 * - Evolução mensal (gráfico de linha)
 * - Dados adicionais: origem, canal, prazo
 * 
 * CAMPOS DO BANCO UTILIZADOS:
 * - status: Status atual da demanda
 * - categoria: Categoria da demanda
 * - departamento: Departamento responsável
 * - origem: Origem da demanda
 * - canal: Canal de entrada
 * - prazo: Prazo estabelecido
 * - dataCriacaoIso: Data de criação normalizada
 * 
 * ============================================================================
 */

async function loadZeladoriaOverview() {
  const page = document.getElementById('page-zeladoria-overview');
  if (!page || page.style.display === 'none') return;
  
  try {
    // Carregar estatísticas
    const stats = await window.dataLoader?.load('/api/zeladoria/stats', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || {};
    
    // Atualizar KPIs
    document.getElementById('zeladoria-kpi-total').textContent = stats.total?.toLocaleString('pt-BR') || '—';
    document.getElementById('zeladoria-kpi-fechados').textContent = stats.fechados?.toLocaleString('pt-BR') || '—';
    document.getElementById('zeladoria-kpi-abertos').textContent = stats.abertos?.toLocaleString('pt-BR') || '—';
    document.getElementById('zeladoria-kpi-tempo').textContent = stats.tempoMedioResolucao ? `${stats.tempoMedioResolucao} dias` : '—';
    
    // Carregar dados por status
    const statusData = await window.dataLoader?.load('/api/zeladoria/count-by?field=status', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (statusData.length > 0) {
      const labels = statusData.map(d => d.key);
      const values = statusData.map(d => d.count);
      await window.chartFactory?.createDoughnutChart('zeladoria-chart-status', labels, values, {
        onClick: true,
        colorIndex: 0
      });
    }
    
    // Carregar dados por categoria
    const categoriaData = await window.dataLoader?.load('/api/zeladoria/count-by?field=categoria', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (categoriaData.length > 0) {
      const labels = categoriaData.slice(0, 10).map(d => d.key);
      const values = categoriaData.slice(0, 10).map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-chart-categoria', labels, values, {
        horizontal: true,
        colorIndex: 1
      });
    }
    
    // Carregar dados por departamento
    const departamentoData = await window.dataLoader?.load('/api/zeladoria/count-by?field=departamento', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (departamentoData.length > 0) {
      const labels = departamentoData.map(d => d.key);
      const values = departamentoData.map(d => d.count);
      await window.chartFactory?.createBarChart('zeladoria-chart-departamento', labels, values, {
        horizontal: true,
        colorIndex: 2
      });
    }
    
    // Carregar dados mensais
    const mensalData = await window.dataLoader?.load('/api/zeladoria/by-month', {
      useDataStore: true,
      ttl: 10 * 60 * 1000
    }) || [];
    
    if (mensalData.length > 0) {
      const labels = mensalData.map(d => {
        const [year, month] = d.month.split('-');
        return `${month}/${year}`;
      });
      const values = mensalData.map(d => d.count);
      await window.chartFactory?.createLineChart('zeladoria-chart-mensal', labels, values, {
        colorIndex: 3
      });
    }
    
  } catch (error) {
    window.Logger?.error('Erro ao carregar Visão Geral Zeladoria:', error);
  }
}

// Conectar ao sistema global de filtros
if (window.chartCommunication && window.chartCommunication.createPageFilterListener) {
  window.chartCommunication.createPageFilterListener('page-zeladoria-overview', loadZeladoriaOverview, 500);
}

window.loadZeladoriaOverview = loadZeladoriaOverview;

