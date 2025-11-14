/**
 * Sistema de Diagnóstico Centralizado
 * Rastreia o carregamento de todos os componentes do dashboard
 */

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  // Estado global de diagnóstico
  window.diagnostic = {
    components: {},
    errors: [],
    startTime: Date.now(),
    
    /**
     * Registrar início de carregamento de componente
     */
    start(componentName) {
      if (!this.components[componentName]) {
        this.components[componentName] = {
          name: componentName,
          startTime: Date.now(),
          endTime: null,
          status: 'loading',
          error: null,
          elementFound: false,
          dataLoaded: false
        };
      } else {
        this.components[componentName].startTime = Date.now();
        this.components[componentName].status = 'loading';
      }
      
      this.log(`🟡 Iniciando: ${componentName}`);
    },
    
    /**
     * Registrar sucesso de componente
     */
    success(componentName, details = {}) {
      const component = this.components[componentName];
      if (!component) {
        this.start(componentName);
      }
      
      component.endTime = Date.now();
      component.status = 'success';
      component.duration = component.endTime - component.startTime;
      Object.assign(component, details);
      
      this.log(`✅ Sucesso: ${componentName} (${component.duration}ms)`, details);
    },
    
    /**
     * Registrar erro de componente
     */
    error(componentName, error, details = {}) {
      const component = this.components[componentName];
      if (!component) {
        this.start(componentName);
      }
      
      component.endTime = Date.now();
      component.status = 'error';
      component.duration = component.endTime - component.startTime;
      component.error = error?.message || String(error);
      Object.assign(component, details);
      
      this.errors.push({
        component: componentName,
        error: error?.message || String(error),
        timestamp: Date.now(),
        details
      });
      
      this.log(`❌ Erro: ${componentName}`, { error, ...details });
    },
    
    /**
     * Verificar se elemento existe no DOM
     */
    checkElement(elementId, componentName) {
      const element = document.getElementById(elementId);
      const exists = !!element;
      const visible = exists && element.offsetParent !== null;
      const hasSize = exists && element.offsetWidth > 0 && element.offsetHeight > 0;
      
      if (componentName && this.components[componentName]) {
        this.components[componentName].elementFound = exists;
        this.components[componentName].elementVisible = visible;
        this.components[componentName].elementHasSize = hasSize;
      }
      
      this.log(`🔍 Elemento ${elementId}:`, {
        exists,
        visible,
        hasSize,
        width: exists ? element.offsetWidth : 0,
        height: exists ? element.offsetHeight : 0,
        display: exists ? window.getComputedStyle(element).display : 'none'
      });
      
      return { exists, visible, hasSize, element };
    },
    
    /**
     * Log centralizado
     */
    log(message, data = null) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      
      if (window.Logger) {
        if (data) {
          window.Logger.debug(logMessage, data);
        } else {
          window.Logger.debug(logMessage);
        }
      } else {
        if (data) {
          console.log(logMessage, data);
        } else {
          console.log(logMessage);
        }
      }
    },
    
    /**
     * Gerar relatório completo
     */
    getReport() {
      const totalTime = Date.now() - this.startTime;
      const components = Object.values(this.components);
      const successCount = components.filter(c => c.status === 'success').length;
      const errorCount = components.filter(c => c.status === 'error').length;
      const loadingCount = components.filter(c => c.status === 'loading').length;
      
      return {
        totalTime,
        summary: {
          total: components.length,
          success: successCount,
          error: errorCount,
          loading: loadingCount
        },
        components,
        errors: this.errors
      };
    },
    
    /**
     * Exibir relatório no console
     */
    showReport() {
      const report = this.getReport();
      
      console.group('📊 Relatório de Diagnóstico');
      console.log(`⏱️ Tempo total: ${report.totalTime}ms`);
      console.log(`✅ Sucessos: ${report.summary.success}`);
      console.log(`❌ Erros: ${report.summary.error}`);
      console.log(`🟡 Carregando: ${report.summary.loading}`);
      console.groupEnd();
      
      if (report.errors.length > 0) {
        console.group('❌ Erros encontrados');
        report.errors.forEach(err => {
          console.error(`[${err.component}]`, err.error, err.details);
        });
        console.groupEnd();
      }
      
      console.group('📋 Componentes');
      report.components.forEach(comp => {
        const icon = comp.status === 'success' ? '✅' : comp.status === 'error' ? '❌' : '🟡';
        console.log(`${icon} ${comp.name}`, {
          status: comp.status,
          duration: comp.duration ? `${comp.duration}ms` : 'N/A',
          elementFound: comp.elementFound,
          error: comp.error
        });
      });
      console.groupEnd();
      
      return report;
    }
  };
  
  // Expor globalmente
  if (window.Logger) {
    window.Logger.debug('✅ Sistema de diagnóstico inicializado');
  } else {
    console.log('✅ Sistema de diagnóstico inicializado');
  }
  
  // Auto-relatório após 10 segundos (opcional)
  setTimeout(() => {
    if (window.diagnostic) {
      window.diagnostic.showReport();
    }
  }, 10000);
})();

