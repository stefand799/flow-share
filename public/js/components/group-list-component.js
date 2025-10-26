// ============================================
// GROUP-LIST-COMPONENT.JS - Group List Component JavaScript
// ============================================
// 
// This file handles:
// - Carousel navigation
// - Group card click (navigate to dashboard)
// - Create group modal
// - Create group via API
// - Carousel indicators
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
    // CAROUSEL NAVIGATION
    // ============================================
    
    if (carousel && leftArrow && rightArrow) {
        
        // Scroll amount (one card width + gap)
        const scrollAmount = 300;
        
        // Left arrow click
        leftArrow.addEventListener('click', () => {
            carousel.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Right arrow click
        rightArrow.addEventListener('click', () => {
            carousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Update arrow states based on scroll position
        function updateArrows() {
            const scrollLeft = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;
            
            // Disable left arrow at start
            leftArrow.disabled = scrollLeft <= 0;
            
            // Disable right arrow at end
            rightArrow.disabled = scrollLeft >= maxScroll - 5; // -5 for rounding
        }
        
        // Listen to scroll events
        carousel.addEventListener('scroll', updateArrows);
        
        // Initial update
        updateArrows();
        
        // Update on window resize
        window.addEventListener('resize', updateArrows);
    }
    
    // ============================================
    // CAROUSEL INDICATORS
    // ============================================
    
    function createIndicators() {
        if (!carousel || !indicators) return;
        
        const cards = carousel.querySelectorAll('.group-card:not(.create-group-card)');
        const cardsPerView = Math.floor(carousel.clientWidth / 300);
        const numIndicators = Math.max(1, Math.ceil(cards.length / cardsPerView));
        
        // Clear existing indicators
        indicators.innerHTML = '';
        
        // Create indicator dots
        for (let i = 0; i < numIndicators; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.setAttribute('aria-label', `Go to page ${i + 1}`);
            indicator.addEventListener('click', () => {
                const scrollTo = i * cardsPerView * 300;
                carousel.scrollTo({
                    left: scrollTo,
                    behavior: 'smooth'
                });
            });
            indicators.appendChild(indicator);
        }
        
        updateActiveIndicator();
    }
    
    function updateActiveIndicator() {
        if (!carousel || !indicators) return;
        
        const scrollLeft = carousel.scrollLeft;
        const cards = carousel.querySelectorAll('.group-card:not(.create-group-card)');
        const cardsPerView = Math.floor(carousel.clientWidth / 300);
        const currentPage = Math.floor(scrollLeft / (cardsPerView * 300));
        
        const allIndicators = indicators.querySelectorAll('.carousel-indicator');
        allIndicators.forEach((indicator, index) => {
            if (index === currentPage) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // Initialize indicators
    if (carousel && indicators) {
        createIndicators();
        carousel.addEventListener('scroll', updateActiveIndicator);
        window.addEventListener('resize', createIndicators);
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
                createGroupCard.click();
            }
        });
    }
    
    // Create group button click
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', async () => {
            await createGroup();
        });
    }
    
    // Description character counter
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
            // Validate form
            if (!validateGroupForm()) {
                return;
            }
            
            // Disable button
            createGroupBtn.disabled = true;
            createGroupBtn.textContent = 'Creating...';
            
            // Gather form data
            const formData = {
                name: groupNameInput.value.trim(),
                description: groupDescriptionInput.value.trim() || null
            };
            
            // Send POST request
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create group');
            }
            
            const newGroup = await response.json();
            
            // Close modal
            closeModal('create-group-modal');
            
            // Clear form
            createGroupForm.reset();
            
            // Show success message
            showSuccess('Group created successfully!');
            
            // Emit custom event for home page
            window.dispatchEvent(new CustomEvent('group-created', { detail: newGroup }));
            
            // Redirect to new group's dashboard
            setTimeout(() => {
                window.location.href = `/dashboard/${newGroup.id}`;
            }, 500);
            
        } catch (error) {
            console.error('Error creating group:', error);
            showError(`Failed to create group: ${error.message}`);
        } finally {
            // Re-enable button
            createGroupBtn.disabled = false;
            createGroupBtn.textContent = 'Create Group';
        }
    }
    
    /**
     * Validates create group form
     */
    function validateGroupForm() {
        const groupName = groupNameInput.value.trim();
        const errorElement = document.getElementById('group-name-error');
        
        // Clear previous errors
        if (errorElement) {
            errorElement.textContent = '';
        }
        
        // Validate name
        if (!groupName) {
            showFormError(errorElement, 'Group name is required');
            groupNameInput.focus();
            return false;
        }
        
        if (groupName.length < 3) {
            showFormError(errorElement, 'Group name must be at least 3 characters');
            groupNameInput.focus();
            return false;
        }
        
        if (groupName.length > 50) {
            showFormError(errorElement, 'Group name must be less than 50 characters');
            groupNameInput.focus();
            return false;
        }
        
        return true;
    }
    
    function showFormError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }
    
    // Clear errors on input
    if (groupNameInput) {
        groupNameInput.addEventListener('input', () => {
            const errorElement = document.getElementById('group-name-error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        });
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function showSuccess(message) {
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
        
        setTimeout(() => {
            alert.style.transition = 'opacity 0.3s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
    
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <span class="alert-icon">⚠️</span>
            <span class="alert-message">${message}</span>
        `;
        alert.style.cssText = `
            position: fixed;
            top: 5rem;
            right: 1rem;
            z-index: 1000;
            background-color: #fff5f5;
            border: 1px solid #fc8181;
            color: #c53030;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
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
                leftArrow?.click();
            } else if (e.key === 'ArrowRight') {
                rightArrow?.click();
            }
        }
        
        // Ctrl/Cmd + N to create new group
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createGroupCard?.click();
        }
    });
    
    // ============================================
    // TOUCH/SWIPE SUPPORT (MOBILE)
    // ============================================
    
    if (carousel) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swiped left
                rightArrow?.click();
            }
            
            if (touchEndX - touchStartX > swipeThreshold) {
                // Swiped right
                leftArrow?.click();
            }
        }
    }
    
});