const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  loadPendingUsers();
  setupTabs();
});

async function loadPendingUsers() {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/pendentes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      const container = document.getElementById('pending-users');
      container.innerHTML = '';

      data.forEach(user => {
        const card = document.createElement('div');
        card.className = 'p-4 bg-white rounded shadow';
        card.innerHTML = `
          <p><strong>${user.username}</strong> - ${user.class}</p>
          <button onclick="aprovarUsuario(${user.id})" class="mt-2 bg-green-500 text-white px-3 py-1 rounded">Aprovar</button>
        `;
        container.appendChild(card);
      });
    } else {
      alert('Erro ao buscar usuários pendentes');
    }
  } catch (err) {
    console.error(err);
  }
}

async function aprovarUsuario(id) {
  const token = localStorage.getItem('token');
  await fetch(`${API_URL}/usuarios/aprovar/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  loadPendingUsers(); // recarrega
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-blue-600', 'text-purple-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-purple-600');
      contents[index].classList.remove('hidden');
    });
  });
}
