// Teste Específico para Criação de Missões
// Execute: node test-mission-creation.js

const http = require('http');

console.log('🧪 Teste de Criação de Missões');
console.log('='.repeat(40));

// Primeiro, vamos testar se o servidor está respondendo
async function testServerConnection() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ Servidor responde: Status ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ Servidor não responde: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`⏰ Timeout na conexão com servidor`);
      resolve(false);
    });
  });
}

// Testar autenticação (deve dar 401 - esperado)
async function testAuthEndpoint() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/missoes', (res) => {
      if (res.statusCode === 401) {
        console.log(`✅ Endpoint /missoes requer autenticação (401 - correto)`);
        resolve(true);
      } else {
        console.log(`⚠️ Endpoint /missoes retornou ${res.statusCode} (esperado 401)`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Erro ao testar /missoes: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`⏰ Timeout no teste de autenticação`);
      resolve(false);
    });
  });
}

// Função principal de teste
async function runMissionTests() {
  console.log('1. Testando conexão com servidor...');
  const serverOk = await testServerConnection();
  
  if (!serverOk) {
    console.log('\n❌ PROBLEMA: Servidor não está respondendo');
    console.log('🔧 Solução:');
    console.log('   cd backend');
    console.log('   node server.js');
    return;
  }
  
  console.log('\n2. Testando endpoint de missões...');
  const authOk = await testAuthEndpoint();
  
  if (!authOk) {
    console.log('\n⚠️ PROBLEMA: Endpoint de missões não responde corretamente');
    console.log('🔧 Verificar:');
    console.log('   - Se as rotas estão configuradas corretamente');
    console.log('   - Se não há erros no console do servidor');
    return;
  }
  
  console.log('\n✅ SERVIDOR FUNCIONANDO CORRETAMENTE');
  console.log('\n🔍 Se ainda há "Erro ao conectar com o servidor":');
  console.log('   1. Verifique o console do browser (F12)');
  console.log('   2. Verifique se está logado como mestre');
  console.log('   3. Verifique a URL do frontend (deve ser uma das permitidas)');
  console.log('   4. Verifique se o token está válido');
  
  console.log('\n🌐 URLs testadas:');
  console.log('   - Backend: http://localhost:3000 ✅');
  console.log('   - Missões: http://localhost:3000/missoes ✅ (401 - esperado)');
  
  console.log('\n💡 URLs permitidas para frontend:');
  console.log('   - http://localhost:5173 (Vite padrão)');
  console.log('   - http://localhost:5174');
  console.log('   - http://localhost:5175');
  console.log('   - http://127.0.0.1:5500 (Live Server)');
  
  console.log('\n🛠️ Debug adicional:');
  console.log('   1. Abrir DevTools (F12) no browser');
  console.log('   2. Aba Console - verificar erros JavaScript');
  console.log('   3. Aba Network - verificar requisições falhando');
  console.log('   4. Verificar se localStorage tem token válido');
}

runMissionTests().catch(console.error);
