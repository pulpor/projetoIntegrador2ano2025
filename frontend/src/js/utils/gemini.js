// Sistema de Feedback Automático com Gemini AI
// Arquivo: gemini.js

export class GeminiAPI {
    constructor() {
        this.apiKey = 'AIzaSyD89OyI9jpSfvw1dQeN3dAW0ERf_FK1uzg';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    }

    /**
     * Analisa arquivos de código e gera feedback automático
     * @param {Array} files - Array de arquivos para analisar
     * @param {Object} missionContext - Contexto da missão (título, descrição, objetivos)
     * @returns {Promise<Object>} - Feedback gerado pelo Gemini
     */
    async analyzeSubmission(files, missionContext = {}) {
        try {
            // Preparar o conteúdo dos arquivos
            const filesContent = await this.prepareFilesContent(files);
            
            // Construir o prompt para o Gemini
            const prompt = this.buildAnalysisPrompt(filesContent, missionContext);
            
            // Fazer a requisição para o Gemini API
            const response = await this.callGeminiAPI(prompt);
            
            return {
                success: true,
                feedback: response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao analisar submissão com Gemini:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Prepara o conteúdo dos arquivos para análise
     * @param {Array} files - Array de arquivos
     * @returns {Promise<Array>} - Conteúdo dos arquivos formatado
     */
    async prepareFilesContent(files) {
        const filesContent = [];

        for (const file of files) {
            try {
                const content = await this.readFileContent(file);
                filesContent.push({
                    name: file.name,
                    type: this.getFileType(file.name),
                    size: file.size,
                    content: content
                });
            } catch (error) {
                console.warn(`Erro ao ler arquivo ${file.name}:`, error);
                filesContent.push({
                    name: file.name,
                    type: this.getFileType(file.name),
                    size: file.size,
                    content: '[Erro ao ler arquivo]',
                    error: error.message
                });
            }
        }

        return filesContent;
    }

    /**
     * Lê o conteúdo de um arquivo
     * @param {File} file - Arquivo para ler
     * @returns {Promise<string>} - Conteúdo do arquivo
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('Erro ao ler arquivo'));
            };
            
            // Verificar se é um arquivo de texto
            if (this.isTextFile(file.name)) {
                reader.readAsText(file);
            } else {
                // Para arquivos binários, retornar informações básicas
                resolve(`[Arquivo binário: ${file.name}, Tamanho: ${file.size} bytes]`);
            }
        });
    }

    /**
     * Constrói o prompt para análise do Gemini
     * @param {Array} filesContent - Conteúdo dos arquivos
     * @param {Object} missionContext - Contexto da missão
     * @returns {string} - Prompt formatado
     */
    buildAnalysisPrompt(filesContent, missionContext) {
        const mission = missionContext.title || 'Missão não especificada';
        const description = missionContext.description || '';
        
        let prompt = `
# Análise de Submissão de Código - Sistema Educacional RPG

## Contexto da Missão
**Título:** ${mission}
**Descrição:** ${description}

## Arquivos Submetidos
`;

        filesContent.forEach((file, index) => {
            prompt += `
### Arquivo ${index + 1}: ${file.name}
**Tipo:** ${file.type}
**Tamanho:** ${file.size} bytes

\`\`\`${file.type}
${file.content}
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

    /**
     * Faz a chamada para a API do Gemini
     * @param {string} prompt - Prompt para análise
     * @returns {Promise<string>} - Resposta do Gemini
     */
    async callGeminiAPI(prompt) {
        const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
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

        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Determina o tipo de arquivo baseado na extensão
     * @param {string} filename - Nome do arquivo
     * @returns {string} - Tipo do arquivo
     */
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const types = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'txt': 'text',
            'sql': 'sql'
        };
        return types[extension] || 'text';
    }

    /**
     * Verifica se um arquivo é de texto (pode ser lido como string)
     * @param {string} filename - Nome do arquivo
     * @returns {boolean} - True se for arquivo de texto
     */
    isTextFile(filename) {
        const textExtensions = [
            'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs',
            'html', 'css', 'scss', 'sass', 'json', 'xml', 'md', 'txt', 'sql', 'yml', 'yaml',
            'ini', 'conf', 'config', 'log', 'csv', 'sh', 'bat', 'ps1'
        ];
        const extension = filename.split('.').pop().toLowerCase();
        return textExtensions.includes(extension);
    }
}

// Instância singleton para uso global
export const gemini = new GeminiAPI();
