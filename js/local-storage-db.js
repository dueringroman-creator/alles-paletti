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
    DOCUMENTS: 'lb3_documents',
    DOCUMENT_PAGES: 'lb3_document_pages',
    EXTRACTION_RESULTS: 'lb3_extraction_results',
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
// DOCUMENTS API (Document Intelligence)
// ============================================

const documentsDB = {
    // Get all documents
    getAll() {
        return getCollection(DB_KEYS.DOCUMENTS);
    },

    // Get document by ID
    getById(id) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        return documents.find(d => d.id === parseInt(id));
    },

    // Get documents by booking ID
    getByBookingId(bookingId) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        return documents.filter(d => d.bookingId === parseInt(bookingId));
    },

    // Get documents by status
    getByStatus(status) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        return documents.filter(d => d.processingStatus === status);
    },

    // Create document
    create(docData) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        const id = getNextId(DB_KEYS.DOCUMENTS);
        const now = new Date().toISOString();

        const newDocument = {
            id,
            fileName: docData.fileName || 'unknown.pdf',
            fileSize: docData.fileSize || 0,
            fileType: docData.fileType || 'application/pdf',
            fileData: docData.fileData || null, // Base64 encoded file
            uploadedAt: now,
            uploadedBy: docData.uploadedBy || 'User',
            bookingId: docData.bookingId || null,
            bookingNumber: docData.bookingNumber || null,
            companyId: docData.companyId || null,
            companyName: docData.companyName || null,
            documentType: docData.documentType || 'pod', // pod, cmr, invoice, packing_list
            processingStatus: 'pending', // pending, processing, completed, failed
            processingStarted: null,
            processingCompleted: null,
            totalPages: docData.totalPages || 0,
            relevantPages: 0,
            extractedFields: {},
            confidence: 0,
            requiresReview: false,
            notes: docData.notes || '',
            ...docData
        };

        documents.push(newDocument);
        saveCollection(DB_KEYS.DOCUMENTS, documents);
        return newDocument;
    },

    // Update document
    update(id, updates) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        const index = documents.findIndex(d => d.id === parseInt(id));

        if (index === -1) return null;

        documents[index] = {
            ...documents[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        saveCollection(DB_KEYS.DOCUMENTS, documents);
        return documents[index];
    },

    // Delete document
    delete(id) {
        const documents = getCollection(DB_KEYS.DOCUMENTS);
        const filtered = documents.filter(d => d.id !== parseInt(id));
        saveCollection(DB_KEYS.DOCUMENTS, filtered);

        // Also delete related pages and extractions
        documentPagesDB.deleteByDocumentId(id);
        extractionResultsDB.deleteByDocumentId(id);
        return true;
    }
};

const documentPagesDB = {
    // Get all pages
    getAll() {
        return getCollection(DB_KEYS.DOCUMENT_PAGES);
    },

    // Get pages by document ID
    getByDocumentId(documentId) {
        const pages = getCollection(DB_KEYS.DOCUMENT_PAGES);
        return pages.filter(p => p.documentId === parseInt(documentId));
    },

    // Get page by ID
    getById(id) {
        const pages = getCollection(DB_KEYS.DOCUMENT_PAGES);
        return pages.find(p => p.id === parseInt(id));
    },

    // Create page
    create(pageData) {
        const pages = getCollection(DB_KEYS.DOCUMENT_PAGES);
        const id = getNextId(DB_KEYS.DOCUMENT_PAGES);

        const newPage = {
            id,
            documentId: pageData.documentId,
            pageNumber: pageData.pageNumber || 1,
            imageData: pageData.imageData || null, // Base64 encoded image
            imageUrl: pageData.imageUrl || null,
            width: pageData.width || 0,
            height: pageData.height || 0,
            relevanceScore: pageData.relevanceScore || 0, // 0.0 - 1.0
            isRelevant: pageData.relevanceScore > 0.5,
            classifiedAs: pageData.classifiedAs || null, // 'pod', 'cmr', 'cover_page', 'irrelevant'
            processedAt: new Date().toISOString(),
            ...pageData
        };

        pages.push(newPage);
        saveCollection(DB_KEYS.DOCUMENT_PAGES, pages);
        return newPage;
    },

    // Update page
    update(id, updates) {
        const pages = getCollection(DB_KEYS.DOCUMENT_PAGES);
        const index = pages.findIndex(p => p.id === parseInt(id));

        if (index === -1) return null;

        pages[index] = {
            ...pages[index],
            ...updates
        };

        saveCollection(DB_KEYS.DOCUMENT_PAGES, pages);
        return pages[index];
    },

    // Delete pages by document ID
    deleteByDocumentId(documentId) {
        const pages = getCollection(DB_KEYS.DOCUMENT_PAGES);
        const filtered = pages.filter(p => p.documentId !== parseInt(documentId));
        saveCollection(DB_KEYS.DOCUMENT_PAGES, filtered);
        return true;
    }
};

const extractionResultsDB = {
    // Get all extraction results
    getAll() {
        return getCollection(DB_KEYS.EXTRACTION_RESULTS);
    },

    // Get extraction by document ID
    getByDocumentId(documentId) {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        return results.filter(r => r.documentId === parseInt(documentId));
    },

    // Get extraction by page ID
    getByPageId(pageId) {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        return results.find(r => r.pageId === parseInt(pageId));
    },

    // Get high-confidence extractions (>= 0.85)
    getHighConfidence() {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        return results.filter(r => r.overallConfidence >= 0.85);
    },

    // Get low-confidence extractions (< 0.85)
    getLowConfidence() {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        return results.filter(r => r.overallConfidence < 0.85);
    },

    // Create extraction result
    create(extractionData) {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        const id = getNextId(DB_KEYS.EXTRACTION_RESULTS);
        const now = new Date().toISOString();

        const newExtraction = {
            id,
            documentId: extractionData.documentId,
            pageId: extractionData.pageId,
            pageNumber: extractionData.pageNumber || 1,
            extractedFields: extractionData.extractedFields || {},
            fieldConfidences: extractionData.fieldConfidences || {},
            overallConfidence: extractionData.overallConfidence || 0,
            bookingNumber: extractionData.extractedFields?.bookingNumber || null,
            equipmentType: extractionData.extractedFields?.equipmentType || null,
            quantity: extractionData.extractedFields?.quantity || null,
            origin: extractionData.extractedFields?.origin || null,
            destination: extractionData.extractedFields?.destination || null,
            date: extractionData.extractedFields?.date || null,
            signature: extractionData.extractedFields?.signature || null,
            autoCreated: false, // Will be set to true if transaction auto-created
            requiresReview: extractionData.overallConfidence < 0.85,
            reviewedBy: null,
            reviewedAt: null,
            reviewStatus: 'pending', // pending, approved, rejected, corrected
            extractedAt: now,
            ...extractionData
        };

        results.push(newExtraction);
        saveCollection(DB_KEYS.EXTRACTION_RESULTS, results);
        return newExtraction;
    },

    // Update extraction
    update(id, updates) {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        const index = results.findIndex(r => r.id === parseInt(id));

        if (index === -1) return null;

        results[index] = {
            ...results[index],
            ...updates
        };

        saveCollection(DB_KEYS.EXTRACTION_RESULTS, results);
        return results[index];
    },

    // Delete extractions by document ID
    deleteByDocumentId(documentId) {
        const results = getCollection(DB_KEYS.EXTRACTION_RESULTS);
        const filtered = results.filter(r => r.documentId !== parseInt(documentId));
        saveCollection(DB_KEYS.EXTRACTION_RESULTS, filtered);
        return true;
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
            documents: getCollection(DB_KEYS.DOCUMENTS).length,
            documentPages: getCollection(DB_KEYS.DOCUMENT_PAGES).length,
            extractionResults: getCollection(DB_KEYS.EXTRACTION_RESULTS).length,
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
    documents: documentsDB,
    documentPages: documentPagesDB,
    extractionResults: extractionResultsDB,
    utils: dbUtils
};

console.log('✓ LocalStorage DB ready:', dbUtils.stats());
