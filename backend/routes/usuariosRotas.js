const express = require('express');
const { autenticar, ehMestre } = require('../middlewares/autenticacao');
const { users, submissions } = require('../inicializacao');
const fs = require('fs').promises;
const path = require('path');
const { updateUserLevel, getLevelInfo } = require('../utils/levelSystem');
const router = express.Router();

// Caminho correto para o arquivo users.json
const caminhoUsers = path.join(__dirname, '..', '..', 'frontend', 'jsons', 'users.json');
const caminhoSubmissions = path.join(__dirname, '..', '..', 'frontend', 'jsons', 'submissions.json');

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
    levelInfo: levelInfo,
    actionHistory: user.actionHistory || []
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
    res.json({
      message: 'Usuário aprovado com sucesso!',
      user: { ...user, password: undefined }
    });
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
    res.json({ message: 'Usuário rejeitado com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/penalty', autenticar, ehMestre, async (req, res) => {
  const { studentId, penalty, reason } = req.body;
  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const oldXP = user.xp || 0;
  user.xp = Math.max(0, oldXP - parseInt(penalty));

  // Inicializar histórico se não existir
  if (!user.actionHistory) {
    user.actionHistory = [];
  }

  // Adicionar entrada no histórico
  user.actionHistory.push({
    type: 'penalty',
    amount: parseInt(penalty),
    reason: reason || 'Sem motivo especificado',
    oldXP: oldXP,
    newXP: user.xp,
    date: new Date().toISOString(),
    masterId: req.user.userId
  });

  // Usar o novo sistema de níveis
  updateUserLevel(user);

  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({
      message: `Penalidade de ${penalty} XP aplicada com sucesso`,
      user: { ...user, password: undefined }
    });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para dar recompensa (adicionar XP)
router.post('/reward', autenticar, ehMestre, async (req, res) => {
  const { studentId, reward, reason } = req.body;
  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  const oldXP = user.xp || 0;
  user.xp = oldXP + parseInt(reward);

  // Inicializar histórico se não existir
  if (!user.actionHistory) {
    user.actionHistory = [];
  }

  // Adicionar entrada no histórico
  user.actionHistory.push({
    type: 'reward',
    amount: parseInt(reward),
    reason: reason || 'Sem motivo especificado',
    oldXP: oldXP,
    newXP: user.xp,
    date: new Date().toISOString(),
    masterId: req.user.userId
  });

  // Usar o novo sistema de níveis
  updateUserLevel(user);

  try {
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    res.json({
      message: `Recompensa de ${reward} XP adicionada com sucesso`,
      user: { ...user, password: undefined }
    });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
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
      message: 'Aluno expulso com sucesso!',
      user: { ...expelledUser, password: undefined },
      submissionsRemoved: userSubmissionsIndices.length
    });
  } catch (err) {
    console.error('Erro ao salvar arquivos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter histórico/detalhes do estudante
router.get('/student-details/:studentId', autenticar, ehMestre, (req, res) => {
  const { studentId } = req.params;
  const student = users.find(u => u.id === parseInt(studentId) && !u.isMaster);

  if (!student) {
    return res.status(404).json({ error: 'Estudante não encontrado' });
  }

  // Obter submissões do estudante
  const studentSubmissions = submissions.filter(s => parseInt(s.userId) === parseInt(studentId));

  // Calcular estatísticas
  const stats = {
    totalSubmissions: studentSubmissions.length,
    approvedSubmissions: studentSubmissions.filter(s => s.status === 'approved').length,
    pendingSubmissions: studentSubmissions.filter(s => s.status === 'pending').length,
    rejectedSubmissions: studentSubmissions.filter(s => s.status === 'rejected').length
  };

  // Obter informações de nível
  const levelInfo = getLevelInfo(student.xp || 0);

  res.json({
    student: { ...student, password: undefined },
    submissions: studentSubmissions.map(s => ({
      id: s.id,
      missionId: s.missionId,
      status: s.status,
      submittedAt: s.submittedAt,
      feedback: s.feedback
    })),
    actionHistory: student.actionHistory || [],
    stats,
    levelInfo
  });
});

module.exports = router;