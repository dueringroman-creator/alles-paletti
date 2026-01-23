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
let currentEvents = [];

let map = null;

// ============================================
// API DATA LOADING
// ============================================

async function loadBookings() {
    try {
        const bookings = await window.logistikbudeAPI.getBookings();
        currentBookings = bookings;

        if (bookings && bookings.length > 0) {
            // Update map locations from bookings
            mapLocations = bookings.map(booking => ({
                name: booking.origin.name,
                coords: [booking.origin.coordinates[0] / 10, booking.origin.coordinates[1]], // Fix coordinate scale
                status: booking.status === 'in_transit' ? 'warning' : booking.status === 'delivered' ? 'normal' : 'critical',
                type: 'origin',
                info: `${booking.bookingNumber} - ${booking.status}`
            }));
        }

        // Render booking matrix
        populateCarrierFilter();
        renderBookingMatrix();

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

async function loadEvents() {
    try {
        const events = await window.logistikbudeAPI.getEvents(null, 10);
        currentEvents = events;
        renderEventLog();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function completeTask(taskId) {
    try {
        const result = await window.logistikbudeAPI.completeTask(taskId, 'Demo User', 'Completed via UI');

        if (result.success) {
            // Show success feedback
            showToast('✓ Task completed successfully!', 'success');

            // Reload tasks and events to reflect changes
            await loadTasks();
            await loadEvents();
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

async function loadCockpitData() {
    await Promise.all([
        loadBookings(),
        loadTasks(),
        loadEvents()
    ]);

    renderCockpitMetrics();
    renderActiveTransports();
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderCockpitMetrics() {
    const inTransit = currentBookings.filter(b => b.status === 'in_transit').length;
    const delivered = currentBookings.filter(b => b.status === 'delivered').length;
    const openTasks = inboxTasks.filter(t => t.status !== 'completed').length;

    document.getElementById('metric-exchanges').textContent = currentBookings.length;
    document.getElementById('metric-transit').textContent = inTransit;
    document.getElementById('metric-completed').textContent = delivered;
    document.getElementById('metric-issues').textContent = openTasks;
}

function renderActiveTransports() {
    const container = document.getElementById('active-transports-list');
    const countBadge = document.getElementById('active-count');

    if (!container) return;

    if (currentBookings.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748b;">No active transports</div>';
        countBadge.textContent = '0';
        return;
    }

    countBadge.textContent = currentBookings.length;

    container.innerHTML = currentBookings.map(booking => {
        const statusClass = booking.status === 'in_transit' ? 'in-transit' :
                           booking.status === 'delivered' ? 'delivered' : 'pending';
        const statusIcon = booking.status === 'in_transit' ? '⏳' :
                          booking.status === 'delivered' ? '✅' : '⏹️';
        const statusText = booking.status.replace('_', ' ').toUpperCase();

        return `
            <div class="transport-card">
                <div class="transport-header">
                    <div>
                        <h4 class="transport-title">${booking.origin.name} → ${booking.destination.name}</h4>
                        <div class="transport-subtitle">
                            ${booking.bookingNumber} • ${booking.carrier.name}
                        </div>
                    </div>
                    <div class="transport-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="transport-details">
                    <div class="transport-detail">
                        <div class="transport-detail-label">Shipper</div>
                        <div class="transport-detail-value">${booking.shipper.name}</div>
                    </div>
                    <div class="transport-detail">
                        <div class="transport-detail-label">Consignee</div>
                        <div class="transport-detail-value">${booking.consignee.name}</div>
                    </div>
                    <div class="transport-detail">
                        <div class="transport-detail-label">Progress</div>
                        <div class="transport-detail-value">${booking.progress}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderEventLog() {
    const container = document.getElementById('event-log');
    if (!container) return;

    if (currentEvents.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: #64748b;">No recent events</div>';
        return;
    }

    container.innerHTML = currentEvents.map(event => {
        const eventType = event.eventType || 'info';
        const eventClass = eventType.includes('completed') ? 'success' :
                          eventType.includes('created') ? 'warning' : '';

        // Format timestamp
        const date = new Date(event.timestamp);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="event-item ${eventClass}">
                <div class="event-time">${dateStr} at ${timeStr}</div>
                <div class="event-description">${event.details}</div>
                <div class="event-meta">
                    ${event.bookingNumber ? `Booking ${event.bookingNumber}` : ''}
                    ${event.userName ? `• by ${event.userName}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// BOOKING MATRIX INTERFACE
// ============================================

let selectedBookingId = null;
let filteredBookings = [];

function renderBookingMatrix() {
    const container = document.getElementById('booking-list');
    if (!container) return;

    // Apply filters to get filtered bookings
    applyFilters();

    if (filteredBookings.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #64748b;">
                <i class="ri-inbox-line" style="font-size: 3rem; opacity: 0.5;"></i>
                <p style="margin-top: 1rem;">No bookings found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredBookings.map(booking => {
        const isSelected = booking.id === selectedBookingId;
        const statusClass = booking.status || 'pending';

        // Get equipment type display
        const equipmentType = booking.equipmentType || 'EUR';
        const quantity = booking.quantity || 33;

        return `
            <div class="booking-card ${isSelected ? 'selected' : ''}" onclick="selectBooking(${booking.id})">
                <div class="booking-card-header">
                    <div class="booking-number">${booking.bookingNumber}</div>
                    <div class="booking-status-badge ${statusClass}">
                        ${statusClass === 'in_transit' ? 'In Transit' :
                          statusClass === 'delivered' ? 'Delivered' :
                          statusClass === 'issue' ? 'Issue' : 'Pending'}
                    </div>
                </div>
                <div class="booking-route">
                    <strong>${booking.origin.name}</strong>
                    <i class="ri-arrow-right-line"></i>
                    <strong>${booking.destination.name}</strong>
                </div>
                <div class="booking-meta">
                    <div class="booking-meta-item">
                        <i class="ri-stack-line"></i>
                        ${quantity}x ${equipmentType}
                    </div>
                    <div class="booking-meta-item">
                        <i class="ri-truck-line"></i>
                        ${booking.carrier.name}
                    </div>
                    ${booking.progress ? `
                        <div class="booking-meta-item">
                            <i class="ri-road-map-line"></i>
                            ${booking.progress}% complete
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function applyFilters() {
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    const equipmentFilter = document.getElementById('filter-equipment')?.value || 'all';
    const carrierFilter = document.getElementById('filter-carrier')?.value || 'all';
    const searchFilter = document.getElementById('filter-search')?.value.toLowerCase() || '';

    filteredBookings = currentBookings.filter(booking => {
        // Status filter
        if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

        // Equipment filter
        if (equipmentFilter !== 'all' && booking.equipmentType !== equipmentFilter) return false;

        // Carrier filter
        if (carrierFilter !== 'all' && booking.carrier.name !== carrierFilter) return false;

        // Search filter
        if (searchFilter) {
            const searchText = `${booking.bookingNumber} ${booking.origin.name} ${booking.destination.name}`.toLowerCase();
            if (!searchText.includes(searchFilter)) return false;
        }

        return true;
    });
}

function filterBookings() {
    renderBookingMatrix();
}

function selectBooking(bookingId) {
    selectedBookingId = bookingId;
    renderBookingMatrix();
    renderBookingDetails(bookingId);
}

function renderBookingDetails(bookingId) {
    const container = document.getElementById('booking-details');
    if (!container) return;

    const booking = currentBookings.find(b => b.id === bookingId);
    if (!booking) {
        container.innerHTML = `
            <div class="details-placeholder">
                <i class="ri-file-list-line" style="font-size: 3rem; color: #64748b; opacity: 0.5;"></i>
                <p style="color: #94a3b8; margin-top: 1rem;">Select a booking to view details</p>
            </div>
        `;
        return;
    }

    const equipmentType = booking.equipmentType || 'EUR';
    const quantity = booking.quantity || 33;
    const quality = booking.quality || 'A';

    container.innerHTML = `
        <div class="details-header">
            <h3><i class="ri-file-text-line"></i> ${booking.bookingNumber}</h3>
            <div class="booking-status-badge ${booking.status}">
                ${booking.status === 'in_transit' ? 'In Transit' :
                  booking.status === 'delivered' ? 'Delivered' :
                  booking.status === 'issue' ? 'Issue' : 'Pending'}
            </div>
        </div>

        <div class="details-section">
            <h4>Equipment Details</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Type</div>
                    <div class="detail-value">${equipmentType} Pallets</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Quantity</div>
                    <div class="detail-value">${quantity} units</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Quality</div>
                    <div class="detail-value">Grade ${quality}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Exchange Type</div>
                    <div class="detail-value">1:1 Swap</div>
                </div>
            </div>
        </div>

        <div class="details-section">
            <h4>Route Information</h4>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Origin (Shipper)</div>
                    <div class="detail-value">${booking.origin.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Destination (Consignee)</div>
                    <div class="detail-value">${booking.destination.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Carrier</div>
                    <div class="detail-value">${booking.carrier.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Progress</div>
                    <div class="detail-value">${booking.progress || 0}% Complete</div>
                </div>
            </div>
        </div>

        <div class="details-section">
            <h4>Transport Timeline</h4>
            <div class="transport-timeline">
                <div class="timeline-item ${booking.progress >= 0 ? 'completed' : 'pending'}">
                    <div class="timeline-content">
                        <div class="timeline-title">Booking Created</div>
                        <div class="timeline-meta">${booking.origin.name}</div>
                    </div>
                </div>
                <div class="timeline-item ${booking.progress >= 30 ? 'completed' : booking.progress > 0 ? 'active' : 'pending'}">
                    <div class="timeline-content">
                        <div class="timeline-title">Picked Up by Carrier</div>
                        <div class="timeline-meta">${booking.carrier.name} • ${quantity}x ${equipmentType}</div>
                    </div>
                </div>
                <div class="timeline-item ${booking.progress >= 70 ? 'completed' : booking.progress > 30 ? 'active' : 'pending'}">
                    <div class="timeline-content">
                        <div class="timeline-title">In Transit</div>
                        <div class="timeline-meta">${booking.progress || 0}% complete</div>
                    </div>
                </div>
                <div class="timeline-item ${booking.status === 'delivered' ? 'completed' : 'pending'}">
                    <div class="timeline-content">
                        <div class="timeline-title">Delivered</div>
                        <div class="timeline-meta">${booking.destination.name}</div>
                    </div>
                </div>
            </div>
        </div>

        ${booking.notes ? `
            <div class="details-section">
                <h4>Notes</h4>
                <div class="detail-value">${booking.notes}</div>
            </div>
        ` : ''}
    `;
}

function populateCarrierFilter() {
    const carrierFilter = document.getElementById('filter-carrier');
    if (!carrierFilter || !currentBookings) return;

    // Get unique carriers
    const carriers = [...new Set(currentBookings.map(b => b.carrier.name))];

    const options = carriers.map(carrier =>
        `<option value="${carrier}">${carrier}</option>`
    ).join('');

    // Keep "All Carriers" option and add unique carriers
    carrierFilter.innerHTML = `
        <option value="all">All Carriers</option>
        ${options}
    `;
}

// ============================================
// NEW BOOKING MODAL
// ============================================

function openNewBookingModal() {
    const modal = document.getElementById('new-booking-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeNewBookingModal() {
    const modal = document.getElementById('new-booking-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function createBooking() {
    // Get form values
    const equipmentType = document.getElementById('new-equipment-type')?.value;
    const quantity = document.getElementById('new-quantity')?.value;
    const quality = document.getElementById('new-quality')?.value;
    const origin = document.getElementById('new-origin')?.value;
    const destination = document.getElementById('new-destination')?.value;
    const carrier = document.getElementById('new-carrier')?.value;
    const pickupDate = document.getElementById('new-pickup-date')?.value;
    const deliveryDate = document.getElementById('new-delivery-date')?.value;
    const exchangeType = document.getElementById('new-exchange-type')?.value;
    const notes = document.getElementById('new-notes')?.value;

    // Validate required fields
    if (!equipmentType || !quantity || !origin || !destination || !carrier) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    // For demo purposes, show success message
    // In production, this would call API to create booking in Google Sheets
    console.log('Creating booking:', {
        equipmentType,
        quantity,
        quality,
        origin,
        destination,
        carrier,
        pickupDate,
        deliveryDate,
        exchangeType,
        notes
    });

    alert('Booking created successfully!\n\nIn production, this would:\n1. Create a new row in Google Sheets\n2. Generate a booking number\n3. Send notifications to parties\n4. Log creation event');

    closeNewBookingModal();

    // Reload bookings (in production, would fetch from API)
    await loadBookings();
    renderBookingMatrix();
}

function renderBooking() {
    // Legacy swimlane view - now replaced by booking matrix
    // Keep for backwards compatibility but primary view is now the matrix
    renderBookingMatrix();
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

    // Initialize view-specific content
    if (id === 'bookings') {
        populateCarrierFilter();
        renderBookingMatrix();
    } else if (id === 'cockpit') {
        loadCockpitData();
    } else if (id === 'balances') {
        loadReconciliation();
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
// RECONCILIATION VIEW
// ============================================

let reconciliationData = [];

async function loadReconciliation() {
    // Generate reconciliation data from bookings
    // In production, this would come from a dedicated API endpoint
    try {
        if (!currentBookings || currentBookings.length === 0) {
            await loadBookings();
        }

        reconciliationData = currentBookings.map((booking, index) => {
            const expectedQty = booking.quantity || 33;
            // Simulate some variances for demo purposes
            const hasVariance = index % 3 === 0; // Every 3rd booking has a variance
            const varianceAmount = hasVariance ? (index % 2 === 0 ? -5 : 3) : 0;
            const observedQty = expectedQty + varianceAmount;

            return {
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                equipmentType: booking.equipmentType || 'EUR',
                expected: expectedQty,
                observed: booking.status === 'delivered' ? observedQty : null,
                variance: booking.status === 'delivered' ? varianceAmount : null,
                status: booking.status === 'delivered'
                    ? (varianceAmount === 0 ? 'matched' : 'variance')
                    : 'pending',
                hasEvidence: booking.status === 'delivered',
                origin: booking.origin.name,
                destination: booking.destination.name,
                carrier: booking.carrier.name
            };
        });

        renderReconciliationSummary();
        renderReconciliationTable();
    } catch (error) {
        console.error('Error loading reconciliation:', error);
    }
}

function renderReconciliationSummary() {
    const matched = reconciliationData.filter(r => r.status === 'matched').length;
    const variances = reconciliationData.filter(r => r.status === 'variance').length;
    const pending = reconciliationData.filter(r => r.status === 'pending').length;

    // Calculate financial impact (€2.50 per pallet variance for demo)
    const financialImpact = reconciliationData
        .filter(r => r.variance !== null)
        .reduce((sum, r) => sum + Math.abs(r.variance) * 2.5, 0);

    document.getElementById('recon-matched').textContent = matched;
    document.getElementById('recon-variances').textContent = variances;
    document.getElementById('recon-pending').textContent = pending;
    document.getElementById('recon-financial').textContent = `€${financialImpact.toFixed(2)}`;
}

function renderReconciliationTable() {
    const tbody = document.getElementById('recon-table-body');
    if (!tbody) return;

    const filterStatus = document.getElementById('recon-filter-status')?.value || 'all';

    let filteredData = reconciliationData;
    if (filterStatus !== 'all') {
        filteredData = reconciliationData.filter(r => r.status === filterStatus);
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
                    No reconciliation records found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredData.map(recon => {
        const varianceClass = recon.variance === null ? '' :
            recon.variance === 0 ? 'zero' :
            recon.variance > 0 ? 'positive' : 'negative';

        const varianceDisplay = recon.variance === null ? '-' :
            recon.variance === 0 ? '0' :
            recon.variance > 0 ? `+${recon.variance}` : recon.variance;

        const statusIcon = recon.status === 'matched' ? 'ri-checkbox-circle-line' :
            recon.status === 'variance' ? 'ri-alert-line' : 'ri-time-line';

        return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${recon.bookingNumber}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.125rem;">
                        ${recon.origin} → ${recon.destination}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.375rem;">
                        <i class="ri-stack-line" style="color: var(--text-tertiary);"></i>
                        ${recon.equipmentType}
                    </div>
                </td>
                <td>
                    <strong>${recon.expected}</strong> units
                </td>
                <td>
                    ${recon.observed !== null ? `<strong>${recon.observed}</strong> units` :
                      '<span style="color: var(--text-tertiary);">Not delivered</span>'}
                </td>
                <td>
                    <span class="variance-value ${varianceClass}">
                        ${varianceDisplay}
                    </span>
                </td>
                <td>
                    <span class="recon-status-badge ${recon.status}">
                        <i class="${statusIcon}"></i>
                        ${recon.status}
                    </span>
                </td>
                <td>
                    ${recon.hasEvidence ? `
                        <a href="#" class="evidence-link" onclick="viewEvidence('${recon.bookingNumber}'); return false;">
                            <i class="ri-file-text-line"></i>
                            POD
                        </a>
                    ` : '<span style="color: var(--text-tertiary);">—</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        ${recon.status === 'variance' ? `
                            <button class="btn-icon" onclick="resolveVariance('${recon.bookingNumber}')" title="Resolve">
                                <i class="ri-check-line"></i>
                            </button>
                            <button class="btn-icon" onclick="createDispute('${recon.bookingNumber}')" title="Create Dispute">
                                <i class="ri-flag-line"></i>
                            </button>
                        ` : recon.status === 'matched' ? `
                            <button class="btn-icon" disabled title="Matched">
                                <i class="ri-check-line"></i>
                            </button>
                        ` : `
                            <span style="color: var(--text-tertiary);">—</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterReconciliation() {
    renderReconciliationTable();
}

function triggerReconciliation() {
    console.log('Running reconciliation...');
    loadReconciliation();

    // Show visual feedback
    const btn = event.target.closest('.btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Running...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }, 1500);
}

function resolveVariance(bookingNumber) {
    console.log('Resolving variance for:', bookingNumber);
    alert(`Variance Resolution Flow:\n\n1. Review evidence (POD, scans)\n2. Determine root cause\n3. Create ledger adjustment\n4. Update reconciliation status\n\nIn production, this would open a detailed resolution modal.`);
}

function createDispute(bookingNumber) {
    console.log('Creating dispute for:', bookingNumber);
    alert(`Dispute Creation Flow:\n\n1. Document the discrepancy\n2. Assign to responsible party\n3. Set SLA timeline\n4. Lock provisional ledger entries\n\nIn production, this would create a first-class Dispute object with full lifecycle tracking.`);
}

function viewEvidence(bookingNumber) {
    console.log('Viewing evidence for:', bookingNumber);
    alert(`Evidence Viewer:\n\nWould show:\n- Scanned POD documents\n- AI extraction confidence\n- Photos/signatures\n- Event timeline\n- GPS data\n\nIn production, this would open a document viewer with AI annotations.`);
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
    await loadCockpitData();

    console.log('✓ Application ready with live data');
});
