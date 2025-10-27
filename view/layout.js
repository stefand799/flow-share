document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  const logoutModal = document.getElementById("logout-modal");
  const confirmLogoutBtn = document.getElementById("confirm-logout-btn");

  if (logoutBtn && logoutModal) {
    logoutBtn.addEventListener("click", () => {
      logoutModal.classList.remove("hidden");
      logoutModal.classList.add("active");
    });
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener("click", async () => {
      try {
        confirmLogoutBtn.disabled = true;
        confirmLogoutBtn.textContent = "Logging out...";

        const response = await fetch("/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          window.location.href = "/login";
        } else {
          alert("Logout failed. Please try again.");
          confirmLogoutBtn.disabled = false;
          confirmLogoutBtn.textContent = "Logout";
        }
      } catch (error) {
        console.error("Logout error:", error);
        alert("An error occurred during logout. Please try again.");
        confirmLogoutBtn.disabled = false;
        confirmLogoutBtn.textContent = "Logout";
      }
    });
  }

  const closeButtons = document.querySelectorAll("[data-close-modal]");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-close-modal");
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("active");
      }
    });
  });

  const modalCloseButtons = document.querySelectorAll(".modal-close");
  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("active");
      }
    });
  });

  const modalOverlays = document.querySelectorAll(".modal-overlay");
  modalOverlays.forEach((overlay) => {
    overlay.addEventListener("click", () => {
      const modal = overlay.closest(".modal");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("active");
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal.active");
      if (activeModal) {
        activeModal.classList.add("hidden");
        activeModal.classList.remove("active");
      }
    }
  });

  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });
});
