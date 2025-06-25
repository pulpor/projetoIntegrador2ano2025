const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const secret = process.env.JWT_SECRET || 'sua-chave-secreta';
const filePath = path.join(__dirname, '../../frontend/jsons/users.json');

let users = [];
let userIdCounter = { value: 0 };

async function loadUsers() {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const loadedUsers = JSON.parse(data);
    users = loadedUsers || [];
    userIdCounter.value = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 0;
    console.log('Usuários carregados:', users); // Depuração
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Erro ao carregar users.json:', err);
    await fs.writeFile(filePath, JSON.stringify(users, null, 2));
  }
}

loadUsers(); 

router.post('/register', async (req, res) => {
  const { username, password, class: userClass, isMaster } = req.body;
  if (!username || !password || !userClass) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: userIdCounter.value++,
    username,
    password: hashedPassword,
    class: userClass,
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
    console.log('Usuário logado:', { ...user, password: undefined });
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

  console.log('Token gerado para login:', { userId: user.id, isMaster: user.isMaster, token });

  console.log('Usuário logado:', { ...user, password: undefined });
  res.json({ user: { ...user, password: undefined }, token });

});

module.exports = router;