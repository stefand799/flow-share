document.addEventListener("DOMContentLoaded", () => {
  const homePage = document.querySelector(".home-page");
  const profileSection = document.querySelector(".profile-section");
  const groupsSection = document.querySelector(".groups-section");

  function initializePage() {
    if (homePage) {
      homePage.classList.add("fade-in");
    }

    console.log("Home page loaded successfully");

    checkUserData();
  }

  function checkUserData() {
    const profileCard = document.querySelector(".profile-card");
    if (!profileCard) {
      console.warn("Profile component not found");
    }

    const groupsContainer = document.querySelector(".groups-list-container");
    if (!groupsContainer) {
      console.warn("Groups component not found");
    }
  }

  async function refreshGroups() {
    try {
      setLoadingState(true);

      const response = await fetch("/api/group", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const groups = await response.json();

      updateGroupCount(groups.length);

      window.location.reload();
    } catch (error) {
      console.error("Error refreshing groups:", error);
      showError("Failed to refresh groups. Please try again.");
    } finally {
      setLoadingState(false);
    }
  }

  function updateGroupCount(count) {
    const groupCount = document.querySelector(".group-count");
    if (groupCount) {
      const plural = count !== 1 ? "s" : "";
      groupCount.textContent = `${count} group${plural}`;
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      homePage?.classList.add("loading");
      groupsSection?.classList.add("loading");
    } else {
      homePage?.classList.remove("loading");
      groupsSection?.classList.remove("loading");
    }
  }

  function showError(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-error";
    alert.innerHTML = `
            <span class="alert-icon">⚠️</span>
            <span class="alert-message">${message}</span>
        `;

    const pageHeader = document.querySelector(".page-header");
    if (pageHeader) {
      pageHeader.insertAdjacentElement("afterend", alert);

      setTimeout(() => {
        alert.style.transition = "opacity 0.3s";
        alert.style.opacity = "0";
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    }
  }

  window.addEventListener("profile-updated", () => {
    console.log("Profile updated, refreshing page...");
  });

  window.addEventListener("group-created", () => {
    console.log("Group created, refreshing groups...");
    refreshGroups();
  });

  window.addEventListener("group-deleted", () => {
    console.log("Group deleted, refreshing groups...");
    refreshGroups();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      refreshGroups();
    }
  });

  function handleResize() {
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      profileSection?.style.removeProperty("position");
    }
  }

  window.addEventListener("resize", handleResize);
  handleResize();

  const groupCount = document.querySelector(".group-count");
  if (groupCount) {
    groupCount.style.cursor = "pointer";
    groupCount.addEventListener("click", () => {
      groupsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  initializePage();

  window.homePageUtils = {
    refreshGroups,
    showError,
    setLoadingState,
  };
});
