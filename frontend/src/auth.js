// Sistema de notificações Toast inline (para evitar problemas de import)
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "fixed top-4 right-4 z-[9999] space-y-2";
      document.body.appendChild(this.container);
    }
  },

  show(message, type = "info", duration = 3000) {
    this.init();

    const config = {
      success: { class: "bg-green-500", icon: "fas fa-check-circle" },
      error: { class: "bg-red-500", icon: "fas fa-exclamation-circle" },
      warning: { class: "bg-yellow-500", icon: "fas fa-exclamation-triangle" },
      info: { class: "bg-blue-500", icon: "fas fa-info-circle" }
    }[type] || { class: "bg-gray-500", icon: "fas fa-bell" };

    const toast = document.createElement("div");
    toast.className = `${config.class} text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0 flex items-center space-x-2 min-w-[300px]`;
    toast.innerHTML = `
            <i class="${config.icon}"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-x-full", "opacity-0");
    }, 10);

    setTimeout(() => {
      toast.classList.add("translate-x-full", "opacity-0");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  },

  success(message, duration = 3000) { this.show(message, "success", duration); },
  error(message, duration = 4000) { this.show(message, "error", duration); },
  warning(message, duration = 3500) { this.show(message, "warning", duration); },
  info(message, duration = 3000) { this.show(message, "info", duration); }
};

// src/auth.js
export async function login() {
  console.log('🔐 Iniciando processo de login...');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  console.log('📝 Dados do login:', { username, password: password ? '***' : 'vazio' });

  // Validação básica
  if (!username || !password) {
    Toast.warning('Por favor, preencha todos os campos');
    return;
  }

  // Mostrar loading
  const loginButton = document.getElementById('loginButton');
  if (!loginButton) {
    Toast.error('Erro: Botão de login não encontrado');
    return;
  }

  const originalText = loginButton.innerHTML;
  loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Entrando...';
  loginButton.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
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

      Toast.success(`Bem-vindo(a), ${data.user.username}!`);

      // Aguardar um momento para o toast aparecer antes do redirecionamento
      setTimeout(() => {
        // Redirecionar baseado no tipo de usuário
        if (data.user.isMaster) {
          window.location.href = './master.html';
        } else {
          window.location.href = './student.html';
        }
      }, 800);
    } else {
      Toast.error(data.error || 'Credenciais inválidas');

      // Restaurar botão
      loginButton.innerHTML = originalText;
      loginButton.disabled = false;
    }
  } catch (err) {
    console.error('Erro no login:', err);
    Toast.error('Erro ao conectar com o servidor. Verifique sua conexão.');

    // Restaurar botão
    loginButton.innerHTML = originalText;
    loginButton.disabled = false;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isMaster');
  Toast.info('Logout realizado com sucesso');
  setTimeout(() => {
    window.location.href = './index.html';
  }, 500);
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
  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const yearSelect = document.getElementById('year-select').value;
  const classSelect = document.getElementById('class-select').value;

  // Validações
  if (!username || !fullname || !password) {
    Toast.warning('Por favor, preencha todos os campos obrigatórios');
    return;
  }

  if (!yearSelect) {
    Toast.warning('Por favor, selecione seu ano');
    return;
  }

  if (!classSelect) {
    Toast.warning('Por favor, selecione sua classe');
    return;
  }

  if (password.length < 6) {
    Toast.warning('A senha deve ter pelo menos 6 caracteres');
    return;
  }

  // Mostrar loading
  const registerButton = document.getElementById('registerSubmitButton');
  if (!registerButton) {
    Toast.error('Erro: Botão de registro não encontrado');
    return;
  }

  const originalText = registerButton.innerHTML;
  registerButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cadastrando...';
  registerButton.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/auth/register', {
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
      Toast.success('Registro bem-sucedido! Sua conta foi criada e aguarda aprovação do mestre.', 5000);
      setTimeout(() => {
        hideRegisterForm();
      }, 1000);
    } else {
      Toast.error(data.error || 'Erro no registro');
    }
  } catch (err) {
    console.error('Erro no registro:', err);
    Toast.error('Erro ao conectar com o servidor. Verifique sua conexão.');
  } finally {
    // Restaurar botão
    if (registerButton) {
      registerButton.innerHTML = originalText;
      registerButton.disabled = false;
    }
  }
}

// Função para lidar com tecla Enter no formulário de login
export function handleLoginKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    login();
  }
}

// Função para lidar com tecla Enter no formulário de registro
export function handleRegisterKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    register();
  }
}

// Função para configurar todos os event listeners
export function setupEventListeners() {
  // Event listeners para botões
  document.getElementById("loginButton").addEventListener("click", login);
  document.getElementById("registerButton").addEventListener("click", showRegisterForm);
  document.getElementById("backButton").addEventListener("click", hideRegisterForm);
  document.getElementById("registerSubmitButton").addEventListener("click", register);

  // Event listeners para tecla Enter no login
  document.getElementById("username").addEventListener("keypress", handleLoginKeyPress);
  document.getElementById("password").addEventListener("keypress", handleLoginKeyPress);

  // Event listeners para tecla Enter no registro
  document.getElementById("reg-username").addEventListener("keypress", handleRegisterKeyPress);
  document.getElementById("reg-fullname").addEventListener("keypress", handleRegisterKeyPress);
  document.getElementById("reg-password").addEventListener("keypress", handleRegisterKeyPress);

  console.log("✅ Event listeners configurados para login e registro");
}