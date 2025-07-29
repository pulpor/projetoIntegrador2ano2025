import { showSuccess, showError, showWarning } from './utils/toast.js';

// src/auth.js
export async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const response = await fetch('http://localhost:3000/auth/login', { // Corrigido para /auth/login
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('isMaster', data.user.isMaster);

      console.log('[DEBUG AUTH] Login realizado com sucesso:', {
        username: data.user.username,
        isMaster: data.user.isMaster,
        token: data.token.substring(0, 20) + '...'
      });

      // Redirecionar baseado no tipo de usuário
      if (data.user.isMaster) {
        window.location.href = '/src/pages/master.html';
      } else {
        window.location.href = '/src/pages/student.html';
      }
    } else {
      showError('Login falhou: ' + data.error);
    }
  } catch (err) {
    console.error('Erro no login:', err);
    showError('Erro ao conectar com o servidor');
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isMaster');
  window.location.href = '/';
}

export function showRegisterForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
}

export function hideRegisterForm() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');

  // Limpar campos e feedback
  document.getElementById('reg-username').value = '';
  document.getElementById('reg-fullname').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('year-select').value = '';
  document.getElementById('class-select').value = '';

  // Esconder feedback
  document.getElementById('username-feedback').classList.add('hidden');
  document.getElementById('password-feedback').classList.add('hidden');
  document.getElementById('password-strength').classList.add('hidden');
}

// Função para calcular força da senha
function calculatePasswordStrength(password) {
  let score = 0;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ];

  score = checks.filter(Boolean).length;

  const levels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return {
    score,
    level: levels[Math.max(0, score - 1)] || 'Muito fraca',
    color: colors[Math.max(0, score - 1)] || 'bg-red-500'
  };
}

// Função para atualizar feedback visual da senha
function updatePasswordFeedback(password) {
  const strengthDiv = document.getElementById('password-strength');
  const strengthText = document.getElementById('password-strength-text');
  const feedbackDiv = document.getElementById('password-feedback');
  const bars = document.querySelectorAll('.password-bar');

  if (password.length === 0) {
    strengthDiv.classList.add('hidden');
    feedbackDiv.classList.add('hidden');
    return;
  }

  strengthDiv.classList.remove('hidden');
  feedbackDiv.classList.remove('hidden');

  const validation = validatePassword(password);
  const strength = calculatePasswordStrength(password);

  // Atualizar barras de força
  bars.forEach((bar, index) => {
    bar.className = 'password-bar flex-1 h-1 rounded ' +
      (index < strength.score ? strength.color : 'bg-gray-200');
  });

  strengthText.textContent = `Força: ${strength.level}`;

  // Mostrar erros específicos
  if (!validation.isValid) {
    feedbackDiv.innerHTML = `<span class="text-red-500">Faltam: ${validation.errors.join(', ')}</span>`;
  } else {
    feedbackDiv.innerHTML = `<span class="text-green-500">✓ Senha válida</span>`;
  }
}

// Função para atualizar feedback do username
function updateUsernameFeedback(username) {
  const feedbackDiv = document.getElementById('username-feedback');

  if (username.length === 0) {
    feedbackDiv.classList.add('hidden');
    return;
  }

  feedbackDiv.classList.remove('hidden');
  const validation = validateUsername(username);

  if (!validation.isValid) {
    feedbackDiv.innerHTML = `<span class="text-red-500">Faltam: ${validation.errors.join(', ')}</span>`;
  } else {
    feedbackDiv.innerHTML = `<span class="text-green-500">✓ Nome de usuário válido</span>`;
  }
}

// Função para validar força da senha
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`pelo menos ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push('pelo menos uma letra maiúscula');
  }
  if (!hasLowerCase) {
    errors.push('pelo menos uma letra minúscula');
  }
  if (!hasNumbers) {
    errors.push('pelo menos um número');
  }
  if (!hasSpecialChar) {
    errors.push('pelo menos um caractere especial (!@#$%^&*etc.)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Função para validar nome de usuário
function validateUsername(username) {
  const minLength = 5;
  const hasValidChars = /^[a-zA-Z0-9_]+$/.test(username);

  const errors = [];

  if (username.length < minLength) {
    errors.push(`pelo menos ${minLength} caracteres`);
  }
  if (!hasValidChars) {
    errors.push('apenas letras, números e underscore (_)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

export async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const password = document.getElementById('reg-password').value;
  const yearSelect = document.getElementById('year-select').value;
  const classSelect = document.getElementById('class-select').value.trim();

  // Validações básicas
  if (!username || !fullname || !password || !classSelect) {
    showError('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  if (!yearSelect) {
    showWarning('Por favor, selecione seu ano.');
    return;
  }

  // Validar nome de usuário
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    showError(`Nome de usuário deve ter: ${usernameValidation.errors.join(', ')}`);
    return;
  }

  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showError(`Senha deve ter: ${passwordValidation.errors.join(', ')}`);
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/auth/register', { // Corrigido para /auth/register
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        fullname,
        password,
        class: classSelect,
        year: parseInt(yearSelect),
        isMaster: false
      }),
    });
    const data = await response.json();
    if (response.ok) {
      showSuccess('Registro bem-sucedido! Sua conta foi criada e aguarda aprovação do mestre. Você receberá acesso após a aprovação.');
      setTimeout(() => hideRegisterForm(), 3000);
    } else {
      showError('Erro no registro: ' + data.error);
    }
  } catch (err) {
    console.error('Erro no registro:', err);
    showError('Erro ao conectar com o servidor');
  }
}

// Função para inicializar validações em tempo real
export function initializeValidationListeners() {
  const usernameInput = document.getElementById('reg-username');
  const passwordInput = document.getElementById('reg-password');

  if (usernameInput) {
    usernameInput.addEventListener('input', (e) => {
      updateUsernameFeedback(e.target.value.trim());
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      updatePasswordFeedback(e.target.value);
    });
  }
}