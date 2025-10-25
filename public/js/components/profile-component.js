// File: public/js/components/profile-component.js (Updated)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Modal and Button Elements
    const editModal = document.getElementById('edit-modal');
    const deleteModal = document.getElementById('delete-modal');
    const logoutModal = document.getElementById('logout-modal'); // 👈 ADDED
    
    const editBtn = document.getElementById('edit-profile-btn');
    const deleteBtn = document.getElementById('delete-account-btn');
    const logoutBtn = document.getElementById('logout-btn'); // 👈 ADDED
    
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn'); // 👈 ADDED
    
    const editForm = document.getElementById('edit-profile-form');
    const deleteForm = document.getElementById('delete-profile-form');
    const logoutForm = document.getElementById('logout-profile-form'); // 👈 ADDED

    // --- Modal Control Functions ---
    const openModal = (modal) => {
        if (modal) modal.classList.remove('hidden');
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.add('hidden');
    };

    // 2. Event Listeners for Opening Modals
    if (editBtn) editBtn.addEventListener('click', () => openModal(editModal));
    if (deleteBtn) deleteBtn.addEventListener('click', () => openModal(deleteModal));
    if (logoutBtn) logoutBtn.addEventListener('click', () => openModal(logoutModal)); // 👈 ADDED
    
    // 3. Event Listeners for Closing Modals (Cancel Buttons)
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(editModal);
    });

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(deleteModal);
    });
    
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', (e) => { // 👈 ADDED
        e.preventDefault();
        closeModal(logoutModal);
    });

    // 4. Close Modals on Backdrop Click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Check if the click occurred directly on the backdrop (the modal element itself)
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // --- 5. Form Submission Logic (using Fetch for PUT/DELETE/LOGOUT) ---

    // === EDIT FORM (PUT Request) ===
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // ... (Edit logic remains the same) ...

            const formData = new URLSearchParams(new FormData(editForm)).toString();
            const actionUrl = editForm.action; 

            try {
                const response = await fetch(actionUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });

                if (response.ok) {
                    alert('Profile updated successfully!');
                    closeModal(editModal);
                    window.location.reload(); 
                } else {
                    const errorData = await response.json();
                    alert(`Update failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during profile update:', error);
                alert('An unexpected error occurred during profile update.');
            }
        });
    }

    // === DELETE FORM (DELETE Request) ===
    if (deleteForm) {
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const actionUrl = deleteForm.action; 
            
            try {
                const response = await fetch(actionUrl, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Account deleted successfully! You will now be logged out.');
                    // The server's delete endpoint should also clear the token, but we redirect to login for safety
                    window.location.href = '/login'; 
                } else {
                    const errorData = await response.json();
                    alert(`Deletion failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during account deletion:', error);
                alert('An unexpected error occurred during account deletion.');
            }
        });
    }

    // === LOGOUT FORM (Standard GET/POST Submission) === // 👈 ADDED
    if (logoutForm) {
        // Since logout is a simple POST/GET that the server handles via redirect, 
        // we can let the native form submission handle the logic. 
        // The controller clears the cookie and redirects to /login.
        logoutForm.addEventListener('submit', () => {
             // Optional: Add a small delay for user feedback if needed, but native form submit is fastest.
        });
    }
});