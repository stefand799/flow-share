function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("active");

    document.body.style.overflow = "hidden";

    const firstInput = modal.querySelector("input, textarea, select");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("active");

    document.body.style.overflow = "";

    const form = modal.querySelector("form");
    if (form) {
    }
  }
}

function closeAllModals() {
  const activeModals = document.querySelectorAll(".modal.active");
  activeModals.forEach((modal) => {
    modal.classList.add("hidden");
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

function initializeModals() {
  const closeButtons = document.querySelectorAll(".modal-close");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal && modal.id) {
        closeModal(modal.id);
      }
    });
  });

  const closeModalButtons = document.querySelectorAll("[data-close-modal]");
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-close-modal");
      if (modalId) {
        closeModal(modalId);
      }
    });
  });

  const openModalButtons = document.querySelectorAll("[data-open-modal]");
  openModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-open-modal");
      if (modalId) {
        openModal(modalId);
      }
    });
  });

  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach((overlay) => {
    overlay.addEventListener("click", () => {
      const modal = overlay.closest(".modal");
      if (modal && modal.id) {
        closeModal(modal.id);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeModals);
} else {
  initializeModals();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { openModal, closeModal, closeAllModals, initializeModals };
}
