/**
 * TEST DATA GENERATOR
 * Generates rich, realistic test data for Logistikbude 3.0
 *
 * Generates:
 * - 100 bookings with variety
 * - 500+ events (all types)
 * - 50+ tasks
 * - 20 companies
 * - Realistic reconciliation data
 */

const EQUIPMENT_TYPES = [
    { id: 1, name: 'EUR', weight: 60 },  // 60% of bookings
    { id: 2, name: 'H1', weight: 15 },
    { id: 3, name: 'CAGE', weight: 10 },
    { id: 4, name: 'IBC', weight: 10 },
    { id: 5, name: 'DOLLY', weight: 5 }
];

const GERMAN_CITIES = [
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { name: 'Munich', lat: 48.1351, lng: 11.5820 },
    { name: 'Cologne', lat: 50.9375, lng: 6.9603 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    { name: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
    { name: 'Dresden', lat: 51.0504, lng: 13.7373 },
    { name: 'Leipzig', lat: 51.3397, lng: 12.3731 },
    { name: 'Nuremberg', lat: 49.4521, lng: 11.0767 },
    { name: 'Dortmund', lat: 51.5136, lng: 7.4653 },
    { name: 'Essen', lat: 51.4556, lng: 7.0116 },
    { name: 'Bremen', lat: 53.0793, lng: 8.8017 },
    { name: 'Hannover', lat: 52.3759, lng: 9.7320 },
    { name: 'Duisburg', lat: 51.4344, lng: 6.7623 },
    { name: 'Bochum', lat: 51.4818, lng: 7.2162 }
];

const CARRIERS = [
    'Regional Transport GmbH',
    'Deutsche Pallet Service',
    'EuroCargo Express',
    'LogistikMax AG',
    'TransEuro GmbH',
    'PalletExpress Deutschland',
    'CargoLink Services',
    'FastFreight Logistics'
];

const COMPANIES = [
    { name: 'BMW AG', type: 'manufacturer' },
    { name: 'Mercedes-Benz Group', type: 'manufacturer' },
    { name: 'Volkswagen AG', type: 'manufacturer' },
    { name: 'Robert Bosch GmbH', type: 'manufacturer' },
    { name: 'BASF SE', type: 'manufacturer' },
    { name: 'Siemens AG', type: 'manufacturer' },
    { name: 'Deutsche Post DHL', type: 'logistics' },
    { name: 'Dachser SE', type: 'logistics' },
    { name: 'DB Schenker', type: 'logistics' },
    { name: 'Kuehne + Nagel', type: 'logistics' },
    { name: 'REWE Group', type: 'retail' },
    { name: 'EDEKA', type: 'retail' },
    { name: 'Metro AG', type: 'retail' },
    { name: 'Aldi Süd', type: 'retail' },
    { name: 'Lidl Stiftung', type: 'retail' },
    { name: 'Amazon Logistics DE', type: 'ecommerce' },
    { name: 'Otto Group', type: 'ecommerce' },
    { name: 'Zalando SE', type: 'ecommerce' },
    { name: 'Continental AG', type: 'automotive' },
    { name: 'ZF Friedrichshafen', type: 'automotive' }
];

const QUALITY_GRADES = ['A', 'B', 'damaged'];
const STATUSES = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];

const STOP_TYPES = [
    'origin',
    'consolidation_hub',
    'psp_service_point',
    'handoff_point',
    'quality_checkpoint',
    'destination'
];

const STOP_TEMPLATES = {
    simple_direct: ['origin', 'destination'],
    with_hub: ['origin', 'consolidation_hub', 'destination'],
    with_psp: ['origin', 'consolidation_hub', 'psp_service_point', 'destination'],
    with_handoff: ['origin', 'consolidation_hub', 'handoff_point', 'destination'],
    complex: ['origin', 'consolidation_hub', 'psp_service_point', 'handoff_point', 'destination']
};

// Weighted random selection
function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= (item.weight || 1);
        if (random <= 0) return item;
    }
    return items[items.length - 1];
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomDate(daysAgo = 30) {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * daysAgo);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);

    return new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000) + (randomHours * 60 * 60 * 1000) + (randomMinutes * 60 * 1000));
}

function generateBookingNumber(index) {
    const year = new Date().getFullYear();
    return `BK-${year}-${String(index).padStart(4, '0')}`;
}

function generateStopNumber(bookingIndex, stopIndex) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    return `STP-${year}${month}${day}-${String(bookingIndex * 10 + stopIndex).padStart(4, '0')}`;
}

function generateTransactionNumber(bookingIndex, stopIndex, txIndex) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    return `STX-${year}${month}${day}-${String(bookingIndex * 100 + stopIndex * 10 + txIndex).padStart(5, '0')}`;
}

// Generate a single booking with 3-5 stops
function generateBooking(index) {
    const equipmentType = weightedRandom(EQUIPMENT_TYPES);

    // Realistic quantity based on equipment type
    const quantityRanges = {
        'EUR': [15, 20, 25, 30, 33, 40],      // EUR pallets, 33 = FTL
        'H1': [10, 15, 18, 20],                // H1 pallets, 18 = FTL
        'CAGE': [5, 8, 10, 12, 15],            // Roll cages
        'IBC': [10, 15, 20, 25],               // IBCs, 20 = FTL
        'DOLLY': [20, 25, 30, 35]              // Dollies
    };

    const quantity = randomChoice(quantityRanges[equipmentType.name]);

    // Quality distribution: 70% A, 20% B, 10% damaged
    const quality = weightedRandom([
        { grade: 'A', weight: 70 },
        { grade: 'B', weight: 20 },
        { grade: 'damaged', weight: 10 }
    ]).grade;

    // Select origin and destination cities
    const origin = randomChoice(GERMAN_CITIES);
    const destination = randomChoice(GERMAN_CITIES.filter(c => c.name !== origin.name));

    // Select companies
    const shipper = randomChoice(COMPANIES.filter(c => c.type === 'manufacturer' || c.type === 'retail'));
    const consignee = randomChoice(COMPANIES.filter(c => c.name !== shipper.name));
    const carrier = randomChoice(CARRIERS);

    // Generate dates
    const scheduledPickup = randomDate(30);
    const scheduledDelivery = new Date(scheduledPickup.getTime() + (Math.random() * 24 + 4) * 60 * 60 * 1000);

    // Status distribution: 20% pending, 15% confirmed, 25% in_transit, 30% delivered, 10% cancelled
    const status = weightedRandom([
        { status: 'pending', weight: 20 },
        { status: 'confirmed', weight: 15 },
        { status: 'in_transit', weight: 25 },
        { status: 'delivered', weight: 30 },
        { status: 'cancelled', weight: 10 }
    ]).status;

    // Select stop template based on distance and complexity
    const distance = Math.sqrt(Math.pow(destination.lat - origin.lat, 2) + Math.pow(destination.lng - origin.lng, 2)) * 111; // rough km
    let stopTemplate;

    if (distance < 100) {
        stopTemplate = Math.random() > 0.5 ? STOP_TEMPLATES.simple_direct : STOP_TEMPLATES.with_hub;
    } else if (distance < 300) {
        stopTemplate = randomChoice([STOP_TEMPLATES.with_hub, STOP_TEMPLATES.with_psp, STOP_TEMPLATES.with_handoff]);
    } else {
        stopTemplate = randomChoice([STOP_TEMPLATES.with_psp, STOP_TEMPLATES.with_handoff, STOP_TEMPLATES.complex]);
    }

    // Generate stops
    const stops = generateStops(index, stopTemplate, origin, destination, quantity, equipmentType.name, quality, scheduledPickup, scheduledDelivery, carrier);

    // Determine if variance should occur (30% of bookings)
    const hasVariance = Math.random() < 0.3 && status === 'delivered';

    return {
        id: index + 1,
        bookingNumber: generateBookingNumber(index + 1),
        equipmentType: equipmentType.name,
        quantity,
        quality,
        originName: `${shipper.name} - ${origin.name} Warehouse`,
        originCity: origin.name,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationName: `${consignee.name} - ${destination.name} Facility`,
        destinationCity: destination.name,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        shipperName: shipper.name,
        consigneeName: consignee.name,
        carrierName: carrier,
        scheduledPickup: scheduledPickup.toISOString(),
        scheduledDelivery: scheduledDelivery.toISOString(),
        status,
        stops,
        hasVariance,
        distance: Math.round(distance)
    };
}

// Generate stops for a booking
function generateStops(bookingIndex, stopTemplate, origin, destination, quantity, equipmentType, quality, scheduledPickup, scheduledDelivery, carrier) {
    const stops = [];
    const totalStops = stopTemplate.length;
    const timePerStop = (scheduledDelivery.getTime() - scheduledPickup.getTime()) / totalStops;

    let currentQuantity = quantity;
    let currentQuality = quality;

    for (let i = 0; i < totalStops; i++) {
        const stopType = stopTemplate[i];
        const stopSequence = i + 1;

        let locationName, locationCity, locationLat, locationLng, company, stopNature;

        if (stopType === 'origin') {
            locationName = `Origin Warehouse - ${origin.name}`;
            locationCity = origin.name;
            locationLat = origin.lat;
            locationLng = origin.lng;
            company = randomChoice(COMPANIES.filter(c => c.type === 'manufacturer' || c.type === 'retail')).name;
            stopNature = 'Primary shipper handoff';
        } else if (stopType === 'destination') {
            locationName = `Destination Facility - ${destination.name}`;
            locationCity = destination.name;
            locationLat = destination.lat;
            locationLng = destination.lng;
            company = randomChoice(COMPANIES.filter(c => c.type === 'retail' || c.type === 'ecommerce')).name;
            stopNature = 'Final delivery';
        } else if (stopType === 'consolidation_hub') {
            const hubCity = randomChoice(GERMAN_CITIES.filter(c => c.name !== origin.name && c.name !== destination.name));
            locationName = `${carrier} Depot - ${hubCity.name}`;
            locationCity = hubCity.name;
            locationLat = hubCity.lat + (Math.random() - 0.5) * 0.1;
            locationLng = hubCity.lng + (Math.random() - 0.5) * 0.1;
            company = carrier;
            stopNature = 'Quality inspection checkpoint';
        } else if (stopType === 'psp_service_point') {
            const pspCity = randomChoice(GERMAN_CITIES);
            locationName = `PalletPool Service Point - ${pspCity.name}`;
            locationCity = pspCity.name;
            locationLat = pspCity.lat + (Math.random() - 0.5) * 0.1;
            locationLng = pspCity.lng + (Math.random() - 0.5) * 0.1;
            company = 'PalletPool GmbH';
            stopNature = 'PSP pallet exchange';
        } else if (stopType === 'handoff_point') {
            const handoffCity = randomChoice(GERMAN_CITIES);
            locationName = `Handoff Point - Highway A${Math.floor(Math.random() * 20) + 1}`;
            locationCity = handoffCity.name;
            locationLat = handoffCity.lat + (Math.random() - 0.5) * 0.2;
            locationLng = handoffCity.lng + (Math.random() - 0.5) * 0.2;
            company = randomChoice(CARRIERS);
            stopNature = 'Subcontractor custody transfer';
        } else {
            const checkpointCity = randomChoice(GERMAN_CITIES);
            locationName = `Quality Checkpoint - ${checkpointCity.name}`;
            locationCity = checkpointCity.name;
            locationLat = checkpointCity.lat;
            locationLng = checkpointCity.lng;
            company = carrier;
            stopNature = 'Equipment quality verification';
        }

        const scheduledArrival = i > 0 ? new Date(scheduledPickup.getTime() + timePerStop * i) : null;
        const scheduledDeparture = i < totalStops - 1 ? new Date(scheduledPickup.getTime() + timePerStop * (i + 1)) : null;

        // Generate transactions for this stop
        const transactions = generateStopTransactions(
            bookingIndex,
            stopSequence,
            stopType,
            currentQuantity,
            currentQuality,
            equipmentType
        );

        // Handle PSP exchange (quality downgrade)
        if (stopType === 'psp_service_point' && currentQuality === 'A' && Math.random() < 0.4) {
            const exchangeQty = Math.min(5, Math.floor(currentQuantity * 0.2));
            currentQuality = 'mixed'; // Now carrying both A and B

            // Add PSP charge
            transactions.push({
                type: 'psp_charge',
                chargeType: 'exchange_fee',
                quantity: exchangeQty,
                baseCost: 85.00,
                perUnitCost: 0.50,
                totalCost: 85.00 + (exchangeQty * 0.50),
                voucherNumber: `V-2026-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
            });
        }

        stops.push({
            stopNumber: generateStopNumber(bookingIndex, stopSequence),
            stopSequence,
            stopType,
            stopNature,
            locationName,
            locationCity,
            locationLat,
            locationLng,
            company,
            scheduledArrival: scheduledArrival?.toISOString(),
            scheduledDeparture: scheduledDeparture?.toISOString(),
            status: 'pending',
            transactions
        });
    }

    return stops;
}

// Generate transactions for a stop
function generateStopTransactions(bookingIndex, stopSequence, stopType, quantity, quality, equipmentType) {
    const transactions = [];

    if (stopType === 'origin') {
        // Equipment OUT from origin
        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 1),
            direction: 'out',
            equipmentType,
            quantity,
            qualityGrade: quality,
            transactionNature: 'pickup',
            evidenceType: 'scan',
            evidenceConfidence: 0.98
        });
    } else if (stopType === 'destination') {
        // Equipment IN to destination (with potential variance)
        const hasVariance = Math.random() < 0.25; // 25% of deliveries have variance
        const actualQuantity = hasVariance
            ? quantity + Math.floor((Math.random() - 0.6) * 5) // More likely to be short
            : quantity;

        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 1),
            direction: 'in',
            equipmentType,
            quantity: actualQuantity,
            expectedQuantity: quantity,
            variance: actualQuantity - quantity,
            hasVariance,
            qualityGrade: quality,
            transactionNature: 'delivery',
            evidenceType: 'document',
            evidenceConfidence: 0.95,
            documentPageNumber: 3
        });
    } else if (stopType === 'consolidation_hub') {
        // Equipment IN and OUT (quality check, no quantity change usually)
        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 1),
            direction: 'in',
            equipmentType,
            quantity,
            qualityGrade: quality,
            transactionNature: 'inspection',
            evidenceType: 'scan',
            evidenceConfidence: 0.97
        });

        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 2),
            direction: 'out',
            equipmentType,
            quantity,
            qualityGrade: quality,
            transactionNature: 'inspection',
            evidenceType: 'scan',
            evidenceConfidence: 0.97
        });
    } else if (stopType === 'psp_service_point') {
        // PSP exchange transactions (quality change)
        const exchangeQty = Math.min(5, Math.floor(quantity * 0.2));

        // Grade A IN to PSP
        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 1),
            direction: 'in',
            equipmentType,
            quantity: exchangeQty,
            qualityGrade: 'A',
            transactionNature: 'exchange',
            evidenceType: 'document',
            evidenceConfidence: 1.00
        });

        // Grade B OUT from PSP
        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 2),
            direction: 'out',
            equipmentType,
            quantity: exchangeQty,
            qualityGrade: 'B',
            transactionNature: 'exchange',
            evidenceType: 'document',
            evidenceConfidence: 1.00
        });
    } else if (stopType === 'handoff_point') {
        // Custody transfer (IN and OUT with different parties)
        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 1),
            direction: 'in',
            equipmentType,
            quantity,
            qualityGrade: quality,
            transactionNature: 'handoff',
            evidenceType: 'photo',
            evidenceConfidence: 0.92
        });

        transactions.push({
            transactionNumber: generateTransactionNumber(bookingIndex, stopSequence, 2),
            direction: 'out',
            equipmentType,
            quantity,
            qualityGrade: quality,
            transactionNature: 'handoff',
            evidenceType: 'signature',
            evidenceConfidence: 1.00
        });
    }

    return transactions;
}

// Generate events for a booking
function generateEvents(booking) {
    const events = [];
    let eventId = 1;

    // BookingCreated event
    events.push({
        id: eventId++,
        timestamp: new Date(new Date(booking.scheduledPickup).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        eventType: 'BookingCreated',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        location: booking.originCity,
        actor: 'System',
        source: 'web_ui',
        description: `Booking ${booking.bookingNumber} created for ${booking.quantity} ${booking.equipmentType} pallets`,
        confidence: 1.00
    });

    // Generate events for each stop
    booking.stops.forEach((stop, stopIndex) => {
        // Stop arrival event
        if (stop.scheduledArrival) {
            events.push({
                id: eventId++,
                timestamp: stop.scheduledArrival,
                eventType: 'LocationEvent',
                eventSubtype: 'arrival',
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                stopId: stopIndex + 1,
                location: stop.locationCity,
                locationName: stop.locationName,
                locationLat: stop.locationLat,
                locationLng: stop.locationLng,
                actor: stop.company,
                source: 'gps',
                description: `Arrived at ${stop.locationName}`,
                confidence: 0.95
            });
        }

        // Transaction events
        stop.transactions.forEach((tx, txIndex) => {
            if (tx.direction) {
                events.push({
                    id: eventId++,
                    timestamp: new Date(new Date(stop.scheduledArrival || booking.scheduledPickup).getTime() + (txIndex + 1) * 15 * 60 * 1000).toISOString(),
                    eventType: 'ScanEvent',
                    eventSubtype: tx.transactionNature === 'pickup' ? 'pickup_scan' :
                                 tx.transactionNature === 'delivery' ? 'delivery_scan' :
                                 'inventory_scan',
                    bookingId: booking.id,
                    bookingNumber: booking.bookingNumber,
                    stopId: stopIndex + 1,
                    equipmentType: tx.equipmentType,
                    quantity: tx.quantity,
                    location: stop.locationCity,
                    locationName: stop.locationName,
                    actor: stop.company,
                    source: 'handheld_scanner',
                    description: `${tx.direction.toUpperCase()}: ${tx.quantity} ${tx.equipmentType} ${tx.qualityGrade}`,
                    confidence: tx.evidenceConfidence || 0.95
                });
            }
        });

        // Stop departure event
        if (stop.scheduledDeparture) {
            events.push({
                id: eventId++,
                timestamp: stop.scheduledDeparture,
                eventType: 'LocationEvent',
                eventSubtype: 'departure',
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                stopId: stopIndex + 1,
                location: stop.locationCity,
                locationName: stop.locationName,
                actor: stop.company,
                source: 'gps',
                description: `Departed from ${stop.locationName}`,
                confidence: 0.95
            });
        }
    });

    // Status change events
    if (booking.status === 'confirmed') {
        events.push({
            id: eventId++,
            timestamp: new Date(new Date(booking.scheduledPickup).getTime() - 12 * 60 * 60 * 1000).toISOString(),
            eventType: 'StatusEvent',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            location: booking.originCity,
            actor: booking.carrierName,
            source: 'carrier_api',
            description: `Booking confirmed by ${booking.carrierName}`,
            confidence: 1.00
        });
    }

    if (booking.status === 'delivered') {
        events.push({
            id: eventId++,
            timestamp: booking.scheduledDelivery,
            eventType: 'DocumentEvent',
            eventSubtype: 'pod_upload',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            location: booking.destinationCity,
            documentUrl: `https://storage.logistikbude.com/pods/${booking.bookingNumber}-pod.pdf`,
            aiExtracted: true,
            actor: booking.consigneeName,
            source: 'driver_app',
            description: `POD uploaded for ${booking.bookingNumber}`,
            confidence: 0.89
        });

        // Reconciliation event if variance
        if (booking.hasVariance) {
            const finalStop = booking.stops[booking.stops.length - 1];
            const deliveryTx = finalStop.transactions.find(tx => tx.direction === 'in');

            events.push({
                id: eventId++,
                timestamp: new Date(new Date(booking.scheduledDelivery).getTime() + 30 * 60 * 1000).toISOString(),
                eventType: 'ReconciliationEvent',
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                location: booking.destinationCity,
                actor: 'System',
                source: 'reconciliation_engine',
                description: `Variance detected: Expected ${deliveryTx.expectedQuantity}, Actual ${deliveryTx.quantity}, Variance ${deliveryTx.variance}`,
                confidence: 1.00
            });
        }
    }

    return events;
}

// Generate tasks
function generateTasks(bookings) {
    const tasks = [];
    let taskId = 1;

    const taskTypes = [
        { type: 'pickup_confirm', title: 'Confirm Pickup', weight: 30 },
        { type: 'delivery_confirm', title: 'Confirm Delivery', weight: 30 },
        { type: 'scan_pallets', title: 'Scan Equipment', weight: 20 },
        { type: 'pod_upload', title: 'Upload POD', weight: 10 },
        { type: 'quality_check', title: 'Quality Inspection', weight: 10 }
    ];

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['pending', 'in_progress', 'completed'];

    // Generate 50+ tasks from bookings
    const taskBookings = bookings.slice(0, 30); // Use first 30 bookings for tasks

    taskBookings.forEach(booking => {
        // 1-2 tasks per booking
        const numTasks = Math.random() > 0.5 ? 2 : 1;

        for (let i = 0; i < numTasks; i++) {
            const taskType = weightedRandom(taskTypes);
            const priority = randomChoice(priorities);
            const status = weightedRandom([
                { status: 'pending', weight: 50 },
                { status: 'in_progress', weight: 20 },
                { status: 'completed', weight: 30 }
            ]).status;

            const dueBy = new Date(new Date(booking.scheduledPickup).getTime() + Math.random() * 48 * 60 * 60 * 1000);

            tasks.push({
                id: taskId++,
                taskType: taskType.type,
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber,
                title: `${taskType.title} - ${booking.bookingNumber}`,
                description: `${taskType.title} for ${booking.quantity} ${booking.equipmentType} pallets from ${booking.originCity} to ${booking.destinationCity}`,
                dueBy: dueBy.toISOString(),
                assignedTo: randomChoice(['Hans Müller', 'Sarah Schmidt', 'Michael Weber', 'Anna Fischer', 'Thomas Klein']),
                status,
                priority
            });
        }
    });

    return tasks;
}

// Main generation function
function generateAllTestData() {
    console.log('🚀 Generating test data...\n');

    // Generate 100 bookings with 3-5 stops each
    console.log('📦 Generating 100 bookings with multi-stop routes...');
    const bookings = [];
    for (let i = 0; i < 100; i++) {
        bookings.push(generateBooking(i));
    }
    console.log(`✅ Generated ${bookings.length} bookings with ${bookings.reduce((sum, b) => sum + b.stops.length, 0)} total stops`);

    // Generate events
    console.log('\n📋 Generating events...');
    const allEvents = [];
    bookings.forEach(booking => {
        const events = generateEvents(booking);
        allEvents.push(...events);
    });
    console.log(`✅ Generated ${allEvents.length} events`);

    // Generate tasks
    console.log('\n✅ Generating tasks...');
    const tasks = generateTasks(bookings);
    console.log(`✅ Generated ${tasks.length} tasks`);

    // Summary statistics
    console.log('\n📊 SUMMARY STATISTICS:');
    console.log('─────────────────────────────────────');
    console.log(`Total Bookings: ${bookings.length}`);
    console.log(`Total Stops: ${bookings.reduce((sum, b) => sum + b.stops.length, 0)}`);
    console.log(`Average Stops per Booking: ${(bookings.reduce((sum, b) => sum + b.stops.length, 0) / bookings.length).toFixed(1)}`);
    console.log(`Total Transactions: ${bookings.reduce((sum, b) => sum + b.stops.reduce((s, stop) => s + stop.transactions.filter(tx => tx.direction).length, 0), 0)}`);
    console.log(`Total Events: ${allEvents.length}`);
    console.log(`Total Tasks: ${tasks.length}`);
    console.log(`\nBookings with Variance: ${bookings.filter(b => b.hasVariance).length} (${(bookings.filter(b => b.hasVariance).length / bookings.length * 100).toFixed(1)}%)`);
    console.log(`\nEquipment Type Distribution:`);
    EQUIPMENT_TYPES.forEach(et => {
        const count = bookings.filter(b => b.equipmentType === et.name).length;
        console.log(`  - ${et.name}: ${count} (${(count / bookings.length * 100).toFixed(1)}%)`);
    });
    console.log(`\nStatus Distribution:`);
    STATUSES.forEach(status => {
        const count = bookings.filter(b => b.status === status).length;
        console.log(`  - ${status}: ${count} (${(count / bookings.length * 100).toFixed(1)}%)`);
    });

    return {
        bookings,
        stops: bookings.flatMap(b => b.stops),
        transactions: bookings.flatMap(b => b.stops.flatMap(s => s.transactions.filter(tx => tx.direction))),
        events: allEvents,
        tasks,
        companies: COMPANIES
    };
}

// Run if executed directly
if (require.main === module) {
    const data = generateAllTestData();

    // Save to JSON files
    const fs = require('fs');
    const path = require('path');

    const outputDir = path.join(__dirname, '../test-data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'bookings.json'), JSON.stringify(data.bookings, null, 2));
    fs.writeFileSync(path.join(outputDir, 'stops.json'), JSON.stringify(data.stops, null, 2));
    fs.writeFileSync(path.join(outputDir, 'transactions.json'), JSON.stringify(data.transactions, null, 2));
    fs.writeFileSync(path.join(outputDir, 'events.json'), JSON.stringify(data.events, null, 2));
    fs.writeFileSync(path.join(outputDir, 'tasks.json'), JSON.stringify(data.tasks, null, 2));

    console.log(`\n💾 Test data saved to ${outputDir}/`);
    console.log('\n✨ Done! Ready to import to Google Sheets.');
}

module.exports = { generateAllTestData };
