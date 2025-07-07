# Estrutura do Projeto RPG de Aprendizado

## 📁 Estrutura Organizada

```
projetoIntegrador2ano2025/
├── 📁 backend/                     # Servidor Node.js
│   ├── 📁 config/                  # Configurações do banco
│   ├── 📁 data/                    # Dados iniciais/migrations
│   ├── 📁 middleware/              # Middlewares de autenticação
│   ├── 📁 routes/                  # Rotas da API
│   ├── 📁 services/                # Lógica de negócio
│   ├── 📁 utils/                   # Utilitários do backend
│   ├── server.js                   # Servidor principal
│   └── inicializacao.js           # Setup inicial
│
├── 📁 frontend/                    # Aplicação Frontend
│   ├── 📁 assets/                  # Imagens, ícones, skins
│   ├── 📁 src/                     # Código fonte
│   │   ├── 📁 css/                 # Estilos (Tailwind)
│   │   ├── 📁 js/                  # JavaScript
│   │   │   ├── 📁 utils/           # Módulos utilitários
│   │   │   │   ├── auth.js         # Autenticação
│   │   │   │   ├── interface.js    # Interface/UI
│   │   │   │   ├── modals.js       # Modais
│   │   │   │   └── buttons.js      # Gerenciamento de botões
│   │   │   ├── master.js           # Página do mestre (otimizada)
│   │   │   └── student.js          # Página do estudante
│   │   └── 📁 pages/               # Páginas HTML
│   ├── 📁 styles/                  # Estilos adicionais
│   ├── index.html                  # Página de login
│   ├── package.json                # Dependências frontend
│   ├── tailwind.config.js          # Configuração Tailwind
│   └── vite.config.js              # Configuração Vite
│
├── 📁 docs/                        # Documentação
│   ├── OTIMIZACAO-MASTER-CONCLUIDA.md
│   ├── REORGANIZACAO-COMPLETA.md
│   ├── MELHORIAS-UX.md
│   ├── CORRECAO-PENALIDADE-RECOMPENSA-FINAL.md
│   └── SOLUCAO-BOTOES-NAO-FUNCIONAVAM.md
│
├── 📁 tests/                       # Arquivos de teste
│   ├── test-*.html                 # Páginas de teste
│   ├── test-*.js                   # Scripts de teste
│   └── debug-*.html                # Páginas de debug
│
├── 📁 backup/                      # Backups de arquivos
│   └── master-backup.js            # Backup do master.js original
│
├── 📁 uploads/                     # Uploads dos usuários
├── package.json                    # Dependências do projeto
├── README.md                       # Documentação principal
└── .gitignore                      # Arquivos ignorados pelo Git
```

## 🎯 Arquivos Principais

### Backend
- **server.js** - Servidor Express principal
- **routes/** - API endpoints organizados por funcionalidade
- **middleware/** - Autenticação JWT
- **utils/** - Funções utilitárias (levelSystem, helpers, etc.)

### Frontend
- **src/js/master.js** - Interface do mestre (OTIMIZADA: 456 linhas)
- **src/js/student.js** - Interface do estudante
- **src/js/utils/** - Módulos utilitários reutilizáveis
- **src/css/** - Estilos com Tailwind CSS

## 🧹 Arquivos Removidos/Organizados

### ✅ Movidos para `docs/`
- Todos os arquivos .md de documentação
- Histórico de correções e melhorias

### ✅ Movidos para `tests/`
- Arquivos de teste HTML/JS
- Páginas de debug

### ✅ Movidos para `backup/`
- Versões antigas de arquivos
- Backups antes da otimização

### ❌ Removidos
- Arquivos duplicados
- Versões temporárias
- Logs desnecessários

## 🚀 Benefícios da Organização

1. **Estrutura Clara**: Fácil localização de arquivos
2. **Separação de Responsabilidades**: Cada pasta tem função específica
3. **Manutenibilidade**: Código organizado e modular
4. **Versionamento**: .gitignore atualizado para ignorar arquivos desnecessários
5. **Documentação**: Centralizada na pasta docs/
6. **Testes**: Isolados em pasta específica

## 📝 Como Navegar

- **Desenvolvimento**: Trabalhe nos arquivos em `src/`
- **Configuração**: Ajuste configs nos arquivos `.config.js`
- **Documentação**: Consulte a pasta `docs/`
- **Testes**: Use arquivos na pasta `tests/`
- **API**: Backend organizado por funcionalidade

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Frontend (dev)
cd frontend && npm run dev

# Backend (dev)
npm run dev

# Build para produção
cd frontend && npm run build
```
