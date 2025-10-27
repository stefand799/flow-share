document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const credentialsInput = document.getElementById("credentials");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const submitBtn = document.getElementById("login-submit-btn");
  const errorAlert = document.getElementById("error-alert");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type");

      if (type === "password") {
        passwordInput.setAttribute("type", "text");
        togglePasswordBtn.textContent = "🙈";
      } else {
        passwordInput.setAttribute("type", "password");
        togglePasswordBtn.textContent = "👁️";
      }
    });
  }

  function validateForm() {
    let isValid = true;

    clearErrors();

    if (!credentialsInput.value.trim()) {
      showError(
        "credentials-error",
        "Please enter your username, email, or phone"
      );
      isValid = false;
    }

    if (!passwordInput.value) {
      showError("password-error", "Please enter your password");
      isValid = false;
    }

    return isValid;
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".form-error");
    errorElements.forEach((element) => {
      element.textContent = "";
      element.style.display = "none";
    });
  }

  if (credentialsInput) {
    credentialsInput.addEventListener("input", () => {
      const errorElement = document.getElementById("credentials-error");
      if (errorElement) {
        errorElement.textContent = "";
      }
      if (errorAlert) {
        errorAlert.style.display = "none";
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const errorElement = document.getElementById("password-error");
      if (errorElement) {
        errorElement.textContent = "";
      }
      if (errorAlert) {
        errorAlert.style.display = "none";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setLoadingState(true);

      loginForm.submit();
    });
  }

  function setLoadingState(isLoading) {
    if (submitBtn) {
      if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add("btn-loading");
        submitBtn.textContent = "Logging in...";
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove("btn-loading");
        submitBtn.textContent = "Login";
      }
    }
  }

  if (errorAlert) {
    setTimeout(() => {
      errorAlert.style.transition = "opacity 0.3s";
      errorAlert.style.opacity = "0";
      setTimeout(() => {
        errorAlert.style.display = "none";
      }, 300);
    }, 5000);
  }

  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loginForm.dispatchEvent(new Event("submit"));
      }
    });
  }
});
