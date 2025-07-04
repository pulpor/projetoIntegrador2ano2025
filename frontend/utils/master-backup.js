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

  // Debug clickability após um delay para garantir que tudo foi carregado
  setTimeout(() => {
    debugClickability();
  }, 500);

  // Configurar logout primeiro
  setupLogout();
  
  // Configurar abas
  setupTabs();
  
  // Carregar dados iniciais
  loadPendingUsers();
  loadApprovedStudents();
  loadMissions();
  loadSubmissions();
});

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('[DEBUG] Logout clicado');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('isMaster');
      window.location.href = './index.html';
    });
    console.log('[DEBUG] Logout configurado');
  } else {
    console.error('[DEBUG] Botão de logout não encontrado');
  }
}


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
    
    // Log detalhado de cada aluno para debug
    data.forEach((student, index) => {
      console.log(`[DEBUG] Aluno ${index}:`, {
        id: student.id,
        username: student.username,
        year: student.year,
        yearType: typeof student.year,
        class: student.class,
        xp: student.xp,
        level: student.level
      });
    });

    // Armazenar para filtros
    originalStudents = data;

    const container = document.getElementById('students-list');
    if (!container) {
      console.error('[DEBUG] Container students-list não encontrado!');
      return;
    }

    // Verificar se há filtros ativos e aplicá-los, senão exibir todos
    const hasActiveFilters = checkActiveStudentFilters();
    if (hasActiveFilters) {
      console.log('[DEBUG] Reaplicando filtros de alunos ativos...');
      applyStudentFilters();
    } else {
      displayFilteredStudents(data);
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
  console.log('[DEBUG] Configurando abas...');
  
  // Configurar cada aba individualmente
  const tabPending = document.getElementById('tab-pending');
  const tabStudents = document.getElementById('tab-students');
  const tabSubmissions = document.getElementById('tab-submissions');
  const tabMissions = document.getElementById('tab-missions');
  
  const contentPending = document.getElementById('pending-content');
  const contentStudents = document.getElementById('students-content');
  const contentSubmissions = document.getElementById('submissions-content');
  const contentMissions = document.getElementById('missions-content');
  
  console.log('[DEBUG] Elementos encontrados:', {
    tabPending: !!tabPending,
    tabStudents: !!tabStudents,
    tabSubmissions: !!tabSubmissions,
    tabMissions: !!tabMissions,
    contentPending: !!contentPending,
    contentStudents: !!contentStudents,
    contentSubmissions: !!contentSubmissions,
    contentMissions: !!contentMissions
  });

  function hideAllContent() {
    contentPending?.classList.add('hidden');
    contentStudents?.classList.add('hidden');
    contentSubmissions?.classList.add('hidden');
    contentMissions?.classList.add('hidden');
  }

  function removeActiveFromTabs() {
    [tabPending, tabStudents, tabSubmissions, tabMissions].forEach(tab => {
      if (tab) {
        tab.classList.remove('active', 'border-b-2', 'border-purple-500', 'text-purple-600');
        tab.classList.add('text-gray-500');
      }
    });
  }

  function setActiveTab(tab) {
    tab.classList.remove('text-gray-500');
    tab.classList.add('active', 'border-b-2', 'border-purple-500', 'text-purple-600');
  }

  if (tabPending) {
    tabPending.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[DEBUG] Clique na aba Pendentes');
      removeActiveFromTabs();
      hideAllContent();
      setActiveTab(tabPending);
      contentPending?.classList.remove('hidden');
      loadPendingUsers();
    });
  }

  if (tabStudents) {
    tabStudents.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[DEBUG] Clique na aba Alunos');
      removeActiveFromTabs();
      hideAllContent();
      setActiveTab(tabStudents);
      contentStudents?.classList.remove('hidden');
      loadApprovedStudents();
      setTimeout(setupStudentFilters, 100);
    });
  }

  if (tabSubmissions) {
    tabSubmissions.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[DEBUG] Clique na aba Submissões');
      removeActiveFromTabs();
      hideAllContent();
      setActiveTab(tabSubmissions);
      contentSubmissions?.classList.remove('hidden');
      loadSubmissions();
      setTimeout(setupSubmissionFilters, 100);
    });
  }

  if (tabMissions) {
    tabMissions.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[DEBUG] Clique na aba Missões');
      removeActiveFromTabs();
      hideAllContent();
      setActiveTab(tabMissions);
      contentMissions?.classList.remove('hidden');
      loadMissions();
      setTimeout(setupMissionFilters, 100);
    });
  }

  console.log('[DEBUG] Abas configuradas com sucesso');
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
// Atualizar a função de carregamento de missões para incluir filtros
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

    // Armazenar para filtros
    originalMissions = missions;

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
    
    // Adicionar campo status baseado em pending e approved
    submissions.forEach(sub => {
      if (sub.pending) {
        sub.status = 'pending';
      } else if (sub.approved) {
        sub.status = 'approved';
      } else {
        sub.status = 'rejected';
      }
      // Usar submittedAt como createdAt se não existir
      if (!sub.createdAt && sub.submittedAt) {
        sub.createdAt = sub.submittedAt;
      }
    });
    
    // Log detalhado de cada submissão para debug
    submissions.forEach((sub, index) => {
      console.log(`[DEBUG] Submissão ${index}:`, {
        id: sub.id,
        username: sub.username,
        status: sub.status,
        pending: sub.pending,
        approved: sub.approved,
        missionId: sub.missionId,
        missionTitle: sub.missionTitle,
        createdAt: sub.createdAt
      });
    });

    // Armazenar para filtros
    originalSubmissions = submissions;

    // Verificar se há filtros ativos e aplicá-los, senão exibir todas
    const hasActiveFilters = checkActiveSubmissionFilters();
    if (hasActiveFilters) {
      console.log('[DEBUG] Reaplicando filtros ativos...');
      applySubmissionFilters();
    } else {
      displaySubmissions(submissions);
    }
    
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

// Variables para armazenar dados originais
let originalMissions = [];
let originalSubmissions = [];

// Funções de filtro para missões
function setupMissionFilters() {
  const applyBtn = document.getElementById('apply-mission-filters');
  const clearBtn = document.getElementById('clear-mission-filters');

  if (applyBtn && clearBtn) {
    applyBtn.removeEventListener('click', applyMissionFilters);
    clearBtn.removeEventListener('click', clearMissionFilters);
    
    applyBtn.addEventListener('click', applyMissionFilters);
    clearBtn.addEventListener('click', clearMissionFilters);
    
    console.log('[DEBUG] Filtros de missões configurados');
  } else {
    console.log('[DEBUG] Elementos de filtro de missões não encontrados');
  }
}

function applyMissionFilters() {
  const yearFilter = document.getElementById('filter-mission-year').value;
  const classFilter = document.getElementById('filter-mission-class').value;
  const xpFilter = document.getElementById('filter-mission-xp').value;

  let filteredMissions = [...originalMissions];

  // Filtrar por ano
  if (yearFilter) {
    filteredMissions = filteredMissions.filter(mission => 
      mission.targetYear == yearFilter
    );
  }

  // Filtrar por classe
  if (classFilter) {
    filteredMissions = filteredMissions.filter(mission => 
      mission.targetClass === classFilter
    );
  }

  // Filtrar por XP
  if (xpFilter) {
    filteredMissions = filteredMissions.filter(mission => {
      const xp = mission.xp;
      switch (xpFilter) {
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

  displayFilteredMissions(filteredMissions);
}

function clearMissionFilters() {
  document.getElementById('filter-mission-year').value = '';
  document.getElementById('filter-mission-class').value = '';
  document.getElementById('filter-mission-xp').value = '';
  displayFilteredMissions(originalMissions);
}

function displayFilteredMissions(missions) {
  const container = document.getElementById('existing-missions-list');
  container.innerHTML = '';

  if (missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada com os filtros aplicados.</p>';
    return;
  }

  missions.forEach(mission => {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 p-4 rounded-lg border';
    
    const difficultyColor = mission.xp <= 50 ? 'text-green-600' : 
                           mission.xp <= 100 ? 'text-yellow-600' : 
                           mission.xp <= 200 ? 'text-orange-600' : 'text-red-600';

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-lg">${mission.title}</h4>
          <p class="text-gray-600 text-sm mb-2">${mission.description}</p>
          <div class="flex space-x-4 text-sm">
            <span class="${difficultyColor} font-medium">${mission.xp} XP</span>
            <span class="text-blue-600">${mission.targetYear ? `${mission.targetYear}º ano` : 'Todos os anos'}</span>
            <span class="text-purple-600">${mission.targetClass}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button onclick="editMission(${mission.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
            <i class="fas fa-edit mr-1"></i>Editar
          </button>
          <button onclick="deleteMission(${mission.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
            <i class="fas fa-trash mr-1"></i>Excluir
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Funções de filtro para submissões
function setupSubmissionFilters() {
  const applyBtn = document.getElementById('apply-submission-filters');
  const clearBtn = document.getElementById('clear-submission-filters');

  if (applyBtn && clearBtn) {
    applyBtn.removeEventListener('click', applySubmissionFilters);
    clearBtn.removeEventListener('click', clearSubmissionFilters);
    
    applyBtn.addEventListener('click', applySubmissionFilters);
    clearBtn.addEventListener('click', clearSubmissionFilters);

    // Carregar missões no select de filtro
    loadMissionsForFilter();
    
    console.log('[DEBUG] Filtros de submissões configurados');
  } else {
    console.log('[DEBUG] Elementos de filtro de submissões não encontrados');
  }
}

function loadMissionsForFilter() {
  const select = document.getElementById('filter-submission-mission');
  if (!select) return;

  // Limpar opções existentes (exceto a primeira)
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

function applySubmissionFilters() {
  console.log('[DEBUG] Aplicando filtros de submissões...');
  
  const statusFilter = document.getElementById('filter-submission-status').value;
  const studentFilter = document.getElementById('filter-submission-student').value.toLowerCase();
  const missionFilter = document.getElementById('filter-submission-mission').value;
  const dateFilter = document.getElementById('filter-submission-date').value;

  console.log('[DEBUG] Filtros aplicados:', {
    status: statusFilter,
    student: studentFilter,
    mission: missionFilter,
    date: dateFilter
  });

  let filteredSubmissions = [...originalSubmissions];
  console.log('[DEBUG] Total de submissões originais:', originalSubmissions.length);

  // Filtrar por status
  if (statusFilter) {
    const beforeFilter = filteredSubmissions.length;
    filteredSubmissions = filteredSubmissions.filter(submission => {
      console.log('[DEBUG] Comparando status:', submission.status, '===', statusFilter);
      return submission.status === statusFilter;
    });
    console.log('[DEBUG] Após filtro de status:', beforeFilter, '->', filteredSubmissions.length);
  }

  // Filtrar por aluno
  if (studentFilter) {
    const beforeFilter = filteredSubmissions.length;
    filteredSubmissions = filteredSubmissions.filter(submission => 
      submission.username?.toLowerCase().includes(studentFilter)
    );
    console.log('[DEBUG] Após filtro de aluno:', beforeFilter, '->', filteredSubmissions.length);
  }

  // Filtrar por missão
  if (missionFilter) {
    const beforeFilter = filteredSubmissions.length;
    filteredSubmissions = filteredSubmissions.filter(submission => 
      submission.missionId == missionFilter
    );
    console.log('[DEBUG] Após filtro de missão:', beforeFilter, '->', filteredSubmissions.length);
  }

  // Filtrar por data
  if (dateFilter) {
    const beforeFilter = filteredSubmissions.length;
    filteredSubmissions = filteredSubmissions.filter(submission => {
      const submissionDate = new Date(submission.createdAt).toISOString().split('T')[0];
      return submissionDate === dateFilter;
    });
    console.log('[DEBUG] Após filtro de data:', beforeFilter, '->', filteredSubmissions.length);
  }

  console.log('[DEBUG] Submissões filtradas finais:', filteredSubmissions.length);
  displayFilteredSubmissions(filteredSubmissions);
}

function clearSubmissionFilters() {
  document.getElementById('filter-submission-status').value = '';
  document.getElementById('filter-submission-student').value = '';
  document.getElementById('filter-submission-mission').value = '';
  document.getElementById('filter-submission-date').value = '';
  displayFilteredSubmissions(originalSubmissions);
}

function displayFilteredSubmissions(submissions) {
  console.log('[DEBUG] Exibindo submissões filtradas:', submissions.length);
  
  const container = document.getElementById('submissions-list');
  container.innerHTML = '';

  if (submissions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma submissão encontrada com os filtros aplicados.</p>';
    return;
  }

  submissions.forEach((submission, index) => {
    console.log(`[DEBUG] Renderizando submissão ${index}:`, {
      id: submission.id,
      status: submission.status,
      username: submission.username,
      missionTitle: submission.missionTitle
    });
    
    const statusColor = submission.status === 'approved' ? 'text-green-600' :
                       submission.status === 'rejected' ? 'text-red-600' : 'text-yellow-600';
    
    const statusText = submission.status === 'approved' ? 'Aprovado' :
                      submission.status === 'rejected' ? 'Rejeitado' : 'Pendente';

    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow hover:shadow-md transition';
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <h4 class="font-semibold text-lg">${submission.missionTitle || 'Missão não encontrada'}</h4>
          <p class="text-gray-600">Aluno: ${submission.username}</p>
          <p class="text-gray-600">Data: ${new Date(submission.createdAt).toLocaleDateString('pt-BR')}</p>
          <p class="${statusColor} font-medium">Status: ${statusText}</p>
        </div>
        <div class="flex space-x-2">
          ${submission.status === 'pending' ? `
            <button onclick="approveSubmission(${submission.id})" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-check mr-1"></i>Aprovar
            </button>
            <button onclick="rejectSubmission(${submission.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
              <i class="fas fa-times mr-1"></i>Rejeitar
            </button>
          ` : ''}
          <button onclick="viewSubmissionDetails(${submission.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
            <i class="fas fa-eye mr-1"></i>Ver Detalhes
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  console.log('[DEBUG] Submissões renderizadas com sucesso');
}

// Verificar se há filtros ativos nas submissões
function checkActiveSubmissionFilters() {
  const statusFilter = document.getElementById('filter-submission-status')?.value;
  const studentFilter = document.getElementById('filter-submission-student')?.value;
  const missionFilter = document.getElementById('filter-submission-mission')?.value;
  const dateFilter = document.getElementById('filter-submission-date')?.value;

  return !!(statusFilter || studentFilter || missionFilter || dateFilter);
}

// Debug function para verificar se elementos são clicáveis
function debugClickability() {
  console.log('[DEBUG] Verificando clickability dos elementos...');
  
  const logoutBtn = document.getElementById('logout-btn');
  const tabPending = document.getElementById('tab-pending');
  const tabStudents = document.getElementById('tab-students');
  const tabSubmissions = document.getElementById('tab-submissions');
  const tabMissions = document.getElementById('tab-missions');
  
  const elements = [
    { name: 'logout-btn', el: logoutBtn },
    { name: 'tab-pending', el: tabPending },
    { name: 'tab-students', el: tabStudents },
    { name: 'tab-submissions', el: tabSubmissions },
    { name: 'tab-missions', el: tabMissions }
  ];
  
  elements.forEach(({ name, el }) => {
    if (el) {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      console.log(`[DEBUG] ${name}:`, {
        exists: true,
        visible: styles.display !== 'none' && styles.visibility !== 'hidden',
        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        zIndex: styles.zIndex,
        pointerEvents: styles.pointerEvents,
        opacity: styles.opacity
      });
      
      // Testar click programático
      el.addEventListener('click', () => {
        console.log(`[DEBUG] Click detectado em ${name}`);
      });
    } else {
      console.log(`[DEBUG] ${name}: ELEMENTO NÃO ENCONTRADO`);
    }
  });
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
    alert('Erro ao excluir missão');
  }
}

// Variables para armazenar dados originais de alunos
let originalStudents = [];

// Funções de filtro para alunos
function setupStudentFilters() {
  const applyBtn = document.getElementById('apply-student-filters');
  const clearBtn = document.getElementById('clear-student-filters');

  if (applyBtn && clearBtn) {
    applyBtn.removeEventListener('click', applyStudentFilters);
    clearBtn.removeEventListener('click', clearStudentFilters);
    
    applyBtn.addEventListener('click', applyStudentFilters);
    clearBtn.addEventListener('click', clearStudentFilters);
    
    console.log('[DEBUG] Filtros de alunos configurados');
  } else {
    console.error('[DEBUG] Botões de filtro de alunos não encontrados');
  }
}

function applyStudentFilters() {
  console.log('[DEBUG] Aplicando filtros de alunos...');
  
  const yearFilter = document.getElementById('filter-student-year').value;
  const classFilter = document.getElementById('filter-student-class').value;
  const xpFilter = document.getElementById('filter-student-xp').value;
  const nameFilter = document.getElementById('filter-student-name').value.toLowerCase();

  console.log('[DEBUG] Filtros aplicados:', {
    year: yearFilter,
    class: classFilter,
    xp: xpFilter,
    name: nameFilter
  });

  let filteredStudents = [...originalStudents];
  console.log('[DEBUG] Total de alunos originais:', originalStudents.length);

  // Filtrar por ano
  if (yearFilter) {
    const beforeFilter = filteredStudents.length;
    filteredStudents = filteredStudents.filter(student => 
      student.year == yearFilter
    );
    console.log('[DEBUG] Após filtro de ano:', beforeFilter, '->', filteredStudents.length);
  }

  // Filtrar por classe
  if (classFilter) {
    const beforeFilter = filteredStudents.length;
    filteredStudents = filteredStudents.filter(student => 
      student.class === classFilter
    );
    console.log('[DEBUG] Após filtro de classe:', beforeFilter, '->', filteredStudents.length);
  }

  // Filtrar por XP
  if (xpFilter) {
    const beforeFilter = filteredStudents.length;
    filteredStudents = filteredStudents.filter(student => {
      const xp = student.xp || 0;
      switch (xpFilter) {
        case '0-100':
          return xp >= 0 && xp <= 100;
        case '101-300':
          return xp >= 101 && xp <= 300;
        case '301-600':
          return xp >= 301 && xp <= 600;
        case '601-1000':
          return xp >= 601 && xp <= 1000;
        case '1001+':
          return xp >= 1001;
        default:
          return true;
      }
    });
    console.log('[DEBUG] Após filtro de XP:', beforeFilter, '->', filteredStudents.length);
  }

  // Filtrar por nome
  if (nameFilter) {
    const beforeFilter = filteredStudents.length;
    filteredStudents = filteredStudents.filter(student => 
      student.username?.toLowerCase().includes(nameFilter)
    );
    console.log('[DEBUG] Após filtro de nome:', beforeFilter, '->', filteredStudents.length);
  }

  console.log('[DEBUG] Alunos filtrados finais:', filteredStudents.length);
  displayFilteredStudents(filteredStudents);
}

function clearStudentFilters() {
  document.getElementById('filter-student-year').value = '';
  document.getElementById('filter-student-class').value = '';
  document.getElementById('filter-student-xp').value = '';
  document.getElementById('filter-student-name').value = '';
  displayFilteredStudents(originalStudents);
}

function displayFilteredStudents(students) {
  console.log('[DEBUG] Exibindo alunos filtrados:', students.length);
  console.log('[DEBUG] Dados dos alunos a serem exibidos:', students);
  
  const container = document.getElementById('students-list');
  container.innerHTML = '';

  if (students.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhum aluno encontrado com os filtros aplicados.</p>';
    return;
  }

  students.forEach(student => {
    console.log('[DEBUG] Renderizando aluno filtrado:', student.username);
    console.log('[DEBUG] Year do aluno:', student.year, 'Type:', typeof student.year);
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

    // Definir rótulos de ano
    const yearLabels = { 
      1: '1º ano - Front-end', 
      2: '2º ano - Back-end', 
      3: '3º ano - Mobile' 
    };
    const yearDisplay = (student.year !== null && student.year !== undefined) ? 
      (yearLabels[student.year] || `${student.year}º ano`) : 'Ano não definido';
    
    console.log('[DEBUG] YearDisplay calculado:', yearDisplay, 'para year:', student.year);

    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <h3 class="font-bold text-lg">${student.username}</h3>
          <p class="text-gray-600">Ano: ${yearDisplay}</p>
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

  // Configurar event listeners para os botões
  setupStudentActionButtons();
}

function checkActiveStudentFilters() {
  const yearFilter = document.getElementById('filter-student-year')?.value;
  const classFilter = document.getElementById('filter-student-class')?.value;
  const xpFilter = document.getElementById('filter-student-xp')?.value;
  const nameFilter = document.getElementById('filter-student-name')?.value;

  const hasActiveFilters = !!(yearFilter || classFilter || xpFilter || nameFilter);
  console.log('[DEBUG] Verificando filtros ativos de alunos:', {
    year: yearFilter,
    class: classFilter,
    xp: xpFilter,
    name: nameFilter,
    hasActiveFilters
  });

  return hasActiveFilters;
}


// Arquivo master.js carregado
console.log('[DEBUG] Arquivo master.js carregado');