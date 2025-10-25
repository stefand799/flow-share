// File: public/js/components/group-component.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // GET MODAL AND BUTTON ELEMENTS
    // ============================================
    
    const addMemberModal = document.getElementById('add-member-modal');
    const editModal = document.getElementById('edit-modal');
    const deleteModal = document.getElementById('delete-modal');
    
    const addMemberBtn = document.getElementById('add-member-btn');
    const editBtn = document.getElementById('edit-group-btn');
    const deleteBtn = document.getElementById('delete-group-btn');
    
    const cancelAddMemberBtn = document.getElementById('cancel-add-member-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    
    const addMemberForm = document.getElementById('add-member-form');
    const editForm = document.getElementById('edit-group-form');
    const deleteForm = document.getElementById('delete-group-form');

    // ============================================
    // MODAL CONTROL FUNCTIONS
    // ============================================
    
    const openModal = (modal) => {
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeModal = (modal) => {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    };

    // ============================================
    // OPEN MODAL EVENT LISTENERS
    // ============================================
    
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => openModal(addMemberModal));
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', () => openModal(editModal));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => openModal(deleteModal));
    }

    // ============================================
    // CLOSE MODAL EVENT LISTENERS
    // ============================================
    
    if (cancelAddMemberBtn) {
        cancelAddMemberBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(addMemberModal);
        });
    }

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

    // ============================================
    // CLOSE MODALS ON BACKDROP CLICK
    // ============================================
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // ============================================
    // ADD MEMBER FORM SUBMISSION
    // ============================================
    
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(addMemberForm);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/groups/add-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    alert('Member added successfully!');
                    closeModal(addMemberModal);
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.message || 'Failed to add member'}`);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('An unexpected error occurred.');
            }
        });
    }

    // ============================================
    // EDIT GROUP FORM SUBMISSION
    // ============================================
    
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(editForm);
            const data = Object.fromEntries(formData);
            const actionUrl = editForm.action;

            try {
                const response = await fetch(actionUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    alert('Group updated successfully!');
                    closeModal(editModal);
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Update failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('An unexpected error occurred.');
            }
        });
    }

    // ============================================
    // DELETE GROUP FORM SUBMISSION
    // ============================================
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const actionUrl = deleteForm.action;

            try {
                const response = await fetch(actionUrl, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Group deleted successfully!');
                    window.location.href = '/dashboard';
                } else {
                    const errorData = await response.json();
                    alert(`Deletion failed: ${errorData.message || 'Server error'}`);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('An unexpected error occurred.');
            }
        });
    }
});