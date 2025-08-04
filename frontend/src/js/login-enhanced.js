// =================================================================
// LOGIN ENHANCED INTERACTIONS - Interações melhoradas para login
// =================================================================

// Adicionar interações melhoradas quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
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
    // COMPLETAMENTE DESABILITADO - não vamos mexer nos inputs
    console.log('⚠️ Input effects desabilitados para evitar conflitos com ícones');
}

// Animações para botões
function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });

        button.addEventListener('mousedown', function () {
            this.style.transform = 'translateY(0) scale(0.98)';
        });

        button.addEventListener('mouseup', function () {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
    });
}

// Transições entre formulários
function setupFormTransitions() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Função para animar a entrada do formulário
    function animateFormEntry(form) {
        if (form) {
            form.style.opacity = '0';
            form.style.transform = 'translateY(20px)';

            setTimeout(() => {
                form.style.transition = 'all 0.5s ease';
                form.style.opacity = '1';
                form.style.transform = 'translateY(0)';
            }, 50);
        }
    }

    // Observar mudanças de visibilidade dos formulários
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'register-form' && !target.classList.contains('hidden')) {
                    animateFormEntry(target);

                    // Limpar campos ao mostrar o formulário
                    clearRegistrationForm();
                }
            }
        });
    });

    if (registerForm) {
        observer.observe(registerForm, { attributes: true });
    }
}

// Limpar formulário de registro
function clearRegistrationForm() {
    const fields = [
        'reg-username',
        'reg-fullname',
        'reg-password',
        'year-select',
        'class-select'
    ];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.classList.remove('has-content');
        }
    });

    // Esconder feedbacks
    const feedbacks = ['username-feedback', 'fullname-feedback', 'password-feedback', 'password-strength'];
    feedbacks.forEach(feedbackId => {
        const feedback = document.getElementById(feedbackId);
        if (feedback) {
            feedback.classList.add('hidden');
        }
    });
}

// Validação melhorada (apenas para username, senha fica com auth.js)
function setupEnhancedValidation() {
    // REMOVIDO: Validação visual que causava o campo ficar verde
    // Deixar apenas a validação básica no backend

    // NÃO validar senha aqui - deixar para auth.js
}

// Easter eggs e efeitos especiais
function setupEasterEggs() {
    let clickCount = 0;
    const logo = document.querySelector('.logo, h1');

    if (logo) {
        logo.addEventListener('click', function () {
            clickCount++;

            if (clickCount === 5) {
                // Efeito especial após 5 cliques
                document.body.style.filter = 'hue-rotate(180deg)';
                setTimeout(() => {
                    document.body.style.filter = 'none';
                }, 2000);

                clickCount = 0;
            }
        });
    }

    // Efeito de partículas ao clicar
    document.addEventListener('click', function (e) {
        createClickParticle(e.clientX, e.clientY);
    });
}

// Criar partícula no clique
function createClickParticle(x, y) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.background = '#667eea';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.transition = 'all 0.5s ease-out';

    document.body.appendChild(particle);

    setTimeout(() => {
        particle.style.transform = 'translateY(-20px) scale(0)';
        particle.style.opacity = '0';
    }, 10);

    setTimeout(() => {
        document.body.removeChild(particle);
    }, 500);
}

// Adicionar classes CSS apenas para o conteúdo dos inputs
const style = document.createElement('style');
style.textContent = `
    .has-content {
        background: rgba(255, 255, 255, 0.95) !important;
    }
    
    /* Garantir que has-content não afete ícones */
    .has-content + .input-icon {
        position: absolute !important;
        left: 16px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 100 !important;
        pointer-events: none !important;
    }
`;
document.head.appendChild(style);
