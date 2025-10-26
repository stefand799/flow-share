// ============================================
// MODAL.JS - Modal Utility Functions
// ============================================
// 
// This file provides reusable modal functionality:
// - Open/close modals
// - Modal event listeners
// - ESC key to close
// - Click outside to close
// 
// Usage:
//   openModal('modal-id')
//   closeModal('modal-id')
// 
// Dependencies: None (standalone utility)
// ============================================

/**
 * Opens a modal by ID
 * @param {string} modalId - The ID of the modal to open
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Focus first input in modal if exists
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Closes a modal by ID
 * @param {string} modalId - The ID of the modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Clear form inputs if modal contains a form
        const form = modal.querySelector('form');
        if (form) {
            // Optional: uncomment to clear form on close
            // form.reset();
        }
    }
}

/**
 * Closes all open modals
 */
function closeAllModals() {
    const activeModals = document.querySelectorAll('.modal.active');
    activeModals.forEach(modal => {
        modal.classList.add('hidden');
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/**
 * Initialize modal event listeners
 * Should be called after DOM is loaded
 */
function initializeModals() {
    
    // Close button handlers (X button)
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal && modal.id) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal buttons (buttons with data-close-modal attribute)
    const closeModalButtons = document.querySelectorAll('[data-close-modal]');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    // Open modal buttons (buttons with data-open-modal attribute)
    const openModalButtons = document.querySelectorAll('[data-open-modal]');
    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-open-modal');
            if (modalId) {
                openModal(modalId);
            }
        });
    });
    
    // Click overlay to close
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            if (modal && modal.id) {
                closeModal(modal.id);
            }
        });
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModals);
} else {
    initializeModals();
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { openModal, closeModal, closeAllModals, initializeModals };
}