// File: public/js/components/members-component.js

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('member-detail-modal');
    const memberList = document.getElementById('member-list');
    const membersWrapper = document.getElementById('members-list-wrapper');
    
    // Check if the current user is an admin of the group (This data needs to be provided by the EJS context, 
    // e.g., in a data attribute on the wrapper, for client-side button visibility).
    // For now, we will rely on server-side security.

    // Admin Action Buttons
    const promoteBtn = document.getElementById('promote-button');
    const demoteBtn = document.getElementById('demote-button');
    const kickBtn = document.getElementById('kick-button');
    const closeModalBtn = document.getElementById('close-modal-button');

    // State to hold the member being viewed/acted upon
    let currentMember = {}; 

    // Helper functions for modal visibility
    const openModal = () => modal?.classList.remove('hidden');
    const closeModal = () => modal?.classList.add('hidden');

    // --- API Request Handlers ---

    const handleMemberAction = async (endpoint, memberId, method, successMessage) => {
        // Use the new RESTful structure: /api/groups/promote-admin/:memberId
        const url = `/api/groups/${endpoint}/${memberId}`; 
        
        try {
            const response = await fetch(url, {
                method: method, 
                // Promote/Demote/Remove actions only need the ID from the URL now.
            });

            if (response.ok) {
                alert(successMessage);
                closeModal();
                window.location.reload(); 
            } else {
                const errorData = await response.json();
                alert(`Action failed: ${errorData.message || 'Server error'}`);
            }
        } catch (error) {
            console.error('Network error during member action:', error);
            alert('An unexpected error occurred.');
        }
    };


    // --- Event Listener for Member List Clicks ---
    memberList?.addEventListener('click', (e) => {
        const listItem = e.target.closest('.member-list-item');
        if (!listItem) return;

        // 1. Populate currentMember state from data attributes
        currentMember = {
            id: listItem.dataset.memberId,
            userId: listItem.dataset.userId,
            username: listItem.dataset.username,
            isAdmin: listItem.dataset.isAdmin === 'true',
            firstName: listItem.dataset.firstName,
            lastName: listItem.dataset.lastName,
            email: listItem.dataset.email,
            phone: listItem.dataset.phone,
            bio: listItem.dataset.bio,
            // groupId is not needed here since the APIs use memberId in the URL
        };

        // 2. Populate Modal Details
        document.getElementById('modal-username').textContent = currentMember.username;
        document.getElementById('modal-full-name').textContent = `${currentMember.firstName} ${currentMember.lastName}`.trim() || 'N/A';
        document.getElementById('modal-email').textContent = currentMember.email;
        document.getElementById('modal-phone').textContent = currentMember.phone;
        document.getElementById('modal-bio').textContent = currentMember.bio;
        
        const roleText = currentMember.isAdmin ? 'Admin' : 'Member';
        document.getElementById('modal-role').textContent = roleText;

        // 3. Toggle Admin Buttons (Visibility is set by EJS, but we can manage local state here)
        const adminActionsDiv = document.getElementById('modal-admin-actions');
        // NOTE: The 'style="display: none;"' on the EJS element should be removed 
        // and replaced by a client-side check if the logged-in user is an admin.
        // For demonstration, we assume it's visible or managed elsewhere.
        adminActionsDiv.style.display = 'flex'; // Show the actions for now

        // Set button states based on member role
        promoteBtn.disabled = currentMember.isAdmin;
        demoteBtn.disabled = !currentMember.isAdmin;

        openModal();
    });

    // --- Event Listeners for Modal Buttons ---

    closeModalBtn?.addEventListener('click', closeModal);

    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    promoteBtn?.addEventListener('click', () => {
        handleMemberAction('promote-admin', currentMember.id, 'PUT', `${currentMember.username} promoted to Admin.`);
    });

    demoteBtn?.addEventListener('click', () => {
        handleMemberAction('demote-admin', currentMember.id, 'PUT', `${currentMember.username} demoted from Admin.`);
    });
    
    kickBtn?.addEventListener('click', () => {
        // Kick uses the DELETE method, matching the RESTful route /api/groups/remove-member/:memberId
        handleMemberAction('remove-member', currentMember.id, 'DELETE', `${currentMember.username} kicked from the group.`);
    });
});
