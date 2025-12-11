/**
 * Auto-Connect Pages - Sistema Automático de Conexão de Páginas
 *
 * REFATORAÇÃO: Extraído de chart-communication.js
 * MIGRAÇÃO: Migrado para TypeScript
 * Data: 03/12/2025
 * CÉREBRO X-3
 *
 * Responsabilidade: Conectar automaticamente todas as páginas ao sistema de filtros
 */
/// <reference path="./global.d.ts" />
(function () {
    'use strict';
    // REFATORAÇÃO FASE 3: Usar APENAS window.eventBus global (único event bus)
    // event-bus.js é carregado antes deste módulo no HTML
    if (!window.eventBus) {
        if (window.Logger) {
            window.Logger.error('eventBus global não encontrado. Verifique se event-bus.js está carregado antes de auto-connect.js');
        }
        // Fallback apenas para desenvolvimento - não deve acontecer em produção
        throw new Error('eventBus global não encontrado. Carregue event-bus.js antes de auto-connect.js');
    }
    const eventBus = window.eventBus;
    // ============================================
    // PAGE FILTER LISTENER - Utilitário para páginas
    // ============================================
    function createPageFilterListener(pageId, reloadFunction, debounceMs = 500) {
        return () => { };
    }
    // ============================================
    // AUTO-CONNECT PAGES - Sistema Automático de Conexão
    // ============================================
    function autoConnectAllPages() {
        return;
    }
    // Exportar para uso global
    if (typeof window !== 'undefined') {
        window.createPageFilterListener = createPageFilterListener;
        window.autoConnectAllPages = autoConnectAllPages;
    }
    // Exportar para módulos ES6 (se disponível)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createPageFilterListener, autoConnectAllPages };
    }
})();
