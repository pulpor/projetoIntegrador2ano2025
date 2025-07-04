// Importar o CSS para que o Vite processe o Tailwind CSS
import './index.css';

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOM carregado, iniciando aplicação master');

  const token = localStorage.getItem('token');
  const isMaster = localStorage.getItem('isMaster');

  console.log('[DEBUG] Token:', token);
  console.log('[DEBUG] IsMaster:', isMaster);

  if (!token || isMaster !== 'true') {
    alert('Acesso negado. Faça login como Mestre.');
    window.location.href = './index.html';
    return;
  }

  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
  setupTabs();
});


async function loadPendingUsers() {
  console.log('[DEBUG FRONTEND] Iniciando loadPendingUsers');

  const token = localStorage.getItem('token');
  console.log('[DEBUG] Token recuperado:', token);

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    window.location.href = './index.html';
    return;
  }

  try {
    console.log('[DEBUG] Fazendo requisição para:', `${API_URL}/usuarios/pending-users`);
    const res = await fetch(`${API_URL}/usuarios/pending-users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG] Resposta da requisição:', res.status);

    if (!res.ok) {
      console.error('[DEBUG] Erro na resposta:', res.status, res.statusText);
      const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
    }

    const data = await res.json();
    console.log('[DEBUG] Dados recebidos:', data);

    const container = document.getElementById('pending-users');
    if (!container) {
      console.error('[DEBUG] Container pending-users não encontrado!');
      return;
    }

    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<p class="text-gray-500 py-4">Nenhum usuário pendente encontrado.</p>';
      console.log('[DEBUG] Nenhum usuário pendente encontrado');
    } else {
      console.log('[FRONTEND] Renderizando', data.length, 'usuários pendentes');
      data.forEach(user => {
        console.log('[DEBUG] Renderizando usuário:', user.username);
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4';
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-bold text-lg">${user.username}</h3>
              <p class="text-gray-600">Classe: ${user.class || 'Não definida'}</p>
            </div>
            <div class="flex space-x-2">
              <button data-user-id="${user.id}" class="approve-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition">
                <i class="fas fa-check mr-1"></i> Aprovar
              </button>
              <button data-user-id="${user.id}" class="reject-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                <i class="fas fa-times mr-1"></i> Rejeitar
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // Adicionar event listeners para os botões
      setupUserActionButtons();
    }
  } catch (err) {
    console.error('[DEBUG] Erro na requisição:', err);
    const container = document.getElementById('pending-users');
    if (container) {
      container.innerHTML = `<p class="text-red-500 py-4">Erro ao carregar usuários: ${err.message}</p>`;
    }
  }
}

// Função para carregar alunos aprovados
async function loadApprovedStudents() {
  console.log('[DEBUG FRONTEND] Iniciando loadApprovedStudents');

  const token = localStorage.getItem('token');
  console.log('[DEBUG] Token recuperado:', token);

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    window.location.href = './index.html';
    return;
  }

  try {
    console.log('[DEBUG] Fazendo requisição para:', `${API_URL}/usuarios/approved-students`);
    const res = await fetch(`${API_URL}/usuarios/approved-students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG] Resposta da requisição:', res.status);

    if (!res.ok) {
      console.error('[DEBUG] Erro na resposta:', res.status, res.statusText);
      const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
    }

    const data = await res.json();
    console.log('[DEBUG] Dados recebidos:', data);

    const container = document.getElementById('students-list');
    if (!container) {
      console.error('[DEBUG] Container students-list não encontrado!');
      return;
    }

    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<p class="text-gray-500 py-4">Nenhum aluno aprovado encontrado.</p>';
      console.log('[DEBUG] Nenhum aluno aprovado encontrado');
    } else {
      console.log('[FRONTEND] Renderizando', data.length, 'alunos aprovados');
      data.forEach(student => {
        console.log('[DEBUG] Renderizando aluno:', student.username);
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4';

        // Criar informações detalhadas do nível
        let levelDisplay = `Nível: ${student.level || 1}`;
        let xpDisplay = `XP Total: ${student.xp || 0}`;
        let progressDisplay = '';

        if (student.levelInfo) {
          const info = student.levelInfo;
          if (info.isMaxLevel) {
            progressDisplay = `<div class="text-xs text-green-600 font-medium">NÍVEL MÁXIMO ATINGIDO!</div>`;
          } else {
            progressDisplay = `
              <div class="text-xs text-gray-600">
                Progresso: ${info.xpProgressInCurrentLevel}/${info.xpNeededForCurrentLevel} XP (${info.progressPercentage}%)
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="bg-blue-500 h-2 rounded-full" style="width: ${info.progressPercentage}%"></div>
              </div>
            `;
          }
        }

        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <h3 class="font-bold text-lg">${student.username}</h3>
              <p class="text-gray-600">Classe: ${student.class || 'Não definida'}</p>
              <p class="text-gray-600">${levelDisplay}</p>
              <p class="text-gray-600">${xpDisplay}</p>
              ${progressDisplay}
            </div>
            <div class="flex flex-col space-y-2">
              <div class="flex space-x-2">
                <button data-student-id="${student.id}" class="penalty-btn bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded transition text-sm">
                  <i class="fas fa-minus-circle mr-1"></i> Penalidade
                </button>
                <button data-student-id="${student.id}" class="reward-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition text-sm">
                  <i class="fas fa-plus-circle mr-1"></i> Recompensa
                </button>
              </div>
              <button data-student-id="${student.id}" class="expel-btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-sm border-2 border-red-300 font-medium">
                <i class="fas fa-user-times mr-1"></i> Expulsar Aluno
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // Adicionar event listeners para os botões
      setupStudentActionButtons();
    }
  } catch (err) {
    console.error('[DEBUG] Erro na requisição:', err);
    const container = document.getElementById('students-list');
    if (container) {
      container.innerHTML = `<p class="text-red-500 py-4">Erro ao carregar alunos: ${err.message}</p>`;
    }
  }
}

// Função para aprovar usuário
async function aprovarUsuario(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/approve-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: id })
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da aprovação:', data);

    if (res.ok) {
      alert('Usuário aprovado com sucesso!');
      loadPendingUsers(); // Recarrega a lista de pendentes
      loadApprovedStudents(); // Recarrega a lista de aprovados
    } else {
      alert('Erro ao aprovar usuário: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[FRONTEND] Erro ao aprovar usuário:', err);
    alert('Erro ao conectar com o servidor');
  }
}

// Função para rejeitar usuário
async function rejeitarUsuario(id) {
  if (!confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/reject-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: id })
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da rejeição:', data);

    if (res.ok) {
      alert('Usuário rejeitado com sucesso!');
      loadPendingUsers(); // Recarrega a lista
    } else {
      alert('Erro ao rejeitar usuário: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[DEBUG] Erro ao rejeitar usuário:', err);
    alert('Erro ao conectar com o servidor');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-purple-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-purple-600');
      contents[index].classList.remove('hidden');

      // Carregar dados específicos da aba
      const tabId = tab.id;
      if (tabId === 'tab-pending') {
        loadPendingUsers();
      } else if (tabId === 'tab-students') {
        loadApprovedStudents();
      } else if (tabId === 'tab-submissions') {
        loadSubmissions();
      } else if (tabId === 'tab-missions') {
        loadMissions();
      } else if (tabId === 'tab-submissions') {
        loadSubmissions();
      }
    });
  });
}

// Função para criar nova missão ou atualizar existente
async function createMission() {
  const title = document.getElementById('mission-title').value;
  const description = document.getElementById('mission-description').value;
  const xp = document.getElementById('mission-xp').value;
  const targetYear = document.getElementById('mission-year').value;
  const targetClass = document.getElementById('mission-class').value;
  const token = localStorage.getItem('token');
  const createBtn = document.getElementById('create-mission-btn');
  const editingId = createBtn.getAttribute('data-editing-id');

  if (!title || !description || !xp || !targetClass) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  try {
    let response;
    let successMessage;

    if (editingId) {
      // Modo edição - atualizar missão existente
      response = await fetch(`${API_URL}/missoes/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: title,
          descricao: description,
          xp: parseInt(xp),
          targetYear: targetYear ? parseInt(targetYear) : null,
          targetClass: targetClass
        })
      });
      successMessage = 'Missão atualizada com sucesso!';
    } else {
      // Modo criação - criar nova missão
      response = await fetch(`${API_URL}/missoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: title,
          descricao: description,
          xp: parseInt(xp),
          targetYear: targetYear ? parseInt(targetYear) : null,
          targetClass: targetClass
        })
      });
      successMessage = 'Missão criada com sucesso!';
    }

    const data = await response.json();

    if (response.ok) {
      alert(successMessage);
      // Limpar formulário
      document.getElementById('mission-title').value = '';
      document.getElementById('mission-description').value = '';
      document.getElementById('mission-xp').value = '';
      document.getElementById('mission-year').value = '';
      document.getElementById('mission-class').value = '';

      // Resetar botão para modo criação
      const cancelBtn = document.getElementById('cancel-edit-btn');
      createBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Criar Missão';
      createBtn.removeAttribute('data-editing-id');
      cancelBtn.classList.add('hidden');

      // Recarregar lista de missões
      loadMissions();
    } else {
      alert('Erro ao processar missão: ' + data.error);
    }
  } catch (error) {
    console.error('Erro ao processar missão:', error);
    alert('Erro ao processar missão.');
  }
}

// Função para carregar missões
async function loadMissions() {
  console.log('[DEBUG FRONTEND] Iniciando loadMissions');

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    window.location.href = './index.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/missoes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const missions = await res.json();
    console.log('[DEBUG] Missões recebidas:', missions);

    const container = document.getElementById('missions-list');
    if (!container) {
      console.error('[DEBUG] Container missions-list não encontrado!');
      return;
    }

    container.innerHTML = '';

    if (missions.length === 0) {
      container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada.</p>';
    } else {
      missions.forEach(mission => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition mb-4';

        // Criar informações sobre ano e classe alvo
        let targetInfo = '';
        if (mission.targetYear) {
          const yearLabels = { 1: '1º ano - Front-end', 2: '2º ano - Back-end', 3: '3º ano - Mobile' };
          targetInfo += `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">${yearLabels[mission.targetYear]}</span>`;
        } else {
          targetInfo += `<span class="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-2">Todos os anos</span>`;
        }

        if (mission.targetClass === 'geral') {
          targetInfo += `<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Todas as classes</span>`;
        } else {
          targetInfo += `<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">${mission.targetClass}</span>`;
        }

        card.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <h3 class="font-bold text-lg">${mission.title}</h3>
              <p class="text-gray-600 mb-2">${mission.description}</p>
              <div class="mb-2">${targetInfo}</div>
              <p class="text-green-600 font-medium">XP: ${mission.xp}</p>
            </div>
            <div class="flex space-x-2 ml-4">
              <button data-mission-id="${mission.id}" class="edit-mission-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                <i class="fas fa-edit mr-1"></i> Editar
              </button>
              <button data-mission-id="${mission.id}" class="delete-mission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                <i class="fas fa-trash mr-1"></i> Excluir
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // Adicionar event listeners para os botões de missão
      setupMissionActionButtons();
    }
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar missões:', err);
    const container = document.getElementById('missions-list');
    if (container) {
      container.innerHTML = `<p class="text-red-500 py-4">Erro ao carregar missões: ${err.message}</p>`;
    }
  }
}

async function loadSubmissions() {
  console.log('[DEBUG FRONTEND] Iniciando loadSubmissions');

  const token = localStorage.getItem('token');
  console.log('[DEBUG] Token recuperado:', token);

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    window.location.href = './index.html';
    return;
  }

  try {
    console.log('[DEBUG] Fazendo requisição para:', `${API_URL}/submissoes`);
    const res = await fetch(`${API_URL}/submissoes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('[DEBUG] Resposta da requisição:', res.status);

    if (!res.ok) {
      throw new Error(`Erro ${res.status}: ${res.statusText}`);
    }

    const submissions = await res.json();
    console.log('[DEBUG] Submissões recebidas:', submissions);

    displaySubmissions(submissions);
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar submissões:', err);
    const submissionsList = document.getElementById('submissions-list');
    if (submissionsList) {
      submissionsList.innerHTML = '<p class="text-red-500">Erro ao carregar submissões: ' + err.message + '</p>';
    }
  }
}

function displaySubmissions(submissions) {
  console.log('[DEBUG FRONTEND] Exibindo submissões:', submissions);

  const submissionsList = document.getElementById('submissions-list');
  if (!submissionsList) {
    console.error('[DEBUG] Container submissions-list não encontrado');
    return;
  }

  if (submissions.length === 0) {
    submissionsList.innerHTML = '<p class="text-gray-500">Nenhuma submissão encontrada.</p>';
    return;
  }

  submissionsList.innerHTML = submissions.map(submission => `
    <div class="bg-white p-6 rounded-lg shadow border-l-4 ${submission.pending ? 'border-yellow-400' : submission.approved ? 'border-green-400' : 'border-red-400'}">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800">${submission.missionTitle || 'Missão Desconhecida'}</h3>
          <p class="text-sm text-gray-600 mb-2">Aluno: <span class="font-medium">${submission.username || 'Desconhecido'}</span></p>
          <p class="text-sm text-gray-600 mb-2">Enviado em: ${new Date(submission.submittedAt).toLocaleString('pt-BR')}</p>
          <p class="text-sm text-gray-600 mb-2">XP: <span class="font-medium text-purple-600">${submission.xp}</span></p>
          
          ${submission.filePaths && submission.filePaths.length > 0 ? `
            <div class="mt-2">
              <p class="text-sm font-medium text-gray-700">Arquivos enviados (${submission.filePaths.length}):</p>
              <div class="grid gap-1 mt-1">
                ${submission.filePaths.map((filePath, index) => {
    const fileName = filePath.split('/').pop().split('\\').pop();
    // Extrair apenas o nome do arquivo, removendo o caminho completo
    const cleanFileName = fileName.split('_').slice(-1)[0].includes('.') ?
      fileName.split('_').slice(-1)[0] : fileName;
    const downloadUrl = `http://localhost:3000/Uploads/${fileName}`;
    return `
                    <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span class="text-sm text-gray-700" title="${fileName}">${cleanFileName}</span>
                      <div class="flex space-x-2">
                        <button class="download-file-btn text-blue-600 hover:text-blue-800 text-sm" data-file-url="${downloadUrl}" data-file-name="${fileName}">
                          <i class="fas fa-download mr-1"></i>Download
                        </button>
                        <button class="preview-file-btn text-green-600 hover:text-green-800 text-sm" data-file-url="${downloadUrl}" data-file-name="${fileName}">
                          <i class="fas fa-eye mr-1"></i>Visualizar
                        </button>
                      </div>
                    </div>
                  `;
  }).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="mt-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.pending ? 'bg-yellow-100 text-yellow-800' :
      submission.approved ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
    }">
              ${submission.pending ? 'Pendente' : submission.approved ? 'Aprovada' : 'Rejeitada'}
            </span>
          </div>
        </div>
        
        ${submission.pending ? `
          <div class="flex space-x-2 ml-4">
            <button class="approve-submission-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition" data-submission-id="${submission.id}">
              <i class="fas fa-check mr-1"></i> Aprovar
            </button>
            <button class="reject-submission-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition" data-submission-id="${submission.id}">
              <i class="fas fa-times mr-1"></i> Rejeitar
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  // Configurar event listeners para os botões de preview
  setupPreviewButtons();
}

function setupPreviewButtons() {
  console.log('[DEBUG] Configurando botões de preview e ações de submissão');

  // Configurar botões de preview
  const previewButtons = document.querySelectorAll('.preview-file-btn');
  previewButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const fileUrl = button.getAttribute('data-file-url');
      const fileName = button.getAttribute('data-file-name');
      console.log('[DEBUG] Clicou em preview:', fileName, fileUrl);
      previewFile(fileUrl, fileName);
    });
  });

  // Configurar botões de download seguro
  const downloadButtons = document.querySelectorAll('.download-file-btn');
  downloadButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const fileUrl = button.getAttribute('data-file-url');
      const fileName = button.getAttribute('data-file-name');
      console.log('[DEBUG] Clicou em download:', fileName, fileUrl);

      try {
        console.log('[DEBUG] Iniciando download do arquivo:', fileName);
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // Limpar recursos
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('[DEBUG] Download concluído');
      } catch (err) {
        console.error('[DEBUG] Erro no download:', err);
        alert('Erro ao baixar arquivo: ' + err.message);
      }
    });
  });

  // Configurar botões de aprovar submissão
  const approveButtons = document.querySelectorAll('.approve-submission-btn');
  approveButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const submissionId = parseInt(button.getAttribute('data-submission-id'));
      console.log('[DEBUG] Clicou em aprovar submissão:', submissionId);
      approveSubmission(submissionId);
    });
  });

  // Configurar botões de rejeitar submissão
  const rejectButtons = document.querySelectorAll('.reject-submission-btn');
  rejectButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const submissionId = parseInt(button.getAttribute('data-submission-id'));
      console.log('[DEBUG] Clicou em rejeitar submissão:', submissionId);
      rejectSubmission(submissionId);
    });
  });

  console.log('[DEBUG] Configurados:', previewButtons.length, 'botões de preview,', downloadButtons.length, 'botões de download,', approveButtons.length, 'botões de aprovar,', rejectButtons.length, 'botões de rejeitar');
}

async function approveSubmission(submissionId) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    return;
  }

  try {
    console.log('[DEBUG] Aprovando submissão:', submissionId);
    const res = await fetch(`${API_URL}/submissoes/${submissionId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Erro ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('[DEBUG] Submissão aprovada:', data);

    alert('Submissão aprovada com sucesso!');
    loadSubmissions(); // Recarrega a lista de submissões
  } catch (err) {
    console.error('[DEBUG] Erro ao aprovar submissão:', err);
    alert('Erro ao aprovar submissão: ' + err.message);
  }
}

async function rejectSubmission(submissionId) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você não está autenticado. Faça login novamente.');
    return;
  }

  try {
    console.log('[DEBUG] Rejeitando submissão:', submissionId);
    const res = await fetch(`${API_URL}/submissoes/${submissionId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Erro ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('[DEBUG] Submissão rejeitada:', data);

    alert('Submissão rejeitada com sucesso!');
    loadSubmissions(); // Recarrega a lista de submissões
  } catch (err) {
    console.error('[DEBUG] Erro ao rejeitar submissão:', err);
    alert('Erro ao rejeitar submissão: ' + err.message);
  }
}


// Configurar event listeners após o DOM ser carregado
document.addEventListener('DOMContentLoaded', () => {
  const createMissionBtn = document.getElementById('create-mission-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  if (createMissionBtn) {
    createMissionBtn.addEventListener('click', createMission);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', cancelEdit);
  }
});

// Função para cancelar edição
function cancelEdit() {
  // Limpar formulário
  document.getElementById('mission-title').value = '';
  document.getElementById('mission-description').value = '';
  document.getElementById('mission-xp').value = '';

  // Resetar botões
  const createBtn = document.getElementById('create-mission-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  createBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Criar Missão';
  createBtn.removeAttribute('data-editing-id');
  cancelBtn.classList.add('hidden');
}

// Função para configurar event listeners dos botões de ação dos usuários
function setupUserActionButtons() {
  // Botões de aprovar
  const approveButtons = document.querySelectorAll('.approve-btn');
  approveButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.target.closest('button').getAttribute('data-user-id');
      await aprovarUsuario(parseInt(userId));
    });
  });

  // Botões de rejeitar
  const rejectButtons = document.querySelectorAll('.reject-btn');
  rejectButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.target.closest('button').getAttribute('data-user-id');
      await rejeitarUsuario(parseInt(userId));
    });
  });
}

// Função para configurar event listeners dos botões de ação dos alunos
function setupStudentActionButtons() {
  // Botões de penalidade
  const penaltyButtons = document.querySelectorAll('.penalty-btn');
  penaltyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const studentId = e.target.closest('button').getAttribute('data-student-id');
      const penalty = prompt('Digite a quantidade de XP a ser removida:');
      if (penalty && !isNaN(penalty) && parseInt(penalty) > 0) {
        await aplicarPenalidade(parseInt(studentId), parseInt(penalty));
      }
    });
  });

  // Botões de recompensa (placeholder para futura implementação)
  const rewardButtons = document.querySelectorAll('.reward-btn');
  rewardButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const studentId = e.target.closest('button').getAttribute('data-student-id');
      alert('Funcionalidade de recompensa em desenvolvimento.');
    });
  });

  // Botões de expulsar
  const expelButtons = document.querySelectorAll('.expel-btn');
  expelButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const studentId = e.target.closest('button').getAttribute('data-student-id');
      const studentCard = e.target.closest('.bg-white');
      const studentName = studentCard.querySelector('h3').textContent;

      if (confirm(`Tem certeza que deseja expulsar o aluno "${studentName}"? Esta ação não pode ser desfeita e todos os dados do aluno serão removidos permanentemente.`)) {
        // Segunda confirmação para ações críticas
        if (confirm(`CONFIRMAÇÃO FINAL: Expulsar "${studentName}" definitivamente? Digite OK para confirmar.`)) {
          await expulsarAluno(parseInt(studentId));
        }
      }
    });
  });
}

// Função para aplicar penalidade
async function aplicarPenalidade(studentId, penalty) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/penalty`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId, penalty })
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da penalidade:', data);

    if (res.ok) {
      alert(`Penalidade aplicada com sucesso! ${penalty} XP removido.`);
      loadApprovedStudents(); // Recarrega a lista de alunos
    } else {
      alert('Erro ao aplicar penalidade: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[FRONTEND] Erro ao aplicar penalidade:', err);
    alert('Erro ao conectar com o servidor');
  }
}

// Função para expulsar aluno
async function expulsarAluno(studentId) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/usuarios/expel-student`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId })
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da expulsão:', data);

    if (res.ok) {
      const submissionsInfo = data.submissionsRemoved > 0 ?
        ` e ${data.submissionsRemoved} submissões foram removidas` : '';
      alert(`Aluno expulso com sucesso${submissionsInfo}!`);
      loadApprovedStudents(); // Recarrega a lista de alunos
    } else {
      alert('Erro ao expulsar aluno: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[FRONTEND] Erro ao expulsar aluno:', err);
    alert('Erro ao conectar com o servidor');
  }
}

// Função para configurar event listeners dos botões de ação das missões
function setupMissionActionButtons() {
  // Botões de editar missão
  const editButtons = document.querySelectorAll('.edit-mission-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const missionId = e.target.closest('button').getAttribute('data-mission-id');
      await editarMissao(parseInt(missionId));
    });
  });

  // Botões de excluir missão
  const deleteButtons = document.querySelectorAll('.delete-mission-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const missionId = e.target.closest('button').getAttribute('data-mission-id');
      await excluirMissao(parseInt(missionId));
    });
  });
}

// Função para editar missão
async function editarMissao(missionId) {
  const token = localStorage.getItem('token');

  try {
    // Buscar dados da missão atual
    const res = await fetch(`${API_URL}/missoes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const missions = await res.json();
    const mission = missions.find(m => m.id === missionId);

    if (!mission) {
      alert('Missão não encontrada!');
      return;
    }

    // Preencher formulário com dados da missão
    document.getElementById('mission-title').value = mission.title;
    document.getElementById('mission-description').value = mission.description;
    document.getElementById('mission-xp').value = mission.xp;
    document.getElementById('mission-year').value = mission.targetYear || '';
    document.getElementById('mission-class').value = mission.targetClass || '';

    // Alterar botão para modo "Atualizar"
    const createBtn = document.getElementById('create-mission-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    createBtn.innerHTML = '<i class="fas fa-edit mr-2"></i> Atualizar Missão';
    createBtn.setAttribute('data-editing-id', missionId);
    cancelBtn.classList.remove('hidden');

    // Scroll para o formulário
    document.getElementById('missions-content').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error('[FRONTEND] Erro ao carregar missão para edição:', err);
    alert('Erro ao carregar dados da missão');
  }
}

// Função para excluir missão
async function excluirMissao(missionId) {
  if (!confirm('Tem certeza que deseja excluir esta missão? Esta ação não pode ser desfeita.')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/missoes/${missionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    console.log('[FRONTEND] Resposta da exclusão:', data);

    if (res.ok) {
      alert('Missão excluída com sucesso!');
      loadMissions(); // Recarrega a lista de missões
    } else {
      alert('Erro ao excluir missão: ' + (data.message || data.error));
    }
  } catch (err) {
    console.error('[FRONTEND] Erro ao excluir missão:', err);
    alert('Erro ao conectar com o servidor');
  }
}

function previewFile(fileUrl, fileName) {
  console.log('[DEBUG] Função previewFile chamada');
  console.log('[DEBUG] fileUrl:', fileUrl);
  console.log('[DEBUG] fileName:', fileName);

  if (!fileUrl || !fileName) {
    console.error('[DEBUG] Parâmetros inválidos para preview');
    alert('Erro: Dados do arquivo inválidos');
    return;
  }

  // Determinar o tipo de arquivo pela extensão
  const extension = fileName.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const textExtensions = ['txt', 'js', 'html', 'css', 'json', 'xml', 'md'];
  const codeExtensions = ['py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'];

  // Criar modal de preview
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto m-4">
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-semibold">${fileName}</h3>
        <div class="flex space-x-2">
          <button id="download-file-btn" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
            <i class="fas fa-download mr-1"></i>Baixar
          </button>
          <button id="open-new-window-btn" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
            <i class="fas fa-external-link-alt mr-1"></i>Nova Janela
          </button>
          <button id="close-modal-btn" class="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
            <i class="fas fa-times mr-1"></i>Fechar
          </button>
        </div>
      </div>
      <div id="preview-content" class="p-4">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <p class="text-gray-600 mt-2">Carregando...</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Configurar event listeners dos botões do modal
  const downloadBtn = modal.querySelector('#download-file-btn');
  const openNewWindowBtn = modal.querySelector('#open-new-window-btn');
  const closeBtn = modal.querySelector('#close-modal-btn');

  // Função de download seguro
  downloadBtn.addEventListener('click', async () => {
    try {
      console.log('[DEBUG] Iniciando download do arquivo:', fileName);
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Limpar recursos
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('[DEBUG] Download concluído');
    } catch (err) {
      console.error('[DEBUG] Erro no download:', err);
      alert('Erro ao baixar arquivo: ' + err.message);
    }
  });

  // Abrir em nova janela
  openNewWindowBtn.addEventListener('click', () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  });

  // Fechar modal
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  const previewContent = modal.querySelector('#preview-content');

  if (imageExtensions.includes(extension)) {
    // Mostrar imagem
    previewContent.innerHTML = `
      <img src="${fileUrl}" alt="${fileName}" class="max-w-full h-auto mx-auto rounded" style="max-height: 60vh;">
    `;
  } else if (textExtensions.includes(extension) || codeExtensions.includes(extension)) {
    // Mostrar código/texto
    fetch(fileUrl)
      .then(response => response.text())
      .then(text => {
        previewContent.innerHTML = `
          <pre class="bg-gray-100 p-4 rounded overflow-auto text-sm" style="max-height: 60vh;"><code>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        `;
      })
      .catch(err => {
        previewContent.innerHTML = `
          <p class="text-red-600">Erro ao carregar arquivo: ${err.message}</p>
          <a href="${fileUrl}" class="text-blue-600 hover:underline">Clique aqui para baixar</a>
        `;
      });
  } else {
    // Tipo de arquivo não suportado para preview
    previewContent.innerHTML = `
      <div class="text-center">
        <i class="fas fa-file text-6xl text-gray-400 mb-4"></i>
        <p class="text-gray-600 mb-4">Preview não disponível para este tipo de arquivo.</p>
        <a href="${fileUrl}" download class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          <i class="fas fa-download mr-2"></i>Baixar ${fileName}
        </a>
      </div>
    `;
  }

  // Fechar modal ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}