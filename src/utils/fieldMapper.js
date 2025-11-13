/**
 * Mapeamento Global de Campos
 * Centraliza o mapeamento de campos para evitar duplicação
 * Usado por todos os endpoints de agregação
 */

/**
 * Mapeamento de campos da API para colunas normalizadas do banco
 */
export const FIELD_MAP = {
  // Campos principais
  'Status': 'status',
  'Tipo': 'tipoDeManifestacao',
  'Tema': 'tema',
  'Categoria': 'tema',
  'Assunto': 'assunto',
  'Secretaria': 'orgaos',
  'Orgaos': 'orgaos',
  'UnidadeCadastro': 'unidadeCadastro',
  'Setor': 'unidadeCadastro',
  'Bairro': 'endereco',
  'Canal': 'canal',
  'Prioridade': 'prioridade',
  'Responsavel': 'responsavel',
  'Servidor': 'servidor',
  'UAC': 'unidadeCadastro',
  'StatusDemanda': 'statusDemanda',
  'Data': 'dataDaCriacao',
  
  // Aliases para compatibilidade
  'TipoManifestacao': 'tipoDeManifestacao',
  
  // Nomes exatos da planilha (snake_case)
  'protocolo': 'protocolo',
  'data_da_criacao': 'dataDaCriacao',
  'status_demanda': 'statusDemanda',
  'prazo_restante': 'prazoRestante',
  'data_da_conclusao': 'dataDaConclusao',
  'tempo_de_resolucao_em_dias': 'tempoDeResolucaoEmDias',
  'prioridade': 'prioridade',
  'tipo_de_manifestacao': 'tipoDeManifestacao',
  'tema': 'tema',
  'assunto': 'assunto',
  'canal': 'canal',
  'endereco': 'endereco',
  'unidade_cadastro': 'unidadeCadastro',
  'unidade_saude': 'unidadeSaude',
  'status': 'status',
  'servidor': 'servidor',
  'responsavel': 'responsavel',
  'verificado': 'verificado',
  'orgaos': 'orgaos'
};

/**
 * Obter coluna normalizada do banco para um campo da API
 */
export function getNormalizedField(field) {
  if (!field) return null;
  
  const normalized = FIELD_MAP[field] || 
                     FIELD_MAP[field.toLowerCase()] ||
                     field.toLowerCase();
  
  return normalized;
}

/**
 * Verificar se um campo está normalizado no banco
 */
export function isNormalizedField(field) {
  const normalized = getNormalizedField(field);
  // Lista de campos que existem no schema do Prisma
  const prismaFields = [
    'protocolo', 'dataDaCriacao', 'statusDemanda', 'prazoRestante',
    'dataDaConclusao', 'tempoDeResolucaoEmDias', 'prioridade',
    'tipoDeManifestacao', 'tema', 'assunto', 'canal', 'endereco',
    'unidadeCadastro', 'unidadeSaude', 'status', 'servidor',
    'responsavel', 'verificado', 'orgaos', 'dataCriacaoIso', 'dataConclusaoIso'
  ];
  
  return prismaFields.includes(normalized);
}

