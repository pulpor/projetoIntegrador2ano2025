const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Caminho correto para o arquivo submissions.json
const caminhoSubmissions = path.join(__dirname, '..', '..', 'frontend', 'jsons', 'submissions.json');
const caminhoUsers = path.join(__dirname, '..', '..', 'frontend', 'jsons', 'users.json');

const { autenticar, ehMestre } = require('../middlewares/autenticacao');

const { users, missions, submissions, submissionIdCounter } = require('../inicializacao');
const { upload } = require('../utils/armazenamentoArquivos');
const { updateUserLevel } = require('../utils/levelSystem');

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
    await fs.writeFile(caminhoSubmissions, JSON.stringify(submissions, null, 2));
    console.log('submissions.json salvo com sucesso:', submission);
    res.json({ message: 'Submissão enviada com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/my-submissions', autenticar, (req, res) => {
  const userId = req.user.userId;
  console.log('[DEBUG] Buscando submissões do usuário:', userId);

  try {
    const userSubmissions = submissions.filter(sub => parseInt(sub.userId) === parseInt(userId));
    console.log('[DEBUG] Submissões encontradas:', userSubmissions.length);

    const enrichedSubmissions = userSubmissions.map(sub => {
      const mission = missions.find(m => m.id === parseInt(sub.missionId));
      return {
        ...sub,
        missionTitle: mission ? mission.title : 'Missão Desconhecida',
        missionDescription: mission ? mission.description : ''
      };
    });

    console.log('[DEBUG] Submissões do usuário enriquecidas:', enrichedSubmissions);
    res.json(enrichedSubmissions);
  } catch (err) {
    console.error('[DEBUG] Erro na rota GET /my-submissions:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
});

router.get('/', autenticar, ehMestre, (req, res) => {
  console.log('[DEBUG] Rota GET /submissoes chamada');
  console.log('[DEBUG] Usuário autenticado:', req.user);
  console.log('[DEBUG] Total de submissões:', submissions.length);

  try {
    const enrichedSubmissions = submissions.map(sub => {
      console.log('[DEBUG] Processando submissão:', sub.id);
      const user = users.find(u => u.id === parseInt(sub.userId));
      const mission = missions.find(m => m.id === parseInt(sub.missionId));

      console.log('[DEBUG] Usuário encontrado:', user ? user.username : 'não encontrado');
      console.log('[DEBUG] Missão encontrada:', mission ? mission.title : 'não encontrada');

      return {
        ...sub,
        username: user ? user.username : 'Desconhecido',
        missionTitle: mission ? mission.title : 'Desconhecida'
      };
    });

    console.log('[DEBUG] Submissões enriquecidas:', enrichedSubmissions);
    res.json(enrichedSubmissions);
  } catch (err) {
    console.error('[DEBUG] Erro na rota GET /submissoes:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
});

router.post('/:id/approve', autenticar, ehMestre, async (req, res) => {
  const submissionId = parseInt(req.params.id);
  const { feedback } = req.body;

  console.log('[DEBUG] Aprovando submissão:', submissionId);

  const submission = submissions.find(s => s.id === submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }

  const user = users.find(u => u.id === parseInt(submission.userId));
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  submission.approved = true;
  submission.pending = false;
  submission.feedback = feedback || '';
  user.xp += submission.xp;

  // Usar o novo sistema de níveis
  updateUserLevel(user);

  try {
    await fs.writeFile(caminhoSubmissions, JSON.stringify(submissions, null, 2));
    await fs.writeFile(caminhoUsers, JSON.stringify(users, null, 2));
    console.log('[DEBUG] Submissão aprovada e arquivos salvos');
    res.json({
      message: 'Submissão aprovada com sucesso!',
      submission,
      user: { ...user, password: undefined }
    });
  } catch (err) {
    console.error('Erro ao salvar arquivos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/:id/reject', autenticar, ehMestre, async (req, res) => {
  const submissionId = parseInt(req.params.id);

  console.log('[DEBUG] Rejeitando submissão:', submissionId);

  const index = submissions.findIndex(s => s.id === submissionId);
  if (index === -1) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }

  submissions[index].approved = false;
  submissions[index].pending = false;

  try {
    await fs.writeFile(caminhoSubmissions, JSON.stringify(submissions, null, 2));
    console.log('[DEBUG] Submissão rejeitada e arquivo salvo');
    res.json({ message: 'Submissão rejeitada com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar submissions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;