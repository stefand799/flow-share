// ============================================
// KANBAN-COMPONENT.JS - Kanban Board JavaScript
// ============================================
// 
// Features:
// - Drag and drop tasks between columns
// - Claim/unclaim tasks (anyone can claim, claimer or admin can unclaim)
// - Create new tasks
// - Edit existing tasks
// - Delete tasks
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
    // CLAIM/UNCLAIM/EDIT/DELETE BUTTONS
    // ============================================
    
    kanbanBoard.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const taskId = btn.dataset.taskId;
        const action = btn.dataset.action;
        const card = btn.closest('.task-card');

        if (!taskId) return;

        if (action === 'claim') {
            const result = await updateTaskAPI(taskId, `${taskId}/claim`, 'PUT', {});
            if (result && result.success) {
                // Refresh page to update UI with new buttons
                window.location.reload();
            }
        } else if (action === 'unclaim') {
            const result = await updateTaskAPI(taskId, `${taskId}/unclaim`, 'PUT', {});
            if (result && result.success) {
                // Refresh page to update UI with new buttons
                window.location.reload();
            }
        } else if (action === 'edit') {
            openEditModal(btn);
        } else if (action === 'delete') {
            await deleteTask(taskId, card);
        }
    });

    // ============================================
    // CREATE TASK MODAL
    // ============================================
    
    const createTaskBtn = document.querySelector('.create-task-btn');
    const createTaskModal = document.getElementById('create-task-modal');
    const createTaskForm = document.getElementById('create-task-form');
    const cancelCreateBtn = document.getElementById('cancel-task-create-btn');

    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', () => {
            createTaskModal.classList.remove('hidden');
        });
    }

    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            createTaskModal.classList.add('hidden');
            createTaskForm.reset();
        });
    }

    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createTaskForm);
            const taskData = {
                name: formData.get('name'),
                description: formData.get('description') || null,
                due: formData.get('due') || null,
                groupId: groupID
            };

            const result = await updateTaskAPI('', '', 'POST', taskData);

            if (result && result.success) {
                console.log('Task created successfully');
                window.location.reload();
            } else {
                alert('Failed to create task. Please try again.');
            }
        });
    }

    // ============================================
    // EDIT TASK MODAL
    // ============================================
    
    const editTaskModal = document.getElementById('edit-task-modal');
    const editTaskForm = document.getElementById('edit-task-form');
    const cancelEditBtn = document.getElementById('cancel-task-edit-btn');

    function openEditModal(editBtn) {
        const taskId = editBtn.dataset.taskId;
        const taskName = editBtn.dataset.taskName;
        const taskDescription = editBtn.dataset.taskDescription;
        const taskDue = editBtn.dataset.taskDue;

        document.getElementById('edit-task-id').value = taskId;
        document.getElementById('edit-task-name').value = taskName;
        document.getElementById('edit-task-description').value = taskDescription;
        document.getElementById('edit-task-due').value = taskDue;

        editTaskModal.classList.remove('hidden');
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editTaskModal.classList.add('hidden');
            editTaskForm.reset();
        });
    }

    if (editTaskForm) {
        editTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(editTaskForm);
            const taskId = formData.get('id');
            const taskData = {
                name: formData.get('name'),
                description: formData.get('description') || null,
                due: formData.get('due') || null
            };

            const result = await updateTaskAPI(taskId, taskId, 'PUT', taskData);

            if (result && result.success) {
                console.log('Task updated successfully');
                window.location.reload();
            } else {
                alert('Failed to update task. Please try again.');
            }
        });
    }

    // ============================================
    // DELETE TASK
    // ============================================
    
    async function deleteTask(taskId, cardElement) {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        const result = await updateTaskAPI(taskId, taskId, 'DELETE', {});

        if (result && result.success) {
            // Remove card from DOM
            const column = cardElement.closest('.kanban-column');
            const stage = column.dataset.stage;
            const countElement = document.getElementById(`count-${stage}`);
            
            cardElement.remove();
            
            // Update count
            if (countElement) {
                countElement.textContent = parseInt(countElement.textContent) - 1;
            }
            
            console.log('Task deleted successfully');
        } else {
            alert('Failed to delete task. Please try again.');
        }
    }

    // ============================================
    // CLOSE MODALS ON OUTSIDE CLICK
    // ============================================
    
    [createTaskModal, editTaskModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                    if (modal === createTaskModal) {
                        createTaskForm.reset();
                    } else if (modal === editTaskModal) {
                        editTaskForm.reset();
                    }
                }
            });
        }
    });
});