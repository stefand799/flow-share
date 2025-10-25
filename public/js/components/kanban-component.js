document.addEventListener('DOMContentLoaded', () => {
    const kanbanBoard = document.getElementById('kanban-board-container');
    if (!kanbanBoard) return;

    const groupID = kanbanBoard.dataset.groupId;
    const taskLists = document.querySelectorAll('.task-list');
    let draggedTask = null;

    const updateTaskAPI = async (taskId, actionType, payload = {}) => {
        try {
            const url = `/api/tasks/${actionType}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, groupId: groupID, ...payload }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`API Error on ${actionType}:`, errorData.message);
                return { success: false, message: errorData.message };
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('Network Error:', error);
            return { success: false, message: 'Network error or server unreachable.' };
        }
    };

    const updateTaskCardUI = (cardElement, newStage, newAssignee) => {
        if (newStage) {
            const oldStage = cardElement.closest('.kanban-column').dataset.stage;
            if (oldStage) {
                document.getElementById(`count-${oldStage}`).textContent = parseInt(document.getElementById(`count-${oldStage}`).textContent) - 1;
                document.getElementById(`count-${newStage}`).textContent = parseInt(document.getElementById(`count-${newStage}`).textContent) + 1;
            }
        }
        
        if (newAssignee !== undefined) {
            const assignedSpan = cardElement.querySelector('.assigned-user-name');
            const newMemberId = newAssignee.id || '';
            
            cardElement.dataset.memberId = newMemberId;
            cardElement.querySelector('.task-details-expanded').innerHTML = result.data.cardHtml;

            if (assignedSpan) {
                assignedSpan.textContent = newAssignee.name || 'Unassigned';
                
                assignedSpan.classList.remove('text-blue-600', 'text-red-500');
                if (newMemberId) {
                    assignedSpan.classList.add('text-blue-600');
                } else {
                    assignedSpan.classList.add('text-red-500');
                }
            }
            
            const expandedDetails = cardElement.querySelector('.task-details-expanded');
            if (!expandedDetails.classList.contains('hidden')) {
                expandedDetails.classList.add('hidden');
                setTimeout(() => expandedDetails.classList.remove('hidden'), 50);
            }
        }
    };

    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedTask = card;
            e.dataTransfer.setData('text/plain', card.dataset.taskId);
            setTimeout(() => card.classList.add('is-dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            draggedTask.classList.remove('is-dragging');
            draggedTask = null;
        });
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) return;

            const expandedDetails = card.querySelector('.task-details-expanded');
            expandedDetails.classList.toggle('hidden');
        });
    });

    taskLists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            list.classList.add('drag-over');
        });

        list.addEventListener('dragleave', () => {
            list.classList.remove('drag-over');
        });

        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            list.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const newColumn = list.closest('.kanban-column');
            const newStage = newColumn.dataset.stage;
            const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            
            if (draggedTask && newStage) {
                const oldList = draggedTask.parentElement;
                list.appendChild(draggedTask);
                
                const result = await updateTaskAPI(taskId, 'change-stage', { newStage });
                
                if (result.success) {
                    updateTaskCardUI(taskCard, newStage);
                } else {
                    oldList.appendChild(draggedTask);
                    console.error('Failed to change stage. Reverting UI.');
                }
            }
        });
    });

    kanbanBoard.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;

        const taskId = btn.dataset.taskId;
        const action = btn.dataset.action;
        const card = btn.closest('.task-card');

        if (!taskId) return;

        let result;
        if (action === 'claim') {
            result = await updateTaskAPI(taskId, 'claim', {});
        } else if (action === 'unclaim') {
            result = await updateTaskAPI(taskId, 'unclaim', {});
        }

        if (result && result.success) {
            const newAssignee = result.data.newAssignee || { id: null, name: 'Unassigned' }; 
            updateTaskCardUI(card, null, newAssignee);

        } else if (result) {
            console.warn(`Action failed: ${result.message}`);
        }
    });
    
    const createTaskModal = document.getElementById('create-task-modal');
    const createTaskForm = document.getElementById('create-task-form');
    const cancelTaskBtn = document.getElementById('cancel-task-create-btn');

    kanbanBoard.addEventListener('click', (e) => {
        if (e.target.classList.contains('create-task-btn')) {
            createTaskModal.classList.remove('hidden');
        }
    });

    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            createTaskModal.classList.add('hidden');
            createTaskForm.reset();
        });
    }

    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createTaskForm);
            const taskData = Object.fromEntries(formData.entries());
            taskData.groupId = groupID;
            taskData.stage = 'TO_DO'; 

            try {
                const response = await fetch('/api/tasks/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to create task.');
                }

                window.location.reload(); 

            } catch (error) {
                console.error('Error creating task:', error);
            }
        });
    }
});
