// ============================================
// LOGIN-PAGE.JS - Login Page JavaScript
// ============================================
// 
// This file handles:
// - Form validation
// - Password visibility toggle
// - Form submission with loading state
// - Error display
// 
// Dependencies: None (standalone)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================
    // DOM ELEMENTS
    // ============================================
    
    const loginForm = document.getElementById('login-form');
    const credentialsInput = document.getElementById('credentials');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const submitBtn = document.getElementById('login-submit-btn');
    const errorAlert = document.getElementById('error-alert');
    
    // ============================================
    // PASSWORD VISIBILITY TOGGLE
    // ============================================
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type');
            
            if (type === 'password') {
                passwordInput.setAttribute('type', 'text');
                togglePasswordBtn.textContent = '🙈'; // Hide icon
            } else {
                passwordInput.setAttribute('type', 'password');
                togglePasswordBtn.textContent = '👁️'; // Show icon
            }
        });
    }
    
    // ============================================
    // FORM VALIDATION
    // ============================================
    
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        clearErrors();
        
        // Validate credentials
        if (!credentialsInput.value.trim()) {
            showError('credentials-error', 'Please enter your username, email, or phone');
            isValid = false;
        }
        
        // Validate password
        if (!passwordInput.value) {
            showError('password-error', 'Please enter your password');
            isValid = false;
        }
        
        return isValid;
    }
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function clearErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }
    
    // Clear error message when user starts typing
    if (credentialsInput) {
        credentialsInput.addEventListener('input', () => {
            const errorElement = document.getElementById('credentials-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
            if (errorAlert) {
                errorAlert.style.display = 'none';
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const errorElement = document.getElementById('password-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
            if (errorAlert) {
                errorAlert.style.display = 'none';
            }
        });
    }
    
    // ============================================
    // FORM SUBMISSION
    // ============================================
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            // Show loading state
            setLoadingState(true);
            
            // Submit form normally (using traditional form POST)
            // The form will handle redirect/error display on the server side
            loginForm.submit();
        });
    }
    
    function setLoadingState(isLoading) {
        if (submitBtn) {
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.classList.add('btn-loading');
                submitBtn.textContent = 'Logging in...';
            } else {
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                submitBtn.textContent = 'Login';
            }
        }
    }
    
    // ============================================
    // ERROR ALERT AUTO-HIDE
    // ============================================
    
    // Auto-hide error alert after 5 seconds
    if (errorAlert) {
        setTimeout(() => {
            errorAlert.style.transition = 'opacity 0.3s';
            errorAlert.style.opacity = '0';
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 300);
        }, 5000);
    }
    
    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    
    // Allow Enter key in password field to submit form
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
});