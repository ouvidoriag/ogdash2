/**
 * Helper para integração com IA
 */

// Sistema de rotação de chaves da API
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : []).concat(
  process.env.GEMINI_API_KEY_2 ? [process.env.GEMINI_API_KEY_2] : []
).filter(k => k && k.trim());

let currentKeyIndex = 0;

/**
 * Obtém a chave atual da IA
 */
export function getCurrentGeminiKey() {
  return GEMINI_API_KEYS[currentKeyIndex] || '';
}

/**
 * Rotaciona para a próxima chave
 */
export function rotateToNextKey() {
  if (GEMINI_API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    console.log(`🔄 Rotacionando para chave ${currentKeyIndex + 1}/${GEMINI_API_KEYS.length}`);
  }
}

/**
 * Volta para a primeira chave
 */
export function resetToFirstKey() {
  if (currentKeyIndex !== 0) {
    currentKeyIndex = 0;
    console.log(`🔄 Voltando para primeira chave`);
  }
}

/**
 * Verifica se há chaves configuradas
 */
export function hasGeminiKeys() {
  return GEMINI_API_KEYS.length > 0;
}

/**
 * Inicializa o sistema de chaves
 */
export function initializeGemini() {
  if (GEMINI_API_KEYS.length > 0) {
    console.log(`🤖 ${GEMINI_API_KEYS.length} chave(s) de IA configurada(s)`);
    GEMINI_API_KEYS.forEach((key, idx) => {
      console.log(`   Chave ${idx + 1}: ${key.substring(0, 15)}... (${key.length} caracteres)`);
    });
  } else {
    // Não mencionar modelo quando IA está desativada
    // console.warn removido para não expor qual modelo seria usado
  }
}

