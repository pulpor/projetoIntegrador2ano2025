// Importar o CSS para que o Vite processe o Tailwind CSS
import './index.css';

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
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

  loadStudentInfo();
  loadMissions();
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
    console.log('[DEBUG STUDENT] Dados do usuário:', data); if (data) {
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

    const missionsDiv = document.getElementById('missions');
    const select = document.getElementById('mission-select');

    if (!missionsDiv || !select) {
      console.error('[DEBUG STUDENT] Elementos não encontrados:', { missionsDiv, select });
      return;
    }

    missionsDiv.innerHTML = '';
    select.innerHTML = `<option value="">Selecione uma missão</option>`;

    if (data.length === 0) {
      missionsDiv.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão disponível no momento.</p>';
      console.log('[DEBUG STUDENT] Nenhuma missão encontrada');
      return;
    }

    data.forEach(mission => {
      console.log('[DEBUG STUDENT] Renderizando missão:', mission.title);
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4';
      card.innerHTML = `
        <h3 class="font-bold text-lg text-purple-700">${mission.title}</h3>
        <p class="text-gray-600 mb-2">${mission.description}</p>
        <span class="inline-block bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">XP: ${mission.xp}</span>
      `;
      missionsDiv.appendChild(card);

      const opt = document.createElement('option');
      opt.value = mission.id;
      opt.textContent = mission.title;
      select.appendChild(opt);
    });

    console.log('[DEBUG STUDENT] Missões renderizadas com sucesso');

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
