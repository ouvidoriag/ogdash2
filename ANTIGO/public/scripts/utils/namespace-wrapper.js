/**
 * Namespace Wrapper - Organiza módulos em window.Dashboard
 * Mantém compatibilidade com window.* existente
 * 
 * OTIMIZAÇÃO: Organiza namespace global para evitar poluição
 */

(function() {
  'use strict';
  
  // Criar namespace Dashboard se não existir
  if (!window.Dashboard) {
    window.Dashboard = {};
  }
  
  // Organizar módulos em namespaces lógicos
  window.Dashboard.Utils = window.Dashboard.Utils || {};
  window.Dashboard.Data = window.Dashboard.Data || {};
  window.Dashboard.Charts = window.Dashboard.Charts || {};
  window.Dashboard.Pages = window.Dashboard.Pages || {};
  window.Dashboard.Store = window.Dashboard.Store || {};
  
  // Mapear módulos existentes para namespace Dashboard
  // Mantém compatibilidade: ambos window.* e window.Dashboard.* funcionam
  
  // Utilitários
  if (window.pageUtils) {
    window.Dashboard.Utils.Pages = window.pageUtils;
  }
  if (window.chartHelpers) {
    window.Dashboard.Charts.Helpers = window.chartHelpers;
  }
  if (window.dataUtils) {
    window.Dashboard.Utils.Data = window.dataUtils;
  }
  if (window.utils) {
    window.Dashboard.Utils.General = window.utils;
  }
  
  // Data Store
  if (window.dataStore) {
    window.Dashboard.Store = window.dataStore;
  }
  
  // Chart Factory
  if (window.chartFactory) {
    window.Dashboard.Charts.Factory = window.chartFactory;
  }
  
  // Data Loader
  if (window.dataLoader) {
    window.Dashboard.Data.Loader = window.dataLoader;
  }
  
  // Páginas
  if (window.data) {
    window.Dashboard.Pages = window.data;
  }
  
  // Lazy Libraries
  if (window.lazyLibraries) {
    window.Dashboard.Utils.LazyLibraries = window.lazyLibraries;
  }
  
  // Legacy Loader
  if (window.legacyLoader) {
    window.Dashboard.Utils.LegacyLoader = window.legacyLoader;
  }
  
  // Config
  if (window.config) {
    window.Dashboard.Config = window.config;
  }
  
  // Logger
  if (window.Logger) {
    window.Dashboard.Utils.Logger = window.Logger;
  }
  
  // Log de inicialização
  if (window.Logger) {
    window.Logger.debug('✅ Namespace Dashboard organizado');
  } else {
    console.log('✅ Namespace Dashboard organizado');
  }
})();

