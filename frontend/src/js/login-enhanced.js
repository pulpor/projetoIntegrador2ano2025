// =================================================================
// LOGIN ENHANCED INTERACTIONS - Interações melhoradas para login
// =================================================================

// Adicionar interações melhoradas quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedLogin();
});

function initializeEnhancedLogin() {
    console.log('🎮 Inicializando interface melhorada de login...');
    
    // Adicionar efeitos visuais aos inputs
    setupInputEffects();
    
    // Adicionar animações aos botões
    setupButtonAnimations();
    
    // Adicionar efeitos de transição entre formulários
    setupFormTransitions();
    
    // Adicionar validação em tempo real melhorada
    setupEnhancedValidation();
    
    // Adicionar easter eggs e efeitos especiais
    setupEasterEggs();
    
    console.log('✅ Interface melhorada inicializada!');
}

// Efeitos visuais para inputs
function setupInputEffects() {
    const inputs = document.querySelectorAll('.input-field');
    
    inputs.forEach(input => {
        // Efeito de foco melhorado
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.transition = 'transform 0.3s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
        
        // Efeito de digitação
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.classList.add('has-content');
            } else {
                this.classList.remove('has-content');
            }
            
            // Feedback visual instantâneo
            if (this.type === 'text' || this.type === 'password') {
                showInputFeedback(this);
            }
        });
        
        // Efeito de erro/sucesso
        input.addEventListener('invalid', function() {
            this.classList.add('input-error');
            setTimeout(() => this.classList.remove('input-error'), 500);
        });
    });
}

// Animações para botões
function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
        // Efeito de clique
        button.addEventListener('click', function(e) {
            // Criar efeito ripple
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        // Loading state para botões de submit
        if (button.id === 'loginButton' || button.id === 'registerSubmitButton') {
            const originalHtml = button.innerHTML;
            
            button.addEventListener('click', function() {
                this.classList.add('btn-loading');
                this.disabled = true;
                
                // Simular carregamento e resetar após resposta
                setTimeout(() => {
                    this.classList.remove('btn-loading');
                    this.disabled = false;
                }, 2000);
            });
        }
    });
    
    // Adicionar estilo CSS para ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Transições entre formulários
function setupFormTransitions() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerButton = document.getElementById('registerButton');
    const backButton = document.getElementById('backButton');
    
    // Override das funções originais para adicionar animações
    registerButton.addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterFormWithAnimation();
    });
    
    backButton.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginFormWithAnimation();
    });
}

function showRegisterFormWithAnimation() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Animar saída do login
    loginForm.classList.add('login-exit');
    
    setTimeout(() => {
        loginForm.classList.add('hidden');
        loginForm.classList.remove('login-exit');
        
        // Animar entrada do registro
        registerForm.classList.remove('hidden');
        registerForm.classList.add('register-enter');
        
        setTimeout(() => {
            registerForm.classList.remove('register-enter');
        }, 500);
    }, 250);
}

function showLoginFormWithAnimation() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Animar saída do registro
    registerForm.classList.add('register-exit');
    
    setTimeout(() => {
        registerForm.classList.add('hidden');
        registerForm.classList.remove('register-exit');
        
        // Limpar campos
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-fullname').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('year-select').value = '';
        document.getElementById('class-select').value = '';
        
        // Animar entrada do login
        loginForm.classList.remove('hidden');
        loginForm.classList.add('login-enter');
        
        setTimeout(() => {
            loginForm.classList.remove('login-enter');
        }, 500);
    }, 250);
}

// Validação melhorada
function setupEnhancedValidation() {
    const usernameInput = document.getElementById('reg-username');
    const passwordInput = document.getElementById('reg-password');
    
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            validateUsernameVisual(this.value);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePasswordVisual(this.value);
        });
    }
}

function validateUsernameVisual(username) {
    const input = document.getElementById('reg-username');
    const feedback = document.getElementById('username-feedback');
    
    // Resetar classes
    input.classList.remove('input-error', 'input-success');
    
    if (username.length === 0) {
        feedback.classList.add('hidden');
        return;
    }
    
    feedback.classList.remove('hidden');
    
    if (username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
        input.classList.add('input-success');
        feedback.innerHTML = '<span class="text-green-500">✓ Nome de usuário válido</span>';
    } else {
        input.classList.add('input-error');
        feedback.innerHTML = '<span class="text-red-500">Nome deve ter pelo menos 3 caracteres (letras, números, _)</span>';
    }
}

function validatePasswordVisual(password) {
    const input = document.getElementById('reg-password');
    const feedback = document.getElementById('password-feedback');
    const strengthDiv = document.getElementById('password-strength');
    
    if (password.length === 0) {
        feedback.classList.add('hidden');
        strengthDiv.classList.add('hidden');
        input.classList.remove('input-error', 'input-success');
        return;
    }
    
    feedback.classList.remove('hidden');
    strengthDiv.classList.remove('hidden');
    
    // Calcular força
    const strength = calculatePasswordStrengthVisual(password);
    updatePasswordStrengthBars(strength);
    
    if (strength.score >= 3) {
        input.classList.remove('input-error');
        input.classList.add('input-success');
        feedback.innerHTML = '<span class="text-green-500">✓ Senha forte</span>';
    } else {
        input.classList.remove('input-success');
        input.classList.add('input-error');
        feedback.innerHTML = '<span class="text-red-500">Senha fraca - adicione maiúsculas, números e símbolos</span>';
    }
}

function calculatePasswordStrengthVisual(password) {
    let score = 0;
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ];
    
    score = checks.filter(Boolean).length;
    
    const levels = ['Muito Fraca', 'Fraca', 'Regular', 'Boa', 'Excelente'];
    const colors = ['bg-red-400', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
    
    return {
        score,
        level: levels[score] || 'Muito Fraca',
        color: colors[score] || 'bg-red-400'
    };
}

function updatePasswordStrengthBars(strength) {
    const bars = document.querySelectorAll('.password-bar');
    const strengthText = document.getElementById('password-strength-text');
    
    bars.forEach((bar, index) => {
        // Resetar classes
        bar.className = 'password-bar flex-1 h-1 rounded bg-gray-200';
        
        if (index < strength.score) {
            bar.classList.add(strength.color);
        }
    });
    
    strengthText.textContent = `Força: ${strength.level}`;
}

function showInputFeedback(input) {
    // Adicionar efeito visual sutil quando o usuário está digitando
    const icon = input.parentElement.querySelector('.input-icon');
    if (icon) {
        icon.classList.add('pulse-icon');
        setTimeout(() => icon.classList.remove('pulse-icon'), 1000);
    }
}

// Easter eggs e efeitos especiais
function setupEasterEggs() {
    // Konami code: ↑↑↓↓←→←→BA
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
            activateEasterEgg();
            konamiCode = [];
        }
    });
    
    // Double click no logo para efeito especial
    const logo = document.querySelector('.logo-icon');
    if (logo) {
        logo.addEventListener('dblclick', function() {
            createSpecialEffect();
        });
    }
}

function activateEasterEgg() {
    // Criar efeito de confete
    console.log('🎉 Easter egg ativado!');
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9d71c', '#dda0dd'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 50);
    }
    
    // Mostrar mensagem
    showTemporaryMessage('🎮 Modo Desenvolvedor Ativado! 🎮', 3000);
}

function createSpecialEffect() {
    const logo = document.querySelector('.logo-icon');
    logo.style.animation = 'none';
    logo.offsetHeight; // Trigger reflow
    logo.style.animation = 'spin 2s ease-in-out';
    
    setTimeout(() => {
        logo.style.animation = '';
    }, 2000);
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        left: ${Math.random() * 100}vw;
        top: -10px;
        z-index: 9999;
        border-radius: 50%;
        animation: confettiFall 3s linear forwards;
        pointer-events: none;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
}

function showTemporaryMessage(message, duration) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 10000;
        animation: fadeInOut ${duration}ms ease-in-out forwards;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), duration);
}

// Adicionar estilos CSS para os efeitos
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        10%, 90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    
    .input-field.has-content + .input-icon {
        color: #667eea !important;
    }
`;
document.head.appendChild(additionalStyles);
