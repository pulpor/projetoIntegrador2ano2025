# 🔧 Guia de Solução - "Erro ao conectar com o servidor"

## 🎯 Checklist Rápido

### 1. **Verificar se o Backend está rodando**
```bash
# Terminal 1 - Backend
cd backend
node server.js
```
**Deve aparecer:** `Servidor rodando em http://localhost:3000`

### 2. **Verificar se o Frontend está rodando**
```bash
# Terminal 2 - Frontend  
cd frontend
npm run dev
```
**Deve aparecer:** `Local: http://localhost:5173`

### 3. **Testar conectividade básica**
```bash
# Terminal 3 - Teste
cd backend
node test-server.js
```

## 🚨 Problemas Comuns e Soluções

### **❌ "Servidor rodando" não aparece**
**Causa:** Erro na inicialização do backend
**Solução:**
```bash
cd backend
node diagnostico.js  # Verificar problemas
npm install          # Reinstalar dependências
node server.js       # Tentar novamente
```

### **❌ Porta 3000 em uso**
**Causa:** Outro processo usando a porta
**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID [PID_NUMBER]

# Ou mudar a porta no server.js
const port = 3001; // Mudar para 3001
```

### **❌ "CORS policy" no console do browser**
**Causa:** Frontend rodando em porta não permitida
**Solução:** Verificar se o frontend está em uma das portas permitidas:
- http://localhost:5173 (Vite padrão)
- http://localhost:5174 
- http://localhost:5175
- http://127.0.0.1:5500 (Live Server)

### **❌ "Token inválido" ou "401 Unauthorized"**
**Causa:** Problema de autenticação
**Solução:**
1. Fazer logout e login novamente
2. Limpar localStorage do browser (F12 > Application > Local Storage)
3. Verificar se username/password estão corretos

### **❌ "Erro interno do servidor" (500)**
**Causa:** Erro no código do backend
**Solução:**
1. Verificar console do backend para erros detalhados
2. Verificar se arquivos JSON existem e são válidos
3. Verificar permissões de escrita na pasta jsons/

## 🛠️ Comandos de Diagnóstico

### **Verificar estrutura de arquivos:**
```bash
cd backend
node diagnostico.js
```

### **Testar conectividade:**
```bash
cd backend  
node test-server.js
```

### **Verificar logs do browser:**
1. Abrir DevTools (F12)
2. Aba Console
3. Procurar erros em vermelho

### **Verificar Network requests:**
1. DevTools (F12) > Network
2. Tentar fazer ação que dá erro
3. Ver se requisição aparece e qual o status

## 📱 URLs para Testar Manualmente

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **API Test:** http://localhost:3000/missoes (deve dar 401 - normal)

## 🔍 Logs Específicos para Procurar

### **No console do backend:**
```
[SERVER] ✅ Dados carregados com sucesso
[SERVER] ✅ Rotas configuradas  
Servidor rodando em http://localhost:3000
```

### **No console do browser:**
```javascript
// Erros a procurar:
"CORS policy"           → Problema de CORS
"Failed to fetch"       → Backend não responde
"401 Unauthorized"      → Problema de token
"500 Internal Server"   → Erro no backend
```

## 🚀 Processo Completo de Restart

```bash
# 1. Parar tudo (Ctrl+C nos terminais)

# 2. Backend
cd backend
npm install
node server.js

# 3. Frontend (novo terminal)
cd frontend  
npm install
npm run dev

# 4. Testar (novo terminal)
cd backend
node test-server.js
```

## 💡 Dicas Extras

1. **Sempre verificar os dois consoles:** Backend (terminal) e Frontend (browser F12)
2. **Porta do Vite pode mudar:** Se 5173 estiver ocupada, pode ser 5174, 5175, etc.
3. **Cache do browser:** Às vezes Ctrl+F5 (hard refresh) resolve
4. **Antivírus:** Pode bloquear conexões localhost - temporariamente desabilitar
5. **Firewall:** Verificar se não está bloqueando as portas 3000 e 5173

## 📞 Se Nada Funcionar

1. Reiniciar o computador
2. Verificar se Node.js está instalado: `node --version`
3. Verificar se npm está instalado: `npm --version`
4. Reinstalar dependências: `rm -rf node_modules package-lock.json && npm install`
