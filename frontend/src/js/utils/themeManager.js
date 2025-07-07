/**
 * Theme Manager - Controla dark/light mode
 * Gerencia a alternância entre temas e persiste a preferência do usuário
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.storageKey = 'rpg-learning-theme';
    this.init();
  }

  /**
   * Inicializa o gerenciador de temas
   */
  init() {
    // Carrega tema salvo ou detecta preferência do sistema
    this.loadSavedTheme();

    // Aplica o tema inicial
    this.applyTheme(this.currentTheme);

    // Cria o botão de toggle
    this.createThemeToggle();

    // Escuta mudanças na preferência do sistema
    this.listenToSystemTheme();

    console.log(`[THEME] Theme Manager initialized with ${this.currentTheme} theme`);
  }

  /**
   * Carrega o tema salvo do localStorage ou detecta preferência do sistema
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme;
    } else {
      // Detecta preferência do sistema
      this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }

  /**
   * Aplica o tema especificado
   * @param {string} theme - 'light' ou 'dark'
   */
  applyTheme(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      html.removeAttribute('data-theme');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    this.currentTheme = theme;
    this.saveTheme(theme);
    this.updateToggleButton();

    // Dispara evento personalizado para outros componentes
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme }
    }));
  }

  /**
   * Alterna entre light e dark theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);

    console.log(`[THEME] Theme switched to ${newTheme}`);

    // Feedback visual
    this.showThemeChangeNotification(newTheme);
  }

  /**
   * Salva o tema no localStorage
   * @param {string} theme - Tema a ser salvo
   */
  saveTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
  }

  /**
   * Cria o botão de toggle do tema
   */
  createThemeToggle() {
    // Remove botão existente se houver
    const existingToggle = document.querySelector('.theme-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('title', 'Alternar tema');
    toggleButton.setAttribute('aria-label', 'Alternar entre tema claro e escuro');

    toggleButton.innerHTML = `
      <span class="light-icon">🌙</span>
      <span class="dark-icon">☀️</span>
    `;

    toggleButton.addEventListener('click', () => this.toggleTheme());

    // Adiciona o botão ao body
    document.body.appendChild(toggleButton);

    this.updateToggleButton();
  }

  /**
   * Atualiza o estado visual do botão de toggle
   */
  updateToggleButton() {
    const toggleButton = document.querySelector('.theme-toggle');
    if (toggleButton) {
      const title = this.currentTheme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
      toggleButton.setAttribute('title', title);
      toggleButton.setAttribute('aria-label', title);
    }
  }

  /**
   * Escuta mudanças na preferência de tema do sistema
   */
  listenToSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      // Só muda automaticamente se o usuário não tiver definido uma preferência manual
      const hasManualPreference = localStorage.getItem(this.storageKey);

      if (!hasManualPreference) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
        console.log(`[THEME] System theme changed to ${systemTheme}`);
      }
    });
  }

  /**
   * Mostra notificação de mudança de tema
   * @param {string} theme - Novo tema aplicado
   */
  showThemeChangeNotification(theme) {
    // Remove notificação existente
    const existingNotification = document.querySelector('.theme-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px var(--shadow-color);
      z-index: 1001;
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    const themeIcon = theme === 'dark' ? '🌙' : '☀️';
    const themeName = theme === 'dark' ? 'Tema Escuro' : 'Tema Claro';
    notification.innerHTML = `${themeIcon} ${themeName} ativado`;

    document.body.appendChild(notification);

    // Anima entrada
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove após 3 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 3000);
  }

  /**
   * Obtém o tema atual
   * @returns {string} Tema atual ('light' ou 'dark')
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Define o tema programaticamente
   * @param {string} theme - 'light' ou 'dark'
   */
  setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      this.applyTheme(theme);
    } else {
      console.warn(`[THEME] Invalid theme: ${theme}. Use 'light' or 'dark'.`);
    }
  }

  /**
   * Reseta para a preferência do sistema
   */
  resetToSystemPreference() {
    localStorage.removeItem(this.storageKey);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.applyTheme(systemTheme);
    console.log(`[THEME] Reset to system preference: ${systemTheme}`);
  }
}

// Instância global do gerenciador de temas
let themeManager;

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
  });
} else {
  themeManager = new ThemeManager();
}

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

// Torna disponível globalmente
window.ThemeManager = ThemeManager;
window.themeManager = themeManager;

console.log('[THEME] Theme manager loaded successfully');
