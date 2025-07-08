// Script para simular login do usuário 'g'
// Execute este script no console do navegador

console.log('🔑 Simulando login do usuário "g"...');

// Token válido obtido do teste (atualizado)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlzTWFzdGVyIjpmYWxzZSwiaWF0IjoxNzUyMDExODk4LCJleHAiOjE3NTIwOTgyOTh9.uSfKXknoQ9S5NdEt4ciUeXT2NFFR2IENSSdYzFGWrHU';

// Definir localStorage
localStorage.setItem('token', token);
localStorage.setItem('username', 'g');
localStorage.setItem('isMaster', 'false');
localStorage.setItem('userInfo', JSON.stringify({
    id: 2,
    username: 'g',
    fullname: 'g',
    class: 'Arqueiro do JavaScript',
    year: 1,
    isMaster: false,
    level: 3,
    xp: 250,
    pending: false
}));

console.log('✅ Login simulado configurado!');
console.log('🔄 Recarregando página...');

// Recarregar a página
window.location.reload();
