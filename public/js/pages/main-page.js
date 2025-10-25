// public/js/pages/main-page.js

document.addEventListener('DOMContentLoaded', () => {
    const groupCarousel = document.getElementById('groupCarousel');
    
    if (groupCarousel) {
        groupCarousel.addEventListener('click', async (e) => {
            const card = e.target.closest('.group-card:not(.create-card)');
            
            // Only navigate if it's a real group card
            if (!card) return;
            
            // Only navigate if card is in center position
            if (!card.classList.contains('card-center')) return;
            
            const groupId = card.dataset.groupId;
            if (groupId) {
                // Navigate to the FULL group page
                window.location.href = `/groups/${groupId}`;
            }
        });
    }
});