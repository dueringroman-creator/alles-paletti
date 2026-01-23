# STOP-CENTRIC EQUIPMENT ACCOUNTING - ARCHITECTURAL SPECIFICATION

**Version:** 1.0
**Date:** 2026-01-23
**Status:** Design Specification (Not Yet Implemented)

---

## EXECUTIVE SUMMARY

**Core Paradigm Shift:**
```
FROM: Simple origin → destination tracking (TMS model)
TO:   Multi-stop granular accounting with custody transfers (Ledger model)
```

**Key Insight:** Equipment movements happen at **STOPS** (not just routes). Each stop represents a potential transaction, reconciliation point, variance detection, and custody transfer. This enables:

1. **Stop-level reconciliation** - Detect where variance occurred (not just "somewhere in transit")
2. **Precise liability assignment** - Know exactly who had custody when equipment went missing
3. **Progressive granularity** - Drill down from executive KPIs → company balances → bookings → stops → individual scans
4. **PSP transaction tracking** - Capture mid-journey quality exchanges that TMS systems miss
5. **Audit-ready evidence** - Every stop has signatures, photos, PODs, timestamps

---

## PART 1: THE STOP-CENTRIC MODEL

### Mental Model: Every Stop is a Transaction Point

**TRADITIONAL VIEW (TMS):**
```
Origin ──────────────────────────────────► Destination
 BMW                                        Customer

❌ Too simplistic for equipment accounting!
```

**REALITY (Equipment Accounting):**
```
BMW ──► Dachser ──► PSP ──► Regional ──► Handoff ──► Customer
        Depot      Pickup   Carrier      Point       Warehouse
         │          │         │            │            │
       STOP 1    STOP 2    STOP 3       STOP 4      STOP 5
         │          │         │            │            │
    Transaction Transaction Transaction Transaction Transaction

Each stop:
- Equipment in/out event
- Potential reconciliation
- Potential variance
- Custody transfer point
```

### Real-World Example Scenario

**BMW ships 25 EUR pallets to Customer Hamburg**

#### STOP 1: BMW Munich Warehouse (ORIGIN)
```yaml
Time: 08:00
Event: Pickup
Actor: Dachser driver
Equipment OUT: 25 EUR pallets, Grade A
Evidence: Loading list scan
Nature: "Primary shipper handoff"

TMS knows: ✓ "Shipment S-12345 picked up"
WE ENRICH:
  - Exact pallet count (25)
  - Quality grade (A)
  - Who signed (Hans Schmidt)
  - Photo of loaded truck
  - Signature on loading list

ACCOUNTING ENTRY:
  Debit:  BMW AG account         -25 EUR
  Credit: Dachser SE (custody)   +25 EUR
```

#### STOP 2: Dachser Depot Kempten (CONSOLIDATION HUB)
```yaml
Time: 10:30
Event: Unload → Quality Check → Reload
Actor: Dachser warehouse staff
Equipment IN: 25 EUR pallets, Grade A
Equipment OUT: 25 EUR pallets, Grade A
Evidence: Internal scan log
Nature: "Quality inspection checkpoint"

TMS knows: ✗ Probably doesn't know (internal operation)
WE CAPTURE:
  - Equipment still in Dachser custody
  - Quality verified (still Grade A)
  - 2 pallets flagged as borderline (noted)
  - Timestamp of check

ACCOUNTING ENTRY:
  No balance change (same custodian)
  But: Event logged for audit trail
```

#### STOP 3: PSP Pallet Service Point (EQUIPMENT ADJUSTMENT)
```yaml
Time: 11:15
Event: Exchange 5 Grade A for 5 Grade B
Actor: PSP staff (PalletPool GmbH)
Equipment IN: 5 EUR pallets, Grade A
Equipment OUT: 5 EUR pallets, Grade B
Evidence: PSP exchange voucher
Nature: "Quality downgrade exchange"
Why: Dachser needed Grade B for different customer

TMS knows: ✗ No idea this happened!
WE CAPTURE:
  - Dachser exchanged 5A for 5B
  - PSP charges €25 exchange fee
  - Voucher #V-2026-4567 scanned
  - Now carrying: 20A + 5B

ACCOUNTING ENTRY:
  Debit:  Dachser (Grade A)     -5 EUR Grade A
  Credit: PSP (Grade A)         +5 EUR Grade A
  Debit:  PSP (Grade B)         -5 EUR Grade B
  Credit: Dachser (Grade B)     +5 EUR Grade B

PSP CHARGE:
  €25 exchange fee (Dachser owes PSP)
```

#### STOP 4: Regional Transport Handoff (SUBCONTRACTOR TRANSFER)
```yaml
Time: 12:00
Event: Custody transfer to subcontractor
Actor: Regional Transport driver
Equipment OUT (from Dachser): 25 EUR (20A + 5B)
Equipment IN (to Regional): 25 EUR (20A + 5B)
Evidence: Handoff protocol, photos
Nature: "Subcontractor custody transfer"

TMS knows: ✓ Might know (if subcontractor reported)
WE ENRICH:
  - Exact count verified by both parties
  - Quality grades confirmed
  - Both drivers signed
  - Photo evidence of handoff

ACCOUNTING ENTRY:
  Debit:  Dachser SE (custody)           -25 EUR
  Credit: Regional Transport (custody)    +25 EUR

LIABILITY SHIFT:
  Dachser no longer responsible
  Regional Transport now liable
```

#### STOP 5: Customer Hamburg Warehouse (FINAL DELIVERY)
```yaml
Time: 14:20
Event: Final delivery
Actor: Customer receiving staff
Equipment IN: 23 EUR pallets (18A + 5B)
Evidence: POD signed, page 3 shows pallet exchange
Nature: "Final delivery - DISCREPANCY DETECTED"

TMS knows: ✓ "Shipment delivered"
WE CAPTURE:
  ⚠️ Only 23 pallets received!
  ⚠️ Expected: 25 (20A + 5B)
  ⚠️ Actual: 23 (18A + 5B)
  ⚠️ Missing: 2 Grade A pallets
  - POD page 3 scanned (pallet section)
  - Customer signature: Peter Weber
  - Delivery note shows "23 pallets"

ACCOUNTING ENTRY:
  Debit:  Regional Transport (custody) -23 EUR
  Credit: Customer Hamburg GmbH        +23 EUR

RECONCILIATION TRIGGERED:
  Expected at Stop 4: 25 (20A + 5B)
  Delivered at Stop 5: 23 (18A + 5B)
  Variance: -2 Grade A pallets
  Last known custody: Regional Transport
  → Regional Transport LIABLE for 2 missing pallets
```

---

## PART 2: DATABASE SCHEMA

### Core Table: STOPS

```sql
CREATE TABLE stops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stop_number TEXT NOT NULL UNIQUE,         -- STP-20260122-0001

    -- Context: What journey is this stop part of?
    booking_id INTEGER NOT NULL,              -- Links to equipment booking
    stop_sequence INTEGER NOT NULL,           -- 1, 2, 3, 4, 5 (order in journey)

    -- Stop identification
    stop_type TEXT NOT NULL,
    -- 'origin': Starting point (shipper)
    -- 'destination': Final endpoint (receiver)
    -- 'consolidation_hub': Carrier depot/cross-dock
    -- 'psp_service_point': Pallet service provider stop
    -- 'handoff_point': Custody transfer location
    -- 'quality_checkpoint': Inspection point
    -- 'storage_depot': Temporary storage
    -- 'return_point': Return location (for exchanges)
    -- 'customs_checkpoint': Border/customs inspection

    stop_nature TEXT,                         -- Human-readable description
    -- "Primary shipper handoff"
    -- "Quality inspection checkpoint"
    -- "PSP pallet exchange"
    -- "Subcontractor custody transfer"
    -- "Final delivery"

    -- Location
    facility_id INTEGER,                      -- If it's a known facility
    location_name TEXT NOT NULL,
    location_address TEXT,
    location_city TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),

    -- Company involved at this stop
    company_id INTEGER NOT NULL,              -- Who operates this stop
    company_role TEXT NOT NULL,
    -- 'shipper', 'receiver', 'carrier', 'psp', 'warehouse', 'customs'

    -- Timing
    scheduled_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    dwell_time_minutes INTEGER,               -- Time spent at stop

    -- Status
    status TEXT DEFAULT 'pending',
    -- 'pending': Not yet reached
    -- 'in_progress': Currently at stop
    -- 'completed': Left stop
    -- 'skipped': Stop not visited
    -- 'exception': Problem at stop

    -- Contact
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,

    -- Custody tracking
    custody_before_stop_company_id INTEGER,   -- Who had custody before
    custody_after_stop_company_id INTEGER,    -- Who has custody after
    custody_transfer BOOLEAN DEFAULT FALSE,   -- Did custody change?

    -- Requirements
    confirmation_required BOOLEAN DEFAULT TRUE,
    photo_required BOOLEAN DEFAULT FALSE,
    signature_required BOOLEAN DEFAULT TRUE,
    quality_check_required BOOLEAN DEFAULT FALSE,

    -- Evidence
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_by TEXT,
    confirmed_at TIMESTAMP,
    signature_captured BOOLEAN DEFAULT FALSE,
    photos_uploaded INTEGER DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES equipment_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (custody_before_stop_company_id) REFERENCES companies(id),
    FOREIGN KEY (custody_after_stop_company_id) REFERENCES companies(id),

    UNIQUE(booking_id, stop_sequence)
);

CREATE INDEX idx_stops_booking ON stops(booking_id);
CREATE INDEX idx_stops_status ON stops(status);
CREATE INDEX idx_stops_company ON stops(company_id);
```

### Core Table: STOP_TRANSACTIONS

```sql
-- Equipment in/out at each stop - This is where the accounting happens
CREATE TABLE stop_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_number TEXT NOT NULL UNIQUE,  -- STX-20260122-0001

    stop_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,              -- Redundant but useful for queries

    -- Transaction direction
    direction TEXT NOT NULL,                  -- 'in' or 'out'

    -- What equipment
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    quality_grade TEXT NOT NULL,

    -- From/To (depending on direction)
    from_company_id INTEGER,                  -- For 'out': who gave equipment
    to_company_id INTEGER,                    -- For 'in': who received equipment

    -- Transaction nature
    transaction_nature TEXT NOT NULL,
    -- 'pickup': Loading at origin
    -- 'delivery': Unloading at destination
    -- 'handoff': Transfer between parties
    -- 'exchange': Swap (different quality/type)
    -- 'inspection': Quality check (no ownership change)
    -- 'adjustment': Quantity correction
    -- 'return': Return to original party

    -- Expected vs Actual (reconciliation data)
    expected_quantity INTEGER,                -- What was expected
    variance INTEGER,                         -- actual - expected
    has_variance BOOLEAN DEFAULT FALSE,

    -- Evidence
    evidence_type TEXT,
    -- 'scan': Barcode/RFID scan
    -- 'document': Paper document
    -- 'photo': Photo evidence
    -- 'signature': Signed confirmation
    -- 'manual': Manual entry
    -- 'ai_extracted': AI extracted from document

    evidence_confidence DECIMAL(3,2),         -- 0.00 to 1.00
    document_id INTEGER,                      -- Link to uploaded doc
    document_page_number INTEGER,             -- Specific page (e.g., POD page 3)

    -- Financial
    transaction_value_eur DECIMAL(10,2),

    -- PSP Charges (if applicable)
    psp_charge_id INTEGER,                    -- If this transaction incurred PSP fee

    -- Metadata
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id INTEGER,
    notes TEXT,

    -- Reconciliation
    reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES equipment_bookings(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (from_company_id) REFERENCES companies(id),
    FOREIGN KEY (to_company_id) REFERENCES companies(id),
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (psp_charge_id) REFERENCES psp_charges(id),
    FOREIGN KEY (reconciliation_id) REFERENCES reconciliations(id),
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_stop_transactions_stop ON stop_transactions(stop_id);
CREATE INDEX idx_stop_transactions_booking ON stop_transactions(booking_id);
CREATE INDEX idx_stop_transactions_direction ON stop_transactions(direction);
CREATE INDEX idx_stop_transactions_has_variance ON stop_transactions(has_variance);
```

### Supporting Table: PSP_CHARGES

```sql
CREATE TABLE psp_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charge_number TEXT NOT NULL UNIQUE,

    stop_id INTEGER NOT NULL,                 -- Which stop incurred this charge
    booking_id INTEGER NOT NULL,

    psp_company_id INTEGER NOT NULL,          -- PSP provider (PalletPool GmbH, etc.)
    charged_to_company_id INTEGER NOT NULL,   -- Who pays (usually carrier)

    -- Charge type
    charge_type TEXT NOT NULL,
    -- 'exchange_fee': Quality swap fee
    -- 'inspection_fee': Quality inspection
    -- 'storage_fee': Temporary storage
    -- 'handling_fee': Additional handling
    -- 'damage_repair': Repair damaged equipment
    -- 'rental_fee': Daily rental charge

    -- Equipment context
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,

    -- Pricing
    base_charge_eur DECIMAL(10,2) DEFAULT 0.00,
    per_unit_charge_eur DECIMAL(10,2) DEFAULT 0.00,
    total_charge_eur DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 19.00,
    vat_amount_eur DECIMAL(10,2),
    total_incl_vat_eur DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',

    -- Supporting evidence
    psp_voucher_number TEXT,                  -- PSP's internal reference
    document_id INTEGER,                      -- Scanned voucher

    -- Status
    status TEXT DEFAULT 'pending',
    -- 'pending': Charge created, not yet approved
    -- 'approved': Approved for payment
    -- 'disputed': Charge disputed
    -- 'paid': Payment completed
    -- 'cancelled': Charge cancelled

    approved_by_user_id INTEGER,
    approved_at TIMESTAMP,

    dispute_reason TEXT,
    disputed_at TIMESTAMP,

    paid_at TIMESTAMP,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stop_id) REFERENCES stops(id),
    FOREIGN KEY (booking_id) REFERENCES equipment_bookings(id),
    FOREIGN KEY (psp_company_id) REFERENCES companies(id),
    FOREIGN KEY (charged_to_company_id) REFERENCES companies(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_psp_charges_stop ON psp_charges(stop_id);
CREATE INDEX idx_psp_charges_status ON psp_charges(status);
```

### Enhanced Table: RECONCILIATIONS

```sql
CREATE TABLE reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reconciliation_number TEXT NOT NULL UNIQUE,

    booking_id INTEGER NOT NULL,

    -- Stop-level reconciliation (NEW!)
    stop_id INTEGER,                          -- Specific stop where variance detected
    between_stop_id INTEGER,                  -- If variance between two stops

    reconciliation_scope TEXT NOT NULL,
    -- 'stop_level': Variance at specific stop
    -- 'between_stops': Variance between two stops
    -- 'journey_level': Overall journey variance
    -- 'period_level': Monthly/periodic reconciliation

    -- Expected vs Actual
    expected_quantity INTEGER NOT NULL,
    actual_quantity INTEGER NOT NULL,
    variance INTEGER NOT NULL,
    variance_percentage DECIMAL(5,2),

    expected_quality TEXT NOT NULL,
    actual_quality TEXT,
    quality_downgraded BOOLEAN DEFAULT FALSE,

    -- Last known custody (for liability)
    last_custody_company_id INTEGER,
    last_custody_stop_id INTEGER,

    -- Categorization
    variance_type TEXT,
    -- 'shortage', 'surplus', 'quality_downgrade', 'damage', 'match'

    variance_reason TEXT,
    -- 'shrinkage', 'damage', 'theft', 'miscounting', 'exchange_error',
    -- 'psp_transaction', 'unknown'

    -- Financial impact
    financial_impact_eur DECIMAL(10,2),
    impact_category TEXT,

    -- Status
    status TEXT DEFAULT 'open',

    -- Resolution
    resolution_strategy TEXT,
    resolution_cost_eur DECIMAL(10,2),
    resolution_details TEXT,                  -- JSON

    liable_party_id INTEGER,
    liability_confidence DECIMAL(3,2),

    -- Lifecycle
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    investigated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by_user_id INTEGER,

    notes TEXT,

    FOREIGN KEY (booking_id) REFERENCES equipment_bookings(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    FOREIGN KEY (between_stop_id) REFERENCES stops(id),
    FOREIGN KEY (last_custody_company_id) REFERENCES companies(id),
    FOREIGN KEY (last_custody_stop_id) REFERENCES stops(id),
    FOREIGN KEY (liable_party_id) REFERENCES companies(id),
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);
```

### Analytical View: STOP_RECONCILIATION

```sql
CREATE VIEW v_stop_reconciliation AS
SELECT
    s.id as stop_id,
    s.stop_number,
    s.stop_sequence,
    s.stop_type,
    s.location_name,
    s.company_id,
    c.name as company_name,
    b.booking_number,

    -- Equipment IN
    SUM(CASE WHEN st.direction = 'in' THEN st.quantity ELSE 0 END) as total_in,

    -- Equipment OUT
    SUM(CASE WHEN st.direction = 'out' THEN st.quantity ELSE 0 END) as total_out,

    -- Net change at this stop
    SUM(CASE WHEN st.direction = 'in' THEN st.quantity
             WHEN st.direction = 'out' THEN -st.quantity
             ELSE 0 END) as net_change,

    -- Variances
    SUM(CASE WHEN st.has_variance THEN ABS(st.variance) ELSE 0 END) as total_variance,
    COUNT(CASE WHEN st.has_variance THEN 1 END) as variance_count,

    -- Status
    s.status as stop_status,
    s.confirmed,

    s.actual_arrival,
    s.actual_departure

FROM stops s
JOIN companies c ON s.company_id = c.id
JOIN equipment_bookings b ON s.booking_id = b.id
LEFT JOIN stop_transactions st ON s.id = st.stop_id
GROUP BY s.id, s.stop_number, s.stop_sequence, s.stop_type, s.location_name,
         s.company_id, c.name, b.booking_number, s.status, s.confirmed,
         s.actual_arrival, s.actual_departure;
```

---

## PART 3: PROGRESSIVE GRANULARITY - 6 LEVELS

### LEVEL 1: SCAN-LEVEL (Most Granular)
**Who sees:** Operations staff, warehouse workers, drivers
**What:** Individual equipment scans at each stop

```
Example view:
┌─────────────┬────────┬──────────┬──────┬─────────┬─────────┐
│ Timestamp   │ Stop   │ Action   │ Qty  │ Quality │ Scanned │
├─────────────┼────────┼──────────┼──────┼─────────┼─────────┤
│ 08:00:15    │ Stop 1 │ OUT      │ 1    │ A       │ P-00123 │
│ 08:00:17    │ Stop 1 │ OUT      │ 1    │ A       │ P-00124 │
│ 08:00:19    │ Stop 1 │ OUT      │ 1    │ A       │ P-00125 │
│ ...         │ ...    │ ...      │ ...  │ ...     │ ...     │
│ 08:05:43    │ Stop 1 │ OUT      │ 1    │ A       │ P-00147 │
└─────────────┴────────┴──────────┴──────┴─────────┴─────────┘
Total: 25 individual scans
```

### LEVEL 2: TRANSACTION-LEVEL (Stop Aggregation)
**Who sees:** Supervisors, logistics coordinators
**What:** Aggregated equipment movements per stop

```
Example view:
┌─────────┬──────────────┬──────────────┬────────┬──────┬─────────┬──────────┐
│ Stop    │ Location     │ Transaction  │ Dir    │ Qty  │ Quality │ Evidence │
├─────────┼──────────────┼──────────────┼────────┼──────┼─────────┼──────────┤
│ Stop 1  │ BMW Munich   │ Pickup       │ OUT    │ 25   │ A       │ ✓ Scan   │
│ Stop 2  │ Dachser Hub  │ Inspection   │ IN/OUT │ 25   │ A       │ ✓ Doc    │
│ Stop 3  │ PSP Point    │ Exchange     │ IN/OUT │ 5A→5B│ A→B     │ ✓ Voucher│
│ Stop 4  │ Handoff      │ Transfer     │ IN/OUT │ 25   │ 20A+5B  │ ✓ Sign   │
│ Stop 5  │ Customer HH  │ Delivery     │ IN     │ 23   │ 18A+5B  │ ✓ POD p3 │
└─────────┴──────────────┴──────────────┴────────┴──────┴─────────┴──────────┘
Variance detected: -2 Grade A pallets
```

### LEVEL 3: BOOKING-LEVEL (Journey Summary)
**Who sees:** Logistics managers, operations analysts
**What:** Overall journey summary with variances

```
Example view:
┌────────────────┬───────────┬──────────┬────────┬──────────┬─────────────┐
│ Booking        │ Route     │ Expected │ Actual │ Variance │ Status      │
├────────────────┼───────────┼──────────┼────────┼──────────┼─────────────┤
│ EB-20260122-01 │ BMW→Cust  │ 25 A     │ 23 A+B │ -2 A     │ ⚠ Variance  │
│                │ 5 stops   │          │        │          │ Open        │
└────────────────┴───────────┴──────────┴────────┴──────────┴─────────────┘
Financial impact: €16.00
Liable: Regional Transport
```

### LEVEL 4: COMPANY-LEVEL (Account Balances)
**Who sees:** Account managers, customer service
**What:** Net positions per company

```
Example view:
┌───────────────────┬──────────┬──────────┬───────────┬──────────┐
│ Company           │ EUR      │ H1       │ CAGE      │ Net Value│
├───────────────────┼──────────┼──────────┼───────────┼──────────┤
│ BMW AG            │ -150     │ +20      │ 0         │ -€1,200  │
│ Dachser SE        │ +80      │ 0        │ 0         │ +€640    │
│ Customer Hamburg  │ +70      │ -20      │ 0         │ +€560    │
│ Regional Trans.   │ -47      │ 0        │ 0         │ -€376    │
└───────────────────┴──────────┴──────────┴───────────┴──────────┘
Negative = They owe us
Positive = We owe them
```

### LEVEL 5: SETTLEMENT-LEVEL (Financial Summary)
**Who sees:** Finance controllers, CFO
**What:** Invoicing and payment summary

```
Example view:
┌───────────────────┬────────────┬──────────────┬──────────┬──────────┐
│ Company           │ Period     │ Net Balance  │ Invoice  │ Status   │
├───────────────────┼────────────┼──────────────┼──────────┼──────────┤
│ BMW AG            │ Jan 2026   │ -€1,200.00   │ INV-0123 │ Overdue  │
│ Dachser SE        │ Jan 2026   │ +€640.00     │ CN-0045  │ Pending  │
│ Regional Trans.   │ Jan 2026   │ -€376.00     │ INV-0124 │ Paid     │
└───────────────────┴────────────┴──────────────┴──────────┴──────────┘
Total receivables: €1,576.00
Total payables: €640.00
Net position: +€936.00
```

### LEVEL 6: EXECUTIVE DASHBOARD (KPIs)
**Who sees:** C-level, board
**What:** High-level metrics and trends

```
┌─────────────────────────────────────────────────────────┐
│ Equipment Under Management: 45,670 units                │
│ Total Value in Circulation: €3.2M                       │
│ Monthly Shrinkage Rate: 1.8% (↓ 0.3% vs last month)   │
│ Outstanding Receivables: €124,500                       │
│ PSP Costs This Month: €18,200                          │
│ Reconciliation Accuracy: 94.2%                         │
└─────────────────────────────────────────────────────────┘
```

---

## PART 4: API ENDPOINTS

### Booking Creation with Stops

**POST /api/bookings**
```json
{
  "equipment_type_id": 1,
  "quantity": 25,
  "expected_quality_grade": "A",
  "from_company_id": 1,
  "to_company_id": 4,
  "expected_date": "2026-01-22",
  "stops": [
    {
      "stop_sequence": 1,
      "stop_type": "origin",
      "stop_nature": "Primary shipper handoff",
      "location_name": "BMW Munich Warehouse",
      "company_id": 1,
      "company_role": "shipper",
      "scheduled_departure": "2026-01-22T08:00:00Z",
      "custody_after_stop_company_id": 2,
      "confirmation_required": true,
      "expected_transactions": [
        {
          "direction": "out",
          "equipment_type_id": 1,
          "quantity": 25,
          "quality_grade": "A",
          "transaction_nature": "pickup"
        }
      ]
    },
    // ... more stops
  ]
}
```

### Stop Management

**GET /api/bookings/{booking_id}/stops**
- Returns all stops for a booking with transaction details
- Includes custody chain, evidence status, variances

**POST /api/stops/{stop_id}/transactions/record**
- Record actual transaction at a stop
- Auto-detects variance
- Triggers reconciliation if needed

**POST /api/stops/{stop_id}/confirm**
- Confirm stop completion
- Captures signature, photos
- Transfers custody
- Activates next stop

**GET /api/stops/{stop_id}/reconciliation**
- Get reconciliation data for specific stop
- Expected vs actual comparison
- Custody information

### Journey Reconciliation

**GET /api/bookings/{booking_id}/reconciliation/journey**
- Overall journey reconciliation
- Origin to destination summary
- Intermediate stops analysis
- Liability assignment
- Financial impact calculation

---

## PART 5: UI COMPONENT HIERARCHY

### Level 1: StopScanLog Component
```tsx
<StopScanLog stopId={1}>
  <ScanList>
    {scans.map(scan => (
      <ScanItem>
        <Timestamp>{scan.timestamp}</Timestamp>
        <EquipmentId>{scan.equipment_id}</EquipmentId>
        <QualityBadge>{scan.quality_grade}</QualityBadge>
      </ScanItem>
    ))}
  </ScanList>
</StopScanLog>
```

### Level 2: StopTransactionView Component
```tsx
<StopTransactionView bookingId={123}>
  <StopTimeline>
    {stops.map(stop => (
      <StopCard sequence={stop.stop_sequence}>
        <StopHeader>
          <StopType>{stop.stop_type}</StopType>
          <LocationName>{stop.location_name}</LocationName>
        </StopHeader>
        <TransactionsList>
          {stop.transactions.map(tx => (
            <TransactionRow>
              <Direction>{tx.direction}</Direction>
              <Quantity>{tx.quantity}</Quantity>
              {tx.has_variance && <VarianceAlert />}
            </TransactionRow>
          ))}
        </TransactionsList>
      </StopCard>
    ))}
  </StopTimeline>
</StopTransactionView>
```

### Level 3: BookingReconciliationView Component
```tsx
<BookingReconciliationView bookingId={123}>
  <ComparisonTable>
    <tr>
      <td>Expected: 25</td>
      <td>Actual: 23</td>
      <td>Variance: -2</td>
    </tr>
  </ComparisonTable>
  <LiabilitySection>
    <LiableParty>Regional Transport</LiableParty>
    <Confidence>95%</Confidence>
  </LiabilitySection>
  <ResolutionOptions />
</BookingReconciliationView>
```

### Level 4-6: Higher-Level Aggregations
- CompanyBalancesView
- SettlementsView
- ExecutiveDashboard

---

## PART 6: IMPLEMENTATION PRIORITIES

### Phase 1: Foundation (Week 1)
1. Create `stops` table in Google Sheets
2. Create `stop_transactions` table
3. Basic API endpoints (create booking with stops, get stops)
4. Simple stop timeline UI component

### Phase 2: Transactions (Week 2)
5. Implement stop transaction recording
6. Auto-variance detection
7. Stop confirmation workflow
8. Evidence upload (signatures, photos)

### Phase 3: PSP Integration (Week 3)
9. Create `psp_charges` table
10. PSP transaction tracking
11. Quality exchange workflows
12. PSP cost calculation

### Phase 4: Reconciliation (Week 4)
13. Stop-level reconciliation
14. Journey reconciliation
15. Liability assignment logic
16. Resolution recommendations

### Phase 5: Progressive Views (Week 5)
17. Scan-level view
18. Transaction-level view
19. Booking reconciliation view
20. Company balances view

### Phase 6: Financial (Week 6)
21. Settlement calculations
22. Invoice generation
23. Payment tracking
24. Executive dashboard

---

## GAP ANALYSIS: CURRENT STATE vs STOP-CENTRIC MODEL

### Current Implementation (Simple)
```
Bookings table:
- origin → destination (2 points only)
- No intermediate stops
- No custody transfers
- Reconciliation = client-side simulation

Events table:
- Flat event log
- No stop association
- Limited event types
```

### Stop-Centric Model (Advanced)
```
Stops table:
- Multiple stops per booking (5, 10, 20+)
- Each stop = transaction point
- Custody chain tracked
- PSP stops captured

Stop Transactions table:
- Equipment in/out per stop
- Evidence per transaction
- Auto-variance detection
- Real reconciliation data
```

### Migration Path
1. **Backward Compatible:** Keep existing bookings table
2. **Add Stops:** Create stops table, link to bookings
3. **Gradual Adoption:** New bookings use stops, old bookings continue as-is
4. **Data Migration:** (Optional) Convert existing bookings to 2-stop journeys (origin + destination)

---

## BENEFITS SUMMARY

### Business Benefits
- **Precise liability:** Know exactly who lost equipment (which custody transfer)
- **PSP cost visibility:** Track all PSP exchanges and charges
- **Audit compliance:** Complete evidence chain at every stop
- **Dispute resolution:** Evidence-based variance investigation
- **Cost optimization:** Identify most expensive stops/carriers

### Technical Benefits
- **Scalability:** Support complex multi-stop routes
- **Extensibility:** Easy to add new stop types (customs, storage, etc.)
- **Data quality:** Granular reconciliation catches errors early
- **Reporting:** Drill-down from KPIs to individual scans
- **Integration:** Easy to import from TMS (stops = waypoints)

---

**STATUS:** This specification is ready for implementation discussion.

**NEXT DECISIONS NEEDED:**
1. Implement now or later?
2. Full implementation or MVP subset?
3. Migrate existing data or start fresh?
4. Google Sheets or SQL database for stops?

