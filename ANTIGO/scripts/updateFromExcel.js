import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const fileFromEnv = process.env.EXCEL_FILE;
  const excelPath = path.isAbsolute(fileFromEnv)
    ? fileFromEnv
    : path.join(__dirname, '..', fileFromEnv);

  console.log(`📊 Lendo planilha: ${excelPath}`);
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(ws, { defval: null });

  console.log(`✅ Linhas encontradas na planilha: ${json.length}`);
  
  // Contar registros antes
  const countBefore = await prisma.record.count();
  console.log(`📊 Registros no banco antes: ${countBefore}`);

  let updated = 0;
  let inserted = 0;
  let skipped = 0; // Registros sem protocolo
  const batchSize = 1000; // Aumentado para processar mais rápido
  
  // OTIMIZAÇÃO: Buscar todos os protocolos existentes de uma vez
  console.log('🔍 Buscando protocolos existentes no banco...');
  const existingProtocols = await prisma.record.findMany({
    select: { protocolo: true, id: true },
    where: { protocolo: { not: null } }
  });
  const protocolMap = new Map(existingProtocols.map(r => [r.protocolo, r.id]));
  console.log(`✅ ${protocolMap.size} protocolos encontrados no banco`);
  
  // Preparar dados para inserção e atualização
  const toInsert = [];
  const toUpdate = [];
  
  for (const row of json) {
    // Extrair protocolo do JSON (pode estar em diferentes formatos)
    const protocolo = row.protocolo || row.Protocolo || row.PROTOCOLO || null;
    
    if (!protocolo) {
      skipped++;
      continue;
    }

    const protocoloStr = String(protocolo);
    const existingId = protocolMap.get(protocoloStr);
    
    if (existingId) {
      // Preparar para atualização
      toUpdate.push({
        id: existingId,
        data: row,
        protocolo: protocoloStr
      });
    } else {
      // Preparar para inserção
      toInsert.push({
        data: row,
        protocolo: protocoloStr
      });
    }
  }
  
  console.log(`📊 Preparados: ${toUpdate.length} para atualizar, ${toInsert.length} para inserir, ${skipped} sem protocolo`);
  
  // OTIMIZAÇÃO: Processar atualizações em lotes maiores
  console.log('🔄 Atualizando registros existentes...');
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const slice = toUpdate.slice(i, i + batchSize);
    
    // Processar atualizações em paralelo (mas limitado para não sobrecarregar)
    const updatePromises = slice.map(item => 
      prisma.record.update({
        where: { id: item.id },
        data: {
          data: item.data,
          protocolo: item.protocolo
        }
      }).catch(error => {
        console.error(`❌ Erro ao atualizar protocolo ${item.protocolo}:`, error.message);
        return null;
      })
    );
    
    const results = await Promise.all(updatePromises);
    updated += results.filter(r => r !== null).length;
    
    const processed = Math.min(i + batchSize, toUpdate.length);
    console.log(`📦 Atualizados: ${processed}/${toUpdate.length} (${Math.round(processed/toUpdate.length*100)}%)`);
  }
  
  // OTIMIZAÇÃO: Processar inserções em lotes usando createMany
  console.log('➕ Inserindo novos registros...');
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const slice = toInsert.slice(i, i + batchSize);
    
    try {
      await prisma.record.createMany({
        data: slice,
        skipDuplicates: true // Ignorar duplicatas se houver
      });
      inserted += slice.length;
    } catch (error) {
      // Se createMany falhar (pode ser por duplicatas), inserir um por um
      console.warn(`⚠️ createMany falhou, inserindo individualmente...`);
      for (const item of slice) {
        try {
          await prisma.record.create({ data: item });
          inserted++;
        } catch (e) {
          console.error(`❌ Erro ao inserir protocolo ${item.protocolo}:`, e.message);
        }
      }
    }
    
    const processed = Math.min(i + batchSize, toInsert.length);
    console.log(`📦 Inseridos: ${processed}/${toInsert.length} (${Math.round(processed/toInsert.length*100)}%)`);
  }

  const countAfter = await prisma.record.count();
  console.log('\n✅ Atualização concluída!');
  console.log(`📊 Estatísticas:`);
  console.log(`   - Registros antes: ${countBefore}`);
  console.log(`   - Registros após: ${countAfter}`);
  console.log(`   - Atualizados: ${updated}`);
  console.log(`   - Inseridos: ${inserted}`);
  console.log(`   - Sem protocolo (ignorados): ${skipped}`);
  console.log(`💡 Execute: npm run db:backfill para normalizar os campos atualizados`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

