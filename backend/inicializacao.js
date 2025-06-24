const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// Caminhos absolutos para os arquivos JSON
const caminhoUsers = path.join(__dirname, '..', 'frontend', 'jsons', 'users.json');
const caminhoMissions = path.join(__dirname, '..', 'frontend', 'jsons', 'missions.json');
const caminhoSubmissions = path.join(__dirname, '..', 'frontend', 'jsons', 'submissions.json');

let users = [];
let missions = [];
let submissions = [];
let userIdCounter = { value: 1 };
let missionIdCounter = { value: 1 };
let submissionIdCounter = { value: 1 };

// Carregar dados persistentes
async function carregarDados() {
  try {
    if (await fs.access(caminhoUsers).then(() => true).catch(() => false)) {
      users = JSON.parse(await fs.readFile(caminhoUsers));
      userIdCounter.value = Math.max(...users.map(u => u.id), 0) + 1;
    }
    if (await fs.access(caminhoMissions).then(() => true).catch(() => false)) {
      missions = JSON.parse(await fs.readFile(caminhoMissions));
      missionIdCounter.value = Math.max(...missions.map(m => m.id), 0) + 1;
    }
    if (await fs.access(caminhoSubmissions).then(() => true).catch(() => false)) {
      submissions = JSON.parse(await fs.readFile(caminhoSubmissions));
      submissionIdCounter.value = Math.max(...submissions.map(s => s.id), 0) + 1;
    }
  } catch (err) {
    console.error('Erro ao carregar dados persistentes:', err);
  }

  // Mestre Fullstack padrão
  if (!users.find(u => u.username === 'mestre')) {
    const hashedPassword = await bcrypt.hash('fullstack123', 10);
    users.push({
      id: userIdCounter.value++,
      username: 'mestre',
      password: hashedPassword,
      class: 'Mestre Fullstack',
      isMaster: true,
      level: 1,
      xp: 0,
      pending: false
    });
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
  }
}

carregarDados();

module.exports = {
  users,
  missions,
  submissions,
  userIdCounter,
  missionIdCounter,
  submissionIdCounter
};
