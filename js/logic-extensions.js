/**
 * LOGIC EXTENSIONS - Stop Timeline & Booking Edit
 * These functions extend logic.js with stop-centric features
 *
 * ADD THESE TO THE END OF logic.js OR INCLUDE AS SEPARATE SCRIPT
 */

// ============================================
// BOOKING EDIT MODAL
// ============================================

function openEditBookingModal(bookingId) {
    const booking = currentBookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Booking not found');
        return;
    }

    // Pre-populate form with current values
    document.getElementById('edit-booking-id').value = booking.id;
    document.getElementById('edit-equipment-type').value = booking.equipmentType || 'EUR';
    document.getElementById('edit-quantity').value = booking.quantity || '';
    document.getElementById('edit-quality').value = booking.quality || 'A';
    document.getElementById('edit-origin').value = booking.origin.name || '';
    document.getElementById('edit-destination').value = booking.destination.name || '';
    document.getElementById('edit-carrier').value = booking.carrier.name || '';

    // Handle dates (convert ISO to YYYY-MM-DD format)
    if (booking.scheduledPickup) {
        const pickupDate = new Date(booking.scheduledPickup).toISOString().split('T')[0];
        document.getElementById('edit-pickup-date').value = pickupDate;
    }

    if (booking.scheduledDelivery) {
        const deliveryDate = new Date(booking.scheduledDelivery).toISOString().split('T')[0];
        document.getElementById('edit-delivery-date').value = deliveryDate;
    }

    document.getElementById('edit-notes').value = booking.notes || '';

    // Show modal
    const modal = document.getElementById('edit-booking-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeEditBookingModal() {
    const modal = document.getElementById('edit-booking-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function updateBooking() {
    // Get form values
    const bookingId = document.getElementById('edit-booking-id')?.value;
    const equipmentType = document.getElementById('edit-equipment-type')?.value;
    const quantity = document.getElementById('edit-quantity')?.value;
    const quality = document.getElementById('edit-quality')?.value;
    const origin = document.getElementById('edit-origin')?.value;
    const destination = document.getElementById('edit-destination')?.value;
    const carrier = document.getElementById('edit-carrier')?.value;
    const pickupDate = document.getElementById('edit-pickup-date')?.value;
    const deliveryDate = document.getElementById('edit-delivery-date')?.value;
    const notes = document.getElementById('edit-notes')?.value;

    // Validate required fields
    if (!bookingId || !equipmentType || !quantity || !origin || !destination || !carrier) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    // Show loading state
    const btn = event.target.closest('.btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Saving...';
    btn.disabled = true;

    try {
        // Call API to update booking
        const result = await window.logistikbudeAPI.updateBooking(bookingId, {
            equipmentType,
            quantity: parseInt(quantity),
            quality,
            origin,
            destination,
            carrier,
            pickupDate,
            deliveryDate,
            notes
        });

        if (result.success) {
            console.log('Booking updated:', result.data);

            // Show success message
            alert(`✓ Booking Updated Successfully!\n\n` +
                  `Booking Number: ${result.data.bookingNumber}\n` +
                  `Equipment: ${quantity}x ${equipmentType}\n` +
                  `Route: ${origin} → ${destination}\n\n` +
                  `A BookingModified event has been logged.`);

            // Close modal
            closeEditBookingModal();

            // Reload bookings and refresh display
            await loadBookings();
            renderBookingMatrix();

            // Re-render details if this was the selected booking
            if (selectedBookingId == bookingId) {
                renderBookingDetails(bookingId);
            }
        } else {
            alert(`Error updating booking: ${result.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error('Error updating booking:', error);
        alert(`Failed to update booking: ${error.message}`);
    } finally {
        // Restore button state
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// ============================================
// ENHANCED BOOKING DETAILS WITH STOPS
// ============================================

// Store stops data globally
let currentStops = [];

async function renderBookingDetailsWithStops(bookingId) {
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

    // Start with basic details (show immediately)
    container.innerHTML = `
        <div class="details-header">
            <div>
                <h3><i class="ri-file-text-line"></i> ${booking.bookingNumber}</h3>
                <div class="booking-status-badge ${booking.status}">
                    ${booking.status === 'in_transit' ? 'In Transit' :
                      booking.status === 'delivered' ? 'Delivered' :
                      booking.status === 'issue' ? 'Issue' : 'Pending'}
                </div>
            </div>
            <button class="btn btn-secondary" onclick="openEditBookingModal(${booking.id})">
                <i class="ri-edit-line"></i> Edit
            </button>
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

        <!-- Stop Timeline (Loading) -->
        <div class="details-section">
            <h4><i class="ri-route-line"></i> Stop-Level Journey</h4>
            <div id="stop-timeline-container" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
                <i class="ri-loader-4-line" style="animation: spin 1s linear infinite; font-size: 2rem;"></i>
                <p style="margin-top: 1rem;">Loading stops...</p>
            </div>
        </div>

        ${booking.notes ? `
            <div class="details-section">
                <h4>Notes</h4>
                <div class="detail-value">${booking.notes}</div>
            </div>
        ` : ''}
    `;

    // Fetch stops asynchronously
    try {
        const stopsData = await fetchStops(booking.id);
        currentStops = stopsData;
        renderStopTimeline(stopsData, booking);
    } catch (error) {
        console.error('Error fetching stops:', error);
        document.getElementById('stop-timeline-container').innerHTML = `
            <p style="color: var(--accent-error);">
                <i class="ri-alert-line"></i> Failed to load stops. Using basic timeline.
            </p>
        `;
        // Fall back to basic timeline
        renderBasicTimeline(booking, quantity, equipmentType);
    }
}

async function fetchStops(bookingId) {
    try {
        // Use localStorage API
        const stops = await window.logistikbudeAPI.getStops(bookingId);
        return stops || [];
    } catch (error) {
        console.error('Error fetching stops:', error);
        return [];
    }
}

function renderStopTimeline(stops, booking) {
    const container = document.getElementById('stop-timeline-container');
    if (!container) return;

    if (!stops || stops.length === 0) {
        // Fall back to basic timeline
        renderBasicTimeline(booking, booking.quantity, booking.equipmentType);
        return;
    }

    // Sort stops by sequence
    const sortedStops = stops.sort((a, b) => a.stopSequence - b.stopSequence);

    const timelineHTML = `
        <div class="stop-timeline">
            ${sortedStops.map((stop, index) => `
                <div class="stop-card ${stop.status}">
                    <div class="stop-header">
                        <div class="stop-sequence">
                            <span class="stop-number">${stop.stopSequence}</span>
                            <span class="stop-type-badge ${stop.stopType}">${formatStopType(stop.stopType)}</span>
                        </div>
                        <div class="stop-status">
                            ${getStatusIcon(stop.status)} ${formatStatus(stop.status)}
                        </div>
                    </div>

                    <div class="stop-body">
                        <div class="stop-location">
                            <i class="ri-map-pin-line"></i>
                            <div>
                                <div class="location-name">${stop.location.name}</div>
                                <div class="location-city">${stop.location.city}</div>
                            </div>
                        </div>

                        <div class="stop-company">
                            <i class="ri-building-line"></i>
                            <div>
                                <div class="company-name">${stop.company.name}</div>
                                <div class="company-role">${formatRole(stop.company.role)}</div>
                            </div>
                        </div>

                        ${stop.transactions && stop.transactions.length > 0 ? `
                            <div class="stop-transactions">
                                <div class="transactions-header">
                                    <i class="ri-exchange-line"></i>
                                    <span>Transactions (${stop.transactions.length})</span>
                                </div>
                                ${stop.transactions.map(tx => `
                                    <div class="transaction-row">
                                        <span class="tx-direction ${tx.direction}">
                                            ${tx.direction === 'in' ? '→' : '←'} ${tx.direction.toUpperCase()}
                                        </span>
                                        <span class="tx-quantity">${tx.quantity} ${tx.equipmentType}</span>
                                        <span class="tx-quality">Grade ${tx.qualityGrade}</span>
                                        ${tx.hasVariance ? `
                                            <span class="tx-variance">
                                                <i class="ri-alert-line"></i> Variance: ${tx.variance > 0 ? '+' : ''}${tx.variance}
                                            </span>
                                        ` : ''}
                                    </div>
                                `).join('')}
                                <div class="transaction-summary">
                                    IN: ${stop.transactionsSummary.totalIn} |
                                    OUT: ${stop.transactionsSummary.totalOut} |
                                    NET: ${stop.transactionsSummary.totalIn - stop.transactionsSummary.totalOut}
                                </div>
                            </div>
                        ` : ''}

                        ${stop.pspCharges && stop.pspCharges.length > 0 ? `
                            <div class="stop-psp-charges">
                                <i class="ri-money-euro-circle-line"></i>
                                <span>PSP Charges: €${stop.transactionsSummary.pspChargesTotal.toFixed(2)}</span>
                                ${stop.pspCharges.map(charge => `
                                    <div class="psp-charge-detail">
                                        ${charge.chargeType}: €${charge.totalInclVatEur.toFixed(2)}
                                        ${charge.pspVoucherNumber ? `(${charge.pspVoucherNumber})` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${stop.custody.transfer ? `
                            <div class="custody-transfer">
                                <i class="ri-arrow-right-line"></i>
                                Custody: ${stop.custody.before} → ${stop.custody.after}
                            </div>
                        ` : ''}

                        ${stop.schedule.scheduledArrival || stop.schedule.scheduledDeparture ? `
                            <div class="stop-schedule">
                                ${stop.schedule.scheduledArrival ? `
                                    <div><i class="ri-time-line"></i> Arrival: ${formatDateTime(stop.schedule.scheduledArrival)}</div>
                                ` : ''}
                                ${stop.schedule.scheduledDeparture ? `
                                    <div><i class="ri-time-line"></i> Departure: ${formatDateTime(stop.schedule.scheduledDeparture)}</div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    ${index < sortedStops.length - 1 ? '<div class="stop-connector"></div>' : ''}
                </div>
            `).join('')}
        </div>

        ${stops.length > 1 ? `
            <div class="journey-summary">
                <div class="summary-stat">
                    <i class="ri-route-line"></i>
                    <span>${stops.length} stops</span>
                </div>
                <div class="summary-stat">
                    <i class="ri-check-line"></i>
                    <span>${stops.filter(s => s.status === 'completed').length} completed</span>
                </div>
                ${stops.filter(s => s.transactionsSummary.variancesCount > 0).length > 0 ? `
                    <div class="summary-stat warning">
                        <i class="ri-alert-line"></i>
                        <span>${stops.filter(s => s.transactionsSummary.variancesCount > 0).length} stops with variances</span>
                    </div>
                ` : ''}
            </div>
        ` : ''}
    `;

    container.innerHTML = timelineHTML;
}

function renderBasicTimeline(booking, quantity, equipmentType) {
    const container = document.getElementById('stop-timeline-container');
    if (!container) return;

    container.innerHTML = `
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
    `;
}

// Helper functions
function formatStopType(type) {
    const map = {
        'origin': 'Origin',
        'destination': 'Destination',
        'consolidation_hub': 'Hub',
        'psp_service_point': 'PSP',
        'handoff_point': 'Handoff',
        'quality_checkpoint': 'QC',
        'storage_depot': 'Storage'
    };
    return map[type] || type;
}

function formatStatus(status) {
    const map = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'skipped': 'Skipped',
        'exception': 'Exception'
    };
    return map[status] || status;
}

function getStatusIcon(status) {
    const icons = {
        'pending': '<i class="ri-time-line"></i>',
        'in_progress': '<i class="ri-loader-4-line"></i>',
        'completed': '<i class="ri-check-line"></i>',
        'skipped': '<i class="ri-skip-forward-line"></i>',
        'exception': '<i class="ri-alert-line"></i>'
    };
    return icons[status] || '<i class="ri-checkbox-blank-circle-line"></i>';
}

function formatRole(role) {
    const map = {
        'shipper': 'Shipper',
        'receiver': 'Receiver',
        'carrier': 'Carrier',
        'psp': 'PSP Provider',
        'warehouse': 'Warehouse',
        'customs': 'Customs'
    };
    return map[role] || role;
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Override the original renderBookingDetails to use the new version
const originalRenderBookingDetails = window.renderBookingDetails;
window.renderBookingDetails = renderBookingDetailsWithStops;

console.log('✅ Logic extensions loaded: Stop Timeline & Booking Edit');
