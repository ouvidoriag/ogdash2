/**
 * Middleware de Autenticação
 * Protege rotas que requerem autenticação
 */

/**
 * Middleware para verificar se o usuário está autenticado
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // Verificar se é uma requisição de API
  // req.originalUrl contém o caminho completo, req.path pode não ter o prefixo do router
  const originalUrl = req.originalUrl || req.url || '';
  const path = req.path || '';
  const baseUrl = req.baseUrl || '';
  
  // Verificar se é requisição de API (pode estar em /api/* ou já estar dentro do router montado em /api)
  const isApiRequest = 
    originalUrl.startsWith('/api/') || 
    baseUrl.startsWith('/api/') ||
    path.startsWith('/api/') ||
    req.get('Accept')?.includes('application/json') ||
    req.xhr || // Requisições AJAX
    (req.method !== 'GET' && originalUrl.includes('/api/')); // POST/PUT/DELETE para API
  
  // Se for uma requisição de API, retornar JSON
  if (isApiRequest) {
    return res.status(401).json({ 
      success: false, 
      message: 'Autenticação necessária' 
    });
  }
  
  // Caso contrário, redirecionar para login (página raiz)
  res.redirect('/');
}

/**
 * Middleware opcional - adiciona informações do usuário se autenticado
 */
export function optionalAuth(req, res, next) {
  // Apenas passa adiante, não bloqueia
  next();
}

