// Importar módulos utilitários 
import { validateAuthentication, apiRequest } from './utils/auth.js';
import { setupTabs, setupLogout } from './utils/interface.js';
import { showPenaltyRewardModal, showStudentHistoryModal } from './utils/modals.js';
import { setupAllButtonEvents } from './utils/buttons.js';
import { showError, showSuccess } from './utils/toast.js';

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
  setupAllButtonEvents();

  // Expor funções globalmente para que os botões funcionem
  window.loadPendingUsers = loadPendingUsers;
  window.loadApprovedStudents = loadApprovedStudents;
  window.loadMissions = loadMissions;
  window.loadSubmissions = loadSubmissions;
  window.editMission = editMission;
  window.missionAction = missionAction;
  window.apiRequest = apiRequest;
  window.cancelEdit = cancelEdit;
  window.openFileSecurely = openFileSecurely;
});

function loadInitialData() {
  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
  setupMissionCreation();
}

// ====== FUNÇÃO PARA ABRIR ARQUIVOS COM SEGURANÇA ======
function openFileSecurely(fileUrl) {
  // Função para abrir arquivos sem interferir na sessão
  try {
    console.log('[OPEN FILE] Tentando abrir arquivo:', fileUrl);

    // MÉTODO CORRIGIDO: Abrir diretamente com a URL ao invés de janela vazia
    const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      console.log('[OPEN FILE] Arquivo aberto com sucesso');
    } else {
      console.log('[OPEN FILE] Popup bloqueado, usando fallback');
      // Fallback se popup foi bloqueado
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Erro ao abrir arquivo:', error);
    showError('Erro ao abrir arquivo: ' + error.message);
  }
}

// ====== FUNÇÕES DE CARREGAMENTO DE DADOS ======
async function loadPendingUsers() {
  try {
    const data = await apiRequest('/usuarios/pending-users');
    renderPendingUsers(data);
  } catch (err) {
    console.error('Erro ao carregar usuários pendentes:', err);
    showErrorContainer('pending-users', err.message);
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
    showErrorContainer('students-list', err.message);
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
    showErrorContainer('submissions-list', err.message);
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
    showErrorContainer('missions-list', err.message);
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
  if (!container) {
    console.error('[ERROR] Container students-list não encontrado!');
    return;
  }

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

  // Determinar cor do nível baseado no XP
  const level = student.level || 1;
  const xp = student.xp || 0;
  let levelColorClass = 'bg-gray-500';
  let levelIcon = 'fas fa-seedling';

  if (level >= 10) {
    levelColorClass = 'bg-gradient-to-r from-purple-500 to-pink-500';
    levelIcon = 'fas fa-crown';
  } else if (level >= 7) {
    levelColorClass = 'bg-gradient-to-r from-yellow-400 to-orange-500';
    levelIcon = 'fas fa-star';
  } else if (level >= 4) {
    levelColorClass = 'bg-gradient-to-r from-blue-400 to-blue-600';
    levelIcon = 'fas fa-rocket';
  } else if (level >= 2) {
    levelColorClass = 'bg-gradient-to-r from-green-400 to-green-600';
    levelIcon = 'fas fa-leaf';
  }

  // Determinar ícone da classe
  const classIcons = {
    'Arqueiro do JavaScript': 'fab fa-js-square',
    'Cafeicultor do Java': 'fab fa-java',
    'Mago do CSS': 'fab fa-css3-alt',
    'Guerreiro do HTML': 'fab fa-html5',
    'Xamã do React': 'fab fa-react',
    'Necromante do Node.js': 'fab fa-node-js',
    'Paladino do Python': 'fab fa-python',
    'Druida do Banco de Dados': 'fas fa-database',
    'Assassino do Android': 'fab fa-android',
    'Bardo do iOS': 'fab fa-apple',
    'Bárbaro do Back-end': 'fas fa-server',
    'Domador de Dados': 'fas fa-chart-bar',
    'Elfo do Front-end': 'fas fa-paint-brush',
    'Caçador de Bugs': 'fas fa-bug'
  };

  const classIcon = classIcons[student.class] || 'fas fa-user';

  let progressDisplay = '';
  if (student.levelInfo && !student.levelInfo.isMaxLevel) {
    const info = student.levelInfo;
    progressDisplay = `
      <div class="mt-3">
        <div class="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progresso do Nível</span>
          <span>${info.xpProgressInCurrentLevel}/${info.xpNeededForCurrentLevel} XP</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300" 
               style="width: ${info.progressPercentage}%"></div>
        </div>
        <div class="text-xs text-center text-gray-500 mt-1">${info.progressPercentage}% concluído</div>
      </div>
    `;
  } else if (student.levelInfo?.isMaxLevel) {
    progressDisplay = `
      <div class="mt-3 text-center">
        <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          <i class="fas fa-trophy mr-1"></i> NÍVEL MÁXIMO
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      <!-- Header do Card -->
      <div class="bg-gradient-to-r from-purple-500 to-blue-600 p-4 text-white relative">
        <div class="absolute top-2 right-2">
          <div class="${levelColorClass} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <i class="${levelIcon} mr-1"></i>
            Nível ${level}
          </div>
        </div>
        <div class="flex items-center">
          <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
            <i class="${classIcon} text-2xl"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg">${student.username}</h3>
            <p class="text-blue-100 text-sm">${yearDisplay}</p>
          </div>
        </div>
      </div>

      <!-- Conteúdo do Card -->
      <div class="p-4">
        <!-- Informações Principais -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${xp}</div>
            <div class="text-xs text-gray-500">XP Total</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${level}</div>
            <div class="text-xs text-gray-500">Nível Atual</div>
          </div>
        </div>

        <!-- Classe do Estudante -->
        <div class="bg-gray-50 rounded-lg p-3 mb-4">
          <div class="flex items-center">
            <i class="${classIcon} text-lg text-gray-600 mr-2"></i>
            <span class="text-sm font-medium text-gray-700">${student.class || 'Classe não definida'}</span>
          </div>
        </div>

        <!-- Barra de Progresso -->
        ${progressDisplay}

        <!-- Botões de Ação -->
        <div class="mt-4 space-y-2">
          <!-- Primeira linha de botões -->
          <div class="grid grid-cols-2 gap-2">
            <button data-student-id="${student.id}" data-student-name="${student.username}" 
                    class="penalty-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center group-hover:scale-105">
              <i class="fas fa-minus-circle mr-1"></i>
              <span class="hidden sm:inline">Penalidade</span>
              <span class="sm:hidden">-XP</span>
            </button>
            <button data-student-id="${student.id}" data-student-name="${student.username}" 
                    class="reward-btn bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center group-hover:scale-105">
              <i class="fas fa-plus-circle mr-1"></i>
              <span class="hidden sm:inline">Recompensa</span>
              <span class="sm:hidden">+XP</span>
            </button>
          </div>
          
          <!-- Segunda linha de botões -->
          <div class="grid grid-cols-2 gap-2">
            <button data-student-id="${student.id}" data-student-name="${student.username}" 
                    class="history-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center group-hover:scale-105">
              <i class="fas fa-history mr-1"></i>
              <span class="hidden sm:inline">Histórico</span>
              <span class="sm:hidden">Log</span>
            </button>
            <button data-student-id="${student.id}" data-student-name="${student.username}" 
                    class="expel-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center group-hover:scale-105">
              <i class="fas fa-user-times mr-1"></i>
              <span class="hidden sm:inline">Expulsar</span>
              <span class="sm:hidden">Del</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer com estatísticas adicionais -->
      <div class="bg-gray-50 px-4 py-2 border-t">
        <div class="flex justify-between text-xs text-gray-500">
          <span><i class="fas fa-calendar-alt mr-1"></i>Membro desde ${new Date().getFullYear()}</span>
          <span><i class="fas fa-clock mr-1"></i>Ativo</span>
        </div>
      </div>
    </div>
  `;
}

function createSubmissionCard(submission) {
  let statusClass, statusIcon, statusText;

  // Determinar status baseado nos campos pending e approved
  if (submission.pending) {
    statusClass = 'bg-yellow-100 text-yellow-800';
    statusIcon = 'clock';
    statusText = 'Pendente';
  } else if (submission.approved) {
    statusClass = 'bg-green-100 text-green-800';
    statusIcon = 'check-circle';
    statusText = 'Aprovada';
  } else {
    statusClass = 'bg-red-100 text-red-800';
    statusIcon = 'times-circle';
    statusText = 'Rejeitada';
  }

  // Usar submittedAt em vez de submissionDate
  const submissionDate = submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('pt-BR') : 'Data inválida';

  // Processar arquivos enviados
  const filesHtml = submission.filePaths && submission.filePaths.length > 0 ?
    submission.filePaths.map(filePath => {
      const fileName = filePath.split('\\').pop().split('/').pop(); // Pegar só o nome do arquivo
      const fileUrl = `http://localhost:3000/uploads/${fileName}`; // URL completa para evitar problemas de sessão
      const fileExtension = fileName.split('.').pop().toLowerCase();

      // Determinar tipo de arquivo e ícone
      let fileIcon = 'file';
      let fileType = 'Arquivo';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
        fileIcon = 'image';
        fileType = 'Imagem';
      } else if (['pdf'].includes(fileExtension)) {
        fileIcon = 'file-pdf';
        fileType = 'PDF';
      } else if (['doc', 'docx'].includes(fileExtension)) {
        fileIcon = 'file-word';
        fileType = 'Word';
      } else if (['js', 'html', 'css', 'json'].includes(fileExtension)) {
        fileIcon = 'code';
        fileType = 'Código';
      }

      return `
        <div class="flex items-center space-x-2 mt-2 p-2 bg-gray-50 rounded">
          <i class="fas fa-${fileIcon} text-blue-500"></i>
          <span class="text-sm text-gray-600">${fileType}:</span>
          <button 
            onclick="openFileSecurely('${fileUrl}'); return false;" 
            class="text-blue-600 hover:text-blue-800 underline text-sm font-medium cursor-pointer bg-transparent border-none p-0"
            title="Clique para abrir ${fileName}"
          >
            ${fileName}
          </button>
          <span class="text-xs text-gray-400">(nova aba)</span>
        </div>
      `;
    }).join('') : '<p class="text-sm text-gray-400 mt-2">Nenhum arquivo enviado</p>';

  return `
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${submission.missionTitle || 'Missão Desconhecida'}</h3>
          <p class="text-gray-600">Aluno: ${submission.username || 'Desconhecido'}</p>
          <p class="text-gray-600">Data: ${submissionDate}</p>
          <p class="text-gray-600">XP: ${submission.xp || 0}</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            <i class="fas fa-${statusIcon} mr-1"></i>
            ${statusText}
          </span>
          
          <!-- Arquivos enviados -->
          <div class="mt-3">
            <h4 class="font-semibold text-sm text-gray-700 mb-1">📁 Arquivos enviados:</h4>
            ${filesHtml}
          </div>
        </div>
        ${submission.pending ? `
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
  const status = mission.status || 'ativa'; // Fallback para missões sem status
  const statusClass = status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  const statusIcon = status === 'ativa' ? 'play-circle' : 'pause-circle';

  return `
    <div class="bg-white p-4 rounded-lg shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${mission.title}</h3>
          <p class="text-gray-600">${mission.description}</p>
          <p class="text-gray-600">XP: ${mission.xp}</p>
          <p class="text-gray-600">Ano: ${mission.targetYear ? mission.targetYear + 'º ano' : 'Todos os anos'}</p>
          <p class="text-gray-600">Classe: ${mission.targetClass || 'Geral'}</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            <i class="fas fa-${statusIcon} mr-1"></i>
            ${status}
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

// ====== FUNÇÕES DE EDIÇÃO E AÇÃO DE MISSÕES ======
async function editMission(missionId) {
  try {
    // Encontrar a missão na lista atual
    const mission = originalMissions.find(m => m.id === parseInt(missionId));
    if (!mission) {
      showError('Missão não encontrada');
      return;
    }

    // Verificar se os elementos do formulário existem
    const titleEl = document.getElementById('mission-title');
    const descriptionEl = document.getElementById('mission-description');
    const xpEl = document.getElementById('mission-xp');
    const yearEl = document.getElementById('mission-year');
    const classEl = document.getElementById('mission-class');

    if (!titleEl || !descriptionEl || !xpEl || !yearEl || !classEl) {
      showError('Formulário de missão não encontrado. Recarregue a página.');
      console.error('Elementos do formulário não encontrados:', {
        titleEl: !!titleEl,
        descriptionEl: !!descriptionEl,
        xpEl: !!xpEl,
        yearEl: !!yearEl,
        classEl: !!classEl
      });
      return;
    }

    // Preencher os campos do formulário com os dados da missão
    titleEl.value = mission.title || '';
    descriptionEl.value = mission.description || '';
    xpEl.value = mission.xp || '';
    yearEl.value = mission.targetYear || '';
    classEl.value = mission.targetClass || 'geral';

    // Mudar o botão para modo de edição
    const createBtn = document.getElementById('create-mission-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (createBtn && cancelBtn) {
      createBtn.textContent = '✏️ Atualizar Missão';
      createBtn.className = 'flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition font-medium';
      createBtn.dataset.editingId = missionId;

      cancelBtn.style.display = 'block';
      cancelBtn.onclick = () => cancelEdit();
    }

    // Scroll para o formulário
    const formElement = document.querySelector('#missions-content .bg-white');
    if (formElement) {
      formElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    showSuccess('Dados da missão carregados para edição');

  } catch (err) {
    console.error('Erro ao editar missão:', err);
    showError(`Erro ao carregar dados da missão: ${err.message}`);
  }
}

async function missionAction(missionId, action, successMessage) {
  try {
    if (action === 'DELETE') {
      await apiRequest(`/missoes/${missionId}`, { method: 'DELETE' });
      showSuccess(successMessage);
      loadMissions();
    } else {
      showError('Ação não reconhecida');
    }
  } catch (err) {
    console.error('Erro na ação da missão:', err);
    showError(`Erro: ${err.message}`);
  }
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
    filtered = filtered.filter(mission => mission.targetYear == yearFilter);
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
  const createBtn = document.getElementById('create-mission-btn');
  if (createBtn) {
    createBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleMissionSubmit();
    });
  }
}

async function handleMissionSubmit() {
  try {
    // Verificar se os elementos do formulário existem
    const titleEl = document.getElementById('mission-title');
    const descriptionEl = document.getElementById('mission-description');
    const xpEl = document.getElementById('mission-xp');
    const yearEl = document.getElementById('mission-year');
    const classEl = document.getElementById('mission-class');

    if (!titleEl || !descriptionEl || !xpEl || !yearEl || !classEl) {
      showError('Formulário de missão não encontrado. Recarregue a página.');
      console.error('Elementos do formulário não encontrados');
      return;
    }

    // Obter valores dos campos individuais
    const title = titleEl.value.trim();
    const description = descriptionEl.value.trim();
    const xpReward = parseInt(xpEl.value);
    const year = yearEl.value;
    const missionClass = classEl.value;

    // Verificar se estamos editando
    const createBtn = document.getElementById('create-mission-btn');
    const isEditing = createBtn && createBtn.dataset.editingId;
    const missionId = isEditing ? parseInt(createBtn.dataset.editingId) : null;

    // Validações
    if (!title) {
      showError('Título da missão é obrigatório');
      return;
    }

    if (!description) {
      showError('Descrição da missão é obrigatória');
      return;
    }

    if (!xpReward || xpReward <= 0) {
      showError('XP da missão deve ser um número positivo');
      return;
    }

    const missionData = {
      titulo: title,
      descricao: description,
      xp: xpReward,
      targetYear: year ? parseInt(year) : null,
      targetClass: missionClass || 'geral'
    };

    let response;
    let successMessage;

    if (isEditing) {
      // Editar missão existente
      response = await apiRequest(`/missoes/${missionId}`, {
        method: 'PUT',
        body: JSON.stringify(missionData)
      });
      successMessage = 'Missão atualizada com sucesso!';
    } else {
      // Criar nova missão
      missionData.status = 'ativa';
      response = await apiRequest('/missoes', {
        method: 'POST',
        body: JSON.stringify(missionData)
      });
      successMessage = 'Missão criada com sucesso!';
    }

    showSuccess(successMessage);

    // Limpar campos e resetar interface
    cancelEdit();

    // Recarregar missões
    loadMissions();

  } catch (err) {
    console.error('Erro ao processar missão:', err);
    const action = isEditing ? 'atualizar' : 'criar';
    showError(`Erro ao ${action} missão: ${err.message}`);
  }
}

// ====== FUNÇÕES DE UTILIDADE ======
function showErrorContainer(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="text-red-500 py-4">Erro: ${message}</p>`;
  }
  // Também mostrar toast
  showError(message);
}

// Expor funções globalmente para os módulos de botões
window.loadPendingUsers = loadPendingUsers;
window.loadApprovedStudents = loadApprovedStudents;
window.loadSubmissions = loadSubmissions;
window.loadMissions = loadMissions;
window.showPenaltyRewardModal = showPenaltyRewardModal;
window.showStudentHistoryModal = showStudentHistoryModal;
window.apiRequest = apiRequest;
window.editMission = editMission;
window.missionAction = missionAction;
window.cancelEdit = cancelEdit;

function cancelEdit() {
  try {
    // Verificar se os elementos existem antes de tentar usá-los
    const titleEl = document.getElementById('mission-title');
    const descriptionEl = document.getElementById('mission-description');
    const xpEl = document.getElementById('mission-xp');
    const yearEl = document.getElementById('mission-year');
    const classEl = document.getElementById('mission-class');

    // Limpar os campos se existirem
    if (titleEl) titleEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    if (xpEl) xpEl.value = '';
    if (yearEl) yearEl.value = '';
    if (classEl) classEl.value = 'geral';

    // Restaurar o botão para modo de criação
    const createBtn = document.getElementById('create-mission-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (createBtn) {
      createBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Criar Missão';
      createBtn.className = 'flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition font-medium';
      delete createBtn.dataset.editingId;
    }

    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }

    showSuccess('Edição cancelada');
  } catch (err) {
    console.error('Erro ao cancelar edição:', err);
    showError('Erro ao cancelar edição');
  }
}
