/**
 * Main Module - Inicialização centralizada do sistema
 * Gerencia setup inicial, navegação SPA e event listeners globais
 */

/**
 * Inicializar página
 * OTIMIZADO: Mais direto e eficiente
 */
function initPage() {
  // Restaurar filtros se existirem
  if (window.globalFilters?.filters?.length > 0) {
    window.filters?.updateFilterIndicator?.();
    window.filters?.updatePageTitle?.();
  }
  
  // Configurar estado inicial: home visível, outras ocultas
  const allPages = document.getElementById('pages');
  if (allPages) {
    Array.from(allPages.children).forEach(page => {
      page.style.display = page.id === 'page-home' ? 'block' : 'none';
    });
  }
  
  // Ativar botão home
  const homeBtn = document.querySelector('[data-page="home"]');
  if (homeBtn) {
    document.querySelectorAll('div[data-page]').forEach(b => b.classList.remove('active'));
    homeBtn.classList.add('active');
  }
}

/**
 * Carregar página Home
 */
function loadHome() {
  // A página home é estática, não precisa carregar dados
  console.log('🏠 Página Home carregada');
}

/**
 * Mostrar indicador de carregamento (DESABILITADO - não bloqueia navegação)
 */
function showLoadingIndicator(pageId) {
  // REMOVIDO: Não mostrar indicador que bloqueia navegação
  // Os dados carregam em background sem bloquear a interface
  return;
}

/**
 * Ocultar indicador de carregamento (DESABILITADO)
 */
function hideLoadingIndicator(pageId) {
  // REMOVIDO: Não há indicador para esconder
  return;
}

/**
 * Obter função de carregamento para uma página
 * OTIMIZADO: Busca direta sem múltiplas verificações
 */
function getPageLoader(page) {
  // Páginas especiais
  if (page === 'home') return loadHome;
  if (page?.startsWith('unit-')) {
    const unitName = page.replace('unit-', '').replace(/-/g, ' ');
    return () => (window.data?.loadUnit || window.loadUnit)?.(unitName);
  }
  
  // Mapeamento direto de páginas para funções
  const loaderMap = {
    'main': 'loadOverview',
    'cora-chat': 'loadCoraChat',
    'orgao-mes': 'loadOrgaoMes',
    'tempo-medio': 'loadTempoMedio',
    'tema': 'loadTema',
    'assunto': 'loadAssunto',
    'cadastrante': 'loadCadastrante',
    'reclamacoes': 'loadReclamacoes',
    'projecao-2026': 'loadProjecao2026',
    'secretaria': 'loadSecretaria',
    'secretarias-distritos': 'loadSecretariasDistritos',
    'tipo': 'loadTipo',
    'setor': 'loadSetor',
    'categoria': 'loadCategoria',
    'status': 'loadStatusPage',
    'bairro': 'loadBairro',
    'uac': 'loadUAC',
    'responsavel': 'loadResponsavel',
    'canal': 'loadCanal',
    'prioridade': 'loadPrioridade'
  };
  
  const funcName = loaderMap[page];
  if (!funcName) return null;
  
  // Buscar função no módulo data ou global
  return () => (window.data?.[funcName] || window[funcName])?.();
}

/**
 * Carregar seção específica
 * OTIMIZADO: Simplificado e mais eficiente
 */
async function loadSection(page) {
  if (!page) return;
  
  // Atualizar indicador de filtros
  window.filters?.updateFilterIndicator?.();
  
  // REMOVIDO: Não mostrar indicador de loading - permite navegação livre
  // Os dados carregam em background sem bloquear a interface
  
  try {
    const loader = getPageLoader(page);
    if (loader) {
      // Carregar dados em background (não bloqueia navegação)
      loader().catch(error => {
        console.error(`❌ Erro ao carregar página ${page}:`, error);
      });
    }
    
    // Re-inicializar chat se necessário
    if (page === 'cora-chat' && typeof initChatPage === 'function') {
      setTimeout(initChatPage, 100);
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar página ${page}:`, error);
  }
  // REMOVIDO: finally block - não precisa esconder indicador
}

/**
 * Inicializar navegação SPA
 * OTIMIZADO: Simplificado e mais eficiente
 */
function initNavigation() {
  const sideMenu = document.getElementById('sideMenu');
  const pages = document.getElementById('pages');
  
  if (!sideMenu || !pages) return;
  
  sideMenu.querySelectorAll('div[data-page]').forEach(btn => {
    btn.onclick = () => {
      const pageName = btn.getAttribute('data-page');
      if (!pageName) return;
      
      // Atualizar estado visual IMEDIATAMENTE (sem esperar carregamento)
      sideMenu.querySelectorAll('div[data-page]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Ocultar todas as páginas e mostrar a selecionada IMEDIATAMENTE
      Array.from(pages.children).forEach(page => page.style.display = 'none');
      const targetPage = document.getElementById(`page-${pageName}`);
      if (targetPage) {
        targetPage.style.display = 'block';
      }
      
      // Carregar conteúdo em background (não bloqueia navegação)
      loadSection(pageName);
    };
  });
}

/**
 * Inicializar event listeners globais
 */
function initEventListeners() {
  // Event listeners de exportação (se existirem)
  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', async () => {
      const exportMenu = document.getElementById('exportMenu');
      if (exportMenu) exportMenu.classList.add('hidden');
      if (window.export?.exportCSV) {
        await window.export.exportCSV();
      } else if (window.exportCSV) {
        await exportCSV();
      }
    });
  }
  
  const btnExportExcel = document.getElementById('btnExportExcel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', async () => {
      const exportMenu = document.getElementById('exportMenu');
      if (exportMenu) exportMenu.classList.add('hidden');
      if (window.export?.exportExcel) {
        await window.export.exportExcel();
      } else if (window.exportExcel) {
        await exportExcel();
      }
    });
  }
  
  const btnExportChartData = document.getElementById('btnExportChartData');
  if (btnExportChartData) {
    btnExportChartData.addEventListener('click', async () => {
      const exportMenu = document.getElementById('exportMenu');
      if (exportMenu) exportMenu.classList.add('hidden');
      if (window.export?.exportChartData) {
        await window.export.exportChartData();
      } else if (window.exportChartData) {
        await exportChartData();
      }
    });
  }
  
  const btnExportSummary = document.getElementById('btnExportSummary');
  if (btnExportSummary) {
    btnExportSummary.addEventListener('click', async () => {
      const exportMenu = document.getElementById('exportMenu');
      if (exportMenu) exportMenu.classList.add('hidden');
      if (window.export?.exportSummary) {
        await window.export.exportSummary();
      } else if (window.exportSummary) {
        await exportSummary();
      }
    });
  }
  
  // Atualizar tabela quando mudar o limite
  const exportLimit = document.getElementById('exportLimit');
  if (exportLimit) {
    exportLimit.addEventListener('change', (e) => {
      if (window.data?.loadTable) {
        window.data.loadTable(e.target.value);
      } else if (window.loadTable) {
        loadTable(e.target.value);
      }
    });
  }
  
  // Botão de refresh de insights
  const btnRefreshInsights = document.getElementById('btnRefreshInsights');
  if (btnRefreshInsights) {
    btnRefreshInsights.addEventListener('click', async () => {
      btnRefreshInsights.disabled = true;
      btnRefreshInsights.textContent = '⏳ Atualizando...';
      try {
        if (window.data?.loadAIInsights) {
          await window.data.loadAIInsights();
        } else if (window.loadAIInsights) {
          await loadAIInsights();
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar insights:', error);
      } finally {
        btnRefreshInsights.disabled = false;
        btnRefreshInsights.textContent = '🔄 Atualizar';
      }
    });
  }
}

/**
 * Pré-carregar dados em background
 * OTIMIZADO: Simplificado - apenas endpoints mais usados, sem prioridades complexas
 */
async function preloadData() {
  // Aguardar um pouco para não competir com carregamento inicial
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const fetchFn = window.api?.fetchWithCache;
  if (!fetchFn) return;
  
  // Endpoints mais usados (cache inteligente já gerencia duração)
  const endpoints = [
    '/api/summary',
    '/api/aggregate/by-month',
    '/api/aggregate/by-day',
    '/api/aggregate/count-by?field=Status',
    '/api/stats/status-overview'
  ];
  
  // Carregar em paralelo silenciosamente (cache fará o resto)
  Promise.allSettled(
    endpoints.map(endpoint => fetchFn(endpoint).catch(() => {}))
  );
}

/**
 * Inicializar sistema completo
 * OTIMIZADO: Inicialização mais rápida e direta
 */
function init() {
  // Inicializar componentes essenciais em paralelo
  initPage();
  initNavigation();
  initEventListeners();
  
  // Pré-carregar dados em background (não bloqueia)
  setTimeout(preloadData, 2000);
  
  console.log('✅ Sistema inicializado');
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM já carregado
  init();
}

// Exportar funções para uso global
window.main = {
  init,
  initPage,
  loadHome,
  loadSection,
  initNavigation,
  initEventListeners,
  preloadData
};

// Exportar funções globalmente para compatibilidade
window.initPage = initPage;
window.loadHome = loadHome;
window.loadSection = loadSection;

