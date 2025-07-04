/**
 * TESTE COMPLETO DE FLUXO DE AUTENTICAÇÃO E CRIAÇÃO DE MISSÃO
 * 
 * Este script testa o fluxo completo:
 * 1. Login como mestre
 * 2. Verificação do token
 * 3. Criação de missão
 * 
 * Execute com: node test-full-flow.js
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

// Dados de teste
const MASTER_LOGIN = {
  username: 'mestre', 
  password: 'fullstack123' // Senha correta encontrada na documentação
};

const TEST_MISSION = {
  titulo: 'Missão de Teste - ' + Date.now(),
  descricao: 'Esta é uma missão criada pelo script de teste para verificar o fluxo de autenticação.',
  xp: 100,
  targetYear: 1,
  targetClass: 'A'
};

async function testCompleteFlow() {
  console.log('🚀 Iniciando teste completo de fluxo...\n');

  try {
    // Passo 1: Login como mestre
    console.log('1️⃣ Fazendo login como mestre...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(MASTER_LOGIN)
    });

    console.log('Login Response Status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login falhou: ${error}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido:', {
      username: loginData.username,
      isMaster: loginData.isMaster,
      hasToken: !!loginData.token,
      tokenLength: loginData.token ? loginData.token.length : 0
    });

    const token = loginData.token;

    // Passo 2: Verificar token com /usuarios/me
    console.log('\n2️⃣ Verificando token com /usuarios/me...');
    const meResponse = await fetch(`${API_URL}/usuarios/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Me Response Status:', meResponse.status);
    
    if (!meResponse.ok) {
      const error = await meResponse.text();
      throw new Error(`Verificação de token falhou: ${error}`);
    }

    const meData = await meResponse.json();
    console.log('✅ Token válido:', {
      id: meData.id,
      username: meData.username,
      isMaster: meData.isMaster
    });

    // Passo 3: Criar missão
    console.log('\n3️⃣ Criando missão de teste...');
    const missionResponse = await fetch(`${API_URL}/missoes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_MISSION)
    });

    console.log('Mission Response Status:', missionResponse.status);
    
    if (!missionResponse.ok) {
      const error = await missionResponse.text();
      console.error('❌ Erro ao criar missão:', error);
      
      // Tentar extrair mais detalhes do erro
      try {
        const errorJson = JSON.parse(error);
        console.error('Detalhes do erro:', errorJson);
      } catch (e) {
        console.error('Erro raw:', error);
      }
      
      throw new Error(`Criação de missão falhou: ${error}`);
    }

    const missionData = await missionResponse.json();
    console.log('✅ Missão criada com sucesso:', {
      id: missionData.id,
      title: missionData.title,
      xp: missionData.xp,
      targetYear: missionData.targetYear,
      targetClass: missionData.targetClass
    });

    console.log('\n🎉 TESTE COMPLETO: SUCESSO!');
    console.log('O fluxo de autenticação e criação de missão está funcionando corretamente.');

  } catch (error) {
    console.error('\n❌ TESTE FALHADO:', error.message);
    
    console.log('\n🔍 Diagnóstico:');
    console.log('- Verifique se o backend está rodando em http://localhost:3000');
    console.log('- Verifique se existe um usuário mestre com as credenciais:', MASTER_LOGIN);
    console.log('- Verifique os logs do backend para mais detalhes');
    
    process.exit(1);
  }
}

async function checkServerHealth() {
  console.log('🏥 Verificando saúde do servidor...');
  
  try {
    const response = await fetch(`${API_URL}/usuarios/me`, {
      method: 'GET'
    });
    
    if (response.status === 401) {
      console.log('✅ Servidor está rodando (retornou 401, que é esperado sem autenticação)');
      return true;
    } else if (response.ok) {
      console.log('✅ Servidor está rodando');
      return true;
    } else {
      console.log('⚠️ Servidor respondeu com status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Não foi possível conectar ao servidor:', error.message);
    return false;
  }
}

// Executar teste
async function main() {
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    console.log('\n💡 Para iniciar o backend, execute:');
    console.log('   cd backend && node server.js');
    process.exit(1);
  }

  await testCompleteFlow();
}

main();
