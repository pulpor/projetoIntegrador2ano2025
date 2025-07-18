const express = require('express');
const { autenticar, ehMestre } = require('../middleware/auth');
const { users, submissions } = require('../inicializacao');
const fs = require('fs').promises;
const path = require('path');
const { updateUserLevel, getLevelInfo } = require('../utils/levelSystem');
const router = express.Router();

// Caminho correto para o arquivo users.json
const caminhoUsers = path.join(__dirname, '../data/users.json');
const caminhoSubmissions = path.join(__dirname, '../data/submissions.json');

router.get('/students', autenticar, ehMestre, (req, res) => {
  res.json(users.filter(u => !u.isMaster));
});

router.get('/approved-students', autenticar, ehMestre, (req, res) => {
  console.log('[DEBUG BACKEND] Chamada para approved-students');
  const approvedStudents = users.filter(u => !u.pending && !u.isMaster);

  // Enriquecer dados com informações de nível
  const enrichedStudents = approvedStudents.map(student => {
    const levelInfo = getLevelInfo(student.xp || 0);
    return {
      id: student.id,
      username: student.username,
      fullname: student.fullname,
      class: student.class,
      year: student.year,
      level: student.level,
      xp: student.xp,
      levelInfo: levelInfo
    };
  });

  console.log('[DEBUG BACKEND] Alunos aprovados encontrados:', enrichedStudents.length);
  console.log('[DEBUG BACKEND] Exemplo de aluno enviado:', enrichedStudents[0]);
  res.json(enrichedStudents);
});

// Rota para obter informações do usuário logado
router.get('/me', autenticar, (req, res) => {
  console.log('[DEBUG BACKEND] Chamada para /me:', req.user);
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Obter informações detalhadas do nível
  const levelInfo = getLevelInfo(user.xp || 0);

  res.json({
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    class: user.class,
    year: user.year,
    level: user.level,
    xp: user.xp,
    isMaster: user.isMaster,
    levelInfo: levelInfo
  });
});

router.get('/pending-users', autenticar, ehMestre, (req, res) => {
  console.log('[DEBUG BACKEND] Chamada para pending-users (com autenticação)');
  const pendingUsers = users.filter(u => u.pending && !u.isMaster);
  console.log('[DEBUG BACKEND] Usuários pendentes encontrados:', pendingUsers.length);
  res.json(pendingUsers);
});

router.post('/approve-user', autenticar, ehMestre, async (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  user.pending = false;
  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/reject-user', autenticar, ehMestre, async (req, res) => {
  const { userId } = req.body;
  const index = users.findIndex(u => u.id === parseInt(userId));
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  users.splice(index, 1);
  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({ message: 'Usuário rejeitado' });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/penalty', autenticar, ehMestre, async (req, res) => {
  const { studentId, penalty, reason } = req.body;
  console.log('[DEBUG] Aplicando penalidade:', { studentId, penalty, reason });

  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (!penalty || isNaN(penalty) || parseInt(penalty) <= 0) {
    return res.status(400).json({ error: 'Valor de penalidade inválido' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Motivo da penalidade é obrigatório' });
  }

  const oldXp = user.xp || 0;
  user.xp = Math.max(0, oldXp - parseInt(penalty));

  // Adicionar ao histórico
  if (!user.history) user.history = [];
  user.history.push({
    type: 'penalty',
    amount: parseInt(penalty),
    reason: reason.trim(),
    oldXp: oldXp,
    newXp: user.xp,
    appliedBy: req.user.userId,
    appliedAt: new Date().toISOString()
  });

  // Usar o novo sistema de níveis
  updateUserLevel(user);

  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({
      message: `Penalidade de ${penalty} XP aplicada com sucesso!`,
      user: { ...user, password: undefined }
    });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/reward', autenticar, ehMestre, async (req, res) => {
  const { studentId, reward, reason } = req.body;
  console.log('[DEBUG] Aplicando recompensa:', { studentId, reward, reason });

  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  if (!reward || isNaN(reward) || parseInt(reward) <= 0) {
    return res.status(400).json({ error: 'Valor de recompensa inválido' });
  }

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Motivo da recompensa é obrigatório' });
  }

  const oldXp = user.xp || 0;
  user.xp = oldXp + parseInt(reward);

  // Adicionar ao histórico
  if (!user.history) user.history = [];
  user.history.push({
    type: 'reward',
    amount: parseInt(reward),
    reason: reason.trim(),
    oldXp: oldXp,
    newXp: user.xp,
    appliedBy: req.user.userId,
    appliedAt: new Date().toISOString()
  });

  // Usar o novo sistema de níveis
  updateUserLevel(user);

  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({
      message: `Recompensa de ${reward} XP aplicada com sucesso!`,
      user: { ...user, password: undefined }
    });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/student-history/:id', autenticar, ehMestre, async (req, res) => {
  const { id } = req.params;
  console.log('[DEBUG] Buscando histórico do aluno:', id);

  const user = users.find(u => u.id === parseInt(id));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const history = user.history || [];

  // Enriquecer o histórico com nomes dos mestres que aplicaram as ações
  const enrichedHistory = history.map(entry => {
    const master = users.find(u => u.id === entry.appliedBy);
    return {
      ...entry,
      appliedByName: master ? master.username : 'Usuário removido'
    };
  }).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)); // Mais recente primeiro

  res.json({
    student: {
      id: user.id,
      username: user.username,
      currentXp: user.xp || 0,
      level: user.level || 1
    },
    history: enrichedHistory,
    totalEntries: enrichedHistory.length
  });
});

router.post('/expel-student', autenticar, ehMestre, async (req, res) => {
  const { studentId } = req.body;
  console.log('[DEBUG] Expulsando aluno:', studentId);

  const userIndex = users.findIndex(u => u.id === parseInt(studentId));
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const user = users[userIndex];

  // Verificar se é realmente um aluno (não mestre)
  if (user.isMaster) {
    return res.status(400).json({ error: 'Não é possível expulsar um mestre' });
  }

  // Remover submissões do aluno
  const userSubmissionsIndices = [];
  for (let i = submissions.length - 1; i >= 0; i--) {
    if (parseInt(submissions[i].userId) === parseInt(studentId)) {
      userSubmissionsIndices.push(i);
      submissions.splice(i, 1);
    }
  }

  // Remover usuário da lista
  const expelledUser = users.splice(userIndex, 1)[0];

  try {
    // Salvar ambos os arquivos
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    await fs.writeFile(caminhoSubmissions, JSON.stringify(submissions, null, 2));

    console.log(`[DEBUG] Aluno expulso com sucesso: ${expelledUser.username}. ${userSubmissionsIndices.length} submissões removidas.`);
    res.json({
      message: 'Aluno expulso com sucesso',
      user: { ...expelledUser, password: undefined },
      submissionsRemoved: userSubmissionsIndices.length
    });
  } catch (err) {
    console.error('Erro ao salvar arquivos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;