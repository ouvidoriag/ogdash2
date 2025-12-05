/**
 * Script para autorizar o Gmail API
 * Facilita o processo de autorização OAuth 2.0
 */

import 'dotenv/config';
import { getAuthUrl, authorize } from '../../src/services/email-notifications/gmailService.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Autorização do Gmail API\n');
console.log('Este script vai ajudá-lo a autorizar o acesso ao Gmail.\n');

try {
  // Obter URL de autorização
  const authUrl = getAuthUrl();
  
  console.log('📋 Siga estes passos:\n');
  console.log('1. Acesse esta URL no navegador:');
  console.log(`\n   ${authUrl}\n`);
  console.log('2. Faça login com a conta Gmail que enviará os emails');
  console.log('3. Autorize o acesso ao Gmail');
  console.log('4. Você será redirecionado para uma página');
  console.log('5. Copie o código da URL (parte após "code=")\n');
  console.log('   Exemplo de URL:');
  console.log('   http://localhost/?code=4/0AeanS...');
  console.log('   O código é: 4/0AeanS...\n');
  
  rl.question('Cole o código aqui: ', async (code) => {
    if (!code || code.trim() === '') {
      console.error('\n❌ Código não fornecido!');
      rl.close();
      process.exit(1);
    }
    
    try {
      console.log('\n⏳ Autorizando...');
      await authorize(code.trim());
      console.log('\n✅ Autorização concluída com sucesso!');
      console.log('📁 O token foi salvo em: config/gmail-token.json');
      console.log('\n🎉 Agora você pode usar o sistema de notificações!');
      console.log('\n📧 Teste o envio:');
      console.log('   GET http://localhost:3000/api/notifications/test?email=seu_email@gmail.com');
    } catch (error) {
      console.error('\n❌ Erro ao autorizar:', error.message);
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se o código está correto');
      console.log('   - O código expira rapidamente, obtenha um novo se necessário');
      console.log('   - Certifique-se de que o redirect_uri está configurado no Google Cloud Console');
    }
    
    rl.close();
  });
  
} catch (error) {
  console.error('\n❌ Erro ao obter URL de autorização:', error.message);
  console.log('\n💡 Verifique se:');
  console.log('   - O arquivo config/gmail-credentials.json existe');
  console.log('   - As credenciais estão corretas');
  rl.close();
  process.exit(1);
}

