#!/usr/bin/env node
/**
 * Script de Validação do Dark/Light Mode
 * Verifica se todas as páginas principais têm o sistema de temas implementado corretamente
 */

const fs = require('fs');
const path = require('path');

// Páginas principais que devem ter dark mode
const MAIN_PAGES = [
    'frontend/index.html',
    'frontend/src/pages/master.html',
    'frontend/src/pages/student.html'
];

// Elementos obrigatórios para dark mode
const REQUIRED_ELEMENTS = {
    themeCSS: /themes\.css/,
    themeToggle: /theme-toggle/,
    themeIcon: /theme-icon/,
    toggleFunction: /toggleTheme\(\)/,
    initTheme: /initTheme\(\)/
};

function validatePage(pagePath) {
    console.log(`\n🔍 Validando: ${pagePath}`);

    if (!fs.existsSync(pagePath)) {
        console.log(`❌ Arquivo não encontrado: ${pagePath}`);
        return false;
    }

    const content = fs.readFileSync(pagePath, 'utf8');
    let isValid = true;

    // Verificar elementos obrigatórios
    Object.entries(REQUIRED_ELEMENTS).forEach(([name, pattern]) => {
        if (pattern.test(content)) {
            console.log(`✅ ${name}: Encontrado`);
        } else {
            console.log(`❌ ${name}: AUSENTE`);
            isValid = false;
        }
    });

    // Verificações específicas
    if (content.includes('data-theme') || content.includes('setAttribute(\'data-theme')) {
        console.log(`✅ Atributo data-theme: Encontrado`);
    } else {
        console.log(`❌ Atributo data-theme: AUSENTE`);
        isValid = false;
    }

    if (content.includes('localStorage.getItem(\'theme\')')) {
        console.log(`✅ Persistência localStorage: Encontrada`);
    } else {
        console.log(`❌ Persistência localStorage: AUSENTE`);
        isValid = false;
    }

    return isValid;
}

function validateCSS() {
    console.log(`\n🎨 Validando CSS de Temas...`);

    const themesPath = 'frontend/src/css/themes.css';
    if (!fs.existsSync(themesPath)) {
        console.log(`❌ Arquivo themes.css não encontrado: ${themesPath}`);
        return false;
    }

    const content = fs.readFileSync(themesPath, 'utf8');
    let isValid = true;

    const requiredStyles = [
        ':root',
        '[data-theme="dark"]',
        '--bg-main',
        '--text-main',
        '.theme-toggle'
    ];

    requiredStyles.forEach(style => {
        if (content.includes(style)) {
            console.log(`✅ Estilo ${style}: Encontrado`);
        } else {
            console.log(`❌ Estilo ${style}: AUSENTE`);
            isValid = false;
        }
    });

    return isValid;
}

function main() {
    console.log('🌙 ☀️ Validação do Sistema Dark/Light Mode\n');
    console.log('='.repeat(50));

    let allValid = true;

    // Validar páginas principais
    MAIN_PAGES.forEach(page => {
        if (!validatePage(page)) {
            allValid = false;
        }
    });

    // Validar CSS
    if (!validateCSS()) {
        allValid = false;
    }

    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (allValid) {
        console.log('🎉 SUCESSO: Todas as validações passaram!');
        console.log('✅ O sistema de dark/light mode está corretamente implementado.');
    } else {
        console.log('❌ FALHA: Algumas validações falharam.');
        console.log('⚠️  Verifique os erros acima e corrija antes de prosseguir.');
    }

    return allValid;
}

// Executar validação se chamado diretamente
if (require.main === module) {
    const success = main();
    process.exit(success ? 0 : 1);
}

module.exports = { validatePage, validateCSS, main };
