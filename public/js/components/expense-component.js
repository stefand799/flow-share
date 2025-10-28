// ============================================
// EXPENSE-COMPONENT.JS - Expenses Tracker JavaScript
// ============================================
// 
// Features:
// - Create/Edit expenses
// - Add contributions
// - Delete expenses
// - Toggle expense details
// - Real-time UI updates
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('expense-management-container');
    if (!container) return;

    const groupID = container.dataset.groupId;
    
    // Modals
    const expenseFormModal = document.getElementById('expense-form-modal');
    const contributionModal = document.getElementById('contribution-modal');
    
    // Forms
    const expenseForm = document.getElementById('expense-form');
    const contributionForm = document.getElementById('contribution-form');

    // Buttons
    const addNewExpenseBtn = document.getElementById('add-new-expense-btn');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const cancelContributionBtn = document.getElementById('cancel-contribution-btn');

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Makes an API call
     * @param {string} url - API endpoint
     * @param {string} method - HTTP method
     * @param {object} payload - Request body
     */
    const apiCall = async (url, method, payload) => {
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData.message);
                throw new Error(errorData.message || 'An API error occurred.');
            }

            return await response.json();

        } catch (error) {
            console.error('Network or Server Error:', error.message);
            throw error;
        }
    };

    /**
     * Shows a modal
     * @param {HTMLElement} modalElement - Modal to show
     */
    const showModal = (modalElement) => {
        if (modalElement) {
            modalElement.classList.remove('hidden');
        }
    };

    /**
     * Hides a modal
     * @param {HTMLElement} modalElement - Modal to hide
     */
    const hideModal = (modalElement) => {
        if (modalElement) {
            modalElement.classList.add('hidden');
        }
    };

    /**
     * Resets the expense form
     */
    const resetExpenseForm = () => {
        if (expenseForm) {
            expenseForm.reset();
        }
        
        const modalTitle = document.getElementById('expense-modal-title');
        const expenseId = document.getElementById('expense-id');
        const submitBtn = document.getElementById('submit-expense-btn');
        
        if (modalTitle) modalTitle.textContent = 'Add New Expense';
        if (expenseId) expenseId.value = '';
        if (submitBtn) submitBtn.textContent = 'Save Expense';
    };

    // ============================================
    // MODAL CONTROLS
    // ============================================

    // Show Add New Expense Modal
    if (addNewExpenseBtn) {
        addNewExpenseBtn.addEventListener('click', () => {
            resetExpenseForm();
            showModal(expenseFormModal);
        });
    }

    // Hide Expense Modal
    if (cancelExpenseBtn) {
        cancelExpenseBtn.addEventListener('click', () => {
            hideModal(expenseFormModal);
            resetExpenseForm();
        });
    }
    
    // Hide Contribution Modal
    if (cancelContributionBtn) {
        cancelContributionBtn.addEventListener('click', () => {
            hideModal(contributionModal);
            if (contributionForm) {
                contributionForm.reset();
            }
        });
    }

    // Close modals when clicking outside
    if (expenseFormModal) {
        expenseFormModal.addEventListener('click', (e) => {
            if (e.target === expenseFormModal) {
                hideModal(expenseFormModal);
                resetExpenseForm();
            }
        });
    }

    if (contributionModal) {
        contributionModal.addEventListener('click', (e) => {
            if (e.target === contributionModal) {
                hideModal(contributionModal);
                if (contributionForm) {
                    contributionForm.reset();
                }
            }
        });
    }

    // ============================================
    // EXPENSE MANAGEMENT ACTIONS
    // ============================================

    container.addEventListener('click', async (e) => {
        // Find the closest expense card
        const targetCard = e.target.closest('.expense-card');
        const expenseId = targetCard ? targetCard.dataset.expenseId : null;

        // Toggle Details (clicking on summary)
        if (e.target.closest('.expense-summary')) {
            const summary = e.target.closest('.expense-summary');
            const detailsId = summary.dataset.toggleId;
            const detailsElement = document.getElementById(detailsId);
            
            if (detailsElement) {
                detailsElement.classList.toggle('hidden');
                
                // Rotate expand icon
                const expandIcon = summary.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.style.transform = detailsElement.classList.contains('hidden') 
                        ? 'rotate(0deg)' 
                        : 'rotate(180deg)';
                }
            }
            return;
        }
        
        // Edit Button
        if (e.target.closest('.edit-expense-btn') && expenseId) {
            try {
                // Fetch expense data
                const response = await fetch(`/api/expenses/${expenseId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch expense data');
                }
                
                const { expense } = await response.json();
                
                // Populate form
                document.getElementById('expense-modal-title').textContent = 'Edit Expense';
                document.getElementById('expense-id').value = expense.id;
                document.getElementById('expense-title').value = expense.title;
                document.getElementById('expense-description').value = expense.description || '';
                document.getElementById('expense-value').value = expense.value;
                document.getElementById('expense-currency').value = expense.currency;
                
                if (expense.due) {
                    const dueDate = new Date(expense.due);
                    document.getElementById('expense-due').value = dueDate.toISOString().split('T')[0];
                }
                
                document.getElementById('expense-recurring').checked = expense.isRecurring;
                document.getElementById('expense-recurrence').value = expense.recurrenceInterval || '';
                document.getElementById('submit-expense-btn').textContent = 'Update Expense';
                
                showModal(expenseFormModal);
            } catch (error) {
                console.error('Error fetching expense:', error);
                alert('Failed to load expense data. Please try again.');
            }
            return;
        }

        // Contribute Button
        if (e.target.closest('.contribute-btn') && expenseId) {
            try {
                // Fetch expense data
                const response = await fetch(`/api/expenses/${expenseId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch expense data');
                }
                
                const { expense } = await response.json();
                
                // Calculate balance
                const totalContributed = expense.contributions
                    ? expense.contributions.reduce((sum, c) => sum + c.value, 0)
                    : 0;
                const balance = expense.value - totalContributed;
                
                // Populate contribution form
                document.getElementById('contribution-expense-id').value = expense.id;
                document.getElementById('contribution-expense-title').textContent = expense.title;
                document.getElementById('contribution-expense-balance').textContent = 
                    `${balance.toFixed(2)} ${expense.currency}`;
                document.getElementById('contribution-value').max = balance;
                
                if (contributionForm) {
                    contributionForm.reset();
                }
                showModal(contributionModal);
            } catch (error) {
                console.error('Error fetching expense:', error);
                alert('Failed to load expense data. Please try again.');
            }
            return;
        }

        // Delete Button
        if (e.target.closest('.delete-expense-btn') && expenseId) {
            const confirmed = confirm('Are you sure you want to delete this expense? This action cannot be undone.');
            
            if (confirmed) {
                try {
                    await apiCall(`/api/expenses/${expenseId}`, 'DELETE', {});
                    
                    // Remove card from DOM
                    targetCard.remove();
                    
                    // Show success message
                    console.log('Expense deleted successfully');
                    
                    // Check if no expenses left
                    const remainingExpenses = container.querySelectorAll('.expense-card');
                    if (remainingExpenses.length === 0) {
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Delete failed:', error.message);
                    alert('Failed to delete expense. Please try again.');
                }
            }
            return;
        }
    });

    // ============================================
    // FORM SUBMISSIONS
    // ============================================

    // Expense Form (Create/Edit)
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(expenseForm);
            const expenseData = Object.fromEntries(formData.entries());
            
            // Add groupId
            expenseData.groupId = parseInt(groupID);
            
            // Convert checkbox to boolean
            expenseData.isRecurring = expenseData.isRecurring === 'on';
            
            // Convert value to number
            expenseData.value = parseFloat(expenseData.value);
            
            // Handle empty recurrence interval
            if (!expenseData.recurrenceInterval) {
                delete expenseData.recurrenceInterval;
            }
            
            // Handle empty due date
            if (!expenseData.due) {
                delete expenseData.due;
            }
            
            const isEdit = !!expenseData.id;
            const url = isEdit ? `/api/expenses/${expenseData.id}` : `/api/expenses`;
            const method = isEdit ? 'PUT' : 'POST';

            // Remove id from payload for create
            if (!isEdit) {
                delete expenseData.id;
            }

            try {
                const result = await apiCall(url, method, expenseData);
                
                console.log(`Expense ${isEdit ? 'updated' : 'created'} successfully`);
                
                hideModal(expenseFormModal);
                resetExpenseForm();
                
                // Reload page to show changes
                window.location.reload();
            } catch (error) {
                console.error('Expense Save Failed:', error.message);
                alert(`Failed to ${isEdit ? 'update' : 'create'} expense. Please try again.`);
            }
        });
    }

    // Contribution Form
    if (contributionForm) {
        contributionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contributionForm);
            const contributionData = Object.fromEntries(formData.entries());
            
            // Convert value to number
            contributionData.value = parseFloat(contributionData.value);
            
            // Convert expenseId to number
            contributionData.expenseId = parseInt(contributionData.expenseId);
            
            try {
                await apiCall('/api/contributions', 'POST', contributionData);
                
                console.log('Contribution submitted successfully');
                
                hideModal(contributionModal);
                
                // Reload to reflect new contributions and updated balance/status
                window.location.reload();
            } catch (error) {
                console.error('Contribution Save Failed:', error.message);
                alert('Failed to submit contribution. Please try again.');
            }
        });
    }
});