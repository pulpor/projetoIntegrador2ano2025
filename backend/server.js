const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializar dados primeiro
console.log('[SERVER] Iniciando carregamento de dados...');
try {
  require('./inicializacao');
  console.log('[SERVER] ✅ Dados carregados com sucesso');
} catch (error) {
  console.error('[SERVER] ❌ Erro ao carregar dados:', error);
  process.exit(1);
}

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

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar rotas
console.log('[SERVER] Configurando rotas...');
app.use('/auth', autenticacaoRotas);
app.use('/missoes', missoesRotas);
app.use('/usuarios', usuariosRotas);
app.use('/submissoes', submissoesRotas);
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
console.log('[SERVER] ✅ Rotas configuradas');

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rota padrão para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log('📋 Rotas disponíveis:');
  console.log('   - POST /auth/login');
  console.log('   - POST /auth/register');
  console.log('   - GET  /missoes (requer autenticação)');
  console.log('   - POST /missoes (requer autenticação de mestre)');
  console.log('   - GET  /usuarios/me (requer autenticação)');
  console.log('   - GET  /submissoes/my-submissions (requer autenticação)');
  console.log('✅ Sistema pronto para uso!');
});