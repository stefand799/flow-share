// File: public/js/components/profile-component.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // GET MODAL AND BUTTON ELEMENTS
    // ============================================
    
    const editModal = document.getElementById('edit-modal');
    const deleteModal = document.getElementById('delete-modal');
    const logoutModal = document.getElementById('logout-modal');
    
    const editBtn = document.getElementById('edit-profile-btn');
    const deleteBtn = document.getElementById('delete-account-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    
    const editForm = document.getElementById('edit-profile-form');
    const deleteForm = document.getElementById('delete-profile-form');
    const logoutForm = document.getElementById('logout-profile-form');

    // ============================================
    // MODAL CONTROL FUNCTIONS
    // ============================================
    
    const openModal = (modal) => {
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    };

    const closeModal = (modal) => {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }
    };

    // ============================================
    // OPEN MODAL EVENT LISTENERS
    // ============================================
    
    if (editBtn) {
        editBtn.addEventListener('click', () => openModal(editModal));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => openModal(deleteModal));
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => openModal(logoutModal));
    }

    // ============================================
    // CLOSE MODAL EVENT LISTENERS (Cancel Buttons)
    // ============================================
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(editModal);
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(deleteModal);
        });
    }
    
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(logoutModal);
        });
    }

    // ============================================
    // CLOSE MODALS ON BACKDROP CLICK
    // ============================================
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // ============================================
    // EDIT FORM SUBMISSION (PUT Request)
    // ============================================
    
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(editForm);
            const data = Object.fromEntries(formData);
            
            // Get user ID from the profile details
            const userId = document.getElementById('profile-details').dataset.userId;
            const actionUrl = `/api/users/${userId}`;

            try {
                const response = await fetch(actionUrl, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    const result = await response.json();
                    alert('Profile updated successfully!');
                    closeModal(editModal);
                    
                    // Reload page to show updated data
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Update failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during profile update:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    }

    // ============================================
    // DELETE FORM SUBMISSION (DELETE Request)
    // ============================================
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get user ID
            const userId = document.getElementById('profile-details').dataset.userId;
            const actionUrl = `/api/users/${userId}`;
            
            try {
                const response = await fetch(actionUrl, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Account deleted successfully. You will now be logged out.');
                    // Redirect to login page
                    window.location.href = '/login';
                } else {
                    const errorData = await response.json();
                    alert(`Deletion failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during account deletion:', error);
                alert('An unexpected error occurred. Please try again.');
            }
        });
    }

    // ============================================
    // LOGOUT FORM SUBMISSION (POST Request)
    // ============================================
    
    if (logoutForm) {
        // Logout form uses standard form submission
        // The server will handle clearing the cookie and redirecting
        logoutForm.addEventListener('submit', () => {
            // Let the form submit naturally to /auth/logout
        });
    }
});