const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  loadStudentInfo();
  loadMissions();
  setupTabs();
});

async function loadStudentInfo() {
  document.getElementById('student-name').textContent = localStorage.getItem('username');
  document.getElementById('student-class').textContent = 'Carregando...';

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/usuarios/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (res.ok) {
    document.getElementById('student-class').textContent = data.class;
    document.getElementById('student-level').textContent = data.level;
    document.getElementById('current-xp').textContent = data.xp;
    document.getElementById('next-level-xp').textContent = 100;

    // barra de XP
    const porcentagem = (data.xp / 100) * 100;
    document.getElementById('xp-bar').style.width = `${porcentagem}%`;
  }
}

async function loadMissions() {
  const res = await fetch(`${API_URL}/missoes`);
  const data = await res.json();

  if (res.ok) {
    const missionsDiv = document.getElementById('missions');
    const select = document.getElementById('mission-select');

    missionsDiv.innerHTML = '';
    select.innerHTML = `<option value="">Selecione uma missão</option>`;

    data.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded shadow';
      card.innerHTML = `
        <h3 class="font-bold">${mission.title}</h3>
        <p>${mission.description}</p>
        <span class="text-sm text-gray-500">XP: ${mission.xp}</span>
      `;
      missionsDiv.appendChild(card);

      const opt = document.createElement('option');
      opt.value = mission.id;
      opt.textContent = mission.title;
      select.appendChild(opt);
    });
  }
}

async function submitCode() {
  const token = localStorage.getItem('token');
  const missionId = document.getElementById('mission-select').value;
  const files = document.getElementById('code-upload').files;

  const formData = new FormData();
  formData.append('missionId', missionId);
  for (const file of files) {
    formData.append('files', file);
  }

  const res = await fetch(`${API_URL}/submissoes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (res.ok) {
    alert('Código enviado com sucesso!');
  } else {
    alert('Erro ao enviar submissão.');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'border-b-2', 'text-blue-600'));
      contents.forEach(c => c.classList.add('hidden'));

      tab.classList.add('active', 'border-b-2', 'text-blue-600');
      contents[index].classList.remove('hidden');
    });
  });
}
