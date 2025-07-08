const fetch = require('node-fetch');

const senhas = ['123456', 'g', 'password', '123', 'admin', 'user', 'test'];

async function testarLogin(username, password) {
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Login successful with password "${password}"!`);
            console.log('Token:', data.token);
            console.log('User data:', data.user);
            return data.token;
        } else {
            console.log(`❌ Failed with password "${password}"`);
            return null;
        }
    } catch (err) {
        console.error('Error:', err.message);
        return null;
    }
}

async function testarSenhas() {
    console.log('Testando senhas para o usuário "g"...\n');

    for (const senha of senhas) {
        const token = await testarLogin('g', senha);
        if (token) {
            console.log('\n🎉 Token encontrado! Use este token para testar a página.');
            return;
        }
    }

    console.log('\n😞 Nenhuma senha funcionou. Vou tentar criar um novo usuário...');
}

testarSenhas();
