// Importar o CSS para que o Vite processe o Tailwind CSS
import '../css/main.css';

// Importar módulos utilitários 
import { validateAuthentication, apiRequest } from './utils/auth.js';
import { setupTabs, setupLogout } from './utils/interface.js';
import { showPenaltyRewardModal, showStudentHistoryModal } from './utils/modals.js';
import { setupButtons } from './utils/buttons.js';

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
  setupButtons();
});

function loadInitialData() {
  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
  setupMissionCreation();
}

// ====== FUNÇÕES DE CARREGAMENTO DE DADOS ======
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

async function loadSubmissions() {
  try {
    const data = await apiRequest('/submissoes');
    originalSubmissions = data;

    const hasActiveFilters = checkActiveFilters('submission');
    if (hasActiveFilters) {
      applySubmissionFilters();
    } else {
      renderSubmissions(data);
    }
  } catch (err) {
    console.error('Erro ao carregar submissões:', err);
    showError('submissions-list', err.message);
  }
}

async function loadMissions() {
  try {
    const data = await apiRequest('/missoes');
    originalMissions = data;

    const hasActiveFilters = checkActiveFilters('mission');
    if (hasActiveFilters) {
      applyMissionFilters();
    } else {
      renderMissions(data);
    }
  } catch (err) {
    console.error('Erro ao carregar missões:', err);
    showError('missions-list', err.message);
  }
}

// ====== FUNÇÕES DE RENDERIZAÇÃO ======
function renderPendingUsers(users) {
  const container = document.getElementById('pending-users');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhum usuário pendente encontrado.</p>';
    return;
  }

  container.innerHTML = users.map(user => createUserCard(user)).join('');
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhum aluno encontrado.</p>';
    return;
  }

  container.innerHTML = students.map(student => createStudentCard(student)).join('');
}

function renderSubmissions(submissions) {
  const container = document.getElementById('submissions-list');
  if (!container) return;

  if (submissions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma submissão encontrada.</p>';
    return;
  }

  container.innerHTML = submissions.map(submission => createSubmissionCard(submission)).join('');
}

function renderMissions(missions) {
  const container = document.getElementById('missions-list');
  if (!container) return;

  if (missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada.</p>';
    return;
  }

  container.innerHTML = missions.map(mission => createMissionCard(mission)).join('');
}

// ====== FUNÇÕES DE CRIAÇÃO DE CARDS ======
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
            <button data-student-id="${student.id}" data-student-name="${student.username}" class="penalty-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-minus-circle mr-1"></i> Penalidade
            </button>
            <button data-student-id="${student.id}" data-student-name="${student.username}" class="reward-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-plus-circle mr-1"></i> Recompensa
            </button>
          </div>
          <button data-student-id="${student.id}" data-student-name="${student.username}" class="history-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm w-full">
            <i class="fas fa-history mr-1"></i> Histórico
          </button>
        </div>
      </div>
    </div>
  `;
}

function createSubmissionCard(submission) {
  let statusClass, statusIcon;
  
  if (submission.status === 'pendente') {
    statusClass = 'bg-yellow-100 text-yellow-800';
    statusIcon = 'clock';
  } else if (submission.status === 'aprovada') {
    statusClass = 'bg-green-100 text-green-800';
    statusIcon = 'check-circle';
  } else {
    statusClass = 'bg-red-100 text-red-800';
    statusIcon = 'times-circle';
  }

  return `
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${submission.missionTitle}</h3>
          <p class="text-gray-600">Aluno: ${submission.username}</p>
          <p class="text-gray-600">Data: ${new Date(submission.submissionDate).toLocaleDateString('pt-BR')}</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            <i class="fas fa-${statusIcon} mr-1"></i>
            ${submission.status}
          </span>
        </div>
        ${submission.status === 'pendente' ? `
          <div class="flex space-x-2">
            <button class="approve-submission-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" 
                    data-submission-id="${submission.id}">
              <i class="fas fa-check mr-1"></i> Aprovar
            </button>
            <button class="reject-submission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" 
                    data-submission-id="${submission.id}">
              <i class="fas fa-times mr-1"></i> Rejeitar
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function createMissionCard(mission) {
  const statusClass = mission.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  const statusIcon = mission.status === 'ativa' ? 'play-circle' : 'pause-circle';

  return `
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${mission.title}</h3>
          <p class="text-gray-600">${mission.description}</p>
          <p class="text-gray-600">XP: ${mission.xpReward}</p>
          <p class="text-gray-600">Ano: ${mission.year}º ano</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            <i class="fas fa-${statusIcon} mr-1"></i>
            ${mission.status}
          </span>
        </div>
        <div class="flex space-x-2">
          <button class="edit-mission-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" 
                  data-mission-id="${mission.id}">
            <i class="fas fa-edit mr-1"></i> Editar
          </button>
          <button class="delete-mission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" 
                  data-mission-id="${mission.id}">
            <i class="fas fa-trash mr-1"></i> Deletar
          </button>
        </div>
      </div>
    </div>
  `;
}

// ====== FUNÇÕES DE FILTROS ======
function checkActiveFilters(type) {
  if (type === 'student') {
    const yearFilter = document.getElementById('student-year-filter')?.value;
    const classFilter = document.getElementById('student-class-filter')?.value;
    const levelFilter = document.getElementById('student-level-filter')?.value;
    return yearFilter !== 'all' || classFilter !== 'all' || levelFilter !== 'all';
  }
  
  if (type === 'submission') {
    const statusFilter = document.getElementById('submission-status-filter')?.value;
    const missionFilter = document.getElementById('submission-mission-filter')?.value;
    return statusFilter !== 'all' || missionFilter !== 'all';
  }
  
  if (type === 'mission') {
    const statusFilter = document.getElementById('mission-status-filter')?.value;
    const yearFilter = document.getElementById('mission-year-filter')?.value;
    return statusFilter !== 'all' || yearFilter !== 'all';
  }
  
  return false;
}

function applyStudentFilters() {
  const yearFilter = document.getElementById('student-year-filter')?.value || 'all';
  const classFilter = document.getElementById('student-class-filter')?.value || 'all';
  const levelFilter = document.getElementById('student-level-filter')?.value || 'all';
  
  let filtered = originalStudents;
  
  if (yearFilter !== 'all') {
    filtered = filtered.filter(student => student.year == yearFilter);
  }
  
  if (classFilter !== 'all') {
    filtered = filtered.filter(student => student.class === classFilter);
  }
  
  if (levelFilter !== 'all') {
    filtered = filtered.filter(student => student.level == levelFilter);
  }
  
  renderStudents(filtered);
}

function applySubmissionFilters() {
  const statusFilter = document.getElementById('submission-status-filter')?.value || 'all';
  const missionFilter = document.getElementById('submission-mission-filter')?.value || 'all';
  
  let filtered = originalSubmissions;
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(submission => submission.status === statusFilter);
  }
  
  if (missionFilter !== 'all') {
    filtered = filtered.filter(submission => submission.missionId == missionFilter);
  }
  
  renderSubmissions(filtered);
}

function applyMissionFilters() {
  const statusFilter = document.getElementById('mission-status-filter')?.value || 'all';
  const yearFilter = document.getElementById('mission-year-filter')?.value || 'all';
  
  let filtered = originalMissions;
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(mission => mission.status === statusFilter);
  }
  
  if (yearFilter !== 'all') {
    filtered = filtered.filter(mission => mission.year == yearFilter);
  }
  
  renderMissions(filtered);
}

// ====== FUNÇÕES DE SETUP DE FILTROS ======
function setupStudentFilters() {
  const yearFilter = document.getElementById('student-year-filter');
  const classFilter = document.getElementById('student-class-filter');
  const levelFilter = document.getElementById('student-level-filter');
  
  [yearFilter, classFilter, levelFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', applyStudentFilters);
    }
  });
}

function setupSubmissionFilters() {
  const statusFilter = document.getElementById('submission-status-filter');
  const missionFilter = document.getElementById('submission-mission-filter');
  
  [statusFilter, missionFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', applySubmissionFilters);
    }
  });
}

function setupMissionFilters() {
  const statusFilter = document.getElementById('mission-status-filter');
  const yearFilter = document.getElementById('mission-year-filter');
  
  [statusFilter, yearFilter].forEach(filter => {
    if (filter) {
      filter.addEventListener('change', applyMissionFilters);
    }
  });
}

// ====== CONFIGURAÇÃO DE CRIAÇÃO DE MISSÕES ======
function setupMissionCreation() {
  const form = document.getElementById('mission-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleMissionSubmit();
    });
  }
}

async function handleMissionSubmit() {
  const formData = new FormData(document.getElementById('mission-form'));
  
  const missionData = {
    title: formData.get('title'),
    description: formData.get('description'),
    xpReward: parseInt(formData.get('xpReward')),
    year: parseInt(formData.get('year')),
    status: 'ativa'
  };
  
  try {
    await apiRequest('/missoes', {
      method: 'POST',
      body: JSON.stringify(missionData)
    });
    
    alert('Missão criada com sucesso!');
    document.getElementById('mission-form').reset();
    loadMissions();
  } catch (err) {
    console.error('Erro ao criar missão:', err);
    alert(`Erro ao criar missão: ${err.message}`);
  }
}

// ====== FUNÇÕES DE UTILIDADE ======
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="text-red-500 py-4">Erro: ${message}</p>`;
  }
}

// Expor funções globalmente para os módulos de botões
window.loadPendingUsers = loadPendingUsers;
window.loadApprovedStudents = loadApprovedStudents;
window.loadSubmissions = loadSubmissions;
window.loadMissions = loadMissions;
window.showPenaltyRewardModal = showPenaltyRewardModal;
window.showStudentHistoryModal = showStudentHistoryModal;
window.apiRequest = apiRequest;
