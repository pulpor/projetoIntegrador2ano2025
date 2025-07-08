const fetch = require('node-fetch');

async function testMeEndpoint() {
    // Token válido do usuário 'g'
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlzTWFzdGVyIjpmYWxzZSwiaWF0IjoxNzUyMDExODk4LCJleHAiOjE3NTIwOTgyOTh9.uSfKXknoQ9S5NdEt4ciUeXT2NFFR2IENSSdYzFGWrHU';

    try {
        const response = await fetch('http://localhost:3000/usuarios/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Rota /usuarios/me funcionando!');
            console.log('📊 Dados do usuário:', data);
            console.log('📋 ActionHistory encontrado:', data.actionHistory?.length || 0, 'itens');

            if (data.actionHistory && data.actionHistory.length > 0) {
                console.log('🎉 SUCESSO! ActionHistory está sendo retornado pelo backend');
                data.actionHistory.forEach((action, index) => {
                    console.log(`   ${index + 1}. ${action.type === 'penalty' ? '🚫' : '🎉'} ${action.type} - ${action.amount} XP - ${action.reason}`);
                });
            } else {
                console.log('❌ PROBLEMA! ActionHistory está vazio ou não existe');
            }
        } else {
            console.error('❌ Erro na requisição:', response.status);
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

testMeEndpoint();
