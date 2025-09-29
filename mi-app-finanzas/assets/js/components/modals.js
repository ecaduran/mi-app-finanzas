// Crear y mostrar un modal genérico
export const showModal = ({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) => {
    try {
        // Remover cualquier modal existente
        const existingModal = document.getElementById('modal');
        if (existingModal) existingModal.remove();

        // Crear el modal
        const modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 modal-content">
                <h2 class="text-lg font-semibold mb-4">${title}</h2>
                <p class="mb-4">${message}</p>
                <div class="flex justify-end gap-2">
                    <button id="modal-cancel" class="btn bg-gray-500">${cancelText}</button>
                    <button id="modal-confirm" class="btn bg-blue-500">${confirmText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animación de entrada
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            modalContent.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 10);

        // Manejar eventos
        const confirmBtn = modal.querySelector('#modal-confirm');
        const cancelBtn = modal.querySelector('#modal-cancel');

        confirmBtn.focus(); // Foco inicial para accesibilidad

        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            closeModal();
        });

        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            closeModal();
        });

        // Cerrar con tecla Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (onCancel) onCancel();
                closeModal();
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Limpiar evento al cerrar
        modal._handleEscape = handleEscape;
    } catch (error) {
        console.error('Error en showModal:', error);
    }
};

// Cerrar el modal
export const closeModal = () => {
    try {
        const modal = document.getElementById('modal');
        if (!modal) return;

        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';

        setTimeout(() => {
            modal.remove();
            document.removeEventListener('keydown', modal._handleEscape);
        }, 200);
    } catch (error) {
        console.error('Error en closeModal:', error);
    }
};

// Mostrar un modal de formulario (ej. para añadir meta)
export const showFormModal = ({ title, fields, confirmText = 'Guardar', cancelText = 'Cancelar', onSubmit }) => {
    try {
        const existingModal = document.getElementById('modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 modal-content">
                <h2 class="text-lg font-semibold mb-4">${title}</h2>
                <form id="modal-form" class="space-y-4">
                    ${fields.map(field => `
                        <div>
                            <label for="${field.id}" class="block">${field.label}</label>
                            <input id="${field.id}" type="${field.type}" class="input w-full" required ${field.type === 'number' ? 'min="0"' : ''}>
                            <span id="${field.id}-error" class="error hidden"></span>
                        </div>
                    `).join('')}
                    <div class="flex justify-end gap-2">
                        <button type="button" id="modal-cancel" class="btn bg-gray-500">${cancelText}</button>
                        <button type="submit" id="modal-confirm" class="btn bg-blue-500">${confirmText}</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Animación de entrada
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.transform = 'scale(0.8)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            modalContent.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 10);

        // Manejar eventos
        const form = modal.querySelector('#modal-form');
        const confirmBtn = modal.querySelector('#modal-confirm');
        const cancelBtn = modal.querySelector('#modal-cancel');

        confirmBtn.focus();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const values = {};
            fields.forEach(field => {
                values[field.id] = field.type === 'number'
                    ? Number(document.getElementById(field.id).value)
                    : document.getElementById(field.id).value;
            });
            if (onSubmit) onSubmit(values);
            closeModal();
        });

        cancelBtn.addEventListener('click', () => closeModal());

        // Cerrar con tecla Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', handleEscape);
        modal._handleEscape = handleEscape;
    } catch (error) {
        console.error('Error en showFormModal:', error);
    }
};
