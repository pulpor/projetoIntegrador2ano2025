const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Usar a mesma instância de users e userIdCounter do sistema de inicialização
const { users, userIdCounter } = require('../inicializacao');

const secret = process.env.JWT_SECRET || 'sua-chave-secreta';
const filePath = path.join(__dirname, '../data/users.json');

router.post('/register', async (req, res) => {
  const { username, fullname, password, class: userClass, year, isMaster } = req.body;
  if (!username || !fullname || !password || !userClass) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  // Validar ano se não for mestre
  if (!isMaster && (!year || ![1, 2, 3].includes(year))) {
    return res.status(400).json({ error: 'Ano inválido. Deve ser 1, 2 ou 3' });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: userIdCounter.value++,
    username,
    fullname,
    password: hashedPassword,
    class: userClass,
    year: isMaster ? null : year, // Mestres não têm ano
    isMaster: isMaster || false,
    level: 1,
    xp: 0,
    pending: !isMaster
  };
  users.push(user);
  try {
    await fs.writeFile(filePath, JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  if (user.pending && !user.isMaster) {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo mestre' });
  }
  const token = jwt.sign({ userId: user.id, isMaster: user.isMaster }, secret, { expiresIn: '1d' });
  res.json({ user: { ...user, password: undefined }, token });
});

module.exports = router;