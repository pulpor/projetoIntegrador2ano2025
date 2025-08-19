import { showToast } from './utils/toast.js';

// --- ÁREAS E CLASSES ---
export const areasClasses = {
  beleza: { name: "👒 Beleza", classes: { "Estilista das Sombras": {}, "Feiticeira das Unhas": {}, "Encantador de Cores": {}, "Artista das Luzes": {}, "Cortes Fantasma": {}, "Guardiã das Flores": {}, "Alquimista do Perfume": {}, "Mestre do Reflexo": {} } },
  gastronomia: { name: "👨‍🍳 Gastronomia", classes: { "Cozinheiro Arcano": {}, "Alquimista dos Sabores": {}, "Guardiã do Forno": {}, "Mestre das Caldeiradas": {}, "Confeiteiro Místico": {}, "Senhor dos Temperos": {}, "Sommelier Sagrado": {}, "Druida da Nutrição": {} } },
  gestao: { name: "👩‍🎓 Gestão", classes: { "Senhor dos Números": {}, "Administrador da Ordem": {}, "Analista Visionário": {}, "Estrategista de Elite": {}, "Protetor do Equilíbrio": {}, "Mediador das Alianças": {}, "Juiz da Justiça": {}, "Cronista do Progresso": {} } },
  oftalmo: { name: "👁️ Oftalmologia", classes: { "Vidente da Visão": {}, "Guardiã do Olhar": {}, "Caçador de Detalhes": {}, "Mestre da Clareza": {}, "Sentinela Invisível": {}, "Oráculo das Lentes": {}, "Defensor da Retina": {}, "Ilusionista da Percepção": {} } },
  tecnologia: { name: "🖥️ Tecnologia", classes: { "Arqueiro do JavaScript": {}, "Cafeicultor do Java": {}, "Mago do CSS": {}, "Paladino do HTML": {}, "Bárbaro do Back-end": {}, "Domador de Dados": {}, "Elfo do Front-end": {}, "Caçador de Bugs": {} } },
  idiomas: { name: "🌐 Idiomas", classes: { "Orador das Runas": {}, "Tradutor das Sombras": {}, "Bardo Poliglota": {}, "Sábio dos Dialetos": {}, "Emissário Universal": {}, "Guardião da Palavra": {}, "Feiticeiro da Pronúncia": {}, "Lexicógrafo Arcano": {} } }
};

// --- LIBERAR CLASSES CONFORME CURSO ---
export function setupCursoClasse() {
  const cursoSelect = document.getElementById('curso-select');
  const classSelect = document.getElementById('class-select');
  cursoSelect.addEventListener('change', function() {
    const area = cursoSelect.value;
    classSelect.innerHTML = '';
    if (!area || !areasClasses[area]) {
      classSelect.innerHTML = '<option value="">Escolha o curso primeiro</option>';
      classSelect.disabled = true;
      return;
    }
    classSelect.disabled = false;
    classSelect.innerHTML = '<option value="">Escolha sua classe RPG</option>';
    Object.keys(areasClasses[area].classes).forEach(classe => {
      classSelect.innerHTML += `<option value="${classe}">${classe}</option>`;
    });
  });
}
if (document.getElementById('curso-select') && document.getElementById('class-select')) {
  setupCursoClasse();
}

// --- LOGIN/CADASTRO ENHANCED ---
function initializeEnhancedForms() {
  setupInputEffects();
  setupButtonAnimations();
  setupFormTransitions();
  setupEnhancedValidation();
  setupEasterEggs();
}
document.addEventListener('DOMContentLoaded', function () {
  initializeEnhancedForms();
});
function setupInputEffects() {
  // Desabilitado para evitar conflitos
}
function setupButtonAnimations() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-2px) scale(1.02)';
      this.style.transition = 'all 0.3s ease';
    });
    button.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
    button.addEventListener('mousedown', function () {
      this.style.transform = 'translateY(0) scale(0.98)';
    });
    button.addEventListener('mouseup', function () {
      this.style.transform = 'translateY(-2px) scale(1.02)';
    });
  });
}
function setupFormTransitions() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  function animateFormEntry(form) {
    if (form) {
      form.style.opacity = '0';
      form.style.transform = 'translateY(20px)';
      setTimeout(() => {
        form.style.transition = 'all 0.5s ease';
        form.style.opacity = '1';
        form.style.transform = 'translateY(0)';
      }, 50);
    }
  }
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.id === 'register-form' && !target.classList.contains('hidden')) {
          animateFormEntry(target);
          clearRegistrationForm();
        }
      }
    });
  });
  if (registerForm) {
    observer.observe(registerForm, { attributes: true });
  }
}
function clearRegistrationForm() {
  const fields = [
    'reg-username',
    'reg-fullname',
    'reg-password',
    'curso-select',
    'class-select'
  ];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = '';
      field.classList.remove('has-content');
    }
  });
  const feedbacks = ['username-feedback', 'fullname-feedback', 'password-feedback', 'password-strength'];
  feedbacks.forEach(feedbackId => {
    const feedback = document.getElementById(feedbackId);
    if (feedback) {
      feedback.classList.add('hidden');
    }
  });
  updateRegisterButtonState(); // Garante que o botão seja desabilitado após limpar
}
function setupEnhancedValidation() {
  // Validação visual removida
}
function setupEasterEggs() {
  let clickCount = 0;
  const logo = document.querySelector('.logo, h1');
  if (logo) {
    logo.addEventListener('click', function () {
      clickCount++;
      if (clickCount === 5) {
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
          document.body.style.filter = 'none';
        }, 2000);
        clickCount = 0;
      }
    });
  }
  document.addEventListener('click', function (e) {
    createClickParticle(e.clientX, e.clientY);
  });
}
function createClickParticle(x, y) {
  const particle = document.createElement('div');
  particle.style.position = 'fixed';
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.width = '6px';
  particle.style.height = '6px';
  particle.style.background = '#667eea';
  particle.style.borderRadius = '50%';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  particle.style.transition = 'all 0.5s ease-out';
  document.body.appendChild(particle);
  setTimeout(() => {
    particle.style.transform = 'translateY(-20px) scale(0)';
    particle.style.opacity = '0';
  }, 10);
  setTimeout(() => {
    document.body.removeChild(particle);
  }, 500);
}
const style = document.createElement('style');
style.textContent = `
    .has-content {
        background: rgba(255, 255, 255, 0.95) !important;
    }
`;
document.head.appendChild(style);

// Adicione este bloco de estilo para garantir a cor verde em qualquer tema
const passwordBarStyle = document.createElement('style');
passwordBarStyle.textContent = `
  .password-bar.active {
    background: #22c55e !important;
  }
`;
document.head.appendChild(passwordBarStyle);

// --- REGISTRO ---
function validateUsername(username) {
  return username.length >= 5;
}

function validatePassword(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(password)
  };
}

function showUsernameFeedback() {
  const username = document.getElementById('reg-username').value.trim();
  const feedback = document.getElementById('username-feedback');
  if (username.length === 0) {
    feedback.textContent = '';
    feedback.classList.add('hidden');
    feedback.classList.remove('text-red-500');
    return;
  }
  if (!validateUsername(username)) {
    feedback.textContent = 'Faltam: pelo menos 5 caracteres';
    feedback.classList.remove('hidden');
    feedback.classList.add('text-red-500');
  } else {
    feedback.textContent = '';
    feedback.classList.add('hidden');
    feedback.classList.remove('text-red-500');
  }
}

function showPasswordFeedback() {
  const password = document.getElementById('reg-password').value;
  const feedback = document.getElementById('password-feedback');
  const strengthDiv = document.getElementById('password-strength');
  const strengthText = document.getElementById('password-strength-text');
  const bars = strengthDiv ? strengthDiv.querySelectorAll('.password-bar') : [];
  const result = validatePassword(password);

  let validCount = Object.values(result).filter(Boolean).length;
  let allValid = validCount === 5;

  // Só mostra feedback se o usuário começou a digitar
  if (password.length === 0) {
    feedback.textContent = '';
    feedback.classList.add('hidden');
    feedback.classList.remove('text-red-500');
    if (strengthDiv) {
      strengthDiv.classList.add('hidden');
      // Reset barras
      bars.forEach(bar => {
        bar.style.background = '#e5e7eb';
      });
    }
    return;
  }

  // Sempre mostra a barrinha se há input
  if (strengthDiv) strengthDiv.classList.remove('hidden');

  feedback.innerHTML = '';
  if (!allValid) {
    feedback.innerHTML = '<span class="text-yellow-600"><i class="fas fa-exclamation-triangle"></i> Senha deve atender todos os critérios:</span>';
    feedback.classList.remove('hidden');
    feedback.classList.add('text-red-500');
  } else {
    feedback.textContent = '';
    feedback.classList.add('hidden');
    feedback.classList.remove('text-red-500');
  }

  // Critérios
  let criteria = [
    { label: 'Pelo menos 8 caracteres', valid: result.length },
    { label: 'Uma letra maiúscula (A-Z)', valid: result.uppercase },
    { label: 'Uma letra minúscula (a-z)', valid: result.lowercase },
    { label: 'Um número (0-9)', valid: result.number },
    { label: 'Um símbolo (!@#$%^&* etc.)', valid: result.symbol }
  ];
  let html = '<div class="text-xs p-2 rounded bg-white border mt-2">';
  criteria.forEach(c => {
    html += `<div class="flex items-center gap-2 mb-1">
      <span class="${c.valid ? 'text-green-600' : 'text-red-500'}">
        <i class="fas fa-${c.valid ? 'check' : 'times'}"></i>
      </span>
      ${c.label}
    </div>`;
  });
  html += '</div>';
  strengthText.innerHTML = html;

  // Barras de força
  bars.forEach((bar, i) => {
    if (i < validCount) {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
      bar.style.background = '#e5e7eb';
    }
  });
}

function validateRegisterFields() {
  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const password = document.getElementById('reg-password').value;
  const curso = document.getElementById('curso-select').value;
  const classe = document.getElementById('class-select').value;

  // Verifique se todos os campos realmente têm valor
  if (!username || !fullname || !password || !curso || !classe) {
    return false;
  }

  // Validação de username e senha
  const usernameValid = validateUsername(username);
  const passwordValid = Object.values(validatePassword(password)).every(Boolean);

  return usernameValid && passwordValid;
}

function updateRegisterButtonState() {
  const btn = document.getElementById('registerSubmitButton');
  if (btn) {
    btn.disabled = !validateRegisterFields();
    btn.classList.toggle('opacity-50', btn.disabled);
    btn.classList.toggle('cursor-not-allowed', btn.disabled);
  }
}

// Eventos para feedback dinâmico
document.getElementById('reg-username').addEventListener('input', () => {
  showUsernameFeedback();
  updateRegisterButtonState();
});
document.getElementById('reg-password').addEventListener('input', () => {
  showPasswordFeedback();
  updateRegisterButtonState();
});
['reg-fullname', 'curso-select', 'class-select'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateRegisterButtonState);
    el.addEventListener('change', updateRegisterButtonState);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  showUsernameFeedback();
  showPasswordFeedback();
  updateRegisterButtonState();
});

function getMasterForArea(area) {
  // Mapeamento dos mestres por área
  const masters = {
    beleza: 'beleza',
    gastronomia: 'gastro',
    gestao: 'gestao',
    oftalmo: 'oftalmo',
    tecnologia: 'tecno',
    idiomas: 'idioma'
  };
  return masters[area] || null;
}

async function handleRegister() {
  if (!validateRegisterFields()) {
    showToast('Preencha todos os campos corretamente!', 'error');
    return;
  }
  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const password = document.getElementById('reg-password').value;
  const curso = document.getElementById('curso-select').value; // Certifique-se que o id está correto!
  const classe = document.getElementById('class-select').value;
  const masterArea = getMasterForArea(curso);

  // Adicione log para depuração no frontend
  console.log("[REGISTER FRONT] Dados enviados:", { username, fullname, password, curso, classe, masterArea });

  try {
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        fullname,
        password,
        curso, // Certifique-se que está sendo enviado!
        class: classe,
        pending: true,
        masterArea,
        isMaster: false
      })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      showToast(data.message || data.error || `Erro ${res.status}: ${res.statusText}`, 'error');
      return;
    }

    if (data.success) {
      showToast('Conta criada! Aguarde aprovação do mestre da área.', 'success');
      clearRegistrationForm();
      updateRegisterButtonState();
    } else {
      showToast(data.message || 'Erro ao criar conta.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão com o servidor.', 'error');
  }
}

// Adiciona o event listener ao botão de cadastro
document.addEventListener('DOMContentLoaded', function () {
  // ...existing code...
  const registerBtn = document.getElementById('registerSubmitButton');
  if (registerBtn) {
    registerBtn.addEventListener('click', function (e) {
      e.preventDefault();
      handleRegister();
    });
  }
});