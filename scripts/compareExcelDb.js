import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveExcelPath(fromEnv) {
  if (!fromEnv || !fromEnv.trim()) throw new Error('EXCEL_FILE não definido no .env');
  return path.isAbsolute(fromEnv) ? fromEnv : path.join(__dirname, '..', fromEnv);
}

function stringifyRow(obj) {
  // Garantir ordem determinística das chaves para comparação estável
  const ordered = {};
  for (const k of Object.keys(obj).sort()) ordered[k] = obj[k];
  return JSON.stringify(ordered);
}

async function main() {
  const excelPath = resolveExcelPath(process.env.EXCEL_FILE);
  console.log(`Lendo planilha: ${excelPath}`);
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const excelRows = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`Linhas na planilha: ${excelRows.length}`);

  // Conjunto de linhas da planilha (stringificadas e ordenadas)
  const excelSet = new Set(excelRows.map(stringifyRow));

  // Buscar todos registros do DB (apenas campo data)
  const dbRows = await prisma.record.findMany({ select: { data: true } });
  console.log(`Registros no banco: ${dbRows.length}`);

  // DB guarda JSON como string; para ser comparável, reparse e re-stringify ordenando chaves
  const dbSet = new Set(
    dbRows.map((r) => {
      let obj;
      try { obj = JSON.parse(r.data); } catch { obj = {}; }
      return stringifyRow(obj);
    })
  );

  // Diferenças
  const missingInDb = [];
  for (const s of excelSet) if (!dbSet.has(s)) missingInDb.push(s);

  const extraInDb = [];
  for (const s of dbSet) if (!excelSet.has(s)) extraInDb.push(s);

  // Amostras legíveis
  const sample = (arr, n = 5) => arr.slice(0, Math.min(arr.length, n)).map((s) => JSON.parse(s));

  const summary = {
    excelCount: excelRows.length,
    dbCount: dbRows.length,
    equalCounts: excelRows.length === dbRows.length,
    missingInDbCount: missingInDb.length,
    extraInDbCount: extraInDb.length,
    missingInDbSample: sample(missingInDb),
    extraInDbSample: sample(extraInDb),
  };

  console.log('Resumo da comparação:');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


