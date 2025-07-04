const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializar dados primeiro
require('./inicializacao');

const autenticacaoRotas = require('./routes/autenticacaoRotas');
const missoesRotas = require('./routes/missoesRotas');
const usuariosRotas = require('./routes/usuariosRotas');
const submissoesRotas = require('./routes/submissoesRotas');

const app = express();
const port = 3000;

// Configurar CORS
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar rotas
app.use('/auth', autenticacaoRotas);
app.use('/missoes', missoesRotas);
app.use('/usuarios', usuariosRotas);
app.use('/submissoes', submissoesRotas);
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rota padrão para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});