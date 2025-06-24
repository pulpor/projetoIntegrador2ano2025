const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'sua-chave-secreta';

const autenticar = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Verificando token:', { token, url: req.url });
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, secret);
    console.log('Token decodificado:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err.message);
    return res.status(401).json({ error: 'Token inválido: ' + err.message });
  }
};

const ehMestre = (req, res, next) => {
  if (!req.user.isMaster) {
    return res.status(403).json({ error: 'Acesso restrito ao mestre' });
  }
  next();
};

module.exports = { autenticar, ehMestre };