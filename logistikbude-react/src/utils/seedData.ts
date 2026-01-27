import type {
  Company,
  EquipmentType,
  EquipmentBooking,
  Stop,
  StopType,
  BookingStatus,
} from '../types';
import {
  generateId,
  generateBookingNumber,
  generateStopNumber,
} from './generators';

export const seedCompanies: Company[] = [
  {
    id: 'comp-1',
    name: 'BMW AG',
    type: 'shipper',
    contactName: 'Hans Mueller',
    contactEmail: 'hans.mueller@bmw.de',
    settlementPeriod: 'monthly',
    isActive: true,
  },
  {
    id: 'comp-2',
    name: 'Daimler AG',
    type: 'shipper',
    contactName: 'Maria Schmidt',
    contactEmail: 'maria.schmidt@daimler.com',
    settlementPeriod: 'monthly',
    isActive: true,
  },
  {
    id: 'comp-3',
    name: 'Customer Hamburg GmbH',
    type: 'receiver',
    contactName: 'Peter Hansen',
    contactEmail: 'peter@hamburg-gmbh.de',
    settlementPeriod: 'weekly',
    isActive: true,
  },
  {
    id: 'comp-4',
    name: 'Customer Munich GmbH',
    type: 'receiver',
    contactName: 'Sophie Wagner',
    contactEmail: 'sophie@munich-gmbh.de',
    settlementPeriod: 'weekly',
    isActive: true,
  },
  {
    id: 'comp-5',
    name: 'Dachser SE',
    type: 'carrier',
    contactName: 'Klaus Fischer',
    contactEmail: 'klaus.fischer@dachser.de',
    settlementPeriod: 'monthly',
    isActive: true,
  },
  {
    id: 'comp-6',
    name: 'DB Schenker',
    type: 'carrier',
    contactName: 'Andrea Becker',
    contactEmail: 'andrea.becker@dbschenker.com',
    settlementPeriod: 'monthly',
    isActive: true,
  },
  {
    id: 'comp-7',
    name: 'Regional Transport GmbH',
    type: 'carrier',
    contactName: 'Thomas Klein',
    contactEmail: 'thomas@regional-transport.de',
    settlementPeriod: 'weekly',
    isActive: true,
  },
  {
    id: 'comp-8',
    name: 'CHEP Deutschland',
    type: 'pooling_provider',
    contactName: 'Julia Hoffmann',
    contactEmail: 'julia.hoffmann@chep.com',
    settlementPeriod: 'monthly',
    isActive: true,
  },
  {
    id: 'comp-9',
    name: 'EPAL Pool',
    type: 'pooling_provider',
    contactName: 'Michael Schneider',
    contactEmail: 'michael@epal.de',
    settlementPeriod: 'monthly',
    isActive: true,
  },
];

export const seedEquipmentTypes: EquipmentType[] = [
  {
    id: 'eq-1',
    code: 'EUR',
    name: 'EUR Pallet',
    standardValueEur: 8.0,
    qualityGrades: ['A', 'B', 'C', 'damaged'],
    isPooled: true,
    poolProvider: 'EPAL',
  },
  {
    id: 'eq-2',
    code: 'H1',
    name: 'H1 Plastic Pallet',
    standardValueEur: 12.0,
    qualityGrades: ['A', 'B', 'damaged'],
    isPooled: true,
    poolProvider: 'CHEP',
  },
  {
    id: 'eq-3',
    code: 'CAGE',
    name: 'Grid Box / Gitterbox',
    standardValueEur: 45.0,
    qualityGrades: ['A', 'B', 'C', 'damaged'],
    isPooled: false,
  },
  {
    id: 'eq-4',
    code: 'IBC',
    name: 'IBC Container',
    standardValueEur: 120.0,
    qualityGrades: ['A', 'B', 'damaged'],
    isPooled: false,
  },
  {
    id: 'eq-5',
    code: 'DOLLY',
    name: 'Dolly / Roll Container',
    standardValueEur: 85.0,
    qualityGrades: ['A', 'B', 'C', 'damaged'],
    isPooled: false,
  },
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

interface StopTemplate {
  types: StopType[];
  requiresVariance: boolean;
}

const stopTemplates: StopTemplate[] = [
  { types: ['origin', 'destination'], requiresVariance: false },
  { types: ['origin', 'hub', 'destination'], requiresVariance: false },
  {
    types: ['origin', 'hub', 'psp', 'destination'],
    requiresVariance: false,
  },
  {
    types: ['origin', 'hub', 'handoff', 'destination'],
    requiresVariance: true,
  },
];

export function generateSeedBookings(count: number = 25): {
  bookings: EquipmentBooking[];
  stops: Stop[];
} {
  const bookings: EquipmentBooking[] = [];
  const allStops: Stop[] = [];

  const statuses: BookingStatus[] = [
    'draft',
    'confirmed',
    'active',
    'completed',
    'reconciled',
    'disputed',
    'settled',
  ];

  for (let i = 0; i < count; i++) {
    const equipment = randomChoice(seedEquipmentTypes);
    const fromCompany = seedCompanies.find((c) => c.type === 'shipper')!;
    const toCompany = seedCompanies.find((c) => c.type === 'receiver')!;
    const carrier = seedCompanies.find((c) => c.type === 'carrier')!;

    const quantity = randomInt(10, 100);
    const bookingId = generateId();
    const bookingNumber = generateBookingNumber();
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - randomInt(0, 30));

    const status = randomChoice(statuses);
    const expectedDate = addDays(baseDate, randomInt(1, 5));
    const actualDate =
      status === 'completed' ||
      status === 'reconciled' ||
      status === 'settled'
        ? addDays(expectedDate, randomInt(-1, 1))
        : undefined;

    const booking: EquipmentBooking = {
      id: bookingId,
      bookingNumber,
      status,
      equipmentTypeId: equipment.id,
      quantity,
      expectedQualityGrade: 'A',
      fromCompanyId: fromCompany.id,
      toCompanyId: toCompany.id,
      carrierCompanyId: carrier.id,
      expectedDate: expectedDate.toISOString(),
      actualDate: actualDate?.toISOString(),
      bookingValueEur: quantity * equipment.standardValueEur,
      createdAt: baseDate.toISOString(),
      confirmedAt:
        status !== 'draft' ? addDays(baseDate, 1).toISOString() : undefined,
      notes:
        Math.random() > 0.7
          ? `Booking #${i + 1} - ${randomChoice(['Urgent delivery', 'Standard route', 'Return shipment'])}`
          : '',
    };

    bookings.push(booking);

    // Generate stops
    const template =
      i % 4 === 0
        ? stopTemplates[0]
        : i % 4 === 1
          ? stopTemplates[1]
          : randomChoice(stopTemplates.slice(2));

    const stops = template.types.map((type, index) => {
      const stopId = generateId();
      const stop: Stop = {
        id: stopId,
        bookingId,
        stopNumber: generateStopNumber(index),
        sequence: index + 1,
        type,
        locationName:
          type === 'origin'
            ? `${fromCompany.name} Warehouse`
            : type === 'destination'
              ? `${toCompany.name} Distribution Center`
              : type === 'hub'
                ? `${carrier.name} Hub`
                : type === 'psp'
                  ? 'PSP Exchange Point'
                  : 'Transfer Point',
        companyId:
          type === 'origin'
            ? fromCompany.id
            : type === 'destination'
              ? toCompany.id
              : carrier.id,
        scheduledArrival: addDays(baseDate, index).toISOString(),
        scheduledDeparture: addDays(baseDate, index).toISOString(),
        expectedOutQuantity: type !== 'destination' ? quantity : undefined,
        expectedInQuantity: type !== 'origin' ? quantity : undefined,
        expectedQualityGrade: 'A',
        status:
          status === 'completed' ||
          status === 'reconciled' ||
          status === 'settled'
            ? 'confirmed'
            : index === 0
              ? 'in_progress'
              : 'pending',
        requiresSignature: type === 'destination',
        requiresPhoto: type === 'psp',
        signatureCaptured: false,
        photosUploaded: 0,
      };

      // Add variance on last stop for some bookings
      if (
        template.requiresVariance &&
        type === 'destination' &&
        Math.random() > 0.7
      ) {
        stop.actualInQuantity = quantity - randomInt(1, 5);
        stop.status = 'variance_detected';
      } else if (stop.status === 'confirmed') {
        stop.actualInQuantity = stop.expectedInQuantity;
        stop.actualOutQuantity = stop.expectedOutQuantity;
        stop.actualQualityGrade = 'A';
        stop.confirmedAt = addDays(baseDate, index).toISOString();
      }

      return stop;
    });

    allStops.push(...stops);
  }

  return { bookings, stops: allStops };
}
