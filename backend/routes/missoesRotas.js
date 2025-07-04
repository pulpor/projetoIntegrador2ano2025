const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Caminho correto para o arquivo missions.json
const caminhoMissions = path.join(__dirname, '..', '..', 'frontend', 'jsons', 'missions.json');


const { autenticar, ehMestre } = require('../middlewares/autenticacao');

const { missions, missionIdCounter, users } = require('../inicializacao');


router.get('/', autenticar, (req, res) => {
  console.log('Acessando /missoes:', { user: req.user });

  // Se for mestre, retorna todas as missões
  if (req.user.isMaster) {
    res.json(missions);
    return;
  }

  // Para alunos, filtrar por ano e classe
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const filteredMissions = missions.filter(mission => {
    // Missões gerais (sem ano específico) são visíveis para todos
    if (!mission.targetYear) {
      return mission.targetClass === 'geral' || mission.targetClass === user.class;
    }

    // Missões específicas por ano
    if (mission.targetYear !== user.year) {
      return false;
    }

    // Verificar classe dentro do ano
    return mission.targetClass === 'geral' || mission.targetClass === user.class;
  });

  console.log(`Missões filtradas para ${user.username} (Ano: ${user.year}, Classe: ${user.class}):`, filteredMissions.length);
  res.json(filteredMissions);
});

router.post('/', autenticar, ehMestre, async (req, res) => {
  const { titulo, descricao, xp, targetYear, targetClass } = req.body;
  console.log('Criando missão:', { titulo, descricao, xp, targetYear, targetClass, user: req.user });
  if (!titulo || !descricao || !xp || !targetClass) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const mission = {
    id: missionIdCounter.value++,
    title: titulo,
    description: descricao,
    xp: parseInt(xp),
    targetYear: targetYear ? parseInt(targetYear) : null,
    targetClass: targetClass
  };

  missions.push(mission);
  try {
    await fs.writeFile(caminhoMissions, JSON.stringify(missions, null, 2));
    console.log('missions.json salvo com sucesso:', mission);
    res.json(mission);
  } catch (err) {
    console.error('Erro ao salvar missions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar missão
router.put('/:id', autenticar, ehMestre, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, xp, targetYear, targetClass } = req.body;
  console.log('Atualizando missão:', { id, titulo, descricao, xp, targetYear, targetClass, user: req.user });

  if (!titulo || !descricao || !xp || !targetClass) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  const missionIndex = missions.findIndex(m => m.id === parseInt(id));
  if (missionIndex === -1) {
    return res.status(404).json({ error: 'Missão não encontrada' });
  }

  missions[missionIndex] = {
    ...missions[missionIndex],
    title: titulo,
    description: descricao,
    xp: parseInt(xp),
    targetYear: targetYear ? parseInt(targetYear) : null,
    targetClass: targetClass
  };

  try {
    await fs.writeFile(caminhoMissions, JSON.stringify(missions, null, 2));
    console.log('Missão atualizada com sucesso:', missions[missionIndex]);
    res.json(missions[missionIndex]);
  } catch (err) {
    console.error('Erro ao salvar missions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para excluir missão
router.delete('/:id', autenticar, ehMestre, async (req, res) => {
  const { id } = req.params;
  console.log('Excluindo missão:', { id, user: req.user });

  const missionIndex = missions.findIndex(m => m.id === parseInt(id));
  if (missionIndex === -1) {
    return res.status(404).json({ error: 'Missão não encontrada' });
  }

  const deletedMission = missions.splice(missionIndex, 1)[0];

  try {
    await fs.writeFile(caminhoMissions, JSON.stringify(missions, null, 2));
    console.log('Missão excluída com sucesso:', deletedMission);
    res.json({ message: 'Missão excluída com sucesso', mission: deletedMission });
  } catch (err) {
    console.error('Erro ao salvar missions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;