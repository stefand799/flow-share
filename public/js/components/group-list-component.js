// ============================================
// GROUP-LIST-COMPONENT.JS - Scroll-Snap Carousel
// ============================================
// 
// Features:
// - Scroll-snap carousel navigation
// - Arrow button controls
// - Individual dot indicators (one per card)
// - Auto-detect active card on scroll
// - Smooth scrolling
// - Touch/swipe support
// 
// Dependencies: modal.js (for modal utilities)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const carousel = document.getElementById('group-carousel');
    const leftArrow = document.getElementById('carousel-left');
    const rightArrow = document.getElementById('carousel-right');
    const indicators = document.getElementById('carousel-indicators');
    const createGroupCard = document.getElementById('create-group-card');
    const createGroupBtn = document.getElementById('create-group-btn');
    const createGroupModal = document.getElementById('create-group-modal');
    const createGroupForm = document.getElementById('create-group-form');
    
    // Form inputs
    const groupNameInput = document.getElementById('group-name');
    const groupDescriptionInput = document.getElementById('group-description');
    
    // ============================================
    // CAROUSEL STATE
    // ============================================
    
    let allCards = [];
    let currentIndex = 0;
    let isScrolling = false;
    
    // ============================================
    // INITIALIZE CAROUSEL
    // ============================================
    
    function initializeCarousel() {
        if (!carousel) return;
        
        // Get all cards
        allCards = Array.from(carousel.querySelectorAll('.group-card'));
        
        if (allCards.length === 0) return;
        
        // Create indicators
        createIndicators();
        
        // Set up scroll detection
        setupScrollDetection();
        
        // Update arrow states
        updateArrowStates();
        
        // Set first card as active
        if (allCards.length > 0) {
            allCards[0].classList.add('active');
            updateIndicators();
        }
    }
    
    // ============================================
    // SCROLL DETECTION
    // ============================================
    
    function setupScrollDetection() {
        if (!carousel) return;
        
        let scrollTimeout;
        
        carousel.addEventListener('scroll', () => {
            isScrolling = true;
            
            // Clear previous timeout
            clearTimeout(scrollTimeout);
            
            // Set new timeout
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                detectActiveCard();
            }, 150);
            
            // Update arrows immediately
            updateArrowStates();
        });
    }
    
    /**
     * Detects which card is currently in the center of the viewport
     */
    function detectActiveCard() {
        if (!carousel || allCards.length === 0) return;
        
        const carouselRect = carousel.getBoundingClientRect();
        const carouselCenter = carouselRect.left + carouselRect.width / 2;
        
        let closestCard = allCards[0];
        let closestDistance = Infinity;
        
        allCards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - carouselCenter);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = card;
                currentIndex = index;
            }
        });
        
        // Update active states
        allCards.forEach(card => card.classList.remove('active'));
        closestCard.classList.add('active');
        
        // Update indicators
        updateIndicators();
    }
    
    // ============================================
    // ARROW NAVIGATION
    // ============================================
    
    if (leftArrow && rightArrow && carousel) {
        leftArrow.addEventListener('click', () => {
            scrollToPrevious();
        });
        
        rightArrow.addEventListener('click', () => {
            scrollToNext();
        });
    }
    
    function scrollToPrevious() {
        if (currentIndex > 0) {
            scrollToCard(currentIndex - 1);
        }
    }
    
    function scrollToNext() {
        if (currentIndex < allCards.length - 1) {
            scrollToCard(currentIndex + 1);
        }
    }
    
    function scrollToCard(index) {
        if (index < 0 || index >= allCards.length) return;
        
        const card = allCards[index];
        const cardRect = card.getBoundingClientRect();
        const carouselRect = carousel.getBoundingClientRect();
        
        // Calculate scroll position to center the card
        const scrollLeft = carousel.scrollLeft + 
                          (cardRect.left - carouselRect.left) - 
                          (carouselRect.width / 2) + 
                          (cardRect.width / 2);
        
        carousel.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
        
        currentIndex = index;
    }
    
    function updateArrowStates() {
        if (!leftArrow || !rightArrow || !carousel) return;
        
        const scrollLeft = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        // Disable left arrow at start
        leftArrow.disabled = scrollLeft <= 5;
        
        // Disable right arrow at end
        rightArrow.disabled = scrollLeft >= maxScroll - 5;
    }
    
    // ============================================
    // CAROUSEL INDICATORS
    // ============================================
    
    function createIndicators() {
        if (!indicators || allCards.length === 0) return;
        
        // Clear existing indicators
        indicators.innerHTML = '';
        
        // Create one indicator per card
        allCards.forEach((card, index) => {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.setAttribute('aria-label', `Go to group ${index + 1}`);
            indicator.setAttribute('data-index', index);
            
            indicator.addEventListener('click', () => {
                scrollToCard(index);
            });
            
            indicators.appendChild(indicator);
        });
        
        updateIndicators();
    }
    
    function updateIndicators() {
        if (!indicators) return;
        
        const allIndicators = indicators.querySelectorAll('.carousel-indicator');
        allIndicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // ============================================
    // GROUP CARD CLICK - NAVIGATE TO DASHBOARD
    // ============================================
    
    const groupCards = document.querySelectorAll('.group-card[data-group-id]');
    groupCards.forEach(card => {
        card.addEventListener('click', () => {
            const groupId = card.dataset.groupId;
            if (groupId) {
                window.location.href = `/dashboard/${groupId}`;
            }
        });
        
        // Add keyboard support
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
    
    // ============================================
    // CREATE GROUP FUNCTIONALITY
    // ============================================
    
    // Open create group modal
    if (createGroupCard) {
        createGroupCard.addEventListener('click', () => {
            openModal('create-group-modal');
        });
        
        // Keyboard support
        createGroupCard.setAttribute('tabindex', '0');
        createGroupCard.setAttribute('role', 'button');
        createGroupCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal('create-group-modal');
            }
        });
    }
    
    // Submit create group form
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', async () => {
            await createGroup();
        });
    }
    
    // Character counter for description
    if (groupDescriptionInput) {
        groupDescriptionInput.addEventListener('input', () => {
            const maxLength = 200;
            const currentLength = groupDescriptionInput.value.length;
            
            if (currentLength > maxLength) {
                groupDescriptionInput.value = groupDescriptionInput.value.substring(0, maxLength);
            }
        });
    }
    
    /**
     * Creates a new group via API
     */
    async function createGroup() {
        try {
            // Validate inputs
            const name = groupNameInput.value.trim();
            const description = groupDescriptionInput.value.trim();
            
            if (!name || name.length < 3) {
                showError('Group name must be at least 3 characters');
                return;
            }
            
            if (name.length > 50) {
                showError('Group name must be less than 50 characters');
                return;
            }
            
            // Disable button
            createGroupBtn.disabled = true;
            createGroupBtn.textContent = 'Creating...';
            
            // Make API request
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Group created successfully!');
                
                // Close modal
                closeModal('create-group-modal');
                
                // Reset form
                createGroupForm.reset();
                
                // Redirect to new group dashboard after short delay
                setTimeout(() => {
                    window.location.href = `/dashboard/${data.group.id}`;
                }, 1000);
                
            } else {
                showError(data.message || 'Failed to create group');
            }
            
        } catch (error) {
            console.error('Error creating group:', error);
            showError('An error occurred while creating the group');
        } finally {
            createGroupBtn.disabled = false;
            createGroupBtn.textContent = 'Create Group';
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Shows error message
     */
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.transition = 'opacity 0.3s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
    
    /**
     * Shows success message
     */
    function showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.transition = 'opacity 0.3s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
    
    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    
    document.addEventListener('keydown', (e) => {
        // Arrow keys for carousel navigation (when not in input)
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
            
            if (e.key === 'ArrowLeft') {
                scrollToPrevious();
            } else if (e.key === 'ArrowRight') {
                scrollToNext();
            }
        }
        
        // Ctrl/Cmd + N to create new group
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (createGroupCard) {
                openModal('create-group-modal');
            }
        }
    });
    
    // ============================================
    // TOUCH/SWIPE SUPPORT
    // ============================================
    
    if (carousel) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swiped left - go next
                scrollToNext();
            }
            
            if (touchEndX - touchStartX > swipeThreshold) {
                // Swiped right - go previous
                scrollToPrevious();
            }
        }
    }
    
    // ============================================
    // WINDOW RESIZE HANDLER
    // ============================================
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            detectActiveCard();
            updateArrowStates();
        }, 250);
    });
    
    // ============================================
    // INITIALIZE
    // ============================================
    
    initializeCarousel();
    
});