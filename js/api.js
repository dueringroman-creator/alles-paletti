/**
 * API CLIENT - LocalStorage Edition
 * Uses localStorage instead of backend API calls
 * Drop-in replacement for fetch-based API
 */

const api = {
    // Fetch all bookings
    async getBookings() {
        try {
            const bookings = window.localDB.bookings.getAll();
            return bookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            return [];
        }
    },

    // Fetch all tasks
    async getTasks() {
        try {
            const tasks = window.localDB.tasks.getAll();
            return tasks;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    },

    // Complete a task
    async completeTask(taskId, userId = 'Demo User', notes = '') {
        try {
            const task = window.localDB.tasks.complete(taskId, userId, notes);
            return { success: !!task, data: task };
        } catch (error) {
            console.error('Error completing task:', error);
            return { success: false, error: error.message };
        }
    },

    // Update booking node (for progress tracking)
    async updateBookingNode(bookingId, nodeSequence, details) {
        try {
            const updates = {
                currentNode: nodeSequence,
                ...details
            };
            const booking = window.localDB.bookings.update(bookingId, updates);
            return { success: !!booking, data: booking };
        } catch (error) {
            console.error('Error updating booking node:', error);
            return { success: false, error: error.message };
        }
    },

    // Update booking details (full edit)
    async updateBooking(bookingId, bookingData) {
        try {
            const booking = window.localDB.bookings.update(bookingId, bookingData);
            return { success: !!booking, data: booking };
        } catch (error) {
            console.error('Error updating booking:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch events
    async getEvents(bookingId = null, limit = 50) {
        try {
            const events = bookingId
                ? window.localDB.events.getByBookingId(bookingId, limit)
                : window.localDB.events.getAll(limit);
            return events;
        } catch (error) {
            console.error('Error fetching events:', error);
            return [];
        }
    },

    // Create a new booking
    async createBooking(bookingData) {
        try {
            const booking = window.localDB.bookings.create(bookingData);
            return { success: true, data: booking };
        } catch (error) {
            console.error('Error creating booking:', error);
            return { success: false, error: error.message };
        }
    },

    // Fetch stops for a booking
    async getStops(bookingId) {
        try {
            const stops = window.localDB.stops.getByBookingId(bookingId);

            // Enrich each stop with its transactions and PSP charges
            const enrichedStops = stops.map(stop => {
                const transactions = window.localDB.transactions.getByStopId(stop.id);
                const pspCharges = window.localDB.pspCharges.getByStopId(stop.id);

                // Calculate summary
                const totalIn = transactions
                    .filter(t => t.direction === 'in')
                    .reduce((sum, t) => sum + (t.quantity || 0), 0);

                const totalOut = transactions
                    .filter(t => t.direction === 'out')
                    .reduce((sum, t) => sum + (t.quantity || 0), 0);

                const variancesCount = transactions
                    .filter(t => t.hasVariance)
                    .length;

                const pspChargesTotal = pspCharges
                    .reduce((sum, c) => sum + (c.amount || 0), 0);

                return {
                    ...stop,
                    transactions,
                    pspCharges,
                    transactionsSummary: {
                        totalIn,
                        totalOut,
                        variancesCount,
                        pspChargesTotal
                    }
                };
            });

            return enrichedStops;
        } catch (error) {
            console.error('Error fetching stops:', error);
            return [];
        }
    }
};

// Export API to global scope for use in other files
window.logistikbudeAPI = api;

console.log('✓ API ready (localStorage mode)');
