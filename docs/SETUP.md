# 📋 Guia de Configuração do Sistema RPG

## 🚀 Configuração Rápida

### 1. Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- Git (opcional)

### 2. Configuração do Ambiente
```bash
# 1. Clone ou baixe o projeto
git clone [url-do-repositorio]
cd projeto-integrador-rpg

# 2. Configure as variáveis de ambiente
copy .env.example .env
# Edite o arquivo .env com suas configurações

# 3. Instale dependências do backend
npm install

# 4. Instale dependências do frontend
cd frontend
npm install
cd ..
```

### 3. Execução
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend (nova janela/aba)
cd frontend
npm run dev
```

### 4. Acesso ao Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Login**: Use as credenciais de teste ou registre-se

## 🔧 Solução de Problemas

### Erro de Porta Ocupada
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [numero-do-processo] /F

# Ou altere a porta no .env:
PORT=3001
```

### Erro de CORS
- Verifique se o frontend está rodando na porta 5173
- Confirme se a URL está no ALLOWED_ORIGINS do .env

### Erro de Upload
- Verifique se a pasta `uploads/` existe
- Confirme permissões de escrita

## 📁 Estrutura Essencial
```
projeto/
├── .env (configure este arquivo!)
├── uploads/ (deve existir)
├── backend/
└── frontend/
```

## 👤 Usuários de Teste
- **Mestre**: admin / admin123
- **Estudante**: Registre-se pela interface

## 🎯 Próximos Passos
1. Faça login como mestre
2. Crie algumas missões de teste
3. Registre um estudante
4. Aprove o estudante
5. Teste submissões de atividades

---
*Sistema limpo e otimizado em Janeiro 2025*
