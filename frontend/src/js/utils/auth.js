// ===== UTILITÁRIOS DE AUTENTICAÇÃO =====
import { showError, showWarning } from './toast.js';

const API_URL = 'http://localhost:3000';

export function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return false;

        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp && new Date() > new Date(payload.exp * 1000)) return false;

        return true;
    } catch (e) {
        return false;
    }
}

export function validateAuthentication() {
    // Modo debug
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
        localStorage.setItem('token', 'debug-token');
        localStorage.setItem('isMaster', 'true');
        localStorage.setItem('username', 'debug-master');
        showWarning('Modo debug ativado - autenticação simulada');
        return true;
    }

    const token = localStorage.getItem('token');
    const isMaster = localStorage.getItem('isMaster');

    if (!token || isMaster !== 'true' || !isTokenValid()) {
        showError('Acesso negado. Faça login como Mestre.');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }

    return true;
}

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        ...options
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}
