// Script de Diagnóstico do Servidor
// Execute este arquivo para verificar se há problemas no backend

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DO SERVIDOR - RPG Educacional');
console.log('='.repeat(50));

// 1. Verificar arquivos essenciais
console.log('\n📁 Verificando arquivos do backend...');

const arquivosBackend = [
  'server.js',
  'inicializacao.js',
  'middlewares/autenticacao.js',
  'routes/usuariosRotas.js',
  'routes/missoesRotas.js',
  'routes/submissoesRotas.js',
  'routes/autenticacaoRotas.js'
];

let arquivosFaltando = [];

arquivosBackend.forEach(arquivo => {
  const caminho = path.join(__dirname, arquivo);
  if (fs.existsSync(caminho)) {
    console.log(`✅ ${arquivo}`);
  } else {
    console.log(`❌ ${arquivo} - FALTANDO`);
    arquivosFaltando.push(arquivo);
  }
});

// 2. Verificar arquivos JSON
console.log('\n📄 Verificando arquivos JSON...');

const arquivosJSON = [
  '../frontend/jsons/users.json',
  '../frontend/jsons/missions.json', 
  '../frontend/jsons/submissions.json'
];

arquivosJSON.forEach(arquivo => {
  const caminho = path.join(__dirname, arquivo);
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, 'utf8');
      JSON.parse(conteudo); // Testar se é JSON válido
      console.log(`✅ ${arquivo} - JSON válido`);
    } else {
      console.log(`❌ ${arquivo} - FALTANDO`);
      arquivosFaltando.push(arquivo);
    }
  } catch (error) {
    console.log(`❌ ${arquivo} - JSON INVÁLIDO: ${error.message}`);
  }
});

// 3. Verificar dependências
console.log('\n📦 Verificando dependências...');

const dependencias = ['express', 'cors', 'bcrypt', 'jsonwebtoken', 'multer'];

dependencias.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep}`);
  } catch (error) {
    console.log(`❌ ${dep} - NÃO INSTALADO`);
  }
});

// 4. Verificar estrutura de pastas
console.log('\n📂 Verificando estrutura de pastas...');

const pastas = [
  'routes',
  'middlewares', 
  'utils',
  'Uploads',
  '../frontend',
  '../frontend/jsons'
];

pastas.forEach(pasta => {
  const caminho = path.join(__dirname, pasta);
  if (fs.existsSync(caminho)) {
    console.log(`✅ ${pasta}/`);
  } else {
    console.log(`❌ ${pasta}/ - FALTANDO`);
  }
});

// 5. Resumo e sugestões
console.log('\n' + '='.repeat(50));
console.log('📋 RESUMO DO DIAGNÓSTICO');

if (arquivosFaltando.length === 0) {
  console.log('✅ Todos os arquivos essenciais estão presentes');
  console.log('\n🚀 PRÓXIMOS PASSOS PARA TESTAR:');
  console.log('1. Abrir terminal no backend: cd backend');
  console.log('2. Instalar dependências: npm install');
  console.log('3. Iniciar servidor: node server.js');
  console.log('4. Verificar se aparece: "Servidor rodando em http://localhost:3000"');
  console.log('5. Testar no browser: http://localhost:3000');
} else {
  console.log('❌ Problemas encontrados:');
  arquivosFaltando.forEach(arquivo => {
    console.log(`   - ${arquivo}`);
  });
  console.log('\n🔧 AÇÕES NECESSÁRIAS:');
  console.log('1. Verificar se todos os arquivos estão no lugar correto');
  console.log('2. Reinstalar dependências: npm install');
  console.log('3. Verificar se a estrutura de pastas está correta');
}

console.log('\n💡 DICAS PARA RESOLVER "Erro ao conectar com o servidor":');
console.log('1. Verificar se o backend está rodando (node server.js)');
console.log('2. Verificar se a porta 3000 não está em uso');
console.log('3. Verificar se o CORS está configurado corretamente');
console.log('4. Verificar se o frontend está acessando a URL correta');
console.log('5. Verificar console do browser (F12) para erros específicos');

console.log('\n🌐 URLs para testar:');
console.log('- Backend: http://localhost:3000');
console.log('- Frontend: http://localhost:5173 (Vite)');
console.log('- API Test: http://localhost:3000/missoes (deve pedir autenticação)');
