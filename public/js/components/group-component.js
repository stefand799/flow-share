// File: public/js/components/group-component.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Modal and Button Elements
    const editModal = document.getElementById('edit-modal');
    const deleteModal = document.getElementById('delete-modal');
    const editBtn = document.getElementById('edit-group-btn');
    const deleteBtn = document.getElementById('delete-group-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const editForm = document.getElementById('edit-group-form');
    const deleteForm = document.getElementById('delete-group-form');
    const groupId = document.getElementById('group-details')?.dataset.groupId; // Get group ID from EJS data attribute

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
    
    // 3. Event Listeners for Closing Modals (Cancel Buttons)
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(editModal);
    });

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(deleteModal);
    });

    // 4. Close Modals on Backdrop Click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // --- 5. Form Submission Logic (using Fetch for PUT/DELETE) ---

    // === EDIT FORM (PUT Request) ===
    if (editForm && groupId) {
        // The EJS template sets the action="/api/groups/<%= group.id %>"
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect form data and encode it for x-www-form-urlencoded format
            // NOTE: URLSearchParams automatically includes the input fields (name, description, whatsappGroupUrl)
            const formData = new URLSearchParams(new FormData(editForm)).toString();
            // Use the base URL defined in the EJS action (e.g., /api/groups/123)
            const actionUrl = editForm.action; 

            try {
                const response = await fetch(actionUrl, {
                    method: 'PUT', // Use PUT method for update
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData,
                });

                if (response.ok) {
                    alert('Group updated successfully!');
                    closeModal(editModal);
                    // Reload the page to display the new data
                    window.location.reload(); 
                } else {
                    const errorData = await response.json();
                    alert(`Update failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during group update:', error);
                alert('An unexpected error occurred during group update.');
            }
        });
    }


    // === DELETE FORM (DELETE Request) ===
    if (deleteForm && groupId) {
        // The EJS template sets the action="/api/groups/<%= group.id %>"
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const actionUrl = deleteForm.action; 
            
            try {
                const response = await fetch(actionUrl, {
                    method: 'DELETE', // Use DELETE method
                });

                if (response.ok) {
                    alert('Group deleted successfully!');
                    // Redirect to the dashboard/groups list after deletion
                    window.location.href = '/dashboard'; 
                } else {
                    const errorData = await response.json();
                    alert(`Deletion failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error during group deletion:', error);
                alert('An unexpected error occurred during group deletion.');
            }
        });
    }
});
