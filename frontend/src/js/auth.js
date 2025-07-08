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
}

export async function register() {
  const username = document.getElementById('reg-username').value;
  const fullname = document.getElementById('reg-fullname').value;
  const password = document.getElementById('reg-password').value;
  const yearSelect = document.getElementById('year-select').value;
  const classSelect = document.getElementById('class-select').value;

  if (!yearSelect) {
    showWarning('Por favor, selecione seu ano.');
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