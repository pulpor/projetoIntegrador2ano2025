const express = require('express');
const fs = require('fs').promises;
const router = express.Router();


const { autenticar, ehMestre } = require('../middlewares/autenticacao');

const { missions, missionIdCounter } = require('../inicializacao');


router.get('/', autenticar, (req, res) => {
  console.log('Acessando /missoes:', { user: req.user });
  res.json(missions);
});

router.post('/', autenticar, ehMestre, async (req, res) => {
  const { title, description, xp } = req.body;
  console.log('Criando missão:', { title, description, xp, user: req.user });
  if (!title || !description || !xp) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  const mission = { id: missionIdCounter.value++, title, description, xp: parseInt(xp) };
  missions.push(mission);
  try {
    await fs.writeFile('missions.json', JSON.stringify(missions, null, 2));
    console.log('missions.json salvo com sucesso:', mission);
    res.json(mission);
  } catch (err) {
    console.error('Erro ao salvar missions.json:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;