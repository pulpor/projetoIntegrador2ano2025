import { apiRequest } from '../utils/auth.js';
import { showError, showSuccess } from '../utils/toast.js';

export let originalMissions = [];
export let originalSubmissions = [];

// Abrir arquivo de forma segura (fallbacks)
export function openFileSecurely(fileUrl) {
  try {
    console.log('[OPEN FILE] Tentando abrir arquivo:', fileUrl);
    const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      console.log('[OPEN FILE] Arquivo aberto com sucesso');
    } else {
      console.log('[OPEN FILE] Popup bloqueado, usando fallback');
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
    showError('Erro ao abrir arquivo: ' + (error.message || error));
  }
}

export async function loadSubmissions() {
  try {
    console.log('[MISSOES] loadSubmissions chamado');
    const container = document.getElementById('submissions-list');
    if (container) container.innerHTML = '<p class="text-gray-500 py-4">Carregando submissões...</p>';

    const data = await apiRequest('/submissoes');
    originalSubmissions = data || [];

    const hasActiveFilters = checkActiveFilters('submission');
    if (hasActiveFilters) {
      applySubmissionFilters();
    } else {
      renderSubmissions(originalSubmissions);
    }
    console.log('[MISSOES] loadSubmissions finalizado, total:', (originalSubmissions || []).length);
  } catch (err) {
    console.error('Erro ao carregar submissões:', err);
    const container = document.getElementById('submissions-list');
    if (container) container.innerHTML = `<p class="text-red-500 py-4">Erro: ${err.message || err}</p>`;
    showError(err.message || err);
  }
}

export async function loadMissions() {
  try {
    console.log('[MISSOES] loadMissions chamado');
    const container = document.getElementById('missions-list');
    if (container) container.innerHTML = '<p class="text-gray-500 py-4">Carregando missões...</p>';

    const data = await apiRequest('/missoes');
    originalMissions = data || [];

    const hasActiveFilters = checkActiveFilters('mission');
    if (hasActiveFilters) {
      applyMissionFilters();
    } else {
      renderMissions(originalMissions);
    }
    console.log('[MISSOES] loadMissions finalizado, total:', (originalMissions || []).length);
  } catch (err) {
    console.error('Erro ao carregar missões:', err);
    const container = document.getElementById('missions-list');
    if (container) container.innerHTML = `<p class="text-red-500 py-4">Erro: ${err.message || err}</p>`;
    showError(err.message || err);
  }
}

export function renderSubmissions(submissions) {
  const container = document.getElementById('submissions-list');
  if (!container) return;

  if (!submissions || submissions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma submissão encontrada.</p>';
    return;
  }

  const sortedSubmissions = submissions.sort((a, b) => {
    const dateA = new Date(a.submittedAt || 0);
    const dateB = new Date(b.submittedAt || 0);
    return dateB - dateA;
  });

  container.innerHTML = sortedSubmissions.map(submission => createSubmissionCard(submission)).join('');

  // Conectar eventos de ação (aprovar/rejeitar) — uso de delegation simples
  container.querySelectorAll('.approve-submission-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.submissionId;
      try {
        if (window.apiRequest) {
          await apiRequest(`/submissoes/${id}/approve`, { method: 'POST' });
          showSuccess('Submissão aprovada');
        } else {
          console.log('approve submission (simulado):', id);
          showSuccess('Submissão aprovada (simulado)');
        }
      } catch (err) {
        console.error('Erro ao aprovar submissão:', err);
        showError('Erro ao aprovar submissão: ' + (err.message || err));
      } finally {
        await loadSubmissions();
      }
    };
  });

  container.querySelectorAll('.reject-submission-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.submissionId;
      try {
        if (window.apiRequest) {
          await apiRequest(`/submissoes/${id}/reject`, { method: 'POST' });
          showSuccess('Submissão rejeitada');
        } else {
          console.log('reject submission (simulado):', id);
          showSuccess('Submissão rejeitada (simulado)');
        }
      } catch (err) {
        console.error('Erro ao rejeitar submissão:', err);
        showError('Erro ao rejeitar submissão: ' + (err.message || err));
      } finally {
        await loadSubmissions();
      }
    };
  });
}

export function renderMissions(missions) {
  const container = document.getElementById('missions-list');
  if (!container) return;

  if (!missions || missions.length === 0) {
    container.innerHTML = '<p class="text-gray-500 py-4">Nenhuma missão encontrada.</p>';
    return;
  }

  container.innerHTML = missions.map(mission => createMissionCard(mission)).join('');

  // ligar botões Editar / Deletar
  container.querySelectorAll('.edit-mission-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.missionId;
      // chamar exportado editMission
      try { editMission(id); } catch (e) { console.warn('editMission não disponível:', e); }
    };
  });

  container.querySelectorAll('.delete-mission-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.missionId;
      if (!confirm('Deletar missão?')) return;
      try {
        if (window.apiRequest) {
          await apiRequest(`/missoes/${id}`, { method: 'DELETE' });
          showSuccess('Missão deletada');
        } else {
          console.log('delete mission (simulado):', id);
          showSuccess('Missão deletada (simulado)');
        }
      } catch (err) {
        console.error('Erro ao deletar missão:', err);
        showError('Erro ao deletar missão: ' + (err.message || err));
      } finally {
        await loadMissions();
      }
    };
  });
}

// ====== EDIÇÃO / AÇÕES DE MISSÕES ======
export async function editMission(missionId) {
  try {
    const mission = originalMissions.find(m => m.id === parseInt(missionId));
    if (!mission) {
      showError('Missão não encontrada');
      return;
    }

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

    titleEl.value = mission.title || '';
    descriptionEl.value = mission.description || '';
    xpEl.value = mission.xp || '';
    yearEl.value = mission.targetYear || '';
    classEl.value = mission.targetClass || 'geral';

    const createBtn = document.getElementById('create-mission-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (createBtn && cancelBtn) {
      createBtn.textContent = '✏️ Atualizar Missão';
      createBtn.className = 'flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition font-medium';
      createBtn.dataset.editingId = missionId;

      cancelBtn.style.display = 'block';
      cancelBtn.onclick = () => cancelEdit();
    }

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

export async function missionAction(missionId, action, successMessage) {
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

// ====== FILTROS / SETUPS ======
export function checkActiveFilters(type) {
  if (type === 'submission') {
    // usar ids presentes no HTML: filter-submission-status / filter-submission-mission
    const statusFilter = document.getElementById('filter-submission-status')?.value;
    const missionFilter = document.getElementById('filter-submission-mission')?.value;
    return (statusFilter && statusFilter !== 'all') || (missionFilter && missionFilter !== 'all');
  }

  if (type === 'mission') {
    // usar id presente no HTML: filter-mission-year (outros filtros existem mas aqui nos concentramos no ano)
    const yearFilter = document.getElementById('filter-mission-year')?.value;
    return (yearFilter && yearFilter !== 'all');
  }

  return false;
}

export function applySubmissionFilters() {
  const statusFilter = document.getElementById('filter-submission-status')?.value || 'all';
  const missionFilter = document.getElementById('filter-submission-mission')?.value || 'all';

  let filtered = originalSubmissions || [];

  if (statusFilter !== 'all') {
    filtered = filtered.filter(submission => submission.status === statusFilter);
  }

  if (missionFilter !== 'all') {
    filtered = filtered.filter(submission => submission.missionId == missionFilter);
  }

  renderSubmissions(filtered);
}

export function applyMissionFilters() {
  const yearFilter = document.getElementById('filter-mission-year')?.value || 'all';

  let filtered = originalMissions || [];

  if (yearFilter !== 'all') {
    filtered = filtered.filter(mission => mission.targetYear == yearFilter);
  }

  renderMissions(filtered);
}

export function setupMissionFilters() {
  const yearFilter = document.getElementById('filter-mission-year');
  if (yearFilter) yearFilter.addEventListener('change', applyMissionFilters);
}

export function setupSubmissionFilters() {
  const statusFilter = document.getElementById('filter-submission-status');
  const missionFilter = document.getElementById('filter-submission-mission');

  [statusFilter, missionFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', applySubmissionFilters);
  });
}

// ====== CRIAÇÃO / EDIÇÃO DE MISSÕES ======
export function setupMissionCreation() {
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

    const title = titleEl.value.trim();
    const description = descriptionEl.value.trim();
    const xpReward = parseInt(xpEl.value);
    const year = yearEl.value;
    const missionClass = classEl.value;

    const createBtn = document.getElementById('create-mission-btn');
    const isEditing = createBtn && createBtn.dataset.editingId;
    const missionId = isEditing ? parseInt(createBtn.dataset.editingId) : null;

    if (!title) { showError('Título da missão é obrigatório'); return; }
    if (!description) { showError('Descrição da missão é obrigatória'); return; }
    if (!xpReward || xpReward <= 0) { showError('XP da missão deve ser um número positivo'); return; }

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
      response = await apiRequest(`/missoes/${missionId}`, {
        method: 'PUT',
        body: JSON.stringify(missionData)
      });
      successMessage = 'Missão atualizada com sucesso!';
    } else {
      missionData.status = 'ativa';
      response = await apiRequest('/missoes', {
        method: 'POST',
        body: JSON.stringify(missionData)
      });
      successMessage = 'Missão criada com sucesso!';
    }

    showSuccess(successMessage);
    cancelEdit();
    loadMissions();

  } catch (err) {
    console.error('Erro ao processar missão:', err);
    const action = (document.getElementById('create-mission-btn')?.dataset.editingId) ? 'atualizar' : 'criar';
    showError(`Erro ao ${action} missão: ${err.message}`);
  }
}

export function cancelEdit() {
  try {
    const titleEl = document.getElementById('mission-title');
    const descriptionEl = document.getElementById('mission-description');
    const xpEl = document.getElementById('mission-xp');
    const yearEl = document.getElementById('mission-year');
    const classEl = document.getElementById('mission-class');

    if (titleEl) titleEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    if (xpEl) xpEl.value = '';
    if (yearEl) yearEl.value = '';
    if (classEl) classEl.value = 'geral';

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

// Garantir que clicar nas abas 'Submissions' / 'Missions' invoque os loaders mesmo se o orquestrador falhar
document.addEventListener('DOMContentLoaded', () => {
  try {
    const subBtn = document.getElementById('tab-submissions');
    const missBtn = document.getElementById('tab-missions');

    const callWithDelay = (fn) => {
      setTimeout(() => {
        try { fn(); } catch (e) { console.warn('Erro ao chamar loader:', e); }
      }, 60); // aguardar aplicação da classe 'active' pelo setupTabs
    };

    if (subBtn) {
      subBtn.addEventListener('click', () => {
        console.log('[MISSOES] tab-submissions click detected');
        callWithDelay(loadSubmissions);
      });
    }

    if (missBtn) {
      missBtn.addEventListener('click', () => {
        console.log('[MISSOES] tab-missions click detected');
        callWithDelay(loadMissions);
      });
    }

    // Carregar automaticamente se a aba já estiver ativa no carregamento inicial
    setTimeout(() => {
      const submissionsActive = document.getElementById('submissions-content')?.classList.contains('active') ||
                                document.getElementById('tab-submissions')?.classList.contains('active');
      const missionsActive = document.getElementById('missions-content')?.classList.contains('active') ||
                             document.getElementById('tab-missions')?.classList.contains('active');

      if (submissionsActive) {
        console.log('[MISSOES] inicial: submissões ativas, carregando...');
        loadSubmissions().catch(e => console.warn('[MISSOES] erro ao carregar submissões inicial:', e));
      }
      if (missionsActive) {
        console.log('[MISSOES] inicial: missões ativas, carregando...');
        loadMissions().catch(e => console.warn('[MISSOES] erro ao carregar missões inicial:', e));
      }
    }, 80);
  } catch (e) {
    console.warn('Erro ao instalar bindings de abas em missoes.js:', e);
  }
});