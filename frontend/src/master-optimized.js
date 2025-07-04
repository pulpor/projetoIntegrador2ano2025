// Importar o CSS para que o Vite processe o Tailwind CSS
import './index.css';

const API_URL = 'http://localhost:3000';

// Variables globais para armazenar dados originais
let originalMissions = [];
let originalSubmissions = [];
let originalStudents = [];

// ====== INICIALIZAÇÃO ======
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOM carregado, iniciando aplicação master');

  if (!validateAuthentication()) return;

  setupLogout();
  setupTabs();
  loadInitialData();
});

function validateAuthentication() {
  const token = localStorage.getItem('token');
  const isMaster = localStorage.getItem('isMaster');

  if (!token || isMaster !== 'true') {
    alert('Acesso negado. Faça login como Mestre.');
    window.location.href = './index.html';
    return false;
  }
  return true;
}

function loadInitialData() {
  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
}

// ====== CONFIGURAÇÃO DE INTERFACE ======
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = './index.html';
    });
  }
}

function setupTabs() {
  const tabs = [
    { id: 'tab-pending', content: 'pending-content', action: () => loadPendingUsers() },
    { id: 'tab-students', content: 'students-content', action: () => { loadApprovedStudents(); setTimeout(setupStudentFilters, 100); } },
    { id: 'tab-submissions', content: 'submissions-content', action: () => { loadSubmissions(); setTimeout(setupSubmissionFilters, 100); } },
    { id: 'tab-missions', content: 'missions-content', action: () => { loadMissions(); setTimeout(setupMissionFilters, 100); } }
  ];

  tabs.forEach(({ id, content, action }, index) => {
    const tab = document.getElementById(id);
    if (tab) {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveTab(id, content);
        action();
      });
    }
  });
}

function setActiveTab(activeId, activeContent) {
  // Remove active de todas as abas
  ['tab-pending', 'tab-students', 'tab-submissions', 'tab-missions'].forEach(id => {
    const tab = document.getElementById(id);
    if (tab) {
      tab.classList.remove('active', 'border-b-2', 'border-purple-500', 'text-purple-600');
      tab.classList.add('text-gray-500');
    }
  });

  // Esconde todo conteúdo
  ['pending-content', 'students-content', 'submissions-content', 'missions-content'].forEach(id => {
    const content = document.getElementById(id);
    if (content) content.classList.add('hidden');
  });

  // Ativa aba e conteúdo selecionados
  const activeTab = document.getElementById(activeId);
  const activeContentEl = document.getElementById(activeContent);
  
  if (activeTab) {
    activeTab.classList.remove('text-gray-500');
    activeTab.classList.add('active', 'border-b-2', 'border-purple-500', 'text-purple-600');
  }
  if (activeContentEl) activeContentEl.classList.remove('hidden');
}

// ====== FUNÇÕES DE API ======
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(`HTTP ${response.status}: ${error.error || response.statusText}`);
  }
  
  return response.json();
}

// ====== GERENCIAMENTO DE USUÁRIOS ======
async function loadPendingUsers() {
  try {
    const data = await apiRequest('/usuarios/pending-users');
    renderPendingUsers(data);
  } catch (err) {
    console.error('Erro ao carregar usuários pendentes:', err);
    showError('pending-users', err.message);
  }
}

async function loadApprovedStudents() {
  try {
    const data = await apiRequest('/usuarios/approved-students');
    originalStudents = data;
    
    const hasActiveFilters = checkActiveFilters('student');
    if (hasActiveFilters) {
      applyStudentFilters();
    } else {
      renderStudents(data);
    }
  } catch (err) {
    console.error('Erro ao carregar alunos:', err);
    showError('students-list', err.message);
  }
}

function renderPendingUsers(users) {
  const container = document.getElementById('pending-users');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhum usuário pendente encontrado.</p>';
    return;
  }

  container.innerHTML = users.map(user => createUserCard(user)).join('');
  setupUserActionButtons();
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhum aluno encontrado.</p>';
    return;
  }

  container.innerHTML = students.map(student => createStudentCard(student)).join('');
  setupStudentActionButtons();
}

function createUserCard(user) {
  return `
    <div class="bg-white p-4 rounded-lg shadow">
      <h3 class="font-bold text-lg">${user.username}</h3>
      <p class="text-gray-600">Nome: ${user.fullname || 'Não informado'}</p>
      <p class="text-gray-600">Classe: ${user.class || 'Não definida'}</p>
      <div class="mt-4 flex space-x-2">
        <button class="approve-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" data-user-id="${user.id}">
          <i class="fas fa-check mr-1"></i> Aprovar
        </button>
        <button class="reject-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded" data-user-id="${user.id}">
          <i class="fas fa-times mr-1"></i> Rejeitar
        </button>
      </div>
    </div>
  `;
}

function createStudentCard(student) {
  const yearLabels = { 1: '1º ano - Front-end', 2: '2º ano - Back-end', 3: '3º ano - Mobile' };
  const yearDisplay = (student.year !== null && student.year !== undefined) ? 
    (yearLabels[student.year] || `${student.year}º ano`) : 'Ano não definido';

  let progressDisplay = '';
  if (student.levelInfo && !student.levelInfo.isMaxLevel) {
    const info = student.levelInfo;
    progressDisplay = `
      <div class="text-xs text-gray-600">
        Progresso: ${info.xpProgressInCurrentLevel}/${info.xpNeededForCurrentLevel} XP (${info.progressPercentage}%)
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div class="bg-blue-500 h-2 rounded-full" style="width: ${info.progressPercentage}%"></div>
      </div>
    `;
  } else if (student.levelInfo?.isMaxLevel) {
    progressDisplay = '<div class="text-xs text-green-600 font-medium">NÍVEL MÁXIMO ATINGIDO!</div>';
  }

  return `
    <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4">
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${student.username}</h3>
          <p class="text-gray-600">Ano: ${yearDisplay}</p>
          <p class="text-gray-600">Classe: ${student.class || 'Não definida'}</p>
          <p class="text-gray-600">Nível: ${student.level || 1}</p>
          <p class="text-gray-600">XP Total: ${student.xp || 0}</p>
          ${progressDisplay}
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex space-x-2">
            <button data-student-id="${student.id}" class="penalty-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-minus-circle mr-1"></i> Penalidade
            </button>
            <button data-student-id="${student.id}" class="reward-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-plus-circle mr-1"></i> Recompensa
            </button>
          </div>
          <button data-student-id="${student.id}" class="expel-btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
            <i class="fas fa-user-times mr-1"></i> Expulsar Aluno
          </button>
        </div>
      </div>
    </div>
  `;
}

// ====== AÇÕES DE USUÁRIOS ======
function setupUserActionButtons() {
  setupEventListeners('.approve-btn', async (e) => {
    const userId = e.target.closest('button').getAttribute('data-user-id');
    await userAction('approve-user', { userId: parseInt(userId) }, 'Usuário aprovado com sucesso!');
    loadPendingUsers();
    loadApprovedStudents();
  });

  setupEventListeners('.reject-btn', async (e) => {
    if (!confirm('Tem certeza que deseja rejeitar este usuário?')) return;
    const userId = e.target.closest('button').getAttribute('data-user-id');
    await userAction('reject-user', { userId: parseInt(userId) }, 'Usuário rejeitado com sucesso!');
    loadPendingUsers();
  });
}

function setupStudentActionButtons() {
  setupEventListeners('.penalty-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    const penalty = prompt('Digite a quantidade de XP a ser removida:');
    if (penalty && !isNaN(penalty) && parseInt(penalty) > 0) {
      await userAction('penalty', { studentId: parseInt(studentId), penalty: parseInt(penalty) }, 
        `Penalidade aplicada! ${penalty} XP removido.`);
      loadApprovedStudents();
    }
  });

  setupEventListeners('.reward-btn', () => {
    alert('Funcionalidade de recompensa em desenvolvimento.');
  });

  setupEventListeners('.expel-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;
    
    if (confirm(`Tem certeza que deseja expulsar "${studentName}"?`) && 
        confirm('CONFIRMAÇÃO FINAL: Esta ação não pode ser desfeita!')) {
      await userAction('expel-student', { studentId: parseInt(studentId) }, 'Aluno expulso com sucesso!');
      loadApprovedStudents();
    }
  });
}

async function userAction(endpoint, data, successMessage) {
  try {
    await apiRequest(`/usuarios/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    alert(successMessage);
  } catch (err) {
    console.error(`Erro na ação ${endpoint}:`, err);
    alert(`Erro: ${err.message}`);
  }
}

// ====== GERENCIAMENTO DE SUBMISSÕES ======
async function loadSubmissions() {
  try {
    const submissions = await apiRequest('/submissoes');
    
    // Adicionar campo status baseado em pending e approved
    submissions.forEach(sub => {
      sub.status = sub.pending ? 'pending' : sub.approved ? 'approved' : 'rejected';
      if (!sub.createdAt && sub.submittedAt) sub.createdAt = sub.submittedAt;
    });

    originalSubmissions = submissions;
    
    const hasActiveFilters = checkActiveFilters('submission');
    if (hasActiveFilters) {
      applySubmissionFilters();
    } else {
      renderSubmissions(submissions);
    }
  } catch (err) {
    console.error('Erro ao carregar submissões:', err);
    showError('submissions-list', err.message);
  }
}

function renderSubmissions(submissions) {
  const container = document.getElementById('submissions-list');
  if (!container) return;

  if (submissions.length === 0) {
    container.innerHTML = '<p class="text-gray-500">Nenhuma submissão encontrada.</p>';
    return;
  }

  container.innerHTML = submissions.map(submission => createSubmissionCard(submission)).join('');
  setupSubmissionButtons();
}

function createSubmissionCard(submission) {
  const statusClasses = {
    pending: 'border-yellow-400 bg-yellow-100 text-yellow-800',
    approved: 'border-green-400 bg-green-100 text-green-800',
    rejected: 'border-red-400 bg-red-100 text-red-800'
  };

  const statusTexts = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };
  
  return `
    <div class="bg-white p-6 rounded-lg shadow border-l-4 ${statusClasses[submission.status].split(' ')[0]}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800">${submission.missionTitle || 'Missão Desconhecida'}</h3>
          <p class="text-sm text-gray-600 mb-2">Aluno: <span class="font-medium">${submission.username || 'Desconhecido'}</span></p>
          <p class="text-sm text-gray-600 mb-2">Enviado em: ${new Date(submission.submittedAt).toLocaleString('pt-BR')}</p>
          <p class="text-sm text-gray-600 mb-2">XP: <span class="font-medium text-purple-600">${submission.xp}</span></p>
          <div class="mt-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[submission.status]}">
              ${statusTexts[submission.status]}
            </span>
          </div>
        </div>
        ${submission.status === 'pending' ? `
          <div class="flex space-x-2 ml-4">
            <button class="approve-submission-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" data-submission-id="${submission.id}">
              <i class="fas fa-check mr-1"></i> Aprovar
            </button>
            <button class="reject-submission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-submission-id="${submission.id}">
              <i class="fas fa-times mr-1"></i> Rejeitar
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function setupSubmissionButtons() {
  setupEventListeners('.approve-submission-btn', async (e) => {
    const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));
    await submissionAction(submissionId, 'approve', 'Submissão aprovada com sucesso!');
  });

  setupEventListeners('.reject-submission-btn', async (e) => {
    const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));
    await submissionAction(submissionId, 'reject', 'Submissão rejeitada com sucesso!');
  });
}

async function submissionAction(submissionId, action, successMessage) {
  try {
    await apiRequest(`/submissoes/${submissionId}/${action}`, { method: 'POST' });
    alert(successMessage);
    loadSubmissions();
  } catch (err) {
    console.error(`Erro ao ${action} submissão:`, err);
    alert(`Erro: ${err.message}`);
  }
}

// ====== GERENCIAMENTO DE MISSÕES ======
async function loadMissions() {
  try {
    const missions = await apiRequest('/missoes');
    originalMissions = missions;
    renderMissions(missions);
  } catch (err) {
    console.error('Erro ao carregar missões:', err);
    showError('missions-list', err.message);
  }
}

function renderMissions(missions) {
  const container = document.getElementById('missions-list');
  if (!container) return;

  if (missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada.</p>';
    return;
  }

  container.innerHTML = missions.map(mission => createMissionCard(mission)).join('');
  setupMissionButtons();
}

function createMissionCard(mission) {
  const yearLabels = { 1: '1º ano - Front-end', 2: '2º ano - Back-end', 3: '3º ano - Mobile' };
  
  let targetInfo = '';
  if (mission.targetYear) {
    targetInfo += `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">${yearLabels[mission.targetYear]}</span>`;
  } else {
    targetInfo += `<span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-2">Todos os anos</span>`;
  }

  if (mission.targetClass === 'geral') {
    targetInfo += `<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Todas as classes</span>`;
  } else {
    targetInfo += `<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">${mission.targetClass}</span>`;
  }

  return `
    <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4">
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${mission.title}</h3>
          <p class="text-gray-600 mb-2">${mission.description}</p>
          <div class="mb-2">${targetInfo}</div>
          <p class="text-green-600 font-medium">XP: ${mission.xp}</p>
        </div>
        <div class="flex space-x-2 ml-4">
          <button data-mission-id="${mission.id}" class="edit-mission-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
            <i class="fas fa-edit mr-1"></i> Editar
          </button>
          <button data-mission-id="${mission.id}" class="delete-mission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
            <i class="fas fa-trash mr-1"></i> Excluir
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupMissionButtons() {
  setupEventListeners('.edit-mission-btn', async (e) => {
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    // Implementar edição de missão aqui
    console.log('Editar missão:', missionId);
  });

  setupEventListeners('.delete-mission-btn', async (e) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return;
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    await missionAction(missionId, 'DELETE', 'Missão excluída com sucesso!');
  });
}

async function missionAction(missionId, method, successMessage) {
  try {
    await apiRequest(`/missoes/${missionId}`, { method });
    alert(successMessage);
    loadMissions();
  } catch (err) {
    console.error('Erro na ação de missão:', err);
    alert(`Erro: ${err.message}`);
  }
}

// ====== SISTEMA DE FILTROS ======
function setupStudentFilters() {
  setupFilters('student', applyStudentFilters, clearStudentFilters);
}

function setupSubmissionFilters() {
  setupFilters('submission', applySubmissionFilters, clearSubmissionFilters);
  loadMissionsForFilter();
}

function setupMissionFilters() {
  setupFilters('mission', applyMissionFilters, clearMissionFilters);
}

function setupFilters(type, applyFn, clearFn) {
  const applyBtn = document.getElementById(`apply-${type}-filters`);
  const clearBtn = document.getElementById(`clear-${type}-filters`);

  if (applyBtn && clearBtn) {
    applyBtn.removeEventListener('click', applyFn);
    clearBtn.removeEventListener('click', clearFn);
    applyBtn.addEventListener('click', applyFn);
    clearBtn.addEventListener('click', clearFn);
  }
}

function applyStudentFilters() {
  const filters = getFilterValues('student');
  let filtered = [...originalStudents];

  if (filters.year) filtered = filtered.filter(s => s.year == filters.year);
  if (filters.class) filtered = filtered.filter(s => s.class === filters.class);
  if (filters.name) filtered = filtered.filter(s => s.username?.toLowerCase().includes(filters.name.toLowerCase()));
  if (filters.xp) filtered = filtered.filter(s => filterByXpRange(s.xp || 0, filters.xp));

  renderStudents(filtered);
}

function applySubmissionFilters() {
  const filters = getFilterValues('submission');
  let filtered = [...originalSubmissions];

  if (filters.status) filtered = filtered.filter(s => s.status === filters.status);
  if (filters.student) filtered = filtered.filter(s => s.username?.toLowerCase().includes(filters.student.toLowerCase()));
  if (filters.mission) filtered = filtered.filter(s => s.missionId == filters.mission);
  if (filters.date) {
    filtered = filtered.filter(s => {
      const submissionDate = new Date(s.createdAt).toISOString().split('T')[0];
      return submissionDate === filters.date;
    });
  }

  renderSubmissions(filtered);
}

function applyMissionFilters() {
  const filters = getFilterValues('mission');
  let filtered = [...originalMissions];

  if (filters.year) filtered = filtered.filter(m => m.targetYear == filters.year);
  if (filters.class) filtered = filtered.filter(m => m.targetClass === filters.class);
  if (filters.xp) filtered = filtered.filter(m => filterByXpRange(m.xp, filters.xp));

  renderMissions(filtered);
}

function getFilterValues(type) {
  const filters = {};
  const elements = document.querySelectorAll(`[id^="filter-${type}-"]`);
  
  elements.forEach(el => {
    const key = el.id.replace(`filter-${type}-`, '');
    filters[key] = el.value;
  });
  
  return filters;
}

function clearStudentFilters() {
  clearFilterValues('student');
  renderStudents(originalStudents);
}

function clearSubmissionFilters() {
  clearFilterValues('submission');
  renderSubmissions(originalSubmissions);
}

function clearMissionFilters() {
  clearFilterValues('mission');
  renderMissions(originalMissions);
}

function clearFilterValues(type) {
  const elements = document.querySelectorAll(`[id^="filter-${type}-"]`);
  elements.forEach(el => el.value = '');
}

function checkActiveFilters(type) {
  const filters = getFilterValues(type);
  return Object.values(filters).some(value => value);
}

function filterByXpRange(xp, range) {
  switch (range) {
    case '0-100': return xp >= 0 && xp <= 100;
    case '101-300': return xp >= 101 && xp <= 300;
    case '301-600': return xp >= 301 && xp <= 600;
    case '601-1000': return xp >= 601 && xp <= 1000;
    case '1001+': return xp >= 1001;
    case '0-50': return xp >= 0 && xp <= 50;
    case '51-100': return xp >= 51 && xp <= 100;
    case '101-200': return xp >= 101 && xp <= 200;
    case '201+': return xp >= 201;
    default: return true;
  }
}

function loadMissionsForFilter() {
  const select = document.getElementById('filter-submission-mission');
  if (!select) return;

  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  originalMissions.forEach(mission => {
    const option = document.createElement('option');
    option.value = mission.id;
    option.textContent = mission.title;
    select.appendChild(option);
  });
}

// ====== UTILITÁRIOS ======
function setupEventListeners(selector, handler) {
  document.addEventListener('click', (e) => {
    if (e.target.closest(selector)) {
      handler(e);
    }
  });
}

function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="text-red-500 py-4">Erro: ${message}</p>`;
  }
}

console.log('[DEBUG] Master.js otimizado carregado');
