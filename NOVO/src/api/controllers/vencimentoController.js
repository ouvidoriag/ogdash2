/**
 * Controller de Vencimento
 * /api/vencimento
 * Busca protocolos próximos de vencer ou já vencidos
 */

import { withCache } from '../../utils/responseHelper.js';
import { getDataCriacao, isConcluido } from '../../utils/dateUtils.js';

/**
 * Determina o prazo baseado no tipo de manifestação
 * @param {string} tipoDeManifestacao - Tipo de manifestação
 * @returns {number} - Prazo em dias (30 para Ouvidoria, 20 para SIC)
 */
function getPrazoPorTipo(tipoDeManifestacao) {
  if (!tipoDeManifestacao) return 30; // Default: 30 dias
  
  const tipo = String(tipoDeManifestacao).toLowerCase().trim();
  
  // SIC (Serviço de Informação ao Cidadão) - 20 dias
  if (tipo.includes('sic') || 
      tipo.includes('pedido de informação') || 
      tipo.includes('pedido de informacao') ||
      tipo.includes('informação') ||
      tipo.includes('informacao')) {
    return 20;
  }
  
  // Ouvidoria (reclamação, sugestão, denúncia, elogio) - 30 dias
  // Qualquer outro tipo também usa 30 dias como padrão
  return 30;
}

/**
 * Calcula a data de vencimento baseado na data de criação e tipo
 * @param {string} dataCriacao - Data de criação em formato YYYY-MM-DD
 * @param {string} tipoDeManifestacao - Tipo de manifestação
 * @returns {string|null} - Data de vencimento em formato YYYY-MM-DD ou null
 */
function calcularDataVencimento(dataCriacao, tipoDeManifestacao) {
  if (!dataCriacao) return null;
  
  const prazo = getPrazoPorTipo(tipoDeManifestacao);
  return calcularDataVencimentoComPrazo(dataCriacao, prazo);
}

/**
 * Calcula a data de vencimento baseado na data de criação e prazo em dias
 * @param {string} dataCriacao - Data de criação em formato YYYY-MM-DD
 * @param {number} prazo - Prazo em dias
 * @returns {string|null} - Data de vencimento em formato YYYY-MM-DD ou null
 */
function calcularDataVencimentoComPrazo(dataCriacao, prazo) {
  if (!dataCriacao) return null;
  
  const data = new Date(dataCriacao + 'T00:00:00');
  
  if (isNaN(data.getTime())) return null;
  
  // Adicionar prazo em dias
  data.setDate(data.getDate() + prazo);
  
  return data.toISOString().slice(0, 10);
}

/**
 * Calcula dias restantes até o vencimento
 * @param {string} dataVencimento - Data de vencimento em formato YYYY-MM-DD
 * @param {Date} hoje - Data de referência (hoje)
 * @returns {number|null} - Dias restantes (negativo se vencido) ou null
 */
function calcularDiasRestantes(dataVencimento, hoje) {
  if (!dataVencimento) return null;
  
  const vencimento = new Date(dataVencimento + 'T00:00:00');
  if (isNaN(vencimento.getTime())) return null;
  
  const diff = vencimento - hoje;
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return dias;
}

/**
 * GET /api/vencimento
 * Busca protocolos próximos de vencer ou já vencidos
 * Query params:
 *   - filtro: 'vencidos' | '3' | '7' | '15' | '30' | número customizado (dias)
 *   - mes: YYYY-MM (filtro por mês de criação)
 *   - secretaria: filtro por secretaria/órgão
 *   - servidor: filtro opcional
 *   - unidadeCadastro: filtro opcional
 *   - prazo: número customizado de dias para o prazo (sobrescreve o padrão)
 */
export async function getVencimento(req, res, prisma) {
  const filtro = req.query.filtro || 'vencidos'; // Default: vencidos
  const servidor = req.query.servidor;
  const unidadeCadastro = req.query.unidadeCadastro;
  const mes = req.query.mes; // Filtro por mês (YYYY-MM)
  const secretaria = req.query.secretaria; // Filtro por secretaria
  const prazoCustomizado = req.query.prazo ? parseInt(req.query.prazo) : null; // Prazo customizado em dias
  
  // Debug: log dos parâmetros recebidos
  console.log('⏰ /api/vencimento - Parâmetros recebidos:', {
    filtro,
    mes,
    secretaria,
    servidor,
    unidadeCadastro,
    prazoCustomizado
  });
  
  const key = `vencimento:${filtro}:${mes || ''}:${prazoCustomizado || ''}:${servidor || ''}:${unidadeCadastro || ''}:${secretaria || ''}:v3`;
  
  // Cache de 5 minutos
  return withCache(key, 300, res, async () => {
    const where = {};
    if (servidor) where.servidor = servidor;
    if (unidadeCadastro) where.unidadeCadastro = unidadeCadastro;
    
    // Inicializar where.AND se necessário
    if (!where.AND) {
      where.AND = [];
    }
    
    // NOTA: Filtro de secretaria será aplicado em memória após buscar os registros
    // para garantir case-insensitive e correspondência parcial correta
    const secretariaFiltro = secretaria && secretaria.trim() !== '' ? secretaria.trim() : null;
    if (secretariaFiltro) {
      console.log('⏰ Filtro de secretaria será aplicado em memória:', secretariaFiltro);
    }
    
    // Filtrar por mês se fornecido
    if (mes && mes.trim() !== '' && mes !== 'todos' && /^\d{4}-\d{2}$/.test(mes.trim())) {
      const mesTrimmed = mes.trim();
      // Usar múltiplas estratégias para garantir que funcione com diferentes formatos de data
      where.AND.push({
        OR: [
          // Para dataCriacaoIso (formato ISO: YYYY-MM-DD)
          { dataCriacaoIso: { startsWith: mesTrimmed } },
          // Para dataDaCriacao (pode ter vários formatos)
          { dataDaCriacao: { startsWith: mesTrimmed } },
          // Também verificar se contém o mês (para formatos como DD/MM/YYYY ou outros)
          { dataDaCriacao: { contains: `-${mesTrimmed.substring(5)}-` } }, // Contém -MM-
          { dataDaCriacao: { contains: mesTrimmed } } // Contém YYYY-MM
        ]
      });
      console.log('⏰ Filtro de mês aplicado:', mesTrimmed);
      console.log('⏰ Where clause após adicionar filtro de mês:', JSON.stringify(where, null, 2));
    } else if (mes && mes.trim() !== '') {
      console.log('⏰ AVISO: Mês fornecido mas formato inválido:', mes);
    }
    
    // Filtrar apenas registros com data de criação (necessário para calcular vencimento)
    // A verificação de se está concluído será feita pela função isConcluido() no loop
    // para garantir consistência com o resto do sistema
    where.AND.push({
      OR: [
        { dataCriacaoIso: { not: null } },
        { dataDaCriacao: { not: null } }
      ]
    });
    
    // Remover where.AND se estiver vazio (Prisma não aceita array vazio)
    if (where.AND && where.AND.length === 0) {
      delete where.AND;
    }
    
    // Debug: log do where clause
    console.log('⏰ Where clause:', JSON.stringify(where, null, 2));
    
    // Buscar TODOS os registros (sem limite)
    const rows = await prisma.record.findMany({
      where,
      select: {
        id: true,
        protocolo: true,
        dataCriacaoIso: true,
        dataDaCriacao: true,
        tipoDeManifestacao: true,
        tema: true,
        assunto: true,
        orgaos: true,
        unidadeCadastro: true,
        status: true,
        statusDemanda: true,
        responsavel: true,
        data: true
      }
      // REMOVIDO: take: 10000 - Agora busca TODOS os registros
    });
    
    console.log(`⏰ Registros encontrados no banco (antes dos filtros em memória): ${rows.length}`);
    
    // Aplicar filtros em memória na ordem correta
    let rowsFiltrados = rows;
    
    // 1. Primeiro aplicar filtro de mês em memória (como fallback caso o filtro do banco não funcione)
    const mesFiltro = mes && mes.trim() !== '' && mes !== 'todos' && /^\d{4}-\d{2}$/.test(mes.trim()) ? mes.trim() : null;
    if (mesFiltro) {
      const antesFiltroMes = rowsFiltrados.length;
      rowsFiltrados = rowsFiltrados.filter(row => {
        const dataCriacao = getDataCriacao(row);
        if (!dataCriacao) return false;
        // Extrair mês da data (YYYY-MM-DD ou outros formatos)
        const mesData = dataCriacao.substring(0, 7); // YYYY-MM
        return mesData === mesFiltro;
      });
      console.log(`⏰ Filtro de mês em memória: ${antesFiltroMes} -> ${rowsFiltrados.length} registros (mês: ${mesFiltro})`);
      
      // Log de alguns exemplos de datas para debug
      if (rowsFiltrados.length > 0) {
        const exemplosDatas = rowsFiltrados.slice(0, 5).map(r => {
          const dataCriacao = getDataCriacao(r);
          return {
            dataCriacaoIso: r.dataCriacaoIso,
            dataDaCriacao: r.dataDaCriacao,
            dataCriacaoNormalizada: dataCriacao,
            mesExtraido: dataCriacao ? dataCriacao.substring(0, 7) : null
          };
        });
        console.log('⏰ Exemplos de datas dos registros após filtro de mês:', exemplosDatas);
      } else if (rows.length > 0) {
        // Se não encontrou nada, mostrar exemplos do que existe no banco
        const exemplosDatas = rows.slice(0, 10).map(r => {
          const dataCriacao = getDataCriacao(r);
          return {
            dataCriacaoIso: r.dataCriacaoIso,
            dataDaCriacao: r.dataDaCriacao,
            dataCriacaoNormalizada: dataCriacao,
            mesExtraido: dataCriacao ? dataCriacao.substring(0, 7) : null
          };
        });
        console.log('⏰ Exemplos de datas dos registros antes do filtro de mês (para debug):', exemplosDatas);
      }
    }
    
    // 2. Depois aplicar filtro de secretaria em memória (case-insensitive)
    // 2. Depois aplicar filtro de secretaria em memória (case-insensitive)
    if (secretariaFiltro) {
      const secretariaLower = secretariaFiltro.toLowerCase();
      console.log(`⏰ Aplicando filtro de secretaria em memória: "${secretariaFiltro}" (lowercase: "${secretariaLower}")`);
      console.log(`⏰ Total de registros antes do filtro de secretaria: ${rowsFiltrados.length}`);
      
      rowsFiltrados = rowsFiltrados.filter(row => {
        const orgaos = (row.orgaos || '').toLowerCase();
        // Também verificar se o campo pode ter múltiplos valores separados por " | "
        const orgaosArray = orgaos.split(' | ').map(o => o.trim());
        const match = orgaos.includes(secretariaLower) || 
                     orgaosArray.some(o => o.includes(secretariaLower));
        return match;
      });
      
      console.log(`⏰ Registros após filtro de secretaria "${secretariaFiltro}": ${rowsFiltrados.length}`);
      
      // Log de alguns exemplos de orgaos encontrados para debug
      if (rowsFiltrados.length > 0) {
        const exemplosOrgaos = [...new Set(rowsFiltrados.slice(0, 5).map(r => r.orgaos).filter(Boolean))];
        console.log('⏰ Exemplos de orgaos encontrados:', exemplosOrgaos);
      } else if (rows.length > 0) {
        // Se não encontrou nada, mostrar exemplos do que existe no banco
        const exemplosOrgaos = [...new Set(rows.slice(0, 20).map(r => r.orgaos).filter(Boolean))];
        console.log('⏰ Exemplos de orgaos no banco (para debug):', exemplosOrgaos);
        console.log('⏰ Procurando por:', secretariaFiltro);
        console.log('⏰ Procurando por (lowercase):', secretariaLower);
        
        // Verificar se há correspondências parciais
        const matchesParciais = rows.filter(row => {
          const orgaos = (row.orgaos || '').toLowerCase();
          return orgaos.includes(secretariaLower.substring(0, 10)) || 
                 secretariaLower.includes(orgaos.substring(0, 10));
        });
        if (matchesParciais.length > 0) {
          console.log(`⏰ Encontrados ${matchesParciais.length} registros com correspondência parcial`);
          const exemplosParciais = [...new Set(matchesParciais.slice(0, 5).map(r => r.orgaos).filter(Boolean))];
          console.log('⏰ Exemplos de correspondências parciais:', exemplosParciais);
        }
      }
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Processar registros e calcular vencimentos
    const protocolos = [];
    
    for (const row of rowsFiltrados) {
      // Verificar se está concluído (usar função global)
      if (isConcluido(row)) {
        continue; // Pular concluídos
      }
      
      // Obter data de criação
      const dataCriacao = getDataCriacao(row);
      if (!dataCriacao) continue;
      
      // Calcular data de vencimento
      const tipo = row.tipoDeManifestacao || 
                   (row.data && typeof row.data === 'object' ? row.data.tipo_de_manifestacao : null) ||
                   '';
      
      // Usar prazo customizado se fornecido, senão usar o padrão por tipo
      const prazo = prazoCustomizado || getPrazoPorTipo(tipo);
      const dataVencimento = calcularDataVencimentoComPrazo(dataCriacao, prazo);
      if (!dataVencimento) continue;
      
      // Calcular dias restantes
      const diasRestantes = calcularDiasRestantes(dataVencimento, hoje);
      if (diasRestantes === null) continue;
      
      // Aplicar filtro
      let incluir = false;
      
      if (filtro === 'vencidos') {
        incluir = diasRestantes < 0; // Vencidos
      } else {
        const diasFiltro = parseInt(filtro);
        if (!isNaN(diasFiltro)) {
          // Próximos de vencer em X dias
          incluir = diasRestantes >= 0 && diasRestantes <= diasFiltro;
        }
      }
      
      if (!incluir) continue;
      
      // Extrair informações
      const protocolo = row.protocolo || 
                        (row.data && typeof row.data === 'object' ? row.data.protocolo : null) ||
                        'N/A';
      
      const setor = row.unidadeCadastro || 
                    (row.data && typeof row.data === 'object' ? row.data.unidade_cadastro : null) ||
                    'N/A';
      
      const secretaria = row.orgaos || 
                        (row.data && typeof row.data === 'object' ? row.data.orgaos : null) ||
                        'N/A';
      
      const tipoManifestacao = row.tipoDeManifestacao || 
                              (row.data && typeof row.data === 'object' ? row.data.tipo_de_manifestacao : null) ||
                              'N/A';
      
      const assunto = row.assunto || 
                     (row.data && typeof row.data === 'object' ? row.data.assunto : null) ||
                     '';
      
      const tema = row.tema || 
                   (row.data && typeof row.data === 'object' ? row.data.tema : null) ||
                   '';
      
      const oQueE = assunto || tema || tipoManifestacao || 'N/A';
      
      protocolos.push({
        protocolo,
        setor,
        secretaria,
        oQueE,
        tipoManifestacao,
        dataCriacao,
        dataVencimento,
        diasRestantes,
        prazo: prazoCustomizado || getPrazoPorTipo(tipo)
      });
    }
    
    // Ordenar por dias restantes (mais urgentes primeiro)
    protocolos.sort((a, b) => {
      // Vencidos primeiro (negativos)
      if (a.diasRestantes < 0 && b.diasRestantes >= 0) return -1;
      if (a.diasRestantes >= 0 && b.diasRestantes < 0) return 1;
      // Dentro de cada grupo, ordenar por dias restantes (menor primeiro)
      return a.diasRestantes - b.diasRestantes;
    });
    
    return {
      total: protocolos.length,
      filtro,
      protocolos
    };
  }, prisma);
}

