import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔌 Testando conexão com MongoDB Atlas...');
    console.log(`📡 URL: ${process.env.MONGODB_ATLAS_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    await prisma.$connect();
    console.log('✅ Conectado com sucesso!');
    
    const count = await prisma.record.count();
    console.log(`📊 Registros no banco: ${count}`);
    
    console.log('✅ Conexão funcionando perfeitamente!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();

