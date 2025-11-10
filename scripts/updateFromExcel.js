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
  const batchSize = 100; // Processar em lotes menores para updates
  
  for (let i = 0; i < json.length; i += batchSize) {
    const slice = json.slice(i, i + batchSize);
    
    for (const row of slice) {
      // Extrair protocolo do JSON (pode estar em diferentes formatos)
      const protocolo = row.protocolo || row.Protocolo || row.PROTOCOLO || null;
      
      if (!protocolo) {
        skipped++;
        continue;
      }

      try {
        // Verificar se já existe pelo protocolo
        const existing = await prisma.record.findFirst({
          where: { protocolo: String(protocolo) }
        });

        if (existing) {
          // Atualizar registro existente
          await prisma.record.update({
            where: { id: existing.id },
            data: {
              data: row, // Atualizar JSON completo
              // Campos normalizados serão atualizados pelo backfill
              protocolo: String(protocolo)
            }
          });
          updated++;
        } else {
          // Inserir novo registro
          await prisma.record.create({
            data: {
              data: row,
              protocolo: String(protocolo)
            }
          });
          inserted++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar protocolo ${protocolo}:`, error.message);
      }
    }
    
    const processed = Math.min(i + batchSize, json.length);
    console.log(`📦 Processados: ${processed}/${json.length} (${Math.round(processed/json.length*100)}%) - Atualizados: ${updated}, Inseridos: ${inserted}, Sem protocolo: ${skipped}`);
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

