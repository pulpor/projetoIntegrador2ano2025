// Importar o CSS para que o Vite processe o Tailwind CSS
import './index.css';

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
    alert('Acesso negado. Faça login como aluno.');
    window.location.href = './index.html';
    return;
  }

  if (!username) {
    console.error('[DEBUG STUDENT] Username não encontrado');
    alert('Acesso negado. Dados de usuário não encontrados.');
    window.location.href = './index.html';
    return;
  }

  if (isMaster === 'true') {
    alert('Acesso negado. Esta área é exclusiva para alunos.');
    window.location.href = './master.html';
    return;
  }

  try {
    await loadStudentInfo();
    console.log('[DEBUG STUDENT] Informações do aluno carregadas, agora carregando missões...');

    // Carregar missões após carregar informações do aluno para garantir que a filtragem funcione
    await loadMissions();
    await loadSubmissionHistory();
    await loadActionHistory(); // Carregar histórico de ações inicialmente
    setupTabs();
  } catch (error) {
    console.error('[DEBUG STUDENT] Erro no carregamento inicial:', error);
  }
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

    // Armazenar globalmente para acesso nos modais
    window.availableMissions = filteredMissions;

    const missionsDiv = document.getElementById('missions');
    const select = document.getElementById('mission-select');

    console.log('[DEBUG STUDENT] Elementos encontrados:', {
      missionsDiv: !!missionsDiv,
      select: !!select
    });

    if (!missionsDiv || !select) {
      console.error('[DEBUG STUDENT] Elementos não encontrados:', { missionsDiv, select });
      return;
    }

    console.log('[DEBUG STUDENT] Limpando conteúdo anterior...');
    missionsDiv.innerHTML = '';
    select.innerHTML = `<option value="">Selecione uma missão</option>`;

    if (filteredMissions.length === 0) {
      const noMissionsMsg = '<p class="text-gray-500 py-4">Nenhuma missão disponível para sua classe/ano no momento.</p>';
      missionsDiv.innerHTML = noMissionsMsg;
      console.log('[DEBUG STUDENT] Nenhuma missão encontrada para o aluno');
      return;
    }

    console.log('[DEBUG STUDENT] Renderizando', filteredMissions.length, 'missões...');

    filteredMissions.forEach(mission => {
      console.log('[DEBUG STUDENT] Renderizando missão:', mission.title);

      // Verificar se esta missão foi rejeitada anteriormente
      const wasRejected = studentRejectedMissions.includes(mission.id);
      console.log(`[DEBUG STUDENT] Missão ${mission.id} foi rejeitada anteriormente:`, wasRejected);

      // Definir cor do header baseada no XP da missão
      let headerColor = 'bg-blue-500'; // Default
      const missionXP = mission.xp || 0;

      if (missionXP >= 100) {
        headerColor = 'bg-green-500';
      } else if (missionXP >= 50) {
        headerColor = 'bg-purple-500';
      } else if (missionXP >= 25) {
        headerColor = 'bg-blue-500';
      } else {
        headerColor = 'bg-orange-500';
      }

      // Se foi rejeitada, usar cor especial
      if (wasRejected) {
        headerColor = 'bg-red-500';
      }

      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden mb-4';

      const rejectedBadge = wasRejected ?
        '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center"><i class="fas fa-exclamation-triangle mr-1"></i>Rejeitada</div>' :
        '<div class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center"><i class="fas fa-star mr-1"></i>Disponível</div>';

      // Iniciais da missão (primeira letra do título)
      const initials = mission.title ? mission.title[0].toUpperCase() : 'M';

      card.innerHTML = `
        <!-- Header colorido -->
        <div class="relative ${headerColor} text-white p-4">
          ${rejectedBadge}
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              ${initials}
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg leading-tight">${mission.title}</h3>
              <p class="text-sm opacity-90">Missão RPG</p>
            </div>
          </div>
        </div>

        <!-- Conteúdo principal -->
        <div class="p-4">
          <!-- Descrição -->
          <div class="mb-4">
            <p class="text-gray-600 text-sm line-clamp-3">${mission.description}</p>
          </div>

          <!-- Stats XP -->
          <div class="mb-4">
            <div class="flex items-center justify-center p-3 bg-green-50 rounded-lg">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${mission.xp}</div>
                <div class="text-sm text-green-700">XP Reward</div>
              </div>
            </div>
          </div>

          ${wasRejected ? `
          <!-- Aviso de rejeição -->
          <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center text-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              <span class="text-sm font-medium">Esta missão foi rejeitada. Você pode submeter novamente.</span>
            </div>
          </div>
          ` : ''}

          <!-- Botão de ação -->
          <div class="mt-4">
            <button onclick="openSubmissionModal(${mission.id})" 
                    class="w-full ${wasRejected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
              <i class="fas ${wasRejected ? 'fa-redo' : 'fa-paper-plane'} mr-2"></i>
              ${wasRejected ? 'Reenviar Missão' : 'Submeter Missão'}
            </button>
          </div>
        </div>
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

// Função para abrir modal de submissão para uma missão específica
function openSubmissionModal(missionId) {
  console.log('[DEBUG STUDENT] Abrindo modal de submissão para missão:', missionId);

  // Encontrar a missão no array global
  const mission = window.availableMissions?.find(m => m.id === missionId);
  if (!mission) {
    alert('Missão não encontrada');
    return;
  }

  // Criar modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">Submeter Missão</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
      </div>
      
      <div class="mb-4">
        <h3 class="font-semibold text-lg text-purple-700 mb-2">${mission.title}</h3>
        <p class="text-gray-600 text-sm mb-2">${mission.description}</p>
        <div class="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
          <i class="fas fa-star mr-1"></i>XP: ${mission.xp}
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-file-code mr-2"></i>Arquivos de Código
        </label>
        <input 
          type="file" 
          id="modal-code-upload" 
          multiple 
          accept=".js,.html,.css,.py,.java,.cpp,.c,.php,.rb,.go,.ts,.jsx,.vue,.json"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        <p class="text-xs text-gray-500 mt-1">
          Selecione os arquivos de código da sua solução (.js, .html, .css, .py, etc.)
        </p>
        <div id="modal-selected-files" class="mt-2"></div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors">
          Cancelar
        </button>
        <button onclick="submitFromModal(${missionId})" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors">
          <i class="fas fa-paper-plane mr-2"></i>Submeter
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Adicionar listener para mostrar arquivos selecionados
  const fileInput = modal.querySelector('#modal-code-upload');
  const filesDisplay = modal.querySelector('#modal-selected-files');

  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      filesDisplay.innerHTML = `
        <div class="text-sm text-gray-600">
          <i class="fas fa-paperclip mr-2"></i>Arquivos selecionados (${files.length}):
          <ul class="list-disc list-inside ml-4 mt-1">
            ${Array.from(files).map(file => `<li>${file.name}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      filesDisplay.innerHTML = '';
    }
  });
}

// Função para submeter do modal
async function submitFromModal(missionId) {
  console.log('[DEBUG STUDENT] Submetendo do modal para missão:', missionId);

  const modal = document.querySelector('.fixed');
  const fileInput = modal.querySelector('#modal-code-upload');
  const files = fileInput.files;

  if (files.length === 0) {
    alert('Por favor, selecione pelo menos um arquivo de código.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Erro: Você não está autenticado. Faça login novamente.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('missionId', missionId);

    // Adicionar arquivos
    for (const file of files) {
      formData.append('code', file);
      console.log('[DEBUG STUDENT] Arquivo adicionado:', file.name);
    }

    console.log('[DEBUG STUDENT] Fazendo requisição para submissão');
    const res = await fetch(`${API_URL}/submissoes/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[DEBUG STUDENT] Submissão enviada com sucesso:', data);
      alert('Código enviado com sucesso!');

      // Fechar modal
      document.body.removeChild(modal);

      // Recarregar dados
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadCompletedMissions();
      await loadMissions();

    } else {
      const errorData = await res.json();
      console.error('[DEBUG STUDENT] Erro na submissão:', errorData);
      alert(`Erro ao enviar submissão: ${errorData.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    console.error('[DEBUG STUDENT] Erro na submissão:', err);
    alert('Erro ao enviar submissão. Verifique sua conexão e tente novamente.');
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
    alert('Erro: Você não está autenticado. Faça login novamente.');
    return;
  }

  if (!missionId) {
    alert('Por favor, selecione uma missão.');
    return;
  }

  if (files.length === 0) {
    alert('Por favor, selecione pelo menos um arquivo de código.');
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
      alert('Código enviado com sucesso!');

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
      alert(`Erro ao enviar submissão: ${errorData.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    console.error('[DEBUG STUDENT] Erro na requisição de submissão:', err);
    alert('Erro ao conectar com o servidor.');
  }
}

function setupTabs() {
  console.log('[DEBUG STUDENT] Configurando abas...');
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  console.log('[DEBUG STUDENT] Tabs encontradas:', tabs.length);
  console.log('[DEBUG STUDENT] Contents encontrados:', contents.length);

  tabs.forEach((tab, index) => {
    console.log(`[DEBUG STUDENT] Configurando aba ${index}: ${tab.id}`);

    tab.addEventListener('click', async () => {
      console.log(`[DEBUG STUDENT] Clique na aba: ${tab.id}`);

      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-blue-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-blue-600');
      contents[index].classList.remove('hidden');

      // Carregar dados específicos da aba
      const tabId = tab.id;
      if (tabId === 'tab-missions') {
        console.log('[DEBUG STUDENT] Carregando missões...');
        await loadMissions();
      } else if (tabId === 'tab-history') {
        console.log('[DEBUG STUDENT] Carregando histórico de submissões e ações...');
        await loadSubmissionHistory();
        await loadActionHistory(); // Carregar também o histórico de ações
      }
    });
  });

  console.log('[DEBUG STUDENT] Abas configuradas com sucesso');
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

// Função para carregar histórico de ações (penalidades/recompensas)
async function loadActionHistory() {
  console.log('[DEBUG STUDENT] === INICIANDO loadActionHistory ===');

  const container = document.getElementById('action-history');
  if (!container) {
    console.error('[DEBUG STUDENT] ❌ Container action-history não encontrado');
    return;
  }

  console.log('[DEBUG STUDENT] ✅ Container action-history encontrado');

  // Primeiro, vamos mostrar uma mensagem de carregamento
  container.innerHTML = '<p class="text-blue-500 text-center py-4">Carregando histórico de ações...</p>';

  try {
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    console.log('[DEBUG STUDENT] Token:', token ? 'existe' : 'não existe');
    console.log('[DEBUG STUDENT] UserInfo:', userInfo);

    if (!token) {
      console.error('[DEBUG STUDENT] ❌ Token não disponível');
      container.innerHTML = '<p class="text-red-500 text-center py-4">Token não disponível</p>';
      return;
    }

    console.log('[DEBUG STUDENT] 🌐 Fazendo requisição para /usuarios/me');
    const userResponse = await fetch(`${API_URL}/usuarios/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('[DEBUG STUDENT] 📡 Resposta da requisição:', userResponse.status);

    if (!userResponse.ok) {
      console.error('[DEBUG STUDENT] ❌ Erro na requisição:', userResponse.status);
      container.innerHTML = '<p class="text-red-500 text-center py-4">Erro ao carregar dados: ' + userResponse.status + '</p>';
      return;
    }

    const userData = await userResponse.json();
    console.log('[DEBUG STUDENT] 📊 Dados do usuário carregados:', userData);

    const actionHistory = userData.actionHistory || [];
    console.log('[DEBUG STUDENT] 📋 Action history encontrado:', actionHistory.length, 'itens');

    if (actionHistory.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma penalidade ou recompensa registrada ainda.</p>';
      console.log('[DEBUG STUDENT] ℹ️ Nenhum item no histórico');
      return;
    }

    console.log('[DEBUG STUDENT] 🎨 Renderizando histórico...');

    // Ordenar por data (mais recente primeiro)
    const sortedHistory = actionHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    const htmlContent = sortedHistory.map(action => {
      console.log('[DEBUG STUDENT] Renderizando ação:', action);
      return `
        <div class="border p-4 rounded-lg ${action.type === 'penalty' ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="font-medium ${action.type === 'penalty' ? 'text-orange-700' : 'text-green-700'}">
                  ${action.type === 'penalty' ? '🚫 Penalidade' : '🎉 Recompensa'}
                </span>
                <span class="px-2 py-1 rounded text-xs font-bold ${action.type === 'penalty' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}">
                  ${action.type === 'penalty' ? '-' : '+'}${action.amount} XP
                </span>
              </div>
              <p class="text-sm text-gray-700 mb-2">${action.reason}</p>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>XP: ${action.oldXP} → ${action.newXP}</span>
                <span>${new Date(action.date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = htmlContent;
    console.log('[DEBUG STUDENT] ✅ Histórico renderizado com sucesso!');

  } catch (error) {
    console.error('[DEBUG STUDENT] 💥 Erro ao carregar histórico de ações:', error);
    container.innerHTML = '<p class="text-red-500 text-center py-4">Erro ao carregar histórico de ações: ' + error.message + '</p>';
  }

  console.log('[DEBUG STUDENT] === FIM loadActionHistory ===');
}

async function loadStudentData() {
  console.log('[DEBUG STUDENT] Iniciando loadStudentData');

  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[DEBUG STUDENT] Token não encontrado');
    return;
  }

  try {
    // Carregar informações do aluno
    await loadStudentInfo();

    // Carregar missões e histórico após um pequeno atraso
    await new Promise(resolve => setTimeout(resolve, 500));
    await Promise.all([
      loadMissions(),
      loadSubmissionHistory(),
      loadActionHistory()
    ]);

    console.log('[DEBUG STUDENT] Dados do aluno, missões e histórico carregados com sucesso');
  } catch (error) {
    console.error('[DEBUG STUDENT] Erro ao carregar dados do aluno:', error);
  }
}

// Chamar loadStudentData inicialmente para carregar todos os dados necessários
loadStudentData();
