// public/js/components/group-list-component.js

let currentCardIndex = 0;
let cards = [];
let carouselInitialized = false;

function applyCarouselClasses() {
    // Get all cards again, including dynamically created ones
    cards = Array.from(document.querySelectorAll('.group-card'));
    if (cards.length === 0) return;

    const maxIndex = cards.length - 1;
    currentCardIndex = Math.min(Math.max(0, currentCardIndex), maxIndex); // Ensure index is in bounds

    cards.forEach((card, index) => {
        card.classList.remove('card-center', 'card-left-peek', 'card-right-peek', 'card-hidden');

        if (index === currentCardIndex) {
            card.classList.add('card-center');
        } else if (index === currentCardIndex - 1) {
            card.classList.add('card-left-peek');
        } else if (index === currentCardIndex + 1) {
            card.classList.add('card-right-peek');
        } else {
            card.classList.add('card-hidden');
        }
    });
    
    // Update arrow button states
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    
    if (leftArrow) {
        leftArrow.disabled = currentCardIndex === 0;
    }
    if (rightArrow) {
        rightArrow.disabled = currentCardIndex === maxIndex;
    }
}

function moveCarousel(direction) {
    const maxIndex = cards.length - 1;
    let newIndex = currentCardIndex + direction;

    // Check boundaries and update index
    if (newIndex >= 0 && newIndex <= maxIndex) {
        currentCardIndex = newIndex;
        applyCarouselClasses();
    }
}


function initializeCarousel() {
    if (carouselInitialized) return;
    
    // 1. Initial class application
    applyCarouselClasses(); 
    
    // 2. Set up arrow click handlers
    document.querySelector('.left-arrow')?.addEventListener('click', () => moveCarousel(-1));
    document.querySelector('.right-arrow')?.addEventListener('click', () => moveCarousel(1));
    
    carouselInitialized = true;
}


document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // CAROUSEL INITIALIZATION
    // ----------------------------------------------------
    initializeCarousel();


    // ----------------------------------------------------
    // GROUP CARD CLICK (AJAX for content swap)
    // ----------------------------------------------------
    const groupsListContainer = document.querySelector('.groups-list-container');
    const leftColumn = document.getElementById('left-column-content');

    if (groupsListContainer) {
        groupsListContainer.addEventListener('click', async (e) => {
            const card = e.target.closest('.group-card');
            
            // Only proceed if a group card was clicked AND it is not the 'create new group' card
            if (!card || card.id === 'createGroupCard') return;
            
            // Crucial: Only load content if the card is the center card
            if (!card.classList.contains('card-center')) {
                // If a peeking card is clicked, move it to the center
                if (card.classList.contains('card-left-peek')) {
                    moveCarousel(1);
                } else if (card.classList.contains('card-right-peek')) {
                    moveCarousel(-1);
                }
                return; // Prevent content loading until center is confirmed
            }


            const groupId = card.getAttribute('data-group-id');
            if (!groupId) return;
            
            const componentUrl = `/component/group/${groupId}`;
            
            if (leftColumn) {
                leftColumn.innerHTML = '<div class="p-6 text-center text-gray-500">Loading group details...</div>';
            }

            try {
                const response = await fetch(componentUrl);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

                const htmlContent = await response.text();
                if (leftColumn) {
                    leftColumn.innerHTML = htmlContent;
                }
            } catch (error) {
                console.error("Error clicking group card:", error);
                if (leftColumn) {
                    leftColumn.innerHTML = '<div class="p-6 text-center text-red-500">Error loading group.</div>';
                }
            }
        });
    }

    // ----------------------------------------------------
    // CREATE GROUP MODAL/FORM LOGIC
    // ----------------------------------------------------
    const createGroupCard = document.getElementById('createGroupCard');
    const createGroupModal = document.getElementById('create-group-modal');
    const createGroupForm = document.getElementById('create-group-form');
    const cancelBtn = document.getElementById('cancel-group-create-btn');
    
    if (createGroupCard) {
        createGroupCard.addEventListener('click', () => {
            createGroupModal?.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelGroupCreate);
    }
    
    if (createGroupModal) {
        createGroupModal.addEventListener('click', (e) => {
            if (e.target === createGroupModal) {
                cancelGroupCreate();
            }
        });
    }
    
    function cancelGroupCreate() {
        createGroupModal?.classList.add('hidden');
        createGroupForm?.reset(); 
    }

    if (createGroupForm) {
        createGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    cancelGroupCreate(); 
                    // Reloads the page, which re-runs initializeCarousel and shows the new group
                    window.location.reload(); 
                } else {
                    const errorJson = await response.json();
                    // NOTE: Changed from alert to console.error/message box for non-alert use
                    console.error('Group Creation Failed:', errorJson.message);
                    alert(`Group Creation Failed: ${errorJson.message || 'An unknown error occurred.'}`);
                }
            } catch (error) {
                console.error("Error creating group:", error);
                alert("Network or server error during group creation.");
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});
