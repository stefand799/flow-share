// ============================================
// DASHBOARD-PAGE.JS - Dashboard Page JavaScript
// ============================================
// 
// This file handles:
// - View toggle (Kanban ⟷ Expenses)
// - Save view preference per group
// - Component coordination
// - Data refresh
// - Error handling
// 
// Dependencies:
// - group-component.js (loaded via component)
// - members-component.js (loaded via component)
// - kanban-component.js (loaded via component)
// - expenses-component.js (loaded via component)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const dashboardPage = document.querySelector('.dashboard-page');
    const kanbanBtn = document.getElementById('kanban-btn');
    const expensesBtn = document.getElementById('expenses-btn');
    const kanbanView = document.getElementById('kanban-view');
    const expensesView = document.getElementById('expenses-view');
    const contentContainer = document.querySelector('.content-container');
    
    // Get group ID from page
    const groupId = getGroupId();
    
    // ============================================
    // VIEW TOGGLE FUNCTIONALITY
    // ============================================
    
    /**
     * Switches between Kanban and Expenses view
     */
    function switchView(viewName) {
        if (viewName === 'kanban') {
            // Activate Kanban
            kanbanBtn.classList.add('active');
            expensesBtn.classList.remove('active');
            
            kanbanView.classList.remove('hidden');
            kanbanView.classList.add('active');
            
            expensesView.classList.add('hidden');
            expensesView.classList.remove('active');
            
        } else if (viewName === 'expenses') {
            // Activate Expenses
            expensesBtn.classList.add('active');
            kanbanBtn.classList.remove('active');
            
            expensesView.classList.remove('hidden');
            expensesView.classList.add('active');
            
            kanbanView.classList.add('hidden');
            kanbanView.classList.remove('active');
        }
        
        // Save preference (per group)
        if (groupId) {
            localStorage.setItem(`dashboardView-${groupId}`, viewName);
        }
        
        // Emit custom event for analytics or tracking
        window.dispatchEvent(new CustomEvent('view-changed', {
            detail: { view: viewName, groupId }
        }));
    }
    
    /**
     * Loads saved view preference for this group
     */
    function loadSavedView() {
        if (!groupId) return 'kanban';
        
        const savedView = localStorage.getItem(`dashboardView-${groupId}`);
        return savedView || 'kanban'; // Default to Kanban
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Kanban button click
    if (kanbanBtn) {
        kanbanBtn.addEventListener('click', () => {
            switchView('kanban');
        });
    }
    
    // Expenses button click
    if (expensesBtn) {
        expensesBtn.addEventListener('click', () => {
            switchView('expenses');
        });
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initializePage() {
        // Add fade-in animation
        if (dashboardPage) {
            dashboardPage.classList.add('fade-in');
        }
        
        // Load and set saved view
        const savedView = loadSavedView();
        switchView(savedView);
        
        // Log page load
        console.log('Dashboard page loaded for group:', groupId);
        console.log('Initial view:', savedView);
    }
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Gets group ID from URL
     */
    function getGroupId() {
        const pathParts = window.location.pathname.split('/');
        const dashboardIndex = pathParts.indexOf('dashboard');
        
        if (dashboardIndex !== -1 && pathParts[dashboardIndex + 1]) {
            return pathParts[dashboardIndex + 1];
        }
        
        return null;
    }
    
    /**
     * Shows loading state
     */
    function setLoadingState(isLoading) {
        if (isLoading) {
            dashboardPage?.classList.add('loading');
            contentContainer?.classList.add('loading');
        } else {
            dashboardPage?.classList.remove('loading');
            contentContainer?.classList.remove('loading');
        }
    }
    
    /**
     * Shows error message
     */
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
    
    /**
     * Shows success message
     */
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
    
    // ============================================
    // CUSTOM EVENT LISTENERS
    // ============================================
    
    // Listen for events from components
    window.addEventListener('task-updated', (e) => {
        console.log('Task updated:', e.detail);
        // Could refresh specific parts of UI
    });
    
    window.addEventListener('expense-updated', (e) => {
        console.log('Expense updated:', e.detail);
        // Could refresh specific parts of UI
    });
    
    window.addEventListener('member-added', (e) => {
        console.log('Member added:', e.detail);
        showSuccess('Member added successfully!');
    });
    
    window.addEventListener('member-removed', (e) => {
        console.log('Member removed:', e.detail);
        showSuccess('Member removed successfully!');
    });
    
    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    
    document.addEventListener('keydown', (e) => {
        // Alt + 1: Switch to Kanban
        if (e.altKey && e.key === '1') {
            e.preventDefault();
            switchView('kanban');
        }
        
        // Alt + 2: Switch to Expenses
        if (e.altKey && e.key === '2') {
            e.preventDefault();
            switchView('expenses');
        }
        
        // Ctrl/Cmd + B: Back to home
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            window.location.href = '/home';
        }
    });
    
    // ============================================
    // RESPONSIVE BEHAVIOR
    // ============================================
    
    function handleResize() {
        const isMobile = window.innerWidth < 1024;
        const leftColumn = document.querySelector('.left-column');
        
        if (isMobile) {
            // On mobile, left column is not sticky
            leftColumn?.style.removeProperty('position');
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on load
    
    // ============================================
    // PAGE REFRESH
    // ============================================
    
    /**
     * Refreshes dashboard data
     */
    async function refreshDashboard() {
        try {
            setLoadingState(true);
            
            // Simply reload the page
            // In a more sophisticated app, you'd fetch data via API
            window.location.reload();
            
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            showError('Failed to refresh dashboard');
        } finally {
            setLoadingState(false);
        }
    }
    
    // ============================================
    // INITIALIZE
    // ============================================
    
    initializePage();
    
    // ============================================
    // EXPOSE FUNCTIONS FOR COMPONENTS
    // ============================================
    
    // Make functions available globally for components to use
    window.dashboardUtils = {
        switchView,
        showError,
        showSuccess,
        setLoadingState,
        refreshDashboard,
        groupId
    };
    
});