// Optional: Add client-side validation or enhancements
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form[action="/auth/login"]');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const credentials = document.getElementById('credentials').value.trim();
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!credentials || !password) {
                e.preventDefault();
                alert('Please fill in all fields');
            }
        });
    }
});