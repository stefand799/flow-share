// ============================================
// GROUP-COMPONENT.JS - Group Component JavaScript
// ============================================
// 
// This file handles:
// - Add member modal and API call
// - Edit group modal and API call (admin only)
// - Delete group modal and API call (admin only)
// - Form validation
// 
// Dependencies: modal.js, dashboardUtils (from dashboard-page.js)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const groupCard = document.getElementById('group-card');
    const groupId = groupCard?.dataset.groupId;
    
    // Buttons
    const addMemberBtn = document.getElementById('add-member-btn');
    const editGroupBtn = document.getElementById('edit-group-btn');
    const deleteGroupBtn = document.getElementById('delete-group-btn');
    
    // Add Member
    const addMemberSubmitBtn = document.getElementById('add-member-submit-btn');
    const memberUsernameInput = document.getElementById('member-username');
    
    // Edit Group
    const saveGroupBtn = document.getElementById('save-group-btn');
    const editGroupNameInput = document.getElementById('edit-group-name');
    const editGroupDescriptionInput = document.getElementById('edit-group-description');
    const editWhatsappUrlInput = document.getElementById('edit-whatsapp-url');
    
    // Delete Group
    const confirmDeleteGroupBtn = document.getElementById('confirm-delete-group-btn');
    const deleteGroupConfirmationInput = document.getElementById('delete-group-confirmation-input');
    
    // ============================================
    // WHATSAPP URL VALIDATION
    // ============================================
    
    // Frontend validation commented out - handled by backend
    /*
    function isValidWhatsAppUrl(url) {
        if (!url || url.trim() === '') {
            return true; // Empty is valid (optional field)
        }
        const whatsappPattern = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
        return whatsappPattern.test(url.trim());
    }
    
    // Add validation listener to WhatsApp input
    if (editWhatsappUrlInput) {
        editWhatsappUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            // Only validate if there's content
            if (url && !isValidWhatsAppUrl(url)) {
                showError('whatsapp-url-error', 'Please enter a valid WhatsApp invite link (e.g., https://chat.whatsapp.com/...)');
                this.classList.add('input-error');
            } else {
                clearError('whatsapp-url-error');
                this.classList.remove('input-error');
            }
        });
    }
    */
    
    // ============================================
    // ADD MEMBER FUNCTIONALITY
    // ============================================
    
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            openModal('add-member-modal');
        });
    }
    
    if (addMemberSubmitBtn) {
        addMemberSubmitBtn.addEventListener('click', async () => {
            await addMember();
        });
    }
    
    async function addMember() {
        try {
            const username = memberUsernameInput.value.trim();
            
            if (!username) {
                showError('member-username-error', 'Please enter a username');
                return;
            }
            
            addMemberSubmitBtn.disabled = true;
            addMemberSubmitBtn.textContent = 'Adding...';
            
            // Updated endpoint to match the new route
            const response = await fetch(`/api/members/group/${groupId}/add-by-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add member');
            }
            
            closeModal('add-member-modal');
            memberUsernameInput.value = '';
            window.dashboardUtils?.showSuccess('Member added successfully!');
            
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            console.error('Error adding member:', error);
            window.dashboardUtils?.showError(`Failed to add member: ${error.message}`);
        } finally {
            addMemberSubmitBtn.disabled = false;
            addMemberSubmitBtn.textContent = 'Add Member';
        }
    }
    
    // ============================================
    // EDIT GROUP FUNCTIONALITY (Admin Only)
    // ============================================
    
    if (editGroupBtn) {
        editGroupBtn.addEventListener('click', () => {
            openModal('edit-group-modal');
        });
    }
    
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', async () => {
            await updateGroup();
        });
    }
    
    async function updateGroup() {
        try {
            const name = editGroupNameInput.value.trim();
            const description = editGroupDescriptionInput.value.trim();
            const whatsappUrl = editWhatsappUrlInput?.value.trim() || '';
            
            if (!name || name.length < 3) {
                showError('group-name-error', 'Group name must be at least 3 characters');
                return;
            }
            
            // WhatsApp URL validation removed - handled by backend
            
            saveGroupBtn.disabled = true;
            saveGroupBtn.textContent = 'Saving...';
            
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    description: description || null,
                    whatsappGroupUrl: whatsappUrl || null
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update group');
            }
            
            closeModal('edit-group-modal');
            window.dashboardUtils?.showSuccess('Group updated successfully!');
            
            setTimeout(() => window.location.reload(), 1000);
            
        } catch (error) {
            console.error('Error updating group:', error);
            window.dashboardUtils?.showError(`Failed to update group: ${error.message}`);
        } finally {
            saveGroupBtn.disabled = false;
            saveGroupBtn.textContent = 'Save Changes';
        }
    }
    
    // ============================================
    // DELETE GROUP FUNCTIONALITY (Admin Only)
    // ============================================
    
    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', () => {
            openModal('delete-group-modal');
        });
    }
    
    if (deleteGroupConfirmationInput) {
        deleteGroupConfirmationInput.addEventListener('input', () => {
            const confirmationText = deleteGroupConfirmationInput.value.trim().toUpperCase();
            confirmDeleteGroupBtn.disabled = confirmationText !== 'DELETE';
        });
    }
    
    if (confirmDeleteGroupBtn) {
        confirmDeleteGroupBtn.addEventListener('click', async () => {
            await deleteGroup();
        });
    }
    
    async function deleteGroup() {
        try {
            const confirmationText = deleteGroupConfirmationInput.value.trim().toUpperCase();
            
            if (confirmationText !== 'DELETE') {
                showError('delete-confirmation-error', 'Please type DELETE to confirm');
                return;
            }
            
            confirmDeleteGroupBtn.disabled = true;
            confirmDeleteGroupBtn.textContent = 'Deleting...';
            
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete group');
            }
            
            window.dashboardUtils?.showSuccess('Group deleted successfully! Redirecting...');
            
            setTimeout(() => {
                window.location.href = '/home';
            }, 1500);
            
        } catch (error) {
            console.error('Error deleting group:', error);
            window.dashboardUtils?.showError(`Failed to delete group: ${error.message}`);
            confirmDeleteGroupBtn.disabled = false;
            confirmDeleteGroupBtn.textContent = 'Delete Group';
        }
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
});