/**
 * Main Module - Inicialização centralizada do sistema
 * Gerencia setup inicial, navegação SPA e event listeners globais
 */

function initPage() {
  if (window.globalFilters?.filters?.length > 0) {
    window.filters?.updateFilterIndicator?.();
    window.filters?.updatePageTitle?.();
  }
  
  const btnOuvidoria = document.getElementById('btnSectionOuvidoria');
  const btnZeladoria = document.getElementById('btnSectionZeladoria');
  const btnEsic = document.getElementById('btnSectionEsic');
  
  let isOuvidoria = btnOuvidoria?.classList.contains('active');
  let isZeladoria = btnZeladoria?.classList.contains('active');
  let isEsic = btnEsic?.classList.contains('active');
  
  // Se nenhum estiver ativo, padrão é Ouvidoria
  if (!isOuvidoria && !isZeladoria && !isEsic) {
    isOuvidoria = true;
  }
  
  const homePageId = isOuvidoria ? 'page-home' : (isZeladoria ? 'page-zeladoria-home' : 'page-esic-home');
  const homePageData = isOuvidoria ? 'home' : (isZeladoria ? 'zeladoria-home' : 'esic-home');
  
  const allPages = document.getElementById('pages');
  if (allPages) {
    Array.from(allPages.children).forEach(page => {
      if (page.tagName === 'SECTION') {
        page.style.display = page.id === homePageId ? 'block' : 'none';
      }
    });
  }
  
  const activeMenu = isOuvidoria 
    ? document.getElementById('sideMenuOuvidoria')
    : (isZeladoria ? document.getElementById('sideMenuZeladoria') : document.getElementById('sideMenuEsic'));
  
  if (activeMenu) {
    activeMenu.querySelectorAll('div[data-page]').forEach(b => b.classList.remove('active'));
    const homeBtn = activeMenu.querySelector(`[data-page="${homePageData}"]`);
    if (homeBtn) {
      homeBtn.classList.add('active');
    }
  }
}

function loadHome() {
  if (window.Logger) {
    window.Logger.info('Página Home carregada');
  }
  return Promise.resolve();
}

/**
 * Criar wrapper que aguarda função estar disponível
 */
function createWaitForFunctionWrapper(funcName) {
  return async function(...args) {
    // Tentar encontrar função imediatamente
    let func = window[funcName];
    if (func && typeof func === 'function') {
      return func(...args);
    }
    
    // Se não encontrou, aguardar até estar disponível (máximo 30 tentativas = 3 segundos)
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // Aumentado para 30 tentativas (3 segundos)
      const delay = 100; // 100ms entre tentativas
      
      const checkAndExecute = () => {
        attempts++;
        func = window[funcName];
        
        if (func && typeof func === 'function') {
          // Função encontrada, executar
          if (window.Logger) {
            window.Logger.debug(`✅ Função ${funcName} encontrada após ${attempts} tentativa(s)`);
          }
          try {
            const result = func(...args);
            const promise = result && typeof result.then === 'function' ? result : Promise.resolve(result);
            promise.then(resolve).catch(resolve);
          } catch (error) {
            if (window.Logger) {
              window.Logger.error(`Erro ao executar ${funcName}:`, error);
            }
            resolve();
          }
        } else if (attempts >= maxAttempts) {
          // Timeout - função não encontrada após todas as tentativas
          // Verificar se o script pode estar com erro
          const scripts = Array.from(document.querySelectorAll('script[src]'));
          const scriptSrc = scripts.find(s => s.src && s.src.includes('vencimento.js'));
          
          if (window.Logger) {
            const debugInfo = {
              funcName,
              attempts,
              windowHasFunc: typeof window[funcName],
              scriptLoaded: !!scriptSrc,
              scriptSrc: scriptSrc?.src || 'não encontrado'
            };
            window.Logger.warn(`Função ${funcName} não encontrada após ${maxAttempts} tentativas`, debugInfo);
          }
          resolve();
        } else {
          // Tentar novamente após delay
          const timerId = window.timerManager 
            ? window.timerManager.setTimeout(checkAndExecute, delay, `waitFor-${funcName}-retry`)
            : setTimeout(checkAndExecute, delay);
        }
      };
      
      checkAndExecute();
    });
  };
}

function getPageLoader(page) {
  if (page === 'home') return loadHome;
  if (page === 'unidades-saude') return window.loadUnidadesSaude || (() => Promise.resolve());
  if (page === 'zeladoria-home') {
    return () => {
      if (window.Logger) {
        window.Logger.info('Página Home Zeladoria carregada');
      }
      return Promise.resolve();
    };
  }
  if (page === 'zeladoria-overview') {
    return window.loadZeladoriaOverview || (() => Promise.resolve());
  }
  if (page === 'esic-home') {
    return () => {
      if (window.Logger) {
        window.Logger.info('Página Home E-SIC carregada');
      }
      // Não precisa carregar dados, apenas mostrar a página
      return Promise.resolve();
    };
  }
  if (page === 'esic-overview') {
    return window.loadEsicOverview || (() => Promise.resolve());
  }
  
  // Páginas dinâmicas de unidades de saúde
  if (page?.startsWith('unit-')) {
    const unitName = page.replace('unit-', '').replace(/-/g, ' ');
    return () => {
      const func = window.loadUnit;
      if (!func) {
        if (window.Logger) {
          window.Logger.warn(`Função loadUnit não encontrada para unidade ${unitName}`);
        }
        return Promise.resolve();
      }
      const result = func(unitName);
      return result instanceof Promise ? result : Promise.resolve(result);
    };
  }
  
  // Mapeamento direto para funções específicas
  const loaderMap = {
    'main': 'loadOverview',
    'cora-chat': 'loadCoraChat',
    'orgao-mes': 'loadOrgaoMes',
    'tempo-medio': 'loadTempoMedio',
    'vencimento': 'loadVencimento',
    'protocolos-demora': 'loadProtocolosDemora',
    'notificacoes': 'loadNotificacoes',
    'filtros-avancados': 'loadFiltrosAvancados',
    'tema': 'loadTema',
    'assunto': 'loadAssunto',
    'cadastrante': 'loadCadastrante',
    'reclamacoes': 'loadReclamacoes',
    'projecao-2026': 'loadProjecao2026',
    'tipo': 'loadTipo',
    'status': 'loadStatusPage',
    'bairro': 'loadBairro',
    'responsavel': 'loadResponsavel',
    'canal': 'loadCanal',
    'prioridade': 'loadPrioridade',
    // Páginas de Zeladoria
    'zeladoria-status': 'loadZeladoriaStatus',
    'zeladoria-categoria': 'loadZeladoriaCategoria',
    'zeladoria-departamento': 'loadZeladoriaDepartamento',
    'zeladoria-bairro': 'loadZeladoriaBairro',
    'zeladoria-responsavel': 'loadZeladoriaResponsavel',
    'zeladoria-canal': 'loadZeladoriaCanal',
    'zeladoria-tempo': 'loadZeladoriaTempo',
    'zeladoria-mensal': 'loadZeladoriaMensal',
    'zeladoria-geografica': 'loadZeladoriaGeografica',
    'zeladoria-mapa': 'loadZeladoriaMapa',
    // Páginas de E-SIC
    'esic-status': 'loadEsicStatus',
    'esic-tipo-informacao': 'loadEsicTipoInformacao',
    'esic-responsavel': 'loadEsicResponsavel',
    'esic-unidade': 'loadEsicUnidade',
    'esic-canal': 'loadEsicCanal',
    'esic-mensal': 'loadEsicMensal'
  };
  
  const funcName = loaderMap[page];
  if (funcName) {
    const func = window[funcName];
    if (func && typeof func === 'function') {
      return func;
    }
    
    // Se a função não está disponível, criar um wrapper que aguarda ela estar disponível
    return createWaitForFunctionWrapper(funcName);
  }
  
  // Fallback: tentar gerar nome da função dinamicamente
  const loaderName = `load${page.charAt(0).toUpperCase() + page.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
  
  if (window[loaderName] && typeof window[loaderName] === 'function') {
    return window[loaderName];
  }
  
  if (window.data && window.data[loaderName] && typeof window.data[loaderName] === 'function') {
    return window.data[loaderName];
  }
  
  // Tentar aguardar função dinâmica também
  return createWaitForFunctionWrapper(loaderName);
}

async function loadSection(page) {
  if (!page) return;
  
  // FILTROS LOCAIS POR PÁGINA: Limpar filtros ao trocar de página
  if (window.chartCommunication && window.chartCommunication.filters) {
    const currentFilters = window.chartCommunication.filters.filters || [];
    if (currentFilters.length > 0) {
      if (window.Logger) {
        window.Logger.debug(`🔄 Limpando ${currentFilters.length} filtro(s) ao trocar para página: ${page}`);
      }
      window.chartCommunication.clearFilters();
    }
  }
  
  const loader = getPageLoader(page);
  
  if (!loader) {
    if (window.Logger) {
      window.Logger.warn(`Loader não encontrado para página: ${page}`);
    }
    return;
  }
  
  const allPages = document.getElementById('pages');
  if (allPages) {
    Array.from(allPages.children).forEach(p => {
      if (p.tagName === 'SECTION') {
        p.style.display = 'none';
      }
    });
  }
  
  const pageElement = document.getElementById(`page-${page}`);
  if (pageElement) {
    pageElement.style.display = 'block';
  }
  
  const activeMenu = document.getElementById('sideMenuOuvidoria')?.style.display !== 'none'
    ? document.getElementById('sideMenuOuvidoria')
    : (document.getElementById('sideMenuZeladoria')?.style.display !== 'none'
      ? document.getElementById('sideMenuZeladoria')
      : document.getElementById('sideMenuEsic'));
  
  if (activeMenu) {
    activeMenu.querySelectorAll('div[data-page]').forEach(b => b.classList.remove('active'));
    const pageBtn = activeMenu.querySelector(`[data-page="${page}"]`);
    if (pageBtn) {
      pageBtn.classList.add('active');
    }
  }
  
  try {
    await loader();
  } catch (error) {
    if (window.Logger) {
      window.Logger.error(`Erro ao carregar página ${page}:`, error);
    }
  }
}

function initNavigation() {
  // Função para aguardar elementos estarem disponíveis
  function waitForMenuItems(maxAttempts = 50, interval = 100) {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkItems = () => {
        const items = document.querySelectorAll('[data-page]');
        if (items.length > 0 || attempts >= maxAttempts) {
          resolve(items);
        } else {
          attempts++;
          setTimeout(checkItems, interval);
        }
      };
      checkItems();
    });
  }

  waitForMenuItems().then(menuItems => {
    if (menuItems.length === 0) {
      if (window.Logger) {
        window.Logger.warn('Nenhum item de menu encontrado, tentando novamente...');
      }
      // Re-tentar após 1 segundo
      setTimeout(initNavigation, 1000);
      return;
    }

    menuItems.forEach(item => {
      // Remover listeners anteriores para evitar duplicação
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const page = newItem.getAttribute('data-page');
        if (page) {
          loadSection(page);
        }
      };
      
      // Adicionar múltiplos tipos de listeners
      newItem.addEventListener('click', handler, { passive: false, capture: false });
      newItem.addEventListener('touchend', handler, { passive: false, capture: false });
      newItem.onclick = handler;
      newItem.setAttribute('data-listener-attached', 'true');
    });

    if (window.Logger) {
      window.Logger.debug(`✅ ${menuItems.length} itens de menu inicializados`);
    }
  });
}

function initSectionSelector() {
  // Função auxiliar para aguardar elemento estar disponível
  function waitForElement(selector, maxAttempts = 50, interval = 100) {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkElement = () => {
        const element = typeof selector === 'string' 
          ? document.querySelector(selector) 
          : (typeof selector === 'function' ? selector() : selector);
        
        if (element) {
          resolve(element);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkElement, interval);
        } else {
          resolve(null);
        }
      };
      checkElement();
    });
  }

  // Aguardar elementos críticos estarem disponíveis
  Promise.all([
    waitForElement(() => document.getElementById('btnSectionOuvidoria')),
    waitForElement(() => document.getElementById('btnSectionZeladoria')),
    waitForElement(() => document.getElementById('btnSectionEsic')),
    waitForElement(() => document.getElementById('sideMenuOuvidoria')),
    waitForElement(() => document.getElementById('sideMenuZeladoria')),
    waitForElement(() => document.getElementById('sideMenuEsic')),
    waitForElement(() => document.getElementById('sectionTitle'))
  ]).then(([btnOuvidoria, btnZeladoria, btnEsic, menuOuvidoria, menuZeladoria, menuEsic, sectionTitle]) => {
    // Debug: verificar elementos encontrados
    if (window.Logger) {
      window.Logger.debug('Inicializando seletor de seções:', {
        btnOuvidoria: !!btnOuvidoria,
        btnZeladoria: !!btnZeladoria,
        btnEsic: !!btnEsic,
        menuOuvidoria: !!menuOuvidoria,
        menuZeladoria: !!menuZeladoria,
        menuEsic: !!menuEsic
      });
    }
    
    // Verificar elementos mínimos necessários
    if (!btnOuvidoria || !btnZeladoria || !menuOuvidoria || !menuZeladoria) {
      if (window.Logger) {
        window.Logger.warn('Elementos básicos não encontrados para initSectionSelector, tentando novamente...');
      }
      // Re-tentar após 1 segundo
      setTimeout(initSectionSelector, 1000);
      return;
    }
  
  function switchSection(section) {
    console.log('🔄 switchSection chamado com:', section);
    
    // Remover active de todos os botões (se existirem)
    if (btnOuvidoria) btnOuvidoria.classList.remove('active');
    if (btnZeladoria) btnZeladoria.classList.remove('active');
    if (btnEsic) btnEsic.classList.remove('active');
    
    // Esconder todos os menus (se existirem)
    if (menuOuvidoria) menuOuvidoria.style.display = 'none';
    if (menuZeladoria) menuZeladoria.style.display = 'none';
    if (menuEsic) menuEsic.style.display = 'none';
    
    if (section === 'ouvidoria') {
      if (btnOuvidoria) btnOuvidoria.classList.add('active');
      if (menuOuvidoria) menuOuvidoria.style.display = 'block';
      if (sectionTitle) sectionTitle.textContent = 'Ouvidoria';
      loadSection('home');
    } else if (section === 'zeladoria') {
      if (btnZeladoria) btnZeladoria.classList.add('active');
      if (menuZeladoria) menuZeladoria.style.display = 'block';
      if (sectionTitle) sectionTitle.textContent = 'Zeladoria';
      loadSection('zeladoria-home');
    } else if (section === 'esic') {
      console.log('✅ Ativando seção E-SIC');
      if (btnEsic) {
        btnEsic.classList.add('active');
        console.log('✅ Botão E-SIC marcado como active');
      } else {
        console.error('❌ btnEsic não encontrado');
      }
      if (menuEsic) {
        menuEsic.style.display = 'block';
        console.log('✅ Menu E-SIC exibido');
      } else {
        console.error('❌ menuEsic não encontrado');
      }
      if (sectionTitle) {
        sectionTitle.textContent = 'E-SIC';
        console.log('✅ Título atualizado para E-SIC');
      }
      loadSection('esic-home');
      
      if (window.Logger) {
        window.Logger.info('Seção E-SIC ativada');
      }
    }
  }
  
    // Função para adicionar event listener de forma robusta
    function addClickListener(element, handler, name) {
      if (!element) return;
      
      // Remover listeners anteriores para evitar duplicação
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      
      // Adicionar múltiplos tipos de listeners para garantir funcionamento
      newElement.addEventListener('click', handler, { passive: false, capture: false });
      newElement.addEventListener('touchend', handler, { passive: false, capture: false });
      
      // Fallback: onclick direto
      newElement.onclick = handler;
      
      // Adicionar atributo para debug
      newElement.setAttribute('data-listener-attached', 'true');
      
      if (window.Logger) {
        window.Logger.debug(`✅ Event listener adicionado ao ${name}`);
      }
      
      return newElement;
    }
    
    // Adicionar event listeners de forma robusta
    const handlerOuvidoria = (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchSection('ouvidoria');
    };
    
    const handlerZeladoria = (e) => {
      e.preventDefault();
      e.stopPropagation();
      switchSection('zeladoria');
    };
    
    const handlerEsic = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.Logger) {
        window.Logger.debug('🔵 Botão E-SIC clicado - chamando switchSection');
      }
      switchSection('esic');
    };
    
    if (btnOuvidoria) {
      btnOuvidoria = addClickListener(btnOuvidoria, handlerOuvidoria, 'btnSectionOuvidoria');
    }
    
    if (btnZeladoria) {
      btnZeladoria = addClickListener(btnZeladoria, handlerZeladoria, 'btnSectionZeladoria');
    }
    
    if (btnEsic) {
      btnEsic = addClickListener(btnEsic, handlerEsic, 'btnSectionEsic');
    }
    
    // Expor função globalmente para debug e fallback
    window.switchSection = switchSection;
    globalSwitchSection = switchSection; // Guardar em variável global também
    
    if (window.Logger) {
      window.Logger.debug('✅ switchSection exposto globalmente');
    }
  });
}

function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.filters?.clearFilters) {
        window.filters.clearFilters();
      }
    }
  });
}

async function preloadData() {
  try {
    if (window.dataLoader && window.dataLoader.load) {
      await window.dataLoader.load('/api/summary', { useDataStore: true });
    }
  } catch (error) {
    if (window.Logger) {
      window.Logger.warn('Erro ao pré-carregar dados:', error);
    }
  }
}

function initUrlRouting() {
  // Verificar se há rota na URL
  const path = window.location.pathname;
  
  if (path === '/chat' || path === '/chat/') {
    // Carregar página de chat
    loadSection('cora-chat');
    // Atualizar URL sem recarregar a página
    window.history.replaceState({}, '', '/');
  }
}

// Expor switchSection globalmente ANTES de init
let globalSwitchSection = null;

// Função switchSection global (será sobrescrita pela versão completa)
window.switchSection = function(section) {
  console.warn('⚠️ switchSection chamado antes da inicialização completa, tentando novamente...');
  // Tentar encontrar elementos e executar
  const btnOuvidoria = document.getElementById('btnSectionOuvidoria');
  const btnZeladoria = document.getElementById('btnSectionZeladoria');
  const btnEsic = document.getElementById('btnSectionEsic');
  const menuOuvidoria = document.getElementById('sideMenuOuvidoria');
  const menuZeladoria = document.getElementById('sideMenuZeladoria');
  const menuEsic = document.getElementById('sideMenuEsic');
  const sectionTitle = document.getElementById('sectionTitle');
  
  if (section === 'esic') {
    if (btnEsic) btnEsic.classList.add('active');
    if (btnOuvidoria) btnOuvidoria.classList.remove('active');
    if (btnZeladoria) btnZeladoria.classList.remove('active');
    if (menuEsic) menuEsic.style.display = 'block';
    if (menuOuvidoria) menuOuvidoria.style.display = 'none';
    if (menuZeladoria) menuZeladoria.style.display = 'none';
    if (sectionTitle) sectionTitle.textContent = 'E-SIC';
    if (window.loadSection) {
      window.loadSection('esic-home');
    }
  }
};

function init() {
  initSectionSelector();
  initPage();
  initNavigation();
  initEventListeners();
  initUrlRouting(); // Adicionar roteamento de URL
  
  // Garantir que switchSection está disponível
  if (globalSwitchSection) {
    window.switchSection = globalSwitchSection;
  }
  
  // Usar Timer Manager se disponível, senão fallback para setTimeout
  if (window.timerManager) {
    window.timerManager.setTimeout(preloadData, 2000, 'preloadData');
  } else {
    setTimeout(preloadData, 2000);
  }
  
  if (window.Logger) {
    window.Logger.success('Sistema inicializado');
  } else {
    console.log('✅ Sistema inicializado');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.main = {
  init,
  initPage,
  loadHome,
  loadSection,
  initNavigation,
  initSectionSelector,
  initEventListeners
};

// Garantir que switchSection está disponível globalmente
if (globalSwitchSection) {
  window.switchSection = globalSwitchSection;
}

window.initPage = initPage;
window.loadHome = loadHome;
window.loadSection = loadSection;

