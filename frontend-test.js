// Script para testar login automaticamente no frontend
(async function testFrontendLogin() {
    console.log('Testando login no frontend...');

    // Simular preenchimento do formulário de login
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('login-form');

    if (usernameInput && passwordInput && loginForm) {
        usernameInput.value = 'mestre';
        passwordInput.value = 'fullstack123';

        // Simular clique no botão de login
        loginForm.dispatchEvent(new Event('submit'));
    } else {
        console.log('Formulário de login não encontrado');
    }
})();
