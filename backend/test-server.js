// Teste de Conectividade do Servidor
// Execute: node test-server.js

const http = require('http');

console.log('🔍 Testando conectividade do servidor...');
console.log('='.repeat(40));

// Função para testar uma URL
function testUrl(url, description) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${description}: Status ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`⏰ ${description}: Timeout (5s)`);
      resolve(false);
    });
  });
}

// Lista de testes
const tests = [
  { url: 'http://localhost:3000', desc: 'Servidor principal' },
  { url: 'http://localhost:3000/missoes', desc: 'Rota de missões (deve dar 401)' },
  { url: 'http://localhost:3000/usuarios', desc: 'Rota de usuários (deve dar 401)' },
  { url: 'http://localhost:3000/auth', desc: 'Rota de autenticação' }
];

// Executar testes
async function runTests() {
  console.log('Testando URLs...\n');
  
  let passedTests = 0;
  
  for (const test of tests) {
    const result = await testUrl(test.url, test.desc);
    if (result) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre testes
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`📊 Resultado: ${passedTests}/${tests.length} testes passaram`);
  
  if (passedTests === 0) {
    console.log('\n❌ SERVIDOR NÃO ESTÁ RODANDO');
    console.log('🔧 Soluções:');
    console.log('1. cd backend');
    console.log('2. node server.js');
    console.log('3. Verificar se aparece "Servidor rodando em http://localhost:3000"');
  } else if (passedTests < tests.length) {
    console.log('\n⚠️ SERVIDOR PARCIALMENTE FUNCIONAL');
    console.log('Algumas rotas podem ter problemas');
  } else {
    console.log('\n✅ SERVIDOR FUNCIONANDO CORRETAMENTE');
    console.log('O problema pode estar no frontend ou na autenticação');
  }
  
  console.log('\n💡 Próximos passos:');
  console.log('1. Verificar console do backend para erros');
  console.log('2. Verificar console do browser (F12) para erros');
  console.log('3. Testar login manual no frontend');
  console.log('4. Verificar se token está sendo enviado corretamente');
}

runTests().catch(console.error);
