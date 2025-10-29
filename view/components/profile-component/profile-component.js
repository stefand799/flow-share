document.addEventListener("DOMContentLoaded", () => {
  const profileCard = document.getElementById("profile-card");

  const editProfileBtn = document.getElementById("edit-profile-btn");
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const saveProfileBtn = document.getElementById("save-profile-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

  const editProfileModal = document.getElementById("edit-profile-modal");
  const deleteAccountModal = document.getElementById("delete-account-modal");

  const editProfileForm = document.getElementById("edit-profile-form");
  const deleteConfirmationInput = document.getElementById(
    "delete-confirmation-input"
  );

  const firstNameInput = document.getElementById("edit-firstName");
  const lastNameInput = document.getElementById("edit-lastName");
  const phoneNumberInput = document.getElementById("edit-phoneNumber");
  const bioInput = document.getElementById("edit-bio");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      openModal("edit-profile-modal");
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      await updateProfile();
    });
  }

  if (bioInput) {
    bioInput.addEventListener("input", () => {
      const maxLength = 200;
      const currentLength = bioInput.value.length;

      if (currentLength > maxLength) {
        bioInput.value = bioInput.value.substring(0, maxLength);
      }
    });
  }

  /**
   * Updates user profile via API
   */
  async function updateProfile() {
    try {
      saveProfileBtn.disabled = true;
      saveProfileBtn.textContent = "Saving...";

      const formData = {
        firstName: firstNameInput.value.trim() || null,
        lastName: lastNameInput.value.trim() || null,
        phoneNumber: phoneNumberInput.value.trim() || null,
        bio: bioInput.value.trim() || null,
      };

      const userId = profileCard?.dataset.userId || getUserIdFromContext();

      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const updatedUser = await response.json();

      closeModal("edit-profile-modal");

      showSuccess("Profile updated successfully!");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Changes";
    }
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
      openModal("delete-account-modal");

      if (deleteConfirmationInput) {
        deleteConfirmationInput.value = "";
      }
    });
  }

  if (deleteConfirmationInput) {
    deleteConfirmationInput.addEventListener("input", () => {
      const isConfirmed =
        deleteConfirmationInput.value.toUpperCase() === "DELETE";
      confirmDeleteBtn.disabled = !isConfirmed;
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      await deleteAccount();
    });
  }

  /**
   * Deletes user account via API
   */
  async function deleteAccount() {
    try {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Deleting...";

      const userId = profileCard?.dataset.userId || getUserIdFromContext();

      const response = await fetch(`/api/user/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }

      closeModal("delete-account-modal");

      alert("Account deleted successfully. You will be redirected to login.");

      window.location.href = "/login";
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(`Failed to delete account: ${error.message}`);

      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = "Delete Account";
    }
  }

  /**
   * Gets user ID from various sources
   */
  function getUserIdFromContext() {
    if (profileCard?.dataset.userId) {
      return profileCard.dataset.userId;
    }

    if (typeof window.currentUserId !== "undefined") {
      return window.currentUserId;
    }

    const usernameInput = document.getElementById("edit-username");
    if (usernameInput?.dataset.userId) {
      return usernameInput.dataset.userId;
    }

    console.error("User ID not found");
    return null;
  }

  /**
   * Shows success message
   */
  function showSuccess(message) {
    profileCard?.classList.add("success");

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
      profileCard?.classList.remove("success");
    }, 3000);
  }

  /**
   * Validates form data before submission
   */
  function validateProfileForm() {
    let isValid = true;

    if (phoneNumberInput.value.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phoneNumberInput.value.trim())) {
        alert("Please enter a valid phone number");
        phoneNumberInput.focus();
        isValid = false;
      }
    }

    if (bioInput.value.length > 200) {
      alert("Bio must be 200 characters or less");
      bioInput.focus();
      isValid = false;
    }

    return isValid;
  }

  if (saveProfileBtn) {
    const originalClickHandler = saveProfileBtn.onclick;
    saveProfileBtn.onclick = async function (e) {
      if (!validateProfileForm()) {
        e.preventDefault();
        return;
      }
      if (originalClickHandler) {
        await originalClickHandler.call(this, e);
      }
    };
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      if (editProfileModal && !editProfileModal.classList.contains("hidden")) {
        e.preventDefault();
        saveProfileBtn?.click();
      }
    }
  });
});
