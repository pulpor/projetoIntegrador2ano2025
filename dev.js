#!/usr/bin/env node
/**
 * Script de Desenvolvimento - Sistema RPG de Aprendizado
 * Facilita o desenvolvimento e teste do projeto
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COMMANDS = {
    'dev': {
        description: 'Iniciar servidor de desenvolvimento',
        command: 'python',
        args: ['-m', 'http.server', '8080'],
        cwd: 'frontend'
    },
    'validate': {
        description: 'Validar sistema de dark mode',
        command: 'node',
        args: ['scripts/validate-dark-mode.js'],
        cwd: '.'
    },
    'help': {
        description: 'Mostrar esta ajuda'
    }
};

function showHelp() {
    console.log('🚀 Sistema RPG de Aprendizado - Scripts de Desenvolvimento\n');
    console.log('Comandos disponíveis:');
    Object.entries(COMMANDS).forEach(([cmd, config]) => {
        console.log(`  ${cmd.padEnd(12)} - ${config.description}`);
    });
    console.log('\nExemplos:');
    console.log('  node dev.js dev        # Iniciar servidor de desenvolvimento');
    console.log('  node dev.js validate   # Validar dark mode');
    console.log('  node dev.js help       # Mostrar esta ajuda');
    console.log('\nAcesse: http://localhost:8080 após iniciar o servidor');
}

function runCommand(cmdName) {
    const config = COMMANDS[cmdName];

    if (!config) {
        console.log(`❌ Comando desconhecido: ${cmdName}`);
        showHelp();
        return;
    }

    if (cmdName === 'help') {
        showHelp();
        return;
    }

    console.log(`🚀 Executando: ${config.description}`);

    const cwd = path.resolve(config.cwd);

    if (!fs.existsSync(cwd)) {
        console.log(`❌ Diretório não encontrado: ${cwd}`);
        return;
    }

    const child = spawn(config.command, config.args, {
        cwd: cwd,
        stdio: 'inherit',
        shell: process.platform === 'win32'
    });

    child.on('error', (error) => {
        console.log(`❌ Erro ao executar comando: ${error.message}`);
    });

    child.on('close', (code) => {
        if (code !== 0) {
            console.log(`❌ Comando falhou com código: ${code}`);
        }
    });

    // Para comandos de servidor, mostrar informações úteis
    if (cmdName === 'dev') {
        setTimeout(() => {
            console.log('\n📱 Páginas disponíveis:');
            console.log('  Login:      http://localhost:8080/index.html');
            console.log('  Master:     http://localhost:8080/src/pages/master.html');
            console.log('  Student:    http://localhost:8080/src/pages/student.html');
            console.log('\n💡 Pressione Ctrl+C para parar o servidor');
        }, 1000);
    }
}

// Executar comando
const command = process.argv[2] || 'help';
runCommand(command);
