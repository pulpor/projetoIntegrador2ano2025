# 🎮 Sistema RPG de Aprendizado

Um sistema interativo de gamificação para educação, onde alunos completam missões e ganham experiência (XP) em suas atividades de aprendizado. Sistema completo com autenticação, gerenciamento de missões, upload de arquivos, interface responsiva otimizada e **Dark/Light Mode**.

## 🌟 Funcionalidades Principais

- 🎯 **Sistema de Missões**: Criação e gerenciamento de atividades
- 👥 **Multi-usuário**: Professores e alunos com painéis específicos
- 📊 **Sistema de XP**: Progresso gamificado com níveis
- 📁 **Upload de Arquivos**: Submissão de códigos e documentos
- 🌙 **Dark/Light Mode**: Interface adaptável com toggle automático
- 📱 **Design Responsivo**: Otimizado para todos os dispositivos
- 🔒 **Autenticação Segura**: Sistema completo de login/registro

## 📁 Estrutura do Projeto

```
projeto-integrador-rpg/
├── README.md              # Documentação principal
├── dev.js                 # Script de desenvolvimento
├── package.json           # Configuração do projeto raiz
├── backend/               # Servidor Node.js
│   ├── server.js         # Servidor principal
│   ├── config/           # Configurações
│   ├── controllers/      # Controllers da API
│   ├── middlewares/      # Middlewares de autenticação
│   ├── routes/           # Rotas da API
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Utilitários e helpers
│   └── Uploads/          # Arquivos enviados via backend
├── frontend/             # Interface do usuário
│   ├── index.html        # Página de login principal
│   ├── src/
│   │   ├── css/
│   │   │   ├── main.css     # CSS base otimizado
│   │   │   └── themes.css   # Sistema Dark/Light Mode
│   │   ├── js/              # Lógica JavaScript
│   │   └── pages/
│   │       ├── master.html  # Painel do professor
│   │       └── student.html # Painel do estudante
│   ├── assets/           # Recursos estáticos
│   └── utils/            # Utilitários do frontend
├── docs/                 # Documentação detalhada
│   ├── DARK-LIGHT-MODE.md      # Guia do sistema de temas
│   ├── STATUS-FINAL-COMPLETO.md # Status final do projeto
│   └── CORRECAO-CSS-DARK-MODE.md # Histórico de correções
├── scripts/              # Scripts de desenvolvimento
│   └── validate-dark-mode.js   # Validador automático
└── archive/              # Arquivos de backup e testes
│   │   └── skins/       # Skins dos personagens
│   ├── jsons/           # Dados JSON locais
│   │   ├── missions.json    # Cache de missões
│   │   ├── submissions.json # Cache de submissões
│   │   └── users.json       # Cache de usuários
│   └── utils/           # Utilitários do frontend
├── uploads/             # Arquivos enviados pelos usuários
├── docs/                # Documentação adicional
└── archive/             # Arquivos arquivados
    ├── debug-scripts/   # Scripts de debug antigos
    ├── old-docs/        # Documentação antiga
    ├── test-files/      # Arquivos de teste
    └── test-pages/      # Páginas de teste
```

## 🚀 Início Rápido

### Script de Desenvolvimento Integrado
```bash
# Iniciar servidor de desenvolvimento
node dev.js dev

# Validar sistema de temas
node dev.js validate

# Ver todos os comandos disponíveis
node dev.js help
```

### Acesso às Páginas
Após iniciar o servidor:
- **Login**: http://localhost:8080/index.html
- **Painel do Professor**: http://localhost:8080/src/pages/master.html
- **Painel do Aluno**: http://localhost:8080/src/pages/student.html

### 🌙 Dark/Light Mode
- **Toggle automático**: Clique no botão 🌙/☀️ no canto superior direito
- **Detecção do sistema**: Respeita a preferência do seu SO
- **Persistência**: Sua escolha é salva automaticamente

## 🔧 Configuração Detalhada

### Pré-requisitos
- Node.js (versão 16 ou superior)
- Python 3.x (para servidor de desenvolvimento)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### 🔧 Configuração Inicial
1. Clone o repositório
2. Copie `.env.example` para `.env` e configure as variáveis necessárias
3. Instale as dependências do projeto

### Backend
```bash
# Navegue até a pasta do projeto
cd projeto-integrador-rpg

# Instale as dependências do backend
npm install

# Inicie o servidor backend
npm start
# ou para desenvolvimento com hot reload:
npm run dev
```

### Frontend
```bash
# Em um novo terminal, navegue até a pasta frontend
cd frontend

# Instale as dependências do frontend
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 🌐 Acessando o Sistema
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3000
- **Página de Login**: Acesse index.html no servidor frontend

### 👥 Usuários de Teste
- **Mestre**: usuario: `admin`, senha: `admin123`
- **Estudante**: Registre-se através da página de login

## 👤 Tipos de Usuário

### 🎯 Mestre (Professor)
- Criar e gerenciar missões
- Aprovar ou rejeitar submissões de alunos
- Visualizar progresso dos estudantes
- Gerenciar usuários pendentes

### 📚 Aluno (Estudante)
- Visualizar missões disponíveis
- Enviar submissões de atividades
- Acompanhar XP e progresso
- Filtrar missões por critérios

## 🔧 Funcionalidades

### ✨ Sistema de Missões
- ✅ Criação de missões com XP customizado
- ✅ Filtros por ano letivo e classe  
- ✅ Sistema de dificuldade baseado em XP
- ✅ Upload de múltiplos arquivos para submissões
- ✅ Edição e exclusão de missões pelo mestre
- ✅ Validação de dados e formulários

### 🏆 Sistema de Gamificação
- ✅ Pontuação em XP com sistema de níveis
- ✅ Diferentes classes (Arqueiro, Cafeicultor, etc.)
- ✅ Skins de personagens baseadas no nível
- ✅ Feedback visual de progresso
- ✅ Sistema de recompensas por conclusão

### 🔐 Autenticação e Segurança
- ✅ Login seguro com JWT
- ✅ Diferentes níveis de acesso (Mestre/Estudante)
- ✅ Proteção de rotas e middlewares
- ✅ Gerenciamento de sessões
- ✅ Validação de permissões

### 🎨 Sistema de Temas (Dark/Light Mode)
- ✅ Alternância entre tema claro e escuro
- ✅ Botão de toggle flutuante no canto superior direito
- ✅ Detecção automática da preferência do sistema
- ✅ Persistência da escolha do usuário no localStorage
- ✅ Transições suaves entre temas
- ✅ Cores otimizadas para acessibilidade
- ✅ Feedback visual de mudança de tema
- ✅ Compatibilidade com todos os componentes
- ✅ Design responsivo do toggle

### 📱 Interface de Usuário
- ✅ Design responsivo otimizado
- ✅ Scroll funcional em todos os painéis
- ✅ Navegação intuitiva
- ✅ Feedback visual (toasts, modais)
- ✅ Tema escuro moderno
- ✅ Animações suaves

### 📋 API Endpoints

#### Autenticação
- `POST /autenticacao/login` - Login de usuário
- `POST /autenticacao/register` - Registro de usuário
- `GET /autenticacao/verify` - Verificar token JWT

#### Missões
- `GET /missoes` - Listar todas as missões
- `POST /missoes` - Criar nova missão (mestre)
- `PUT /missoes/:id` - Editar missão (mestre)
- `DELETE /missoes/:id` - Deletar missão (mestre)
- `GET /missoes/filter` - Filtrar missões por critérios

#### Usuários
- `GET /usuarios/pending` - Usuários pendentes de aprovação (mestre)
- `GET /usuarios/approved` - Estudantes aprovados (mestre)
- `PUT /usuarios/:id/approve` - Aprovar usuário (mestre)
- `DELETE /usuarios/:id/reject` - Rejeitar usuário (mestre)
- `GET /usuarios/profile` - Perfil do usuário logado

#### Submissões
- `GET /submissoes` - Listar submissões (filtradas por usuário)
- `POST /submissoes` - Enviar nova submissão (estudante)
- `PUT /submissoes/:id/avaliar` - Avaliar submissão (mestre)
- `GET /submissoes/missao/:id` - Submissões de uma missão específica (mestre)

## �️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web robusto
- **JWT (jsonwebtoken)** - Autenticação segura
- **Multer** - Upload e gerenciamento de arquivos
- **bcrypt** - Criptografia de senhas
- **cors** - Configuração de CORS
- **fs-extra** - Operações de sistema de arquivos

### Frontend
- **Vanilla JavaScript (ES6+)** - Lógica da aplicação
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool e dev server rápido
- **PostCSS** - Processamento de CSS
- **HTML5** - Estrutura semântica das páginas

### Ferramentas de Desenvolvimento
- **Git** - Controle de versão
- **npm** - Gerenciador de pacotes
- **ESLint** - Linting de código
- **Prettier** - Formatação de código

## �🔄 Status do Projeto

### ✅ **Concluído:**
- ✅ Sistema de autenticação JWT completo
- ✅ CRUD completo de missões
- ✅ Sistema de submissões com upload de arquivos
- ✅ Interface responsiva e otimizada
- ✅ Sistema de scroll funcional em todos os painéis
- ✅ Upload de múltiplos arquivos
- ✅ Filtros avançados de missões
- ✅ Sistema de aprovação de usuários
- ✅ Feedback visual com toasts e modais
- ✅ Estrutura de projeto organizada e limpa
- ✅ Documentação completa
- ✅ Sistema de backup e arquivos
- ✅ Validação de formulários
- ✅ Proteção de rotas e middleware de autenticação

### 🚧 **Possíveis Melhorias Futuras:**
- 🔄 Sistema de notificações em tempo real (WebSocket)
- 🔄 Dashboard avançado com gráficos e estatísticas
- 🔄 Sistema de badges e conquistas
- 🔄 Chat entre mestre e estudantes
- 🔄 Relatórios em PDF
- 🔄 Sistema de ranking e competições
- 🔄 Integração com LMS externos
- 🔄 App mobile nativo

## 🐛 Resolução de Problemas

### Problemas Comuns

**Erro de CORS:**
```bash
# Certifique-se de que o backend está configurado para aceitar requests do frontend
# Verifique se a URL do frontend está nas configurações de CORS
```

**Erro de Upload de Arquivos:**
```bash
# Verifique se a pasta uploads/ existe e tem permissões de escrita
# Confirme se o Multer está configurado corretamente
```

**Problemas de Scroll:**
```bash
# O CSS foi otimizado - se houver problemas, verifique se o scroll-final.css está importado
# Remova qualquer CSS que defina overflow: hidden no body
```

### 🧹 Limpeza do Projeto

O projeto foi recentemente limpo e otimizado:
- ✅ Arquivos de teste e debug movidos para `archive/`
- ✅ Documentação antiga arquivada
- ✅ CSS de scroll otimizado e simplificado
- ✅ Estrutura de pastas organizada
- ✅ Apenas arquivos essenciais na raiz do projeto

## 📝 Licença

Este projeto é destinado para uso educacional.

## 👥 Contribuição

Este é um projeto acadêmico desenvolvido como parte do Projeto Integrador.

---

*Desenvolvido com ❤️ para educação gamificada*
