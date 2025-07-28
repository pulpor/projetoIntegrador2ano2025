const BASE_URL = 'http://localhost:3000';

export const API = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro na requisição');
            }

            return response.json();
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }
};
