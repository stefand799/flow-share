document.addEventListener("DOMContentLoaded", () => {
  const dashboardPage = document.querySelector(".dashboard-page");
  const kanbanBtn = document.getElementById("kanban-btn");
  const expensesBtn = document.getElementById("expenses-btn");
  const kanbanView = document.getElementById("kanban-view");
  const expensesView = document.getElementById("expenses-view");
  const contentContainer = document.querySelector(".content-container");

  const groupId = getGroupId();

  function switchView(viewName) {
    if (viewName === "kanban") {
      kanbanBtn.classList.add("active");
      expensesBtn.classList.remove("active");

      kanbanView.classList.remove("hidden");
      kanbanView.classList.add("active");

      expensesView.classList.add("hidden");
      expensesView.classList.remove("active");
    } else if (viewName === "expenses") {
      expensesBtn.classList.add("active");
      kanbanBtn.classList.remove("active");

      expensesView.classList.remove("hidden");
      expensesView.classList.add("active");

      kanbanView.classList.add("hidden");
      kanbanView.classList.remove("active");
    }

    if (groupId) {
      localStorage.setItem(`dashboardView-${groupId}`, viewName);
    }

    window.dispatchEvent(
      new CustomEvent("view-changed", {
        detail: { view: viewName, groupId },
      })
    );
  }

  function loadSavedView() {
    if (!groupId) return "kanban";

    const savedView = localStorage.getItem(`dashboardView-${groupId}`);
    return savedView || "kanban";
  }

  if (kanbanBtn) {
    kanbanBtn.addEventListener("click", () => {
      switchView("kanban");
    });
  }

  if (expensesBtn) {
    expensesBtn.addEventListener("click", () => {
      switchView("expenses");
    });
  }

  function initializePage() {
    if (dashboardPage) {
      dashboardPage.classList.add("fade-in");
    }

    const savedView = loadSavedView();
    switchView(savedView);

    console.log("Dashboard page loaded for group:", groupId);
    console.log("Initial view:", savedView);
  }

  function getGroupId() {
    const pathParts = window.location.pathname.split("/");
    const dashboardIndex = pathParts.indexOf("dashboard");

    if (dashboardIndex !== -1 && pathParts[dashboardIndex + 1]) {
      return pathParts[dashboardIndex + 1];
    }

    return null;
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      dashboardPage?.classList.add("loading");
      contentContainer?.classList.add("loading");
    } else {
      dashboardPage?.classList.remove("loading");
      contentContainer?.classList.remove("loading");
    }
  }

  function showError(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-error";
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
      alert.style.transition = "opacity 0.3s";
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  function showSuccess(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-success";
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
      alert.style.transition = "opacity 0.3s";
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }

  window.addEventListener("task-updated", (e) => {
    console.log("Task updated:", e.detail);
  });

  window.addEventListener("expense-updated", (e) => {
    console.log("Expense updated:", e.detail);
  });

  window.addEventListener("member-added", (e) => {
    console.log("Member added:", e.detail);
    showSuccess("Member added successfully!");
  });

  window.addEventListener("member-removed", (e) => {
    console.log("Member removed:", e.detail);
    showSuccess("Member removed successfully!");
  });

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "1") {
      e.preventDefault();
      switchView("kanban");
    }

    if (e.altKey && e.key === "2") {
      e.preventDefault();
      switchView("expenses");
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      window.location.href = "/home";
    }
  });

  function handleResize() {
    const isMobile = window.innerWidth < 1024;
    const leftColumn = document.querySelector(".left-column");

    if (isMobile) {
      leftColumn?.style.removeProperty("position");
    }
  }

  window.addEventListener("resize", handleResize);
  handleResize();

  async function refreshDashboard() {
    try {
      setLoadingState(true);

      window.location.reload();
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      showError("Failed to refresh dashboard");
    } finally {
      setLoadingState(false);
    }
  }

  initializePage();

  window.dashboardUtils = {
    switchView,
    showError,
    showSuccess,
    setLoadingState,
    refreshDashboard,
    groupId,
  };
});
