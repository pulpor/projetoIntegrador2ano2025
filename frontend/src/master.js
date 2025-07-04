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
  const username = localStorage.getItem('username');

  console.log('[DEBUG MASTER] Validando autenticação:', { 
    hasToken: !!token, 
    isMaster, 
    username,
    tokenLength: token ? token.length : 0
  });

  if (!token) {
    console.error('[DEBUG MASTER] Token não encontrado');
    alert('Acesso negado. Token não encontrado. Faça login como Mestre.');
    window.location.href = './index.html';
    return false;
  }

  if (isMaster !== 'true') {
    console.error('[DEBUG MASTER] Usuário não é mestre:', isMaster);
    alert('Acesso negado. Esta área é exclusiva para mestres.');
    window.location.href = './index.html';
    return false;
  }

  console.log('[DEBUG MASTER] ✅ Autenticação válida');
  return true;
}

// Função para testar se o token ainda é válido
async function testTokenValidity() {
  try {
    console.log('[DEBUG MASTER] Testando validade do token...');
    await apiRequest('/usuarios/me');
    console.log('[DEBUG MASTER] ✅ Token válido');
    return true;
  } catch (error) {
    console.error('[DEBUG MASTER] ❌ Token inválido:', error.message);
    if (error.message.includes('401') || error.message.includes('Token')) {
      alert('Sua sessão expirou. Faça login novamente.');
      localStorage.clear();
      window.location.href = './index.html';
    }
    return false;
  }
}

function loadInitialData() {
  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
  setupMissionCreation(); // Adicionar setup para criação de missões
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
  console.log('[DEBUG MASTER] Fazendo requisição:', { endpoint, options });
  
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const isMaster = localStorage.getItem('isMaster');
  
  console.log('[DEBUG MASTER] Estado de autenticação:', { 
    hasToken: !!token, 
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A',
    username, 
    isMaster 
  });
  
  if (!token) {
    console.error('[DEBUG MASTER] Token não encontrado no localStorage');
    throw new Error('Token de autenticação não encontrado. Faça login novamente.');
  }
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const url = `${API_URL}${endpoint}`;
  console.log('[DEBUG MASTER] URL completa:', url);
  console.log('[DEBUG MASTER] Headers da requisição:', {
    ...defaultOptions.headers,
    'Authorization': `Bearer ${token.substring(0, 20)}...`
  });
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    console.log('[DEBUG MASTER] Resposta recebida:', { status: response.status, ok: response.ok });
    
    if (!response.ok) {
      let errorMessage = 'Erro desconhecido';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        console.log('[DEBUG MASTER] Erro do servidor:', error);
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
        console.log('[DEBUG MASTER] Erro ao ler resposta:', e);
      }
      
      // Não redirecionar automaticamente, apenas lançar erro específico
      if (response.status === 401) {
        throw new Error(`Erro de autenticação: ${errorMessage}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    const result = await response.json();
    console.log('[DEBUG MASTER] Resultado da requisição:', result);
    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    throw error;
  }
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
  const container = document.getElementById('existing-missions-list');
  if (!container) return;

  if (missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada.</p>';
    return;
  }

  // Limitar a 5 missões por padrão
  const maxDisplayed = 5;
  const missionsToShow = missions.slice(0, maxDisplayed);
  const hasMore = missions.length > maxDisplayed;

  let html = `
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-lg font-semibold text-gray-800">Missões Existentes (${missions.length})</h4>
      ${hasMore ? `
        <button id="toggle-all-missions" class="text-blue-600 hover:text-blue-800 text-sm">
          <i class="fas fa-chevron-down mr-1"></i>Mostrar todas
        </button>
      ` : ''}
    </div>
    <div id="missions-display">
      ${missionsToShow.map(mission => createMissionCard(mission)).join('')}
    </div>
  `;

  if (hasMore) {
    html += `
      <div id="hidden-missions" class="hidden">
        ${missions.slice(maxDisplayed).map(mission => createMissionCard(mission)).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
  setupMissionButtons();
  
  // Configurar toggle para mostrar/ocultar todas as missões
  if (hasMore) {
    const toggleBtn = document.getElementById('toggle-all-missions');
    const hiddenMissions = document.getElementById('hidden-missions');
    let showingAll = false;
    
    toggleBtn.addEventListener('click', () => {
      showingAll = !showingAll;
      
      if (showingAll) {
        hiddenMissions.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>Mostrar menos';
      } else {
        hiddenMissions.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>Mostrar todas';
      }
      
      // Reconfigurar botões após mostrar/ocultar
      setupMissionButtons();
    });
  }
}

function createMissionCard(mission) {
  const yearLabels = { 1: '1º ano', 2: '2º ano', 3: '3º ano' };
  
  // Truncar descrição se for muito longa
  const maxDescLength = 100;
  const description = mission.description.length > maxDescLength 
    ? mission.description.substring(0, maxDescLength) + '...' 
    : mission.description;
  
  return `
    <div class="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition mb-3 border-l-4 border-purple-400">
      <div class="flex justify-between items-start">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-semibold text-md text-gray-800 truncate">${mission.title}</h3>
            <span class="text-green-600 font-medium text-sm ml-2 flex-shrink-0">${mission.xp} XP</span>
          </div>
          <p class="text-gray-600 text-sm mb-2 line-clamp-2">${description}</p>
          <div class="flex flex-wrap gap-1 mb-2">
            ${mission.targetYear ? 
              `<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">${yearLabels[mission.targetYear]}</span>` :
              `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Todos</span>`
            }
            ${mission.targetClass === 'geral' ? 
              `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Geral</span>` :
              `<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded max-w-20 truncate" title="${mission.targetClass}">${mission.targetClass}</span>`
            }
          </div>
        </div>
        <div class="flex space-x-1 ml-3 flex-shrink-0">
          <button data-mission-id="${mission.id}" class="edit-mission-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button data-mission-id="${mission.id}" class="delete-mission-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupMissionButtons() {
  setupEventListeners('.edit-mission-btn', async (e) => {
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    await editMission(missionId);
  });

  setupEventListeners('.delete-mission-btn', async (e) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return;
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    await missionAction(missionId, 'DELETE', 'Missão excluída com sucesso!');
  });
}

async function editMission(missionId) {
  try {
    // Buscar dados da missão
    const mission = originalMissions.find(m => m.id === parseInt(missionId));
    if (!mission) {
      alert('Missão não encontrada.');
      return;
    }
    
    // Preencher formulário com dados da missão
    document.getElementById('mission-title').value = mission.title;
    document.getElementById('mission-description').value = mission.description;
    document.getElementById('mission-xp').value = mission.xp;
    document.getElementById('mission-year').value = mission.targetYear || '';
    document.getElementById('mission-class').value = mission.targetClass;
    
    // Alterar botão para modo edição
    const createBtn = document.getElementById('create-mission-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    createBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';
    createBtn.setAttribute('data-edit-mission-id', missionId);
    cancelBtn.classList.remove('hidden');
    
    console.log('[DEBUG MASTER] Editando missão:', mission);
  } catch (err) {
    console.error('[DEBUG MASTER] Erro ao carregar missão para edição:', err);
    alert('Erro ao carregar dados da missão.');
  }
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

// ====== CRIAÇÃO DE MISSÕES ======
function setupMissionCreation() {
  const createBtn = document.getElementById('create-mission-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  if (createBtn) {
    createBtn.addEventListener('click', handleMissionSubmit);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelMissionEdit);
  }
}

async function handleMissionSubmit() {
  const title = document.getElementById('mission-title').value.trim();
  const description = document.getElementById('mission-description').value.trim();
  const xp = document.getElementById('mission-xp').value;
  const year = document.getElementById('mission-year').value;
  let targetClass = document.getElementById('mission-class').value;
  
  // Se não foi selecionada uma classe, usar "geral" como padrão
  if (!targetClass) {
    targetClass = 'geral';
  }
  
  // Verificar se estamos editando uma missão existente
  const createBtn = document.getElementById('create-mission-btn');
  const editMissionId = createBtn.getAttribute('data-edit-mission-id');
  const isEditing = !!editMissionId;
  
  // Validação
  if (!title || !description || !xp) {
    alert('Por favor, preencha todos os campos obrigatórios (título, descrição e XP).');
    return;
  }
  
  if (parseInt(xp) <= 0) {
    alert('O XP deve ser maior que zero.');
    return;
  }
  
  const missionData = {
    titulo: title,
    descricao: description,
    xp: parseInt(xp),
    targetYear: year ? parseInt(year) : null,
    targetClass: targetClass
  };
  
  console.log('[DEBUG MASTER] ' + (isEditing ? 'Editando' : 'Criando') + ' missão:', missionData);
  
  try {
    const url = isEditing ? `/missoes/${editMissionId}` : '/missoes';
    const method = isEditing ? 'PUT' : 'POST';
    
    console.log('[DEBUG MASTER] Fazendo requisição:', { url, method, data: missionData });
    
    const result = await apiRequest(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(missionData)
    });
    
    console.log('[DEBUG MASTER] Missão ' + (isEditing ? 'editada' : 'criada') + ' com sucesso:', result);
    alert('Missão ' + (isEditing ? 'editada' : 'criada') + ' com sucesso!');
    
    // Limpar formulário e resetar estado
    clearMissionForm();
    resetMissionFormState();
    
    // Recarregar lista de missões
    loadMissions();
  } catch (err) {
    console.error('[DEBUG MASTER] Erro na requisição:', err);
    
    // Tratamento específico para erros de autenticação
    if (err.message.includes('401') || err.message.includes('autenticação') || err.message.includes('Token')) {
      const shouldRelogin = confirm('Problema de autenticação detectado. Deseja fazer login novamente?');
      if (shouldRelogin) {
        localStorage.clear();
        window.location.href = './index.html';
      }
    } else {
      alert('Erro ao ' + (isEditing ? 'editar' : 'criar') + ' missão: ' + err.message);
    }
  }
}

function clearMissionForm() {
  document.getElementById('mission-title').value = '';
  document.getElementById('mission-description').value = '';
  document.getElementById('mission-xp').value = '';
  document.getElementById('mission-year').value = '';
  document.getElementById('mission-class').value = 'geral'; // Definir "geral" como padrão
}

function cancelMissionEdit() {
  clearMissionForm();
  document.getElementById('create-mission-btn').textContent = '+ Criar Missão';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
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
