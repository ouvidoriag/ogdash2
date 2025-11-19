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
  const isOuvidoria = btnOuvidoria?.classList.contains('active');
  const homePageId = isOuvidoria ? 'page-home' : 'page-zeladoria-home';
  const homePageData = isOuvidoria ? 'home' : 'zeladoria-home';
  
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
    : document.getElementById('sideMenuZeladoria');
  
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
    'zeladoria-geografica': 'loadZeladoriaGeografica'
  };
  
  const funcName = loaderMap[page];
  if (funcName) {
    const func = window[funcName];
    if (func && typeof func === 'function') {
      return func;
    }
  }
  
  // Fallback: tentar gerar nome da função dinamicamente
  const loaderName = `load${page.charAt(0).toUpperCase() + page.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
  
  if (window[loaderName] && typeof window[loaderName] === 'function') {
    return window[loaderName];
  }
  
  if (window.data && window.data[loaderName] && typeof window.data[loaderName] === 'function') {
    return window.data[loaderName];
  }
  
  return null;
}

async function loadSection(page) {
  if (!page) return;
  
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
    : document.getElementById('sideMenuZeladoria');
  
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
  const menuItems = document.querySelectorAll('[data-page]');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) {
        loadSection(page);
      }
    });
  });
}

function initSectionSelector() {
  const btnOuvidoria = document.getElementById('btnSectionOuvidoria');
  const btnZeladoria = document.getElementById('btnSectionZeladoria');
  const menuOuvidoria = document.getElementById('sideMenuOuvidoria');
  const menuZeladoria = document.getElementById('sideMenuZeladoria');
  const sectionTitle = document.getElementById('sectionTitle');
  
  if (!btnOuvidoria || !btnZeladoria || !menuOuvidoria || !menuZeladoria) return;
  
  function switchSection(section) {
    if (section === 'ouvidoria') {
      btnOuvidoria.classList.add('active');
      btnZeladoria.classList.remove('active');
      menuOuvidoria.style.display = 'block';
      menuZeladoria.style.display = 'none';
      if (sectionTitle) sectionTitle.textContent = 'Ouvidoria';
      loadSection('home');
    } else {
      btnOuvidoria.classList.remove('active');
      btnZeladoria.classList.add('active');
      menuOuvidoria.style.display = 'none';
      menuZeladoria.style.display = 'block';
      if (sectionTitle) sectionTitle.textContent = 'Zeladoria';
      loadSection('zeladoria-home');
    }
  }
  
  btnOuvidoria.addEventListener('click', () => switchSection('ouvidoria'));
  btnZeladoria.addEventListener('click', () => switchSection('zeladoria'));
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

function init() {
  initSectionSelector();
  initPage();
  initNavigation();
  initEventListeners();
  
  setTimeout(preloadData, 2000);
  
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

window.initPage = initPage;
window.loadHome = loadHome;
window.loadSection = loadSection;

