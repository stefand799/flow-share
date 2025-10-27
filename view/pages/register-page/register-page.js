document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("emailAddress");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const toggleConfirmPasswordBtn = document.getElementById(
    "toggle-confirm-password"
  );
  const submitBtn = document.getElementById("register-submit-btn");
  const errorAlert = document.getElementById("error-alert");

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      togglePasswordVisibility(passwordInput, togglePasswordBtn);
    });
  }

  if (toggleConfirmPasswordBtn && confirmPasswordInput) {
    toggleConfirmPasswordBtn.addEventListener("click", () => {
      togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn);
    });
  }

  function togglePasswordVisibility(input, button) {
    const type = input.getAttribute("type");

    if (type === "password") {
      input.setAttribute("type", "text");
      button.textContent = "🙈";
    } else {
      input.setAttribute("type", "password");
      button.textContent = "👁️";
    }
  }

  if (usernameInput) {
    usernameInput.addEventListener("input", () => {
      validateUsername();
    });

    usernameInput.addEventListener("blur", () => {
      validateUsername();
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      validateEmail();
    });

    emailInput.addEventListener("blur", () => {
      validateEmail();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      validatePassword();
      checkPasswordMatch();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", () => {
      checkPasswordMatch();
    });

    confirmPasswordInput.addEventListener("blur", () => {
      checkPasswordMatch();
    });
  }

  function validateUsername() {
    const username = usernameInput.value.trim();
    const errorElement = document.getElementById("username-error");

    if (!username) {
      showError(errorElement, "Username is required");
      usernameInput.classList.remove("valid");
      usernameInput.classList.add("invalid");
      return false;
    }

    if (username.length < 3) {
      showError(errorElement, "Username must be at least 3 characters");
      usernameInput.classList.remove("valid");
      usernameInput.classList.add("invalid");
      return false;
    }

    if (username.length > 30) {
      showError(errorElement, "Username must be less than 30 characters");
      usernameInput.classList.remove("valid");
      usernameInput.classList.add("invalid");
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError(
        errorElement,
        "Username can only contain letters, numbers, and underscores"
      );
      usernameInput.classList.remove("valid");
      usernameInput.classList.add("invalid");
      return false;
    }

    clearError(errorElement);
    usernameInput.classList.remove("invalid");
    usernameInput.classList.add("valid");
    return true;
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    const errorElement = document.getElementById("email-error");

    if (!email) {
      showError(errorElement, "Email is required");
      emailInput.classList.remove("valid");
      emailInput.classList.add("invalid");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError(errorElement, "Please enter a valid email address");
      emailInput.classList.remove("valid");
      emailInput.classList.add("invalid");
      return false;
    }

    clearError(errorElement);
    emailInput.classList.remove("invalid");
    emailInput.classList.add("valid");
    return true;
  }

  function validatePassword() {
    const password = passwordInput.value;
    const errorElement = document.getElementById("password-error");

    if (!password) {
      showError(errorElement, "Password is required");
      passwordInput.classList.remove("valid");
      passwordInput.classList.add("invalid");
      return false;
    }

    if (password.length < 6) {
      showError(errorElement, "Password must be at least 6 characters");
      passwordInput.classList.remove("valid");
      passwordInput.classList.add("invalid");
      return false;
    }

    clearError(errorElement);
    passwordInput.classList.remove("invalid");
    passwordInput.classList.add("valid");
    return true;
  }

  function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const errorElement = document.getElementById("confirm-password-error");

    if (!confirmPassword) {
      clearError(errorElement);
      confirmPasswordInput.classList.remove("valid", "invalid");
      return true;
    }

    if (password !== confirmPassword) {
      showError(errorElement, "Passwords do not match");
      confirmPasswordInput.classList.remove("valid");
      confirmPasswordInput.classList.add("invalid");
      return false;
    }

    clearError(errorElement);
    confirmPasswordInput.classList.remove("invalid");
    confirmPasswordInput.classList.add("valid");
    return true;
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  function clearError(element) {
    if (element) {
      element.textContent = "";
      element.style.display = "none";
    }
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      clearAllErrors();

      const isUsernameValid = validateUsername();
      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      const isConfirmPasswordValid = checkPasswordMatch();

      if (passwordInput.value !== confirmPasswordInput.value) {
        showError(
          document.getElementById("confirm-password-error"),
          "Passwords do not match"
        );
        return;
      }

      if (
        isUsernameValid &&
        isEmailValid &&
        isPasswordValid &&
        isConfirmPasswordValid
      ) {
        setLoadingState(true);
        registerForm.submit();
      } else {
        const firstError = document.querySelector(".form-input.invalid");
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  function clearAllErrors() {
    const errorElements = document.querySelectorAll(".form-error");
    errorElements.forEach((element) => {
      element.textContent = "";
      element.style.display = "none";
    });

    const inputs = document.querySelectorAll(".form-input");
    inputs.forEach((input) => {
      input.classList.remove("invalid");
    });
  }

  function setLoadingState(isLoading) {
    if (submitBtn) {
      if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add("btn-loading");
        submitBtn.textContent = "Creating Account...";
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove("btn-loading");
        submitBtn.textContent = "Create Account";
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

  const allInputs = [
    usernameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
  ];
  allInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        if (errorAlert) {
          errorAlert.style.display = "none";
        }
      });
    }
  });
});
