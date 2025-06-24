const API_URL = 'http://localhost:3000';

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('isMaster', data.isMaster);

      if (data.isMaster) {
        window.location.href = '/html/master.html';
      } else {
        window.location.href = '/html/student.html';
      }
    } else {
      alert(data.message || 'Usuário ou senha inválidos');
    }
  } catch (err) {
    alert('Erro na conexão com o servidor.');
    console.error(err);
  }
}

async function register() {
  const username = document.getElementById('reg-username').value;
  const fullname = document.getElementById('reg-fullname').value;
  const password = document.getElementById('reg-password').value;
  const userClass = document.getElementById('class-select').value;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fullName: fullname, password, class: userClass })
    });

    const data = await res.json();

    if (res.ok) {
      alert('Conta criada com sucesso! Aguarde aprovação do Mestre.');
      hideRegisterForm();
    } else {
      alert(data.message || 'Erro ao registrar');
    }
  } catch (err) {
    alert('Erro ao conectar com o servidor.');
    console.error(err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/html/login.html';
}

function showRegisterForm() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('register-form').classList.remove('hidden');
}

function hideRegisterForm() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}
