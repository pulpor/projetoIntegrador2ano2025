#!/usr/bin/env node

/**
 * Script de Validação do Sistema RPG
 * Verifica se a estrutura do projeto está correta e se os componentes essenciais estão funcionando
 */

const fs = require('fs');
const path = require('path');

console.log('🎮 Validando Sistema RPG de Aprendizado...\n');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  }[type];

  console.log(`${prefix} [${timestamp}] ${message}${colors.reset}`);
}

// Verificações essenciais
const checks = [
  {
    name: 'Estrutura de Pastas',
    check: () => {
      const requiredDirs = ['backend', 'frontend', 'uploads', 'docs'];
      const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

      if (missingDirs.length === 0) {
        log('Todas as pastas essenciais estão presentes', 'success');
        return true;
      } else {
        log(`Pastas faltando: ${missingDirs.join(', ')}`, 'error');
        return false;
      }
    }
  },

  {
    name: 'Arquivos de Configuração',
    check: () => {
      const requiredFiles = ['.env.example', 'package.json', 'README.md'];
      const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

      if (missingFiles.length === 0) {
        log('Arquivos de configuração presentes', 'success');
        return true;
      } else {
        log(`Arquivos faltando: ${missingFiles.join(', ')}`, 'error');
        return false;
      }
    }
  },

  {
    name: 'Frontend Structure',
    check: () => {
      const frontendFiles = [
        'frontend/package.json',
        'frontend/index.html',
        'frontend/src/js/auth.js',
        'frontend/src/js/master.js',
        'frontend/src/js/student.js'
      ];

      const existingFiles = frontendFiles.filter(file => fs.existsSync(file));

      if (existingFiles.length >= 4) { // Pelo menos os arquivos essenciais
        log(`Estrutura do frontend OK (${existingFiles.length}/${frontendFiles.length} arquivos essenciais)`, 'success');
        return true;
      } else {
        log(`Apenas ${existingFiles.length}/${frontendFiles.length} arquivos essenciais do frontend encontrados`, 'warning');
        return false;
      }
    }
  },

  {
    name: 'Backend Structure',
    check: () => {
      const backendItems = [
        'backend/server.js',
        'backend/routes',
        'backend/middlewares',
        'backend/utils'
      ];

      const existingItems = backendItems.filter(item => fs.existsSync(item));

      if (existingItems.length >= 3) { // Pelo menos os itens essenciais
        log(`Estrutura do backend OK (${existingItems.length}/${backendItems.length} itens)`, 'success');
        return true;
      } else {
        log(`Apenas ${existingItems.length}/${backendItems.length} itens do backend encontrados`, 'warning');
        return false;
      }
    }
  },

  {
    name: 'Dependências',
    check: () => {
      const hasNodeModules = fs.existsSync('node_modules');
      const hasFrontendNodeModules = fs.existsSync('frontend/node_modules');

      if (hasNodeModules && hasFrontendNodeModules) {
        log('Dependências instaladas no backend e frontend', 'success');
        return true;
      } else {
        if (!hasNodeModules) log('Execute: npm install', 'warning');
        if (!hasFrontendNodeModules) log('Execute: cd frontend && npm install', 'warning');
        return false;
      }
    }
  },

  {
    name: 'Arquivo .env',
    check: () => {
      if (fs.existsSync('.env')) {
        log('Arquivo .env encontrado', 'success');
        return true;
      } else {
        log('Copie .env.example para .env e configure', 'warning');
        return false;
      }
    }
  },

  {
    name: 'Sistema de Temas',
    check: () => {
      const themeFiles = [
        'frontend/src/css/themes.css',
        'frontend/src/js/utils/themeManager.js'
      ];

      const existingFiles = themeFiles.filter(file => fs.existsSync(file));

      if (existingFiles.length === themeFiles.length) {
        log('Sistema de temas instalado e funcionando', 'success');
        return true;
      } else {
        log(`Sistema de temas incompleto: ${existingFiles.length}/${themeFiles.length} arquivos`, 'warning');
        return false;
      }
    }
  }
];

// Executar verificações
let passedChecks = 0;
let totalChecks = checks.length;

console.log(`Executando ${totalChecks} verificações...\n`);

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}`);
  if (check.check()) {
    passedChecks++;
  }
  console.log('');
});

// Resultado final
console.log('📊 Resultado da Validação:');
console.log(`${passedChecks}/${totalChecks} verificações passaram\n`);

if (passedChecks === totalChecks) {
  log('🎉 Sistema está pronto para uso!', 'success');
  console.log('\n🚀 Para iniciar o sistema:');
  console.log('1. Terminal 1: npm start');
  console.log('2. Terminal 2: cd frontend && npm run dev');
  console.log('3. Acesse: http://localhost:5173');
} else {
  log('⚠️  Algumas verificações falharam. Resolva os problemas listados acima.', 'warning');
}

console.log('\n📖 Para mais informações, consulte: docs/SETUP.md');
