// ============================================
// KANBAN-COMPONENT.JS - Kanban Board JavaScript
// ============================================
// 
// Features:
// - Drag and drop tasks between columns
// - Claim/unclaim tasks
// - Create new tasks
// - Expand task details
// - Real-time UI updates
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanban-board-container');
    if (!kanbanBoard) return;

    const groupID = kanbanBoard.dataset.groupId;
    const taskLists = document.querySelectorAll('.task-list');
    let draggedTask = null;

    // ============================================
    // API CALL HELPER
    // ============================================
    
    /**
     * Makes an API call to update a task
     * @param {string} taskId - Task ID
     * @param {string} endpoint - API endpoint path
     * @param {string} method - HTTP method
     * @param {object} payload - Request body
     */
    const updateTaskAPI = async (taskId, endpoint, method = 'PUT', payload = {}) => {
        try {
            const url = `/api/tasks/${endpoint}`;
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`API Error on ${endpoint}:`, errorData.message);
                return { success: false, message: errorData.message };
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('Network Error:', error);
            return { success: false, message: 'Network error or server unreachable.' };
        }
    };

    // ============================================
    // UI UPDATE HELPER
    // ============================================
    
    /**
     * Updates task card UI after API call
     * @param {HTMLElement} cardElement - Task card element
     * @param {string} newStage - New stage (TO_DO, IN_PROGRESS, DONE)
     * @param {object} newAssignee - New assignee info {id, name}
     */
    const updateTaskCardUI = (cardElement, newStage, newAssignee) => {
        // Update stage count if stage changed
        if (newStage) {
            const oldColumn = cardElement.closest('.kanban-column');
            const oldStage = oldColumn.dataset.stage;
            
            if (oldStage) {
                const oldCount = document.getElementById(`count-${oldStage}`);
                const newCount = document.getElementById(`count-${newStage}`);
                
                if (oldCount && newCount) {
                    oldCount.textContent = parseInt(oldCount.textContent) - 1;
                    newCount.textContent = parseInt(newCount.textContent) + 1;
                }
            }
        }
        
        // Update assignee if changed
        if (newAssignee !== undefined) {
            const assignedSpan = cardElement.querySelector('.assigned-user-name');
            const newMemberId = newAssignee.id || '';
            
            cardElement.dataset.memberId = newMemberId;

            if (assignedSpan) {
                assignedSpan.textContent = newAssignee.name || 'Unassigned';
                
                // Update styling
                assignedSpan.classList.remove('text-blue-600', 'text-red-500');
                if (newMemberId) {
                    assignedSpan.classList.add('text-blue-600');
                } else {
                    assignedSpan.classList.add('text-red-500');
                }
            }
            
            // Refresh expanded details to show correct buttons
            const expandedDetails = cardElement.querySelector('.task-details-expanded');
            if (!expandedDetails.classList.contains('hidden')) {
                expandedDetails.classList.add('hidden');
                setTimeout(() => expandedDetails.classList.remove('hidden'), 50);
            }
        }
    };

    // ============================================
    // DRAG AND DROP FUNCTIONALITY
    // ============================================
    
    // Make all task cards draggable
    document.querySelectorAll('.task-card').forEach(card => {
        // Drag start event
        card.addEventListener('dragstart', (e) => {
            draggedTask = card;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.taskId);
            setTimeout(() => card.classList.add('is-dragging'), 0);
        });

        // Drag end event
        card.addEventListener('dragend', () => {
            draggedTask.classList.remove('is-dragging');
            draggedTask = null;
        });
        
        // Click to expand task details
        card.addEventListener('click', (e) => {
            // Don't expand if clicking on action button
            if (e.target.closest('.action-btn')) return;

            const expandedDetails = card.querySelector('.task-details-expanded');
            expandedDetails.classList.toggle('hidden');
        });
    });

    // Handle drop zones (task lists)
    taskLists.forEach(list => {
        // Drag over event
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            list.classList.add('drag-over');
        });

        // Drag leave event
        list.addEventListener('dragleave', () => {
            list.classList.remove('drag-over');
        });

        // Drop event
        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            list.classList.remove('drag-over');

            if (!draggedTask) return;

            const taskId = e.dataTransfer.getData('text/plain');
            const newColumn = list.closest('.kanban-column');
            const newStage = newColumn.dataset.stage;
            const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            const oldList = draggedTask.parentElement;
            
            if (newStage) {
                // Move card in DOM first (optimistic UI update)
                list.appendChild(draggedTask);
                
                // Make API call to update stage
                const result = await updateTaskAPI(taskId, `${taskId}/stage`, 'PUT', { stage: newStage });
                
                if (result.success) {
                    // Update UI counts
                    updateTaskCardUI(taskCard, newStage);
                    console.log(`Task ${taskId} moved to ${newStage}`);
                } else {
                    // Revert on failure
                    oldList.appendChild(draggedTask);
                    console.error('Failed to change stage. Reverting UI.');
                    alert('Failed to update task stage. Please try again.');
                }
            }
        });
    });

    // ============================================
    // CLAIM/UNCLAIM BUTTONS
    // ============================================
    
    kanbanBoard.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const taskId = btn.dataset.taskId;
        const action = btn.dataset.action;
        const card = btn.closest('.task-card');

        if (!taskId) return;

        let result;
        if (action === 'claim') {
            result = await updateTaskAPI(taskId, `${taskId}/claim`, 'PUT', {});
        } else if (action === 'unclaim') {
            result = await updateTaskAPI(taskId, `${taskId}/unclaim`, 'PUT', {});
        }

        if (result && result.success) {
            // Extract assignee info from response
            const task = result.data.task;
            const newAssignee = task.groupMemberId 
                ? { id: task.groupMemberId, name: 'You' } 
                : { id: null, name: 'Unassigned' };
            
            updateTaskCardUI(card, null, newAssignee);
            console.log(`Task ${taskId} ${action}ed successfully`);
        } else if (result) {
            console.warn(`Action failed: ${result.message}`);
            alert(`Failed to ${action} task. ${result.message}`);
        }
    });

    // ============================================
    // CREATE TASK MODAL
    // ============================================
    
    const createTaskModal = document.getElementById('create-task-modal');
    const createTaskForm = document.getElementById('create-task-form');
    const cancelTaskBtn = document.getElementById('cancel-task-create-btn');

    // Open modal when clicking "New Task" button
    kanbanBoard.addEventListener('click', (e) => {
        if (e.target.classList.contains('create-task-btn') || 
            e.target.closest('.create-task-btn')) {
            createTaskModal.classList.remove('hidden');
        }
    });

    // Close modal on cancel
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            createTaskModal.classList.add('hidden');
            createTaskForm.reset();
        });
    }

    // Close modal when clicking outside
    createTaskModal.addEventListener('click', (e) => {
        if (e.target === createTaskModal) {
            createTaskModal.classList.add('hidden');
            createTaskForm.reset();
        }
    });

    // Handle form submission
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createTaskForm);
            const taskData = Object.fromEntries(formData.entries());
            taskData.groupId = parseInt(groupID);
            taskData.stage = 'TO_DO'; // New tasks start in TO_DO

            try {
                // Call correct API endpoint: POST /api/tasks
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to create task.');
                }

                // Success - reload page to show new task
                console.log('Task created successfully');
                window.location.reload();

            } catch (error) {
                console.error('Error creating task:', error);
                alert('Failed to create task. Please try again.');
            }
        });
    }
});