// ===== BOTÕES E AÇÕES =====
import { setupEventListeners } from './interface.js';
import { showPenaltyRewardModal, showStudentHistoryModal } from './modals.js';
import { showSuccess, showError, confirmAction } from './toast.js';
import { apiRequest } from './auth.js';

export function setupAllButtonEvents() {
    setupUserActionButtons();
    setupStudentActionButtons();
    setupSubmissionButtons();
    setupMissionButtons();
}

// Alias para compatibilidade
export const setupButtons = setupAllButtonEvents;

function setupUserActionButtons() {
    setupEventListeners('.approve-btn', async (e) => {
        const userId = e.target.closest('button').getAttribute('data-user-id');
        await userAction('approve-user', { userId: parseInt(userId) }, 'Usuário aprovado!');
        // Chamar as funções de recarregamento com tratamento de erro
        try {
            if (typeof loadPendingUsers === 'function') loadPendingUsers();
            if (typeof loadApprovedStudents === 'function') loadApprovedStudents();
        } catch (loadError) {
            console.error('Erro ao recarregar listas de usuários:', loadError);
        }
    });

    setupEventListeners('.reject-btn', async (e) => {
        const userId = e.target.closest('button').getAttribute('data-user-id');
        const userName = e.target.closest('.bg-white').querySelector('h3').textContent;

        confirmAction(
            `Rejeitar o usuário "${userName}"?`,
            async () => {
                await userAction('reject-user', { userId: parseInt(userId) }, 'Usuário rejeitado!');
                try {
                    if (typeof loadPendingUsers === 'function') loadPendingUsers();
                } catch (loadError) {
                    console.error('Erro ao recarregar usuários pendentes:', loadError);
                }
            }
        );
    });
}

function setupStudentActionButtons() {
    setupEventListeners('.penalty-btn', async (e) => {
        const studentId = e.target.closest('button').getAttribute('data-student-id');
        const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

        const result = await showPenaltyRewardModal('penalty', studentName);
        if (result) {
            await userAction('penalty', {
                studentId: parseInt(studentId),
                penalty: result.amount,
                reason: result.reason
            }, `Penalidade aplicada em ${studentName}`);
            try {
                if (typeof loadApprovedStudents === 'function') loadApprovedStudents();
            } catch (loadError) {
                console.error('Erro ao recarregar estudantes após penalidade:', loadError);
            }
        }
    });

    setupEventListeners('.reward-btn', async (e) => {
        const studentId = e.target.closest('button').getAttribute('data-student-id');
        const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

        const result = await showPenaltyRewardModal('reward', studentName);
        if (result) {
            await userAction('reward', {
                studentId: parseInt(studentId),
                reward: result.amount,
                reason: result.reason
            }, `Recompensa dada para ${studentName}`);
            try {
                if (typeof loadApprovedStudents === 'function') loadApprovedStudents();
            } catch (loadError) {
                console.error('Erro ao recarregar estudantes após recompensa:', loadError);
            }
        }
    });

    setupEventListeners('.history-btn', async (e) => {
        const studentId = e.target.closest('button').getAttribute('data-student-id');
        const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;
        await showStudentHistoryModal(parseInt(studentId), studentName);
    });

    setupEventListeners('.expel-btn', async (e) => {
        const studentId = e.target.closest('button').getAttribute('data-student-id');
        const studentName = e.target.closest('.bg-white').querySelector('h3').textContent;

        confirmAction(
            `⚠️ Expulsar "${studentName}"?\n\nEsta ação não pode ser desfeita!`,
            async () => {
                await userAction('expel-student', { studentId: parseInt(studentId) }, 'Aluno expulso!');
                try {
                    if (typeof loadApprovedStudents === 'function') loadApprovedStudents();
                } catch (loadError) {
                    console.error('Erro ao recarregar estudantes após expulsão:', loadError);
                }
            }
        );
    });
}

function setupSubmissionButtons() {
    setupEventListeners('.approve-submission-btn', async (e) => {
        const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));
        await submissionAction(submissionId, 'approve', 'Submissão aprovada!');
    });

    setupEventListeners('.reject-submission-btn', async (e) => {
        const submissionId = parseInt(e.target.closest('button').getAttribute('data-submission-id'));

        confirmAction(
            'Rejeitar esta submissão?',
            async () => {
                await submissionAction(submissionId, 'reject', 'Submissão rejeitada!');
            }
        );
    });
}

function setupMissionButtons() {
    setupEventListeners('.edit-mission-btn', async (e) => {
        const missionId = e.target.closest('button').getAttribute('data-mission-id');
        if (typeof editMission === 'function') {
            await editMission(missionId);
        }
    });

    setupEventListeners('.delete-mission-btn', async (e) => {
        const missionTitle = e.target.closest('.bg-white').querySelector('h3').textContent;
        const missionId = e.target.closest('button').getAttribute('data-mission-id');

        confirmAction(
            `⚠️ Excluir "${missionTitle}"?\n\nEsta ação não pode ser desfeita!`,
            async () => {
                if (typeof missionAction === 'function') {
                    await missionAction(missionId, 'DELETE', 'Missão excluída!');
                }
            }
        );
    });
}

async function userAction(endpoint, data, successMessage) {
    try {
        const response = await apiRequest(`/usuarios/${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const message = response?.message || successMessage;
        showSuccess(message);
    } catch (err) {
        showError(`Erro: ${err.message}`);
    }
}

async function submissionAction(submissionId, action, successMessage) {
    try {
        console.log(`[SUBMISSION ACTION] Iniciando ${action} para submissão ${submissionId}`);
        const result = await apiRequest(`/submissoes/${submissionId}/${action}`, { method: 'POST' });
        console.log(`[SUBMISSION ACTION] Resultado:`, result);
        showSuccess(successMessage);

        // Tentar recarregar submissões com tratamento de erro
        try {
            if (typeof loadSubmissions === 'function') {
                console.log(`[SUBMISSION ACTION] Recarregando submissões...`);
                await loadSubmissions();
                console.log(`[SUBMISSION ACTION] Submissões recarregadas com sucesso`);
            } else {
                console.warn(`[SUBMISSION ACTION] loadSubmissions não é uma função`);
            }
        } catch (loadError) {
            console.error(`[SUBMISSION ACTION] Erro ao recarregar submissões:`, loadError);
            // Não exibir erro para o usuário, pois a ação principal já foi bem-sucedida
        }

        console.log(`[SUBMISSION ACTION] ${action} completado com sucesso`);
    } catch (err) {
        console.error(`[SUBMISSION ACTION] Erro em ${action}:`, err);
        showError(`Erro: ${err.message}`);
    }
}
