const express = require('express');
const { autenticar, ehMestre } = require('../middlewares/autenticacao');
const { users } = require('../inicializacao');
const fs = require('fs').promises;
const router = express.Router();

router.get('/students', autenticar, ehMestre, (req, res) => {
  res.json(users.filter(u => !u.isMaster));
});

router.get('/pending-users', autenticar, ehMestre, (req, res) => {
  res.json(users.filter(u => u.pending && !u.isMaster));
});

router.post('/approve-user', autenticar, ehMestre, async (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  user.pending = false;
  try {
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
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
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    res.json({ message: 'Usuário rejeitado' });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/penalty', autenticar, ehMestre, async (req, res) => {
  const { studentId, penalty } = req.body;
  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  user.xp = Math.max(0, user.xp - parseInt(penalty));
  user.level = Math.floor(user.xp / 100) + 1;
  try {
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;