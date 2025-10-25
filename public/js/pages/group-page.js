// File: public/js/pages/group-page.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // VIEW TOGGLE FUNCTIONALITY
    // ============================================
    
    const kanbanBtn = document.getElementById('kanban-view-btn');
    const expensesBtn = document.getElementById('expenses-view-btn');
    
    const kanbanView = document.getElementById('kanban-view');
    const expensesView = document.getElementById('expenses-view');

    // Function to switch views
    const switchView = (showKanban) => {
        if (showKanban) {
            // Show Kanban
            kanbanBtn.classList.add('active');
            expensesBtn.classList.remove('active');
            kanbanView.classList.remove('hidden');
            kanbanView.classList.add('active');
            expensesView.classList.add('hidden');
            expensesView.classList.remove('active');
        } else {
            // Show Expenses
            expensesBtn.classList.add('active');
            kanbanBtn.classList.remove('active');
            expensesView.classList.remove('hidden');
            expensesView.classList.add('active');
            kanbanView.classList.add('hidden');
            kanbanView.classList.remove('active');
        }
    };

    // Event listeners for toggle buttons
    if (kanbanBtn) {
        kanbanBtn.addEventListener('click', () => switchView(true));
    }

    if (expensesBtn) {
        expensesBtn.addEventListener('click', () => switchView(false));
    }

    // Initialize with Kanban view active
    switchView(true);
});