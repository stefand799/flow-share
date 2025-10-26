// ============================================
// LAYOUT.JS - Main Layout JavaScript
// ============================================
// 
// This file handles:
// - Logout button click (opens confirmation modal)
// - Logout confirmation (sends POST to /auth/logout)
// - Navbar interactions
//
// Dependencies: modal.js (for modal utilities)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // LOGOUT FUNCTIONALITY
    // ============================================
    
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    
    // Open logout confirmation modal when logout button clicked
    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
            logoutModal.classList.add('active');
        });
    }
    
    // Handle actual logout when confirmed
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            try {
                // Disable button during request
                confirmLogoutBtn.disabled = true;
                confirmLogoutBtn.textContent = 'Logging out...';
                
                // Send logout request
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Redirect to login page on success
                    window.location.href = '/login';
                } else {
                    // Show error if logout failed
                    alert('Logout failed. Please try again.');
                    confirmLogoutBtn.disabled = false;
                    confirmLogoutBtn.textContent = 'Logout';
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An error occurred during logout. Please try again.');
                confirmLogoutBtn.disabled = false;
                confirmLogoutBtn.textContent = 'Logout';
            }
        });
    }
    
    // ============================================
    // MODAL CLOSE HANDLERS (for logout modal)
    // ============================================
    
    // Close modal when clicking close button
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal when clicking X button
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal when clicking overlay
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.add('hidden');
                activeModal.classList.remove('active');
            }
        }
    });
    
    // ============================================
    // NAVBAR ACTIVE STATE
    // ============================================
    
    // Add active class to current page link if needed
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
    
});