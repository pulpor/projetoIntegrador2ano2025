import { apiRequest } from '../utils/auth.js';
import { showError, showSuccess } from '../utils/toast.js';

export let pendingUsersCache = [];

// Configura criação de turmas (form) e carrega cache do servidor
export function setupTurmas() {
  const form = document.getElementById('form-criar-turma');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById('nome-turma');
      const nome = input.value.trim();
      if (!nome) return;
      addTurma(nome);
      input.value = '';
      renderTurmas();
      loadPendingUsers();
    };
  }

  // tentar carregar turmas do backend e armazenar em cache no DOM
  (async () => {
    try {
      const res = await apiRequest('/usuarios/turmas');
      document.body.dataset.turmasCache = JSON.stringify(res.turmas || []);
      localStorage.setItem('turmas_' + localStorage.getItem('username'), JSON.stringify(res.turmas || []));
    } catch (err) {
      const masterUsername = localStorage.getItem('username');
      const turmas = JSON.parse(localStorage.getItem('turmas_' + masterUsername) || '[]');
      document.body.dataset.turmasCache = JSON.stringify(turmas || []);
    }
  })();
}

export function getTurmas() {
  const masterUsername = localStorage.getItem('username');
  if (!masterUsername) return [];
  try {
    const cached = document.body.dataset.turmasCache;
    if (cached) return JSON.parse(cached);
  } catch (e) { /* ignore */ }
  const turmas = JSON.parse(localStorage.getItem('turmas_' + masterUsername) || '[]');
  return turmas;
}

export function addTurma(nome) {
  (async () => {
    try {
      const res = await apiRequest('/usuarios/turmas', {
        method: 'POST',
        body: JSON.stringify({ nome })
      });
      document.body.dataset.turmasCache = JSON.stringify(res.turmas || []);
      localStorage.setItem('turmas_' + localStorage.getItem('username'), JSON.stringify(res.turmas || []));
    } catch (err) {
      const masterUsername = localStorage.getItem('username');
      if (!masterUsername) return;
      let turmas = JSON.parse(localStorage.getItem('turmas_' + masterUsername) || '[]');
      if (!turmas.includes(nome)) turmas.push(nome);
      localStorage.setItem('turmas_' + masterUsername, JSON.stringify(turmas));
    }
  })();
}

const normalize = (v) => {
  if (!v) return '';
  try {
    return v.toString().trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  } catch (e) {
    return v.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
};

export function renderTurmas() {
  const turmas = getTurmas();
  const lista = document.getElementById('lista-turmas');
  if (!lista) return;

  const alunosPorTurma = {};
  const usersByTurma = {};
  const addUser = (usr) => {
    const name = normalize(usr.class || usr.turma || usr.assignedTurma || usr.assigned_class);
    if (!name) return;
    alunosPorTurma[name] = (alunosPorTurma[name] || 0) + 1;
    usersByTurma[name] = usersByTurma[name] || [];
    usersByTurma[name].push(usr);
  };
  // usar cache local de alunos pendentes + aprovados expostos globalmente se necessário
  (window.originalStudents || []).forEach(s => addUser(s));
  (pendingUsersCache || []).forEach(u => addUser(u));

  if (!turmas || turmas.length === 0) {
    lista.innerHTML = '<div class="text-gray-400">Nenhuma turma criada ainda.</div>';
    return;
  }

  lista.innerHTML = turmas.map(t => {
    const key = normalize(t);
    const count = alunosPorTurma[key] || 0;
    const users = usersByTurma[key] || [];
    const preview = users.slice(0,3).map(u => u.username || u.fullname || u.id).join(', ');
    const more = users.length > 3 ? ` +${users.length - 3}...` : '';
    return `
  <div class="student-card p-4 rounded-xl border border-gray-100 shadow hover:shadow-lg" data-turma="${t}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">${t.charAt(0).toUpperCase()}</div>
            <div>
              <div class="font-bold">${t}</div>
              <div class="text-sm text-gray-500">${preview}${more}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="badge">${count}</div>
            <button class="remove-turma-btn text-red-500 hover:text-red-700" data-turma="${t}" title="Remover turma"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  // events
  lista.querySelectorAll('.remove-turma-btn').forEach(btn => {
    btn.onclick = async () => {
      const turma = btn.dataset.turma;
      if (!confirm(`Remover turma "${turma}"? Esta ação não remove alunos.`)) return;
      try {
        await apiRequest('/usuarios/turmas', { method: 'DELETE', body: JSON.stringify({ nome: turma }) });
        const cached = JSON.parse(document.body.dataset.turmasCache || '[]');
        document.body.dataset.turmasCache = JSON.stringify((cached || []).filter(t => t !== turma));
        localStorage.setItem('turmas_' + localStorage.getItem('username'), document.body.dataset.turmasCache);
      } catch (err) {
        const masterUsername = localStorage.getItem('username');
        let turmasAtual = JSON.parse(localStorage.getItem('turmas_' + masterUsername) || '[]');
        turmasAtual = turmasAtual.filter(t => t !== turma);
        localStorage.setItem('turmas_' + masterUsername, JSON.stringify(turmasAtual));
      }
      renderTurmas();
      loadPendingUsers();
    };
  });

  lista.querySelectorAll('.student-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.remove-turma-btn')) return;
      const turma = card.dataset.turma;
      if (turma) openTurmaModal(turma);
    });
  });
}

export function getUsersForTurma(turmaName) {
  const key = normalize(turmaName);
  const all = [];
  (window.originalStudents || []).forEach(s => { if (normalize(s.class || s.turma) === key) all.push(s); });
  (pendingUsersCache || []).forEach(p => { if (normalize(p.class || p.turma) === key) all.push(p); });
  return all;
}

export function openTurmaModal(turmaName) {
  const modal = document.getElementById('turma-modal');
  const title = document.getElementById('turma-modal-title');
  const countEl = document.getElementById('turma-modal-count');
  const listEl = document.getElementById('turma-modal-list');
  if (!modal || !title || !countEl || !listEl) return;
  const users = getUsersForTurma(turmaName);
  title.textContent = turmaName;
  countEl.textContent = users.length;
  listEl.innerHTML = '';
  if (users.length === 0) {
    listEl.innerHTML = '<li class="text-gray-500">Nenhum aluno nessa turma.</li>';
  } else {
    users.forEach(u => {
      const name = u.fullname || u.username || (`ID:${u.id}`);
      const el = document.createElement('li');
      el.textContent = name + (u.pending ? ' (pendente)' : '');
      listEl.appendChild(el);
    });
  }
  modal.classList.remove('hidden');
}

export function hideTurmaModal() {
  const modal = document.getElementById('turma-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

// fechar modal quando clicar no botão ou backdrop
document.addEventListener('click', (e) => {
  const closeBtn = document.getElementById('turma-modal-close');
  const backdrop = document.getElementById('turma-modal-backdrop');
  if (closeBtn && e.target === closeBtn) hideTurmaModal();
  if (backdrop && e.target === backdrop) hideTurmaModal();
});

function showErrorContainer(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="text-red-500 py-4">Erro: ${message}</p>`;
  }
  showError(message);
}

export async function loadPendingUsers() {
  try {
    const masterUsername = localStorage.getItem('username');
    const res = await fetch('http://localhost:3000/usuarios/pending-users', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const contentType = res.headers.get('content-type');
    console.log('[FRONTEND] GET /usuarios/pending-users ->', { status: res.status, ok: res.ok, contentType });
    if (!res.ok || !contentType || !contentType.includes('application/json')) {
      const text = await res.text().catch(() => '<no body>');
      console.error('[FRONTEND] resposta inesperada de pending-users', { status: res.status, body: text });
      throw new Error('Resposta do servidor não é JSON. Verifique o endpoint /usuarios/pending-users.');
    }
    const allUsers = await res.json();
    pendingUsersCache = allUsers || [];
    const filtered = getPendingUsersForMaster(allUsers, masterUsername);
    renderPendingUsersSpecifique(filtered);
    renderTurmas();
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')) {
      showErrorContainer('pending-users', 'Não foi possível conectar ao servidor backend. Verifique se o backend está rodando na porta 3000.');
    } else {
      showErrorContainer('pending-users', err.message);
    }
  }
}

export function getPendingUsersForMaster(allUsers, masterUsername) {
  return (allUsers || []).filter(u => u.pending && u.masterUsername === masterUsername);
}

export function renderPendingUsersSpecifique(users) {
  const container = document.getElementById('pending-users');
  if (!container) return;
  container.innerHTML = '';
  const turmas = getTurmas();
  const noTurmas = !turmas || turmas.length === 0;

  if (noTurmas) {
    container.innerHTML += `
      <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center justify-between">
        <div>Você ainda não criou turmas. Crie uma turma para poder aprovar usuários pendentes.</div>
        <button id="quick-create-turma" class="ml-4 bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded">Criar turma</button>
      </div>
    `;
    setTimeout(() => {
      const quickBtn = document.getElementById('quick-create-turma');
      if (quickBtn) quickBtn.onclick = () => { const input = document.getElementById('nome-turma'); if (input) input.focus(); };
    }, 50);
  }

  if (!users || users.length === 0) {
    container.innerHTML += '<div class="text-gray-500 text-center py-6">Nenhum usuário pendente para sua área.</div>';
    return;
  }

  const turmasForSelect = turmas || [];
  users.forEach(user => {
    container.innerHTML += `
      <div class="card bg-white p-4 rounded-lg shadow mb-4">
        <h3 class="font-bold mb-2">${user.fullname} (${user.username})</h3>
        <p class="text-gray-600">Curso: ${user.curso || ''}</p>
        <p class="text-gray-600">Classe: ${user.class || ''}</p>
        <div class="mt-2"><span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pendente</span></div>
        <div class="mt-4 flex gap-2 items-center">
          <select class="select-turma border rounded px-2 py-1" data-user-id="${user.id}" ${noTurmas ? 'disabled' : ''}>
            <option value="">Selecione a turma</option>
            ${turmasForSelect.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <button ${noTurmas ? 'disabled' : ''} class="approve-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" data-user-id="${user.id}">
            <i class="fas fa-check mr-1"></i> Aprovar
          </button>
          <button class="reject-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded" data-user-id="${user.id}">
            <i class="fas fa-times mr-1"></i> Rejeitar
          </button>
        </div>
      </div>
    `;
  });

  container.querySelectorAll('.approve-btn').forEach(btn => {
    btn.onclick = async () => {
      const select = container.querySelector(`.select-turma[data-user-id="${btn.dataset.userId}"]`);
      const turma = select ? select.value : "";
      if (!turma) {
        showError('Selecione uma turma para aprovar o usuário!');
        if (select) select.classList.add('border-red-500');
        if (select) select.focus();
        return;
      }
      await approveUser(btn.dataset.userId, turma);
    };
  });
  container.querySelectorAll('.reject-btn').forEach(btn => {
    btn.onclick = async () => {
      await rejectUser(btn.dataset.userId);
    };
  });
}

export async function approveUser(userId, turma) {
  try {
    if (!turma) throw new Error('Selecione uma turma para aprovar o usuário!');
    const res = await fetch('http://localhost:3000/usuarios/approve-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ userId, turma })
    });
    if (!res.ok) throw new Error('Erro ao aprovar usuário');
    showSuccess('Usuário aprovado!');
    await loadPendingUsers();
    if (window.loadApprovedStudents) await window.loadApprovedStudents();
  } catch (err) {
    showError('Erro ao aprovar usuário: ' + err.message);
  }
}

export async function rejectUser(userId) {
  try {
    const res = await fetch('http://localhost:3000/usuarios/reject-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ userId })
    });
    if (!res.ok) throw new Error('Erro ao rejeitar usuário');
    showSuccess('Usuário rejeitado!');
    await loadPendingUsers();
    if (window.loadApprovedStudents) await window.loadApprovedStudents();
  } catch (err) {
    showError('Erro ao rejeitar usuário: ' + err.message);
  }
}
