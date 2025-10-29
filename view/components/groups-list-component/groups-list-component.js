document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("group-carousel");
  const leftArrow = document.getElementById("carousel-left");
  const rightArrow = document.getElementById("carousel-right");
  const indicators = document.getElementById("carousel-indicators");
  const createGroupCard = document.getElementById("create-group-card");
  const createGroupBtn = document.getElementById("create-group-btn");
  const createGroupModal = document.getElementById("create-group-modal");
  const createGroupForm = document.getElementById("create-group-form");

  const groupNameInput = document.getElementById("group-name");
  const groupDescriptionInput = document.getElementById("group-description");
  const groupWhatsappInput = document.getElementById("group-whatsapp-url");

  let allCards = [];
  let currentIndex = 0;
  let isScrolling = false;

  function initializeCarousel() {
    if (!carousel) return;

    allCards = Array.from(carousel.querySelectorAll(".group-card"));

    if (allCards.length === 0) return;

    createIndicators();

    setupScrollDetection();

    updateArrowStates();

    if (allCards.length > 0) {
      allCards[0].classList.add("active");
      updateIndicators();
    }
  }

  function setupScrollDetection() {
    if (!carousel) return;

    let scrollTimeout;

    carousel.addEventListener("scroll", () => {
      isScrolling = true;

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        detectActiveCard();
      }, 150);

      updateArrowStates();
    });
  }

  /**
   * Detects which card is currently in the center of the viewport
   */
  function detectActiveCard() {
    if (!carousel || allCards.length === 0) return;

    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;

    let closestCard = allCards[0];
    let closestDistance = Infinity;

    allCards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - carouselCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
        currentIndex = index;
      }
    });

    allCards.forEach((card) => card.classList.remove("active"));
    closestCard.classList.add("active");

    updateIndicators();
  }

  if (leftArrow && rightArrow && carousel) {
    leftArrow.addEventListener("click", () => {
      scrollToPrevious();
    });

    rightArrow.addEventListener("click", () => {
      scrollToNext();
    });
  }

  function scrollToPrevious() {
    if (currentIndex > 0) {
      scrollToCard(currentIndex - 1);
    }
  }

  function scrollToNext() {
    if (currentIndex < allCards.length - 1) {
      scrollToCard(currentIndex + 1);
    }
  }

  function scrollToCard(index) {
    if (index < 0 || index >= allCards.length) return;

    const card = allCards[index];
    const cardRect = card.getBoundingClientRect();
    const carouselRect = carousel.getBoundingClientRect();

    const scrollLeft =
      carousel.scrollLeft +
      (cardRect.left - carouselRect.left) -
      carouselRect.width / 2 +
      cardRect.width / 2;

    carousel.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });

    currentIndex = index;
  }

  function updateArrowStates() {
    if (!leftArrow || !rightArrow || !carousel) return;

    const scrollLeft = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    leftArrow.disabled = scrollLeft <= 5;

    rightArrow.disabled = scrollLeft >= maxScroll - 5;
  }

  function createIndicators() {
    if (!indicators || allCards.length === 0) return;

    indicators.innerHTML = "";

    allCards.forEach((card, index) => {
      const indicator = document.createElement("button");
      indicator.className = "carousel-indicator";
      indicator.setAttribute("aria-label", `Go to group ${index + 1}`);
      indicator.setAttribute("data-index", index);

      indicator.addEventListener("click", () => {
        scrollToCard(index);
      });

      indicators.appendChild(indicator);
    });

    updateIndicators();
  }

  function updateIndicators() {
    if (!indicators) return;

    const allIndicators = indicators.querySelectorAll(".carousel-indicator");
    allIndicators.forEach((indicator, index) => {
      if (index === currentIndex) {
        indicator.classList.add("active");
      } else {
        indicator.classList.remove("active");
      }
    });
  }

  const groupCards = document.querySelectorAll(".group-card[data-group-id]");
  groupCards.forEach((card) => {
    card.addEventListener("click", () => {
      const groupId = card.dataset.groupId;
      if (groupId) {
        window.location.href = `/dashboard/${groupId}`;
      }
    });

    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });

  if (createGroupCard) {
    createGroupCard.addEventListener("click", () => {
      openModal("create-group-modal");
    });

    createGroupCard.setAttribute("tabindex", "0");
    createGroupCard.setAttribute("role", "button");
    createGroupCard.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal("create-group-modal");
      }
    });
  }

  if (createGroupBtn) {
    createGroupBtn.addEventListener("click", async () => {
      await createGroup();
    });
  }

  if (groupDescriptionInput) {
    groupDescriptionInput.addEventListener("input", () => {
      const maxLength = 200;
      const currentLength = groupDescriptionInput.value.length;

      if (currentLength > maxLength) {
        groupDescriptionInput.value = groupDescriptionInput.value.substring(
          0,
          maxLength
        );
      }
    });
  }

  /**
   * Creates a new group via API
   */
  async function createGroup() {
    try {
      const name = groupNameInput.value.trim();
      const description = groupDescriptionInput.value.trim();
      const whatsappUrl = groupWhatsappInput?.value.trim() || "";

      console.log("Creating group with data:", {
        name,
        description,
        whatsappUrl,
      });

      if (!name || name.length < 3) {
        showError("Group name must be at least 3 characters");
        return;
      }

      if (name.length > 50) {
        showError("Group name must be less than 50 characters");
        return;
      }

      createGroupBtn.disabled = true;
      createGroupBtn.textContent = "Creating...";

      const requestBody = {
        name,
        description: description || null,
        whatsappGroupUrl: whatsappUrl || null,
      };

      console.log("Request body:", requestBody);

      const response = await fetch("/api/group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        showSuccess("Group created successfully!");

        closeModal("create-group-modal");

        createGroupForm.reset();

        setTimeout(() => {
          window.location.href = `/dashboard/${data.group.id}`;
        }, 1000);
      } else {
        showError(data.message || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showError("An error occurred while creating the group");
    } finally {
      createGroupBtn.disabled = false;
      createGroupBtn.textContent = "Create Group";
    }
  }

  /**
   * Shows error message
   */
  function showError(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-error";
    alert.textContent = message;
    alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000000;
            animation: slideIn 0.3s ease-out;
        `;

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.transition = "opacity 0.3s";
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  /**
   * Shows success message
   */
  function showSuccess(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-success";
    alert.textContent = message;
    alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000000;
            animation: slideIn 0.3s ease-out;
        `;

    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.transition = "opacity 0.3s";
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  document.addEventListener("keydown", (e) => {
    if (
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      if (e.key === "ArrowLeft") {
        scrollToPrevious();
      } else if (e.key === "ArrowRight") {
        scrollToNext();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      if (createGroupCard) {
        openModal("create-group-modal");
      }
    }
  });

  if (carousel) {
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true }
    );

    function handleSwipe() {
      const swipeThreshold = 50;

      if (touchStartX - touchEndX > swipeThreshold) {
        scrollToNext();
      }

      if (touchEndX - touchStartX > swipeThreshold) {
        scrollToPrevious();
      }
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      detectActiveCard();
      updateArrowStates();
    }, 250);
  });

  initializeCarousel();
});
