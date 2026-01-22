// ============================================
// DATA MODELS
// ============================================

const bookingData = {
    physical: [
        { title: "BMW Munich", desc: "Origin" },
        { title: "In Transit", desc: "A8 Highway" },
        { title: "Hamburg", desc: "Destination" }
    ],
    liability: [
        { title: "Carrier X", desc: "Has Custody" },
        { title: "Customer", desc: "Received Goods" },
        // The Branch Node
        { title: "PSP Return", desc: "Dachser Depot", type: "psp-branch" }
    ]
};

const inboxTasks = [
    {
        id: 1,
        title: "Critical: 12 EUR Pallets Missing",
        location: "Hamburg Depot",
        priority: "critical",
        type: "exception"
    },
    {
        id: 2,
        title: "Shipment #3421 Delayed by 2hrs",
        location: "A8 Highway",
        priority: "warning",
        type: "delay"
    },
    {
        id: 3,
        title: "Customer Email: Delivery Confirmation",
        location: "BMW Munich",
        priority: "normal",
        type: "email"
    },
    {
        id: 4,
        title: "PSP Pickup Request Pending",
        location: "Dachser Depot",
        priority: "normal",
        type: "task"
    },
    {
        id: 5,
        title: "Balance Reconciliation Required",
        location: "Regional Transport",
        priority: "warning",
        type: "financial"
    }
];

// Map locations with coordinates
const mapLocations = [
    {
        name: "BMW Munich",
        coords: [48.1351, 11.5820],
        status: "normal",
        type: "origin",
        info: "Origin: 33 EUR Pallets loaded"
    },
    {
        name: "Hamburg Depot",
        coords: [53.5511, 9.9937],
        status: "critical",
        type: "exception",
        info: "Critical: 12 EUR Pallets Missing"
    },
    {
        name: "A8 Highway (In Transit)",
        coords: [50.5, 10.5],
        status: "warning",
        type: "active",
        info: "Shipment #3421 - Delayed by 2hrs"
    },
    {
        name: "Dachser Depot",
        coords: [48.7758, 9.1829],
        status: "normal",
        type: "psp",
        info: "PSP Return: Awaiting pickup"
    }
];

let map = null;

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

    taskList.innerHTML = inboxTasks.map(task => {
        const priorityClass = task.priority === 'critical' ? 'critical' :
                             task.priority === 'warning' ? 'warning' : '';

        return `<div class="task-item ${priorityClass}" onclick="handleTaskClick(${task.id})">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${task.title}</div>
            <div style="font-size: 0.75rem; color: #64748b;">📍 ${task.location}</div>
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

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Logistikbude 3.0 - Initializing...');

    // Render booking swimlanes
    renderBooking();

    // Render inbox tasks
    renderInboxTasks();

    // Initialize map
    initMap();

    console.log('✓ Application ready');
});

// Also call renders immediately in case DOMContentLoaded already fired
renderBooking();
renderInboxTasks();
