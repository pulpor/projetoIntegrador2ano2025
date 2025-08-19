const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Caminho correto para o arquivo missions.json
const caminhoMissions = path.join(__dirname, '../data/missions.json');

const { autenticar, ehMestre } = require('../middleware/auth');

const { missions, missionIdCounter, users, submissions } = require('../inicializacao');

// Middleware de log específico para missões
router.use((req, res, next) => {
  console.log(`[MISSOES] ${req.method} ${req.originalUrl}`, {
    body: req.body,
    headers: req.headers.authorization ? 'Token presente' : 'Sem token',
    user: req.user?.userId || 'Não autenticado'
  });
  next();
});

router.get('/all', autenticar, (req, res) => {
  console.log('Acessando /missoes/all:', { user: req.user });
  
  // Retorna todas as missões (usado para mostrar missões concluídas)
  res.json(missions);
});

router.get('/', autenticar, (req, res) => {
  console.log('Acessando /missoes:', { user: req.user });

  // Se for mestre, retorna todas as missões
  if (req.user.isMaster) {
    res.json(missions);
    return;
  }

  // Para alunos, filtrar por ano e classe, e remover missões já submetidas
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Buscar submissões do usuário que estão pendentes ou aprovadas
  const userSubmissions = submissions.filter(sub =>
    parseInt(sub.userId) === req.user.userId &&
    (sub.status === 'pending' || sub.status === 'approved')
  );

  const submittedMissionIds = new Set(userSubmissions.map(sub => parseInt(sub.missionId)));

  const filteredMissions = missions.filter(mission => {
    // Excluir missões já submetidas (pendentes ou aprovadas)
    if (submittedMissionIds.has(mission.id)) {
      return false;
    }

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
  try {
    const { titulo, descricao, xp, targetYear, targetClass } = req.body;
    console.log('[MISSOES] Criando missão:', { titulo, descricao, xp, targetYear, targetClass, user: req.user });

    // Validação mais robusta
    if (!titulo || titulo.trim() === '') {
      console.log('[MISSOES] Erro: título vazio');
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    if (!descricao || descricao.trim() === '') {
      console.log('[MISSOES] Erro: descrição vazia');
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    if (!xp || parseInt(xp) <= 0) {
      console.log('[MISSOES] Erro: XP inválido');
      return res.status(400).json({ error: 'XP deve ser maior que zero' });
    }

    if (!targetClass) {
      console.log('[MISSOES] Erro: classe alvo não especificada');
      return res.status(400).json({ error: 'Classe alvo é obrigatória' });
    }

    const mission = {
      id: missionIdCounter.value++,
      title: titulo.trim(),
      description: descricao.trim(),
      xp: parseInt(xp),
      targetYear: targetYear ? parseInt(targetYear) : null,
      targetClass: targetClass,
      status: 'ativa'
    };

    console.log('[MISSOES] Missão criada:', mission);
    missions.push(mission);

    console.log('[MISSOES] Salvando no arquivo...');
    await fs.writeFile(caminhoMissions, JSON.stringify(missions, null, 2));
    console.log('[MISSOES] ✅ missions.json salvo com sucesso');

    res.status(201).json(mission);
  } catch (err) {
    console.error('[MISSOES] ❌ Erro ao criar missão:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
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
    targetClass: targetClass,
    status: missions[missionIndex].status || 'ativa'
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