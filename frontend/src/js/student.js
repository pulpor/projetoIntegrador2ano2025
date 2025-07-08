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
                        description: "Domine os conceitos básicos de JavaScript: variáveis, funções, arrays e objetos. Crie um sistema de inventário para um jogo RPG.",
                        xp: 75,
                        targetClass: "Arqueiro do JavaScript",
                        targetYear: 1,
                        status: "ativa"
                    },
                    {
                        id: 2,
                        title: "Layout Responsivo Mágico",
                        description: "Desenvolva uma página web responsiva usando CSS Grid e Flexbox. Crie um layout que se adapte perfeitamente a qualquer dispositivo.",
                        xp: 60,
                        targetClass: "Mago do CSS",
                        targetYear: null,
                        status: "ativa"
                    },
                    {
                        id: 3,
                        title: "API RESTful Épica",
                        description: "Construa uma API RESTful completa com autenticação JWT, middleware de segurança e documentação Swagger. Crie um sistema de guilds.",
                        xp: 220,
                        targetClass: "Bárbaro do Back-end",
                        targetYear: 2,
                        status: "ativa"
                    },
                    {
                        id: 4,
                        title: "Projeto Final Legendário",
                        description: "Integração completa frontend-backend com deploy em produção. Crie uma aplicação full-stack com todas as tecnologias aprendidas.",
                        xp: 300,
                        targetClass: "Lendário",
                        targetYear: null,
                        status: "ativa"
                    },
                    {
                        id: 5,
                        title: "Análise de Dados Arcana",
                        description: "Análise de dados com Python, pandas e visualizações interativas. Desvende os segredos ocultos nos dados como um verdadeiro mago.",
                        xp: 120,
                        targetClass: "Mago do Python",
                        targetYear: 2,
                        status: "ativa"
                    },
                    {
                        id: 6,
                        title: "Interface Mágica",
                        description: "Crie interfaces de usuário incríveis com React e design moderno. Transforme ideias em experiências visuais marcantes.",
                        xp: 90,
                        targetClass: "Artífice UI/UX",
                        targetYear: 1,
                        status: "ativa"
                    },
                    {
                        id: 7,
                        title: "Banco de Dados Sagrado",
                        description: "Domine SQL e NoSQL. Projete e implemente bancos de dados eficientes para aplicações de alta performance.",
                        xp: 110,
                        targetClass: "Guardian dos Dados",
                        targetYear: 2,
                        status: "ativa"
                    },
                    {
                        id: 8,
                        title: "App Mobile Supremo",
                        description: "Desenvolva aplicativos móveis nativos ou híbridos. Leve suas criações para milhões de usuários no mundo mobile.",
                        xp: 180,
                        targetClass: "Nomade Mobile",
                        targetYear: null,
                        status: "ativa"
                    },
                    {
                        id: 9,
                        title: "DevOps: Mestre das Nuvens",
                        description: "Aprenda containerização, CI/CD e cloud computing. Torne-se o mestre dos deployments e infraestrutura.",
                        xp: 250,
                        targetClass: "Mestre DevOps",
                        targetYear: 3,
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
        console.log("🎯 UI.renderMissions chamado");
        console.log("Renderizando missões:", missions?.length);
        console.log("Missões recebidas:", missions);

        const container = document.getElementById("missions");
        const selectElement = document.getElementById("mission-select");

        if (!container) {
            console.error("❌ Container 'missions' não encontrado!");
            Toast.show("Erro: elemento 'missions' não encontrado na página", "error");
            return;
        }

        console.log("✅ Container de missões encontrado:", container);

        // Garantir que missions é um array
        if (!Array.isArray(missions)) {
            console.warn("⚠️ Missions não é um array, convertendo...");
            missions = [];
        }

        console.log(`📊 Total de missões a renderizar: ${missions.length}`);

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

    // Criar card de missão com design gamer futurístico
    createMissionCard(mission) {
        const submissions = AppState.get("submissions") || [];
        const submission = submissions.find(s => s.missionId === mission.id);
        const status = submission ? submission.status : "available";

        const card = document.createElement("div");

        // Classes base com design futurístico
        let cardClasses = "mission-card relative overflow-hidden rounded-2xl transform transition-all duration-500 hover:scale-105 cursor-pointer group";

        // Aplicar estilos baseados no status
        if (status === "approved") {
            cardClasses += " mission-approved";
        } else if (status === "pending") {
            cardClasses += " mission-pending";
        } else if (status === "rejected") {
            cardClasses += " mission-rejected";
        } else {
            cardClasses += " mission-available";
        }

        card.className = cardClasses;

        // Determinar dificuldade e cores
        const difficulty = this.getDifficultyAdvanced(mission.xp);

        // Determinar ícone da classe
        const classIcon = this.getClassIcon(mission.targetClass);

        // Status ribbon
        let statusRibbon = "";
        if (status === "approved") {
            statusRibbon = `
                <div class="absolute top-0 right-0 z-20">
                    <div class="bg-gradient-to-l from-green-500 to-emerald-600 text-white px-4 py-2 text-xs font-bold transform rotate-45 translate-x-3 -translate-y-1 shadow-lg">
                        <i class="fas fa-check mr-1"></i>CONCLUÍDA
                    </div>
                </div>
            `;
        } else if (status === "pending") {
            statusRibbon = `
                <div class="absolute top-0 right-0 z-20">
                    <div class="bg-gradient-to-l from-yellow-500 to-amber-600 text-white px-4 py-2 text-xs font-bold transform rotate-45 translate-x-3 -translate-y-1 shadow-lg animate-pulse">
                        <i class="fas fa-clock mr-1"></i>PENDENTE
                    </div>
                </div>
            `;
        } else if (status === "rejected") {
            statusRibbon = `
                <div class="absolute top-0 right-0 z-20">
                    <div class="bg-gradient-to-l from-red-500 to-rose-600 text-white px-4 py-2 text-xs font-bold transform rotate-45 translate-x-3 -translate-y-1 shadow-lg animate-bounce">
                        <i class="fas fa-redo mr-1"></i>REFAZER
                    </div>
                </div>
            `;
        }

        // Partículas de fundo
        const particles = Array.from({ length: 8 }, (_, i) =>
            `<div class="particle particle-${i + 1}"></div>`
        ).join('');

        // Botão de ação
        let actionButton;
        if (status === "approved") {
            actionButton = `
                <div class="flex items-center justify-center space-x-2 text-emerald-400 bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-400/30">
                    <i class="fas fa-trophy"></i>
                    <span class="text-sm font-medium">Missão Completa</span>
                </div>
            `;
        } else if (status === "pending") {
            actionButton = `
                <div class="flex items-center justify-center space-x-2 text-amber-400 bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-400/30">
                    <i class="fas fa-hourglass-half animate-pulse"></i>
                    <span class="text-sm font-medium">Aguardando Avaliação</span>
                </div>
            `;
        } else {
            const isRejected = status === "rejected";
            actionButton = `
                <button onclick="Missions.showDetails(${mission.id})" 
                        class="mission-action-btn w-full bg-gradient-to-r ${difficulty.gradientAction} text-white px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 transform hover:-translate-y-1 ${isRejected ? "animate-pulse" : ""}">
                    <i class="fas fa-${isRejected ? "redo" : "rocket"} mr-2"></i>
                    ${isRejected ? "TENTAR NOVAMENTE" : "INICIAR MISSÃO"}
                </button>
            `;
        }

        // Feedback section se rejeitada
        const feedbackSection = (status === "rejected" && submission?.feedback) ? `
            <div class="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur-sm">
                <div class="flex items-start space-x-2">
                    <i class="fas fa-exclamation-triangle text-red-400 mt-1"></i>
                    <div>
                        <p class="text-red-300 text-xs font-medium mb-1">FEEDBACK DO MESTRE:</p>
                        <p class="text-red-200 text-sm leading-relaxed">${submission.feedback}</p>
                    </div>
                </div>
            </div>
        ` : "";

        card.innerHTML = `
            <!-- Fundo futurístico -->
            <div class="absolute inset-0 bg-gradient-to-br ${difficulty.gradient} opacity-90"></div>
            <div class="absolute inset-0 bg-black/50"></div>
            
            <!-- Partículas animadas -->
            <div class="particles">${particles}</div>
            
            <!-- Efeitos de borda -->
            <div class="absolute inset-0 rounded-2xl border-2 ${difficulty.border} opacity-60"></div>
            <div class="absolute inset-0 rounded-2xl border ${difficulty.glowBorder} opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
            
            <!-- Status ribbon -->
            ${statusRibbon}
            
            <!-- Conteúdo principal -->
            <div class="relative z-10 p-6 h-full flex flex-col">
                <!-- Header com classe e dificuldade -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br ${difficulty.iconGradient} flex items-center justify-center shadow-lg">
                            <i class="${classIcon} text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-300 uppercase tracking-wider">${mission.targetClass || "Classe Geral"}</p>
                            <div class="flex items-center space-x-1">
                                <span class="text-xs font-bold ${difficulty.textColor} px-2 py-1 rounded-full ${difficulty.bg}">${difficulty.text}</span>
                                ${mission.targetYear ? `<span class="text-xs text-cyan-300">• Ano ${mission.targetYear}</span>` : '<span class="text-xs text-cyan-300">• Todos os Anos</span>'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Título da missão -->
                <h3 class="text-xl font-bold text-white mb-3 leading-tight ${status === "approved" || status === "pending" ? "opacity-70" : ""}">${mission.title}</h3>
                
                <!-- Descrição -->
                <p class="text-gray-300 text-sm leading-relaxed mb-6 flex-grow">${mission.description}</p>
                
                <!-- XP e recompensa -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                                <i class="fas fa-star text-white text-sm"></i>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400 uppercase">Recompensa</p>
                                <p class="text-lg font-bold text-yellow-300">${mission.xp} XP</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Indicador de progresso -->
                    <div class="text-right">
                        <div class="w-16 h-16 relative">
                            <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" class="text-gray-600"/>
                                <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" 
                                        class="${difficulty.circleColor}" stroke-linecap="round"
                                        stroke-dasharray="175.92" stroke-dashoffset="${status === 'approved' ? 0 : 175.92}"/>
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <i class="fas fa-${status === 'approved' ? 'check' : status === 'pending' ? 'clock' : status === 'rejected' ? 'times' : 'play'} text-white text-lg"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Botão de ação -->
                ${actionButton}
                
                <!-- Feedback section -->
                ${feedbackSection}
            </div>
            
            <!-- Efeito hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
        `;

        return card;
    },

    // Versão avançada da função de dificuldade com mais detalhes visuais
    getDifficultyAdvanced(xp) {
        if (xp <= 50) {
            return {
                text: "INICIANTE",
                color: "text-green-400",
                bg: "bg-green-900/30",
                textColor: "text-green-300",
                gradient: "from-green-900/80 via-emerald-800/60 to-green-700/40",
                gradientAction: "from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600",
                border: "border-green-400/50",
                glowBorder: "border-green-400",
                iconGradient: "from-green-500 to-emerald-600",
                circleColor: "text-green-400"
            };
        } else if (xp <= 100) {
            return {
                text: "INTERMEDIÁRIO",
                color: "text-yellow-400",
                bg: "bg-yellow-900/30",
                textColor: "text-yellow-300",
                gradient: "from-yellow-900/80 via-amber-800/60 to-orange-700/40",
                gradientAction: "from-yellow-600 to-orange-700 hover:from-yellow-500 hover:to-orange-600",
                border: "border-yellow-400/50",
                glowBorder: "border-yellow-400",
                iconGradient: "from-yellow-500 to-amber-600",
                circleColor: "text-yellow-400"
            };
        } else if (xp <= 200) {
            return {
                text: "AVANÇADO",
                color: "text-orange-400",
                bg: "bg-orange-900/30",
                textColor: "text-orange-300",
                gradient: "from-orange-900/80 via-red-800/60 to-pink-700/40",
                gradientAction: "from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600",
                border: "border-orange-400/50",
                glowBorder: "border-orange-400",
                iconGradient: "from-orange-500 to-red-600",
                circleColor: "text-orange-400"
            };
        } else {
            return {
                text: "ÉPICO",
                color: "text-purple-400",
                bg: "bg-purple-900/30",
                textColor: "text-purple-300",
                gradient: "from-purple-900/80 via-violet-800/60 to-indigo-700/40",
                gradientAction: "from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600",
                border: "border-purple-400/50",
                glowBorder: "border-purple-400",
                iconGradient: "from-purple-500 to-indigo-600",
                circleColor: "text-purple-400"
            };
        }
    },

    // Função para determinar ícone da classe
    getClassIcon(targetClass) {
        if (!targetClass) return "fas fa-code";

        const classLower = targetClass.toLowerCase();

        if (classLower.includes("javascript") || classLower.includes("arqueiro")) return "fab fa-js-square";
        if (classLower.includes("css") || classLower.includes("mago do css")) return "fas fa-palette";
        if (classLower.includes("python")) return "fab fa-python";
        if (classLower.includes("backend") || classLower.includes("bárbaro")) return "fas fa-server";
        if (classLower.includes("frontend")) return "fas fa-desktop";
        if (classLower.includes("database") || classLower.includes("dados") || classLower.includes("guardian")) return "fas fa-database";
        if (classLower.includes("mobile") || classLower.includes("nomade")) return "fas fa-mobile-alt";
        if (classLower.includes("devops") || classLower.includes("nuvens") || classLower.includes("mestre devops")) return "fas fa-cloud";
        if (classLower.includes("ui") || classLower.includes("design") || classLower.includes("artífice")) return "fas fa-paint-brush";
        if (classLower.includes("lendário") || classLower.includes("épico")) return "fas fa-crown";
        if (classLower.includes("react") || classLower.includes("vue") || classLower.includes("angular")) return "fab fa-react";

        return "fas fa-code";
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
        console.log("🚀 Data.loadMissions iniciado");
        console.log("Carregando missões...");

        try {
            // Verificar se o container existe
            const container = document.getElementById("missions");
            if (!container) {
                console.error("❌ Container 'missions' não encontrado!");
                Toast.show("Erro: Container de missões não encontrado", "error");
                return;
            }

            console.log("✅ Container 'missions' encontrado, fazendo requisição...");

            const data = await this.fetchData(
                "/missoes",
                "missions",
                null,
                "Erro ao carregar missões"
            );

            console.log("📦 Dados recebidos da API:", data);

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

        // ===== CONFIGURAÇÃO DAS TABS =====
        this.setupTabs();

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
            themeToggle.addEventListener("click", function (e) {
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
                    themeToggleDelayed.addEventListener("click", function (e) {
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
    },

    setupTabs() {
        console.log("🔧 Configurando sistema de tabs...");

        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('Tabs encontradas:', tabButtons.length, 'Conteúdos:', tabContents.length);

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = button.id === 'tab-missions' ? 'missions-tab' : 'history-tab';
                console.log('Tab clicada:', button.id, 'Target:', targetId);

                // Remover active de todos os botões
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                    btn.classList.add('text-gray-500', 'border-transparent');
                });

                // Adicionar active no botão clicado
                button.classList.add('active', 'text-blue-600', 'border-blue-600');
                button.classList.remove('text-gray-500', 'border-transparent');

                // Ocultar todos os conteúdos
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });

                // Mostrar conteúdo alvo
                const targetContent = document.getElementById(targetId);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                    console.log('Tab ativada:', targetId);

                    // Se for a tab de missões, recarregar se necessário
                    if (targetId === 'missions-tab') {
                        const missionsContainer = document.getElementById('missions');
                        if (missionsContainer && missionsContainer.children.length <= 1) {
                            console.log('🔄 Recarregando missões na aba...');
                            Data.loadMissions();
                        }
                    }
                } else {
                    console.error('❌ Conteúdo da tab não encontrado:', targetId);
                }
            });
        });

        // Garantir que a tab de missões está ativa por padrão
        const missionsTab = document.getElementById('tab-missions');
        const missionsContent = document.getElementById('missions-tab');

        if (missionsTab && missionsContent) {
            missionsTab.classList.add('active', 'text-blue-600', 'border-blue-600');
            missionsContent.classList.remove('hidden');
            console.log('✅ Tab de missões ativada por padrão');
        }

        console.log("✅ Sistema de tabs configurado");
    },
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
