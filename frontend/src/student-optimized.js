// Sistema de Missões - Painel do Aluno
import './index.css';

const API_URL = 'http://localhost:3000';
let studentInfo = null;
let studentCompletedMissions = [];

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[STUDENT] Iniciando aplicação');
    hideLoadingState();

    if (!validateAuth()) return;

    try {
        await loadStudentInfo();
        await loadMissions();
        setupTabs();
        setupEventListeners();

        // Garantir que as funções globais estejam disponíveis
        console.log('[STUDENT] Verificando funções globais...');
        console.log('[STUDENT] openSubmissionModal disponível:', typeof window.openSubmissionModal);
        console.log('[STUDENT] submitFromModal disponível:', typeof window.submitFromModal);

        hideLoadingState();
    } catch (error) {
        console.error('[STUDENT] Erro na inicialização:', error);
        hideLoadingState();
    }
});

function validateAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isMaster = localStorage.getItem('isMaster');

    if (!token || !username) {
        alert('Acesso negado. Faça login como aluno.');
        window.location.href = './index.html';
        return false;
    }

    if (isMaster === 'true') {
        alert('Acesso negado. Esta área é exclusiva para alunos.');
        window.location.href = './master.html';
        return false;
    }

    return true;
}

function hideLoadingState() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.style.display = 'none';
}

// ========================================
// CARREGAMENTO DE DADOS
// ========================================

async function loadStudentInfo() {
    const username = localStorage.getItem('username');
    updateElement('student-name', username);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        studentInfo = data;

        console.log('[STUDENT] Dados do usuário:', data);

        // Atualizar informações básicas
        updateElement('student-class', data.class || 'Classe não definida');
        updateElement('student-level', data.level || 1);
        updateElement('total-xp', data.xp || 0);

        // Usar levelInfo do backend se disponível
        if (data.levelInfo) {
            const levelInfo = data.levelInfo;
            console.log('[STUDENT] Level info:', levelInfo);

            // Atualizar elementos com informações corretas do nível
            updateElement('current-xp', levelInfo.xpProgressInCurrentLevel || 0);
            updateElement('next-level-xp', levelInfo.xpNeededForCurrentLevel || 100);
            updateElement('progress-percentage', `${levelInfo.progressPercentage || 0}%`);

            // Atualizar barra de progresso
            const xpBar = document.getElementById('xp-bar');
            if (xpBar) {
                const percentage = levelInfo.progressPercentage || 0;
                xpBar.style.width = `${percentage}%`;

                // Adicionar transição suave
                xpBar.style.transition = 'width 0.8s ease-in-out';
                console.log('[STUDENT] Barra de progresso atualizada:', percentage + '%');
            }
        } else {
            // Fallback para cálculo manual se levelInfo não estiver disponível
            const currentXP = data.xp || 0;
            const currentLevel = data.level || 1;

            // Sistema de níveis baseado no backend
            const xpLevels = [
                { level: 1, minXP: 0 },
                { level: 2, minXP: 100 },
                { level: 3, minXP: 250 },
                { level: 4, minXP: 450 },
                { level: 5, minXP: 700 },
                { level: 6, minXP: 1000 },
                { level: 7, minXP: 1400 },
                { level: 8, minXP: 2000 },
                { level: 9, minXP: 3000 },
                { level: 10, minXP: 5000 }
            ];

            const currentLevelData = xpLevels.find(l => l.level === currentLevel);
            const nextLevelData = xpLevels.find(l => l.level === currentLevel + 1);

            if (currentLevelData && nextLevelData) {
                const xpProgressInCurrentLevel = currentXP - currentLevelData.minXP;
                const xpNeededForCurrentLevel = nextLevelData.minXP - currentLevelData.minXP;
                const progressPercentage = Math.round((xpProgressInCurrentLevel / xpNeededForCurrentLevel) * 100);

                updateElement('current-xp', xpProgressInCurrentLevel);
                updateElement('next-level-xp', xpNeededForCurrentLevel);
                updateElement('progress-percentage', `${progressPercentage}%`);

                const xpBar = document.getElementById('xp-bar');
                if (xpBar) {
                    xpBar.style.width = `${progressPercentage}%`;
                    xpBar.style.transition = 'width 0.8s ease-in-out';
                }
            } else if (currentLevel === 10) {
                // Nível máximo
                updateElement('current-xp', 'MAX');
                updateElement('next-level-xp', 'MAX');
                updateElement('progress-percentage', '100%');

                const xpBar = document.getElementById('xp-bar');
                if (xpBar) {
                    xpBar.style.width = '100%';
                    xpBar.style.transition = 'width 0.8s ease-in-out';
                }
            }
        }

        // Aplicar cores baseadas na classe do aluno
        if (data.class) {
            applyClassColors(data.class);
        }

        // Carregar histórico de feedbacks se disponível
        if (data.actionHistory && data.actionHistory.length > 0) {
            renderFeedbackHistory(data.actionHistory);
        }

    } catch (error) {
        console.error('[STUDENT] Erro ao carregar info do aluno:', error);
    }
}

async function loadMissions() {
    const container = document.getElementById('missions-container');
    if (!container) return;

    container.innerHTML = createLoadingCard('Carregando missões...');

    const token = localStorage.getItem('token');
    if (!token) {
        container.innerHTML = createErrorCard('Token não encontrado');
        return;
    }

    try {
        // Carregar submissões primeiro
        await loadCompletedMissions();

        const response = await fetch(`${API_URL}/missoes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            container.innerHTML = createErrorCard(`Erro HTTP ${response.status}`);
            return;
        }

        const missions = await response.json();

        if (!missions || missions.length === 0) {
            container.innerHTML = createInfoCard('Nenhuma missão disponível');
            return;
        }

        // Filtrar missões já submetidas
        const availableMissions = missions.filter(mission =>
            !studentCompletedMissions.includes(mission.id)
        );

        renderMissions(availableMissions);
    } catch (error) {
        console.error('[STUDENT] Erro ao carregar missões:', error);
        container.innerHTML = createErrorCard(`Erro: ${error.message}`);
    }
}

async function loadCompletedMissions() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/submissoes/my-submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const submissions = await response.json();
            studentCompletedMissions = submissions
                .filter(sub => sub.pending || sub.approved)
                .map(sub => sub.missionId);
        }
    } catch (error) {
        console.error('[STUDENT] Erro ao carregar submissões:', error);
    }
}

async function loadSubmissionHistory() {
    const container = document.getElementById('submissions-container');
    if (!container) return;

    container.innerHTML = createLoadingCard('Carregando submissões...');

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/submissoes/my-submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            container.innerHTML = createErrorCard(`Erro HTTP ${response.status}`);
            return;
        }

        const submissions = await response.json();

        if (submissions.length === 0) {
            container.innerHTML = createInfoCard('Nenhuma submissão encontrada');
            return;
        }

        renderSubmissions(submissions);
    } catch (error) {
        console.error('[STUDENT] Erro ao carregar submissões:', error);
        container.innerHTML = createErrorCard(`Erro: ${error.message}`);
    }
}

async function loadRankings(classFilter = '', sortFilter = 'xp') {
    const container = document.getElementById('rankings-container');
    if (!container) return;

    container.innerHTML = createLoadingCard('Carregando rankings...');

    try {
        const response = await fetch(`${API_URL}/usuarios/rankings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            console.error('[STUDENT] Erro HTTP:', response.status, response.statusText);

            // Tentar mostrar uma mensagem mais específica
            if (response.status === 404) {
                container.innerHTML = createErrorCard('Endpoint de rankings não encontrado. Verifique se o servidor está atualizado.');
            } else if (response.status === 401) {
                container.innerHTML = createErrorCard('Não autorizado. Faça login novamente.');
            } else if (response.status === 500) {
                container.innerHTML = createErrorCard('Erro interno do servidor.');
            } else {
                container.innerHTML = createErrorCard(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            return;
        }

        const rankings = await response.json();

        if (!rankings || rankings.length === 0) {
            container.innerHTML = createInfoCard('Nenhum ranking disponível');
            return;
        }

        // Aplicar filtros
        const filteredRankings = rankings.filter(user => {
            // Filtrar por classe se selecionado
            if (classFilter && user.class !== classFilter) return false;
            return true;
        });

        // Ordenar rankings
        filteredRankings.sort((a, b) => {
            if (sortFilter === 'xp') {
                return (b.xp || 0) - (a.xp || 0);
            } else if (sortFilter === 'level') {
                return (b.level || 1) - (a.level || 1);
            } else if (sortFilter === 'username') {
                return a.username.localeCompare(b.username);
            }
            return 0;
        });

        renderRankings(filteredRankings);
    } catch (error) {
        console.error('[STUDENT] Erro ao carregar rankings:', error);
        console.log('[STUDENT] Usando dados de fallback para rankings');

        // Usar dados de fallback
        const fallbackRankings = createFallbackRankings();

        // Aplicar filtros mesmo nos dados de fallback
        const filteredRankings = fallbackRankings.filter(user => {
            if (classFilter && user.class !== classFilter) return false;
            return true;
        });

        // Ordenar rankings de fallback
        filteredRankings.sort((a, b) => {
            if (sortFilter === 'xp') {
                return (b.xp || 0) - (a.xp || 0);
            } else if (sortFilter === 'level') {
                return (b.level || 1) - (a.level || 1);
            } else if (sortFilter === 'username') {
                return a.username.localeCompare(b.username);
            }
            return 0;
        });

        renderRankings(filteredRankings);

        // Mostrar aviso sobre dados de fallback
        setTimeout(() => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4';
            warningDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span>Dados de demonstração - Servidor indisponível</span>
                </div>
            `;
            container.insertBefore(warningDiv, container.firstChild);
        }, 100);
    }
}

// ========================================
// RENDERIZAÇÃO
// ========================================

function renderMissions(missions) {
    const container = document.getElementById('missions-container');

    const missionsHTML = missions.map(mission => `
    <div class="card">
      <div class="card-content">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">${mission.title || 'Sem título'}</h3>
        <p class="text-gray-600 mb-4">${mission.description || 'Sem descrição'}</p>
        <div class="flex justify-between items-center mb-4">
          <span class="badge badge-primary">${getDifficultyLabel(mission.xpReward || mission.xp)}</span>
          <span class="text-sm text-gray-500">${mission.xpReward || mission.xp || 0} XP</span>
        </div>
        <button 
          data-mission-id="${mission.id}"
          class="submit-mission-btn modern-btn btn-primary w-full group"
          style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(0); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
        >
          <span class="flex items-center justify-center">
            <i class="fas fa-rocket mr-2 transition-transform duration-300 group-hover:scale-110"></i>
            <span class="font-medium">Iniciar Missão</span>
          </span>
        </button>
      </div>
    </div>
  `).join('');

    container.innerHTML = missionsHTML;

    // Modernizar botões após carregar missões
    modernizeButtons();

    // Adicionar event listeners para os botões de submissão
    setupMissionButtons();
}

function renderSubmissions(submissions) {
    const container = document.getElementById('submissions-container');

    const submissionsHTML = submissions.map(submission => {
        const statusInfo = getSubmissionStatus(submission);

        // Corrigir problema da data inválida
        let date = 'Data não disponível';
        if (submission.createdAt) {
            try {
                date = new Date(submission.createdAt).toLocaleDateString('pt-BR');
            } catch (e) {
                console.warn('Erro ao formatar data:', submission.createdAt);
            }
        } else if (submission.submittedAt) {
            try {
                date = new Date(submission.submittedAt).toLocaleDateString('pt-BR');
            } catch (e) {
                console.warn('Erro ao formatar data:', submission.submittedAt);
            }
        }

        return `
      <div class="card">
        <div class="card-content">
          <div class="flex justify-between items-start mb-3">
            <h4 class="font-semibold text-gray-900">${submission.missionTitle}</h4>
            <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">Enviado em: ${date}</p>
          <p class="text-sm text-gray-600 mb-2">Arquivos: ${submission.filePaths?.length || 0}</p>
          <div class="text-sm text-gray-700">
            <strong>XP:</strong> ${submission.xp || 0}
          </div>
          ${submission.feedback ? `
            <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <strong class="text-blue-800">Feedback:</strong>
              <p class="text-blue-700 mt-1">${submission.feedback}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = submissionsHTML;

    // Modernizar botões após carregar submissões
    modernizeButtons();
}

function renderRankings(rankings) {
    const container = document.getElementById('rankings-container');

    // Ordenar rankings por XP em ordem decrescente
    const sortedRankings = rankings.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    // Obter informações do usuário atual
    const currentUser = studentInfo ? studentInfo.username : null;

    // Calcular estatísticas gerais
    const totalPlayers = sortedRankings.length;
    const averageXP = totalPlayers > 0 ? Math.round(sortedRankings.reduce((sum, user) => sum + (user.xp || 0), 0) / totalPlayers) : 0;
    const topPlayer = sortedRankings[0];

    // Encontrar posição do usuário atual
    const currentUserPosition = sortedRankings.findIndex(user => user.username === currentUser) + 1;

    const rankingsHTML = `
        <!-- Filtros do Ranking -->
        ${createRankingFilters()}
        
        <!-- Estatísticas do Ranking -->
        ${createRankingStats(sortedRankings)}

        <!-- Cabeçalho do Ranking -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold mb-2">
                        <i class="fas fa-trophy mr-2"></i>
                        Ranking Global
                    </h2>
                    <p class="text-purple-100">
                        ${totalPlayers} programadores em competição
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-3xl font-bold">${topPlayer ? topPlayer.xp || 0 : 0}</div>
                    <div class="text-sm text-purple-200">XP do líder</div>
                </div>
            </div>
        </div>

        <!-- Estatísticas Rápidas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg p-4 border-l-4 border-yellow-400">
                <div class="flex items-center">
                    <div class="bg-yellow-100 rounded-full p-3 mr-3">
                        <i class="fas fa-medal text-yellow-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">Sua Posição</div>
                        <div class="text-xl font-bold text-gray-900">
                            ${currentUserPosition > 0 ? `#${currentUserPosition}` : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border-l-4 border-blue-400">
                <div class="flex items-center">
                    <div class="bg-blue-100 rounded-full p-3 mr-3">
                        <i class="fas fa-chart-line text-blue-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">XP Médio</div>
                        <div class="text-xl font-bold text-gray-900">${averageXP}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border-l-4 border-green-400">
                <div class="flex items-center">
                    <div class="bg-green-100 rounded-full p-3 mr-3">
                        <i class="fas fa-users text-green-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">Total de Jogadores</div>
                        <div class="text-xl font-bold text-gray-900">${totalPlayers}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pódio (Top 3) -->
        <div class="bg-gradient-to-b from-gray-50 to-white rounded-xl p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">
                <i class="fas fa-crown mr-2 text-yellow-500"></i>
                Pódio dos Campeões
            </h3>
            <div class="flex justify-center items-end space-x-4">
                ${sortedRankings.slice(0, 3).map((user, index) => `
                    <div class="text-center ${index === 0 ? 'transform -translate-y-2' : ''}">
                        <div class="relative">
                            <div class="w-16 h-16 rounded-full ${getPodiumColor(index)} flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                ${getPodiumIcon(index)}
                            </div>
                            ${index === 0 ? '<div class="absolute -top-3 -right-1 text-yellow-400 text-xl"><i class="fas fa-crown"></i></div>' : ''}
                        </div>
                        <div class="mt-2">
                            <div class="font-semibold text-gray-900 text-sm">${user.username}</div>
                            <div class="text-xs text-gray-500">${user.class || 'Dev'}</div>
                            <div class="text-sm font-bold text-purple-600">${user.xp || 0} XP</div>
                            <div class="text-xs text-gray-400">Nível ${user.level || 1}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Lista Completa do Ranking -->
        <div class="bg-white rounded-xl shadow-sm">
            <div class="p-4 border-b">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-list-ol mr-2"></i>
                    Ranking Completo
                </h3>
            </div>
            <div class="divide-y divide-gray-100">
                ${sortedRankings.map((user, index) => `
                    <div class="p-4 hover:bg-gray-50 transition-colors ${user.username === currentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''}" data-user="${user.username}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <!-- Posição -->
                                <div class="flex items-center justify-center w-10 h-10 rounded-full ${getRankingColor(index)} font-bold text-white shadow-md">
                                    ${index < 3 ? getPodiumIcon(index) : index + 1}
                                </div>
                                
                                <!-- Informações do usuário -->
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-semibold text-gray-900">${user.username}</span>
                                        ${user.username === currentUser ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Você</span>' : ''}
                                    </div>
                                    <div class="flex items-center space-x-4 mt-1">
                                        <span class="text-sm text-gray-500">
                                            <i class="fas fa-code mr-1"></i>
                                            ${user.class || 'Classe não definida'}
                                        </span>
                                        <span class="text-sm text-gray-500">
                                            <i class="fas fa-layer-group mr-1"></i>
                                            Nível ${user.level || 1}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- XP e Progresso -->
                            <div class="text-right">
                                <div class="font-bold text-xl ${user.username === currentUser ? 'text-blue-600' : 'text-purple-600'}">
                                    ${user.xp || 0} XP
                                </div>
                                <div class="text-sm text-gray-500">
                                    ${index > 0 ? `${(sortedRankings[0].xp || 0) - (user.xp || 0)} XP atrás` : 'Líder'}
                                </div>
                                <!-- Barra de progresso relativa -->
                                <div class="w-20 bg-gray-200 rounded-full h-2 mt-1">
                                    <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                                         style="width: ${topPlayer && topPlayer.xp ? Math.min(((user.xp || 0) / topPlayer.xp) * 100, 100) : 0}%">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Rodapé com Informações Adicionais -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between text-sm text-gray-600">
                <div>
                    <i class="fas fa-info-circle mr-1"></i>
                    Atualizado em tempo real
                </div>
                <div>
                    <i class="fas fa-clock mr-1"></i>
                    Última atualização: ${new Date().toLocaleTimeString('pt-BR')}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = rankingsHTML;

    // Modernizar botões após carregar rankings
    modernizeButtons();

    // Adicionar efeito de scroll para o usuário atual
    if (currentUserPosition > 3) {
        setTimeout(() => {
            const userElement = container.querySelector(`[data-user="${currentUser}"]`);
            if (userElement) {
                userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }

    // Adicionar filtros e estatísticas
    const filtersHTML = createRankingFilters();
    const statsHTML = createRankingStats(sortedRankings);

    const filtersContainer = document.getElementById('ranking-filters-container');
    const statsContainer = document.getElementById('ranking-stats-container');

    if (filtersContainer) {
        filtersContainer.innerHTML = filtersHTML;
    }

    if (statsContainer) {
        statsContainer.innerHTML = statsHTML;
    }
}

// ========================================
// HISTÓRICO DE FEEDBACKS
// ========================================

function renderFeedbackHistory(actionHistory) {
    // Verificar se existe um container para feedbacks
    let feedbackContainer = document.getElementById('feedback-history-container');

    if (!feedbackContainer) {
        // Criar container se não existir
        const profileSection = document.querySelector('.stats-card') || document.querySelector('.card');
        if (profileSection) {
            feedbackContainer = document.createElement('div');
            feedbackContainer.id = 'feedback-history-container';
            feedbackContainer.className = 'card mt-6';
            profileSection.parentNode.insertBefore(feedbackContainer, profileSection.nextSibling);
        } else {
            console.warn('Não foi possível encontrar local para inserir histórico de feedbacks');
            return;
        }
    }

    // Ordenar por data mais recente primeiro (com validação de data)
    const sortedHistory = actionHistory.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Se alguma data for inválida, colocar no final
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB - dateA;
    });

    // Limitar aos últimos 3 feedbacks para reduzir poluição visual
    const recentHistory = sortedHistory.slice(0, 3);

    feedbackContainer.innerHTML = `
        <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-800">
                <i class="fas fa-comment-alt mr-2 text-blue-600"></i>
                Feedbacks Recentes
            </h3>
            <p class="text-sm text-gray-600 mt-1">
                ${actionHistory.length > 0 ? `${actionHistory.length} feedback${actionHistory.length !== 1 ? 's' : ''} recebido${actionHistory.length !== 1 ? 's' : ''}` : 'Nenhum feedback recebido ainda'}
            </p>
        </div>
        
        <div class="card-content">
            ${recentHistory.length > 0 ? `
                <div class="space-y-3">
                    ${recentHistory.map(action => createFeedbackCard(action)).join('')}
                </div>
                
                ${actionHistory.length > 3 ? `
                    <div class="text-center mt-4">
                        <button onclick="showAllFeedbacks()" class="modern-btn btn-outline-primary text-sm group">
                            <i class="fas fa-chevron-down mr-1 transition-transform duration-300 group-hover:scale-110"></i>
                            Ver todos os ${actionHistory.length} feedbacks
                        </button>
                    </div>
                ` : ''}
            ` : `
                <div class="text-center py-8">
                    <i class="fas fa-comments text-gray-400 text-4xl mb-3"></i>
                    <p class="text-gray-500">Nenhum feedback recebido ainda</p>
                    <p class="text-gray-400 text-sm mt-1">Feedbacks aparecerão aqui quando você receber recompensas ou penalidades</p>
                </div>
            `}
        </div>
    `;

    // Modernizar botões após carregar feedbacks
    modernizeButtons();
}

function createFeedbackCard(action) {
    const isReward = action.type === 'reward';
    let formattedDate;

    try {
        const date = new Date(action.date);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        formattedDate = 'Data não disponível';
    }

    return `
        <div class="border rounded-lg p-4 ${isReward ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}">
            <div class="flex items-start justify-between">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center ${isReward ? 'bg-green-500' : 'bg-orange-500'} text-white">
                            <i class="fas ${isReward ? 'fa-trophy' : 'fa-exclamation-triangle'}"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <h4 class="font-semibold ${isReward ? 'text-green-800' : 'text-orange-800'}">
                                ${isReward ? '🎉 Recompensa Recebida' : '⚠️ Penalidade Aplicada'}
                            </h4>
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${isReward ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}">
                                ${isReward ? '+' : '-'}${action.amount} XP
                            </span>
                        </div>
                        <p class="text-gray-700 text-sm mb-2">${action.reason}</p>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                <i class="fas fa-clock mr-1"></i>
                                ${formattedDate}
                            </span>
                            <span>
                                XP: ${action.oldXP} → ${action.newXP}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função global para mostrar todos os feedbacks
window.showAllFeedbacks = function () {
    if (studentInfo && studentInfo.actionHistory) {
        // Criar modal com todos os feedbacks
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'feedbacks-modal'; // ID diferente para evitar conflitos
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-comment-alt mr-2 text-blue-600"></i>
                        Histórico Completo de Feedbacks
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" class="modern-btn btn-close group">
                        <i class="fas fa-times transition-transform duration-300 group-hover:scale-110"></i>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto max-h-96">
                    <div class="space-y-4">
                        ${studentInfo.actionHistory
                .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);

                    // Se alguma data for inválida, colocar no final
                    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                    if (isNaN(dateA.getTime())) return 1;
                    if (isNaN(dateB.getTime())) return -1;

                    return dateB - dateA;
                })
                .map(action => createFeedbackCard(action))
                .join('')}
                    </div>
                </div>
                
                <div class="flex justify-end p-6 border-t">
                    <button onclick="this.closest('.fixed').remove()" class="modern-btn btn-secondary">
                        <i class="fas fa-check mr-2"></i>
                        Entendi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Modernizar botões do modal após criá-lo
        modernizeButtons();
    }
}

// ========================================
// MODAL DE SUBMISSÃO
// ========================================

window.openSubmissionModal = function (missionId) {
    console.log('[STUDENT] Abrindo modal de submissão para missão:', missionId);

    // Remover qualquer modal de submissão existente para evitar duplicatas
    const existingModals = document.querySelectorAll('[id="submission-modal"]');
    existingModals.forEach(modal => {
        console.log('[STUDENT] Removendo modal existente:', modal.id);
        modal.remove();
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'submission-modal'; // Adicionar ID específico
    modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">Submeter Missão</h2>
        <button onclick="document.getElementById('submission-modal').remove()" class="modern-btn btn-close group">
            <i class="fas fa-times transition-transform duration-300 group-hover:scale-110"></i>
        </button>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-file-code mr-2"></i>Arquivos de Código
        </label>
        <input 
          type="file" 
          id="modal-file-input" 
          multiple 
          accept=".js,.html,.css,.py,.java,.cpp,.c,.php,.rb,.go,.ts,.jsx,.vue,.json"
          class="input"
        >
        <div id="modal-file-list" class="mt-2"></div>
        <p class="text-xs text-gray-500 mt-1">Selecione os arquivos do seu projeto</p>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="document.getElementById('submission-modal').remove()" class="modern-btn btn-secondary">
          <i class="fas fa-times mr-2"></i>
          Cancelar
        </button>
        <button onclick="submitFromModal('${missionId}')" class="modern-btn btn-primary group">
          <i class="fas fa-paper-plane mr-2 transition-transform duration-300 group-hover:scale-110"></i>
          Submeter
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);
    console.log('[STUDENT] Modal adicionado ao DOM');

    // Modernizar botões do modal após criá-lo
    modernizeButtons();

    // Verificar se o modal foi criado corretamente
    setTimeout(() => {
        const modalCheck = document.getElementById('submission-modal');
        const inputCheck = modalCheck ? modalCheck.querySelector('#modal-file-input') : null;
        console.log('[STUDENT] Verificação do modal após criação:', {
            modalExists: !!modalCheck,
            modalId: modalCheck ? modalCheck.id : 'null',
            inputExists: !!inputCheck,
            inputId: inputCheck ? inputCheck.id : 'null',
            modalHTML: modalCheck ? modalCheck.innerHTML.substring(0, 300) + '...' : 'null'
        });
    }, 100);

    // Mostrar arquivos selecionados
    const fileInput = modal.querySelector('#modal-file-input');
    const fileList = modal.querySelector('#modal-file-list');

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        console.log('[STUDENT] Arquivos selecionados:', files.map(f => f.name));
        fileList.innerHTML = files.length > 0 ?
            `<div class="text-sm text-gray-600">
                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                ${files.length} arquivo(s) selecionado(s)
                <div class="text-xs mt-1">${files.map(f => f.name).join(', ')}</div>
            </div>` : '';
    });
};

window.submitFromModal = async function (missionId) {
    console.log('[STUDENT] Iniciando submissão para missão:', missionId);

    // Listar todos os modais presentes
    const allModals = document.querySelectorAll('.fixed');
    console.log('[STUDENT] Modais encontrados:', allModals.length);

    // Encontrar o modal correto que tem o input de arquivo
    let modal = null;
    allModals.forEach((m, index) => {
        const hasFileInput = !!m.querySelector('#modal-file-input') || !!m.querySelector('#submission-file');
        console.log(`[STUDENT] Modal ${index}:`, {
            id: m.id,
            className: m.className,
            hasFileInput: hasFileInput
        });

        if (hasFileInput && !modal) {
            modal = m;
            console.log('[STUDENT] Modal selecionado:', index);
        }
    });

    if (!modal) {
        console.error('[STUDENT] Modal com input de arquivo não encontrado');
        alert('Erro: Modal não encontrado. Tente novamente.');
        return;
    }

    console.log('[STUDENT] Modal final selecionado:', {
        id: modal.id,
        className: modal.className,
        innerHTML: modal.innerHTML.substring(0, 500) + '...'
    });

    // Tentar ambos os IDs possíveis para o input
    let fileInput = modal.querySelector('#modal-file-input') || modal.querySelector('#submission-file');
    if (!fileInput) {
        console.error('[STUDENT] Input de arquivo não encontrado no modal');
        console.log('[STUDENT] Elementos input no modal:', modal.querySelectorAll('input'));
        alert('Erro: Campo de arquivo não encontrado. Recarregue a página e tente novamente.');
        return;
    }

    const files = fileInput.files;
    if (!files || files.length === 0) {
        alert('Selecione pelo menos um arquivo.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Token de autenticação não encontrado. Faça login novamente.');
            return;
        }

        console.log('[STUDENT] Enviando submissão com', files.length, 'arquivo(s)');

        const formData = new FormData();
        formData.append('missionId', missionId);

        for (const file of files) {
            formData.append('code', file);
            console.log('[STUDENT] Adicionando arquivo:', file.name);
        }

        const response = await fetch(`${API_URL}/submissoes/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        console.log('[STUDENT] Resposta da submissão:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('[STUDENT] Submissão bem-sucedida:', result);
            alert('Submissão enviada com sucesso!');
            document.body.removeChild(modal);

            // Recarregar dados
            setTimeout(async () => {
                await loadMissions();
                await loadSubmissionHistory();
            }, 500);
        } else {
            const error = await response.json();
            console.error('[STUDENT] Erro na submissão:', error);
            alert(`Erro: ${error.error || error.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('[STUDENT] Erro na submissão:', error);
        alert(`Erro ao enviar submissão: ${error.message}`);
    }
};

// ========================================
// NAVEGAÇÃO E EVENTOS
// ========================================

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const tabName = tab.getAttribute('data-tab');

            // Atualizar interface
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            tab.classList.add('active');
            const content = document.getElementById(`${tabName}-content`);
            if (content) content.classList.remove('hidden');

            // Carregar dados
            if (tabName === 'missions') await loadMissions();
            else if (tabName === 'submissions') await loadSubmissionHistory();
            else if (tabName === 'rankings') await loadRankings();
        });
    });
}

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = './index.html';
        });
    }
}

function setupMissionButtons() {
    const submitButtons = document.querySelectorAll('.submit-mission-btn');

    console.log('[STUDENT] Configurando', submitButtons.length, 'botões de submissão');

    submitButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const missionId = button.getAttribute('data-mission-id');
            console.log('[STUDENT] Clique no botão de submissão, missão ID:', missionId);

            if (missionId && window.openSubmissionModal) {
                window.openSubmissionModal(missionId);
            } else {
                console.error('[STUDENT] Erro: missionId ou openSubmissionModal não disponível');
                alert('Erro ao abrir modal de submissão. Recarregue a página e tente novamente.');
            }
        });
    });
}

// ========================================
// SISTEMA DE RANKING AVANÇADO
// ========================================

function createRankingFilters() {
    return `
        <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <div class="flex flex-wrap gap-3 items-center">
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Filtrar por:</label>
                    <select id="class-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Todas as classes</option>
                        <option value="Arqueiro do JavaScript">Arqueiro do JavaScript</option>
                        <option value="Cavaleiro do Python">Cavaleiro do Python</option>
                        <option value="Mago do Java">Mago do Java</option>
                        <option value="Paladino do C#">Paladino do C#</option>
                        <option value="Assassino do C++">Assassino do C++</option>
                        <option value="Druida do PHP">Druida do PHP</option>
                        <option value="Xamã do Ruby">Xamã do Ruby</option>
                        <option value="Necromante do Go">Necromante do Go</option>
                        <option value="Bárbaro do Rust">Bárbaro do Rust</option>
                        <option value="Monge do TypeScript">Monge do TypeScript</option>
                        <option value="Clérigo do Swift">Clérigo do Swift</option>
                    </select>
                </div>
                
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Ordenar por:</label>
                    <select id="sort-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="xp">XP (Maior para Menor)</option>
                        <option value="level">Nível (Maior para Menor)</option>
                        <option value="username">Nome (A-Z)</option>
                    </select>
                </div>
                
                <button onclick="applyRankingFilters()" class="modern-btn btn-primary px-4 py-2 text-sm">
                    <i class="fas fa-filter mr-1"></i>
                    Aplicar Filtros
                </button>
                
                <button onclick="resetRankingFilters()" class="modern-btn btn-secondary px-4 py-2 text-sm">
                    <i class="fas fa-undo mr-1"></i>
                    Limpar
                </button>
            </div>
        </div>
    `;
}

function createRankingStats(rankings) {
    const totalPlayers = rankings.length;
    const totalXP = rankings.reduce((sum, user) => sum + (user.xp || 0), 0);
    const averageXP = totalPlayers > 0 ? Math.round(totalXP / totalPlayers) : 0;

    // Agrupar por classe
    const classCounts = {};
    rankings.forEach(user => {
        const userClass = user.class || 'Indefinida';
        classCounts[userClass] = (classCounts[userClass] || 0) + 1;
    });

    const mostPopularClass = Object.keys(classCounts).reduce((a, b) =>
        classCounts[a] > classCounts[b] ? a : b, 'Nenhuma');

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div class="flex items-center">
                    <div class="bg-blue-100 rounded-full p-3 mr-3">
                        <i class="fas fa-users text-blue-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">Total de Jogadores</div>
                        <div class="text-xl font-bold text-gray-900">${totalPlayers}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div class="flex items-center">
                    <div class="bg-green-100 rounded-full p-3 mr-3">
                        <i class="fas fa-star text-green-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">XP Total</div>
                        <div class="text-xl font-bold text-gray-900">${totalXP.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <div class="flex items-center">
                    <div class="bg-purple-100 rounded-full p-3 mr-3">
                        <i class="fas fa-chart-line text-purple-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">XP Médio</div>
                        <div class="text-xl font-bold text-gray-900">${averageXP}</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                <div class="flex items-center">
                    <div class="bg-orange-100 rounded-full p-3 mr-3">
                        <i class="fas fa-crown text-orange-600"></i>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600">Classe Mais Popular</div>
                        <div class="text-sm font-bold text-gray-900">${mostPopularClass}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function applyRankingFilters() {
    const classFilter = document.getElementById('class-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;

    // Recarregar rankings com filtros
    loadRankings(classFilter, sortFilter);
}

function resetRankingFilters() {
    document.getElementById('class-filter').value = '';
    document.getElementById('sort-filter').value = 'xp';
    loadRankings();
}

// ========================================
// UTILITÁRIOS
// ========================================

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function createLoadingCard(message) {
    return `<div class="card"><div class="card-content"><p class="text-gray-500">${message}</p></div></div>`;
}

function createErrorCard(message) {
    return `<div class="card"><div class="card-content"><p class="text-red-500">${message}</p></div></div>`;
}

function createInfoCard(message) {
    return `<div class="card"><div class="card-content"><p class="text-gray-500">${message}</p></div></div>`;
}

function getDifficultyLabel(xp) {
    if (xp <= 50) return 'Fácil';
    if (xp <= 100) return 'Médio';
    if (xp <= 200) return 'Difícil';
    return 'Muito Difícil';
}

function getSubmissionStatus(submission) {
    if (submission.pending) {
        return { label: 'Pendente', class: 'badge-warning' };
    } else if (submission.approved) {
        return { label: 'Aprovado', class: 'badge-success' };
    } else {
        return { label: 'Rejeitado', class: 'badge-error' };
    }
}

function getRankingColor(index) {
    if (index === 0) return 'bg-yellow-500 text-white';
    if (index === 1) return 'bg-gray-400 text-white';
    if (index === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-200 text-gray-600';
}

function getPodiumColor(index) {
    if (index === 0) return 'bg-gradient-to-b from-yellow-400 to-yellow-600'; // Ouro
    if (index === 1) return 'bg-gradient-to-b from-gray-300 to-gray-500'; // Prata
    if (index === 2) return 'bg-gradient-to-b from-amber-600 to-amber-800'; // Bronze
    return 'bg-gray-400';
}

function getPodiumIcon(index) {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
}

// ========================================
// SISTEMA DE CORES POR CLASSE
// ========================================

function applyClassColors(studentClass) {
    // Mapeamento de classes para cores específicas e símbolos
    const classColors = {
        'Arqueiro do JavaScript': {
            color: '#F7DF1E',
            textColor: '#000',
            bgClass: 'bg-[#F7DF1E]',
            textClass: 'text-black',
            icon: 'fas fa-bow-arrow',
            symbol: '🏹',
            gradient: 'linear-gradient(135deg, #F7DF1E 0%, #E6C200 100%)',
            shadowColor: 'rgba(247, 223, 30, 0.3)'
        },
        'Cafeicultor do Java': {
            color: '#007396',
            textColor: '#fff',
            bgClass: 'bg-[#007396]',
            textClass: 'text-white',
            icon: 'fas fa-coffee',
            symbol: '☕',
            gradient: 'linear-gradient(135deg, #007396 0%, #005A73 100%)',
            shadowColor: 'rgba(0, 115, 150, 0.3)'
        },
        'Mago do CSS': {
            color: '#264DE4',
            textColor: '#fff',
            bgClass: 'bg-[#264DE4]',
            textClass: 'text-white',
            icon: 'fas fa-magic',
            symbol: '🧙‍♂️',
            gradient: 'linear-gradient(135deg, #264DE4 0%, #1A3AB8 100%)',
            shadowColor: 'rgba(38, 77, 228, 0.3)'
        },
        'Guerreiro do HTML': {
            color: '#E44D26',
            textColor: '#fff',
            bgClass: 'bg-[#E44D26]',
            textClass: 'text-white',
            icon: 'fas fa-sword',
            symbol: '⚔️',
            gradient: 'linear-gradient(135deg, #E44D26 0%, #C73E1D 100%)',
            shadowColor: 'rgba(228, 77, 38, 0.3)'
        },
        'Xamã do React': {
            color: '#61DAFB',
            textColor: '#000',
            bgClass: 'bg-[#61DAFB]',
            textClass: 'text-black',
            icon: 'fas fa-magic',
            symbol: '🔮',
            gradient: 'linear-gradient(135deg, #61DAFB 0%, #21C7FB 100%)',
            shadowColor: 'rgba(97, 218, 251, 0.3)'
        },
        'Necromante do Node.js': {
            color: '#6DA55F',
            textColor: '#fff',
            bgClass: 'bg-[#6DA55F]',
            textClass: 'text-white',
            icon: 'fas fa-skull',
            symbol: '💀',
            gradient: 'linear-gradient(135deg, #6DA55F 0%, #5A8A4A 100%)',
            shadowColor: 'rgba(109, 165, 95, 0.3)'
        },
        'Paladino do Python': {
            color: '#3776AB',
            textColor: '#fff',
            bgClass: 'bg-[#3776AB]',
            textClass: 'text-white',
            icon: 'fas fa-shield-alt',
            symbol: '🛡️',
            gradient: 'linear-gradient(135deg, #3776AB 0%, #2A5A87 100%)',
            shadowColor: 'rgba(55, 118, 171, 0.3)'
        },
        'Druida do Banco de Dados': {
            color: '#4479A1',
            textColor: '#fff',
            bgClass: 'bg-[#4479A1]',
            textClass: 'text-white',
            icon: 'fas fa-tree',
            symbol: '🌳',
            gradient: 'linear-gradient(135deg, #4479A1 0%, #336080 100%)',
            shadowColor: 'rgba(68, 121, 161, 0.3)'
        },
        'Assassino do Android': {
            color: '#3DDC84',
            textColor: '#000',
            bgClass: 'bg-[#3DDC84]',
            textClass: 'text-black',
            icon: 'fas fa-user-ninja',
            symbol: '🥷',
            gradient: 'linear-gradient(135deg, #3DDC84 0%, #2EBF6F 100%)',
            shadowColor: 'rgba(61, 220, 132, 0.3)'
        },
        'Bardo do iOS': {
            color: '#BFBFBF',
            textColor: '#000',
            bgClass: 'bg-[#BFBFBF]',
            textClass: 'text-black',
            icon: 'fas fa-music',
            symbol: '🎵',
            gradient: 'linear-gradient(135deg, #BFBFBF 0%, #999999 100%)',
            shadowColor: 'rgba(191, 191, 191, 0.3)'
        },
        'Bárbaro do Back-end': {
            color: '#8B4513',
            textColor: '#fff',
            bgClass: 'bg-[#8B4513]',
            textClass: 'text-white',
            icon: 'fas fa-axe',
            symbol: '🪓',
            gradient: 'linear-gradient(135deg, #8B4513 0%, #6B3410 100%)',
            shadowColor: 'rgba(139, 69, 19, 0.3)'
        }
    };

    const classInfo = classColors[studentClass];
    if (classInfo) {
        // Aplicar tema personalizado ao body
        document.body.style.background = `linear-gradient(135deg, ${classInfo.color}10 0%, ${classInfo.color}05 100%)`;

        // Aplicar cores ao header principal do painel dos alunos
        const header = document.querySelector('header.nav-header');
        if (header) {
            // Aplicar gradiente personalizado ao header
            header.style.background = classInfo.gradient;
            header.style.borderBottom = `3px solid ${classInfo.color}`;
            header.style.boxShadow = `0 4px 20px ${classInfo.shadowColor}`;

            // Aplicar cor e símbolo ao ícone do header
            const headerIcon = header.querySelector('.bg-blue-600');
            if (headerIcon) {
                headerIcon.style.background = `radial-gradient(circle, ${classInfo.color}dd 0%, ${classInfo.color} 100%)`;
                headerIcon.style.color = classInfo.textColor;
                headerIcon.style.boxShadow = `0 4px 15px ${classInfo.shadowColor}`;
                headerIcon.style.transform = 'scale(1.1)';
                headerIcon.style.transition = 'all 0.3s ease';

                // Trocar o ícone padrão pelo símbolo da classe
                const iconElement = headerIcon.querySelector('i');
                if (iconElement) {
                    iconElement.style.display = 'none';
                    headerIcon.innerHTML = `<span style="font-size: 1.4em; font-weight: bold;">${classInfo.symbol}</span>`;
                }
            }

            // Aplicar cor aos textos do header
            const headerTitle = header.querySelector('h1');
            if (headerTitle) {
                headerTitle.style.color = classInfo.textColor;
                headerTitle.style.textShadow = `0 2px 4px ${classInfo.shadowColor}`;
                headerTitle.style.fontWeight = 'bold';
            }

            const headerSubtitle = header.querySelector('.text-gray-500');
            if (headerSubtitle) {
                headerSubtitle.style.color = classInfo.textColor;
                headerSubtitle.style.opacity = '0.9';
                headerSubtitle.style.textShadow = `0 1px 2px ${classInfo.shadowColor}`;
            }

            // Aplicar cor ao nome do aluno
            const studentName = header.querySelector('#student-name');
            if (studentName) {
                studentName.style.color = classInfo.textColor;
                studentName.style.fontWeight = 'bold';
                studentName.style.textShadow = `0 1px 2px ${classInfo.shadowColor}`;
            }

            // Remover o XP do header
            const xpElement = header.querySelector('#user-xp');
            if (xpElement) {
                const xpContainer = xpElement.closest('.flex.items-center.space-x-2');
                if (xpContainer) {
                    xpContainer.style.display = 'none';
                }
            }
        }

        // Aplicar cores ao card de progresso
        const progressCard = document.querySelector('.card');
        if (progressCard) {
            progressCard.style.background = `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)`;
            progressCard.style.borderTop = `4px solid ${classInfo.color}`;
            progressCard.style.boxShadow = `0 8px 32px ${classInfo.shadowColor}`;
            progressCard.style.backdropFilter = 'blur(10px)';

            // Aplicar cor ao título do XP
            const xpElement = progressCard.querySelector('.text-2xl.font-bold.text-blue-600');
            if (xpElement) {
                xpElement.style.color = classInfo.color;
                xpElement.style.textShadow = `0 2px 4px ${classInfo.shadowColor}`;
            }
        }

        // Aplicar cor à barra de progresso
        const progressBar = document.getElementById('xp-bar');
        if (progressBar) {
            progressBar.style.background = classInfo.gradient;
            progressBar.style.boxShadow = `0 2px 8px ${classInfo.shadowColor}`;
            progressBar.style.borderRadius = '8px';

            // Adicionar animação à barra
            progressBar.style.transition = 'all 0.5s ease';
            progressBar.style.position = 'relative';
            progressBar.style.overflow = 'hidden';

            // Criar efeito de brilho na barra
            const shine = document.createElement('div');
            shine.style.position = 'absolute';
            shine.style.top = '0';
            shine.style.left = '-100%';
            shine.style.width = '100%';
            shine.style.height = '100%';
            shine.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)';
            shine.style.animation = 'shine 2s infinite';
            progressBar.appendChild(shine);
        }

        // Aplicar tema aos botões de tab
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            button.addEventListener('mouseenter', () => {
                button.style.background = classInfo.gradient;
                button.style.color = classInfo.textColor;
                button.style.transform = 'translateY(-2px) scale(1.02)';
                button.style.boxShadow = `0 8px 25px ${classInfo.shadowColor}`;
            });

            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('active')) {
                    button.style.background = '';
                    button.style.color = '';
                    button.style.transform = '';
                    button.style.boxShadow = '';
                }
            });

            // Aplicar estilo ao botão ativo
            if (button.classList.contains('active')) {
                button.style.background = classInfo.gradient;
                button.style.color = classInfo.textColor;
                button.style.borderBottom = `3px solid ${classInfo.color}`;
                button.style.boxShadow = `0 4px 15px ${classInfo.shadowColor}`;
            }
        });

        // Aplicar tema aos botões modernos
        setTimeout(() => {
            const modernButtons = document.querySelectorAll('.modern-btn');
            modernButtons.forEach(button => {
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

                if (button.classList.contains('btn-primary')) {
                    button.style.background = classInfo.gradient;
                    button.style.color = classInfo.textColor;
                    button.style.border = `2px solid ${classInfo.color}`;
                    button.style.boxShadow = `0 4px 15px ${classInfo.shadowColor}`;

                    button.addEventListener('mouseenter', () => {
                        button.style.transform = 'translateY(-3px) scale(1.02)';
                        button.style.boxShadow = `0 8px 25px ${classInfo.shadowColor}`;
                    });

                    button.addEventListener('mouseleave', () => {
                        button.style.transform = 'translateY(0) scale(1)';
                        button.style.boxShadow = `0 4px 15px ${classInfo.shadowColor}`;
                    });
                }

                if (button.classList.contains('btn-outline-primary')) {
                    button.style.background = 'transparent';
                    button.style.color = classInfo.color;
                    button.style.border = `2px solid ${classInfo.color}`;

                    button.addEventListener('mouseenter', () => {
                        button.style.background = classInfo.gradient;
                        button.style.color = classInfo.textColor;
                        button.style.transform = 'translateY(-2px) scale(1.02)';
                        button.style.boxShadow = `0 6px 20px ${classInfo.shadowColor}`;
                    });

                    button.addEventListener('mouseleave', () => {
                        button.style.background = 'transparent';
                        button.style.color = classInfo.color;
                        button.style.transform = 'translateY(0) scale(1)';
                        button.style.boxShadow = 'none';
                    });
                }
            });
        }, 1000);

        // Aplicar tema aos cards de missão
        setTimeout(() => {
            const missionCards = document.querySelectorAll('.card');
            missionCards.forEach(card => {
                if (card.querySelector('.card-header')) {
                    card.style.borderTop = `3px solid ${classInfo.color}`;
                    card.style.boxShadow = `0 4px 20px ${classInfo.shadowColor}`;
                    card.style.transition = 'all 0.3s ease';

                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-4px)';
                        card.style.boxShadow = `0 8px 30px ${classInfo.shadowColor}`;
                    });

                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = `0 4px 20px ${classInfo.shadowColor}`;
                    });
                }
            });
        }, 1000);

        // Adicionar CSS personalizado para animações e botões modernos
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            @keyframes ripple {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .modern-btn {
                position: relative;
                overflow: hidden;
                border-radius: 12px;
                font-weight: 600;
                padding: 12px 24px;
                border: 2px solid transparent;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                user-select: none;
                -webkit-user-select: none;
                background: linear-gradient(45deg, transparent, transparent);
                backdrop-filter: blur(10px);
            }
            
            .modern-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s ease, height 0.3s ease;
                pointer-events: none;
            }
            
            .modern-btn:hover::before {
                width: 300px;
                height: 300px;
            }
            
            .modern-btn:active {
                transform: scale(0.98);
            }
            
            .btn-primary {
                background: ${classInfo.gradient};
                color: ${classInfo.textColor};
                border-color: ${classInfo.color};
                box-shadow: 0 4px 15px ${classInfo.shadowColor};
            }
            
            .btn-primary:hover {
                transform: translateY(-3px) scale(1.02);
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                color: white;
                border-color: #6b7280;
                box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
            }
            
            .btn-secondary:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
                background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            }
            
            .btn-outline-primary {
                background: rgba(255, 255, 255, 0.1);
                color: ${classInfo.color};
                border-color: ${classInfo.color};
                backdrop-filter: blur(10px);
            }
            
            .btn-outline-primary:hover {
                background: ${classInfo.gradient};
                color: ${classInfo.textColor};
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 6px 20px ${classInfo.shadowColor};
            }
            
            .btn-close {
                background: rgba(239, 68, 68, 0.1);
                color: #dc2626;
                border-color: #dc2626;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                padding: 0;
                backdrop-filter: blur(10px);
            }
            
            .btn-close:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                transform: scale(1.1) rotate(90deg);
                box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
            }
            
            .modern-btn.group:hover .fas {
                animation: bounce 0.6s ease;
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            
            .tab-button {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative;
                overflow: hidden;
            }
            
            .tab-button::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 3px;
                background: ${classInfo.color};
                transition: width 0.3s ease;
            }
            
            .tab-button.active::after,
            .tab-button:hover::after {
                width: 100%;
            }
            
            .card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                position: relative;
                overflow: hidden;
            }
            
            .card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .card:hover::before {
                left: 100%;
            }
            
            .progress-bar {
                background: rgba(0,0,0,0.1) !important;
                border-radius: 8px !important;
                overflow: hidden !important;
            }
            
            .badge-success {
                background: ${classInfo.gradient} !important;
                color: ${classInfo.textColor} !important;
                border-radius: 12px !important;
                padding: 6px 12px !important;
                font-weight: 600 !important;
                box-shadow: 0 2px 8px ${classInfo.shadowColor} !important;
            }
            
            .input:focus {
                border-color: ${classInfo.color} !important;
                box-shadow: 0 0 0 3px ${classInfo.shadowColor} !important;
            }
        `;
        document.head.appendChild(style);

        // Modernizar botões após aplicar estilos
        modernizeButtons();
    }
}

// Função para modernizar botões existentes
function modernizeButtons() {
    const buttons = document.querySelectorAll('button, .btn');

    buttons.forEach(button => {
        // Pular botões que já foram modernizados
        if (button.classList.contains('modern-btn')) return;

        // Adicionar classe base moderna
        button.classList.add('modern-btn');

        // Determinar tipo de botão baseado nas classes existentes
        if (button.classList.contains('btn-primary') ||
            button.classList.contains('btn-success') ||
            button.classList.contains('btn-info')) {
            button.classList.add('btn-primary');
        } else if (button.classList.contains('btn-secondary') ||
            button.classList.contains('btn-warning')) {
            button.classList.add('btn-secondary');
        } else if (button.classList.contains('btn-outline-primary') ||
            button.classList.contains('btn-outline-success')) {
            button.classList.add('btn-outline-primary');
        } else if (button.classList.contains('btn-close') ||
            button.classList.contains('close') ||
            button.innerHTML.includes('×')) {
            button.classList.add('btn-close');
        } else {
            // Botão padrão
            button.classList.add('btn-primary');
        }

        // Adicionar efeito ripple
        button.addEventListener('click', function (e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.width = '0';
            ripple.style.height = '0';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Modernizar botões existentes ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    modernizeButtons();
});

// Função para criar dados de ranking de fallback
function createFallbackRankings() {
    const currentUser = studentInfo ? studentInfo.username : 'Usuário';

    // Dados de exemplo para demonstração
    const fallbackRankings = [
        { username: currentUser, class: 'Arqueiro do JavaScript', xp: 152, level: 2 },
        { username: 'Alice', class: 'Mago do Java', xp: 200, level: 2 },
        { username: 'Bob', class: 'Cavaleiro do Python', xp: 180, level: 2 },
        { username: 'Carol', class: 'Paladino do C#', xp: 120, level: 2 },
        { username: 'David', class: 'Assassino do C++', xp: 90, level: 1 },
        { username: 'Eve', class: 'Druida do PHP', xp: 75, level: 1 },
        { username: 'Frank', class: 'Xamã do Ruby', xp: 60, level: 1 },
        { username: 'Grace', class: 'Necromante do Go', xp: 45, level: 1 },
        { username: 'Henry', class: 'Bárbaro do Rust', xp: 30, level: 1 },
        { username: 'Ivy', class: 'Monge do TypeScript', xp: 15, level: 1 }
    ];

    return fallbackRankings;
}
