const express = require('express');
const fs = require('fs').promises;
const router = express.Router();

const { autenticar, ehMestre } = require('../middlewares/autenticacao');

const { missions, submissions, submissionIdCounter } = require('../inicializacao');
const { upload } = require('../utils/armazenamentoArquivos');

router.post('/submit', autenticar, upload, async (req, res) => {
  const { missionId } = req.body;
  const userId = req.user.userId;
  console.log('Processando submissão:', { missionId, userId, files: req.files, body: req.body });
  const mission = missions.find(m => m.id === parseInt(missionId));
  if (!mission) {
    return res.status(404).json({ error: 'Missão não encontrada' });
  }
  const submission = {
    id: submissionIdCounter.value++,
    userId,
    missionId: parseInt(missionId),
    filePaths: req.files.code ? req.files.code.map(file => file.path) : [],
    submittedAt: new Date(),
    pending: true,
    xp: mission.xp
  };
  submissions.push(submission);
  try {
    await fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2));
    console.log('submissions.json salvo com sucesso:', submission);
    res.json({ message: 'Submissão enviada com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/', autenticar, ehMestre, (req, res) => {
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

router.post('/approve-submission', autenticar, ehMestre, async (req, res) => {
  const { submissionId, feedback } = req.body;
  const submission = submissions.find(s => s.id === parseInt(submissionId));
  if (!submission) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }
  const user = users.find(u => u.id === parseInt(submission.userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  submission.approved = true;
  submission.pending = false;
  submission.feedback = feedback;
  user.xp += submission.xp;
  user.level = Math.floor(user.xp / 100) + 1;
  try {
    await fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2));
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    res.json({ submission, user: { ...user, password: undefined } });
  } catch (err) {
    console.error('Erro ao salvar arquivos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/reject-submission', autenticar, ehMestre, async (req, res) => {
  const { submissionId } = req.body;
  const index = submissions.findIndex(s => s.id === parseInt(submissionId));
  if (index === -1) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }
  submissions.splice(index, 1);
  try {
    await fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2));
    res.json({ message: 'Submissão rejeitada' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;