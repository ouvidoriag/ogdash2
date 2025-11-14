/**
 * Configuração e inicialização do banco de dados
 */

export async function initializeDatabase(prisma) {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados inicializado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    return false;
  }
}

export async function testConnection(prisma, maxRetries = 3, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Conexão com MongoDB Atlas estabelecida com sucesso!');
      return true;
    } catch (error) {
      console.error(`❌ Tentativa ${i + 1}/${maxRetries} falhou:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`⏳ Aguardando ${delay/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

