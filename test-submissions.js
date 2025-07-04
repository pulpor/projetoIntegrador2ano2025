const API_URL = 'http://localhost:3000';

async function testLogin() {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'mestre',
                password: 'fullstack123'
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);

        if (res.ok && data.token) {
            // Testar requisição de submissões
            const submissionsRes = await fetch(`${API_URL}/submissoes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Submissions Status:', submissionsRes.status);
            const submissionsData = await submissionsRes.json();
            console.log('Submissions:', submissionsData);
        }
    } catch (err) {
        console.error('Erro:', err);
    }
}

testLogin();
