import 'dotenv/config';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}/api/cache/clear`;

async function clearCache() {
  try {
    console.log(`🗑️  Limpando cache do servidor em http://localhost:${port}...`);
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${data.message}`);
    } else {
      console.error('❌ Erro ao limpar cache:', data);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Servidor não está rodando. Inicie o servidor primeiro com: npm start');
    } else {
      console.error('❌ Erro:', error.message);
    }
    process.exit(1);
  }
}

clearCache();

