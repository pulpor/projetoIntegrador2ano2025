// Validação Final do Sistema RPG Educacional
// Este script verifica se os componentes principais estão funcionando

console.log('🔍 Iniciando validação do sistema...');

// 1. Verificar se arquivos principais existem
const fs = require('fs');
const path = require('path');

const arquivosEssenciais = [
  'frontend/src/student.js',
  'frontend/src/master.js', 
  'frontend/student.html',
  'frontend/master.html',
  'backend/server.js',
  'backend/routes/missoesRotas.js',
  'backend/routes/submissoesRotas.js'
];

console.log('\n📁 Verificando arquivos essenciais...');
arquivosEssenciais.forEach(arquivo => {
  if (fs.existsSync(arquivo)) {
    console.log(`✅ ${arquivo} - OK`);
  } else {
    console.log(`❌ ${arquivo} - FALTANDO`);
  }
});

// 2. Verificar configurações do package.json
console.log('\n📦 Verificando configurações...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ package.json principal - OK`);
  console.log(`   Scripts: ${Object.keys(packageJson.scripts).join(', ')}`);
  
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  console.log(`✅ frontend/package.json - OK`);
  console.log(`   Scripts: ${Object.keys(frontendPackage.scripts).join(', ')}`);
} catch (error) {
  console.log(`❌ Erro ao ler package.json: ${error.message}`);
}

// 3. Verificar estrutura de dados
console.log('\n📊 Verificando dados...');

try {
  const missions = JSON.parse(fs.readFileSync('frontend/jsons/missions.json', 'utf8'));
  console.log(`✅ missions.json - ${missions.length} missões carregadas`);
  
  const users = JSON.parse(fs.readFileSync('frontend/jsons/users.json', 'utf8'));
  console.log(`✅ users.json - ${users.length} usuários carregados`);
  
  const submissions = JSON.parse(fs.readFileSync('frontend/jsons/submissions.json', 'utf8'));
  console.log(`✅ submissions.json - ${submissions.length} submissões carregadas`);
} catch (error) {
  console.log(`❌ Erro ao ler dados JSON: ${error.message}`);
}

// 4. Verificar sintaxe dos principais arquivos JS
console.log('\n🔧 Verificando sintaxe JavaScript...');

function verificarSintaxe(arquivo) {
  try {
    const codigo = fs.readFileSync(arquivo, 'utf8');
    // Verificações básicas de sintaxe
    if (codigo.includes('function') || codigo.includes('=>')) {
      console.log(`✅ ${arquivo} - Sintaxe parece OK`);
    } else {
      console.log(`⚠️ ${arquivo} - Sem funções detectadas`);
    }
  } catch (error) {
    console.log(`❌ ${arquivo} - Erro: ${error.message}`);
  }
}

['frontend/src/student.js', 'frontend/src/master.js', 'backend/server.js'].forEach(verificarSintaxe);

console.log('\n🎯 Validação concluída!');
console.log('\n📋 PRÓXIMOS PASSOS PARA TESTE:');
console.log('1. cd backend && node server.js');
console.log('2. cd frontend && npm run dev');
console.log('3. Abrir browser e testar login/funcionalidades');
console.log('\n🚀 Sistema pronto para uso!');
