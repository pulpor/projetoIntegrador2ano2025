const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
const secret = process.env.JWT_SECRET || 'sua-chave-secreta'; // Use variável de ambiente em produção

// Configurar CORS
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Verificando token:', { token, url: req.url }); // Log
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, secret);
    console.log('Token decodificado:', decoded); // Log
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err.message); // Log
    return res.status(401).json({ error: 'Token inválido: ' + err.message });
  }
};

// Middleware para verificar se é mestre
const isMaster = (req, res, next) => {
  if (!req.user.isMaster) {
    return res.status(403).json({ error: 'Acesso restrito ao mestre' });
  }
  next();
};

// Servir index.html na rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configurar armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'Uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { userId, missionId } = req.body;
    cb(null, `submission_user${userId}_mission${missionId}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

let users = [];
let missions = [];
let submissions = [];
let userIdCounter = 1;
let missionIdCounter = 1;
let submissionIdCounter = 1;

// Servir arquivos de submissões
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Registrar usuário
app.post('/register', async (req, res) => {
  const { username, password, class: userClass, isMaster } = req.body;
  if (!username || !password || !userClass) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: userIdCounter++,
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
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  if (user.pending && !user.isMaster) {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo mestre' });
  }
  const token = jwt.sign({ userId: user.id, isMaster: user.isMaster }, secret, { expiresIn: '1d' });

  console.log('Token gerado para login:', { userId: user.id, isMaster: user.isMaster, token }); // Log
  res.json({ user: { ...user, password: undefined }, token });
});

// Obter missões
app.get('/missions', authenticate, (req, res) => {
  console.log('Acessando /missions:', { user: req.user }); // Log
  res.json(missions);
});

// Criar missão (somente mestre)
app.post('/missions', authenticate, isMaster, (req, res) => {
  const { title, description, xp } = req.body;
  console.log('Criando missão:', { title, description, xp, user: req.user }); // Log
  if (!title || !description || !xp) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  const mission = { id: missionIdCounter++, title, description, xp: parseInt(xp) };
  missions.push(mission);
  try {
    fs.writeFileSync('missions.json', JSON.stringify(missions, null, 2));
    console.log('missions.json salvo com sucesso:', mission); // Log
    res.json(mission);
  } catch (err) {
    console.error('Erro ao salvar missions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Submeter código
app.post('/submit', authenticate, upload.array('code'), (req, res) => {
  const { missionId } = req.body;
  const userId = req.user.userId;
  console.log('Processando submissão:', { missionId, userId, user: req.user }); // Log
  const mission = missions.find(m => m.id === parseInt(missionId));
  if (!mission) {
    return res.status(404).json({ error: 'Missão não encontrada' });
  }
  const submission = {
    id: submissionIdCounter++,
    userId,
    missionId: parseInt(missionId),
    filePaths: req.files.map(file => file.path),
    submittedAt: new Date(),
    pending: true,
    xp: mission.xp
  };
  submissions.push(submission);
  try {
    fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
    console.log('submissions.json salvo com sucesso:', submission); // Log
    res.json({ message: 'Submissão enviada com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar alunos
app.get('/students', authenticate, isMaster, (req, res) => {
  res.json(users.filter(u => !u.isMaster));
});

// Listar usuários pendentes
app.get('/pending-users', authenticate, isMaster, (req, res) => {
  res.json(users.filter(u => u.pending && !u.isMaster));
});

// Aprovar usuário
app.post('/approve-user', authenticate, isMaster, (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  user.pending = false;
  try {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rejeitar usuário
app.post('/reject-user', authenticate, isMaster, (req, res) => {
  const { userId } = req.body;
  users = users.filter(u => u.id !== parseInt(userId));
  try {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ message: 'Usuário rejeitado' });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Aprovar submissão
app.post('/approve-submission', authenticate, isMaster, (req, res) => {
  const { submissionId } = req.body;
  const submission = submissions.find(s => s.id === parseInt(submissionId));
  if (!submission) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }
  const user = users.find(u => u.id === parseInt(submission.userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  submission.pending = false;
  user.xp += submission.xp;
  user.level = Math.floor(user.xp / 100) + 1;
  try {
    fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ submission, user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar arquivos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rejeitar submissão
app.post('/reject-submission', authenticate, isMaster, (req, res) => {
  const { submissionId } = req.body;
  submissions = submissions.filter(s => s.id !== parseInt(submissionId));
  try {
    fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
    res.json({ message: 'Submissão rejeitada' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Aplicar penalidade
app.post('/penalty', authenticate, isMaster, (req, res) => {
  const { studentId, penalty } = req.body;
  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  user.xp = Math.max(0, user.xp - parseInt(penalty));
  user.level = Math.floor(user.xp / 100) + 1;
  try {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.json({ user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar users.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar submissões
app.get('/submissions', authenticate, isMaster, (req, res) => {
  const enrichedSubmissions = submissions.map(sub => {
    const user = users.find(u => u.id === parseInt(sub.userId));
    const mission = missions.find(m => m.id === parseInt(sub.missionId));
    return {
      ...sub,
      username: user ? user.username : 'Desconhecido',
      missionTitle: mission ? mission.title : 'Desconhecida'
    };
  });
  res.json(enrichedSubmissions);
});

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Carregar dados persistentes
try {
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
    userIdCounter = Math.max(...users.map(u => u.id), 0) + 1;
  }
  if (fs.existsSync('missions.json')) {
    missions = JSON.parse(fs.readFileSync('missions.json'));
    missionIdCounter = Math.max(...missions.map(m => m.id), 0) + 1;
  }
  if (fs.existsSync('submissions.json')) {
    submissions = JSON.parse(fs.readFileSync('submissions.json'));
    submissionIdCounter = Math.max(...submissions.map(s => s.id), 0) + 1;
  }
} catch (err) {
  console.error('Erro ao carregar dados persistentes:', err);
}

// Mestre Fullstack padrão
if (!users.find(u => u.username === 'mestre')) {
  bcrypt.hash('fullstack123', 10).then(hashedPassword => {
    users.push({
      id: userIdCounter++,
      username: 'mestre',
      password: hashedPassword,
      class: 'Mestre Fullstack',
      isMaster: true,
      level: 1,
      xp: 0,
      pending: false
    });
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  });
}