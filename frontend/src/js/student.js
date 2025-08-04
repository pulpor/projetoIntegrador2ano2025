// Sistema de Painel do Estudante
// Arquivo: student.js

import { API } from './utils/api.js';
import { gemini } from './utils/gemini.js';
import { feedbackModal } from './utils/feedback-modal.js';

// Estado global da aplicação
const AppState = {
    data: {},
    set(key, value) {
        this.data[key] = value;
        console.log(`Estado atualizado: ${key}`, value);
    },
    get(key) {
        return this.data[key];
    }
};

// Sistema de notificações Toast
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = "toast-container";
            this.container.className = "fixed top-4 right-4 z-50 space-y-2";
            document.body.appendChild(this.container);
        }
    },

    show(message, type = "info") {
        this.init();

        const types = {
            error: { class: "bg-red-500", icon: "exclamation-triangle" },
            success: { class: "bg-green-500", icon: "check-circle" },
            warning: { class: "bg-yellow-500", icon: "exclamation-circle" },
            info: { class: "bg-blue-500", icon: "info-circle" }
        };

        const config = types[type] || types.info;
        const toast = document.createElement("div");
        toast.className = `${config.class} text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
        toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${config.icon} mr-2"></i>
        <span>${message}</span>
      </div>
    `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove("translate-x-full", "opacity-0");
        });

        setTimeout(() => {
            toast.classList.add("translate-x-full", "opacity-0");
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
};

// Configuração da API
const API_URL = 'http://localhost:3000'; // Altere isso para a URL correta do seu backend

// Função auxiliar para fazer requisições à API
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token não encontrado');
        window.location.href = '/';
        throw new Error('Token não encontrado');
    }

    const url = API_URL + endpoint;
    console.log(`Fazendo requisição para: ${url}`);

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        console.log(`Resposta da API (${endpoint}):`, response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Token inválido ou expirado');
                localStorage.removeItem('token');
                window.location.href = '/';
                throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Dados recebidos (${endpoint}):`, data);
        return data;
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}

// Sistema de XP e Níveis (sincronizado com backend)
const LevelSystem = {
    XP_LEVELS: [
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
    ],

    calculateLevel(currentXP) {
        // Encontrar o nível atual
        let currentLevel = 1;
        for (let i = this.XP_LEVELS.length - 1; i >= 0; i--) {
            if (currentXP >= this.XP_LEVELS[i].minXP) {
                currentLevel = this.XP_LEVELS[i].level;
                break;
            }
        }

        // Calcular XP para o próximo nível
        const nextLevelData = this.XP_LEVELS.find(level => level.level === currentLevel + 1);
        const currentLevelData = this.XP_LEVELS.find(level => level.level === currentLevel);

        let xpForNextLevel = null;
        let xpProgressInCurrentLevel = 0;
        let xpNeededForCurrentLevel = 0;

        if (nextLevelData) {
            xpForNextLevel = nextLevelData.minXP;
            xpNeededForCurrentLevel = nextLevelData.minXP - currentLevelData.minXP;
            xpProgressInCurrentLevel = currentXP - currentLevelData.minXP;
        } else {
            // Nível máximo atingido
            xpProgressInCurrentLevel = currentXP - currentLevelData.minXP;
            xpNeededForCurrentLevel = 0;
        }

        return {
            level: currentLevel,
            currentXP: xpProgressInCurrentLevel, // XP atual dentro do nível
            nextLevelXP: xpNeededForCurrentLevel, // Total XP necessário para o próximo nível
            totalXP: currentXP, // XP total acumulado
            xpForNextLevel,
            progressPercentage: xpNeededForCurrentLevel > 0 ?
                Math.round((xpProgressInCurrentLevel / xpNeededForCurrentLevel) * 100) : 100,
            isMaxLevel: currentLevel === 10
        };
    }
};

// Funções de inicialização e carregamento
async function initializeApp() {
    console.log('Inicializando aplicação do estudante...');

    // Configurar logout
    setupLogout();

    // Verificar autenticação
    if (!validateAuthentication()) {
        console.log('Falha na autenticação, redirecionando...');
        return;
    }

    console.log('Token atual:', localStorage.getItem('token')); showLoadingStates();

    try {
        const [userData, missionsData, submissionsData, completedMissionsData] = await Promise.all([
            loadUserProfile(),
            loadMissions(),
            loadSubmissions(),
            loadCompletedMissions()
        ]);

        AppState.set('user', userData);
        AppState.set('missions', missionsData);
        AppState.set('submissions', submissionsData);
        AppState.set('completedMissions', completedMissionsData);

        updateUserInterface(userData);
        updateMissionsInterface(missionsData, completedMissionsData);
        updateSubmissionsInterface(submissionsData);
        setupMissionSubmission();
        setupTabs();

        hideLoadingStates();
        console.log('Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar a aplicação:', error);
        Toast.show('Erro ao carregar os dados. Por favor, recarregue a página.', 'error');
        hideLoadingStates();
    }
}

// Configurar sistema de abas
function setupTabs() {
    console.log('Configurando sistema de abas...');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = button.id.replace('tab-', '') + '-tab';
            console.log('Clique na aba:', button.id, 'Target:', targetId);

            // Remove active de todos os botões
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                btn.classList.add('text-gray-500', 'border-transparent');
            });

            // Adiciona active ao botão clicado
            button.classList.add('active', 'text-blue-600', 'border-blue-600');
            button.classList.remove('text-gray-500', 'border-transparent');

            // Esconde todos os conteúdos
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Mostra o conteúdo da aba clicada
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');

                // Se for a aba de histórico, recarregar as submissões
                if (targetId === 'history-tab') {
                    console.log('Carregando histórico de submissões...');
                    loadAndUpdateSubmissions();
                }
            }
        });
    });
}

// Função para carregar e atualizar submissões
async function loadAndUpdateSubmissions() {
    try {
        const submissions = await loadSubmissions();
        updateSubmissionsInterface(submissions);
        console.log('Histórico de submissões atualizado:', submissions);
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        Toast.show('Erro ao carregar histórico de submissões', 'error');
    }
}

function validateAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Realizando logout...');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            Toast.show('Logout realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        });
    }
}

function showLoadingStates() {
    const elements = ['student-name', 'student-level', 'student-class', 'total-xp', 'current-xp', 'next-level-xp'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = 'Carregando...';
    });
}

function hideLoadingStates() {
    const loadingElements = document.querySelectorAll('.loading-animation');
    loadingElements.forEach(el => el.remove());
}

async function loadUserProfile() {
    console.log('Carregando perfil do usuário...');
    try {
        return await apiRequest('/usuarios/me');
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        Toast.show('Erro ao carregar seu perfil: ' + error.message, 'error');
        throw error;
    }
}

async function loadMissions() {
    console.log('Carregando missões...');
    try {
        return await apiRequest('/missoes');
    } catch (error) {
        console.error('Erro ao carregar missões:', error);
        Toast.show('Erro ao carregar missões: ' + error.message, 'error');
        throw error;
    }
}

async function loadSubmissions() {
    console.log('Carregando submissões...');
    try {
        const [submissions, penaltiesRewards] = await Promise.all([
            apiRequest('/submissoes/my-submissions'),
            apiRequest('/usuarios/my-penalties-rewards').catch(() => []) // Fallback se rota não existir
        ]);

        // Combinar submissões com penalidades/recompensas
        const allItems = [...submissions];

        // Adicionar penalidades e recompensas como itens do histórico
        if (penaltiesRewards && penaltiesRewards.length > 0) {
            penaltiesRewards.forEach(item => {
                allItems.push({
                    ...item,
                    isPenaltyReward: true,
                    submittedAt: item.createdAt || item.date,
                    missionTitle: item.type === 'penalty' ? 'Penalidade Aplicada' : 'Recompensa Concedida'
                });
            });
        }

        // Ordenar por data (mais recentes primeiro)
        allItems.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        return allItems;
    } catch (error) {
        console.error('Erro ao carregar submissões:', error);
        Toast.show('Erro ao carregar submissões: ' + error.message, 'error');
        throw error;
    }
}

async function loadCompletedMissions() {
    console.log('Carregando missões concluídas...');
    try {
        // Carregar todas as missões
        const allMissions = await apiRequest('/missoes/all'); // Nova rota para todas as missões
        
        // Carregar submissões aprovadas
        const submissions = await apiRequest('/submissoes/my-submissions');
        const approvedSubmissions = submissions.filter(sub => sub.status === 'approved');
        
        // Mapear submissões aprovadas com dados das missões
        const completedMissions = approvedSubmissions.map(submission => {
            const mission = allMissions.find(m => m.id === submission.missionId);
            return {
                ...mission,
                ...submission,
                completedAt: submission.submittedAt,
                earnedXP: submission.xp || mission?.xp || 0
            };
        });

        return completedMissions;
    } catch (error) {
        console.error('Erro ao carregar missões concluídas:', error);
        return [];
    }
}

function updateUserInterface(userData) {
    console.log('Atualizando interface do usuário:', userData);

    // Calcular nível e XP
    const xpInfo = LevelSystem.calculateLevel(userData.xp || 0);
    console.log('Informações de XP calculadas:', xpInfo);

    // Mapeamento dos ícones das classes
    const classIcons = {
        'Arqueiro do JavaScript': 'fab fa-js-square',
        'Cafeicultor do Java': 'fab fa-java',
        'Mago do CSS': 'fab fa-css3-alt',
        'Paladino do HTML': 'fab fa-html5',
        'Bárbaro do Back-end': 'fas fa-server',
        'Domador de Dados': 'fas fa-chart-bar',
        'Elfo do Front-end': 'fas fa-paint-brush',
        'Caçador de Bugs': 'fas fa-bug'
    };

    // Mapeamento das cores dos círculos das classes
    const classColors = {
        'Arqueiro do JavaScript': 'bg-yellow-100 text-yellow-600',
        'Cafeicultor do Java': 'bg-orange-100 text-orange-600',
        'Mago do CSS': 'bg-blue-100 text-blue-600',
        'Paladino do HTML': 'bg-red-100 text-red-600',
        'Bárbaro do Back-end': 'bg-gray-100 text-gray-600',
        'Domador de Dados': 'bg-green-100 text-green-600',
        'Elfo do Front-end': 'bg-purple-100 text-purple-600',
        'Caçador de Bugs': 'bg-pink-100 text-pink-600'
    };

    // Atualizar nome do estudante na header
    const studentNameHeader = document.getElementById('student-name');
    if (studentNameHeader) {
        studentNameHeader.textContent = userData.username || 'Aluno';
    }

    // Atualizar ícone da classe no header
    const studentClassIcon = document.getElementById('student-class-icon');
    const studentClassCircle = document.getElementById('student-class-circle');

    if (studentClassIcon && userData.class) {
        const iconClass = classIcons[userData.class] || 'fas fa-user';
        const colorClass = classColors[userData.class] || 'bg-gray-200 text-gray-600';

        studentClassIcon.className = `${iconClass}`;
        if (studentClassCircle) {
            studentClassCircle.className = `w-8 h-8 ${colorClass} rounded-full flex items-center justify-center transition-all duration-300`;
        }
    }

    // Atualizar elementos da interface
    const elements = {
        'student-level': `Nível ${xpInfo.level}`,
        'student-class': userData.class || 'Não definida',
        'total-xp': xpInfo.totalXP,
        'current-xp': xpInfo.currentXP,
        'remaining-for-next': Math.max(0, xpInfo.nextLevelXP - xpInfo.currentXP),
        'student-year': `${userData.year || 1}º ano`
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    // Atualizar barra de progresso
    const progress = xpInfo.progressPercentage;
    const progressBar = document.getElementById('xp-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const remainingXp = document.getElementById('remaining-xp');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPercentage) progressPercentage.textContent = `${progress}%`;
    if (remainingXp) {
        const xpRemaining = xpInfo.nextLevelXP - xpInfo.currentXP;
        remainingXp.textContent = xpRemaining > 0 ? xpRemaining : 0;
    }
}

function updateMissionsInterface(missions, completedMissions = []) {
    console.log('Atualizando interface de missões:', missions);
    console.log('Missões concluídas:', completedMissions);
    
    const missionsList = document.getElementById('missions');
    if (!missionsList) {
        console.error('Elemento de missões não encontrado');
        return;
    }

    missionsList.innerHTML = '';

    // Seção de missões concluídas
    if (completedMissions.length > 0) {
        const completedSection = document.createElement('div');
        completedSection.className = 'mb-8';
        completedSection.innerHTML = `
            <h3 class="text-lg font-semibold text-green-700 mb-4 flex items-center">
                <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                Missões Concluídas (${completedMissions.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="completed-missions-list"></div>
        `;
        missionsList.appendChild(completedSection);

        const completedList = document.getElementById('completed-missions-list');
        completedMissions.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 hover:shadow-md transition-all duration-300';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h4 class="text-lg font-bold text-green-800">${mission.title}</h4>
                    <div class="flex flex-col items-end">
                        <span class="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full mb-1">
                            +${mission.earnedXP} XP
                        </span>
                        <span class="text-xs text-green-600">
                            <i class="fas fa-check-circle mr-1"></i>Concluída
                        </span>
                    </div>
                </div>
                <p class="text-green-700 text-sm mb-3">${mission.description}</p>
                <div class="flex justify-between items-center text-xs text-green-600">
                    <span>
                        <i class="fas fa-calendar-alt mr-1"></i>
                        ${new Date(mission.completedAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span>
                        <i class="fas fa-users mr-1"></i> ${mission.targetClass}
                    </span>
                </div>
            `;
            completedList.appendChild(card);
        });
    }

    // Seção de missões disponíveis
    if (missions.length > 0) {
        const availableSection = document.createElement('div');
        availableSection.innerHTML = `
            <h3 class="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                <i class="fas fa-scroll text-blue-500 mr-2"></i>
                Missões Disponíveis (${missions.length})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="available-missions-list"></div>
        `;
        missionsList.appendChild(availableSection);

        const availableList = document.getElementById('available-missions-list');
        missions.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${mission.title}</h3>
                    <span class="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                        ${mission.xp} XP
                    </span>
                </div>
                <p class="text-gray-600 mb-4">${mission.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">
                        <i class="fas fa-users mr-1"></i> ${mission.targetClass}
                    </span>
                </div>
            `;
            availableList.appendChild(card);
        });
    } else if (completedMissions.length === 0) {
        missionsList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-scroll text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-500">Nenhuma missão disponível no momento.</p>
            </div>
        `;
    }

    updateMissionCounters(missions, completedMissions);
    updateMissionSelect(missions);
}

function updateMissionCounters(missions, completedMissions = []) {
    const total = document.getElementById('total-missions');
    const completed = document.getElementById('completed-missions');
    const pending = document.getElementById('pending-missions');

    // Total de missões disponíveis + concluídas
    const totalMissions = missions.length + completedMissions.length;
    
    if (total) total.textContent = totalMissions;
    if (completed) completed.textContent = completedMissions.length;
    if (pending) pending.textContent = missions.length;
}

function setupMissionSubmission() {
    const missionSelect = document.getElementById('mission-select');
    const codeUpload = document.getElementById('code-upload');
    const submitButton = document.getElementById('submit-code-btn');

    if (!missionSelect || !codeUpload || !submitButton) {
        console.error('Elementos do formulário de submissão não encontrados');
        return;
    }

    submitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!missionSelect.value) {
            Toast.show('Selecione uma missão para enviar', 'warning');
            return;
        }

        if (!codeUpload.files || codeUpload.files.length === 0) {
            Toast.show('Selecione pelo menos um arquivo para enviar', 'warning');
            return;
        }

        // Capturar informações da missão selecionada
        const selectedMissionId = missionSelect.value;
        const selectedMissionText = missionSelect.options[missionSelect.selectedIndex].text;
        const uploadedFiles = Array.from(codeUpload.files);

        const formData = new FormData();
        formData.append('missionId', selectedMissionId);
        uploadedFiles.forEach(file => {
            formData.append('code', file);
        });

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';

        try {
            // 1. Enviar submissão para o backend
            await API.request('/submissoes/submit', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            Toast.show('Missão enviada com sucesso!', 'success');

            // 2. Gerar feedback automático com Gemini AI
            await generateAutomaticFeedback(uploadedFiles, {
                id: selectedMissionId,
                title: selectedMissionText,
                description: `Submissão para a missão: ${selectedMissionText}`
            });

            // 3. Limpar formulário
            missionSelect.value = '';
            codeUpload.value = '';

            // 4. Recarregar submissões e missões
            const submissions = await loadSubmissions();
            updateSubmissionsInterface(submissions);

            // Recarregar missões para atualizar a lista
            const missions = await API.request('/missoes', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            updateMissionsInterface(missions);
        } catch (error) {
            console.error('Erro ao enviar missão:', error);
            Toast.show('Erro ao enviar missão. Tente novamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar Código';
        }
    });
}

function updateMissionSelect(missions) {
    const missionSelect = document.getElementById('mission-select');
    if (!missionSelect) return;

    missionSelect.innerHTML = '<option value="">Selecione uma missão para enviar</option>';
    missions.forEach(mission => {
        missionSelect.innerHTML += `
            <option value="${mission.id}">${mission.title} (${mission.xp} XP)</option>
        `;
    });
}

function updateSubmissionsInterface(submissions) {
    console.log('Atualizando interface de submissões:', submissions);
    const submissionsList = document.getElementById('submission-history');
    if (!submissionsList) return;

    submissionsList.innerHTML = '';

    if (submissions.length === 0) {
        submissionsList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-history text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-500">Nenhuma submissão encontrada.</p>
            </div>
        `;
        return;
    }

    submissions.forEach(submission => {
        // Se for penalidade/recompensa, usar cores e ícones específicos
        if (submission.isPenaltyReward) {
            renderPenaltyRewardCard(submission, submissionsList);
        } else {
            renderSubmissionCard(submission, submissionsList);
        }
    });
}

function renderPenaltyRewardCard(item, container) {
    const isPenalty = item.type === 'penalty';
    const card = document.createElement('div');
    card.className = `bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border-l-4 ${isPenalty ? 'border-red-500' : 'border-green-500'}`;

    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-semibold ${isPenalty ? 'text-red-800' : 'text-green-800'} flex items-center">
                    <i class="fas ${isPenalty ? 'fa-exclamation-triangle' : 'fa-gift'} mr-2"></i>
                    ${item.missionTitle}
                </h3>
                <p class="text-sm text-gray-500">
                    <i class="fas fa-calendar-alt mr-1"></i>
                    ${new Date(item.submittedAt).toLocaleString()}
                </p>
                <p class="text-sm ${isPenalty ? 'text-red-600' : 'text-green-600'} mt-1 font-semibold">
                    <i class="fas fa-star mr-1"></i>
                    ${isPenalty ? '-' : '+'}${Math.abs(item.xp || 0)} XP
                </p>
            </div>
            <span class="${isPenalty ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <i class="fas ${isPenalty ? 'fa-minus-circle' : 'fa-plus-circle'} mr-1"></i>
                ${isPenalty ? 'Penalidade' : 'Recompensa'}
            </span>
        </div>
        ${item.reason ? `
            <div class="mt-4 p-4 ${isPenalty ? 'bg-red-50' : 'bg-green-50'} rounded-lg">
                <h4 class="text-sm font-semibold ${isPenalty ? 'text-red-700' : 'text-green-700'} mb-2 flex items-center">
                    <i class="fas fa-comment-alt mr-2"></i>
                    Motivo:
                </h4>
                <p class="${isPenalty ? 'text-red-600' : 'text-green-600'}">${item.reason}</p>
            </div>
        ` : ''}
    `;
    container.appendChild(card);
}

function renderSubmissionCard(submission, container) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };

    const statusText = {
        pending: 'Pendente',
        approved: 'Aprovada',
        rejected: 'Rejeitada'
    };

    const statusIcon = {
        pending: 'fas fa-clock',
        approved: 'fas fa-check-circle',
        rejected: 'fas fa-times-circle'
    };

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300';
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">${submission.missionTitle}</h3>
                <p class="text-sm text-gray-500">
                    <i class="fas fa-calendar-alt mr-1"></i>
                    Enviado em ${new Date(submission.submittedAt).toLocaleString()}
                </p>
                ${submission.xp ? `
                    <p class="text-sm text-blue-600 mt-1">
                        <i class="fas fa-star mr-1"></i>
                        ${submission.xp} XP
                    </p>
                ` : ''}
            </div>
            <span class="${statusColors[submission.status || 'pending']} px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <i class="${statusIcon[submission.status || 'pending']} mr-1"></i>
                ${statusText[submission.status || 'pending']}
            </span>
        </div>
        ${submission.feedback ? `
            <div class="mt-4 p-4 ${submission.status === 'rejected' ? 'bg-red-50 border-l-4 border-red-400' : 'bg-blue-50 border-l-4 border-blue-400'} rounded-r-lg">
                <h4 class="text-sm font-semibold ${submission.status === 'rejected' ? 'text-red-700' : 'text-blue-700'} mb-2 flex items-center">
                    <i class="fas fa-comment-alt mr-2"></i>
                    Feedback do Mestre:
                </h4>
                <p class="${submission.status === 'rejected' ? 'text-red-600' : 'text-blue-600'}">${submission.feedback}</p>
            </div>
        ` : ''}
        ${submission.filePaths && submission.filePaths.length > 0 ? `
            <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <i class="fas fa-paperclip mr-2"></i>
                    Arquivos enviados:
                </h4>
                <div class="space-y-1">
                    ${submission.filePaths.map(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
        return `<span class="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">${fileName}</span>`;
    }).join(' ')}
                </div>
                
                <!-- Botão para Feedback Automático -->
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <button 
                        onclick="requestFeedbackForSubmission(${submission.id}, '${submission.missionTitle}', ${JSON.stringify(submission.filePaths).replace(/"/g, '&quot;')})"
                        class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                        title="Gerar feedback automático com IA"
                    >
                        <i class="fas fa-robot mr-2"></i>
                        Solicitar Feedback IA
                    </button>
                    <span class="ml-2 text-xs text-gray-500">
                        Análise automática do seu código
                    </span>
                </div>
            </div>
        ` : ''}
    `;
    container.appendChild(card);
}

/**
 * Gera feedback automático usando Gemini AI
 * @param {Array} files - Arquivos enviados
 * @param {Object} missionContext - Contexto da missão
 */
async function generateAutomaticFeedback(files, missionContext) {
    try {
        // Mostrar toast informativo
        Toast.show('🤖 Gerando feedback automático com IA...', 'info');
        
        // Gerar feedback com Gemini
        const feedbackData = await gemini.analyzeSubmission(files, missionContext);
        
        // Preparar informações da submissão para o modal
        const submissionInfo = {
            missionTitle: missionContext.title,
            files: files.map(file => ({ name: file.name, size: file.size })),
            timestamp: new Date().toISOString()
        };
        
        // Exibir modal com o feedback
        feedbackModal.show(feedbackData, submissionInfo);
        
        if (feedbackData.success) {
            if (feedbackData.isDemoFeedback) {
                Toast.show('📚 Feedback de demonstração gerado! Configure Gemini para IA personalizada.', 'info');
            } else {
                Toast.show('✨ Feedback automático gerado com sucesso!', 'success');
            }
        } else {
            Toast.show('⚠️ Erro ao gerar feedback automático', 'warning');
        }
        
    } catch (error) {
        console.error('Erro ao gerar feedback automático:', error);
        Toast.show('Erro ao gerar feedback automático. Tente novamente.', 'error');
    }
}

/**
 * Solicita feedback automático para uma submissão existente
 * @param {number} submissionId - ID da submissão
 * @param {string} missionTitle - Título da missão
 * @param {Array} filePaths - Caminhos dos arquivos
 */
async function requestFeedbackForSubmission(submissionId, missionTitle, filePaths) {
    try {
        Toast.show('🤖 Preparando análise automática...', 'info');
        
        // Como não temos acesso aos arquivos originais no frontend,
        // vamos criar um feedback baseado nas informações disponíveis
        const mockFiles = filePaths.map(path => {
            const fileName = path.split('/').pop() || path.split('\\').pop();
            return {
                name: fileName,
                type: 'text',
                size: 0,
                content: `// Arquivo: ${fileName}\n// Esta é uma análise baseada no histórico de submissão.\n// Para uma análise mais detalhada, reenvie o arquivo.`
            };
        });
        
        const missionContext = {
            id: submissionId,
            title: missionTitle,
            description: `Análise de submissão histórica para: ${missionTitle}`
        };
        
        // Gerar feedback com Gemini
        const feedbackData = await gemini.analyzeSubmission(mockFiles, missionContext);
        
        // Preparar informações da submissão para o modal
        const submissionInfo = {
            missionTitle: missionTitle,
            files: filePaths.map(path => ({ 
                name: path.split('/').pop() || path.split('\\').pop(),
                size: 'N/A'
            })),
            timestamp: new Date().toISOString(),
            isHistorical: true
        };
        
        // Exibir modal com o feedback
        feedbackModal.show(feedbackData, submissionInfo);
        
        if (feedbackData.success) {
            Toast.show('✨ Análise automática concluída!', 'success');
        } else {
            Toast.show('⚠️ Erro ao gerar análise automática', 'warning');
        }
        
    } catch (error) {
        console.error('Erro ao solicitar feedback para submissão:', error);
        Toast.show('Erro ao gerar análise. Tente novamente.', 'error');
    }
}

// Fazer a função disponível globalmente
window.requestFeedbackForSubmission = requestFeedbackForSubmission;

document.addEventListener('DOMContentLoaded', initializeApp);
