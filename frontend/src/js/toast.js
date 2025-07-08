// Sistema de notificações Toast reutilizável
export const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.id = "toast-container";
            this.container.className = "fixed top-4 right-4 z-[9999] space-y-2";
            document.body.appendChild(this.container);
        }
    },

    show(message, type = "info", duration = 3000) {
        this.init();

        const config = {
            success: {
                class: "bg-green-500",
                icon: "fas fa-check-circle"
            },
            error: {
                class: "bg-red-500",
                icon: "fas fa-exclamation-circle"
            },
            warning: {
                class: "bg-yellow-500",
                icon: "fas fa-exclamation-triangle"
            },
            info: {
                class: "bg-blue-500",
                icon: "fas fa-info-circle"
            }
        }[type] || {
            class: "bg-gray-500",
            icon: "fas fa-bell"
        };

        const toast = document.createElement("div");
        toast.className = `${config.class} text-white px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0 flex items-center space-x-2 min-w-[300px]`;
        toast.innerHTML = `
            <i class="${config.icon}"></i>
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.remove("translate-x-full", "opacity-0");
        }, 10);

        // Auto remover após duração
        setTimeout(() => {
            toast.classList.add("translate-x-full", "opacity-0");
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    success(message, duration = 3000) {
        this.show(message, "success", duration);
    },

    error(message, duration = 4000) {
        this.show(message, "error", duration);
    },

    warning(message, duration = 3500) {
        this.show(message, "warning", duration);
    },

    info(message, duration = 3000) {
        this.show(message, "info", duration);
    }
};
