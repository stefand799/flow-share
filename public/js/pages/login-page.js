/* File: public/js/pages/login-page.js 
    Reserved for client-side validation or custom login interactions.
*/

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form[action="/auth/login"]');
    
    // Basic client-side form validation before submission (optional)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            const passwordField = document.getElementById('password');
            if (passwordField.value.length < 8) {
                // Prevent submission if simple check fails
                // e.preventDefault(); 
                // console.error("Password must be at least 8 characters.");
                // alert("Password must be at least 8 characters."); 
                // (Use a proper UI message instead of alert/console in production)
            }
        });
    }
});
