import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  try {
    console.log('📊 Analisando estrutura do banco de dados...\n');
    
    // Contar registros
    const total = await prisma.record.count();
    console.log(`✅ Total de registros: ${total.toLocaleString('pt-BR')}`);
    
    // Buscar um registro de exemplo
    const sample = await prisma.record.findFirst({
      select: {
        id: true,
        protocolo: true,
        statusDemanda: true,
        orgaos: true,
        tipoDeManifestacao: true,
        tema: true,
        assunto: true,
        dataCriacaoIso: true,
        dataConclusaoIso: true,
        createdAt: true
      }
    });
    
    console.log('\n📋 Exemplo de registro:');
    console.log(JSON.stringify(sample, null, 2));
    
    // Analisar campos normalizados disponíveis
    console.log('\n🔍 Campos normalizados disponíveis:');
    const fields = [
      'protocolo', 'statusDemanda', 'orgaos', 'tipoDeManifestacao', 
      'tema', 'assunto', 'canal', 'unidadeCadastro', 'unidadeSaude',
      'status', 'servidor', 'responsavel', 'prioridade', 'dataCriacaoIso', 'dataConclusaoIso'
    ];
    
    for (const field of fields) {
      const count = await prisma.record.count({
        where: { [field]: { not: null } }
      });
      const percent = ((count / total) * 100).toFixed(1);
      console.log(`  - ${field}: ${count.toLocaleString('pt-BR')} (${percent}%)`);
    }
    
    // Analisar distribuição por alguns campos principais
    console.log('\n📈 Distribuição por Status:');
    const byStatus = await prisma.record.groupBy({
      by: ['status'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10
    });
    byStatus.forEach(item => {
      console.log(`  - ${item.status || 'Não informado'}: ${item._count._all.toLocaleString('pt-BR')}`);
    });
    
    console.log('\n📈 Top 5 Órgãos:');
    const byOrgaos = await prisma.record.groupBy({
      by: ['orgaos'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 5
    });
    byOrgaos.forEach(item => {
      console.log(`  - ${item.orgaos || 'Não informado'}: ${item._count._all.toLocaleString('pt-BR')}`);
    });
    
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();

