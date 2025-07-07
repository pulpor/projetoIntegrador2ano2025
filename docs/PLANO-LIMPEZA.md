# 🧹 PLANO DE LIMPEZA E REORGANIZAÇÃO

## Estrutura Atual vs. Estrutura Proposta

### ARQUIVOS A REMOVER (lixo/temporários):
- debug-token.js
- debug-mission-creation.js
- test-funcoes.js
- test-mission-creation.html
- frontend-test.js
- test-frontend.html
- test-full-flow.js
- test-mission-filtering.js
- test-simple.js
- test-submissions.js
- validacao-sistema.js
- CORRECAO-PROBLEMA-TOKEN.md
- backend/diagnostico.js
- backend/test-mission-creation.js
- backend/test-server.js
- frontend/debug-auth.js
- frontend/debug-token-master.js
- frontend/test-master.html
- frontend/test-student.html

### ESTRUTURA NOVA PROPOSTA:

```
projeto-integrador-rpg/
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── docs/
│   └── setup.md
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── missions.js
│   │   ├── users.js
│   │   └── submissions.js
│   ├── utils/
│   │   ├── fileUpload.js
│   │   └── helpers.js
│   └── data/
│       ├── missions.json
│       ├── users.json
│       └── submissions.json
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── login.html
│   │   │   ├── master.html
│   │   │   └── student.html
│   │   ├── js/
│   │   │   ├── auth.js
│   │   │   ├── master.js
│   │   │   └── student.js
│   │   ├── css/
│   │   │   └── main.css
│   │   └── assets/
│   │       ├── images/
│   │       └── icons/
│   └── uploads/
└── uploads/
```

### BENEFÍCIOS:
✅ Estrutura mais clara e organizada
✅ Separação de responsabilidades
✅ Remoção de arquivos de teste/debug
✅ Documentação consolidada
✅ Configuração centralizada
✅ Uploads organizados
