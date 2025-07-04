// Debug Simples - Executar no Console do Browser (F12)

console.log('🔍 Debug Token Master - Execução Imediata');
console.log('='.repeat(50));

// 1. Verificar estado atual do localStorage
console.log('\n📱 LocalStorage atual:');
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
const isMaster = localStorage.getItem('isMaster');

console.log('✓ Token:', token ? `Presente (${token.length} chars)` : '❌ AUSENTE');
console.log('✓ Username:', username || '❌ AUSENTE');
console.log('✓ IsMaster:', isMaster || '❌ AUSENTE');

if (!token) {
  console.log('\n🚨 PROBLEMA: Token não encontrado');
  console.log('💡 SOLUÇÃO: Execute o comando abaixo para fazer login novamente');
  console.log('   window.location.href = "./index.html"');
} else {
  console.log('\n🧪 Testando token com o servidor...');
  
  // 2. Testar token
  fetch('/usuarios/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log(`📡 Resposta /usuarios/me: ${response.status}`);
    
    if (response.status === 200) {
      return response.json();
    } else if (response.status === 401) {
      console.log('❌ Token inválido/expirado');
      return null;
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
      return null;
    }
  })
  .then(data => {
    if (data) {
      console.log('✅ Token válido! Dados do usuário:');
      console.log('   ID:', data.id);
      console.log('   Username:', data.username);
      console.log('   É Mestre:', data.isMaster);
      
      if (data.isMaster) {
        console.log('\n🎯 DIAGNÓSTICO: Usuário é mestre e token é válido');
        console.log('💡 Se ainda há erro ao criar missões, pode ser:');
        console.log('   1. Problema no header da requisição');
        console.log('   2. Problema de CORS');
        console.log('   3. Backend não está processando o token corretamente');
        
        // 3. Testar criação de missão (simulação)
        console.log('\n🧪 Testando endpoint de criação de missão...');
        
        fetch('/missoes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            titulo: 'Teste Debug',
            descricao: 'Missão de teste para debug',
            xp: 10,
            targetYear: null,
            targetClass: 'geral'
          })
        })
        .then(r => {
          console.log(`📡 Resposta /missoes: ${r.status}`);
          if (r.status === 201) {
            console.log('✅ Criação de missão funcionando!');
            return r.json();
          } else if (r.status === 401) {
            console.log('❌ Erro 401 na criação - problema específico desta rota');
            return r.json();
          } else {
            console.log(`⚠️ Erro ${r.status} na criação`);
            return r.json();
          }
        })
        .then(result => {
          if (result) {
            console.log('📋 Resposta do servidor:', result);
          }
        })
        .catch(err => {
          console.error('❌ Erro na requisição de teste:', err);
        });
        
      } else {
        console.log('❌ Usuário não é mestre!');
        console.log('💡 Faça login com conta de mestre');
      }
    } else {
      console.log('\n🚨 PROBLEMA: Token inválido');
      console.log('💡 SOLUÇÕES:');
      console.log('   1. localStorage.clear() + relogar');
      console.log('   2. Verificar se backend está rodando');
      console.log('   3. Verificar se é a conta de mestre correta');
    }
  })
  .catch(error => {
    console.error('❌ Erro na requisição:', error);
    console.log('💡 Possíveis causas:');
    console.log('   1. Backend não está rodando');
    console.log('   2. Problema de rede/CORS');
    console.log('   3. URL incorreta');
  });
}

console.log('\n💡 Comandos úteis:');
console.log('- localStorage.clear() // Limpar tudo');
console.log('- location.reload() // Recarregar página');
console.log('- window.location.href = "./index.html" // Ir para login');
