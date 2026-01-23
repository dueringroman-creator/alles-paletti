// ============================================
// DATA MODELS (Now loaded from API)
// ============================================

let bookingData = {
    physical: [
        { title: "Loading...", desc: "Fetching data" }
    ],
    liability: [
        { title: "Loading...", desc: "Fetching data" }
    ]
};

let inboxTasks = [];
let mapLocations = [];
let currentBookings = [];

let map = null;

// ============================================
// API DATA LOADING
// ============================================

async function loadBookings() {
    try {
        const bookings = await window.logistikbudeAPI.getBookings();
        currentBookings = bookings;

        if (bookings && bookings.length > 0) {
            const firstBooking = bookings[0];

            // Update booking data for swimlanes
            bookingData = {
                physical: [
                    { title: firstBooking.origin.name, desc: "Origin" },
                    { title: "In Transit", desc: `${firstBooking.progress}% Complete` },
                    { title: firstBooking.destination.name, desc: "Destination" }
                ],
                liability: [
                    { title: firstBooking.carrier.name, desc: "Has Custody" },
                    { title: firstBooking.consignee.name, desc: "Will Receive" }
                ]
            };

            // Update map locations from bookings
            mapLocations = bookings.map(booking => ({
                name: booking.origin.name,
                coords: [booking.origin.coordinates[0] / 10, booking.origin.coordinates[1]], // Fix coordinate scale
                status: booking.status === 'in_transit' ? 'warning' : booking.status === 'delivered' ? 'normal' : 'critical',
                type: 'origin',
                info: `${booking.bookingNumber} - ${booking.status}`
            }));
        }

        renderBooking();
        if (map) {
            updateMapMarkers();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadTasks() {
    try {
        const tasks = await window.logistikbudeAPI.getTasks();

        // Transform API tasks to match UI format
        inboxTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            location: task.companyName || 'Unknown',
            priority: task.priority,
            type: task.category,
            status: task.status
        }));

        renderInboxTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function completeTask(taskId) {
    try {
        const result = await window.logistikbudeAPI.completeTask(taskId, 'Demo User', 'Completed via UI');

        if (result.success) {
            // Show success feedback
            showToast('✓ Task completed successfully!', 'success');

            // Reload tasks to reflect changes
            await loadTasks();
        } else {
            showToast('✗ Failed to complete task', 'error');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('✗ Error completing task', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 6px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderBooking() {
    const pLane = document.getElementById('lane-physical');
    const lLane = document.getElementById('lane-liability');

    if (!pLane || !lLane) return;

    pLane.innerHTML = bookingData.physical.map(n =>
        `<div class="node">
            <h5>${n.title}</h5>
            <p>${n.desc}</p>
        </div>`
    ).join('');

    lLane.innerHTML = bookingData.liability.map(n => {
        const cls = n.type === 'psp-branch' ? 'node psp' : 'node';
        return `<div class="${cls}">
            <h5>${n.title}</h5>
            <p>${n.desc}</p>
        </div>`;
    }).join('');
}

function renderInboxTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    if (inboxTasks.length === 0) {
        taskList.innerHTML = '<div style="padding: 1rem; text-align: center; color: #64748b;">Loading tasks...</div>';
        return;
    }

    taskList.innerHTML = inboxTasks.map(task => {
        const priorityClass = task.priority === 'urgent' ? 'critical' :
                             task.priority === 'high' || task.priority === 'warning' ? 'warning' : '';

        const isCompleted = task.status === 'completed';
        const opacity = isCompleted ? 'opacity: 0.5;' : '';

        return `<div class="task-item ${priorityClass}" style="${opacity}">
            <div onclick="handleTaskClick(${task.id})" style="flex: 1; cursor: pointer;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${task.title}</div>
                <div style="font-size: 0.75rem; color: #64748b;">📍 ${task.location}</div>
            </div>
            ${!isCompleted ? `
                <button onclick="event.stopPropagation(); completeTask(${task.id})"
                        style="padding: 4px 12px; background: #22c55e; color: white; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-left: 8px;">
                    ✓ Complete
                </button>
            ` : '<span style="font-size: 0.75rem; color: #22c55e; margin-left: 8px;">✓ Done</span>'}
        </div>`;
    }).join('');
}

// ============================================
// NAVIGATION & VIEW SWITCHING
// ============================================

function switchTab(id) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Show selected view
    const targetView = document.getElementById(`view-${id}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
}

// ============================================
// MODAL INTERACTIONS
// ============================================

function openCompensationModal() {
    const modal = document.getElementById('compensation-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('compensation-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset modal state
    const pspOptions = document.getElementById('psp-options');
    if (pspOptions) {
        pspOptions.classList.add('hidden');
    }

    // Remove selection from all option cards
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function selectOption(opt) {
    const pspOptions = document.getElementById('psp-options');

    // Remove previous selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Mark selected card
    event.target.classList.add('selected');

    // Show PSP-specific options
    if (opt === 'psp' && pspOptions) {
        pspOptions.classList.remove('hidden');
    } else if (pspOptions) {
        pspOptions.classList.add('hidden');
    }

    // Handle invoice option
    if (opt === 'invoice') {
        console.log('Invoice generation selected');
        // Future: Trigger PDF generation
    }
}

// ============================================
// TASK INTERACTIONS
// ============================================

function handleTaskClick(taskId) {
    const task = inboxTasks.find(t => t.id === taskId);
    if (!task) return;

    console.log('Task clicked:', task);

    // Auto-navigate based on task type
    if (task.type === 'exception' || task.type === 'delay') {
        // Switch to Cockpit view
        document.querySelector('.nav-item[onclick*="cockpit"]').click();
    } else if (task.type === 'financial') {
        // Switch to Balances view
        document.querySelector('.nav-item[onclick*="balances"]').click();
    }

    // Visual feedback
    event.currentTarget.style.opacity = '0.6';
    setTimeout(() => {
        event.currentTarget.style.opacity = '1';
    }, 200);
}

// ============================================
// MAP INITIALIZATION (Leaflet.js)
// ============================================

function initMap() {
    const mapContainer = document.getElementById('map-placeholder');
    if (!mapContainer || typeof L === 'undefined') {
        console.warn('Leaflet.js not loaded or map container not found');
        return;
    }

    // Remove the overlay placeholder
    const overlay = mapContainer.querySelector('.map-overlay');
    if (overlay) overlay.remove();

    // Initialize map centered on Central Europe
    map = L.map('map-placeholder', {
        center: [50.5, 10.5],
        zoom: 6,
        zoomControl: true
    });

    // Add dark mode tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Add location markers
    mapLocations.forEach(loc => {
        // Determine marker color based on status
        let markerColor = '#3b82f6'; // Default blue
        if (loc.status === 'critical') markerColor = '#ef4444'; // Red
        if (loc.status === 'warning') markerColor = '#eab308'; // Yellow
        if (loc.status === 'normal') markerColor = '#22c55e'; // Green

        // Create custom icon with pulsing effect for critical/warning
        const iconHtml = loc.status === 'critical' || loc.status === 'warning' ?
            `<div style="
                width: 20px;
                height: 20px;
                background: ${markerColor};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 20px ${markerColor};
                animation: pulse 2s infinite;
            "></div>` :
            `<div style="
                width: 16px;
                height: 16px;
                background: ${markerColor};
                border-radius: 50%;
                border: 2px solid white;
            "></div>`;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Add marker
        const marker = L.marker(loc.coords, { icon: customIcon }).addTo(map);

        // Add popup
        marker.bindPopup(`
            <div style="font-family: sans-serif;">
                <h4 style="margin: 0 0 0.5rem 0; color: ${markerColor};">${loc.name}</h4>
                <p style="margin: 0; font-size: 0.875rem;">${loc.info}</p>
            </div>
        `);

        // Auto-open popup for critical items
        if (loc.status === 'critical') {
            marker.openPopup();
        }
    });

    mapContainer.classList.add('has-map');
    console.log('✓ Map initialized with', mapLocations.length, 'locations');
}

function updateMapMarkers() {
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Add location markers from API data
    mapLocations.forEach(loc => {
        let markerColor = '#3b82f6';
        if (loc.status === 'critical') markerColor = '#ef4444';
        if (loc.status === 'warning') markerColor = '#eab308';
        if (loc.status === 'normal') markerColor = '#22c55e';

        const iconHtml = loc.status === 'critical' || loc.status === 'warning' ?
            `<div style="
                width: 20px;
                height: 20px;
                background: ${markerColor};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 20px ${markerColor};
                animation: pulse 2s infinite;
            "></div>` :
            `<div style="
                width: 16px;
                height: 16px;
                background: ${markerColor};
                border-radius: 50%;
                border: 2px solid white;
            "></div>`;

        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker(loc.coords, { icon: customIcon }).addTo(map);

        marker.bindPopup(`
            <div style="font-family: sans-serif;">
                <h4 style="margin: 0 0 0.5rem 0; color: ${markerColor};">${loc.name}</h4>
                <p style="margin: 0; font-size: 0.875rem;">${loc.info}</p>
            </div>
        `);

        if (loc.status === 'critical') {
            marker.openPopup();
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Logistikbude 3.0 - Initializing...');

    // Show initial loading state
    renderBooking();
    renderInboxTasks();

    // Initialize map first
    initMap();

    // Load data from API
    console.log('Loading data from API...');
    await Promise.all([
        loadBookings(),
        loadTasks()
    ]);

    console.log('✓ Application ready with live data');
});
