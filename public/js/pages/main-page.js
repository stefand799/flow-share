// public/js/pages/main-page.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the target containers
    const profileSection = document.querySelector('.profile-section');
    const contentSection = document.querySelector('.content-section');
    const groupCarousel = document.getElementById('groupCarousel');
    
    // 2. Event listener for Group Card clicks (delegation on the carousel container)
    groupCarousel?.addEventListener('click', async (e) => {
        const groupCard = e.target.closest('.group-card:not(.create-card)');
        if (!groupCard) return;

        const groupId = groupCard.dataset.groupId;
        if (!groupId) return;
        
        // Simple loading state
        contentSection.innerHTML = '<div class="loading-spinner">Loading Group...</div>';
        
        try {
            // Call the new backend route to get rendered HTML for the components
            const response = await fetch(`/api/groups/render-group-view/${groupId}`);
            if (!response.ok) throw new Error('Failed to load group view');
            
            const data = await response.json();

            // 3. Swap the components
            if (profileSection) {
                profileSection.innerHTML = data.groupDetailsHtml;
            }
            if (contentSection) {
                contentSection.innerHTML = data.kanbanHtml; // Default view is Kanban
            }

            // Optional: Update the URL
            history.pushState({ groupId: groupId }, '', `/groups/view/${groupId}`);

        } catch (error) {
            console.error('Error in group navigation:', error);
            contentSection.innerHTML = '<div class="error-message">Failed to load group content.</div>';
        }
    });
});