import 'dotenv/config';
import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function findExcelFiles(dir, depth = 0, maxDepth = 3) {
  const files = [];
  
  if (depth > maxDepth) return files;
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findExcelFiles(fullPath, depth + 1, maxDepth));
      } else if (entry.isFile() && /\.(xlsx|xls)$/i.test(entry.name)) {
        const stats = statSync(fullPath);
        files.push({
          path: fullPath,
          relative: path.relative(projectRoot, fullPath),
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          modified: stats.mtime.toISOString().split('T')[0]
        });
      }
    }
  } catch (error) {
    // Ignorar erros de permissão
  }
  
  return files;
}

console.log('🔍 Procurando arquivos Excel...\n');

// Verificar caminho do .env primeiro
const excelFromEnv = process.env.EXCEL_FILE;
if (excelFromEnv) {
  const excelPath = path.isAbsolute(excelFromEnv)
    ? excelFromEnv
    : path.join(projectRoot, excelFromEnv);
  
  console.log(`📁 Caminho configurado no .env: ${excelPath}`);
  console.log(`   Existe? ${existsSync(excelPath) ? '✅ SIM' : '❌ NÃO'}\n`);
}

// Procurar em todo o projeto
console.log('🔎 Buscando arquivos .xlsx e .xls no projeto...\n');
const excelFiles = findExcelFiles(projectRoot);

if (excelFiles.length === 0) {
  console.log('❌ Nenhum arquivo Excel encontrado no projeto.\n');
  console.log('💡 Verifique se o arquivo está em:');
  console.log('   - Desktop (pasta Dashboard)');
  console.log('   - Downloads');
  console.log('   - Outro local acessível\n');
  console.log('📝 Se o arquivo estiver em outro local, atualize o EXCEL_FILE no .env');
} else {
  console.log(`✅ Encontrados ${excelFiles.length} arquivo(s) Excel:\n`);
  excelFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.relative}`);
    console.log(`   Caminho completo: ${file.path}`);
    console.log(`   Tamanho: ${file.size}`);
    console.log(`   Modificado: ${file.modified}\n`);
  });
  
  // Sugerir qual usar
  const largestFile = excelFiles.reduce((a, b) => 
    parseFloat(a.size) > parseFloat(b.size) ? a : b
  );
  console.log(`💡 Arquivo maior: ${largestFile.relative} (${largestFile.size})`);
  console.log(`   Este provavelmente contém os dados completos.\n`);
}

