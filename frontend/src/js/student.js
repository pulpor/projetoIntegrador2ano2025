// Sistema de Painel do Estudante
// Arquivo: student.js

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

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.remove("translate-x-full", "opacity-0");
        });

        // Remover após 3 segundos
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

// API - Sistema de requisições
const API = {
    async request(endpoint, options = {}) {
        console.log(`API Request: ${endpoint}`);

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Dados simulados para desenvolvimento
            if (endpoint === "/missoes") {
                return [
                    {
                        id: 1,
                        title: "Fundamentos JavaScript",
                        description: "Crie funções básicas para manipulação de arrays, objetos e estruturas de dados em JavaScript.",
                        xp: 75,
                        targetClass: "Arqueiro do JavaScript",
                        targetYear: 1,
                        status: "ativa"
                    },
                    {
                        id: 2,
                        title: "Layout Responsivo",
                        description: "Desenvolva uma página web responsiva usando HTML5, CSS3 e Flexbox/Grid.",
                        xp: 60,
                        targetClass: "Mago do CSS",
                        targetYear: null,
                        status: "ativa"
                    },
                    {
                        id: 3,
                        title: "API REST",
                        description: "Construa uma API RESTful completa com autenticação e CRUD.",
                        xp: 150,
                        targetClass: "Bárbaro do Back-end",
                        targetYear: 2,
                        status: "ativa"
                    },
                    {
                        id: 4,
                        title: "Projeto Final",
                        description: "Integração completa frontend-backend com deploy em produção.",
                        xp: 250,
                        targetClass: "geral",
                        targetYear: null,
                        status: "ativa"
                    },
                    {
                        id: 5,
                        title: "Data Analysis",
                        description: "Análise de dados com Python, pandas e visualizações.",
                        xp: 120,
                        targetClass: "Mago do Python",
                        targetYear: 2,
                        status: "ativa"
                    }
                ];
            }

            if (endpoint === "/usuarios/me") {
                return {
                    id: 999,
                    username: "Aluno Teste",
                    class: "Arqueiro do JavaScript",
                    year: 1,
                    level: 3,
                    xp: 295
                };
            }

            if (endpoint === "/submissoes/my-submissions") {
                const userSubmissions = JSON.parse(localStorage.getItem("userSubmissions") || "[]");
                const defaultSubmissions = [
                    {
                        id: 1,
                        missionId: 1,
                        missionTitle: "Fundamentos JavaScript",
                        status: "approved",
                        xp: 75,
                        submittedAt: "2024-12-01T10:00:00Z",
                        filePaths: ["script.js", "utils.js"],
                        feedback: "Excelente trabalho! Código bem estruturado e funcional."
                    },
                    {
                        id: 2,
                        missionId: 2,
                        missionTitle: "Layout Responsivo",
                        status: "pending",
                        xp: 60,
                        submittedAt: "2024-12-05T14:30:00Z",
                        filePaths: ["index.html", "styles.css", "responsive.css"],
                        feedback: null
                    },
                    {
                        id: 3,
                        missionId: 3,
                        missionTitle: "API REST",
                        status: "rejected",
                        xp: 0,
                        submittedAt: "2024-12-03T16:45:00Z",
                        filePaths: ["server.js"],
                        feedback: "Precisa melhorar a validação de dados e tratamento de erros."
                    }
                ];

                return [...userSubmissions, ...defaultSubmissions].sort((a, b) =>
                    new Date(b.submittedAt) - new Date(a.submittedAt)
                );
            }

            return {};
        } catch (error) {
            console.error(`Erro na API ${endpoint}:`, error);
            throw error;
        }
    },

    saveSubmission(submission) {
        const submissions = JSON.parse(localStorage.getItem("userSubmissions") || "[]");
        submissions.unshift(submission);
        localStorage.setItem("userSubmissions", JSON.stringify(submissions));
    },

    async uploadFiles(endpoint, formData) {
        console.log(`API Upload: ${endpoint}`);

        // Simular delay de upload
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Simular upload bem-sucedido para desenvolvimento
            const files = formData.getAll('files');
            const missionId = formData.get('missionId');

            console.log(`Simulando upload de ${files.length} arquivo(s) para missão ${missionId}`);

            // Criar submissão simulada
            const submission = {
                id: Date.now(),
                missionId: parseInt(missionId),
                files: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type
                })),
                status: 'pending',
                submittedAt: new Date().toISOString(),
                feedback: null
            };

            // Salvar no localStorage
            this.saveSubmission(submission);

            return submission;
        } catch (error) {
            console.error(`Erro no upload ${endpoint}:`, error);
            throw error;
        }
    }
};

// UI - Sistema de interface
const UI = {
    // Renderizar missões
    renderMissions(missions) {
        console.log("Renderizando missões:", missions?.length);

        const container = document.getElementById("missions");
        const selectElement = document.getElementById("mission-select");

        if (!container) {
            console.error("Container 'missions' não encontrado!");
            Toast.show("Erro: elemento 'missions' não encontrado na página", "error");
            return;
        }

        // Garantir que missions é um array
        if (!Array.isArray(missions)) {
            missions = [];
        }

        // Atualizar contador
        const totalElement = document.getElementById("total-missions");
        if (totalElement) {
            totalElement.textContent = missions.length.toString();
        }

        // Limpar containers
        container.innerHTML = "";
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Selecione uma missão para enviar</option>';
        }

        if (missions.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-info-circle text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Nenhuma missão disponível</p>
                    <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Verifique os filtros ou entre em contato com o professor</p>
                </div>
            `;
            return;
        }

        const submissions = AppState.get("submissions") || [];
        const submittedMissionIds = submissions
            .filter(s => ["approved", "pending"].includes(s.status))
            .map(s => s.missionId);

        missions.forEach((mission, index) => {
            try {
                // Criar card da missão
                const card = this.createMissionCard(mission);
                container.appendChild(card);

                // Adicionar ao select se existir
                if (selectElement) {
                    const option = document.createElement("option");
                    option.value = mission.id;

                    if (submittedMissionIds.includes(mission.id)) {
                        const submission = submissions.find(s => s.missionId === mission.id);
                        const status = submission?.status;
                        option.textContent = `${mission.title} (${status === "pending" ? "🕒 Pendente" : "✅ Aprovada"})`;
                        option.disabled = true;
                        option.className = "text-gray-400";
                    } else {
                        option.textContent = mission.title;
                    }

                    selectElement.appendChild(option);
                }

            } catch (error) {
                console.error(`Erro ao renderizar missão ${mission.title}:`, error);
            }
        });

        console.log(`${missions.length} missões renderizadas`);
        Toast.show(`${missions.length} missões carregadas`, "success");
    },

    // Criar card de missão
    createMissionCard(mission) {
        const submissions = AppState.get("submissions") || [];
        const submission = submissions.find(s => s.missionId === mission.id);
        const status = submission ? submission.status : "available";

        const card = document.createElement("div");
        card.className = `bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${status === "approved" || status === "pending" ? "opacity-70" :
            status === "rejected" ? "border-2 border-red-400" : ""
            }`;

        // Header do status
        let statusHeader = "";
        if (status === "approved") {
            statusHeader = '<div class="absolute top-0 right-0 left-0 bg-green-500 text-white text-xs px-3 py-1 text-center">✓ Aprovada</div>';
        } else if (status === "pending") {
            statusHeader = '<div class="absolute top-0 right-0 left-0 bg-blue-500 text-white text-xs px-3 py-1 text-center">🕒 Pendente de avaliação</div>';
        } else if (status === "rejected") {
            statusHeader = '<div class="absolute top-0 right-0 left-0 bg-red-500 text-white text-xs px-3 py-1 text-center">⟳ Rejeitada - Pode reenviar</div>';
        }

        // Determinar dificuldade
        const difficulty = this.getDifficulty(mission.xp);

        // Botão de ação
        let actionButton;
        if (status === "approved" || status === "pending") {
            actionButton = '<span class="text-xs text-gray-500 dark:text-gray-400 italic">Aguarde a avaliação</span>';
        } else {
            const isRejected = status === "rejected";
            actionButton = `
        <button onclick="Missions.showDetails(${mission.id})" 
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isRejected ? "animate-pulse" : ""}">
          <i class="fas fa-${isRejected ? "redo" : "eye"} mr-1"></i>
          ${isRejected ? "Reenviar" : "Ver Detalhes"}
        </button>
      `;
        }

        // Feedback anterior se rejeitada
        const feedbackSection = (status === "rejected" && submission?.feedback) ? `
      <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
        <strong>Feedback anterior:</strong> ${submission.feedback}
      </div>
    ` : "";

        card.innerHTML = `
      <div class="p-6 relative pt-8">
        ${statusHeader}
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-xl text-gray-800 dark:text-white line-clamp-2 ${status === "approved" || status === "pending" ? "opacity-70" : ""}">${mission.title}</h3>
          <span class="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full whitespace-nowrap">${mission.targetClass || "Geral"}</span>
        </div>
        <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 text-sm leading-relaxed">${mission.description}</p>
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <i class="fas fa-star text-yellow-400 mr-1"></i>
            <span class="font-bold text-lg text-gray-800 dark:text-white">${mission.xp}</span>
            <span class="text-gray-500 dark:text-gray-400 text-sm ml-1">XP</span>
          </div>
          <span class="${difficulty.color} text-white text-xs px-2 py-1 rounded-full font-medium">${difficulty.text}</span>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <i class="fas fa-graduation-cap mr-1"></i>
            <span>Ano: ${mission.targetYear || "Todos"}</span>
          </div>
          ${actionButton}
        </div>
        ${feedbackSection}
      </div>
    `;

        return card;
    },

    // Determinar dificuldade baseada no XP
    getDifficulty(xp) {
        if (xp <= 50) return { text: "Fácil", color: "bg-green-500" };
        if (xp <= 100) return { text: "Médio", color: "bg-yellow-500" };
        if (xp <= 200) return { text: "Difícil", color: "bg-orange-500" };
        return { text: "Muito Difícil", color: "bg-red-500" };
    },

    // Atualizar barra de progresso do estudante
    updateProgressBar(studentInfo) {
        if (!studentInfo) return;

        const elements = {
            level: document.getElementById("student-level"),
            totalXp: document.getElementById("total-xp"),
            currentXp: document.getElementById("current-xp"),
            nextLevelXp: document.getElementById("next-level-xp"),
            progressBar: document.getElementById("xp-bar"),
            percentage: document.getElementById("progress-percentage"),
            studentClass: document.getElementById("student-class"),
            studentYear: document.getElementById("student-year"),
            studentName: document.getElementById("student-name")
        };

        // Calcular XP do nível atual
        const currentLevelXp = 200 + (studentInfo.level - 1) * 100;
        const nextLevelXp = 200 + studentInfo.level * 100;
        const currentProgress = Math.max(0, studentInfo.xp - currentLevelXp);
        const totalNeeded = nextLevelXp - currentLevelXp;
        const percentage = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));

        // Atualizar elementos
        if (elements.level) elements.level.textContent = studentInfo.level || 1;
        if (elements.totalXp) elements.totalXp.textContent = studentInfo.xp || 0;
        if (elements.currentXp) elements.currentXp.textContent = currentProgress;
        if (elements.nextLevelXp) elements.nextLevelXp.textContent = totalNeeded;
        if (elements.progressBar) elements.progressBar.style.width = `${percentage}%`;
        if (elements.percentage) elements.percentage.textContent = `${Math.round(percentage)}%`;
        if (elements.studentClass) elements.studentClass.textContent = studentInfo.class || "";
        if (elements.studentYear) elements.studentYear.textContent = studentInfo.year ? `${studentInfo.year}º` : "";
        if (elements.studentName) elements.studentName.textContent = studentInfo.username || "Aluno";
    },

    renderSubmissions(submissions) {
        console.log('Renderizando histórico de submissões:', submissions);
        const container = document.getElementById("submission-history");

        if (!container) {
            console.error("Container de histórico não encontrado!");
            return;
        }

        if (!submissions || submissions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400 text-lg">Nenhuma submissão encontrada</p>
                    <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Suas submissões aparecerão aqui</p>
                </div>
            `;
            return;
        }

        const submissionsHTML = submissions.map(submission => {
            const statusConfig = {
                pending: { class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendente', icon: 'clock' },
                approved: { class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Aprovada', icon: 'check-circle' },
                rejected: { class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Rejeitada', icon: 'times-circle' }
            };

            const status = statusConfig[submission.status] || statusConfig.pending;
            const submissionDate = new Date(submission.submittedAt).toLocaleDateString('pt-BR');
            const submissionTime = new Date(submission.submittedAt).toLocaleTimeString('pt-BR');

            return `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800 dark:text-white">Missão #${submission.missionId}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${submissionDate} às ${submissionTime}</p>
                        </div>
                        <span class="${status.class} px-3 py-1 rounded-full text-sm font-medium">
                            <i class="fas fa-${status.icon} mr-1"></i>
                            ${status.text}
                        </span>
                    </div>
                    
                    ${submission.files ? `
                        <div class="mb-3">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Arquivos enviados:</p>
                            <div class="flex flex-wrap gap-2">
                                ${submission.files.map(file => `
                                    <span class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                                        <i class="fas fa-file-code mr-1"></i>
                                        ${file.name}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${submission.feedback ? `
                        <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback:</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${submission.feedback}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = submissionsHTML;
    }
};

// Data - Sistema de carregamento de dados
const Data = {
    async fetchData(endpoint, stateKey, callback, errorMessage) {
        try {
            console.log(`Carregando dados: ${stateKey}`);
            const data = await API.request(endpoint);
            AppState.set(stateKey, data);
            if (callback) callback(data);
            return data;
        } catch (error) {
            console.error(`Erro ao carregar ${stateKey}:`, error);
            Toast.show(errorMessage || "Erro ao carregar dados", "error");
            return null;
        }
    },

    async loadStudentInfo() {
        const data = await this.fetchData(
            "/usuarios/me",
            "studentInfo",
            (data) => UI.updateProgressBar(data),
            "Erro ao carregar dados do usuário"
        );

        if (data?.class) {
            const classOption = document.getElementById("student-class-option");
            if (classOption) {
                classOption.value = data.class;
                classOption.textContent = data.class;
            }
        }
    },

    async loadMissions() {
        console.log("Carregando missões...");

        try {
            // Verificar se o container existe
            const container = document.getElementById("missions");
            if (!container) {
                console.error("Container 'missions' não encontrado!");
                Toast.show("Erro: Container de missões não encontrado", "error");
                return;
            }

            const data = await this.fetchData(
                "/missoes",
                "missions",
                null,
                "Erro ao carregar missões"
            );

            if (data && Array.isArray(data)) {
                AppState.set("filteredMissions", data);
                UI.renderMissions(data);
            } else {
                console.error("Dados inválidos recebidos da API");
                Toast.show("Erro nos dados das missões", "error");
                UI.renderMissions([]);
            }

        } catch (error) {
            console.error("Erro no carregamento de missões:", error);
            Toast.show("Erro ao carregar missões", "error");
            UI.renderMissions([]);
        }
    },

    async loadSubmissions() {
        const historyContainer = document.getElementById("submission-history");
        if (historyContainer) {
            historyContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Carregando histórico...</p>
        </div>
      `;
        }

        const data = await this.fetchData(
            "/submissoes/my-submissions",
            "submissions",
            null,
            "Erro ao carregar histórico"
        );

        if (data) {
            AppState.set("filteredSubmissions", data);
            UI.renderSubmissions(data);
            Toast.show(`${data.length} submissões carregadas`, "success");
        } else if (historyContainer) {
            historyContainer.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-red-500 dark:text-red-400 text-lg">Erro ao carregar histórico</p>
          <button onclick="Data.loadSubmissions()" class="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
            Tentar Novamente
          </button>
        </div>
      `;
        }
    },

    // Alias para compatibilidade
    async loadSubmissionHistory() {
        console.log('Carregando histórico de submissões...');
        return await this.loadSubmissions();
    }
};

// Missions - Sistema de gerenciamento de missões
const Missions = {
    showDetails(missionId) {
        const missions = AppState.get("missions") || [];
        const mission = missions.find(m => m.id === missionId);

        if (!mission) {
            Toast.show("Missão não encontrada", "error");
            return;
        }

        const difficulty = UI.getDifficulty(mission.xp);

        const modal = document.createElement("div");
        modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
        modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white">${mission.title}</h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição:</h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">${mission.description}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">XP:</h3>
                <span class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${mission.xp}</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Classe:</h3>
                <span class="text-purple-600 dark:text-purple-400 font-medium">${mission.targetClass || "Geral"}</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Ano:</h3>
                <span class="text-blue-600 dark:text-blue-400 font-medium">${mission.targetYear || "Todos"}</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-1">Dificuldade:</h3>
                <span class="text-green-600 dark:text-green-400 font-medium">${difficulty.text}</span>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button onclick="Missions.selectForSubmission(${mission.id}); this.closest('.fixed').remove();" 
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                <i class="fas fa-upload mr-2"></i>Selecionar para Envio
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        // Fechar ao clicar fora
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    selectForSubmission(missionId) {
        const select = document.getElementById("mission-select");
        if (select) {
            select.value = missionId;
            select.closest(".bg-gradient-to-r")?.scrollIntoView({ behavior: "smooth" });
            Toast.show("Missão selecionada", "success");
        }
    }
};

// Sistema de envio de submissões
const Submission = {
    selectedMissionId: null,
    selectedFiles: [],

    init() {
        this.setupSubmissionForm();
        this.setupMissionSelect();
        this.setupFileUpload();
    },

    setupMissionSelect() {
        const missionSelect = document.getElementById('mission-select');
        if (missionSelect) {
            missionSelect.addEventListener('change', (e) => {
                this.selectedMissionId = e.target.value;
                console.log('Missão selecionada:', this.selectedMissionId);

                // Habilitar/desabilitar botão de envio baseado na seleção
                this.updateSubmitButton();
            });
        }
    },

    setupFileUpload() {
        const fileInput = document.getElementById('code-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.selectedFiles = Array.from(e.target.files);
                console.log('Arquivos selecionados:', this.selectedFiles.length);
                this.updateSubmitButton();
            });
        }
    },

    setupSubmissionForm() {
        const submitBtn = document.getElementById('submit-code-btn');

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    },

    updateSubmitButton() {
        const submitBtn = document.getElementById('submit-code-btn');
        if (submitBtn) {
            const canSubmit = this.selectedMissionId && this.selectedFiles.length > 0;
            submitBtn.disabled = !canSubmit;

            if (canSubmit) {
                submitBtn.className = 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105';
            } else {
                submitBtn.className = 'bg-gray-400 text-gray-600 px-6 py-3 rounded-lg font-medium cursor-not-allowed';
            }
        }
    },

    handleSubmit() {
        // Validar se missão foi selecionada
        if (!this.selectedMissionId) {
            Toast.show('Por favor, selecione uma missão antes de enviar!', 'warning');
            return;
        }

        // Validar se arquivos foram selecionados
        if (this.selectedFiles.length === 0) {
            Toast.show('Por favor, selecione pelo menos um arquivo de código!', 'warning');
            return;
        }

        this.submitFiles(this.selectedMissionId, this.selectedFiles);
    },

    async submitFiles(missionId, files) {
        try {
            Toast.show('Enviando submissão...', 'info');

            // Criar FormData para upload
            const formData = new FormData();
            formData.append('missionId', missionId);
            formData.append('submittedAt', new Date().toISOString());

            // Adicionar arquivos
            files.forEach((file, index) => {
                formData.append(`files`, file);
            });

            const response = await API.uploadFiles('/submissoes', formData);

            if (response) {
                Toast.show('Submissão enviada com sucesso!', 'success');

                // Limpar formulário
                this.clearForm();

                // Recarregar histórico
                Data.loadSubmissionHistory();

                // Recarregar missões para atualizar status
                Data.loadMissions();
            }
        } catch (error) {
            console.error('Erro ao enviar submissão:', error);
            Toast.show('Erro ao enviar submissão. Tente novamente.', 'error');
        }
    },

    clearForm() {
        const fileInput = document.getElementById('code-upload');
        const missionSelect = document.getElementById('mission-select');

        if (fileInput) fileInput.value = '';
        if (missionSelect) {
            missionSelect.value = '';
            this.selectedMissionId = null;
        }

        this.selectedFiles = [];
        this.updateSubmitButton();
    }
};

// Sistema de tema (padronizado com o painel do mestre)
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
    console.log("🎨 Tema inicializado:", savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
    
    console.log("🎨 Tema alterado de", currentTheme, "para", newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (icon) {
        if (theme === "dark") {
            icon.className = "fas fa-sun text-xl transition-transform duration-300";
        } else {
            icon.className = "fas fa-moon text-xl transition-transform duration-300";
        }
        console.log("🎨 Ícone do tema atualizado para:", theme);
    } else {
        console.error("❌ Ícone do tema não encontrado!");
    }
}

// Sistema de inicialização
const StudentApp = {
    async init() {
        console.log("Inicializando painel do estudante...");

        try {
            // Verificar se elementos principais existem
            const missionsContainer = document.getElementById("missions");

            if (!missionsContainer) {
                console.error("Container 'missions' não encontrado!");
                Toast.show("Erro: Container de missões não encontrado", "error");
                return;
            }

            Toast.show("Carregando painel...", "info");

            // Configurar dados de teste no localStorage
            [
                "token:token123",
                "username:aluno-teste",
                "isMaster:false"
            ].forEach(item => {
                const [key, value] = item.split(":");
                localStorage.setItem(key, value);
            });

            // Configurar event listeners
            this.setupEventListeners();

            // Carregar dados em sequência
            await Data.loadStudentInfo();
            await Data.loadMissions();
            await Data.loadSubmissions();

            // Expor objetos globais para modais
            window.Missions = Missions;
            window.Data = Data;
            window.UI = UI;

            Toast.show("Painel carregado com sucesso!", "success");

        } catch (error) {
            console.error("Erro na inicialização:", error);
            Toast.show("Erro ao inicializar painel", "error");
        }
    },

    setupEventListeners() {
        console.log("🔧 Configurando event listeners...");
        
        // Logout
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.clear();
                Toast.show("Logout realizado", "success");
                setTimeout(() => {
                    window.location.href = "./index.html";
                }, 1500);
            });
            console.log("✅ Event listener do logout configurado");
        }

        // Botão de tema - configuração mais robusta
        const themeToggle = document.getElementById("theme-toggle");
        console.log("🔍 Procurando botão de tema...", themeToggle);
        
        if (themeToggle) {
            // Remover listeners antigos se existirem
            themeToggle.removeEventListener("click", toggleTheme);
            
            // Adicionar novo listener
            themeToggle.addEventListener("click", function(e) {
                e.preventDefault();
                console.log("🖱️ Botão de tema clicado!");
                toggleTheme();
            });
            
            console.log("✅ Event listener do tema configurado com sucesso");
        } else {
            console.error("❌ Botão de tema não encontrado!");
            
            // Tentar encontrar novamente após um pequeno delay
            setTimeout(() => {
                const themeToggleDelayed = document.getElementById("theme-toggle");
                if (themeToggleDelayed) {
                    themeToggleDelayed.addEventListener("click", function(e) {
                        e.preventDefault();
                        console.log("🖱️ Botão de tema clicado (delayed)!");
                        toggleTheme();
                    });
                    console.log("✅ Event listener do tema configurado (delayed)");
                } else {
                    console.error("❌ Botão de tema ainda não encontrado após delay!");
                }
            }, 500);
        }

        // Inicializar sistemas
        initTheme();
        Submission.init();

        console.log("✅ Todos os event listeners configurados");
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, iniciando aplicação...");
    StudentApp.init();
});

// Expor objetos globais para debug
window.AppState = AppState;
window.Toast = Toast;
window.StudentApp = StudentApp;
window.UI = UI;
window.Data = Data;
window.API = API;
window.Submission = Submission;
window.initTheme = initTheme;
