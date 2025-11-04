import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveExcelPath(fromEnv) {
  if (!fromEnv || !fromEnv.trim()) throw new Error('EXCEL_FILE não definido no .env');
  return path.isAbsolute(fromEnv) ? fromEnv : path.join(__dirname, '..', fromEnv);
}

function main() {
  const excelPath = resolveExcelPath(process.env.EXCEL_FILE);
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 });
  const headers = (rows[0] || []).map((h) => `${h}`);
  const unique = Array.from(new Set(headers));
  console.log(JSON.stringify({ columnCount: unique.length, columns: unique }, null, 2));
}

main();


