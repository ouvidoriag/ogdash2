/**
 * Controllers Geográficos
 * Secretarias, Distritos, Bairros, Unidades de Saúde, Saúde
 */

import { safeQuery } from '../../utils/responseHelper.js';
import { withCache } from '../../utils/responseHelper.js';
import { detectDistrictByAddress, mapAddressesToDistricts, getMappingStats } from '../../utils/districtMapper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// projectRoot deve apontar para a pasta NOVO (mesmo que o server.js)
// __dirname = NOVO/src/api/controllers, então precisamos subir 3 níveis para chegar em NOVO
const projectRoot = path.join(__dirname, '../../..');

/**
 * Carrega dados de secretarias e distritos
 */
function loadSecretariasDistritos() {
  try {
    // Tentar múltiplos caminhos possíveis
    // projectRoot = NOVO (mesmo que server.js)
    const possiblePaths = [
      path.join(projectRoot, 'data', 'secretarias-distritos.json'), // NOVO/data/...
      path.join(__dirname, '../../data', 'secretarias-distritos.json'), // Relativo ao controller
      path.join(process.cwd(), 'data', 'secretarias-distritos.json'), // Onde o processo está rodando
      path.join(process.cwd(), 'NOVO', 'data', 'secretarias-distritos.json'), // Se rodando da raiz
      path.join(__dirname, '../../../../data', 'secretarias-distritos.json'), // Fallback
      path.join(__dirname, '../../../../NOVO/data', 'secretarias-distritos.json') // Fallback
    ];
    
    console.log('🔍 loadSecretariasDistritos: Procurando arquivo...');
    console.log(`   projectRoot: ${projectRoot}`);
    console.log(`   __dirname: ${__dirname}`);
    console.log(`   process.cwd(): ${process.cwd()}`);
    
    let dataPath = null;
    for (const possiblePath of possiblePaths) {
      const exists = fs.existsSync(possiblePath);
      console.log(`   ${exists ? '✅' : '❌'} ${possiblePath}`);
      if (exists) {
        dataPath = possiblePath;
        break;
      }
    }
    
    if (!dataPath) {
      console.error('❌ Arquivo secretarias-distritos.json não encontrado em nenhum dos caminhos!');
      console.error('   Caminhos tentados:', possiblePaths);
      return { secretarias: [], distritos: {}, estatisticas: {} };
    }
    
    console.log(`📂 Arquivo encontrado: ${dataPath}`);
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Validar estrutura
    if (!data || typeof data !== 'object') {
      console.error('❌ Dados inválidos: não é um objeto');
      return { secretarias: [], distritos: {}, estatisticas: {} };
    }
    
    const distritosCount = data.distritos && typeof data.distritos === 'object' ? Object.keys(data.distritos).length : 0;
    const secretariasCount = Array.isArray(data.secretarias) ? data.secretarias.length : 0;
    
    console.log(`✅ Dados carregados de: ${dataPath}`);
    console.log(`   - Distritos: ${distritosCount}`);
    console.log(`   - Secretarias: ${secretariasCount}`);
    console.log(`   - Estatísticas: ${data.estatisticas ? 'Sim' : 'Não'}`);
    
    if (distritosCount === 0) {
      console.error('⚠️ AVISO: Nenhum distrito encontrado nos dados!');
      console.error('   Estrutura do objeto:', Object.keys(data));
      if (data.distritos) {
        console.error('   Tipo de distritos:', typeof data.distritos);
        console.error('   É array?', Array.isArray(data.distritos));
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar secretarias-distritos.json:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    return { secretarias: [], distritos: {}, estatisticas: {} };
  }
}

/**
 * Carrega dados de unidades de saúde
 */
function loadUnidadesSaude() {
  try {
    // Tentar múltiplos caminhos possíveis
    const possiblePaths = [
      path.join(projectRoot, 'data', 'unidades-saude.json'), // NOVO/data/...
      path.join(__dirname, '../../data', 'unidades-saude.json'), // Relativo ao controller
      path.join(process.cwd(), 'data', 'unidades-saude.json'), // Onde o processo está rodando
      path.join(process.cwd(), 'NOVO', 'data', 'unidades-saude.json'), // Se rodando da raiz
    ];
    
    let dataPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        dataPath = possiblePath;
        break;
      }
    }
    
    if (!dataPath) {
      console.error('❌ Arquivo unidades-saude.json não encontrado em nenhum dos caminhos!');
      return { unidades: [], estatisticas: {} };
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Validar estrutura
    if (!data || typeof data !== 'object') {
      console.error('❌ Dados inválidos: não é um objeto');
      return { unidades: [], estatisticas: {} };
    }
    
    const unidadesCount = Array.isArray(data.unidades) ? data.unidades.length : 0;
    console.log(`✅ Dados de unidades de saúde carregados: ${unidadesCount} unidades`);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar unidades-saude.json:', error);
    return { unidades: [], estatisticas: {} };
  }
}

/**
 * GET /api/secretarias
 * Listar todas secretarias
 */
export async function getSecretarias(req, res, prisma) {
  return safeQuery(res, async () => {
    const data = loadSecretariasDistritos();
    return {
      secretarias: data.secretarias,
      total: data.secretarias.length
    };
  });
}

/**
 * GET /api/secretarias/:district
 * Secretarias por distrito
 */
export async function getSecretariasByDistrict(req, res, prisma) {
  return safeQuery(res, async () => {
    const { district } = req.params;
    const data = loadSecretariasDistritos();
    const secretarias = data.secretarias.filter(s => 
      s.district.toLowerCase().includes(district.toLowerCase())
    );
    return { secretarias, total: secretarias.length };
  });
}

/**
 * GET /api/distritos
 * Listar todos distritos
 */
export async function getDistritos(req, res, prisma) {
  return safeQuery(res, async () => {
    console.log('📊 getDistritos: Iniciando...');
    const data = loadSecretariasDistritos();
    
    // Validar estrutura dos dados
    if (!data || typeof data !== 'object') {
      console.error('❌ getDistritos: dados inválidos ou não é objeto');
      console.error('   Tipo recebido:', typeof data);
      return {
        distritos: {},
        estatisticas: {}
      };
    }
    
    // Garantir que distritos existe e é um objeto
    const distritos = data.distritos && typeof data.distritos === 'object' && !Array.isArray(data.distritos) 
      ? data.distritos 
      : {};
    const estatisticas = data.estatisticas && typeof data.estatisticas === 'object' && !Array.isArray(data.estatisticas)
      ? data.estatisticas 
      : {};
    
    // Log para debug
    console.log('📊 getDistritos: Dados processados');
    console.log(`   - Distritos disponíveis: ${Object.keys(distritos).length}`);
    console.log(`   - Estatísticas:`, Object.keys(estatisticas).length > 0 ? 'Sim' : 'Não');
    if (Object.keys(distritos).length > 0) {
      console.log(`   - Nomes dos distritos:`, Object.keys(distritos).slice(0, 3).join(', '), '...');
    }
    
    // Validar que temos pelo menos um distrito
    if (Object.keys(distritos).length === 0) {
      console.error('❌ getDistritos: Nenhum distrito encontrado nos dados!');
      console.error('   Estrutura do data:', Object.keys(data));
      console.error('   Tipo de data.distritos:', typeof data.distritos);
      console.error('   É array?', Array.isArray(data.distritos));
      if (data.distritos) {
        console.error('   Conteúdo de data.distritos:', JSON.stringify(data.distritos).substring(0, 200));
      }
    }
    
    const result = {
      distritos: distritos,
      estatisticas: estatisticas
    };
    
    console.log(`✅ getDistritos: Retornando ${Object.keys(distritos).length} distritos`);
    return result;
  });
}

/**
 * GET /api/distritos/:code
 * Distrito por código
 */
export async function getDistritoByCode(req, res, prisma) {
  return safeQuery(res, async () => {
    const { code } = req.params;
    const data = loadSecretariasDistritos();
    const distrito = Object.entries(data.distritos).find(([name, info]) => 
      info.code === code || name.includes(code)
    );
    
    if (!distrito) {
      return res.status(404).json({ error: 'Distrito não encontrado' });
    }
    
    return {
      nome: distrito[0],
      ...distrito[1]
    };
  });
}

/**
 * GET /api/bairros
 * Listar bairros (com filtro opcional por distrito)
 */
export async function getBairros(req, res, prisma) {
  return safeQuery(res, async () => {
    const { distrito } = req.query;
    const data = loadSecretariasDistritos();
    
    if (distrito) {
      const distritoInfo = data.distritos[distrito];
      if (!distritoInfo) {
        return res.status(404).json({ error: 'Distrito não encontrado' });
      }
      return { bairros: distritoInfo.bairros, total: distritoInfo.bairros.length };
    }
    
    // Retornar todos os bairros agrupados por distrito
    const bairrosPorDistrito = {};
    Object.entries(data.distritos).forEach(([nome, info]) => {
      bairrosPorDistrito[nome] = info.bairros;
    });
    
    return { bairrosPorDistrito };
  });
}

/**
 * GET /api/unidades-saude
 * Listar unidades de saúde (com filtros)
 */
export async function getUnidadesSaude(req, res, prisma) {
  return safeQuery(res, async () => {
    const { distrito, tipo, bairro } = req.query;
    const data = loadUnidadesSaude();
    
    let unidades = data.unidades || [];
    
    // Filtrar por distrito se fornecido
    if (distrito) {
      unidades = unidades.filter(u => 
        u.distrito === distrito || 
        u.distritoCode === distrito ||
        u.distrito.includes(distrito)
      );
    }
    
    // Filtrar por tipo se fornecido
    if (tipo) {
      unidades = unidades.filter(u => 
        u.tipo === tipo || 
        u.tipo.toLowerCase().includes(tipo.toLowerCase())
      );
    }
    
    // Filtrar por bairro se fornecido
    if (bairro) {
      unidades = unidades.filter(u => 
        u.bairro === bairro || 
        u.bairro.toLowerCase().includes(bairro.toLowerCase())
      );
    }
    
    return {
      unidades,
      total: unidades.length,
      estatisticas: data.estatisticas
    };
  });
}

/**
 * GET /api/unidades-saude/por-distrito
 * Agrupar unidades por distrito
 */
export async function getUnidadesSaudeByDistrito(req, res, prisma) {
  return safeQuery(res, async () => {
    const data = loadUnidadesSaude();
    
    // Agrupar unidades por distrito
    const porDistrito = {};
    data.unidades.forEach(unidade => {
      const distrito = unidade.distrito;
      if (!porDistrito[distrito]) {
        porDistrito[distrito] = {
          distrito,
          distritoCode: unidade.distritoCode,
          unidades: [],
          total: 0,
          porTipo: {}
        };
      }
      porDistrito[distrito].unidades.push(unidade);
      porDistrito[distrito].total++;
      
      // Contar por tipo
      const tipo = unidade.tipo;
      porDistrito[distrito].porTipo[tipo] = (porDistrito[distrito].porTipo[tipo] || 0) + 1;
    });
    
    return {
      porDistrito,
      estatisticas: data.estatisticas
    };
  });
}

/**
 * GET /api/unidades-saude/por-bairro
 * Agrupar unidades por bairro
 */
export async function getUnidadesSaudeByBairro(req, res, prisma) {
  return safeQuery(res, async () => {
    const { distrito } = req.query;
    const data = loadUnidadesSaude();
    
    // Agrupar unidades por bairro
    const porBairro = {};
    data.unidades.forEach(unidade => {
      // Filtrar por distrito se fornecido
      if (distrito && unidade.distrito !== distrito && unidade.distritoCode !== distrito) {
        return;
      }
      
      const bairro = unidade.bairro;
      if (!bairro) return;
      
      if (!porBairro[bairro]) {
        porBairro[bairro] = {
          bairro,
          distrito: unidade.distrito,
          distritoCode: unidade.distritoCode,
          unidades: [],
          total: 0,
          porTipo: {}
        };
      }
      porBairro[bairro].unidades.push(unidade);
      porBairro[bairro].total++;
      
      // Contar por tipo
      const tipo = unidade.tipo;
      porBairro[bairro].porTipo[tipo] = (porBairro[bairro].porTipo[tipo] || 0) + 1;
    });
    
    return {
      porBairro,
      total: Object.keys(porBairro).length
    };
  });
}

/**
 * GET /api/unidades-saude/por-tipo
 * Agrupar unidades por tipo
 */
export async function getUnidadesSaudeByTipo(req, res, prisma) {
  return safeQuery(res, async () => {
    const data = loadUnidadesSaude();
    
    // Agrupar unidades por tipo
    const porTipo = {};
    data.unidades.forEach(unidade => {
      const tipo = unidade.tipo;
      if (!porTipo[tipo]) {
        porTipo[tipo] = {
          tipo,
          unidades: [],
          total: 0,
          porDistrito: {}
        };
      }
      porTipo[tipo].unidades.push(unidade);
      porTipo[tipo].total++;
      
      // Contar por distrito
      const distrito = unidade.distrito;
      porTipo[tipo].porDistrito[distrito] = (porTipo[tipo].porDistrito[distrito] || 0) + 1;
    });
    
    return {
      porTipo,
      estatisticas: data.estatisticas
    };
  });
}

/**
 * GET /api/aggregate/by-district
 * Agregação por distrito
 */
export async function aggregateByDistrict(req, res, prisma) {
  return withCache('aggregate-by-district', 300, res, async () => {
    try {
      const data = loadSecretariasDistritos();
      const distritosData = data.distritos;
      
      // Buscar registros com endereço
      const allRecords = await prisma.record.findMany({
        select: {
          endereco: true,
          data: true,
          statusDemanda: true,
          tipoDeManifestacao: true,
          dataCriacaoIso: true
        },
        take: 100000
      });
      
      // Filtrar apenas registros que têm algum endereço/bairro
      const records = allRecords.filter(record => {
        const dat = record.data || {};
        const endereco = record.endereco || 
                        dat.endereco || 
                        dat.Bairro || 
                        dat.bairro ||
                        dat.endereco_completo ||
                        dat.endereço ||
                        dat.Endereço ||
                        '';
        return endereco && endereco.trim() !== '';
      });
      
      // Agrupar por distrito
      const distritosMap = {};
      Object.keys(distritosData).forEach(distrito => {
        distritosMap[distrito] = {
          nome: distrito,
          code: distritosData[distrito].code,
          count: 0,
          porStatus: {},
          porTipo: {},
          porMes: {}
        };
      });
      
      // Processar cada registro usando a biblioteca de mapeamento
      let mapeados = 0;
      let naoMapeados = 0;
      
      records.forEach(record => {
        const dat = record.data || {};
        const bairro = record.endereco || 
                      dat.endereco || 
                      dat.Bairro || 
                      dat.bairro ||
                      dat.endereco_completo ||
                      dat.endereço ||
                      dat.Endereço ||
                      '';
        
        if (!bairro || bairro.trim() === '') {
          naoMapeados++;
          return;
        }
        
        // Usar biblioteca de mapeamento robusta
        const resultado = detectDistrictByAddress(bairro);
        const distrito = resultado?.distrito;
        
        if (!distrito || !distritosMap[distrito]) {
          naoMapeados++;
          return;
        }
        
        mapeados++;
        distritosMap[distrito].count++;
        
        // Agrupar por status
        const status = record.statusDemanda || record.data?.status_demanda || record.data?.Status || 'Não informado';
        distritosMap[distrito].porStatus[status] = (distritosMap[distrito].porStatus[status] || 0) + 1;
        
        // Agrupar por tipo
        const tipo = record.tipoDeManifestacao || record.data?.tipo_de_manifestacao || record.data?.Tipo || 'Não informado';
        distritosMap[distrito].porTipo[tipo] = (distritosMap[distrito].porTipo[tipo] || 0) + 1;
        
        // Agrupar por mês
        const dataIso = record.dataCriacaoIso || record.data?.dataCriacaoIso;
        if (dataIso) {
          const mes = dataIso.substring(0, 7); // YYYY-MM
          distritosMap[distrito].porMes[mes] = (distritosMap[distrito].porMes[mes] || 0) + 1;
        }
      });
      
      // Converter para array
      return Object.values(distritosMap).map(d => ({
        distrito: d.nome,
        code: d.code,
        total: d.count,
        porStatus: d.porStatus,
        porTipo: d.porTipo,
        porMes: d.porMes
      }));
    } catch (error) {
      console.error('❌ Erro ao agregar por distrito:', error);
      throw error;
    }
  }, prisma);
}

/**
 * GET /api/distritos/:code/stats
 * Estatísticas de distrito
 */
export async function getDistritoStats(req, res, prisma) {
  return safeQuery(res, async () => {
    const { code } = req.params;
    const data = loadSecretariasDistritos();
    const distritosData = data.distritos;
    
    // Encontrar o distrito
    const distrito = Object.entries(distritosData).find(([name, info]) => 
      info.code === code || name.includes(code)
    );
    
    if (!distrito) {
      return res.status(404).json({ error: 'Distrito não encontrado' });
    }
    
    const [nome, info] = distrito;
    
    // Buscar manifestações dos bairros deste distrito
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { endereco: { not: null } },
          { data: { path: ['endereco'], not: null } },
          { data: { path: ['Bairro'], not: null } }
        ]
      }
    });
    
    // Filtrar por bairros do distrito usando biblioteca de mapeamento
    const records = allRecords.filter(record => {
      const endereco = record.endereco || 
                      record.data?.endereco || 
                      record.data?.Bairro || 
                      record.data?.bairro ||
                      record.data?.endereco_completo ||
                      '';
      
      if (!endereco) return false;
      
      const resultado = detectDistrictByAddress(endereco);
      return resultado && resultado.distrito === nome;
    });
    
    // Calcular estatísticas
    const stats = {
      distrito: nome,
      code: info.code,
      totalManifestacoes: records.length,
      porStatus: {},
      porTipo: {},
      porTema: {},
      porMes: {},
      topBairros: {}
    };
    
    records.forEach(record => {
      const dat = record.data || {};
      
      // Status
      const status = record.statusDemanda || dat.status_demanda || dat.Status || 'Não informado';
      stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
      
      // Tipo
      const tipo = record.tipoDeManifestacao || dat.tipo_de_manifestacao || dat.Tipo || 'Não informado';
      stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
      
      // Tema
      const tema = record.tema || dat.tema || dat.Tema || 'Não informado';
      stats.porTema[tema] = (stats.porTema[tema] || 0) + 1;
      
      // Mês
      const dataIso = record.dataCriacaoIso || dat.dataCriacaoIso;
      if (dataIso) {
        const mes = dataIso.substring(0, 7);
        stats.porMes[mes] = (stats.porMes[mes] || 0) + 1;
      }
      
      // Bairro
      const bairro = record.endereco || dat.endereco || dat.Bairro || 'Não informado';
      stats.topBairros[bairro] = (stats.topBairros[bairro] || 0) + 1;
    });
    
    // Ordenar top bairros
    stats.topBairros = Object.entries(stats.topBairros)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    return stats;
  });
}

/**
 * GET /api/debug/district-mapping
 * Testar mapeamento de endereços
 */
export async function debugDistrictMapping(req, res, prisma) {
  return safeQuery(res, async () => {
    const { endereco } = req.query;
    if (!endereco) {
      return res.status(400).json({ error: 'Parâmetro "endereco" é obrigatório' });
    }
    
    const resultado = detectDistrictByAddress(endereco);
    const stats = getMappingStats();
    
    return {
      endereco: endereco,
      resultado: resultado,
      estatisticas: stats
    };
  });
}

/**
 * POST /api/debug/district-mapping-batch
 * Testar mapeamento em lote
 */
export async function debugDistrictMappingBatch(req, res, prisma) {
  return safeQuery(res, async () => {
    const { enderecos } = req.body;
    if (!Array.isArray(enderecos)) {
      return res.status(400).json({ error: 'Body deve conter array "enderecos"' });
    }
    
    const resultado = mapAddressesToDistricts(enderecos);
    
    return resultado;
  });
}

/**
 * GET /api/saude/manifestacoes
 * Manifestações relacionadas a saúde
 */
export async function getSaudeManifestacoes(req, res, prisma) {
  const cacheKey = 'saude-manifestacoes:v1';
  return withCache(cacheKey, 300, res, async () => {
    // Palavras-chave relacionadas a saúde
    const keywords = [
      'saúde', 'saude', 'hospital', 'UPA', 'UPH', 'médico', 'medico', 
      'enfermeiro', 'enfermagem', 'atendimento médico', 'consulta', 
      'exame', 'vacina', 'vacinação', 'medicamento', 'remédio', 
      'emergência', 'emergencia', 'pronto-socorro', 'pronto socorro',
      'CAPS', 'centro de saúde', 'posto de saúde', 'clínica', 'policlínica',
      'maternidade', 'pediatria', 'cardiologia', 'oftalmologia', 'odontologia',
      'fisioterapia', 'reabilitação', 'reabilitacao', 'terapia', 'psicologia',
      'psiquiatria', 'unidade de saúde', 'unidade de saude'
    ];
    
    // Buscar registros que contenham palavras-chave relacionadas a saúde
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { tema: { contains: 'Saúde' } },
          { tema: { contains: 'Saude' } },
          { assunto: { contains: 'Saúde' } },
          { assunto: { contains: 'Saude' } },
          { orgaos: { contains: 'Saúde' } },
          { orgaos: { contains: 'Saude' } },
          { unidadeSaude: { not: null } },
          { unidadeCadastro: { contains: 'Saúde' } },
          { unidadeCadastro: { contains: 'Saude' } },
          { unidadeCadastro: { contains: 'UPA' } },
          { unidadeCadastro: { contains: 'UPH' } },
          { unidadeCadastro: { contains: 'Hospital' } },
          { unidadeCadastro: { contains: 'CAPS' } }
        ]
      },
      select: {
        tema: true,
        assunto: true,
        tipoDeManifestacao: true,
        statusDemanda: true,
        dataCriacaoIso: true,
        endereco: true,
        orgaos: true,
        unidadeSaude: true,
        unidadeCadastro: true,
        data: true
      },
      take: 50000
    });
    
    // Filtrar em memória para case-insensitive e múltiplas palavras-chave
    const records = allRecords.filter(r => {
      const tema = (r.tema || '').toLowerCase();
      const assunto = (r.assunto || '').toLowerCase();
      const orgaos = (r.orgaos || '').toLowerCase();
      const unidadeCadastro = (r.unidadeCadastro || '').toLowerCase();
      const unidadeSaude = (r.unidadeSaude || '').toLowerCase();
      const textoCompleto = `${tema} ${assunto} ${orgaos} ${unidadeCadastro} ${unidadeSaude}`;
      
      return keywords.some(keyword => textoCompleto.includes(keyword.toLowerCase()));
    });
    
    return {
      total: records.length,
      records: records.slice(0, 1000) // Retornar apenas primeiros 1000 para resposta
    };
  }, prisma);
}

/**
 * GET /api/saude/por-distrito
 * Saúde por distrito
 */
export async function getSaudePorDistrito(req, res, prisma) {
  const cacheKey = 'saude-por-distrito:v1';
  return withCache(cacheKey, 300, res, async () => {
    // Buscar manifestações de saúde
    const allRecords = await prisma.record.findMany({
      where: {
        OR: [
          { tema: { contains: 'Saúde' } },
          { tema: { contains: 'Saude' } },
          { orgaos: { contains: 'Saúde' } },
          { orgaos: { contains: 'Saude' } },
          { unidadeSaude: { not: null } }
        ]
      },
      select: {
        endereco: true,
        data: true,
        tema: true,
        assunto: true,
        tipoDeManifestacao: true,
        statusDemanda: true
      },
      take: 50000
    });
    
    // Agrupar por distrito
    const porDistrito = {};
    allRecords.forEach(record => {
      const dat = record.data || {};
      const endereco = record.endereco || dat.endereco || dat.Bairro || dat.bairro || '';
      
      if (!endereco) return;
      
      const resultado = detectDistrictByAddress(endereco);
      const distrito = resultado?.distrito || 'Não mapeado';
      
      if (!porDistrito[distrito]) {
        porDistrito[distrito] = {
          distrito,
          total: 0,
          porTema: {},
          porTipo: {},
          porStatus: {}
        };
      }
      
      porDistrito[distrito].total++;
      
      const tema = record.tema || 'Não informado';
      const tipo = record.tipoDeManifestacao || 'Não informado';
      const status = record.statusDemanda || 'Não informado';
      
      porDistrito[distrito].porTema[tema] = (porDistrito[distrito].porTema[tema] || 0) + 1;
      porDistrito[distrito].porTipo[tipo] = (porDistrito[distrito].porTipo[tipo] || 0) + 1;
      porDistrito[distrito].porStatus[status] = (porDistrito[distrito].porStatus[status] || 0) + 1;
    });
    
    return { porDistrito };
  }, prisma);
}

/**
 * GET /api/saude/por-tema
 * Saúde por tema
 */
export async function getSaudePorTema(req, res, prisma) {
  const cacheKey = 'saude-por-tema:v1';
  return withCache(cacheKey, 300, res, async () => {
    const records = await prisma.record.findMany({
      where: {
        OR: [
          { tema: { contains: 'Saúde' } },
          { tema: { contains: 'Saude' } },
          { orgaos: { contains: 'Saúde' } },
          { orgaos: { contains: 'Saude' } }
        ]
      },
      select: {
        tema: true,
        assunto: true,
        tipoDeManifestacao: true
      },
      take: 50000
    });
    
    const porTema = {};
    records.forEach(record => {
      const tema = record.tema || 'Não informado';
      if (!porTema[tema]) {
        porTema[tema] = {
          tema,
          total: 0,
          porAssunto: {},
          porTipo: {}
        };
      }
      porTema[tema].total++;
      
      const assunto = record.assunto || 'Não informado';
      const tipo = record.tipoDeManifestacao || 'Não informado';
      
      porTema[tema].porAssunto[assunto] = (porTema[tema].porAssunto[assunto] || 0) + 1;
      porTema[tema].porTipo[tipo] = (porTema[tema].porTipo[tipo] || 0) + 1;
    });
    
    return { porTema };
  }, prisma);
}

/**
 * GET /api/saude/por-unidade
 * Saúde por unidade
 */
export async function getSaudePorUnidade(req, res, prisma) {
  const cacheKey = 'saude-por-unidade:v1';
  return withCache(cacheKey, 300, res, async () => {
    const records = await prisma.record.findMany({
      where: {
        OR: [
          { unidadeSaude: { not: null } },
          { unidadeCadastro: { contains: 'Saúde' } },
          { unidadeCadastro: { contains: 'Saude' } },
          { unidadeCadastro: { contains: 'UPA' } },
          { unidadeCadastro: { contains: 'UPH' } },
          { unidadeCadastro: { contains: 'Hospital' } }
        ]
      },
      select: {
        unidadeSaude: true,
        unidadeCadastro: true,
        tema: true,
        assunto: true,
        tipoDeManifestacao: true
      },
      take: 50000
    });
    
    const porUnidade = {};
    records.forEach(record => {
      const unidade = record.unidadeSaude || record.unidadeCadastro || 'Não informado';
      if (!porUnidade[unidade]) {
        porUnidade[unidade] = {
          unidade,
          total: 0,
          porTema: {},
          porAssunto: {},
          porTipo: {}
        };
      }
      porUnidade[unidade].total++;
      
      const tema = record.tema || 'Não informado';
      const assunto = record.assunto || 'Não informado';
      const tipo = record.tipoDeManifestacao || 'Não informado';
      
      porUnidade[unidade].porTema[tema] = (porUnidade[unidade].porTema[tema] || 0) + 1;
      porUnidade[unidade].porAssunto[assunto] = (porUnidade[unidade].porAssunto[assunto] || 0) + 1;
      porUnidade[unidade].porTipo[tipo] = (porUnidade[unidade].porTipo[tipo] || 0) + 1;
    });
    
    return { porUnidade };
  }, prisma);
}

