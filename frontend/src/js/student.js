// Importar o CSS para que o Vite processe o Tailwind CSS
import '../css/main.css';
import { showError, showSuccess, showWarning } from './utils/toast.js';

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG STUDENT] DOM carregado, iniciando aplicação student');

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const isMaster = localStorage.getItem('isMaster');

  console.log('[DEBUG STUDENT] Token:', token);
  console.log('[DEBUG STUDENT] Username:', username);
  console.log('[DEBUG STUDENT] IsMaster:', isMaster);

  if (!token) {
    console.error('[DEBUG STUDENT] Token não encontrado');
    showError('Acesso negado. Faça login como aluno.');
    setTimeout(() => window.location.href = './index.html', 2000);
    return;
  }

  if (!username) {
    console.error('[DEBUG STUDENT] Username não encontrado');
    showError('Acesso negado. Dados de usuário não encontrados.');
    setTimeout(() => window.location.href = './index.html', 2000);
    return;
  }

  if (isMaster === 'true') {
    showWarning('Acesso negado. Esta área é exclusiva para alunos.');
    setTimeout(() => window.location.href = './master.html', 2000);
    return;
  }

  await loadStudentInfo();
  console.log('[DEBUG STUDENT] Informações do aluno carregadas, agora carregando missões...');

  // Carregar missões após carregar informações do aluno para garantir que a filtragem funcione
  await loadMissions();
  loadSubmissionHistory();
  setupTabs();
});

async function loadStudentInfo() {
  console.log('[DEBUG STUDENT] Iniciando loadStudentInfo');

  // Definir nome do usuário do localStorage
  const username = localStorage.getItem('username');
  if (username) {
    document.getElementById('student-name').textContent = username;
  }

  document.getElementById('student-class').textContent = 'Carregando...';

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[DEBUG STUDENT] Token não encontrado no loadStudentInfo');
    document.getElementById('student-class').textContent = 'Erro: não autenticado';
    return;
  }

  try {
    console.log('[DEBUG STUDENT] Fazendo requisição para /usuarios/me');
    const res = await fetch(`${API_URL}/usuarios/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG STUDENT] Resposta /usuarios/me:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[DEBUG STUDENT] Dados do usuário:', data);

    // Armazenar informações do aluno globalmente
    studentInfo = data;
    console.log('[DEBUG STUDENT] studentInfo definida:', studentInfo);

    if (data) {
      document.getElementById('student-class').textContent = data.class || 'Classe não definida';

      // Exibir ano do estudante
      if (data.year) {
        const yearLabels = { 1: '1º ano - Front-end', 2: '2º ano - Back-end', 3: '3º ano - Mobile' };
        document.getElementById('student-year').textContent = yearLabels[data.year] || `${data.year}º ano`;
      } else {
        document.getElementById('student-year').textContent = '';
      }

      document.getElementById('student-level').textContent = data.level || 1;
      document.getElementById('total-xp').textContent = data.xp || 0;

      // Usar informações detalhadas do nível se disponíveis
      if (data.levelInfo) {
        const levelInfo = data.levelInfo;
        document.getElementById('current-xp').textContent = levelInfo.xpProgressInCurrentLevel;
        document.getElementById('next-level-xp').textContent = levelInfo.xpNeededForCurrentLevel;
        document.getElementById('progress-percentage').textContent = `${levelInfo.progressPercentage}%`;

        // Barra de XP baseada no progresso do nível atual
        const porcentagem = levelInfo.progressPercentage || 0;
        const xpBar = document.getElementById('xp-bar');
        if (xpBar) {
          xpBar.style.width = `${Math.min(porcentagem, 100)}%`;
        }

        // Exibir informações adicionais se for nível máximo
        if (levelInfo.isMaxLevel) {
          document.getElementById('next-level-xp').textContent = 'MAX';
          document.getElementById('progress-percentage').textContent = 'Nível Máximo!';
        }
      } else {
        // Fallback para sistema antigo
        document.getElementById('current-xp').textContent = data.xp || 0;
        document.getElementById('next-level-xp').textContent = 100;
        document.getElementById('progress-percentage').textContent = '0%';

        // Barra de XP
        const porcentagem = ((data.xp || 0) / 100) * 100;
        const xpBar = document.getElementById('xp-bar');
        if (xpBar) {
          xpBar.style.width = `${Math.min(porcentagem, 100)}%`;
        }
      }
    }
  } catch (err) {
    console.error('[DEBUG STUDENT] Erro ao carregar informações do estudante:', err);
    document.getElementById('student-class').textContent = 'Erro ao carregar';
  }
}

async function loadMissions() {
  console.log('[DEBUG STUDENT] Iniciando loadMissions');

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[DEBUG STUDENT] Token não encontrado');
    return;
  }

  // Carregar primeiro as missões já submetidas
  console.log('[DEBUG STUDENT] Carregando missões completadas primeiro...');
  await loadCompletedMissions();
  console.log('[DEBUG STUDENT] Missões completadas carregadas:', studentCompletedMissions);

  try {
    console.log('[DEBUG STUDENT] Fazendo requisição para missões');
    const res = await fetch(`${API_URL}/missoes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG STUDENT] Resposta da requisição:', res.status);

    if (!res.ok) {
      console.error('[DEBUG STUDENT] Erro na resposta:', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('[DEBUG STUDENT] Missões recebidas:', data);

    // Filtrar missões por ano/classe do aluno
    let filteredMissions = data;
    if (studentInfo) {
      console.log('[DEBUG STUDENT] Filtrando missões para:');
      console.log('[DEBUG STUDENT] - Aluno ano:', studentInfo.year);
      console.log('[DEBUG STUDENT] - Aluno classe:', studentInfo.class);

      filteredMissions = data.filter(mission => {
        // Missão é geral (para todos) ou específica para o ano/classe do aluno
        const isForStudentYear = !mission.targetYear || mission.targetYear === studentInfo.year;
        const isForStudentClass = !mission.targetClass || mission.targetClass === 'geral' || mission.targetClass === studentInfo.class;

        const canSee = isForStudentYear && isForStudentClass;
        console.log(`[DEBUG STUDENT] Missão "${mission.title}":`, {
          targetYear: mission.targetYear,
          targetClass: mission.targetClass,
          isForStudentYear,
          isForStudentClass,
          canSee
        });

        return canSee;
      });
      console.log('[DEBUG STUDENT] Missões filtradas por ano/classe:', filteredMissions.length, 'de', data.length);
    } else {
      console.log('[DEBUG STUDENT] Informações do aluno não disponíveis ainda, mostrando todas as missões');
    }

    // Filtrar missões pendentes ou aprovadas - elas só ficam no histórico
    // Missões rejeitadas voltam para o painel para nova submissão
    console.log('[DEBUG STUDENT] Verificando missões já submetidas...');
    console.log('[DEBUG STUDENT] studentCompletedMissions (pendentes + aprovadas):', studentCompletedMissions);
    console.log('[DEBUG STUDENT] Missões antes do filtro de submissões:', filteredMissions.map(m => `${m.id}: ${m.title}`));

    if (studentCompletedMissions && studentCompletedMissions.length > 0) {
      const beforeFilter = filteredMissions.length;
      filteredMissions = filteredMissions.filter(mission => {
        const isCompleted = studentCompletedMissions.includes(mission.id);
        console.log(`[DEBUG STUDENT] Missão ${mission.id} (${mission.title}): já submetida = ${isCompleted}`);
        return !isCompleted;
      });
      console.log('[DEBUG STUDENT] Removidas missões pendentes/aprovadas:', beforeFilter - filteredMissions.length);
      console.log('[DEBUG STUDENT] Missões pendentes/aprovadas:', studentCompletedMissions);
      console.log('[DEBUG STUDENT] Missões finais a exibir (incluindo rejeitadas):', filteredMissions.map(m => `${m.id}: ${m.title}`));
    } else {
      console.log('[DEBUG STUDENT] Nenhuma missão pendente/aprovada encontrada, exibindo todas as missões disponíveis');
    }

    const missionsDiv = document.getElementById('missions');
    const select = document.getElementById('mission-select');

    if (!missionsDiv || !select) {
      console.error('[DEBUG STUDENT] Elementos não encontrados:', { missionsDiv, select });
      return;
    }

    missionsDiv.innerHTML = '';
    select.innerHTML = `<option value="">Selecione uma missão</option>`;

    if (filteredMissions.length === 0) {
      missionsDiv.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão disponível para sua classe/ano no momento.</p>';
      console.log('[DEBUG STUDENT] Nenhuma missão encontrada para o aluno');
      return;
    }

    filteredMissions.forEach(mission => {
      console.log('[DEBUG STUDENT] Renderizando missão:', mission.title);

      // Verificar se esta missão foi rejeitada anteriormente
      const wasRejected = studentRejectedMissions.includes(mission.id);
      console.log(`[DEBUG STUDENT] Missão ${mission.id} foi rejeitada anteriormente:`, wasRejected);

      const card = document.createElement('div');
      card.className = `bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4 ${wasRejected ? 'border-l-4 border-orange-400' : ''}`;

      const rejectedBadge = wasRejected ?
        '<span class="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full ml-2">Rejeitada - Reenvie</span>' : '';

      card.innerHTML = `
        <h3 class="font-bold text-lg text-purple-700">
          ${mission.title}
          ${rejectedBadge}
        </h3>
        <p class="text-gray-600 mb-2">${mission.description}</p>
        <span class="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">XP: ${mission.xp}</span>
        ${wasRejected ? '<p class="text-orange-600 text-sm mt-2"><i class="fas fa-exclamation-triangle mr-1"></i>Esta missão foi rejeitada. Você pode submeter novamente.</p>' : ''}
      `;
      missionsDiv.appendChild(card);

      const opt = document.createElement('option');
      opt.value = mission.id;
      opt.textContent = mission.title;
      select.appendChild(opt);
    });

    console.log('[DEBUG STUDENT] Missões renderizadas com sucesso');

    // Carregar dados para filtros após renderizar as missões
    await loadMissionsForFilters();

  } catch (err) {
    console.error('[DEBUG STUDENT] Erro ao carregar missões:', err);
    const missionsDiv = document.getElementById('missions');
    if (missionsDiv) {
      missionsDiv.innerHTML = `<p class="text-red-500 py-4">Erro ao carregar missões: ${err.message}</p>`;
    }
  }
}

async function loadSubmissionHistory() {
  console.log('[DEBUG STUDENT] Iniciando loadSubmissionHistory');

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[DEBUG STUDENT] Token não encontrado');
    return;
  }

  try {
    console.log('[DEBUG STUDENT] Fazendo requisição para histórico de submissões');
    const res = await fetch(`${API_URL}/submissoes/my-submissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG STUDENT] Resposta da requisição:', res.status);

    if (!res.ok) {
      console.error('[DEBUG STUDENT] Erro na resposta:', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}`);
    }

    const submissions = await res.json();
    console.log('[DEBUG STUDENT] Histórico de submissões recebido:', submissions);

    displaySubmissionHistory(submissions);
  } catch (err) {
    console.error('[DEBUG STUDENT] Erro ao carregar histórico:', err);
    const historyDiv = document.getElementById('submission-history');
    if (historyDiv) {
      historyDiv.innerHTML = `<p class="text-red-500 py-4">Erro ao carregar histórico: ${err.message}</p>`;
    }
  }
}

function displaySubmissionHistory(submissions) {
  console.log('[DEBUG STUDENT] Exibindo histórico de submissões:', submissions);

  const historyDiv = document.getElementById('submission-history');
  if (!historyDiv) {
    console.error('[DEBUG STUDENT] Container submission-history não encontrado');
    return;
  }

  if (submissions.length === 0) {
    historyDiv.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
        <p class="text-gray-500 text-lg">Nenhuma submissão realizada ainda</p>
        <p class="text-gray-400 text-sm">Suas submissões aparecerão aqui após serem enviadas</p>
      </div>
    `;
    return;
  }

  historyDiv.innerHTML = submissions.map(submission => {
    const statusInfo = getSubmissionStatus(submission);
    const submittedDate = new Date(submission.submittedAt).toLocaleString('pt-BR');

    return `
      <div class="bg-white p-6 rounded-lg shadow border-l-4 ${statusInfo.borderColor}">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800">${submission.missionTitle}</h3>
            <p class="text-gray-600 text-sm mb-3">${submission.missionDescription}</p>
            
            <div class="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span class="text-gray-500">Data de envio:</span>
                <p class="font-medium">${submittedDate}</p>
              </div>
              <div>
                <span class="text-gray-500">XP da missão:</span>
                <p class="font-medium text-purple-600">${submission.xp} XP</p>
              </div>
            </div>

            ${submission.filePaths && submission.filePaths.length > 0 ? `
              <div class="mb-3">
                <span class="text-gray-500 text-sm">Arquivos enviados:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${submission.filePaths.map(filePath => {
      const fileName = filePath.split('/').pop().split('\\').pop();
      const cleanFileName = fileName.split('_').slice(-1)[0].includes('.') ?
        fileName.split('_').slice(-1)[0] : fileName;
      return `<span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">${cleanFileName}</span>`;
    }).join('')}
                </div>
              </div>
            ` : ''}

            ${submission.feedback ? `
              <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <span class="text-blue-800 text-sm font-medium">Feedback do professor:</span>
                <p class="text-blue-700 text-sm mt-1">${submission.feedback}</p>
              </div>
            ` : ''}
          </div>
          
          <div class="ml-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}">
              <i class="${statusInfo.icon} mr-1"></i>
              ${statusInfo.label}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getSubmissionStatus(submission) {
  if (submission.pending) {
    return {
      label: 'Pendente',
      icon: 'fas fa-clock',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-400'
    };
  } else if (submission.approved) {
    return {
      label: 'Aprovada',
      icon: 'fas fa-check-circle',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-400'
    };
  } else {
    return {
      label: 'Rejeitada',
      icon: 'fas fa-times-circle',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-400'
    };
  }
}

async function submitCode() {
  console.log('[DEBUG STUDENT] Iniciando submitCode');

  const token = localStorage.getItem('token');
  const missionId = document.getElementById('mission-select').value;
  const files = document.getElementById('code-upload').files;

  console.log('[DEBUG STUDENT] Dados para submissão:', {
    token: token ? 'Token presente' : 'Token ausente',
    missionId,
    filesCount: files.length
  });

  if (!token) {
    showError('Erro: Você não está autenticado. Faça login novamente.');
    return;
  }

  if (!missionId) {
    showWarning('Por favor, selecione uma missão.');
    return;
  }

  if (files.length === 0) {
    showWarning('Por favor, selecione pelo menos um arquivo de código.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('missionId', missionId);

    // Adicionar arquivos com o nome correto esperado pelo backend
    for (const file of files) {
      formData.append('code', file);
      console.log('[DEBUG STUDENT] Arquivo adicionado:', file.name);
    }

    console.log('[DEBUG STUDENT] Fazendo requisição para submissão');
    const res = await fetch(`${API_URL}/submissoes/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Não adicionar Content-Type para FormData, o browser define automaticamente
      },
      body: formData
    });

    console.log('[DEBUG STUDENT] Resposta da submissão:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('[DEBUG STUDENT] Submissão enviada com sucesso:', data);
      showSuccess('Código enviado com sucesso!');

      // Limpar formulário
      document.getElementById('mission-select').value = '';
      document.getElementById('code-upload').value = '';

      // Limpar display de arquivos selecionados
      const filesDisplay = document.getElementById('selected-files-display');
      if (filesDisplay) {
        filesDisplay.innerHTML = '';
      }

      // Recarregar missões para remover a missão submetida do painel
      console.log('[DEBUG STUDENT] Recarregando missões após submissão...');

      // Aguardar um pouco para o backend processar
      await new Promise(resolve => setTimeout(resolve, 500));

      await loadCompletedMissions(); // Atualizar lista de missões submetidas
      console.log('[DEBUG STUDENT] Missões completadas atualizadas, recarregando painel...');

      await loadMissions(); // Recarregar painel de missões
      console.log('[DEBUG STUDENT] Painel de missões recarregado com sucesso');

      // Também recarregar o histórico para mostrar a nova submissão
      loadSubmissionHistory();
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('[DEBUG STUDENT] Erro na submissão:', res.status, errorData);
      showError(`Erro ao enviar submissão: ${errorData.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    console.error('[DEBUG STUDENT] Erro na requisição de submissão:', err);
    showError('Erro ao conectar com o servidor.');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-blue-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-blue-600');
      contents[index].classList.remove('hidden');

      // Carregar dados específicos da aba
      const tabId = tab.id;
      if (tabId === 'tab-missions') {
        loadMissions();
      } else if (tabId === 'tab-history') {
        loadSubmissionHistory();
      }
    });
  });
}

// Configurar event listeners adicionais após o DOM ser carregado
document.addEventListener('DOMContentLoaded', () => {
  // Event listener para o botão de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    import('./auth.js').then(module => {
      logoutBtn.addEventListener('click', module.logout);
    });
  }

  // Event listener para o botão de submeter código
  const submitCodeBtn = document.getElementById('submit-code-btn');
  if (submitCodeBtn) {
    submitCodeBtn.addEventListener('click', submitCode);
  }

  // Event listener para mostrar arquivos selecionados
  const fileInput = document.getElementById('code-upload');
  if (fileInput) {
    fileInput.addEventListener('change', displaySelectedFiles);

    // Adicionar funcionalidade de drag & drop
    const dropZone = fileInput.parentElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
      dropZone.classList.add('border-blue-500', 'bg-blue-100');
    }

    function unhighlight(e) {
      dropZone.classList.remove('border-blue-500', 'bg-blue-100');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      fileInput.files = files;
      displaySelectedFiles();
    }
  }
});

function displaySelectedFiles() {
  const fileInput = document.getElementById('code-upload');
  const files = fileInput.files;

  // Criar ou encontrar o container para mostrar os arquivos
  let filesDisplay = document.getElementById('selected-files-display');
  if (!filesDisplay) {
    filesDisplay = document.createElement('div');
    filesDisplay.id = 'selected-files-display';
    filesDisplay.className = 'mt-2';
    fileInput.parentNode.insertBefore(filesDisplay, fileInput.nextSibling);
  }

  if (files.length === 0) {
    filesDisplay.innerHTML = '';
    return;
  }

  console.log('[DEBUG STUDENT] Arquivos selecionados:', files.length);

  // Calcular tamanho total
  let totalSize = 0;
  for (let file of files) {
    totalSize += file.size;
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  filesDisplay.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-blue-800">
          <i class="fas fa-files mr-1"></i>
          ${files.length} arquivo(s) selecionado(s)
        </span>
        <span class="text-sm text-blue-600">
          Total: ${formatFileSize(totalSize)}
        </span>
      </div>
      <div class="space-y-1">
        ${Array.from(files).map((file, index) => `
          <div class="flex items-center justify-between bg-white p-2 rounded border">
            <div class="flex items-center space-x-2">
              <i class="fas fa-file-code text-gray-400"></i>
              <span class="text-sm text-gray-700">${file.name}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">${formatFileSize(file.size)}</span>
              <button onclick="removeFile(${index})" class="text-red-500 hover:text-red-700 text-xs">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function removeFile(index) {
  const fileInput = document.getElementById('code-upload');
  const dt = new DataTransfer();

  // Recriar a lista de arquivos sem o arquivo removido
  for (let i = 0; i < fileInput.files.length; i++) {
    if (i !== index) {
      dt.items.add(fileInput.files[i]);
    }
  }

  fileInput.files = dt.files;
  displaySelectedFiles();
}

// Variables para armazenar dados originais
let originalMissions = [];
let originalSubmissionHistory = [];
let studentCompletedMissions = []; // IDs das missões já completadas pelo aluno (pendentes + aprovadas)
let studentRejectedMissions = []; // IDs das missões rejeitadas (que voltam para o painel)
let studentInfo = null; // Informações do aluno atual (ano, classe, etc.)

// Funções de filtro para missões (aluno)
function setupMissionFiltersStudent() {
  const applyBtn = document.getElementById('apply-mission-filters-student');
  const clearBtn = document.getElementById('clear-mission-filters-student');

  applyBtn?.addEventListener('click', applyMissionFiltersStudent);
  clearBtn?.addEventListener('click', clearMissionFiltersStudent);
}

function applyMissionFiltersStudent() {
  const difficultyFilter = document.getElementById('filter-mission-difficulty').value;
  const classFilter = document.getElementById('filter-mission-target-class').value;

  let filteredMissions = [...originalMissions];

  // Filtrar por dificuldade (XP)
  if (difficultyFilter) {
    filteredMissions = filteredMissions.filter(mission => {
      const xp = mission.xp;
      switch (difficultyFilter) {
        case '0-50':
          return xp >= 0 && xp <= 50;
        case '51-100':
          return xp >= 51 && xp <= 100;
        case '101-200':
          return xp >= 101 && xp <= 200;
        case '201+':
          return xp >= 201;
        default:
          return true;
      }
    });
  }

  // Filtrar por classe alvo
  if (classFilter) {
    filteredMissions = filteredMissions.filter(mission =>
      mission.targetClass === classFilter || mission.targetClass === 'geral'
    );
  }

  displayFilteredMissionsStudent(filteredMissions);
}

function clearMissionFiltersStudent() {
  document.getElementById('filter-mission-difficulty').value = '';
  document.getElementById('filter-mission-target-class').value = '';
  displayFilteredMissionsStudent(originalMissions);
}

function displayFilteredMissionsStudent(missions) {
  const container = document.getElementById('missions');
  container.innerHTML = '';

  if (missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão disponível no momento. Verifique seu histórico para ver missões já submetidas. Missões rejeitadas voltarão a aparecer aqui.</p>';
    return;
  }

  missions.forEach(mission => {
    const difficultyColor = mission.xp <= 50 ? 'text-green-600' :
      mission.xp <= 100 ? 'text-yellow-600' :
        mission.xp <= 200 ? 'text-orange-600' : 'text-red-600';

    const difficultyText = mission.xp <= 50 ? 'Fácil' :
      mission.xp <= 100 ? 'Médio' :
        mission.xp <= 200 ? 'Difícil' : 'Muito Difícil';

    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-blue-500';

    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-2">
            <h3 class="text-xl font-bold">${mission.title}</h3>
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">✓ Disponível</span>
          </div>
          <p class="text-gray-600 mb-3">${mission.description}</p>
          <div class="flex flex-wrap gap-3 text-sm">
            <span class="${difficultyColor} font-semibold">
              <i class="fas fa-star mr-1"></i>${mission.xp} XP - ${difficultyText}
            </span>
            <span class="text-blue-600">
              <i class="fas fa-graduation-cap mr-1"></i>${mission.targetYear ? `${mission.targetYear}º ano` : 'Todos os anos'}
            </span>
            <span class="text-purple-600">
              <i class="fas fa-shield-alt mr-1"></i>${mission.targetClass}
            </span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Funções de filtro para histórico
function setupHistoryFilters() {
  const applyBtn = document.getElementById('apply-history-filters');
  const clearBtn = document.getElementById('clear-history-filters');

  applyBtn?.addEventListener('click', applyHistoryFilters);
  clearBtn?.addEventListener('click', clearHistoryFilters);
}

function applyHistoryFilters() {
  const statusFilter = document.getElementById('filter-history-status').value;
  const periodFilter = document.getElementById('filter-history-period').value;
  const missionFilter = document.getElementById('filter-history-mission').value.toLowerCase();

  let filteredHistory = [...originalSubmissionHistory];

  // Filtrar por status
  if (statusFilter) {
    filteredHistory = filteredHistory.filter(submission =>
      submission.status === statusFilter
    );
  }

  // Filtrar por período
  if (periodFilter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    filteredHistory = filteredHistory.filter(submission => {
      const submissionDate = new Date(submission.createdAt);

      switch (periodFilter) {
        case 'today':
          return submissionDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return submissionDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return submissionDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return submissionDate >= yearAgo;
        default:
          return true;
      }
    });
  }

  // Filtrar por nome da missão
  if (missionFilter) {
    filteredHistory = filteredHistory.filter(submission =>
      submission.missionTitle?.toLowerCase().includes(missionFilter)
    );
  }

  displayFilteredHistory(filteredHistory);
}

function clearHistoryFilters() {
  document.getElementById('filter-history-status').value = '';
  document.getElementById('filter-history-period').value = '';
  document.getElementById('filter-history-mission').value = '';
  displayFilteredHistory(originalSubmissionHistory);
}

function displayFilteredHistory(history) {
  const container = document.getElementById('submission-history');
  container.innerHTML = '';

  if (history.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma submissão encontrada com os filtros aplicados.</p>';
    return;
  }

  history.forEach(submission => {
    const statusColor = submission.status === 'approved' ? 'text-green-600' :
      submission.status === 'rejected' ? 'text-red-600' : 'text-yellow-600';

    const statusIcon = submission.status === 'approved' ? 'fa-check-circle' :
      submission.status === 'rejected' ? 'fa-times-circle' : 'fa-clock';

    const statusText = submission.status === 'approved' ? 'Aprovado' :
      submission.status === 'rejected' ? 'Rejeitado' : 'Pendente';

    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow hover:shadow-md transition border-l-4 ' +
      (submission.status === 'approved' ? 'border-green-500' :
        submission.status === 'rejected' ? 'border-red-500' : 'border-yellow-500');

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-semibold text-lg mb-2">${submission.missionTitle || 'Missão não encontrada'}</h4>
          <div class="space-y-1 text-sm text-gray-600">
            <p><i class="fas fa-calendar mr-2"></i>Enviado em: ${new Date(submission.createdAt).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
            <p class="${statusColor} font-medium">
              <i class="fas ${statusIcon} mr-2"></i>Status: ${statusText}
            </p>
            ${submission.feedback ? `<p class="text-gray-700 mt-2"><strong>Feedback:</strong> ${submission.feedback}</p>` : ''}
          </div>
        </div>
        <div class="ml-4">
          <button onclick="viewSubmissionDetails(${submission.id})" 
                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition">
            <i class="fas fa-eye mr-1"></i>Ver Detalhes
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Função para carregar missões completadas/submetidas
async function loadCompletedMissions() {
  console.log('[DEBUG STUDENT] Iniciando loadCompletedMissions...');

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[DEBUG STUDENT] Token não encontrado em loadCompletedMissions');
      return;
    }

    console.log('[DEBUG STUDENT] Fazendo requisição para my-submissions...');
    const res = await fetch(`${API_URL}/submissoes/my-submissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('[DEBUG STUDENT] Resposta da requisição my-submissions:', res.status, res.ok);

    if (res.ok) {
      const submissions = await res.json();
      console.log('[DEBUG STUDENT] Submissões recebidas:', submissions);

      // Incluir apenas missões pendentes ou aprovadas (removidas do painel)
      // Missões rejeitadas voltam para o painel para nova submissão
      const previousLength = studentCompletedMissions ? studentCompletedMissions.length : 0;
      studentCompletedMissions = submissions
        .filter(sub => sub.pending || sub.approved) // Apenas pendentes ou aprovadas
        .map(sub => sub.missionId);

      // Armazenar também as missões rejeitadas para indicação visual
      studentRejectedMissions = submissions
        .filter(sub => !sub.pending && !sub.approved) // Rejeitadas
        .map(sub => sub.missionId);

      console.log('[DEBUG STUDENT] Submissões por status:');
      const pending = submissions.filter(sub => sub.pending);
      const approved = submissions.filter(sub => sub.approved);
      const rejected = submissions.filter(sub => !sub.pending && !sub.approved);

      console.log('[DEBUG STUDENT] - Pendentes:', pending.length, pending.map(s => `${s.missionId}(${s.missionTitle})`));
      console.log('[DEBUG STUDENT] - Aprovadas:', approved.length, approved.map(s => `${s.missionId}(${s.missionTitle})`));
      console.log('[DEBUG STUDENT] - Rejeitadas:', rejected.length, rejected.map(s => `${s.missionId}(${s.missionTitle})`));

      console.log('[DEBUG STUDENT] Missões removidas do painel (pendentes + aprovadas):', studentCompletedMissions);
      console.log('[DEBUG STUDENT] Missões que voltam para o painel (rejeitadas):', studentRejectedMissions);
      console.log('[DEBUG STUDENT] Total de missões removidas do painel:', studentCompletedMissions.length, '(anteriormente:', previousLength, ')');
    } else {
      const errorText = await res.text().catch(() => 'Erro desconhecido');
      console.error('[DEBUG STUDENT] Erro na requisição my-submissions:', res.status, errorText);
      // Manter array vazio se houver erro
      studentCompletedMissions = studentCompletedMissions || [];
    }
  } catch (error) {
    console.error('[DEBUG STUDENT] Erro ao carregar missões completadas:', error);
    // Manter array vazio se houver erro
    studentCompletedMissions = studentCompletedMissions || [];
  }
}

// Função para atualizar opções dos filtros baseado nas missões disponíveis para o aluno
function updateFilterOptions() {
  if (!originalMissions || !studentInfo) return;

  console.log('[DEBUG STUDENT] Atualizando opções dos filtros para', originalMissions.length, 'missões');

  // Atualizar filtro de classe - apenas mostrar as classes que têm missões disponíveis para o aluno
  const classFilter = document.getElementById('filter-mission-target-class');
  if (classFilter) {
    // Manter apenas as opções relevantes (sem "Todas as classes")
    const defaultOptions = `
      <option value="">Selecione uma classe</option>
      <option value="geral">Geral</option>
    `;

    // Adicionar apenas as classes que aparecem nas missões disponíveis
    const availableClasses = [...new Set(
      originalMissions
        .map(mission => mission.targetClass)
        .filter(targetClass => targetClass && targetClass !== 'geral')
    )];

    const classOptions = availableClasses.map(className =>
      `<option value="${className}">${className}</option>`
    ).join('');

    classFilter.innerHTML = defaultOptions + classOptions;
    console.log('[DEBUG STUDENT] Classes disponíveis nos filtros:', availableClasses);
  }
}

// Função para carregar dados para filtros
async function loadMissionsForFilters() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/missoes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const allMissions = await res.json();

      // Filtrar missões por ano/classe do aluno antes de armazenar
      if (studentInfo) {
        let filteredForStudent = allMissions.filter(mission => {
          const isForStudentYear = !mission.targetYear || mission.targetYear === studentInfo.year;
          const isForStudentClass = !mission.targetClass || mission.targetClass === 'geral' || mission.targetClass === studentInfo.class;
          return isForStudentYear && isForStudentClass;
        });

        // Remover apenas missões pendentes ou aprovadas dos filtros (rejeitadas ficam disponíveis)
        if (studentCompletedMissions && studentCompletedMissions.length > 0) {
          filteredForStudent = filteredForStudent.filter(mission =>
            !studentCompletedMissions.includes(mission.id)
          );
        }

        originalMissions = filteredForStudent;
        console.log('[DEBUG STUDENT] Missões filtradas para filtros:', originalMissions.length, 'de', allMissions.length);
      } else {
        originalMissions = allMissions;
      }

      displayFilteredMissionsStudent(originalMissions);
      setupMissionFiltersStudent();
      updateFilterOptions();
    }
  } catch (error) {
    console.error('Erro ao carregar missões para filtros:', error);
  }
}

// Função para carregar histórico para filtros
async function loadSubmissionHistoryForFilters() {
  await loadSubmissionHistory();

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/submissoes/my-submissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      originalSubmissionHistory = await res.json();
      displayFilteredHistory(originalSubmissionHistory);
      setupHistoryFilters();
    }
  } catch (error) {
    console.error('Erro ao carregar histórico para filtros:', error);
  }
}
