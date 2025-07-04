const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const { updateUserLevel } = require('./utils/levelSystem');

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
      const dadosUsuarios = JSON.parse(await fs.readFile(caminhoUsers));
      users.length = 0; // Limpa a array mantendo a referência
      users.push(...dadosUsuarios); // Adiciona os dados carregados
      userIdCounter.value = Math.max(...users.map(u => u.id), 0) + 1;

      // Atualizar níveis de todos os usuários usando o novo sistema
      let needsUpdate = false;
      users.forEach(user => {
        const oldLevel = user.level;
        updateUserLevel(user);
        if (oldLevel !== user.level) {
          needsUpdate = true;
          console.log(`[INIT] Usuário ${user.username}: nível atualizado de ${oldLevel} para ${user.level} (XP: ${user.xp})`);
        }
      });

      // Salvar se houve atualizações
      if (needsUpdate) {
        await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
        console.log('[INIT] Níveis de usuários atualizados e salvos');
      }

      console.log(`[INIT] ${users.length} usuários carregados`);
    }
    if (await fs.access(caminhoMissions).then(() => true).catch(() => false)) {
      const dadosMissoes = JSON.parse(await fs.readFile(caminhoMissions));
      missions.length = 0;
      missions.push(...dadosMissoes);
      missionIdCounter.value = Math.max(...missions.map(m => m.id), 0) + 1;
      console.log(`[INIT] ${missions.length} missões carregadas`);
    }
    if (await fs.access(caminhoSubmissions).then(() => true).catch(() => false)) {
      const dadosSubmissoes = JSON.parse(await fs.readFile(caminhoSubmissions));
      submissions.length = 0;
      submissions.push(...dadosSubmissoes);
      submissionIdCounter.value = Math.max(...submissions.map(s => s.id), 0) + 1;
      console.log(`[INIT] ${submissions.length} submissões carregadas`);
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
