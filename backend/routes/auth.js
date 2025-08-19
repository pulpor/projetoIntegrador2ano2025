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

// Função para validar força da senha
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`pelo menos ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push('pelo menos uma letra maiúscula');
  }
  if (!hasLowerCase) {
    errors.push('pelo menos uma letra minúscula');
  }
  if (!hasNumbers) {
    errors.push('pelo menos um número');
  }
  if (!hasSpecialChar) {
    errors.push('pelo menos um caractere especial');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Função para validar nome de usuário
function validateUsername(username) {
  const minLength = 5;
  const hasValidChars = /^[a-zA-Z0-9_]+$/.test(username);

  const errors = [];

  if (username.length < minLength) {
    errors.push(`pelo menos ${minLength} caracteres`);
  }
  if (!hasValidChars) {
    errors.push('apenas letras, números e underscore (_)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

router.post('/register', async (req, res) => {
  const { username, fullname, password, class: userClass, year, isMaster } = req.body;

  // Validações básicas
  if (!username || !fullname || !password || !userClass) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  // Validar nome de usuário
  const usernameValidation = validateUsername(username.trim());
  if (!usernameValidation.isValid) {
    return res.status(400).json({
      error: `Nome de usuário deve ter: ${usernameValidation.errors.join(', ')}`
    });
  }

  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      error: `Senha deve ter: ${passwordValidation.errors.join(', ')}`
    });
  }

  // Validar ano se não for mestre
  if (!isMaster && (!year || ![1, 2, 3].includes(year))) {
    return res.status(400).json({ error: 'Ano inválido. Deve ser 1, 2 ou 3' });
  }

  const trimmedUsername = username.trim();
  if (users.find(u => u.username === trimmedUsername)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: userIdCounter.value++,
    username: trimmedUsername,
    fullname: fullname.trim(),
    password: hashedPassword,
    class: userClass.trim(),
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
  console.log("[LOGIN] username recebido:", username);
  const user = users.find(u => u.username === username);
  console.log("[LOGIN] usuário encontrado:", user ? user.username : null);

  if (!user) {
    console.log("[LOGIN] Usuário não encontrado.");
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  console.log("[LOGIN] senha recebida:", password);
  console.log("[LOGIN] senha hash:", user.password);
  console.log("[LOGIN] senha confere?", passwordMatch);

  if (!passwordMatch) {
    console.log("[LOGIN] Senha inválida.");
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (user.pending && !user.isMaster) {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo mestre' });
  }
  const token = jwt.sign({ userId: user.id, isMaster: user.isMaster }, secret, { expiresIn: '1d' });
  res.json({ user: { ...user, password: undefined }, token });
});

module.exports = router;