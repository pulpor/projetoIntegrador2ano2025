// ===== MODAIS =====
export async function showPenaltyRewardModal(type, studentName) {
    return new Promise((resolve) => {
        const isReward = type === 'reward';
        const title = isReward ? 'Aplicar Recompensa' : 'Aplicar Penalidade';
        const icon = isReward ? '🎁' : '⚠️';
        const color = isReward ? 'purple' : 'red';
        const actionText = isReward ? 'adicionar' : 'remover';

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-2">${icon}</span>
          <h3 class="text-lg font-bold text-${color}-600">${title}</h3>
        </div>
        
        <p class="mb-4 text-gray-700">
          ${type === 'reward' ? 'Recompensa' : 'Penalidade'} para: <strong>${studentName}</strong>
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            XP a ${actionText}: <span class="text-red-500">*</span>
          </label>
          <input 
            type="number" 
            id="xp-amount" 
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-${color}-500" 
            placeholder="1-1000 XP"
            min="1" max="1000" step="1"
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Motivo: <span class="text-red-500">*</span>
          </label>
          <textarea 
            id="reason-text" 
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-${color}-500" 
            placeholder="Mínimo 3 caracteres..."
            rows="3" maxlength="200"
          ></textarea>
          <div class="text-xs text-gray-500 mt-1" id="char-count">0/200 caracteres</div>
        </div>
        
        <div class="flex space-x-3">
          <button id="cancel-btn" class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
            Cancelar
          </button>
          <button id="confirm-btn" class="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed" disabled>
            ${isReward ? 'Aplicar Recompensa' : 'Aplicar Penalidade'}
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        const amountInput = modal.querySelector('#xp-amount');
        const reasonInput = modal.querySelector('#reason-text');
        const charCount = modal.querySelector('#char-count');
        const confirmBtn = modal.querySelector('#confirm-btn');

        amountInput.focus();

        // Validação em tempo real
        const validateForm = () => {
            const amount = amountInput.value.trim();
            const reason = reasonInput.value.trim();
            const isValid = amount && !isNaN(amount) && parseInt(amount) > 0 && parseInt(amount) <= 1000 && reason.length >= 3;

            confirmBtn.disabled = !isValid;
            confirmBtn.className = isValid
                ? `flex-1 px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition`
                : `flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed`;
        };

        // Event listeners
        reasonInput.addEventListener('input', () => {
            const length = reasonInput.value.length;
            charCount.textContent = `${length}/200 caracteres`;
            charCount.className = length > 190 ? 'text-xs text-red-500 mt-1' : 'text-xs text-gray-500 mt-1';
            validateForm();
        });

        amountInput.addEventListener('input', validateForm);

        modal.querySelector('#cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });

        modal.querySelector('#confirm-btn').addEventListener('click', () => {
            const amount = amountInput.value.trim();
            const reason = reasonInput.value.trim();

            if (confirmBtn.disabled) return;

            document.body.removeChild(modal);
            resolve({ amount: parseInt(amount), reason: reason.trim() });
        });

        // Escape e click fora
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.querySelector('#cancel-btn').click();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.querySelector('#cancel-btn').click();
        });
    });
}

export async function showStudentHistoryModal(studentId, studentName) {
    try {
        const historyData = await window.apiRequest(`/usuarios/student-history/${studentId}`);

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        const historyHTML = historyData.history.length > 0
            ? historyData.history.map(entry => {
                const date = new Date(entry.appliedAt).toLocaleString('pt-BR');
                const isReward = entry.type === 'reward';
                const icon = isReward ? '🎁' : '⚠️';
                const color = isReward ? 'text-green-600' : 'text-red-600';
                const action = isReward ? 'Recompensa' : 'Penalidade';
                const xpChange = isReward ? `+${entry.amount}` : `-${entry.amount}`;

                return `
            <div class="border-l-4 ${isReward ? 'border-green-500' : 'border-red-500'} pl-4 py-3 mb-3 bg-gray-50 rounded-r">
              <div class="flex justify-between items-start">
                <div class="flex items-center">
                  <span class="text-lg mr-2">${icon}</span>
                  <div>
                    <span class="font-semibold ${color}">${action}: ${xpChange} XP</span>
                    <div class="text-sm text-gray-600">XP: ${entry.oldXp} → ${entry.newXp}</div>
                  </div>
                </div>
                <div class="text-right text-xs text-gray-500">
                  <div>${date}</div>
                  <div>Por: ${entry.appliedByName}</div>
                </div>
              </div>
              <div class="mt-2 text-sm text-gray-700">
                <strong>Motivo:</strong> ${entry.reason}
              </div>
            </div>
          `;
            }).join('')
            : '<div class="text-center text-gray-500 py-8">Nenhuma ação registrada.</div>';

        modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-history text-blue-600 mr-3"></i>Histórico de ${studentName}
          </h3>
          <button id="close-btn" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-6 border-b bg-gray-50">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">${historyData.student.currentXp}</div>
              <div class="text-sm text-gray-600">XP Atual</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">${historyData.student.level}</div>
              <div class="text-sm text-gray-600">Nível</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-600">${historyData.totalEntries}</div>
              <div class="text-sm text-gray-600">Registros</div>
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <h4 class="text-lg font-semibold mb-4 text-gray-700">Timeline</h4>
          ${historyHTML}
        </div>
        
        <div class="p-4 border-t bg-gray-50">
          <button id="close-modal-btn" class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
            Fechar
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);

        const closeModal = () => document.body.removeChild(modal);

        modal.querySelector('#close-btn').addEventListener('click', closeModal);
        modal.querySelector('#close-modal-btn').addEventListener('click', closeModal);

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

    } catch (err) {
        alert(`Erro ao carregar histórico: ${err.message}`);
    }
}
