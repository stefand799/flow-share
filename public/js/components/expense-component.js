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

    // --- Utility Functions ---

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

    const showModal = (modalElement) => modalElement.classList.remove('hidden');
    const hideModal = (modalElement) => modalElement.classList.add('hidden');

    const resetExpenseForm = () => {
        expenseForm.reset();
        document.getElementById('expense-modal-title').textContent = 'Add New Expense';
        document.getElementById('expense-id').value = '';
        document.getElementById('submit-expense-btn').textContent = 'Save Expense';
    };

    // --- Event Listeners: Expense Modals ---

    // 1. Show Add New Expense Modal
    if (addNewExpenseBtn) {
        addNewExpenseBtn.addEventListener('click', () => {
            resetExpenseForm();
            showModal(expenseFormModal);
        });
    }

    // 2. Hide Expense Modal
    if (cancelExpenseBtn) {
        cancelExpenseBtn.addEventListener('click', () => hideModal(expenseFormModal));
    }
    
    // 3. Hide Contribution Modal
    if (cancelContributionBtn) {
        cancelContributionBtn.addEventListener('click', () => hideModal(contributionModal));
    }


    // --- Event Listeners: Expense Management Actions ---

    container.addEventListener('click', async (e) => {
        // Find the closest expense card to determine the target expense ID
        const targetCard = e.target.closest('.expense-card');
        const expenseId = targetCard ? targetCard.dataset.expenseId : null;

        // Toggle Details (Summary click)
        if (e.target.closest('.expense-summary')) {
            const detailsId = e.target.closest('.expense-summary').dataset.toggleId;
            const detailsElement = document.getElementById(detailsId);
            if (detailsElement) {
                detailsElement.classList.toggle('hidden');
            }
        }
        
        // Edit Button
        if (e.target.closest('.edit-expense-btn') && expenseId) {
            // In a real app, you would fetch the expense data by ID here to populate the form
            console.log(`Editing expense ${expenseId}. Fetching current data...`);
            
            // Placeholder: Populate form fields from visible card data for demo
            const title = targetCard.querySelector('.expense-summary p:first-child').textContent;
            
            document.getElementById('expense-modal-title').textContent = 'Edit Expense';
            document.getElementById('expense-id').value = expenseId;
            document.getElementById('expense-title').value = title; 
            document.getElementById('submit-expense-btn').textContent = 'Update Expense';
            
            showModal(expenseFormModal);
        }

        // Contribute Button
        if (e.target.closest('.contribute-btn') && expenseId) {
            // In a real app, fetch expense details (title, balance, currency)
            const summaryDiv = targetCard.querySelector('.expense-summary');
            const title = summaryDiv.querySelector('.text-xl').textContent;
            const balanceText = summaryDiv.querySelector('.text-sm:last-child span').textContent;
            
            document.getElementById('contribution-expense-id').value = expenseId;
            document.getElementById('contribution-expense-title').textContent = title;
            document.getElementById('contribution-expense-balance').textContent = balanceText;
            document.getElementById('contribution-value').max = parseFloat(balanceText.replace(/[^\d.]/g, '')); // Set max value
            contributionForm.reset();
            showModal(contributionModal);
        }

        // Delete Button
        if (e.target.closest('.delete-expense-btn') && expenseId) {
            if (confirm(`Are you sure you want to delete expense ID: ${expenseId}?`)) {
                try {
                    await apiCall(`/api/expenses/delete`, 'DELETE', { expenseId, groupId: groupID });
                    
                    // Simple UI update: remove the card and reload page
                    targetCard.remove();
                    window.location.reload(); 
                } catch (error) {
                    console.error('Delete failed:', error.message);
                }
            }
        }
    });


    // --- Form Submissions ---

    // 1. Expense Form (Create/Edit)
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(expenseForm);
            const expenseData = Object.fromEntries(formData.entries());
            expenseData.groupId = groupID;
            
            const isEdit = !!expenseData.id;
            const url = isEdit ? `/api/expenses/update` : `/api/expenses/create`;
            const method = isEdit ? 'PUT' : 'POST';

            try {
                await apiCall(url, method, expenseData);
                
                hideModal(expenseFormModal);
                resetExpenseForm();
                // Reload to show changes (Simple method)
                window.location.reload(); 
            } catch (error) {
                console.error('Expense Save Failed:', error.message);
            }
        });
    }

    // 2. Contribution Form
    if (contributionForm) {
        contributionForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contributionForm);
            const contributionData = Object.fromEntries(formData.entries());
            contributionData.groupId = groupID;
            
            // The expenseId is already in contributionData via hidden input

            try {
                await apiCall(`/api/contributions/create`, 'POST', contributionData);
                
                hideModal(contributionModal);
                // Reload to reflect new contributions and updated balance/status
                window.location.reload(); 
            } catch (error) {
                console.error('Contribution Save Failed:', error.message);
            }
        });
    }
});
