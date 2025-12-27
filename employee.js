// ===========================================
// EMPLOYEE.JS - RESTRICTED DASHBOARD LOGIC
// ===========================================

let bookings = [];
let customers = [];
let messages = [];
let services = [];

document.addEventListener('DOMContentLoaded', function() {
    fetchBookings();
    fetchCustomers();
    fetchMessages();
    fetchServices();
    initTheme();
});

// 1. FETCH DATA (Same as Admin)
async function fetchBookings() {
    try {
        const response = await fetch('booking_api.php?action=get_all');
        bookings = await response.json();
        renderBookingsTable();
        updateStats();
    } catch (error) { console.error('Error loading bookings:', error); }
}

async function fetchCustomers() {
    try {
        const response = await fetch('admin_api.php?action=get_customers');
        customers = await response.json();
        renderCustomersTable();
    } catch (error) { console.error('Error loading customers:', error); }
}

async function fetchMessages() {
    try {
        const response = await fetch('admin_api.php?action=get_messages');
        messages = await response.json();
        renderMessagesTable();
        updateStats();
    } catch (error) { console.error('Error loading messages:', error); }
}

async function fetchServices() {
    try {
        const response = await fetch('services_api.php');
        services = await response.json();
        renderServicesTable();
    } catch (error) { console.error('Error loading services:', error); }
}

// 2. RENDER TABLES (RESTRICTED VERSIONS)
function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    if (!tbody) return;
    
    tbody.innerHTML = bookings.map(b => {
        // Status Logic
        let statusClass = 'status-pending'; 
        const status = (b.status || 'pending').toLowerCase();
        if (status === 'confirmed') statusClass = 'status-confirmed';
        if (status === 'completed') statusClass = 'status-completed';
        if (status === 'cancelled') statusClass = 'status-cancelled';

        // Payment Logic
        const payStatus = b.payment_status || 'Pending';
        const payColor = payStatus === 'Paid' ? '#10b981' : '#fbb901'; // Green if Paid, Yellow if Pending
        const paymentMethod = b.payment_method ? b.payment_method.replace('_', ' ') : 'N/A';

        return `
        <tr>
            <td>#${b.id}</td>
            <td><strong>${b.owner_name}</strong></td>
            <td>${b.service_type}</td>
            
            <td>${paymentMethod}</td>
            <td style="color:${payColor}; font-weight:700;">${payStatus}</td>
            
            <td>${b.appointment_date}</td>
            <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn view" onclick="openViewModal(${b.id})">View Details</button>
            </td>
        </tr>
    `}).join('');
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTable');
    if (!tbody) return;
    // NO ACTIONS COLUMN
    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>#${c.id}</td>
            <td>${c.full_name}</td>
            <td>${c.email}</td>
            <td>${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
        </tr>
    `).join('');
}

function renderMessagesTable() {
    const tbody = document.getElementById('messagesTable');
    if (!tbody) return;
    
    tbody.innerHTML = messages.map(m => `
        <tr>
            <td>#${m.id}</td>
            <td>
                <strong>${m.name}</strong><br>
                <small style="color:var(--text-faded)">${m.email}</small>
            </td>
            <td>${m.subject}</td>
            <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.message}</div></td>
            <td>
                ${m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                <br>
                <small style="color:var(--text-faded)">
                    ${m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </small>
            </td>
        </tr>
    `).join('');
}

function renderServicesTable() {
    const tbody = document.getElementById('servicesTable');
    if (!tbody) return;
    tbody.innerHTML = services.map(s => `
        <tr>
            <td>#${s.id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${s.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;" onerror="this.src='homepage_picture/logo.png'">
                    <strong>${s.name}</strong>
                </div>
            </td>
            <td style="color:var(--accent-color-light); font-weight:700;">₱${s.price}</td>
            <td><div style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-faded)">${s.description}</div></td>
            <td>
                <button class="action-btn edit" onclick="openEditService(${s.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteService(${s.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// 3. MODAL LOGIC (VIEW ONLY)
function openViewModal(id) {
    const booking = bookings.find(b => b.id == id);
    if (!booking) return;

    document.getElementById('view-owner').textContent = booking.owner_name;
    document.getElementById('view-email').textContent = booking.owner_email;
    document.getElementById('view-pet').textContent = booking.pet_name;
    document.getElementById('view-service-detail').textContent = booking.service_type;
    document.getElementById('view-price').textContent = booking.price || 'N/A';
    document.getElementById('view-datetime').textContent = `${booking.appointment_date} at ${booking.appointment_time}`;
    
    // NEW LINES: Populate new fields
    document.getElementById('view-method').textContent = booking.payment_method ? booking.payment_method.replace('_', ' ') : 'N/A';
    
    // NEW: Reference No
    document.getElementById('view-ref-number').textContent = booking.payment_reference || 'N/A';

    const payStatusEl = document.getElementById('view-pay-status');
    payStatusEl.textContent = booking.payment_status || 'Pending';
    payStatusEl.style.color = (booking.payment_status === 'Paid') ? '#10b981' : '#fbb901';

    document.getElementById('viewModal').classList.add('active');
}

// 4. SERVICE MANAGEMENT LOGIC (FULL ACCESS, FILE UPLOAD)
function previewImage(input) {
    const preview = document.getElementById('service-img-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = "";
        preview.style.display = 'none';
    }
}

function openServiceModal() {
    document.getElementById('serviceModalTitle').textContent = "Add New Service";
    document.getElementById('service-id').value = "";
    document.getElementById('service-current-img').value = ""; 
    document.getElementById('serviceForm').reset();
    
    // Clear preview
    const preview = document.getElementById('service-img-preview');
    preview.src = "";
    preview.style.display = "none";

    document.getElementById('serviceModal').classList.add('active');
}

function openEditService(id) {
    const s = services.find(item => item.id == id);
    if (!s) return;
    document.getElementById('serviceModalTitle').textContent = "Edit Service";
    document.getElementById('service-id').value = s.id;
    document.getElementById('service-name').value = s.name;
    document.getElementById('service-price').value = s.price;
    document.getElementById('service-desc').value = s.description;
    
    document.getElementById('service-current-img').value = s.image;
    
    const preview = document.getElementById('service-img-preview');
    if (s.image) {
        preview.src = s.image;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    document.getElementById('service-img-file').value = "";

    document.getElementById('serviceModal').classList.add('active');
}

async function saveService() {
    const id = document.getElementById('service-id').value;
    const name = document.getElementById('service-name').value;
    const price = document.getElementById('service-price').value;
    const desc = document.getElementById('service-desc').value;
    const currentImg = document.getElementById('service-current-img').value;
    const fileInput = document.getElementById('service-img-file');

    if (!name || !price) {
        alert("Please fill in the Service Name and Price.");
        return;
    }

    const action = id ? 'update' : 'add';
    
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', desc);
    formData.append('current_image', currentImg);
    
    if(fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    const btn = document.querySelector('#serviceModal .btn:last-child');
    const originalText = btn.textContent;
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
        const response = await fetch(`services_api.php?action=${action}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert('Service saved successfully!');
            closeModal('serviceModal');
            fetchServices(); 
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) { console.error(e); alert('Connection error'); }
    finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteService(id) {
    if(!confirm('Are you sure you want to delete this service?')) return;
    try {
        await fetch('services_api.php?action=delete', {
            method: 'POST',
            body: JSON.stringify({id})
        });
        fetchServices();
    } catch(e) { console.error(e); }
}

// 5. UTILITIES
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }

function updateStats() {
    if(document.getElementById('totalBookings')) document.getElementById('totalBookings').textContent = bookings.length;
    if(document.getElementById('totalMessages')) document.getElementById('totalMessages').textContent = messages.length;
}

function showSection(sectionName, event) {
    if(event) event.preventDefault();
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(sectionName + '-section');
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-hidden'); 
    }
}

function logout() { if(confirm('Logout?')) { sessionStorage.clear(); window.location.href = 'login.html'; } }

function initTheme() {
    const savedTheme = localStorage.getItem('admin-theme') || 'dark';
    if (savedTheme === 'light') document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-toggle');
    if(btn) {
        btn.onclick = () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('admin-theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
            btn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '🔆';
        };
    }
}

function toggleMobileMenu() { document.getElementById('sidebar').classList.toggle('mobile-hidden'); }