
      // Função para alternar tema (global)
      function toggleTheme() {
        const html = document.documentElement;
        const icon = document.getElementById("theme-icon");
        const currentTheme = html.getAttribute("data-theme") || "light";

        console.log("Tema atual:", currentTheme);

        if (currentTheme === "dark") {
          // Estava no escuro, vai para claro -> mostra lua elegante
          html.setAttribute("data-theme", "light");
          icon.className = "fas fa-moon theme-icon-moon";
          localStorage.setItem("theme", "light");
          console.log("Mudou para light mode");
        } else {
          // Estava no claro, vai para escuro -> mostra sol brilhante
          html.setAttribute("data-theme", "dark");
          icon.className = "fas fa-sun theme-icon-sun";
          localStorage.setItem("theme", "dark");
          console.log("Mudou para dark mode");
        }
      }

      // Initialize theme on page load
      function initTheme() {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

        console.log("Inicializando tema:", initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);

        const themeIcon = document.getElementById("theme-icon");
        if (themeIcon) {
          // Se está no dark mode, mostra sol dourado (para ir pro claro)
          // Se está no light mode, mostra lua prateada (para ir pro escuro)
          if (initialTheme === "dark") {
            themeIcon.className = "fas fa-sun theme-icon-sun";
          } else {
            themeIcon.className = "fas fa-moon theme-icon-moon";
          }
        }
      }

      // Carregar tema salvo ao inicializar
      document.addEventListener("DOMContentLoaded", function () {
        initTheme();

        // Aplicar posicionamento absoluto e matemático aos ícones
        function posicionarIconesPerfeito() {
          const allIcons = document.querySelectorAll(
            "#login-screen .input-icon, .input-group .input-icon"
          );
          allIcons.forEach((icon) => {
            // Força posicionamento matemático - sem porcentagens
            icon.style.setProperty("position", "absolute", "important");
            icon.style.setProperty("left", "18px", "important");
            icon.style.setProperty("top", "26px", "important"); // Exatamente no centro de 52px
            icon.style.setProperty(
              "transform",
              "translateY(-50%)",
              "important"
            );
            icon.style.setProperty("color", "#6b7280", "important");
            icon.style.setProperty("font-size", "16px", "important");
            icon.style.setProperty("width", "16px", "important");
            icon.style.setProperty("height", "16px", "important");
            icon.style.setProperty("display", "flex", "important");
            icon.style.setProperty("align-items", "center", "important");
            icon.style.setProperty("justify-content", "center", "important");
            icon.style.setProperty("pointer-events", "none", "important");
            icon.style.setProperty("z-index", "1000", "important");
            icon.style.setProperty(
              "transition",
              "color 0.3s ease",
              "important"
            );
            icon.style.setProperty("line-height", "1", "important");
            icon.style.setProperty("margin", "0", "important");
            icon.style.setProperty("padding", "0", "important");
          });
        }

        // Garantir altura fixa dos inputs
        function garantirAlturaInputs() {
          const allInputs = document.querySelectorAll(
            "#login-screen .input-field, .input-group .input-field"
          );
          allInputs.forEach((input) => {
            input.style.setProperty("height", "52px", "important");
            input.style.setProperty("line-height", "20px", "important");
            input.style.setProperty(
              "padding",
              "16px 16px 16px 52px",
              "important"
            );
            input.style.setProperty("box-sizing", "border-box", "important");
            input.style.setProperty("transform", "none", "important");
          });
        }

        // Aplicar posicionamento inicial
        posicionarIconesPerfeito();
        garantirAlturaInputs();

        // Reforçar posicionamento em todos os eventos
        const allInputs = document.querySelectorAll(
          "#login-screen .input-field, .input-group .input-field"
        );
        allInputs.forEach((input) => {
          input.addEventListener("focus", function () {
            // Manter altura no foco
            this.style.setProperty("height", "52px", "important");
            this.style.setProperty("line-height", "20px", "important");
            this.style.setProperty(
              "padding",
              "16px 16px 16px 52px",
              "important"
            );
            this.style.setProperty("transform", "none", "important");

            // Reposicionar ícone e trocar cor
            const icon = this.nextElementSibling;
            if (icon && icon.classList.contains("input-icon")) {
              icon.style.setProperty("color", "#667eea", "important");
              icon.style.setProperty("position", "absolute", "important");
              icon.style.setProperty("left", "18px", "important");
              icon.style.setProperty("top", "26px", "important");
              icon.style.setProperty(
                "transform",
                "translateY(-50%)",
                "important"
              );
              icon.style.setProperty("z-index", "1000", "important");
            }
          });

          input.addEventListener("blur", function () {
            // Manter altura no blur
            this.style.setProperty("height", "52px", "important");
            this.style.setProperty("line-height", "20px", "important");
            this.style.setProperty(
              "padding",
              "16px 16px 16px 52px",
              "important"
            );
            this.style.setProperty("transform", "none", "important");

            // Reposicionar ícone e voltar cor
            const icon = this.nextElementSibling;
            if (icon && icon.classList.contains("input-icon")) {
              icon.style.setProperty("color", "#6b7280", "important");
              icon.style.setProperty("position", "absolute", "important");
              icon.style.setProperty("left", "18px", "important");
              icon.style.setProperty("top", "26px", "important");
              icon.style.setProperty(
                "transform",
                "translateY(-50%)",
                "important"
              );
              icon.style.setProperty("z-index", "1000", "important");
            }
          });

          // CRÍTICO: Manter posicionamento durante digitação
          input.addEventListener("input", function () {
            // Garantir que o input mantenha altura
            this.style.setProperty("height", "52px", "important");
            this.style.setProperty("line-height", "20px", "important");
            this.style.setProperty(
              "padding",
              "16px 16px 16px 52px",
              "important"
            );
            this.style.setProperty("transform", "none", "important");

            // Forçar reposicionamento do ícone
            const icon = this.nextElementSibling;
            if (icon && icon.classList.contains("input-icon")) {
              icon.style.setProperty("position", "absolute", "important");
              icon.style.setProperty("left", "18px", "important");
              icon.style.setProperty("top", "26px", "important");
              icon.style.setProperty(
                "transform",
                "translateY(-50%)",
                "important"
              );
              icon.style.setProperty("z-index", "1000", "important");
            }
          });

          // Reforçar a cada mudança de valor
          input.addEventListener("change", function () {
            posicionarIconesPerfeito();
            garantirAlturaInputs();
          });
        });

        // Observer para detectar mudanças dinâmicas no DOM
        const observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (
              mutation.type === "childList" ||
              mutation.type === "attributes"
            ) {
              setTimeout(() => {
                posicionarIconesPerfeito();
                garantirAlturaInputs();
              }, 10);
            }
          });
        });

        observer.observe(document.getElementById("login-screen"), {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });

        // Reforçar posicionamento periodicamente (failsafe)
        setInterval(() => {
          posicionarIconesPerfeito();
          garantirAlturaInputs();
        }, 1000);
      });
 
      import {
        login,
        showRegisterForm,
        hideRegisterForm,
        register,
        initializeValidationListeners,
      } from "./auth.js";

      document.getElementById("loginButton").addEventListener("click", login);
      document
        .getElementById("registerButton")
        .addEventListener("click", showRegisterForm);
      document
        .getElementById("backButton")
        .addEventListener("click", hideRegisterForm);
      document
        .getElementById("registerSubmitButton")
        .addEventListener("click", register);

      // Inicializar validações em tempo real
      initializeValidationListeners();

      // Adicionar funcionalidade de Enter para login
      document
        .getElementById("username")
        .addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            login();
          }
        });

      document
        .getElementById("password")
        .addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            login();
          }
        });

      // Adicionar funcionalidade de Enter para campos de registro
      document.querySelectorAll("#register-form input").forEach((input) => {
        input.addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            register();
          }
        });
      });