/**
 * ============================================================================
 * ROUTER PRINCIPAL - e-SIC
 * ============================================================================
 * 
 * Gerencia a navegação entre as páginas do módulo e-SIC
 * Similar ao zeladoria-main.js
 */

// Mapeamento de páginas
const pageMap = {
  'home': null,
  'overview': () => import('./esic-overview.js').then(m => m.default || window.loadEsicOverview),
  'status': () => import('./esic-status.js').then(m => m.default || window.loadEsicStatus),
  'tipo-informacao': () => import('./esic-tipo-informacao.js').then(m => m.default || window.loadEsicTipoInformacao),
  'responsavel': () => import('./esic-responsavel.js').then(m => m.default || window.loadEsicResponsavel),
  'unidade': () => import('./esic-unidade.js').then(m => m.default || window.loadEsicUnidade),
  'canal': () => import('./esic-canal.js').then(m => m.default || window.loadEsicCanal),
  'mensal': () => import('./esic-mensal.js').then(m => m.default || window.loadEsicMensal)
};

let currentPage = 'home';
let currentLoader = null;

/**
 * Carregar seção específica
 */
window.loadSection = function(pageId) {
  if (currentPage === pageId) return;
  
  // Esconder todas as páginas
  document.querySelectorAll('section[id^="page-"]').forEach(section => {
    section.style.display = 'none';
  });
  
  // Remover active de todos os nav items
  document.querySelectorAll('nav div[data-page]').forEach(item => {
    item.classList.remove('active');
  });
  
  // Ativar nav item
  const navItem = document.querySelector(`nav div[data-page="${pageId}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
  
  // Mostrar página
  const page = document.getElementById(`page-${pageId}`);
  if (page) {
    page.style.display = 'block';
  }
  
  // Atualizar título
  const titles = {
    'home': '🏠 Home - e-SIC',
    'overview': '📊 Visão Geral - e-SIC',
    'status': '📈 Por Status - e-SIC',
    'tipo-informacao': '📑 Tipo de Informação - e-SIC',
    'responsavel': '👤 Por Responsável - e-SIC',
    'unidade': '🏢 Por Unidade - e-SIC',
    'canal': '📞 Por Canal - e-SIC',
    'mensal': '📅 Análise Mensal - e-SIC'
  };
  
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.innerHTML = `<h1 class="neon text-3xl font-bold">${titles[pageId] || 'e-SIC'}</h1>`;
  }
  
  // Carregar loader da página
  currentPage = pageId;
  const loader = pageMap[pageId];
  
  if (loader && typeof loader === 'function') {
    loader().then(loadFn => {
      if (loadFn && typeof loadFn === 'function') {
        loadFn();
      }
    }).catch(err => {
      window.Logger?.error('Erro ao carregar página e-SIC:', err);
    });
  }
};

// Inicializar navegação
document.addEventListener('DOMContentLoaded', () => {
  // Adicionar event listeners aos nav items
  document.querySelectorAll('nav div[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page');
      if (pageId) {
        loadSection(pageId);
      }
    });
  });
  
  // Carregar página inicial
  loadSection('home');
});

