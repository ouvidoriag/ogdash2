import 'dotenv/config';

const baseUrl = 'http://localhost:3000';

async function testEndpoint(name, url) {
  try {
    const response = await fetch(`${baseUrl}${url}`);
    const data = await response.json();
    console.log(`✅ ${name}: ${JSON.stringify(data).substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testando endpoints do dashboard...\n');
  
  const endpoints = [
    ['Summary', '/api/summary'],
    ['Records', '/api/records?page=1&pageSize=10'],
    ['By Month', '/api/aggregate/by-month'],
    ['Count By Secretaria', '/api/aggregate/count-by?field=Secretaria'],
    ['Count By Tipo', '/api/aggregate/count-by?field=Tipo'],
    ['Heatmap', '/api/aggregate/heatmap?dim=Categoria'],
    ['Complaints', '/api/complaints-denunciations'],
    ['Unit ADÃO', '/api/unit/Adão'],
    ['Unit CER IV', '/api/unit/CER IV'],
    ['By Theme', '/api/aggregate/by-theme'],
    ['By Subject', '/api/aggregate/by-subject'],
    ['By Server', '/api/aggregate/by-server'],
    ['Status Overview', '/api/stats/status-overview'],
    ['Average Time', '/api/stats/average-time']
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, url] of endpoints) {
    const result = await testEndpoint(name, url);
    if (result) passed++;
    else failed++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay
  }
  
  console.log(`\n📊 Resultado: ${passed} passaram, ${failed} falharam`);
}

main().catch(console.error);

