/**
 * Script para limpar notificações de email com status 'erro' do banco de dados
 * 
 * Este script remove permanentemente todos os registros de notificações
 * que possuem status = 'erro' da tabela NotificacaoEmail.
 * 
 * Uso: node scripts/maintenance/limpar-notificacoes-erro.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
  errorFormat: 'pretty',
});

async function limparNotificacoesErro() {
  try {
    console.log('🔍 Conectando ao banco de dados...\n');
    await prisma.$connect();
    console.log('✅ Conectado com sucesso!\n');
    console.log('='.repeat(80));
    console.log('🧹 LIMPEZA DE NOTIFICAÇÕES COM ERRO');
    console.log('='.repeat(80));
    console.log();

    // Contar notificações com erro antes da limpeza
    const totalErros = await prisma.notificacaoEmail.count({
      where: { status: 'erro' }
    });

    console.log(`📊 Total de notificações com erro encontradas: ${totalErros.toLocaleString('pt-BR')}`);
    
    if (totalErros === 0) {
      console.log('\n✅ Nenhuma notificação com erro encontrada. Nada a fazer.');
      return;
    }

    // Estatísticas detalhadas antes da limpeza
    console.log('\n📈 Estatísticas antes da limpeza:');
    console.log('-'.repeat(80));
    
    const porTipo = await prisma.notificacaoEmail.groupBy({
      by: ['tipoNotificacao'],
      where: { status: 'erro' },
      _count: { id: true }
    });

    console.log('\n  Por Tipo de Notificação:');
    porTipo.forEach(t => {
      console.log(`    - ${t.tipoNotificacao}: ${t._count.id.toLocaleString('pt-BR')}`);
    });

    const porSecretaria = await prisma.notificacaoEmail.groupBy({
      by: ['secretaria'],
      where: { status: 'erro' },
      _count: { id: true },
      orderBy: { _count: { secretaria: 'desc' } },
      take: 10
    });

    console.log('\n  Por Secretaria (Top 10):');
    porSecretaria.forEach(s => {
      console.log(`    - ${s.secretaria}: ${s._count.id.toLocaleString('pt-BR')}`);
    });

    // Data mais antiga e mais recente
    const maisAntiga = await prisma.notificacaoEmail.findFirst({
      where: { status: 'erro' },
      orderBy: { enviadoEm: 'asc' },
      select: { enviadoEm: true }
    });

    const maisRecente = await prisma.notificacaoEmail.findFirst({
      where: { status: 'erro' },
      orderBy: { enviadoEm: 'desc' },
      select: { enviadoEm: true }
    });

    if (maisAntiga && maisRecente) {
      console.log(`\n  Data mais antiga: ${maisAntiga.enviadoEm.toLocaleString('pt-BR')}`);
      console.log(`  Data mais recente: ${maisRecente.enviadoEm.toLocaleString('pt-BR')}`);
    }

    // Confirmar antes de deletar
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
    console.log('='.repeat(80));
    console.log(`\nSerão removidos ${totalErros.toLocaleString('pt-BR')} registro(s) com status 'erro'.`);
    console.log('\nPara confirmar, execute o script novamente com o parâmetro --confirm');
    console.log('Exemplo: node scripts/maintenance/limpar-notificacoes-erro.js --confirm\n');

    // Verificar se foi passado o parâmetro --confirm
    const args = process.argv.slice(2);
    if (!args.includes('--confirm')) {
      console.log('❌ Operação cancelada. Use --confirm para executar a limpeza.');
      return;
    }

    // Executar a limpeza
    console.log('\n🗑️  Iniciando limpeza...');
    console.log('-'.repeat(80));

    const resultado = await prisma.notificacaoEmail.deleteMany({
      where: { status: 'erro' }
    });

    console.log(`\n✅ Limpeza concluída com sucesso!`);
    console.log(`   Registros removidos: ${resultado.count.toLocaleString('pt-BR')}`);

    // Verificar se ainda há registros com erro
    const errosRestantes = await prisma.notificacaoEmail.count({
      where: { status: 'erro' }
    });

    if (errosRestantes > 0) {
      console.log(`\n⚠️  Ainda existem ${errosRestantes.toLocaleString('pt-BR')} registro(s) com erro.`);
    } else {
      console.log(`\n✅ Todos os registros com erro foram removidos.`);
    }

    // Estatísticas finais
    const totalNotificacoes = await prisma.notificacaoEmail.count();
    const porStatus = await prisma.notificacaoEmail.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    console.log('\n📊 Estatísticas finais:');
    console.log('-'.repeat(80));
    console.log(`Total de notificações: ${totalNotificacoes.toLocaleString('pt-BR')}`);
    console.log('\n  Por Status:');
    porStatus.forEach(s => {
      console.log(`    - ${s.status}: ${s._count.id.toLocaleString('pt-BR')}`);
    });

    console.log('\n✅ Processo concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro ao limpar notificações:', error);
    if (error.code === 'P2010' || error.message?.includes('Server selection timeout')) {
      console.error('\n💡 Dica: Verifique se a variável DATABASE_URL está configurada corretamente no arquivo .env');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Desconectado do banco de dados.');
  }
}

// Executar
limparNotificacoesErro();

