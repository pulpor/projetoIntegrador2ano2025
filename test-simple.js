const API_URL = 'http://localhost:3000';

async function testSimpleRoute() {
    try {
        // Testar rota de autenticação primeiro
        console.log('Testando rota de autenticação...');
        const authRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'mestre',
                password: 'fullstack123'
            })
        });

        console.log('Auth Status:', authRes.status);
        const authData = await authRes.json();
        console.log('Auth Response:', authData);

        if (authRes.ok && authData.token) {
            console.log('\nTestando rota de submissões...');

            const submissionsRes = await fetch(`${API_URL}/submissoes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Submissions Status:', submissionsRes.status);
            console.log('Submissions Headers:', submissionsRes.headers);

            // Tentar obter o texto da resposta para ver o que está sendo retornado
            const textResponse = await submissionsRes.text();
            console.log('Raw Response:', textResponse);

            try {
                const jsonData = JSON.parse(textResponse);
                console.log('Parsed JSON:', jsonData);
            } catch (e) {
                console.log('Não é JSON válido');
            }
        }
    } catch (err) {
        console.error('Erro:', err);
    }
}

testSimpleRoute();
