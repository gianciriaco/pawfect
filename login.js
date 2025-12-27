// ========================================
// LOGIN.JS - UPDATED REDIRECTS
// ========================================

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('loginUsername').value.trim();
    const passwordInput = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    errorDiv.textContent = '';
    errorDiv.style.color = '#ff4757';

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('auth_api.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            const userData = {
                name: data.name || 'User',
                role: data.role,
                id: data.user_id,
                email: usernameInput
            };
            sessionStorage.setItem('user', JSON.stringify(userData));

            errorDiv.style.color = '#10b981';
            errorDiv.textContent = '✓ Login successful! Redirecting...';

            setTimeout(() => {
                // --- REDIRECT LOGIC ---
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (data.role === 'employee') {
                    window.location.href = 'employee.html'; // New Employee Panel
                } else {
                    window.location.href = 'index.html';
                }
            }, 800);

        } else {
            errorDiv.textContent = '✗ ' + (data.message || 'Login failed');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error('Login Error:', error);
        errorDiv.textContent = '✗ Connection error.';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }

    return false;
}

async function handleSignup(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const errorDiv = document.getElementById('signupError');
    const submitBtn = form.querySelector('button[type="submit"]');

    const fullname = formData.get('fullname').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    errorDiv.textContent = '';
    errorDiv.style.color = '#ff4757';

    if (!fullname || !email || !password || !confirmPassword) {
        errorDiv.textContent = '✗ All fields are required'; return false;
    }
    if (password.length < 6) {
        errorDiv.textContent = '✗ Password must be at least 6 characters'; return false;
    }
    if (password !== confirmPassword) {
        errorDiv.textContent = '✗ Passwords do not match'; return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = '✗ Please enter a valid email address'; return false;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('auth_api.php?action=signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname: fullname, email: email, password: password })
        });
        const data = await response.json();

        if (data.status === 'success') {
            errorDiv.style.color = '#10b981';
            errorDiv.textContent = '✓ Account created! Redirecting to login...';
            setTimeout(() => {
                form.reset();
                if (typeof window.showSignIn === 'function') window.showSignIn();
                else location.reload(); 
            }, 1500);
        } else {
            errorDiv.textContent = '✗ ' + (data.message || 'Registration failed');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        errorDiv.textContent = '✗ Connection error.';
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const signInBtn = document.getElementById("signInBtn");
    const signUpBtn = document.getElementById("signUpBtn");
    const container = document.getElementById("mainCard");
    const signInForm = document.getElementById("signInForm");
    const signUpForm = document.getElementById("signUpForm");
    const switchToSignUp = document.getElementById("switchToSignUp");
    const switchToSignIn = document.getElementById("switchToSignIn");

    function showSignUp() {
        container.classList.add("sign-up-mode");
        signInBtn.classList.remove("active");
        signUpBtn.classList.add("active");
        setTimeout(() => { signInForm.classList.remove("active"); signUpForm.classList.add("active"); }, 300);
    }

    window.showSignIn = function() {
        container.classList.remove("sign-up-mode");
        signUpBtn.classList.remove("active");
        signInBtn.classList.add("active");
        setTimeout(() => { signUpForm.classList.remove("active"); signInForm.classList.add("active"); }, 300);
    }

    if (signInBtn) signInBtn.addEventListener("click", showSignIn);
    if (signUpBtn) signUpBtn.addEventListener("click", showSignUp);
    if (switchToSignUp) switchToSignUp.addEventListener("click", (e) => { e.preventDefault(); showSignUp(); });
    if (switchToSignIn) switchToSignIn.addEventListener("click", (e) => { e.preventDefault(); showSignIn(); });

    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        if (themeToggle) themeToggle.textContent = '🌙';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '🌙' : '☀️';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
});