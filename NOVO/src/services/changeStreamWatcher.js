/**
 * ChangeStream Watcher
 * 
 * Monitora mudanças no banco de dados e invalida caches automaticamente
 * Sistema reativo que mantém dados sempre frescos
 * 
 * Funcionalidades:
 * - Monitora mudanças em Records
 * - Invalida caches baseado no tipo de mudança
 * - Invalidação seletiva (não invalida tudo)
 * - Logs de invalidação
 */

import { invalidateCachePattern, generateCacheKey } from '../utils/smartCache.js';

/**
 * Mapeamento de campos para padrões de cache a invalidar
 */
const FIELD_CACHE_PATTERNS = {
  'status': ['status*', 'overview*', 'statusOverview*'],
  'tema': ['tema*', 'overview*', 'byTheme*'],
  'assunto': ['assunto*', 'overview*', 'bySubject*'],
  'orgaos': ['orgaoMes*', 'overview*', 'orgaos*'],
  'categoria': ['categoria*', 'overview*'],
  'bairro': ['bairro*', 'overview*'],
  'servidor': ['*servidor*', 'overview*'],
  'unidadeCadastro': ['*uac*', 'overview*'],
  'tipoDeManifestacao': ['overview*', 'tipo*'],
  'canal': ['overview*', 'canal*'],
  'prioridade': ['overview*', 'prioridade*']
};

/**
 * Campos que quando mudam, invalidam overview completo
 */
const OVERVIEW_FIELDS = [
  'status', 'tema', 'assunto', 'orgaos', 'categoria', 'bairro',
  'tipoDeManifestacao', 'canal', 'prioridade', 'servidor', 'unidadeCadastro'
];

/**
 * Iniciar watcher de ChangeStream
 * @param {PrismaClient} prisma - Cliente Prisma
 * @param {Function} getMongoClient - Função para obter cliente MongoDB
 */
export async function startChangeStreamWatcher(prisma, getMongoClient) {
  try {
    const client = await getMongoClient();
    const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'dashboard';
    const db = client.db(dbName);
    const collection = db.collection('records');
    
    console.log('👁️ Iniciando ChangeStream Watcher...');
    
    // Criar ChangeStream
    const changeStream = collection.watch(
      [
        { $match: { 'operationType': { $in: ['insert', 'update', 'replace', 'delete'] } } }
      ],
      {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable'
      }
    );
    
    // Processar mudanças
    changeStream.on('change', async (change) => {
      try {
        await handleChange(change, prisma);
      } catch (error) {
        console.error('❌ Erro ao processar mudança:', error);
      }
    });
    
    // Tratar erros
    changeStream.on('error', (error) => {
      console.error('❌ Erro no ChangeStream:', error);
      // Tentar reiniciar após 5 segundos
      setTimeout(() => {
        console.log('🔄 Tentando reiniciar ChangeStream...');
        startChangeStreamWatcher(prisma, getMongoClient).catch(err => {
          console.error('❌ Erro ao reiniciar ChangeStream:', err);
        });
      }, 5000);
    });
    
    // Log de inicialização
    changeStream.on('ready', () => {
      console.log('✅ ChangeStream Watcher ativo e monitorando mudanças');
    });
    
    return changeStream;
  } catch (error) {
    console.error('❌ Erro ao iniciar ChangeStream Watcher:', error);
    throw error;
  }
}

/**
 * Processar uma mudança do ChangeStream
 */
async function handleChange(change, prisma) {
  const { operationType, fullDocument, documentKey, updateDescription } = change;
  
  // Determinar campos que mudaram
  const changedFields = getChangedFields(operationType, fullDocument, updateDescription);
  
  if (changedFields.length === 0) {
    return; // Nenhum campo relevante mudou
  }
  
  // Invalidar caches baseado nos campos que mudaram
  const patternsToInvalidate = new Set();
  
  for (const field of changedFields) {
    // Adicionar padrões específicos do campo
    if (FIELD_CACHE_PATTERNS[field]) {
      FIELD_CACHE_PATTERNS[field].forEach(pattern => {
        patternsToInvalidate.add(pattern);
      });
    }
    
    // Se campo afeta overview, invalidar overview
    if (OVERVIEW_FIELDS.includes(field)) {
      patternsToInvalidate.add('overview*');
      patternsToInvalidate.add('dashboard*');
    }
  }
  
  // Invalidar caches
  let totalInvalidated = 0;
  for (const pattern of patternsToInvalidate) {
    const invalidated = await invalidateCachePattern(prisma, pattern);
    totalInvalidated += invalidated;
  }
  
  // Log apenas se invalidação ocorreu
  if (totalInvalidated > 0) {
    console.log(`🔄 Cache invalidado: ${totalInvalidated} entradas (${operationType}: ${changedFields.join(', ')})`);
  }
}

/**
 * Determinar quais campos mudaram
 */
function getChangedFields(operationType, fullDocument, updateDescription) {
  const changedFields = [];
  
  if (operationType === 'insert' || operationType === 'replace') {
    // Documento novo ou substituído - todos os campos relevantes
    if (fullDocument) {
      OVERVIEW_FIELDS.forEach(field => {
        if (fullDocument[field] !== undefined && fullDocument[field] !== null) {
          changedFields.push(field);
        }
      });
    }
  } else if (operationType === 'update' && updateDescription) {
    // Apenas campos atualizados
    const updatedFields = updateDescription.updatedFields || {};
    const removedFields = updateDescription.removedFields || [];
    
    // Campos atualizados
    Object.keys(updatedFields).forEach(field => {
      // Remover prefixos de operadores MongoDB (ex: $set.status -> status)
      const cleanField = field.replace(/^\$set\./, '').replace(/^\$unset\./, '');
      if (OVERVIEW_FIELDS.includes(cleanField)) {
        changedFields.push(cleanField);
      }
    });
    
    // Campos removidos
    removedFields.forEach(field => {
      const cleanField = field.replace(/^\$set\./, '').replace(/^\$unset\./, '');
      if (OVERVIEW_FIELDS.includes(cleanField)) {
        changedFields.push(cleanField);
      }
    });
  } else if (operationType === 'delete') {
    // Documento deletado - invalidar tudo relacionado
    OVERVIEW_FIELDS.forEach(field => changedFields.push(field));
  }
  
  // Remover duplicatas
  return [...new Set(changedFields)];
}

/**
 * Parar watcher de ChangeStream
 * @param {ChangeStream} changeStream - Stream a ser parado
 */
export async function stopChangeStreamWatcher(changeStream) {
  if (changeStream) {
    try {
      await changeStream.close();
      console.log('🛑 ChangeStream Watcher parado');
    } catch (error) {
      console.error('❌ Erro ao parar ChangeStream:', error);
    }
  }
}

