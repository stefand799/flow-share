document.addEventListener("DOMContentLoaded", () => {
  const kanbanContainer = document.getElementById("kanban-board-container");
  const groupId = kanbanContainer?.dataset.groupId;

  const taskLists = document.querySelectorAll(".task-list");
  let draggedTask = null;

  const createTaskModal = document.getElementById("create-task-modal");
  const createTaskForm = document.getElementById("create-task-form");
  const createTaskBtn = document.querySelector(".create-task-btn");
  const cancelCreateBtn = document.getElementById("cancel-task-create-btn");

  /**
   * Generic API call for task operations
   * @param {string|number} taskId - Task ID
   * @param {string} endpoint - API endpoint suffix (e.g., '123/stage' or just '123')
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} data - Request body data
   * @returns {Promise<object>} - Response object with success flag
   */
  const updateTaskAPI = async (taskId, endpoint, method, data) => {
    try {
      const response = await fetch(`/api/task/${endpoint}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        return { success: false, error: await response.text() };
      }

      return { success: true, data: await response.json() };
    } catch (err) {
      console.error("API Error:", err);
      return { success: false, error: err.message };
    }
  };

  if (createTaskBtn) {
    createTaskBtn.addEventListener("click", () => {
      createTaskModal.classList.remove("hidden");
    });
  }

  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener("click", () => {
      createTaskModal.classList.add("hidden");
      createTaskForm.reset();
    });
  }

  if (createTaskForm) {
    createTaskForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(createTaskForm);
      const taskData = {
        groupId: parseInt(groupId),
        name: formData.get("name"),
        description: formData.get("description") || null,
        due: formData.get("due") || null,
        stage: "TO_DO",
      };

      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        console.log("Task created successfully");
        window.location.reload();
      } else {
        alert("Failed to create task. Please try again.");
      }
    });
  }

  document.addEventListener("click", async (e) => {
    const claimBtn = e.target.closest(".claim-btn");
    const unclaimBtn = e.target.closest(".unclaim-btn");

    if (claimBtn) {
      const taskId = claimBtn.dataset.taskId;
      const result = await updateTaskAPI(taskId, `${taskId}/claim`, "PUT", {});

      if (result.success) {
        console.log("Task claimed successfully");
        window.location.reload();
      } else {
        alert("Failed to claim task. Please try again.");
      }
    }

    if (unclaimBtn) {
      const taskId = unclaimBtn.dataset.taskId;
      const result = await updateTaskAPI(
        taskId,
        `${taskId}/unclaim`,
        "PUT",
        {}
      );

      if (result.success) {
        console.log("Task unclaimed successfully");
        window.location.reload();
      } else {
        alert("Failed to unclaim task. Please try again.");
      }
    }
  });

  document.addEventListener("click", (e) => {
    const actionBtn = e.target.closest(".action-btn");

    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const taskId = actionBtn.dataset.taskId;
    const taskCard = actionBtn.closest(".task-card");

    if (action === "edit") {
      openEditModal(actionBtn);
    } else if (action === "delete") {
      deleteTask(taskId, taskCard);
    }
  });

  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      draggedTask = card;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.dataset.taskId);
      setTimeout(() => card.classList.add("is-dragging"), 0);
    });

    card.addEventListener("dragend", () => {
      draggedTask.classList.remove("is-dragging");
      draggedTask = null;
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".action-btn")) return;

      const expandedDetails = card.querySelector(".task-details-expanded");
      expandedDetails.classList.toggle("hidden");
    });
  });

  taskLists.forEach((list) => {
    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      list.classList.add("drag-over");
    });

    list.addEventListener("dragleave", () => {
      list.classList.remove("drag-over");
    });

    list.addEventListener("drop", async (e) => {
      e.preventDefault();
      list.classList.remove("drag-over");

      if (!draggedTask) return;

      const taskId = e.dataTransfer.getData("text/plain");
      const newColumn = list.closest(".kanban-column");
      const newStage = newColumn.dataset.stage;

      const oldColumn = draggedTask.closest(".kanban-column");
      const oldStage = oldColumn.dataset.stage;
      const oldList = draggedTask.parentElement;

      if (oldStage === newStage) {
        return;
      }

      if (newStage) {
        list.appendChild(draggedTask);

        updateTaskCounts(oldStage, newStage);

        const result = await updateTaskAPI(taskId, `${taskId}/stage`, "PUT", {
          stage: newStage,
        });

        if (result.success) {
          console.log(`Task ${taskId} moved to ${newStage}`);
        } else {
          oldList.appendChild(draggedTask);

          updateTaskCounts(newStage, oldStage);
          console.error("Failed to change stage. Reverting UI.");
          alert("Failed to update task stage. Please try again.");
        }
      }
    });
  });

  /**
   * Updates task count badges when moving between stages
   * @param {string} fromStage - Source stage (TO_DO, IN_PROGRESS, DONE)
   * @param {string} toStage - Destination stage (TO_DO, IN_PROGRESS, DONE)
   */
  const updateTaskCounts = (fromStage, toStage) => {
    const fromCount = document.getElementById(`count-${fromStage}`);
    const toCount = document.getElementById(`count-${toStage}`);

    if (fromCount && toCount) {
      fromCount.textContent = parseInt(fromCount.textContent) - 1;
      toCount.textContent = parseInt(toCount.textContent) + 1;
    }
  };

  const editTaskModal = document.getElementById("edit-task-modal");
  const editTaskForm = document.getElementById("edit-task-form");
  const cancelEditBtn = document.getElementById("cancel-task-edit-btn");

  function openEditModal(editBtn) {
    const taskId = editBtn.dataset.taskId;
    const taskName = editBtn.dataset.taskName;
    const taskDescription = editBtn.dataset.taskDescription;
    const taskDue = editBtn.dataset.taskDue;

    document.getElementById("edit-task-id").value = taskId;
    document.getElementById("edit-task-name").value = taskName;
    document.getElementById("edit-task-description").value = taskDescription;
    document.getElementById("edit-task-due").value = taskDue;

    editTaskModal.classList.remove("hidden");
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      editTaskModal.classList.add("hidden");
      editTaskForm.reset();
    });
  }

  if (editTaskForm) {
    editTaskForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(editTaskForm);
      const taskId = formData.get("id");
      const taskData = {
        name: formData.get("name"),
        description: formData.get("description") || null,
        due: formData.get("due") || null,
      };

      const result = await updateTaskAPI(taskId, taskId, "PUT", taskData);

      if (result && result.success) {
        console.log("Task updated successfully");
        window.location.reload();
      } else {
        alert("Failed to update task. Please try again.");
      }
    });
  }

  async function deleteTask(taskId, cardElement) {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    const result = await updateTaskAPI(taskId, taskId, "DELETE", {});

    if (result && result.success) {
      const column = cardElement.closest(".kanban-column");
      const stage = column.dataset.stage;
      const countElement = document.getElementById(`count-${stage}`);

      cardElement.remove();

      if (countElement) {
        countElement.textContent = parseInt(countElement.textContent) - 1;
      }

      console.log("Task deleted successfully");
    } else {
      alert("Failed to delete task. Please try again.");
    }
  }

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", () => {
      const modal = overlay.closest(".modal");
      if (modal) {
        modal.classList.add("hidden");
      }
    });
  });

  document.querySelectorAll(".modal-close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      const modal = closeBtn.closest(".modal");
      if (modal) {
        modal.classList.add("hidden");
      }
    });
  });
});
