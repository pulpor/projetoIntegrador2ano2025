const express = require('express');
const cors = require('cors');
const path = require('path');

const autenticacaoRotas = require('./routes/autenticacaoRotas');
const missoesRotas = require('./routes/missoesRotas');
const usuariosRotas = require('./routes/usuariosRotas');
const submissoesRotas = require('./routes/submissoesRotas');

const app = express();
const port = 3000;

// Configurar CORS
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'html', 'login.html'));
});

app.use('/auth', autenticacaoRotas);
app.use('/missoes', missoesRotas);
app.use('/usuarios', usuariosRotas);
app.use('/submissoes', submissoesRotas);
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Carregar dados iniciais (importado do módulo)
require('./inicializacao');