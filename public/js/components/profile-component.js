// ============================================
// PROFILE-COMPONENT.JS - Profile Component JavaScript
// ============================================
// 
// This file handles:
// - Edit profile modal
// - Update profile via API
// - Delete account modal
// - Delete account via API
// - Form validation
// 
// Dependencies: modal.js (for modal utilities)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const profileCard = document.getElementById('profile-card');
    
    // Buttons
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Modals
    const editProfileModal = document.getElementById('edit-profile-modal');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    
    // Forms
    const editProfileForm = document.getElementById('edit-profile-form');
    const deleteConfirmationInput = document.getElementById('delete-confirmation-input');
    
    // Form inputs
    const firstNameInput = document.getElementById('edit-firstName');
    const lastNameInput = document.getElementById('edit-lastName');
    const phoneNumberInput = document.getElementById('edit-phoneNumber');
    const bioInput = document.getElementById('edit-bio');
    
    // ============================================
    // EDIT PROFILE FUNCTIONALITY
    // ============================================
    
    // Open edit profile modal
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            openModal('edit-profile-modal');
        });
    }
    
    // Save profile changes
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            await updateProfile();
        });
    }
    
    // Bio character counter
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            const maxLength = 200;
            const currentLength = bioInput.value.length;
            
            if (currentLength > maxLength) {
                bioInput.value = bioInput.value.substring(0, maxLength);
            }
        });
    }
    
    /**
     * Updates user profile via API
     */
    async function updateProfile() {
        try {
            // Disable save button
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';
            
            // Gather form data
            const formData = {
                firstName: firstNameInput.value.trim() || null,
                lastName: lastNameInput.value.trim() || null,
                phoneNumber: phoneNumberInput.value.trim() || null,
                bio: bioInput.value.trim() || null
            };
            
            // Get user ID from profile card or URL
            // Assuming user ID is available in a data attribute or globally
            const userId = profileCard?.dataset.userId || getUserIdFromContext();
            
            // Send PUT request
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            const updatedUser = await response.json();
            
            // Close modal
            closeModal('edit-profile-modal');
            
            // Show success feedback
            showSuccess('Profile updated successfully!');
            
            // Reload page to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            // Re-enable save button
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save Changes';
        }
    }
    
    // ============================================
    // DELETE ACCOUNT FUNCTIONALITY
    // ============================================
    
    // Open delete account modal
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            openModal('delete-account-modal');
            // Clear confirmation input
            if (deleteConfirmationInput) {
                deleteConfirmationInput.value = '';
            }
        });
    }
    
    // Enable/disable delete button based on confirmation
    if (deleteConfirmationInput) {
        deleteConfirmationInput.addEventListener('input', () => {
            const isConfirmed = deleteConfirmationInput.value.toUpperCase() === 'DELETE';
            confirmDeleteBtn.disabled = !isConfirmed;
        });
    }
    
    // Confirm delete account
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            await deleteAccount();
        });
    }
    
    /**
     * Deletes user account via API
     */
    async function deleteAccount() {
        try {
            // Disable button
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';
            
            // Get user ID
            const userId = profileCard?.dataset.userId || getUserIdFromContext();
            
            // Send DELETE request
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete account');
            }
            
            // Close modal
            closeModal('delete-account-modal');
            
            // Show success message
            alert('Account deleted successfully. You will be redirected to login.');
            
            // Redirect to login page
            window.location.href = '/login';
            
        } catch (error) {
            console.error('Error deleting account:', error);
            alert(`Failed to delete account: ${error.message}`);
            
            // Re-enable button
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Account';
        }
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Gets user ID from various sources
     */
    function getUserIdFromContext() {
        // Try to get from data attribute
        if (profileCard?.dataset.userId) {
            return profileCard.dataset.userId;
        }
        
        // Try to get from global variable (if set by server)
        if (typeof window.currentUserId !== 'undefined') {
            return window.currentUserId;
        }
        
        // Try to get from username in edit form
        const usernameInput = document.getElementById('edit-username');
        if (usernameInput?.dataset.userId) {
            return usernameInput.dataset.userId;
        }
        
        console.error('User ID not found');
        return null;
    }
    
    /**
     * Shows success message
     */
    function showSuccess(message) {
        // Add success class to profile card
        profileCard?.classList.add('success');
        
        // Show success alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
            <span class="alert-icon">✓</span>
            <span class="alert-message">${message}</span>
        `;
        alert.style.cssText = `
            position: fixed;
            top: 5rem;
            right: 1rem;
            z-index: 1000;
            background-color: #f0fff4;
            border: 1px solid #48bb78;
            color: #22543d;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(alert);
        
        // Remove after 3 seconds
        setTimeout(() => {
            alert.style.transition = 'opacity 0.3s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
            profileCard?.classList.remove('success');
        }, 3000);
    }
    
    /**
     * Validates form data before submission
     */
    function validateProfileForm() {
        let isValid = true;
        
        // Validate phone number format if provided
        if (phoneNumberInput.value.trim()) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(phoneNumberInput.value.trim())) {
                alert('Please enter a valid phone number');
                phoneNumberInput.focus();
                isValid = false;
            }
        }
        
        // Validate bio length
        if (bioInput.value.length > 200) {
            alert('Bio must be 200 characters or less');
            bioInput.focus();
            isValid = false;
        }
        
        return isValid;
    }
    
    // Add validation before save
    if (saveProfileBtn) {
        const originalClickHandler = saveProfileBtn.onclick;
        saveProfileBtn.onclick = async function(e) {
            if (!validateProfileForm()) {
                e.preventDefault();
                return;
            }
            if (originalClickHandler) {
                await originalClickHandler.call(this, e);
            }
        };
    }
    
    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    
    // Save profile with Ctrl/Cmd + S when modal is open
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            if (editProfileModal && !editProfileModal.classList.contains('hidden')) {
                e.preventDefault();
                saveProfileBtn?.click();
            }
        }
    });
    
});