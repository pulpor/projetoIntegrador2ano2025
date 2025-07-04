// Script de Debug de Autenticação
// Use este script para testar manualmente o token

console.log('🔐 Debug de Autenticação - Master');
console.log('='.repeat(40));

// 1. Verificar localStorage
console.log('\n📱 Verificando localStorage...');
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
const isMaster = localStorage.getItem('isMaster');

console.log('Token:', token ? `Presente (${token.length} chars)` : 'AUSENTE');
console.log('Username:', username || 'AUSENTE');
console.log('IsMaster:', isMaster || 'AUSENTE');

if (!token) {
  console.log('\n❌ PROBLEMA: Token não encontrado');
  console.log('🔧 Solução: Fazer login novamente');
  console.log('   1. Ir para página inicial');
  console.log('   2. Fazer login como mestre');
  console.log('   3. Tentar criar missão novamente');
} else {
  console.log('\n✅ Token encontrado no localStorage');
  
  // 2. Testar token com API
  console.log('\n🧪 Testando token com API...');
  
  fetch('http://localhost:3000/usuarios/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status da resposta:', response.status);
    
    if (response.status === 401) {
      console.log('\n❌ PROBLEMA: Token inválido ou expirado');
      console.log('🔧 Solução:');
      console.log('   1. localStorage.clear()');
      console.log('   2. Recarregar página');
      console.log('   3. Fazer login novamente');
      
      // Limpar automaticamente se desejar
      const clear = confirm('Token inválido. Limpar localStorage e recarregar?');
      if (clear) {
        localStorage.clear();
        location.reload();
      }
    } else if (response.status === 200) {
      return response.json();
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
  })
  .then(data => {
    if (data) {
      console.log('\n✅ Token válido! Dados do usuário:');
      console.log('   ID:', data.id);
      console.log('   Username:', data.username);
      console.log('   É Mestre:', data.isMaster);
      
      if (!data.isMaster) {
        console.log('\n❌ PROBLEMA: Usuário não é mestre');
        console.log('🔧 Solução: Fazer login com conta de mestre');
      } else {
        console.log('\n✅ Usuário é mestre - pode criar missões');
        
        // 3. Testar criação de missão (simulação)
        console.log('\n🧪 Simulando criação de missão...');
        
        const missionData = {
          titulo: 'Teste de Missão',
          descricao: 'Missão de teste para verificar API',
          xp: 50,
          targetYear: null,
          targetClass: 'geral'
        };
        
        fetch('http://localhost:3000/missoes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(missionData)
        })
        .then(response => {
          console.log('Status criação missão:', response.status);
          
          if (response.status === 201) {
            console.log('✅ Criação de missão funcionando!');
            return response.json();
          } else if (response.status === 401) {
            console.log('❌ Ainda há problema de autenticação');
          } else {
            console.log(`⚠️ Erro na criação: ${response.status}`);
            return response.json();
          }
        })
        .then(result => {
          if (result) {
            console.log('Resultado:', result);
          }
        })
        .catch(error => {
          console.error('Erro na requisição:', error);
        });
      }
    }
  })
  .catch(error => {
    console.error('\n❌ Erro na requisição:', error);
    console.log('🔧 Possíveis causas:');
    console.log('   1. Backend não está rodando');
    console.log('   2. Problema de CORS');
    console.log('   3. URL incorreta');
  });
}

console.log('\n💡 Como usar este debug:');
console.log('1. Abrir DevTools (F12)');
console.log('2. Aba Console');
console.log('3. Copiar e colar este código');
console.log('4. Pressionar Enter');
console.log('5. Verificar os resultados acima');
