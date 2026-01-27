import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Company,
  EquipmentType,
  EquipmentAccount,
  EquipmentBooking,
  Stop,
  Transaction,
  Reconciliation,
  Dispute,
  Document,
  AutomationRule,
  BookingWithStops,
  BalanceSummary,
} from '../types';
import {
  seedCompanies,
  seedEquipmentTypes,
  generateSeedBookings,
} from '../utils/seedData';
import {
  generateId,
  generateTransactionNumber,
  generateReconciliationNumber,
  generateDisputeNumber,
} from '../utils/generators';

interface LogistikbudeState {
  // Data
  companies: Company[];
  equipmentTypes: EquipmentType[];
  accounts: EquipmentAccount[];
  bookings: EquipmentBooking[];
  stops: Stop[];
  transactions: Transaction[];
  reconciliations: Reconciliation[];
  disputes: Dispute[];
  documents: Document[];
  rules: AutomationRule[];

  // Actions
  addBooking: (
    booking: Omit<EquipmentBooking, 'id' | 'bookingNumber' | 'createdAt'>,
    stops: Omit<Stop, 'id' | 'bookingId' | 'stopNumber'>[]
  ) => void;
  confirmStop: (
    stopId: string,
    actuals: {
      actualInQuantity?: number;
      actualOutQuantity?: number;
      actualQualityGrade?: string;
    }
  ) => void;
  resolveReconciliation: (
    id: string,
    strategy: string,
    notes?: string
  ) => void;
  initiateDispute: (reconciliationId: string, reason: string) => void;

  // Computed
  getBookingWithStops: (bookingId: string) => BookingWithStops | undefined;
  getCompanyBalance: (companyId: string) => BalanceSummary;
  getPendingActions: () => Stop[];
  getOpenVariances: () => Reconciliation[];

  // Persistence
  loadFromStorage: () => void;
  initializeSeedData: () => void;
}

export const useLogistikbudeStore = create<LogistikbudeState>()(
  persist(
    (set, get) => ({
      // Initial state
      companies: [],
      equipmentTypes: [],
      accounts: [],
      bookings: [],
      stops: [],
      transactions: [],
      reconciliations: [],
      disputes: [],
      documents: [],
      rules: [],

      // Actions
      addBooking: (bookingData, stopsData) => {
        const id = generateId();
        const bookingNumber = `EB-${Date.now()}`;
        const createdAt = new Date().toISOString();

        const newBooking: EquipmentBooking = {
          ...bookingData,
          id,
          bookingNumber,
          createdAt,
        };

        const newStops: Stop[] = stopsData.map((stopData, index) => ({
          ...stopData,
          id: generateId(),
          bookingId: id,
          stopNumber: `STP-${String(index + 1).padStart(3, '0')}`,
        }));

        set((state) => ({
          bookings: [...state.bookings, newBooking],
          stops: [...state.stops, ...newStops],
        }));
      },

      confirmStop: (stopId, actuals) => {
        set((state) => {
          const stopIndex = state.stops.findIndex((s) => s.id === stopId);
          if (stopIndex === -1) return state;

          const stop = state.stops[stopIndex];
          const updatedStop: Stop = {
            ...stop,
            ...actuals,
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
          };

          // Check for variance
          const hasVariance =
            (actuals.actualInQuantity &&
              actuals.actualInQuantity !== stop.expectedInQuantity) ||
            (actuals.actualOutQuantity &&
              actuals.actualOutQuantity !== stop.expectedOutQuantity);

          if (hasVariance) {
            updatedStop.status = 'variance_detected';
          }

          const newStops = [...state.stops];
          newStops[stopIndex] = updatedStop;

          // Create reconciliation if variance
          let newReconciliations = state.reconciliations;
          if (hasVariance) {
            const booking = state.bookings.find(
              (b) => b.id === stop.bookingId
            );
            const equipment = state.equipmentTypes.find(
              (e) => e.id === booking?.equipmentTypeId
            );

            const variance =
              (actuals.actualInQuantity || 0) - (stop.expectedInQuantity || 0);

            const reconciliation: Reconciliation = {
              id: generateId(),
              reconciliationNumber: generateReconciliationNumber(),
              bookingId: stop.bookingId,
              stopId: stop.id,
              expectedQuantity: stop.expectedInQuantity || 0,
              actualQuantity: actuals.actualInQuantity || 0,
              variance,
              variancePercentage:
                ((variance / (stop.expectedInQuantity || 1)) * 100),
              expectedQuality: stop.expectedQualityGrade,
              actualQuality: actuals.actualQualityGrade,
              qualityDowngraded:
                actuals.actualQualityGrade !== stop.expectedQualityGrade,
              varianceType:
                variance < 0
                  ? 'shortage'
                  : variance > 0
                    ? 'surplus'
                    : 'match',
              financialImpactEur:
                Math.abs(variance) * (equipment?.standardValueEur || 0),
              impactCategory:
                Math.abs(variance * (equipment?.standardValueEur || 0)) < 20
                  ? 'immaterial'
                  : Math.abs(variance * (equipment?.standardValueEur || 0)) <
                      100
                    ? 'minor'
                    : Math.abs(variance * (equipment?.standardValueEur || 0)) <
                        500
                      ? 'moderate'
                      : 'major',
              liablePartyId: stop.custodyBeforeCompanyId || stop.companyId,
              liabilityConfidence: 0.85,
              status: 'detected',
              detectedAt: new Date().toISOString(),
            };

            newReconciliations = [...newReconciliations, reconciliation];
          }

          return {
            stops: newStops,
            reconciliations: newReconciliations,
          };
        });
      },

      resolveReconciliation: (id, strategy, notes) => {
        set((state) => {
          const index = state.reconciliations.findIndex((r) => r.id === id);
          if (index === -1) return state;

          const updated = [...state.reconciliations];
          updated[index] = {
            ...updated[index],
            status: 'resolved',
            resolutionStrategy: strategy as any,
            resolutionNotes: notes,
            resolvedAt: new Date().toISOString(),
          };

          return { reconciliations: updated };
        });
      },

      initiateDispute: (reconciliationId, reason) => {
        set((state) => {
          const reconciliation = state.reconciliations.find(
            (r) => r.id === reconciliationId
          );
          if (!reconciliation) return state;

          const dispute: Dispute = {
            id: generateId(),
            disputeNumber: generateDisputeNumber(),
            reconciliationId,
            bookingId: reconciliation.bookingId,
            initiatedByCompanyId: reconciliation.liablePartyId || '',
            respondentCompanyId: '',
            reason,
            amountDisputedEur: reconciliation.financialImpactEur,
            status: 'open',
            claimantEvidence: [],
            respondentEvidence: [],
            initiatedAt: new Date().toISOString(),
          };

          return {
            disputes: [...state.disputes, dispute],
            reconciliations: state.reconciliations.map((r) =>
              r.id === reconciliationId ? { ...r, status: 'disputed' as const } : r
            ),
          };
        });
      },

      // Computed
      getBookingWithStops: (bookingId) => {
        const state = get();
        const booking = state.bookings.find((b) => b.id === bookingId);
        if (!booking) return undefined;

        const stops = state.stops.filter((s) => s.bookingId === bookingId);
        const equipmentType = state.equipmentTypes.find(
          (e) => e.id === booking.equipmentTypeId
        );
        const fromCompany = state.companies.find(
          (c) => c.id === booking.fromCompanyId
        );
        const toCompany = state.companies.find(
          (c) => c.id === booking.toCompanyId
        );
        const carrierCompany = booking.carrierCompanyId
          ? state.companies.find((c) => c.id === booking.carrierCompanyId)
          : undefined;

        return {
          ...booking,
          stops,
          equipmentType,
          fromCompany,
          toCompany,
          carrierCompany,
        };
      },

      getCompanyBalance: (companyId) => {
        const state = get();
        const company = state.companies.find((c) => c.id === companyId);
        const accounts = state.accounts.filter(
          (a) => a.companyId === companyId
        );

        const totalValueEur = accounts.reduce((sum, acc) => {
          const equipment = state.equipmentTypes.find(
            (e) => e.id === acc.equipmentTypeId
          );
          return sum + acc.balance * (equipment?.standardValueEur || 0);
        }, 0);

        return {
          companyId,
          company,
          accounts,
          totalValueEur,
          lastActivity: accounts[0]?.lastMovementAt,
        };
      },

      getPendingActions: () => {
        return get().stops.filter((s) => s.status === 'awaiting_confirmation');
      },

      getOpenVariances: () => {
        return get().reconciliations.filter(
          (r) => r.status === 'detected' || r.status === 'investigating'
        );
      },

      // Persistence
      loadFromStorage: () => {
        // Already handled by persist middleware
      },

      initializeSeedData: () => {
        const { bookings, stops } = generateSeedBookings(25);
        set({
          companies: seedCompanies,
          equipmentTypes: seedEquipmentTypes,
          bookings,
          stops,
          accounts: [],
          transactions: [],
          reconciliations: [],
          disputes: [],
          documents: [],
          rules: [],
        });
      },
    }),
    {
      name: 'logistikbude-storage',
    }
  )
);
