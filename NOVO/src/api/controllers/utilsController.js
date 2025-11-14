/**
 * Controllers de Utilitários
 * Meta, Export, Reindex
 */

import { safeQuery } from '../../utils/responseHelper.js';

/**
 * GET /api/meta/aliases
 * Metadados e aliases de campos
 */
export async function getMetaAliases(req, res, prisma) {
  return safeQuery(res, async () => {
    return {
      aliases: {
        Secretaria: ['Secretaria', 'Órgão', 'Orgao', 'Secretaria/Órgão'],
        Setor: ['Setor', 'Departamento', 'Unidade'],
        Tipo: ['Tipo', 'Tipo Manifestação', 'TipoManifestacao'],
        Categoria: ['Categoria', 'Assunto', 'Tema'],
        Bairro: ['Bairro', 'Localidade'],
        Status: ['Status', 'Situação', 'Situacao'],
        Data: ['Data', 'Data Abertura', 'DataAbertura', 'Abertura'],
        UAC: ['UAC', 'Unidade de Atendimento', 'Unidade de Atendimento ao Cidadão', 'unidade_cadastro', 'Unidade Cadastro', 'unidadeCadastro'],
        Responsavel: ['Responsável', 'responsavel', 'Ouvidoria Responsável', 'Responsável pelo Tratamento', 'Ouvidoria'],
        Canal: ['Canal', 'canal', 'Canal de Entrada', 'Canal de Atendimento'],
        Prioridade: ['Prioridade', 'prioridade', 'Prioridade da Demanda']
      }
    };
  });
}

/**
 * POST /api/chat/reindex
 * Reindexar contexto do chat
 */
export async function reindexChat(req, res, prisma) {
  return safeQuery(res, async () => {
    // TODO: Implementar reindexação de contexto
    // Por enquanto, retornar sucesso
    return {
      ok: true,
      message: 'Reindexação não implementada ainda',
      indexed: 0,
      lastIndexedAt: null
    };
  });
}

/**
 * GET /api/export/database
 * Exportar banco de dados
 */
export async function exportDatabase(req, res, prisma) {
  return safeQuery(res, async () => {
    // TODO: Implementar exportação completa
    // Por enquanto, retornar estrutura básica
    const total = await prisma.record.count();
    
    return {
      ok: true,
      message: 'Exportação não implementada ainda',
      total,
      exportadoEm: new Date().toISOString()
    };
  });
}

