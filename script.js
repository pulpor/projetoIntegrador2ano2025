const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;


// Configurar CORS
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Servir index.html na rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Configurar armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/register', (req, res) => {
  const { username, password, class: userClass, isMaster } = req.body;
  if (users.find(u => u.username === username)) {
    return res.json({ error: 'Usuário já existe' });
  }
  const user = {
    id: userIdCounter++,
    username,
    password,
    class: userClass,
    isMaster,
    level: 1,
    xp: 0,
    pending: !isMaster
  };
  users.push(user);
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ user });
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.json({ error: 'Credenciais inválidas' });
  }
  if (user.pending && !user.isMaster) {
    return res.json({ error: 'Cadastro pendente de aprovação pelo mestre' });
  }
  res.json({ user });
});


app.get('/missions', (req, res) => {
  res.json(missions);
});


app.post('/missions', (req, res) => {
  const { title, description, xp } = req.body;
  const mission = { id: missionIdCounter++, title, description, xp };
  missions.push(mission);
  fs.writeFileSync('missions.json', JSON.stringify(missions, null, 2));
  res.json(mission);
});


app.post('/submit', upload.array('code'), (req, res) => {
  const { missionId, userId } = req.body;
  const mission = missions.find(m => m.id === parseInt(missionId));
  const user = users.find(u => u.id === parseInt(userId));
  if (!mission || !user) {
    return res.json({ error: 'Missão ou usuário não encontrado' });
  }
  const submission = {
    id: submissionIdCounter++,
    userId,
    missionId,
    filePaths: req.files.map(file => file.path),
    submittedAt: new Date(),
    pending: true,
    xp: mission.xp
  };
  submissions.push(submission);
  fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
  res.json({ message: 'Submissão enviada com sucesso' });
});


app.get('/students', (req, res) => {
  res.json(users.filter(u => !u.isMaster));
});


app.get('/pending-users', (req, res) => {
  res.json(users.filter(u => u.pending && !u.isMaster));
});


app.post('/approve-user', (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.json({ error: 'Usuário não encontrado' });
  }
  user.pending = false;
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ user });
});


app.post('/reject-user', (req, res) => {
  const { userId } = req.body;
  users = users.filter(u => u.id !== parseInt(userId));
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ message: 'Usuário rejeitado' });
});


app.post('/approve-submission', (req, res) => {
  const { submissionId } = req.body;
  const submission = submissions.find(s => s.id === parseInt(submissionId));
  if (!submission) {
    return res.json({ error: 'Submissão não encontrada' });
  }
  const user = users.find(u => u.id === parseInt(submission.userId));
  if (!user) {
    return res.json({ error: 'Usuário não encontrado' });
  }
  submission.pending = false;
  user.xp += submission.xp;
  user.level = Math.floor(user.xp / 100) + 1;
  fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ submission, user });
});


app.post('/reject-submission', (req, res) => {
  const { submissionId } = req.body;
  submissions = submissions.filter(s => s.id !== parseInt(submissionId));
  fs.writeFileSync('submissions.json', JSON.stringify(submissions, null, 2));
  res.json({ message: 'Submissão rejeitada' });
});


app.post('/penalty', (req, res) => {
  const { studentId, penalty } = req.body;
  const user = users.find(u => u.id === parseInt(studentId));
  if (!user) {
    return res.json({ error: 'Usuário não encontrado' });
  }
  user.xp = Math.max(0, user.xp - penalty);
  user.level = Math.floor(user.xp / 100) + 1;
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ user });
});


app.get('/submissions', (req, res) => {
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


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


// Carregar dados persistentes
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


// Mestre Fullstack padrão
if (!users.find(u => u.username === 'mestre')) {
  users.push({
    id: userIdCounter++,
    username: 'mestre',
    password: 'fullstack123',
    class: 'Mestre Fullstack',
    isMaster: true,
    level: 1,
    xp: 0,
    pending: false
  });
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

