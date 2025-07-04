// Script de teste para verificar a filtragem de missões
const API_URL = 'http://localhost:3000';

async function testMissionFiltering() {
    console.log('=== TESTE DE FILTRAGEM DE MISSÕES ===');
    
    // Simular login como aluno 'g' (userId: 2)
    try {
        const loginResponse = await fetch(`${API_URL}/autenticacao/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'g',
                password: 'g123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('1. Login realizado:', loginData.success ? 'Sucesso' : 'Falha');
        
        if (!loginData.success) {
            console.error('Erro no login:', loginData);
            return;
        }
        
        const token = loginData.token;
        
        // Buscar informações do usuário
        console.log('\n2. Buscando informações do usuário...');
        const userResponse = await fetch(`${API_URL}/usuarios/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const userData = await userResponse.json();
        console.log('Dados do usuário:', userData);
        
        // Buscar todas as missões
        console.log('\n3. Buscando todas as missões...');
        const missionsResponse = await fetch(`${API_URL}/missoes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const missions = await missionsResponse.json();
        console.log('Total de missões:', missions.length);
        
        // Filtrar missões por ano/classe do aluno
        const filteredByClassYear = missions.filter(mission => {
            const isForStudentYear = !mission.targetYear || mission.targetYear === userData.year;
            const isForStudentClass = !mission.targetClass || mission.targetClass === 'geral' || mission.targetClass === userData.class;
            return isForStudentYear && isForStudentClass;
        });
        
        console.log(`Missões para o aluno (ano ${userData.year}, classe "${userData.class}"):`, filteredByClassYear.length);
        filteredByClassYear.forEach(m => console.log(`  - ID ${m.id}: ${m.title} (XP: ${m.xp})`));
        
        // Buscar submissões do usuário
        console.log('\n4. Buscando submissões do usuário...');
        const submissionsResponse = await fetch(`${API_URL}/submissoes/my-submissions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const submissions = await submissionsResponse.json();
        console.log('Total de submissões:', submissions.length);
        
        const submittedMissionIds = submissions.map(sub => sub.missionId);
        console.log('IDs das missões já submetidas:', submittedMissionIds);
        
        // Filtrar missões não submetidas
        const availableMissions = filteredByClassYear.filter(mission => 
            !submittedMissionIds.includes(mission.id)
        );
        
        console.log('\n5. RESULTADO FINAL:');
        console.log(`Missões disponíveis no painel (não submetidas): ${availableMissions.length}`);
        availableMissions.forEach(m => console.log(`  - ID ${m.id}: ${m.title} (XP: ${m.xp})`));
        
        console.log('\n6. Submissões no histórico:');
        submissions.forEach(sub => {
            const status = sub.pending ? 'Pendente' : (sub.approved ? 'Aprovada' : 'Rejeitada');
            console.log(`  - Missão ID ${sub.missionId} (${sub.missionTitle}): ${status}`);
        });
        
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

// Executar teste quando a página carregar
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', testMissionFiltering);
} else {
    // Para Node.js
    testMissionFiltering();
}
