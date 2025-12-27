document.addEventListener("DOMContentLoaded", () => {
    
    // ===== 1. AUTHENTICATION CHECK & SECURITY =====
    const userSession = sessionStorage.getItem('user');
    let user = userSession ? JSON.parse(userSession) : null;
    
    // Check for hardcoded/legacy Admin login ("isAdmin" flag)
    if (!user && sessionStorage.getItem('isAdmin') === 'true') {
        user = { name: 'Admin', role: 'admin' };
    }
    
    // Get current page filename
    const path = window.location.pathname;
    const page = path.split("/").pop();

    // LIST OF PAGES THAT REQUIRE LOGIN
    // Added services.html here as requested in previous contexts, or you can remove it if services should be public
    const protectedPages = ['about.html', 'booking.html', 'history.html'];

    // Security Redirect
    if (!user && protectedPages.includes(page)) {
        alert("Please create an account or login to view this page.");
        window.location.href = 'login.html';
        return; 
    }

    // ===== 2. INJECT NOTIFICATION STYLES =====
    // We keep the styles just in case you want to use showNotification() manually elsewhere
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary, #0c1a1f);
            color: var(--text-primary, #fff);
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            border-left: 5px solid var(--accent-color-light, #fbb901);
            z-index: 10000;
            font-family: 'Segoe UI', sans-serif;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateX(50px);
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            pointer-events: none; /* Allows clicking through while hidden */
        }
        .custom-toast.show {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);

    // ===== 3. INJECT HEADER =====
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
        
        // --- BUTTON GROUP 1: VISIBLE TO EVERYONE ---
        let navButtonsHtml = `
            <button onclick="window.location.href='index.html'">Home</button>
            <button onclick="window.location.href='services.html'">Services</button>
        `;

        // --- BUTTON GROUP 2: VISIBLE ONLY WHEN LOGGED IN ---
        if (user) {
            // [REMOVED] The logic that triggered showNotification() is gone.

            // Check if user is ADMIN to show Admin Panel button
            if (user.role === 'admin') {
                navButtonsHtml += `
                    <button onclick="window.location.href='admin.html'" style="color: #fbb901; font-weight:800; border: 1px solid #fbb901;">Admin Panel</button>
                `;
            } 
            // Check if user is EMPLOYEE to show Employee Panel button
            else if (user.role === 'employee') {
                navButtonsHtml += `
                    <button onclick="window.location.href='employee.html'" style="color: #fbb901; font-weight:800; border: 1px solid #fbb901;">Employee Panel</button>
                `;
            }

            navButtonsHtml += `
                <button onclick="window.location.href='about.html'">About</button>
                <button onclick="window.location.href='booking.html'">Booking</button>
                <button onclick="window.location.href='history.html'">My History</button>
                <button onclick="window.location.href='contact.html'">Contact</button>
            `;
        }

        // --- BUTTON GROUP 3: LOGIN / LOGOUT TOGGLE ---
        if (user) {
            navButtonsHtml += `
                <button class="login-btn" onclick="logoutUser()">Logout</button>
            `;
        } else {
            navButtonsHtml += `
                <button class="login-btn" onclick="window.location.href='login.html'">Login</button>
            `;
        }

        // Add Theme Toggle
        navButtonsHtml += `<button id="theme-toggle" aria-label="Toggle Light/Dark Mode">🔆</button>`;

        headerPlaceholder.innerHTML = `
        <div class="header">
            <div class="logo-title">
                <img class="logo" src="homepage_picture/logo.png" alt="Pawfect Grooming PH Logo">
                <p class="title">Pawfect Grooming PH</p>
            </div>
            <div class="nav-buttons">
                ${navButtonsHtml}
            </div>
        </div>`;
    }

    // ===== 4. INJECT FOOTER =====
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        
        const aboutLink = user ? '<li><a href="about.html">About Us</a></li>' : '';
        const contactLink = user ? '<li><a href="contact.html">Contact Us</a></li>' : '';

        footerPlaceholder.innerHTML = `
        <footer class="footer">
            <div class="footer-grid">
                <div>
                    <h3>About Pawfect Grooming PH</h3>
                    <p>Professional pet care services you can trust. Your furry family members deserve the best care — and we're here to deliver it with love, expertise, and joy.</p>
                </div>
                <div>
                    <h3>Our Services</h3>
                    <ul>
                        <li><a href="services.html">Full Bath & Blow Dry</a></li>
                        <li><a href="services.html">Haircut / Full Groom</a></li>
                        <li><a href="services.html">Nail Trimming & Filing</a></li>
                        <li><a href="services.html">Ear Cleaning</a></li>
                        <li><a href="services.html">Teeth Brushing</a></li>
                        <li><a href="services.html">Veterinary Care</a></li>
                        <li><a href="services.html">De-Shedding Treatment</a></li>
                        <li><a href="services.html">Tick & Flea Treatment</a></li>
                    </ul>
                </div>
                <div>
                    <h3>Company</h3>
                    <ul>
                        ${aboutLink}
                        <li><a href="about.html#our-team">Our Team</a></li> 
                    </ul>
                </div>
                <div>
                    <h3>Support</h3>
                    <ul>
                        ${contactLink}
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Pawfect Grooming PH. All rights reserved. Made with ❤️ for pets everywhere.</p>
            </div>
        </footer>`;
    }

    // ===== 5. THEME TOGGLE LOGIC =====
    initTheme();
});

// Helper: Logout Function
function logoutUser() {
    if(confirm("Are you sure you want to logout?")) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('isAdmin'); 
        window.location.href = 'index.html';
    }
}

// Helper: Theme Logic
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        if(themeToggle) themeToggle.textContent = '🌙';
    } else {
        body.classList.remove('light-mode');
        if(themeToggle) themeToggle.textContent = '🔆';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '🌙' : '🔆';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
}

// Helper: Show Toast Notification (Kept for manual use, no longer called automatically)
function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if(document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 600);
    }, 4000);
}