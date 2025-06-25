const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const isMaster = localStorage.getItem('isMaster');

  if (!token || isMaster !== 'true') {
    alert('Acesso negado. Faça login como Mestre.');
    window.location.href = '../html/login.html';
    return;
  }

  loadPendingUsers();
  setupTabs();
});


async function loadPendingUsers() {
  const token = localStorage.getItem('token');
  console.log('[DEBUG] Token recuperado:', token);

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    window.location.href = '../html/login.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/usuarios/pending-users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (res.ok) {
      const container = document.getElementById('pending-users');
      container.innerHTML = '';

      if (data.length === 0) {
        container.innerHTML = '<p class="text-gray-500 py-4">Nenhum usuário pendente encontrado.</p>';

      } else {
        console.log('[FRONTEND] Renderizando usuários pendentes');
        data.forEach(user => {
          const card = document.createElement('div');
          card.className = 'bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4';
          card.innerHTML = `
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-bold text-lg">${user.username}</h3>
                <p class="text-gray-600">Classe: ${user.class || 'Não definida'}</p>
              </div>
              <div class="flex space-x-2">
                <button onclick="aprovarUsuario(${user.id})" 
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition">
                  <i class="fas fa-check mr-2"></i>Aprovar
                </button>
                <button onclick="rejeitarUsuario(${user.id})" 
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition">
                  <i class="fas fa-times mr-2"></i>Rejeitar
                </button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } else {
      alert('Erro ao buscar usuários pendentes: ' + (data.message || data.error));
    }
  } catch (err) {
    alert('Erro ao conectar com o servidor. Verifique o console para mais detalhes.');
  }
}

async function aprovarUsuario(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/approve-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: id })
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da aprovação:', data);

    if (res.ok) {
      alert('Usuário aprovado com sucesso!');
      loadPendingUsers(); // Recarrega a lista
    } else {
      alert('Erro ao aprovar usuário: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[FRONTEND] Erro ao aprovar usuário:', err);
    alert('Erro ao conectar com o servidor');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-purple-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-purple-600');
      contents[index].classList.remove('hidden');
    });
  });
}