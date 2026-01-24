/**
 * TEST DATA LOADER
 * Generates realistic test data and loads it into localStorage
 * Run once on app initialization to populate demo data
 */

// Sample data constants
const EQUIPMENT_TYPES = ['EUR', 'H1', 'CAGE', 'IBC', 'DOLLY'];
const QUALITY_GRADES = ['A', 'B', 'damaged'];
const STATUSES = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];

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
    { name: 'Dortmund', lat: 51.5136, lng: 7.4653 }
];

const CARRIERS = [
    'Regional Transport GmbH',
    'Deutsche Pallet Service',
    'EuroCargo Express',
    'LogistikMax AG',
    'TransEuro GmbH'
];

const COMPANIES = [
    { name: 'BMW AG', type: 'manufacturer' },
    { name: 'Mercedes-Benz Group', type: 'manufacturer' },
    { name: 'Volkswagen AG', type: 'manufacturer' },
    { name: 'Robert Bosch GmbH', type: 'manufacturer' },
    { name: 'Deutsche Post DHL', type: 'logistics' },
    { name: 'DB Schenker', type: 'logistics' },
    { name: 'REWE Group', type: 'retail' },
    { name: 'EDEKA', type: 'retail' },
    { name: 'Amazon Logistics DE', type: 'ecommerce' },
    { name: 'Continental AG', type: 'automotive' }
];

const STOP_TYPES = {
    SIMPLE: ['origin', 'destination'],
    WITH_HUB: ['origin', 'consolidation_hub', 'destination'],
    WITH_PSP: ['origin', 'consolidation_hub', 'psp_service_point', 'destination'],
    COMPLEX: ['origin', 'consolidation_hub', 'psp_service_point', 'handoff_point', 'destination']
};

// Helper functions
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
}

// Generate realistic booking with stops
function generateBooking(index) {
    const equipmentType = randomChoice(EQUIPMENT_TYPES);
    const quantity = randomInt(10, 100);
    const quality = randomChoice(QUALITY_GRADES);
    const status = randomChoice(STATUSES);

    const originCity = randomChoice(GERMAN_CITIES);
    let destinationCity = randomChoice(GERMAN_CITIES);
    while (destinationCity.name === originCity.name) {
        destinationCity = randomChoice(GERMAN_CITIES);
    }

    const originCompany = randomChoice(COMPANIES);
    const destinationCompany = randomChoice(COMPANIES);
    const carrier = randomChoice(CARRIERS);

    // Dates
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - randomInt(0, 30));
    const scheduledPickup = baseDate;
    const scheduledDelivery = addDays(baseDate, randomInt(1, 5));

    let actualPickup = null;
    let actualDelivery = null;
    if (status === 'in_transit' || status === 'delivered') {
        actualPickup = addHours(scheduledPickup, randomInt(-2, 2));
    }
    if (status === 'delivered') {
        actualDelivery = addHours(scheduledDelivery, randomInt(-3, 3));
    }

    // Progress
    let currentNode = 0;
    if (status === 'confirmed') currentNode = 1;
    if (status === 'in_transit') currentNode = 2;
    if (status === 'delivered') currentNode = 4;

    return {
        equipmentType,
        quantity,
        quality,
        origin: {
            name: `${originCity.name} Warehouse`,
            city: originCity.name,
            lat: originCity.lat,
            lng: originCity.lng,
            company: originCompany.name
        },
        destination: {
            name: `${destinationCity.name} Distribution Center`,
            city: destinationCity.name,
            lat: destinationCity.lat,
            lng: destinationCity.lng,
            company: destinationCompany.name
        },
        carrier: {
            name: carrier
        },
        scheduledPickup: scheduledPickup.toISOString(),
        scheduledDelivery: scheduledDelivery.toISOString(),
        actualPickup: actualPickup ? actualPickup.toISOString() : null,
        actualDelivery: actualDelivery ? actualDelivery.toISOString() : null,
        status,
        currentNode,
        totalNodes: 4,
        notes: Math.random() > 0.7 ? `Booking #${index + 1} - ${randomChoice(['Urgent delivery', 'Standard route', 'Quality inspection required', 'Return shipment'])}` : ''
    };
}

// Generate stops for a booking
function generateStops(booking) {
    // Choose stop template based on status
    let template = STOP_TYPES.SIMPLE;
    if (booking.status === 'in_transit' || booking.status === 'delivered') {
        template = randomChoice([STOP_TYPES.WITH_HUB, STOP_TYPES.WITH_PSP, STOP_TYPES.COMPLEX]);
    }

    const stops = [];
    const baseTime = new Date(booking.scheduledPickup);

    template.forEach((stopType, index) => {
        const isOrigin = stopType === 'origin';
        const isDestination = stopType === 'destination';
        const isCompleted = booking.status === 'delivered' ||
                           (booking.status === 'in_transit' && index < template.length - 1);

        let location, company;
        if (isOrigin) {
            location = booking.origin;
            company = { name: booking.origin.company };
        } else if (isDestination) {
            location = booking.destination;
            company = { name: booking.destination.company };
        } else {
            const city = randomChoice(GERMAN_CITIES);
            const stopCompany = randomChoice(COMPANIES);
            location = {
                name: `${city.name} ${stopType.replace('_', ' ').toUpperCase()}`,
                city: city.name,
                lat: city.lat,
                lng: city.lng
            };
            company = { name: stopCompany.name };
        }

        const scheduledArrival = addHours(baseTime, index * randomInt(4, 8));
        const scheduledDeparture = addHours(scheduledArrival, randomInt(1, 3));

        const actualArrival = isCompleted ? addHours(scheduledArrival, randomInt(-1, 1)) : null;
        const actualDeparture = isCompleted ? addHours(scheduledDeparture, randomInt(-1, 1)) : null;

        stops.push({
            stopSequence: index + 1,
            stopType,
            location,
            company,
            scheduledArrival: scheduledArrival.toISOString(),
            scheduledDeparture: scheduledDeparture.toISOString(),
            actualArrival: actualArrival ? actualArrival.toISOString() : null,
            actualDeparture: actualDeparture ? actualDeparture.toISOString() : null,
            status: isCompleted ? 'completed' : (index === 0 ? 'in_progress' : 'pending'),
            notes: ''
        });
    });

    return stops;
}

// Generate transactions for a stop
function generateTransactions(stop, booking, prevStop = null) {
    const transactions = [];
    const hasVariance = Math.random() < 0.15; // 15% chance of variance

    // IN transaction
    if (stop.stopType !== 'origin') {
        const expectedQty = booking.quantity;
        const actualQty = hasVariance ? expectedQty + randomInt(-5, -1) : expectedQty;
        const variance = actualQty - expectedQty;

        transactions.push({
            direction: 'in',
            quantity: actualQty,
            expectedQuantity: expectedQty,
            variance: variance,
            hasVariance: variance !== 0,
            equipmentType: booking.equipmentType,
            quality: booking.quality,
            fromCompany: prevStop ? prevStop.company : { name: 'Unknown' },
            toCompany: stop.company,
            performedBy: randomChoice(['Driver', 'Warehouse Staff', 'System']),
            timestamp: stop.actualArrival || stop.scheduledArrival,
            notes: variance !== 0 ? `Variance detected: ${variance} units` : ''
        });
    }

    // OUT transaction
    if (stop.stopType !== 'destination') {
        const outQty = transactions[0]?.quantity || booking.quantity;

        transactions.push({
            direction: 'out',
            quantity: outQty,
            expectedQuantity: outQty,
            variance: 0,
            hasVariance: false,
            equipmentType: booking.equipmentType,
            quality: booking.quality,
            fromCompany: stop.company,
            toCompany: { name: 'Next Stop' },
            performedBy: randomChoice(['Driver', 'Warehouse Staff', 'System']),
            timestamp: stop.actualDeparture || stop.scheduledDeparture,
            notes: ''
        });
    }

    return transactions;
}

// Generate PSP charge for PSP stops
function generatePSPCharge(stop) {
    if (stop.stopType !== 'psp_service_point') return null;

    return {
        chargeType: randomChoice(['handling', 'storage', 'exchange', 'repair']),
        amount: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        currency: 'EUR',
        pspName: stop.company.name,
        description: `PSP service at ${stop.location.name}`
    };
}

// Generate tasks for bookings with variances
function generateTasksForBooking(booking, stops) {
    const tasks = [];

    // Check for variance transactions
    stops.forEach(stop => {
        if (stop.transactions) {
            const hasVariance = stop.transactions.some(t => t.hasVariance);
            if (hasVariance) {
                tasks.push({
                    taskType: 'variance_review',
                    priority: 'high',
                    description: `Review variance at ${stop.location.name} for booking ${booking.bookingNumber}`,
                    status: 'pending',
                    assignedTo: null,
                    dueDate: addDays(new Date(), 2).toISOString()
                });
            }
        }
    });

    // Random quality inspection tasks
    if (Math.random() < 0.1) {
        tasks.push({
            taskType: 'quality_inspection',
            priority: 'medium',
            description: `Quality inspection needed for ${booking.bookingNumber}`,
            status: 'pending',
            assignedTo: null,
            dueDate: addDays(new Date(), 3).toISOString()
        });
    }

    return tasks;
}

// Main loader function
function loadTestData(numBookings = 50) {
    console.log(`🔄 Loading ${numBookings} test bookings...`);

    const startTime = Date.now();
    let totalStops = 0;
    let totalTransactions = 0;
    let totalTasks = 0;
    let totalPSPCharges = 0;

    // Load companies first
    COMPANIES.forEach(company => {
        window.localDB.companies.create(company);
    });

    // Load locations
    GERMAN_CITIES.forEach(city => {
        window.localDB.locations.create(city);
    });

    // Generate bookings
    for (let i = 0; i < numBookings; i++) {
        const bookingData = generateBooking(i);
        const booking = window.localDB.bookings.create(bookingData);

        // Generate stops
        const stopsData = generateStops(bookingData);
        const stops = [];

        stopsData.forEach((stopData, index) => {
            const stop = window.localDB.stops.create({
                ...stopData,
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber
            });
            stops.push(stop);
            totalStops++;

            // Generate transactions
            const prevStop = index > 0 ? stops[index - 1] : null;
            const transactions = generateTransactions(stopData, bookingData, prevStop ? stopsData[index - 1] : null);

            transactions.forEach(txData => {
                window.localDB.transactions.create({
                    ...txData,
                    stopId: stop.id,
                    stopNumber: stop.stopNumber,
                    bookingId: booking.id,
                    bookingNumber: booking.bookingNumber
                });
                totalTransactions++;
            });

            // Attach transactions to stop for task generation
            stop.transactions = transactions;

            // Generate PSP charge
            const pspCharge = generatePSPCharge(stopData);
            if (pspCharge) {
                window.localDB.pspCharges.create({
                    ...pspCharge,
                    stopId: stop.id,
                    stopNumber: stop.stopNumber,
                    bookingId: booking.id
                });
                totalPSPCharges++;
            }
        });

        // Generate tasks
        const tasks = generateTasksForBooking(booking, stops);
        tasks.forEach(taskData => {
            window.localDB.tasks.create({
                ...taskData,
                bookingId: booking.id,
                bookingNumber: booking.bookingNumber
            });
            totalTasks++;
        });
    }

    const duration = Date.now() - startTime;

    console.log(`✓ Test data loaded in ${duration}ms:`);
    console.log(`  - ${numBookings} bookings`);
    console.log(`  - ${totalStops} stops`);
    console.log(`  - ${totalTransactions} transactions`);
    console.log(`  - ${totalPSPCharges} PSP charges`);
    console.log(`  - ${totalTasks} tasks`);

    return {
        bookings: numBookings,
        stops: totalStops,
        transactions: totalTransactions,
        pspCharges: totalPSPCharges,
        tasks: totalTasks
    };
}

// Auto-load on first run (if database is empty)
if (window.localDB) {
    const stats = window.localDB.utils.stats();
    if (stats.bookings === 0) {
        console.log('📦 Empty database detected, loading test data...');
        loadTestData(50);
    } else {
        console.log('✓ Database already has data:', stats);
    }
}

// Export loader function
window.loadTestData = loadTestData;
