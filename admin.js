// ===========================================
// ADMIN.JS - FULL ADMIN LOGIC
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

// 1. FETCH DATA
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
        updateStats();
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

// 2. RENDER TABLES
function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    if (!tbody) return;
    
    tbody.innerHTML = bookings.map(b => {
        const payStatus = b.payment_status || 'Pending';
        const payColor = payStatus === 'Paid' ? '#10b981' : '#fbb901'; 
        const priceDisplay = b.price ? b.price : 'N/A';
        const paymentMethod = b.payment_method ? b.payment_method.replace('_', ' ') : 'N/A';
        
        let statusClass = 'status-pending'; 
        const status = (b.status || 'pending').toLowerCase();
        if (status === 'confirmed') statusClass = 'status-confirmed';
        if (status === 'completed') statusClass = 'status-completed';
        if (status === 'cancelled') statusClass = 'status-cancelled';

        // Add a small icon if proof exists
        const proofIcon = b.payment_proof ? '<span style="font-size:12px; margin-left:5px; cursor:help;" title="Proof Uploaded">🧾</span>' : '';

        return `
        <tr>
            <td>#${b.id}</td>
            <td><strong>${b.owner_name}</strong><br><small>${b.owner_phone || ''}</small></td>
            <td><div style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.service_type}</div><small style="color:var(--text-faded)">(${b.pet_name})</small></td>
            <td style="color:var(--accent-color-light); font-weight:700;">${priceDisplay}</td>
            <td>${paymentMethod}</td>
            <td style="color:${payColor}; font-weight:700;">${payStatus} ${proofIcon}</td>
            <td>${b.appointment_date}<br><small>${b.appointment_time || ''}</small></td>
            <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
            <td>
                <button class="action-btn view" onclick="openViewModal(${b.id})">View</button>
                <button class="action-btn edit" onclick="openEditModal(${b.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteItem('booking', ${b.id})">Delete</button>
            </td>
        </tr>
    `}).join('');
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTable');
    if (!tbody) return;
    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>#${c.id}</td>
            <td>${c.full_name}</td>
            <td>${c.email}</td>
            <td>${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
            <td><button class="action-btn delete" onclick="deleteItem('customer', ${c.id})">Delete</button></td>
        </tr>
    `).join('');
}

function renderMessagesTable() {
    const tbody = document.getElementById('messagesTable');
    if (!tbody) return;
    tbody.innerHTML = messages.map(m => `
        <tr>
            <td>#${m.id}</td>
            <td>${m.name}<br><small>${m.email}</small></td>
            <td>${m.subject}</td>
            <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.message}</div></td>
            <td>
                ${m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                <br>
                <small style="color:var(--text-faded)">
                    ${m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </small>
            </td>
            <td><button class="action-btn delete" onclick="deleteItem('message', ${m.id})">Delete</button></td>
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

// 3. MODAL LOGIC
function openViewModal(id) {
    const booking = bookings.find(b => b.id == id);
    if (!booking) return;

    document.getElementById('view-owner').textContent = booking.owner_name;
    document.getElementById('view-email').textContent = booking.owner_email;
    document.getElementById('view-phone').textContent = booking.owner_phone;
    document.getElementById('view-pet').textContent = booking.pet_name;
    const petTypeEl = document.getElementById('view-pet-type');
    if (petTypeEl) petTypeEl.textContent = booking.pet_type || '';
    document.getElementById('view-service-detail').textContent = booking.service_type;
    document.getElementById('view-price').textContent = booking.price || 'N/A';
    document.getElementById('view-method').textContent = booking.payment_method ? booking.payment_method.replace('_', ' ') : 'N/A';
    
    // NEW: Populate Reference Number
    document.getElementById('view-ref-number').textContent = booking.payment_reference || 'N/A';

    document.getElementById('view-datetime').textContent = `${booking.appointment_date} at ${booking.appointment_time}`;
    const payStatusEl = document.getElementById('view-pay-status');
    payStatusEl.textContent = booking.payment_status || 'Pending';
    payStatusEl.style.color = (booking.payment_status === 'Paid') ? '#10b981' : '#fbb901';
    const statusEl = document.getElementById('view-status');
    const status = (booking.status || 'pending').toLowerCase();
    statusEl.textContent = status.toUpperCase();
    
    // === PROOF OF PAYMENT LOGIC ===
    const proofContainer = document.getElementById('proof-container');
    const proofImg = document.getElementById('view-proof-img');
    const proofLink = document.getElementById('view-proof-link');

    if (booking.payment_proof && booking.payment_proof.trim() !== '') {
        proofContainer.style.display = 'block';
        proofImg.src = booking.payment_proof;
        proofLink.href = booking.payment_proof;
    } else {
        proofContainer.style.display = 'none';
    }

    document.getElementById('viewModal').classList.add('active');
}

function openEditModal(id) {
    const booking = bookings.find(b => b.id == id);
    if (!booking) return;
    document.getElementById('edit-id').value = booking.id;
    document.getElementById('edit-name').value = booking.owner_name;
    const container = document.getElementById('adminServiceCheckboxes');
    container.innerHTML = services.map(s => `<label><input type="checkbox" class="service-check" value="${s.name}"> ${s.name}</label>`).join('');
    const currentServicesStr = booking.service_type || "";
    document.querySelectorAll('.service-check').forEach(cb => { if (currentServicesStr.includes(cb.value)) cb.checked = true; });
    document.getElementById('edit-payment-status').value = booking.payment_status || 'Pending';
    document.getElementById('edit-status').value = (booking.status || 'pending').toLowerCase();
    document.getElementById('edit-date').value = booking.appointment_date;
    document.getElementById('edit-time').value = booking.appointment_time;
    document.getElementById('editModal').classList.add('active');
}

// --- NEW HELPER FOR IMAGE PREVIEW ---
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
    
    // Set current image for fallback
    document.getElementById('service-current-img').value = s.image;
    
    // Show preview of current image
    const preview = document.getElementById('service-img-preview');
    if (s.image) {
        preview.src = s.image;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    // Reset file input
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
    
    // USE FORMDATA FOR FILES
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
        } else { alert('Error: ' + result.message); }
    } catch (e) { console.error(e); alert('Connection error'); }
    finally { btn.textContent = originalText; btn.disabled = false; }
}

async function deleteService(id) {
    if(!confirm('Are you sure you want to delete this service?')) return;
    try {
        await fetch('services_api.php?action=delete', { method: 'POST', body: JSON.stringify({id}) });
        fetchServices();
    } catch(e) { console.error(e); }
}

async function saveBookingChanges() {
    const id = document.getElementById('edit-id').value;
    const checkedBoxes = document.querySelectorAll('.service-check:checked');
    let selectedServices = [];
    checkedBoxes.forEach(cb => { selectedServices.push(cb.value); });
    const serviceString = selectedServices.join(", ");
    const status = document.getElementById('edit-status').value;
    const paymentStatus = document.getElementById('edit-payment-status').value;
    const date = document.getElementById('edit-date').value;
    const time = document.getElementById('edit-time').value;
    const btn = document.querySelector('#editModal .btn:last-child');
    const originalText = btn.textContent;
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
        const response = await fetch('booking_api.php?action=update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, service_type: serviceString, status, payment_status: paymentStatus, appointment_date: date, appointment_time: time })
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert('Booking updated successfully!'); closeModal('editModal'); fetchBookings(); 
        } else { alert('Failed: ' + result.message); }
    } catch (error) { console.error(error); alert('Error saving changes'); } 
    finally { btn.textContent = originalText; btn.disabled = false; }
}

async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    let apiUrl = type === 'booking' ? 'booking_api.php?action=delete' : 'admin_api.php?action=delete_' + type;
    try {
        const response = await fetch(apiUrl, { method: 'POST', body: JSON.stringify({ id: id }) });
        const result = await response.json();
        if (result.status === 'success') {
            alert("Deleted successfully");
            if(type === 'booking') fetchBookings();
            if(type === 'customer') fetchCustomers();
            if(type === 'message') fetchMessages();
        } else { alert('Failed to delete'); }
    } catch (error) { console.error('Delete failed:', error); }
}

function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }
function updateStats() {
    if(document.getElementById('totalBookings')) document.getElementById('totalBookings').textContent = bookings.length;
    if(document.getElementById('totalCustomers')) document.getElementById('totalCustomers').textContent = customers.length;
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

function logout() { 
    if(confirm('Logout?')) { 
        sessionStorage.clear(); 
        window.location.href = 'login.html'; 
    } 
}

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

function toggleMobileMenu() { 
    document.getElementById('sidebar').classList.toggle('mobile-hidden'); 
}