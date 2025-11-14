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

  console.log(`✅ Linhas encontradas: ${json.length}`);
  let inserted = 0;
  const batchSize = 500;
  
  for (let i = 0; i < json.length; i += batchSize) {
    const slice = json.slice(i, i + batchSize);
    // MongoDB aceita JSON diretamente, não precisa serializar
    await prisma.record.createMany({ 
      data: slice.map((row) => ({ 
        data: row // JSON direto para MongoDB
      })) 
    });
    inserted += slice.length;
    console.log(`📦 Inseridos: ${inserted}/${json.length} (${Math.round(inserted/json.length*100)}%)`);
  }

  console.log('✅ Importação concluída!');
  console.log('💡 Execute: npm run db:backfill para normalizar os campos');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


