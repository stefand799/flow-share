// ============================================
// HOME-PAGE.JS - Home Page JavaScript
// ============================================
// 
// This file handles:
// - Coordination between profile and groups components
// - Refresh data functionality
// - Loading states
// - Error handling
// 
// Dependencies:
// - profile-component.js (loaded via component)
// - group-list-component.js (loaded via component)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const homePage = document.querySelector('.home-page');
    const profileSection = document.querySelector('.profile-section');
    const groupsSection = document.querySelector('.groups-section');
    
    // ============================================
    // PAGE INITIALIZATION
    // ============================================
    
    function initializePage() {
        // Add fade-in animation
        if (homePage) {
            homePage.classList.add('fade-in');
        }
        
        // Log page load for debugging
        console.log('Home page loaded successfully');
        
        // Check if user data is available
        checkUserData();
    }
    
    function checkUserData() {
        // Verify profile component loaded
        const profileCard = document.querySelector('.profile-card');
        if (!profileCard) {
            console.warn('Profile component not found');
        }
        
        // Verify groups component loaded
        const groupsContainer = document.querySelector('.groups-list-container');
        if (!groupsContainer) {
            console.warn('Groups component not found');
        }
    }
    
    // ============================================
    // REFRESH FUNCTIONALITY
    // ============================================
    
    /**
     * Refreshes the groups list via API
     */
    async function refreshGroups() {
        try {
            setLoadingState(true);
            
            const response = await fetch('/api/groups', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            
            const groups = await response.json();
            
            // Update group count
            updateGroupCount(groups.length);
            
            // Reload page to update groups display
            // Note: In a more sophisticated app, you'd update the DOM directly
            // For university project, page reload is acceptable
            window.location.reload();
            
        } catch (error) {
            console.error('Error refreshing groups:', error);
            showError('Failed to refresh groups. Please try again.');
        } finally {
            setLoadingState(false);
        }
    }
    
    /**
     * Updates the group count badge
     */
    function updateGroupCount(count) {
        const groupCount = document.querySelector('.group-count');
        if (groupCount) {
            const plural = count !== 1 ? 's' : '';
            groupCount.textContent = `${count} group${plural}`;
        }
    }
    
    // ============================================
    // LOADING STATES
    // ============================================
    
    function setLoadingState(isLoading) {
        if (isLoading) {
            homePage?.classList.add('loading');
            groupsSection?.classList.add('loading');
        } else {
            homePage?.classList.remove('loading');
            groupsSection?.classList.remove('loading');
        }
    }
    
    // ============================================
    // ERROR HANDLING
    // ============================================
    
    function showError(message) {
        // Create error alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `
            <span class="alert-icon">⚠️</span>
            <span class="alert-message">${message}</span>
        `;
        
        // Insert at top of page
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.insertAdjacentElement('afterend', alert);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                alert.style.transition = 'opacity 0.3s';
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Listen for custom events from components
    window.addEventListener('profile-updated', () => {
        console.log('Profile updated, refreshing page...');
        // Could refresh specific parts of UI here
    });
    
    window.addEventListener('group-created', () => {
        console.log('Group created, refreshing groups...');
        refreshGroups();
    });
    
    window.addEventListener('group-deleted', () => {
        console.log('Group deleted, refreshing groups...');
        refreshGroups();
    });
    
    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R: Refresh groups (prevent default refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshGroups();
        }
    });
    
    // ============================================
    // RESPONSIVE BEHAVIOR
    // ============================================
    
    function handleResize() {
        const isMobile = window.innerWidth < 1024;
        
        if (isMobile) {
            // On mobile, profile section is not sticky
            profileSection?.style.removeProperty('position');
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on load
    
    // ============================================
    // SMOOTH SCROLLING
    // ============================================
    
    // Smooth scroll to groups section when clicking group count
    const groupCount = document.querySelector('.group-count');
    if (groupCount) {
        groupCount.style.cursor = 'pointer';
        groupCount.addEventListener('click', () => {
            groupsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    
    // ============================================
    // INITIALIZE
    // ============================================
    
    initializePage();
    
    // ============================================
    // EXPOSE FUNCTIONS FOR COMPONENTS
    // ============================================
    
    // Make functions available globally for components to use
    window.homePageUtils = {
        refreshGroups,
        showError,
        setLoadingState
    };
    
});