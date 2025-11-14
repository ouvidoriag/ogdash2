/**
 * Service Worker
 * DESABILITADO: Cache removido - sempre buscar da rede
 */

const CACHE_NAME = 'ouvidoria-dashboard-v1';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Removendo cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições - sempre buscar da rede (sem cache)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET ou que são de outros domínios
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições de extensões ou outros protocolos
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503 });
    })
  );
});

// Tratar mensagens para evitar erro de canal fechado
// CORREÇÃO: Ignorar TODAS as mensagens de extensões e responder apenas se necessário
self.addEventListener('message', (event) => {
  // CORREÇÃO: Ignorar completamente mensagens sem data ou de extensões
  if (!event.data) {
    return; // Ignorar silenciosamente
  }
  
  // Ignorar mensagens que não são objetos (strings, números, etc)
  if (typeof event.data !== 'object') {
    return; // Ignorar silenciosamente
  }
  
  // Ignorar mensagens que não têm o tipo esperado
  if (!event.data.type) {
    return; // Ignorar silenciosamente (extensões do Chrome)
  }
  
  // Processar apenas mensagens conhecidas do nosso código
  if (['SKIP_WAITING', 'CACHE_CLEAR'].includes(event.data.type)) {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    
    // Responder apenas se há porta disponível E está aberta
    if (event.ports && event.ports.length > 0) {
      try {
        // Verificar se a porta ainda está aberta antes de responder
        event.ports[0].postMessage({ success: true });
      } catch (e) {
        // Ignorar erro silenciosamente - porta já está fechada
      }
    }
  }
  // Para todas as outras mensagens, não responder (evita erro de canal fechado)
});
