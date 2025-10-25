// Optional: Client-side password validation
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('form[action="/auth/register"]');
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            const password = document.getElementById('password').value;
            
            // Password length check
            if (password.length < 8) {
                e.preventDefault();
                alert('Password must be at least 8 characters long');
            }
        });
    }
});