// Core entities for Logistikbude Equipment Accounting Platform

export interface Company {
  id: string;
  name: string;
  type: 'shipper' | 'carrier' | 'receiver' | 'pooling_provider' | 'depot';
  contactName?: string;
  contactEmail?: string;
  settlementPeriod: 'weekly' | 'monthly';
  isActive: boolean;
}

export interface EquipmentType {
  id: string;
  code: string; // 'EUR', 'H1', 'CAGE', 'IBC'
  name: string;
  standardValueEur: number;
  qualityGrades: string[];
  isPooled: boolean;
  poolProvider?: string;
}

export interface EquipmentAccount {
  id: string;
  companyId: string;
  equipmentTypeId: string;
  balance: number;
  balanceByGrade: {
    A: number;
    B: number;
    C: number;
    damaged: number;
  };
  lastMovementAt?: string;
}

export type BookingStatus =
  | 'draft'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'reconciled'
  | 'disputed'
  | 'settled'
  | 'cancelled';

export interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  equipmentTypeId: string;
  quantity: number;
  expectedQualityGrade: string;
  fromCompanyId: string;
  toCompanyId: string;
  carrierCompanyId?: string;
  relatedTransportId?: string;
  transportStatus?: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  expectedDate: string;
  actualDate?: string;
  bookingValueEur: number;
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
}

export type StopType = 'origin' | 'hub' | 'psp' | 'handoff' | 'destination';
export type StopStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'variance_detected';

export interface Stop {
  id: string;
  bookingId: string;
  stopNumber: string;
  sequence: number;
  type: StopType;
  locationName: string;
  companyId: string;
  custodyBeforeCompanyId?: string;
  custodyAfterCompanyId?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  expectedInQuantity?: number;
  expectedOutQuantity?: number;
  expectedQualityGrade: string;
  actualInQuantity?: number;
  actualOutQuantity?: number;
  actualQualityGrade?: string;
  status: StopStatus;
  requiresSignature: boolean;
  requiresPhoto: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  signatureCaptured: boolean;
  photosUploaded: number;
  notes?: string;
}

export type TransactionDirection = 'in' | 'out';
export type TransactionNature =
  | 'pickup'
  | 'delivery'
  | 'exchange'
  | 'handoff'
  | 'return';
export type EvidenceType = 'scan' | 'document' | 'photo' | 'manual';

export interface Transaction {
  id: string;
  transactionNumber: string;
  stopId: string;
  bookingId: string;
  direction: TransactionDirection;
  equipmentTypeId: string;
  quantity: number;
  qualityGrade: string;
  fromCompanyId?: string;
  toCompanyId: string;
  nature: TransactionNature;
  evidenceType: EvidenceType;
  documentId?: string;
  isExpected: boolean;
  varianceFromExpected?: number;
  recordedAt: string;
  recordedBy?: string;
}

export type VarianceType =
  | 'shortage'
  | 'surplus'
  | 'quality_downgrade'
  | 'damage'
  | 'match';
export type VarianceReason =
  | 'shrinkage'
  | 'damage'
  | 'theft'
  | 'miscounting'
  | 'exchange_error'
  | 'unknown';
export type ImpactCategory =
  | 'immaterial'
  | 'minor'
  | 'moderate'
  | 'major';
export type ReconciliationStatus =
  | 'detected'
  | 'investigating'
  | 'proposed'
  | 'accepted'
  | 'disputed'
  | 'resolved'
  | 'closed';
export type ResolutionStrategy =
  | 'invoice'
  | 'physical_return'
  | 'psp_replacement'
  | 'offset'
  | 'write_off';

export interface Reconciliation {
  id: string;
  reconciliationNumber: string;
  bookingId: string;
  stopId?: string;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  variancePercentage: number;
  expectedQuality: string;
  actualQuality?: string;
  qualityDowngraded: boolean;
  varianceType: VarianceType;
  varianceReason?: VarianceReason;
  financialImpactEur: number;
  impactCategory: ImpactCategory;
  liablePartyId?: string;
  liabilityConfidence: number;
  liabilityReasoning?: string;
  status: ReconciliationStatus;
  resolutionStrategy?: ResolutionStrategy;
  resolutionCostEur?: number;
  resolutionNotes?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type DisputeStatus =
  | 'open'
  | 'evidence_requested'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'closed';
export type ResolutionType =
  | 'claimant_wins'
  | 'respondent_wins'
  | 'compromise'
  | 'withdrawn';

export interface Dispute {
  id: string;
  disputeNumber: string;
  reconciliationId: string;
  bookingId: string;
  initiatedByCompanyId: string;
  respondentCompanyId: string;
  reason: string;
  amountDisputedEur: number;
  status: DisputeStatus;
  claimantEvidence: string[];
  respondentEvidence: string[];
  escalatedAt?: string;
  escalatedTo?: string;
  resolutionType?: ResolutionType;
  resolutionNotes?: string;
  finalAmountEur?: number;
  initiatedAt: string;
  resolvedAt?: string;
}

export type DocumentType = 'pod' | 'voucher' | 'cmr' | 'photo' | 'other';
export type DocumentProcessingStatus =
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'approved';

export interface Document {
  id: string;
  documentNumber: string;
  type: DocumentType;
  fileName: string;
  fileData?: string;
  processingStatus: DocumentProcessingStatus;
  extractedData?: {
    quantity?: number;
    qualityGrade?: string;
    date?: string;
    signedBy?: string;
  };
  linkedBookingId?: string;
  linkedStopId?: string;
  uploadedAt: string;
}

export type AutomationRuleType =
  | 'variance_threshold'
  | 'auto_approve'
  | 'auto_escalate';
export type AutomationAction =
  | 'auto_approve'
  | 'auto_escalate'
  | 'create_task';

export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationRuleType;
  conditions: {
    companyId?: string;
    equipmentTypeId?: string;
    maxVarianceUnits?: number;
    maxVarianceEur?: number;
    maxVariancePercent?: number;
  };
  action: AutomationAction;
  isActive: boolean;
}

// Helper types for UI
export interface BookingWithStops extends EquipmentBooking {
  stops: Stop[];
  equipmentType?: EquipmentType;
  fromCompany?: Company;
  toCompany?: Company;
  carrierCompany?: Company;
}

export interface BalanceSummary {
  companyId: string;
  company?: Company;
  accounts: EquipmentAccount[];
  totalValueEur: number;
  lastActivity?: string;
}
