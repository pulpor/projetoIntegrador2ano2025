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
  setupGlobalEventListeners(); // Configurar event listeners uma única vez
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
  // Removido setupUserActionButtons() - agora configurado globalmente
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4 col-span-full text-center">Nenhum aluno encontrado.</p>';
    return;
  }

  // Alterar para grid layout
  container.className = 'grid md:grid-cols-2 xl:grid-cols-3 gap-6';
  container.innerHTML = students.map(student => createStudentCard(student)).join('');
  // Removido setupStudentActionButtons() - agora configurado globalmente
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

  // Calcular progresso baseado em nível ou XP
  let progressPercent = 0;
  if (student.levelInfo && !student.levelInfo.isMaxLevel) {
    progressPercent = student.levelInfo.progressPercentage || 0;
  } else if (student.levelInfo?.isMaxLevel) {
    progressPercent = 100;
  } else {
    // Fallback: calcular progresso baseado no XP total
    const currentXP = student.xp || 0;
    const level = student.level || 1;
    progressPercent = Math.min((currentXP / (level * 100)) * 100, 100);
  }

  // Definir cor do header baseada na classe do aluno
  let headerColor = ''; // Será definido baseado na classe ou XP
  let headerStyle = ''; // Para cores customizadas

  // Mapeamento de classes para cores específicas
  const classColors = {
    'Arqueiro do JavaScript': { color: '#F7DF1E', textColor: 'text-black' },
    'Cafeicultor do Java': { color: '#007396', textColor: 'text-white' },
    'Mago do CSS': { color: '#264DE4', textColor: 'text-white' },
    'Guerreiro do HTML': { color: '#E44D26', textColor: 'text-white' },
    'Xamã do React': { color: '#61DAFB', textColor: 'text-black' },
    'Necromante do Node.js': { color: '#6DA55F', textColor: 'text-white' },
    'Paladino do Python': { color: '#3776AB', textColor: 'text-white' },
    'Druida do Banco de Dados': { color: '#4479A1', textColor: 'text-white' },
    'Assassino do Android': { color: '#3DDC84', textColor: 'text-black' },
    'Bardo do iOS': { color: '#BFBFBF', textColor: 'text-black' }
  };

  const studentClass = student.class || '';
  if (classColors[studentClass]) {
    headerStyle = `style="background-color: ${classColors[studentClass].color}"`;
    headerColor = classColors[studentClass].textColor;
  } else {
    // Fallback: usar cor baseada no XP/nível se classe não for reconhecida
    const xp = student.xp || 0;
    const level = student.level || 1;

    if (xp >= 1000 || level >= 8) {
      headerColor = 'bg-green-500';
    } else if (xp >= 500 || level >= 5) {
      headerColor = 'bg-blue-500';
    } else if (xp >= 200 || level >= 3) {
      headerColor = 'bg-purple-500';
    } else {
      headerColor = 'bg-orange-500';
    }
    headerColor += ' text-white';
  }

  // Badge de nível no canto superior direito
  const level = student.level || 1;
  const levelBadge = level >= 5 ?
    `<div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
      <i class="fas fa-check mr-1"></i>Nível ${level}
    </div>` :
    `<div class="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
      <i class="fas fa-star mr-1"></i>Nível ${level}
    </div>`;

  // Iniciais do estudante
  const initials = student.username ?
    student.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1) :
    'A';

  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <!-- Header colorido -->
      <div class="relative ${headerColor} p-4" ${headerStyle}>
        ${levelBadge}
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
            ${initials}
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg truncate">${student.username}</h3>
            <p class="text-sm opacity-90">${yearDisplay}</p>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="p-4">
        <!-- Stats XP e Nível -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">${student.xp || 0}</div>
            <div class="text-sm text-gray-600">XP Total</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">${level}</div>
            <div class="text-sm text-gray-600">Nível Atual</div>
          </div>
        </div>

        <!-- Classe/Badge -->
        <div class="mb-4">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
            <i class="fas fa-laptop-code mr-2"></i>
            ${student.class || 'Classe não definida'}
          </div>
        </div>

        <!-- Progresso do Nível -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Progresso do Nível</span>
            <span class="text-sm font-medium text-gray-800">${Math.round(progressPercent)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            ${progressPercent < 100 ? `${Math.round(progressPercent)}% concluído` : 'Nível máximo atingido!'}
          </div>
        </div>

        <!-- Botões de ação (estilo da imagem) -->
        <div class="grid grid-cols-4 gap-1">
          <!-- Botão laranja -->
          <button 
            data-student-id="${student.id}" 
            class="penalty-btn bg-orange-500 hover:bg-orange-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Penalidade"
          >
            <i class="fas fa-minus-circle"></i>
          </button>
          
          <!-- Botão verde -->
          <button 
            data-student-id="${student.id}" 
            class="reward-btn bg-green-500 hover:bg-green-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Recompensa"
          >
            <i class="fas fa-plus-circle"></i>
          </button>
          
          <!-- Botão azul -->
          <button 
            data-student-id="${student.id}" 
            class="info-btn bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Informações"
          >
            <i class="fas fa-info-circle"></i>
          </button>
          
          <!-- Botão vermelho -->
          <button 
            data-student-id="${student.id}" 
            class="expel-btn bg-red-500 hover:bg-red-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Expulsar"
          >
            <i class="fas fa-user-times"></i>
          </button>
        </div>

        <!-- Histórico Recente de Ações -->
        ${student.actionHistory && student.actionHistory.length > 0 ? `
          <div class="mb-3">
            <div class="text-xs text-gray-600 mb-2 font-medium">Histórico Recente:</div>
            <div class="space-y-1 max-h-16 overflow-y-auto">
              ${student.actionHistory.slice(-2).reverse().map(action => `
                <div class="text-xs p-2 rounded ${action.type === 'penalty' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}">
                  <div class="flex justify-between items-center">
                    <span class="${action.type === 'penalty' ? 'text-orange-700' : 'text-green-700'} font-medium">
                      ${action.type === 'penalty' ? '🚫' : '🎉'} ${action.type === 'penalty' ? '-' : '+'}${action.amount} XP
                    </span>
                    <span class="text-gray-500">${new Date(action.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <div class="text-gray-600 truncate mt-1">${action.reason}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Data de membro -->
        <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <div class="flex items-center">
            <i class="fas fa-calendar-alt mr-1"></i>
            Membro desde 2025
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Ativo
          </div>
        </div>
      </div>
    </div>
  `;
}

// ====== AÇÕES DE USUÁRIOS ======


function createPenaltyRewardModal(title, studentName, type) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

  const bgColor = type === 'penalty' ? 'orange' : 'green';

  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4 text-${bgColor}-600">${title}</h2>
      <p class="mb-4">Aluno: <strong>${studentName}</strong></p>
      
      <div class="mb-4">
        <label for="xp-input" class="block text-sm font-medium text-gray-700 mb-1">
          Quantidade de XP:
        </label>
        <input 
          type="number" 
          id="xp-input" 
          min="1" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${bgColor}-500"
          placeholder="Digite a quantidade de XP"
        >
      </div>
      
      <div class="mb-6">
        <label for="reason-input" class="block text-sm font-medium text-gray-700 mb-1">
          Motivo:
        </label>
        <textarea 
          id="reason-input" 
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${bgColor}-500"
          placeholder="Digite o motivo da ${type === 'penalty' ? 'penalidade' : 'recompensa'}"
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button class="cancel-btn px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors">
          Cancelar
        </button>
        <button class="confirm-btn px-4 py-2 bg-${bgColor}-500 hover:bg-${bgColor}-600 text-white rounded transition-colors">
          ${type === 'penalty' ? 'Aplicar Penalidade' : 'Aplicar Recompensa'}
        </button>
      </div>
    </div>
  `;

  return modal;
}

async function userAction(endpoint, data) {
  try {
    const response = await apiRequest(`/usuarios/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Mostrar mensagem do backend se disponível
    if (response && response.message) {
      alert(response.message);
    }
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
  // Removido setupSubmissionButtons() - agora configurado globalmente
}

function createSubmissionCard(submission) {
  const statusClasses = {
    pending: 'border-yellow-400 bg-yellow-100 text-yellow-800',
    approved: 'border-green-400 bg-green-100 text-green-800',
    rejected: 'border-red-400 bg-red-100 text-red-800'
  };

  const statusTexts = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };

  // Processar arquivos enviados
  const filesSection = submission.filePaths && submission.filePaths.length > 0 ? `
    <div class="mt-3">
      <p class="text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-file-code mr-1"></i>
        Arquivos Enviados (${submission.filePaths.length}):
      </p>
      <div class="bg-gray-50 rounded-lg p-3 space-y-2">
        ${submission.filePaths.map(filePath => {
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileIcon = getFileIcon(fileExtension);

    return `
            <div class="flex items-center justify-between bg-white rounded p-2 border">
              <div class="flex items-center space-x-2">
                <i class="fas ${fileIcon} text-blue-600"></i>
                <span class="text-sm text-gray-700 truncate" title="${fileName}">${fileName}</span>
              </div>
              <button 
                class="download-file-btn text-blue-600 hover:text-blue-800 text-sm"
                data-file-path="${filePath}"
                title="Download arquivo"
              >
                <i class="fas fa-download"></i>
              </button>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  ` : `
    <div class="mt-3">
      <p class="text-sm text-gray-500">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        Nenhum arquivo enviado
      </p>
    </div>
  `;

  return `
    <div class="bg-white p-6 rounded-lg shadow border-l-4 ${statusClasses[submission.status].split(' ')[0]}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800">${submission.missionTitle || 'Missão Desconhecida'}</h3>
          <p class="text-sm text-gray-600 mb-2">Aluno: <span class="font-medium">${submission.username || 'Desconhecido'}</span></p>
          <p class="text-sm text-gray-600 mb-2">Enviado em: ${new Date(submission.submittedAt).toLocaleString('pt-BR')}</p>
          <p class="text-sm text-gray-600 mb-2">XP: <span class="font-medium text-purple-600">${submission.xp}</span></p>
          
          ${filesSection}
          
          <div class="mt-4">
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

// Função para obter ícone do arquivo baseado na extensão
function getFileIcon(extension) {
  const iconMap = {
    'js': 'fa-file-code',
    'html': 'fa-file-code',
    'css': 'fa-file-code',
    'ts': 'fa-file-code',
    'jsx': 'fa-file-code',
    'vue': 'fa-file-code',
    'py': 'fa-file-code',
    'java': 'fa-file-code',
    'cpp': 'fa-file-code',
    'c': 'fa-file-code',
    'php': 'fa-file-code',
    'rb': 'fa-file-code',
    'go': 'fa-file-code',
    'json': 'fa-file-code',
    'txt': 'fa-file-text',
    'md': 'fa-file-text',
    'pdf': 'fa-file-pdf',
    'doc': 'fa-file-word',
    'docx': 'fa-file-word',
    'png': 'fa-file-image',
    'jpg': 'fa-file-image',
    'jpeg': 'fa-file-image',
    'gif': 'fa-file-image',
    'zip': 'fa-file-archive',
    'rar': 'fa-file-archive'
  };

  return iconMap[extension] || 'fa-file';
}

async function submissionAction(submissionId, action) {
  try {
    const response = await apiRequest(`/submissoes/${submissionId}/${action}`, { method: 'POST' });

    // Mostrar mensagem do backend se disponível
    if (response && response.message) {
      alert(response.message);
    }
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

  // Limitar a 6 missões por padrão (para grid 2x3)
  const maxDisplayed = 6;
  const missionsToShow = missions.slice(0, maxDisplayed);
  const hasMore = missions.length > maxDisplayed;

  let html = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-sm text-gray-600">${missions.length} missão${missions.length !== 1 ? 'ões' : ''} disponível${missions.length !== 1 ? 'eis' : ''}</span>
      ${hasMore ? `
        <button id="toggle-all-missions" class="text-blue-600 hover:text-blue-800 text-sm">
          <i class="fas fa-chevron-down mr-1"></i>Mostrar todas
        </button>
      ` : ''}
    </div>
    <div id="missions-display" class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${missionsToShow.map(mission => createMissionCard(mission)).join('')}
    </div>
  `;

  if (hasMore) {
    html += `
      <div id="hidden-missions" class="hidden grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${missions.slice(maxDisplayed).map(mission => createMissionCard(mission)).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
  // Removido setupMissionButtons() - agora configurado globalmente

  // Configurar toggle para mostrar/ocultar todas as missões
  if (hasMore) {
    const toggleBtn = document.getElementById('toggle-all-missions');
    const hiddenMissions = document.getElementById('hidden-missions');
    let showingAll = false;

    toggleBtn.addEventListener('click', () => {
      showingAll = !showingAll;

      if (showingAll) {
        hiddenMissions.classList.remove('hidden');
        hiddenMissions.classList.add('grid', 'md:grid-cols-2', 'xl:grid-cols-3', 'gap-4');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>Mostrar menos';
      } else {
        hiddenMissions.classList.add('hidden');
        hiddenMissions.classList.remove('grid', 'md:grid-cols-2', 'xl:grid-cols-3', 'gap-4');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>Mostrar todas';
      }

      // Não é mais necessário reconfigurar botões - event listeners são globais
    });
  }
}

function createMissionCard(mission) {
  const yearLabels = { 1: '1º ano', 2: '2º ano', 3: '3º ano' };

  // Truncar descrição se for muito longa
  const maxDescLength = 120;
  const description = mission.description.length > maxDescLength
    ? mission.description.substring(0, maxDescLength) + '...'
    : mission.description;

  // Definir cor do header baseada no XP
  let headerColor = 'bg-blue-500'; // Default
  const xp = mission.xp || 0;

  if (xp >= 200) {
    headerColor = 'bg-green-500';
  } else if (xp >= 100) {
    headerColor = 'bg-blue-500';
  } else if (xp >= 50) {
    headerColor = 'bg-purple-500';
  } else {
    headerColor = 'bg-orange-500';
  }

  // Iniciais da missão
  const initials = mission.title ? mission.title.substring(0, 2).toUpperCase() : 'MI';

  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <!-- Header colorido -->
      <div class="relative ${headerColor} text-white p-4">
        <div class="absolute top-2 right-2 bg-white/20 rounded-full px-2 py-1 text-xs font-bold">
          ${xp} XP
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
            ${initials}
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg truncate">${mission.title}</h3>
            <p class="text-sm opacity-90">
              ${mission.targetYear ? yearLabels[mission.targetYear] : 'Todos os anos'}
            </p>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="p-4">
        <!-- Descrição -->
        <div class="mb-4">
          <p class="text-gray-600 text-sm leading-relaxed">${description}</p>
        </div>

        <!-- Tags -->
        <div class="mb-4 flex flex-wrap gap-2">
          ${mission.targetYear ?
      `<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">${yearLabels[mission.targetYear]}</span>` :
      `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">Todos</span>`
    }
          ${mission.targetClass === 'geral' ?
      `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Geral</span>` :
      `<span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">${mission.targetClass}</span>`
    }
        </div>

        <!-- Botões de ação -->
        <div class="grid grid-cols-2 gap-2">
          <button 
            data-mission-id="${mission.id}" 
            class="edit-mission-btn bg-blue-500 hover:bg-blue-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Editar Missão"
          >
            <i class="fas fa-edit mr-1"></i>Editar
          </button>
          
          <button 
            data-mission-id="${mission.id}" 
            class="delete-mission-btn bg-red-500 hover:bg-red-600 text-white p-2 rounded text-xs flex items-center justify-center transition-colors"
            title="Excluir Missão"
          >
            <i class="fas fa-trash mr-1"></i>Excluir
          </button>
        </div>

        <!-- Info adicional -->
        <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <div class="flex items-center">
            <i class="fas fa-calendar-alt mr-1"></i>
            Criada em 2025
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Ativa
          </div>
        </div>
      </div>
    </div>
  `;
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

async function missionAction(missionId, method) {
  try {
    const response = await apiRequest(`/missoes/${missionId}`, { method });

    // Mostrar mensagem do backend se disponível
    if (response && response.message) {
      alert(response.message);
    }
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
      body: JSON.stringify(missionData)
    });

    console.log('[DEBUG MASTER] Missão ' + (isEditing ? 'editada' : 'criada') + ' com sucesso:', result);
    alert('Missão ' + (isEditing ? 'editada' : 'criada') + ' com sucesso!');

    // Limpar formulário e resetar estado
    clearMissionForm();
    cancelMissionEdit();

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

// Função para download de arquivos de submissões
async function downloadFile(filePath) {
  try {
    console.log('[MASTER] Iniciando download do arquivo:', filePath);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }

    // Extrair nome do arquivo
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();

    // Fazer requisição para o endpoint de download
    const response = await fetch(`${API_URL}/submissoes/download-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao baixar arquivo');
    }

    // Obter o blob do arquivo
    const blob = await response.blob();

    // Criar URL temporária e fazer download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Limpeza
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[MASTER] Download concluído:', fileName);

  } catch (error) {
    console.error('[MASTER] Erro no download:', error);
    alert(`Erro ao baixar arquivo: ${error.message}`);
  }
}

// ====== CONFIGURAÇÃO GLOBAL DE EVENT LISTENERS ======
function setupGlobalEventListeners() {
  // Event listeners para submissões
  setupEventListeners('.approve-submission-btn', async (e) => {
    const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));
    await submissionAction(submissionId, 'approve');
  });

  setupEventListeners('.reject-submission-btn', async (e) => {
    const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));
    await submissionAction(submissionId, 'reject');
  });

  // Event listener para download de arquivos - configurado apenas uma vez
  setupEventListeners('.download-file-btn', async (e) => {
    e.preventDefault();
    const filePath = e.target.closest('button').getAttribute('data-file-path');
    await downloadFile(filePath);
  });

  // Event listeners para usuários pendentes
  setupEventListeners('.approve-btn', async (e) => {
    const userId = parseInt(e.target.closest('button').getAttribute('data-user-id'));

    if (confirm('Tem certeza que deseja aprovar este usuário?')) {
      await userAction('approve-user', { userId });
      loadPendingUsers();
      loadApprovedStudents();
    }
  });

  setupEventListeners('.reject-btn', async (e) => {
    const userId = parseInt(e.target.closest('button').getAttribute('data-user-id'));

    if (!confirm('Tem certeza que deseja rejeitar este usuário?')) return;
    await userAction('reject-user', { userId });
    loadPendingUsers();
  });

  // Event listeners para alunos
  setupEventListeners('.penalty-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

    // Criar modal para input de penalidade
    const modal = createPenaltyRewardModal('Aplicar Penalidade', studentName, 'penalty');
    document.body.appendChild(modal);

    // Event listener para confirmar penalidade
    modal.querySelector('.confirm-btn').addEventListener('click', async () => {
      const xp = modal.querySelector('#xp-input').value;
      const reason = modal.querySelector('#reason-input').value;

      if (xp && !isNaN(xp) && parseInt(xp) > 0) {
        document.body.removeChild(modal);
        await userAction('penalty', {
          studentId: parseInt(studentId),
          penalty: parseInt(xp),
          reason: reason.trim() || 'Sem motivo especificado'
        });
        loadApprovedStudents();
      } else {
        alert('Por favor, digite um valor de XP válido.');
      }
    });

    // Event listener para cancelar
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  });

  setupEventListeners('.reward-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

    // Criar modal para input de recompensa
    const modal = createPenaltyRewardModal('Aplicar Recompensa', studentName, 'reward');
    document.body.appendChild(modal);

    // Event listener para confirmar recompensa
    modal.querySelector('.confirm-btn').addEventListener('click', async () => {
      const xp = modal.querySelector('#xp-input').value;
      const reason = modal.querySelector('#reason-input').value;

      if (xp && !isNaN(xp) && parseInt(xp) > 0) {
        document.body.removeChild(modal);
        await userAction('reward', {
          studentId: parseInt(studentId),
          reward: parseInt(xp),
          reason: reason.trim() || 'Sem motivo especificado'
        });
        loadApprovedStudents();
      } else {
        alert('Por favor, digite um valor de XP válido.');
      }
    });

    // Event listener para cancelar
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  });

  setupEventListeners('.info-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    try {
      const studentDetails = await apiRequest(`/usuarios/student-details/${studentId}`);

      // Criar modal com informações detalhadas
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Detalhes do Estudante</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <!-- Informações Básicas -->
            <div>
              <h3 class="text-lg font-semibold mb-3 text-blue-600">Informações Básicas</h3>
              <div class="space-y-2">
                <p><span class="font-medium">Nome:</span> ${studentDetails.student.username}</p>
                <p><span class="font-medium">Nome Completo:</span> ${studentDetails.student.fullname || 'Não informado'}</p>
                <p><span class="font-medium">Classe:</span> ${studentDetails.student.class || 'Não definida'}</p>
                <p><span class="font-medium">Ano:</span> ${studentDetails.student.year || 'Não definido'}</p>
                <p><span class="font-medium">XP Total:</span> ${studentDetails.student.xp || 0}</p>
                <p><span class="font-medium">Nível:</span> ${studentDetails.student.level || 1}</p>
              </div>
            </div>
            
            <!-- Estatísticas -->
            <div>
              <h3 class="text-lg font-semibold mb-3 text-green-600">Estatísticas</h3>
              <div class="space-y-2">
                <p><span class="font-medium">Total de Submissões:</span> ${studentDetails.stats.totalSubmissions}</p>
                <p><span class="font-medium text-green-600">Aprovadas:</span> ${studentDetails.stats.approvedSubmissions}</p>
                <p><span class="font-medium text-yellow-600">Pendentes:</span> ${studentDetails.stats.pendingSubmissions}</p>
                <p><span class="font-medium text-red-600">Rejeitadas:</span> ${studentDetails.stats.rejectedSubmissions}</p>
                <div class="mt-3 p-3 bg-blue-50 rounded">
                  <p class="text-sm"><span class="font-medium">Progresso do Nível:</span></p>
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${studentDetails.levelInfo.progressPercentage || 0}%"></div>
                  </div>
                  <p class="text-xs text-gray-600 mt-1">${studentDetails.levelInfo.xpProgressInCurrentLevel || 0}/${studentDetails.levelInfo.xpNeededForCurrentLevel || 100} XP</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Fechar
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (error) {
      console.error('Erro ao carregar detalhes do estudante:', error);
      alert(`Erro ao carregar informações: ${error.message}`);
    }
  });

  setupEventListeners('.expel-btn', async (e) => {
    const studentId = e.target.closest('button').getAttribute('data-student-id');
    const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

    if (confirm(`Tem certeza que deseja expulsar "${studentName}"?`) &&
      confirm('CONFIRMAÇÃO FINAL: Esta ação não pode ser desfeita!')) {
      await userAction('expel-student', { studentId: parseInt(studentId) });
      loadApprovedStudents();
    }
  });

  // Event listeners para missões
  setupEventListeners('.edit-mission-btn', async (e) => {
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    await editMission(missionId);
  });

  setupEventListeners('.delete-mission-btn', async (e) => {
    if (!confirm('Tem certeza que deseja excluir esta missão?')) return;
    const missionId = e.target.closest('button').getAttribute('data-mission-id');
    await missionAction(missionId, 'DELETE');
  });
}