const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const { autenticar } = require('../middleware/auth');

// Endpoint para análise de código com Gemini AI
router.post('/analyze', autenticar, async (req, res) => {
    try {
        const { files, missionContext } = req.body;
        
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Arquivos são obrigatórios para análise' 
            });
        }

        // Verificar se a API key está configurada
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ 
                success: false, 
                error: 'Chave da API Gemini não configurada' 
            });
        }

        // Construir o prompt para análise
        const prompt = buildAnalysisPrompt(files, missionContext);
        
        // Fazer chamada para o Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API do Gemini: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Resposta inválida da API do Gemini');
        }

        const feedback = data.candidates[0].content.parts[0].text;

        res.json({
            success: true,
            feedback: feedback,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao analisar código com Gemini:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Constrói o prompt para análise do Gemini
 */
function buildAnalysisPrompt(files, missionContext) {
    const mission = missionContext?.title || 'Missão não especificada';
    const description = missionContext?.description || '';
    
    let prompt = `
# Análise de Submissão de Código - Sistema Educacional RPG

## Contexto da Missão
**Título:** ${mission}
**Descrição:** ${description}

## Arquivos Submetidos
`;

    files.forEach((file, index) => {
        prompt += `
### Arquivo ${index + 1}: ${file.name}
**Tipo:** ${file.type || 'text'}
**Tamanho:** ${file.size || 0} bytes

\`\`\`${file.type || 'text'}
${file.content || '[Conteúdo não disponível]'}
\`\`\`

`;
    });

    prompt += `
## Tarefa de Análise

Por favor, analise os arquivos submetidos e forneça um feedback educacional detalhado seguindo esta estrutura:

### 📊 **Pontuação Geral**: [0-100]

### ✅ **Pontos Positivos**
- Liste os aspectos bem implementados
- Destaque boas práticas de programação
- Reconheça soluções criativas

### ⚠️ **Áreas de Melhoria**
- Identifique problemas no código
- Sugira melhorias específicas
- Aponte erros de sintaxe ou lógica

### 💡 **Sugestões Detalhadas**
- Forneça dicas práticas para melhorar
- Sugira recursos de aprendizado
- Indique próximos passos

### 🎯 **Cumprimento dos Objetivos**
- Avalie se a submissão atende aos requisitos da missão
- Identifique objetivos alcançados e não alcançados

### 📚 **Recursos Recomendados**
- Sugira materiais de estudo
- Indique documentações relevantes
- Recomende exercícios complementares

**Importante:** 
- Use linguagem encorajadora e educativa
- Seja específico nas sugestões
- Foque no aprendizado do aluno
- Use emojis para tornar o feedback mais visual e engajante
`;

    return prompt;
}

module.exports = router;
