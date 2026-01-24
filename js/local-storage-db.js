/**
 * LOCAL STORAGE DATABASE
 * Simple localStorage-based database for Logistikbude 3.0
 * Replaces Google Sheets backend with instant local storage
 */

// Database collections
const DB_KEYS = {
    BOOKINGS: 'lb3_bookings',
    STOPS: 'lb3_stops',
    TRANSACTIONS: 'lb3_transactions',
    PSP_CHARGES: 'lb3_psp_charges',
    TASKS: 'lb3_tasks',
    EVENTS: 'lb3_events',
    COMPANIES: 'lb3_companies',
    LOCATIONS: 'lb3_locations',
    METADATA: 'lb3_metadata'
};

// Initialize database
function initDB() {
    // Check if database exists
    if (!localStorage.getItem(DB_KEYS.METADATA)) {
        console.log('🔧 Initializing fresh database...');

        // Create empty collections
        Object.values(DB_KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });

        // Set metadata
        localStorage.setItem(DB_KEYS.METADATA, JSON.stringify({
            version: '3.0',
            initialized: new Date().toISOString(),
            lastReset: new Date().toISOString()
        }));

        console.log('✓ Database initialized');
    }
}

// Helper: Get collection
function getCollection(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// Helper: Save collection
function saveCollection(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
}

// Helper: Generate ID
function getNextId(collection) {
    const items = getCollection(collection);
    if (items.length === 0) return 1;
    const maxId = Math.max(...items.map(item => item.id || 0));
    return maxId + 1;
}

// Helper: Generate booking number
function generateBookingNumber(id) {
    const year = new Date().getFullYear();
    return `BK-${year}-${String(id).padStart(4, '0')}`;
}

// Helper: Generate stop number
function generateStopNumber(id) {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `STP-${dateStr}-${String(id).padStart(4, '0')}`;
}

// Helper: Generate transaction number
function generateTransactionNumber(id) {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `STX-${dateStr}-${String(id).padStart(5, '0')}`;
}

// ============================================
// BOOKINGS API
// ============================================

const bookingsDB = {
    // Get all bookings
    getAll() {
        return getCollection(DB_KEYS.BOOKINGS);
    },

    // Get booking by ID
    getById(id) {
        const bookings = getCollection(DB_KEYS.BOOKINGS);
        return bookings.find(b => b.id === parseInt(id));
    },

    // Get booking by number
    getByNumber(bookingNumber) {
        const bookings = getCollection(DB_KEYS.BOOKINGS);
        return bookings.find(b => b.bookingNumber === bookingNumber);
    },

    // Create new booking
    create(bookingData) {
        const bookings = getCollection(DB_KEYS.BOOKINGS);
        const id = getNextId(DB_KEYS.BOOKINGS);
        const bookingNumber = generateBookingNumber(id);
        const now = new Date().toISOString();

        const newBooking = {
            id,
            bookingNumber,
            equipmentType: bookingData.equipmentType || 'EUR',
            quantity: bookingData.quantity || 1,
            quality: bookingData.quality || 'A',
            origin: bookingData.origin || {},
            destination: bookingData.destination || {},
            carrier: bookingData.carrier || {},
            scheduledPickup: bookingData.scheduledPickup || null,
            scheduledDelivery: bookingData.scheduledDelivery || null,
            actualPickup: bookingData.actualPickup || null,
            actualDelivery: bookingData.actualDelivery || null,
            status: bookingData.status || 'pending',
            currentNode: bookingData.currentNode || 0,
            totalNodes: bookingData.totalNodes || 4,
            notes: bookingData.notes || '',
            createdAt: now,
            updatedAt: now,
            ...bookingData
        };

        bookings.push(newBooking);
        saveCollection(DB_KEYS.BOOKINGS, bookings);

        // Log event
        eventsDB.create({
            eventType: 'BookingCreated',
            bookingId: id,
            bookingNumber: bookingNumber,
            location: bookingData.origin?.name || 'Unknown',
            performedBy: 'System',
            source: 'web_ui',
            description: `Booking created: ${bookingData.quantity}x ${bookingData.equipmentType}`,
            confidence: 1.0
        });

        return newBooking;
    },

    // Update booking
    update(id, updates) {
        const bookings = getCollection(DB_KEYS.BOOKINGS);
        const index = bookings.findIndex(b => b.id === parseInt(id));

        if (index === -1) return null;

        const booking = bookings[index];
        const updatedBooking = {
            ...booking,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        bookings[index] = updatedBooking;
        saveCollection(DB_KEYS.BOOKINGS, bookings);

        // Log event
        eventsDB.create({
            eventType: 'BookingModified',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            location: booking.origin?.name || 'Unknown',
            performedBy: 'User',
            source: 'web_ui',
            description: `Booking modified`,
            confidence: 1.0
        });

        return updatedBooking;
    },

    // Delete booking
    delete(id) {
        const bookings = getCollection(DB_KEYS.BOOKINGS);
        const filtered = bookings.filter(b => b.id !== parseInt(id));
        saveCollection(DB_KEYS.BOOKINGS, filtered);
        return true;
    }
};

// ============================================
// STOPS API
// ============================================

const stopsDB = {
    // Get all stops
    getAll() {
        return getCollection(DB_KEYS.STOPS);
    },

    // Get stops by booking ID
    getByBookingId(bookingId) {
        const stops = getCollection(DB_KEYS.STOPS);
        return stops.filter(s => s.bookingId === parseInt(bookingId));
    },

    // Get stop by ID
    getById(id) {
        const stops = getCollection(DB_KEYS.STOPS);
        return stops.find(s => s.id === parseInt(id));
    },

    // Create stop
    create(stopData) {
        const stops = getCollection(DB_KEYS.STOPS);
        const id = getNextId(DB_KEYS.STOPS);
        const stopNumber = generateStopNumber(id);
        const now = new Date().toISOString();

        const newStop = {
            id,
            stopNumber,
            bookingId: stopData.bookingId,
            bookingNumber: stopData.bookingNumber,
            stopSequence: stopData.stopSequence || 1,
            stopType: stopData.stopType || 'origin',
            location: stopData.location || {},
            company: stopData.company || {},
            scheduledArrival: stopData.scheduledArrival || null,
            scheduledDeparture: stopData.scheduledDeparture || null,
            actualArrival: stopData.actualArrival || null,
            actualDeparture: stopData.actualDeparture || null,
            status: stopData.status || 'pending',
            notes: stopData.notes || '',
            createdAt: now,
            updatedAt: now,
            ...stopData
        };

        stops.push(newStop);
        saveCollection(DB_KEYS.STOPS, stops);
        return newStop;
    },

    // Update stop
    update(id, updates) {
        const stops = getCollection(DB_KEYS.STOPS);
        const index = stops.findIndex(s => s.id === parseInt(id));

        if (index === -1) return null;

        stops[index] = {
            ...stops[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        saveCollection(DB_KEYS.STOPS, stops);
        return stops[index];
    }
};

// ============================================
// TRANSACTIONS API
// ============================================

const transactionsDB = {
    // Get all transactions
    getAll() {
        return getCollection(DB_KEYS.TRANSACTIONS);
    },

    // Get transactions by stop ID
    getByStopId(stopId) {
        const transactions = getCollection(DB_KEYS.TRANSACTIONS);
        return transactions.filter(t => t.stopId === parseInt(stopId));
    },

    // Get transactions by booking ID
    getByBookingId(bookingId) {
        const transactions = getCollection(DB_KEYS.TRANSACTIONS);
        return transactions.filter(t => t.bookingId === parseInt(bookingId));
    },

    // Create transaction
    create(txData) {
        const transactions = getCollection(DB_KEYS.TRANSACTIONS);
        const id = getNextId(DB_KEYS.TRANSACTIONS);
        const transactionNumber = generateTransactionNumber(id);
        const now = new Date().toISOString();

        const newTransaction = {
            id,
            transactionNumber,
            stopId: txData.stopId,
            stopNumber: txData.stopNumber,
            bookingId: txData.bookingId,
            bookingNumber: txData.bookingNumber,
            direction: txData.direction || 'in',
            quantity: txData.quantity || 0,
            expectedQuantity: txData.expectedQuantity || txData.quantity || 0,
            variance: txData.variance || 0,
            hasVariance: Math.abs(txData.variance || 0) > 0,
            equipmentType: txData.equipmentType || 'EUR',
            quality: txData.quality || 'A',
            fromCompany: txData.fromCompany || {},
            toCompany: txData.toCompany || {},
            performedBy: txData.performedBy || 'System',
            timestamp: txData.timestamp || now,
            notes: txData.notes || '',
            createdAt: now,
            ...txData
        };

        transactions.push(newTransaction);
        saveCollection(DB_KEYS.TRANSACTIONS, transactions);
        return newTransaction;
    }
};

// ============================================
// PSP CHARGES API
// ============================================

const pspChargesDB = {
    // Get all PSP charges
    getAll() {
        return getCollection(DB_KEYS.PSP_CHARGES);
    },

    // Get charges by stop ID
    getByStopId(stopId) {
        const charges = getCollection(DB_KEYS.PSP_CHARGES);
        return charges.filter(c => c.stopId === parseInt(stopId));
    },

    // Create PSP charge
    create(chargeData) {
        const charges = getCollection(DB_KEYS.PSP_CHARGES);
        const id = getNextId(DB_KEYS.PSP_CHARGES);
        const now = new Date().toISOString();

        const newCharge = {
            id,
            stopId: chargeData.stopId,
            stopNumber: chargeData.stopNumber,
            bookingId: chargeData.bookingId,
            chargeType: chargeData.chargeType || 'handling',
            amount: chargeData.amount || 0,
            currency: chargeData.currency || 'EUR',
            pspName: chargeData.pspName || '',
            description: chargeData.description || '',
            createdAt: now,
            ...chargeData
        };

        charges.push(newCharge);
        saveCollection(DB_KEYS.PSP_CHARGES, charges);
        return newCharge;
    }
};

// ============================================
// TASKS API
// ============================================

const tasksDB = {
    // Get all tasks
    getAll() {
        return getCollection(DB_KEYS.TASKS);
    },

    // Get pending tasks
    getPending() {
        const tasks = getCollection(DB_KEYS.TASKS);
        return tasks.filter(t => t.status === 'pending');
    },

    // Get task by ID
    getById(id) {
        const tasks = getCollection(DB_KEYS.TASKS);
        return tasks.find(t => t.id === parseInt(id));
    },

    // Create task
    create(taskData) {
        const tasks = getCollection(DB_KEYS.TASKS);
        const id = getNextId(DB_KEYS.TASKS);
        const now = new Date().toISOString();

        const newTask = {
            id,
            bookingId: taskData.bookingId || null,
            bookingNumber: taskData.bookingNumber || null,
            taskType: taskData.taskType || 'variance_review',
            priority: taskData.priority || 'medium',
            description: taskData.description || '',
            status: taskData.status || 'pending',
            assignedTo: taskData.assignedTo || null,
            createdAt: now,
            dueDate: taskData.dueDate || null,
            completedAt: null,
            completedBy: null,
            notes: taskData.notes || '',
            ...taskData
        };

        tasks.push(newTask);
        saveCollection(DB_KEYS.TASKS, tasks);
        return newTask;
    },

    // Complete task
    complete(id, userId = 'User', notes = '') {
        const tasks = getCollection(DB_KEYS.TASKS);
        const index = tasks.findIndex(t => t.id === parseInt(id));

        if (index === -1) return null;

        tasks[index] = {
            ...tasks[index],
            status: 'completed',
            completedAt: new Date().toISOString(),
            completedBy: userId,
            notes: notes || tasks[index].notes
        };

        saveCollection(DB_KEYS.TASKS, tasks);
        return tasks[index];
    }
};

// ============================================
// EVENTS API
// ============================================

const eventsDB = {
    // Get all events
    getAll(limit = 100) {
        const events = getCollection(DB_KEYS.EVENTS);
        return events.slice(-limit).reverse(); // Most recent first
    },

    // Get events by booking ID
    getByBookingId(bookingId, limit = 50) {
        const events = getCollection(DB_KEYS.EVENTS);
        const filtered = events.filter(e => e.bookingId === parseInt(bookingId));
        return filtered.slice(-limit).reverse();
    },

    // Create event
    create(eventData) {
        const events = getCollection(DB_KEYS.EVENTS);
        const id = getNextId(DB_KEYS.EVENTS);
        const now = new Date().toISOString();

        const newEvent = {
            id,
            timestamp: eventData.timestamp || now,
            eventType: eventData.eventType || 'BookingCreated',
            bookingId: eventData.bookingId || null,
            bookingNumber: eventData.bookingNumber || null,
            location: eventData.location || '',
            performedBy: eventData.performedBy || 'System',
            source: eventData.source || 'web_ui',
            description: eventData.description || '',
            confidence: eventData.confidence || 1.0,
            metadata: eventData.metadata || {},
            ...eventData
        };

        events.push(newEvent);
        saveCollection(DB_KEYS.EVENTS, events);
        return newEvent;
    }
};

// ============================================
// COMPANIES & LOCATIONS
// ============================================

const companiesDB = {
    getAll() {
        return getCollection(DB_KEYS.COMPANIES);
    },

    create(companyData) {
        const companies = getCollection(DB_KEYS.COMPANIES);
        const id = getNextId(DB_KEYS.COMPANIES);

        const newCompany = {
            id,
            name: companyData.name || 'Unknown Company',
            type: companyData.type || 'other',
            ...companyData
        };

        companies.push(newCompany);
        saveCollection(DB_KEYS.COMPANIES, companies);
        return newCompany;
    }
};

const locationsDB = {
    getAll() {
        return getCollection(DB_KEYS.LOCATIONS);
    },

    create(locationData) {
        const locations = getCollection(DB_KEYS.LOCATIONS);
        const id = getNextId(DB_KEYS.LOCATIONS);

        const newLocation = {
            id,
            name: locationData.name || 'Unknown Location',
            city: locationData.city || '',
            lat: locationData.lat || 0,
            lng: locationData.lng || 0,
            ...locationData
        };

        locations.push(newLocation);
        saveCollection(DB_KEYS.LOCATIONS, locations);
        return newLocation;
    }
};

// ============================================
// DATABASE UTILITIES
// ============================================

const dbUtils = {
    // Reset entire database
    reset() {
        Object.values(DB_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        initDB();
        console.log('🔄 Database reset complete');
    },

    // Export database as JSON
    export() {
        const db = {};
        Object.entries(DB_KEYS).forEach(([name, key]) => {
            db[name.toLowerCase()] = getCollection(key);
        });
        return db;
    },

    // Import database from JSON
    import(data) {
        Object.entries(data).forEach(([name, items]) => {
            const key = DB_KEYS[name.toUpperCase()];
            if (key) {
                saveCollection(key, items);
            }
        });
        console.log('✓ Database import complete');
    },

    // Get database stats
    stats() {
        return {
            bookings: getCollection(DB_KEYS.BOOKINGS).length,
            stops: getCollection(DB_KEYS.STOPS).length,
            transactions: getCollection(DB_KEYS.TRANSACTIONS).length,
            pspCharges: getCollection(DB_KEYS.PSP_CHARGES).length,
            tasks: getCollection(DB_KEYS.TASKS).length,
            events: getCollection(DB_KEYS.EVENTS).length,
            companies: getCollection(DB_KEYS.COMPANIES).length,
            locations: getCollection(DB_KEYS.LOCATIONS).length,
            metadata: JSON.parse(localStorage.getItem(DB_KEYS.METADATA) || '{}')
        };
    }
};

// Initialize on load
initDB();

// Export to window for global access
window.localDB = {
    bookings: bookingsDB,
    stops: stopsDB,
    transactions: transactionsDB,
    pspCharges: pspChargesDB,
    tasks: tasksDB,
    events: eventsDB,
    companies: companiesDB,
    locations: locationsDB,
    utils: dbUtils
};

console.log('✓ LocalStorage DB ready:', dbUtils.stats());
