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
  // FASE 2.1: Usar Logger
  if (window.Logger) {
    window.Logger.info('Página Home carregada');
  } else {
    console.log('🏠 Página Home carregada');
  }
  // Retornar Promise resolvida para compatibilidade com loadSection
  return Promise.resolve();
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
    return () => {
      const func = window.data?.loadUnit || window.loadUnit;
      if (!func) {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.warn(`Função loadUnit não encontrada para unidade ${unitName}`);
        } else {
          console.warn(`⚠️ Função loadUnit não encontrada para unidade ${unitName}`);
        }
        return Promise.resolve();
      }
      const result = func(unitName);
      // Se não retornou Promise, converter para Promise
      return result && typeof result.then === 'function' ? result : Promise.resolve(result);
    };
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
  // Garantir que sempre retorna uma Promise
  return () => {
    // CORREÇÃO: Aguardar window.data estar disponível se necessário
    const getFunc = () => {
      // Tentar window.data primeiro (módulo principal)
      if (window.data && typeof window.data[funcName] === 'function') {
        return window.data[funcName];
      }
      // Tentar função global
      if (typeof window[funcName] === 'function') {
        return window[funcName];
      }
      // Tentar módulos específicos (data-pages.js)
      if (window.dataPages && typeof window.dataPages[funcName] === 'function') {
        return window.dataPages[funcName];
      }
      return null;
    };
    
    let func = getFunc();
    
    // Se não encontrou e window.data ainda não está disponível, aguardar um pouco
    if (!func && !window.data && (funcName === 'loadOrgaoMes' || funcName === 'loadTempoMedio' || funcName === 'loadTema')) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.debug(`Aguardando window.data estar disponível para ${funcName}...`);
      }
      
      // Aguardar até 2 segundos para window.data estar disponível
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20; // 2 segundos (20 * 100ms)
        
        const checkAndExecute = () => {
          attempts++;
          func = getFunc();
          
          if (func) {
            // Função encontrada, executar
            try {
              const result = func();
              const promise = result && typeof result.then === 'function' ? result : Promise.resolve(result);
              promise.then(resolve).catch(resolve);
            } catch (error) {
              // FASE 2.1: Usar Logger
              if (window.Logger) {
                window.Logger.error(`Erro ao executar ${funcName}:`, error);
              }
              resolve();
            }
          } else if (attempts >= maxAttempts) {
            // Timeout - função não encontrada
            // FASE 2.1: Usar Logger
            if (window.Logger) {
              window.Logger.warn(`Função de carregamento ${funcName} não encontrada para página ${page} após ${maxAttempts * 100}ms`);
            } else {
              console.warn(`⚠️ Função de carregamento ${funcName} não encontrada para página ${page}`);
            }
            resolve();
          } else {
            // Tentar novamente em 100ms
            // FASE 2.2: Usar timerManager
            const timerId = window.timerManager 
              ? window.timerManager.setTimeout(checkAndExecute, 100, `getPageLoader-${funcName}-retry`)
              : setTimeout(checkAndExecute, 100);
          }
        };
        
        checkAndExecute();
      });
    }
    
    if (!func) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.warn(`Função de carregamento ${funcName} não encontrada para página ${page}`);
      } else {
        console.warn(`⚠️ Função de carregamento ${funcName} não encontrada para página ${page}`);
      }
      return Promise.resolve();
    }
    
    try {
      const result = func();
      // Se não retornou Promise, converter para Promise
      return result && typeof result.then === 'function' ? result : Promise.resolve(result);
    } catch (error) {
      // FASE 2.1: Usar Logger
      if (window.Logger) {
        window.Logger.error(`Erro ao executar ${funcName}:`, error);
      } else {
        console.error(`❌ Erro ao executar ${funcName}:`, error);
      }
      return Promise.resolve();
    }
  };
}

/**
 * Sistema de Pré-carregamento Inteligente
 * Carrega outras páginas em background para gerar cache
 */
const preloadManager = {
  // Páginas que podem ser pré-carregadas (exclui home e páginas dinâmicas)
  preloadablePages: [
    'main', 'orgao-mes', 'tempo-medio', 'tema', 'assunto', 'cadastrante',
    'reclamacoes', 'projecao-2026', 'secretaria', 'secretarias-distritos',
    'tipo', 'setor', 'categoria', 'status', 'bairro', 'uac', 'responsavel',
    'canal', 'prioridade'
  ],
  
  // Páginas já pré-carregadas (evita duplicação)
  preloadedPages: new Set(),
  
  // Delay entre pré-carregamentos (ms) - não sobrecarrega o servidor
  preloadDelay: 2000, // 2 segundos entre cada página
  
  /**
   * Pré-carregar uma página específica em background
   */
  async preloadPage(pageName) {
    // Não pré-carregar se já foi pré-carregada
    if (this.preloadedPages.has(pageName)) {
      return;
    }
    
    // Não pré-carregar páginas especiais
    if (pageName === 'home' || pageName?.startsWith('unit-')) {
      return;
    }
    
    try {
      const loader = getPageLoader(pageName);
      if (loader) {
        // Marcar como pré-carregando
        this.preloadedPages.add(pageName);
        
        // Carregar em background (silenciosamente)
        await loader().catch(error => {
          // Em caso de erro, remover do cache para tentar novamente depois
          this.preloadedPages.delete(pageName);
          // Não logar erro - é pré-carregamento em background
        });
        
        if (window.Logger) {
          window.Logger.debug(`✅ Página ${pageName} pré-carregada para cache`);
        }
      }
    } catch (error) {
      // Ignorar erros silenciosamente - é pré-carregamento
      this.preloadedPages.delete(pageName);
    }
  },
  
  /**
   * Pré-carregar todas as outras páginas em background
   */
  async preloadOtherPages(currentPage) {
    // Aguardar um pouco antes de começar (dar tempo para página atual carregar)
    await new Promise(resolve => {
      if (window.timerManager) {
        window.timerManager.setTimeout(resolve, 3000, 'preload-delay'); // 3 segundos
      } else {
        setTimeout(resolve, 3000);
      }
    });
    
    // Filtrar páginas que não são a atual e ainda não foram pré-carregadas
    const pagesToPreload = this.preloadablePages.filter(page => 
      page !== currentPage && !this.preloadedPages.has(page)
    );
    
    if (window.Logger) {
      window.Logger.debug(`🔄 Iniciando pré-carregamento de ${pagesToPreload.length} páginas em background...`);
    }
    
    // Pré-carregar uma página por vez com delay (não sobrecarrega servidor)
    for (let i = 0; i < pagesToPreload.length; i++) {
      const page = pagesToPreload[i];
      
      // Usar requestIdleCallback se disponível (melhor performance)
      if (window.requestIdleCallback) {
        await new Promise(resolve => {
          window.requestIdleCallback(() => {
            this.preloadPage(page).finally(resolve);
          }, { timeout: 5000 });
        });
      } else {
        // Fallback: usar setTimeout
        await new Promise(resolve => {
          if (window.timerManager) {
            window.timerManager.setTimeout(() => {
              this.preloadPage(page).finally(resolve);
            }, i * this.preloadDelay, `preload-${page}`);
          } else {
            setTimeout(() => {
              this.preloadPage(page).finally(resolve);
            }, i * this.preloadDelay);
          }
        });
      }
    }
    
    if (window.Logger) {
      window.Logger.debug(`✅ Pré-carregamento concluído! ${this.preloadedPages.size} páginas em cache`);
    }
  }
};

/**
 * Carregar seção específica
 * OTIMIZADO: Simplificado e mais eficiente + Pré-carregamento inteligente
 */
async function loadSection(page) {
  if (!page) return;
  
  // Atualizar indicador de filtros
  window.filters?.updateFilterIndicator?.();
  
  // REMOVIDO: Não mostrar indicador de loading - permite navegação livre
  // Os dados carregam em background sem bloquear a interface
  
  // FASE 2.4: Lazy load de módulos específicos se necessário
  const pagesNeedingDataPages = ['tema', 'assunto', 'cadastrante', 'reclamacoes', 'projecao-2026', 
    'secretaria', 'secretarias-distritos', 'tipo', 'setor', 'categoria', 'status', 'bairro', 
    'uac', 'responsavel', 'canal', 'prioridade', 'tempo-medio', 'orgao-mes'];
  const pagesNeedingDataCharts = ['main']; // Página principal usa gráficos avançados
  
  // Carregar módulos necessários se ainda não foram carregados
  if (pagesNeedingDataPages.includes(page) && window.lazyLoader && !window.lazyLoader.isLoaded('/scripts/modules/data-pages.js')) {
    await window.lazyLoader.load('/scripts/modules/data-pages.js').catch(() => {
      // Ignorar erro - módulo pode já estar carregado via script tag
    });
  }
  
  if (pagesNeedingDataCharts.includes(page) && window.lazyLoader && !window.lazyLoader.isLoaded('/scripts/modules/data-charts.js')) {
    await window.lazyLoader.load('/scripts/modules/data-charts.js').catch(() => {
      // Ignorar erro - módulo pode já estar carregado via script tag
    });
  }
  
  try {
    const loader = getPageLoader(page);
    if (loader) {
      // Carregar dados da página atual primeiro (prioridade)
      loader().then(() => {
        // Após carregar página atual, iniciar pré-carregamento das outras em background
        if (preloadManager.preloadablePages.includes(page)) {
          preloadManager.preloadOtherPages(page).catch(() => {
            // Ignorar erros silenciosamente - é pré-carregamento
          });
        }
      }).catch(error => {
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error(`Erro ao carregar página ${page}:`, error);
        } else {
          console.error(`❌ Erro ao carregar página ${page}:`, error);
        }
      });
    }
    
    // Re-inicializar chat se necessário
    if (page === 'cora-chat' && typeof initChatPage === 'function') {
      // FASE 2.2: Usar timerManager
      const chatTimerId = window.timerManager 
        ? window.timerManager.setTimeout(initChatPage, 100, 'initChatPage')
        : setTimeout(initChatPage, 100);
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
        // FASE 2.1: Usar Logger
        if (window.Logger) {
          window.Logger.error('Erro ao atualizar insights:', error);
        } else {
          console.error('❌ Erro ao atualizar insights:', error);
        }
      } finally {
        btnRefreshInsights.disabled = false;
        btnRefreshInsights.textContent = '🔄 Atualizar';
      }
    });
  }
}

/**
 * Pré-carregar dados em background
 * SUBSTITUÍDO: Agora usa preloadManager para pré-carregar páginas completas
 * Mantida para compatibilidade
 */
async function preloadData() {
  // Usar novo sistema de pré-carregamento inteligente
  const currentPage = document.querySelector('[data-page].active')?.getAttribute('data-page') || 'main';
  if (preloadManager.preloadablePages.includes(currentPage)) {
    // Iniciar pré-carregamento das outras páginas em background
    preloadManager.preloadOtherPages(currentPage).catch(() => {
      // Ignorar erros silenciosamente - é pré-carregamento
    });
  }
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
  // FASE 2.2: Usar timerManager
  const preloadTimerId = window.timerManager 
    ? window.timerManager.setTimeout(preloadData, 2000, 'preloadData')
    : setTimeout(preloadData, 2000);
  
  // FASE 2.1: Usar Logger
  if (window.Logger) {
    window.Logger.success('Sistema inicializado');
  } else {
    console.log('✅ Sistema inicializado');
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM já carregado
  init();
}

// Exportar funções para uso global
// Exportar preloadManager globalmente
window.preloadManager = preloadManager;

window.main = {
  init,
  initPage,
  loadHome,
  loadSection,
  initNavigation,
  initEventListeners,
  preloadManager
};

// Exportar funções globalmente para compatibilidade
window.initPage = initPage;
window.loadHome = loadHome;
window.loadSection = loadSection;

