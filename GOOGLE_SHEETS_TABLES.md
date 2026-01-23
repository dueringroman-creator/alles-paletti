# Google Sheets Setup - Table Format

## Priority 1: Update Events Sheet

Add these columns to your existing Events sheet (after column J: `confidence`):

| Column | Header | Data Type | Description | Example Value |
|--------|--------|-----------|-------------|---------------|
| K | eventSubtype | Text | Specific event subtype | `pickup_scan`, `delivery_scan`, `inventory_scan`, `gps_update` |
| L | equipmentType | Text | EUR, H1, CAGE, IBC, DOLLY | `EUR` |
| M | quantity | Number | Units scanned/moved | `33` |
| N | locationName | Text | Where event occurred | `Warehouse Munich` |
| O | locationLat | Number | GPS latitude | `48.1351` |
| P | locationLng | Number | GPS longitude | `11.5820` |
| Q | documentUrl | Text | Link to POD/photo | `https://storage.../pod-123.pdf` |
| R | aiExtracted | Boolean | TRUE if AI extracted | `TRUE` or `FALSE` |
| S | verifiedBy | Text | User who verified | `Hans Müller` |
| T | verifiedAt | DateTime | Verification timestamp | `2026-01-23T14:30:00Z` |

**Event Type Values:**
- `BookingCreated` - Booking intent logged
- `BookingConfirmed` - Carrier accepted
- `ScanEvent` - Equipment scanned (pickup, delivery, inventory)
- `LocationEvent` - GPS position update
- `StatusEvent` - Status change (in_transit, arrived, delayed)
- `DocumentEvent` - POD uploaded or signed
- `ReconciliationEvent` - Expected vs actual comparison
- `DisputeCreated` - Variance dispute opened
- `DisputeResolved` - Dispute closed

---

## Priority 2: Create Transports Sheet

Create a new sheet named **"Transports"** with these columns:

| Column | Header | Data Type | Description | Example Value | Formula/Validation |
|--------|--------|-----------|-------------|---------------|-------------------|
| A | id | Number | Unique transport ID | `1` | Auto-increment |
| B | transportNumber | Text | Human-readable ID | `TRN-2026-0001` | `="TRN-"&YEAR(NOW())&"-"&TEXT(A2,"0000")` |
| C | bookingId | Number | Links to Bookings | `1` | Foreign key |
| D | status | Text | Transport status | `in_transit` | Dropdown: `assigned`, `in_transit`, `arrived`, `delivered`, `cancelled` |
| E | carrierName | Text | Transport company | `Regional Transport GmbH` | |
| F | vehicleId | Text | License plate | `DE-MUC-1234` | |
| G | driverName | Text | Driver full name | `Hans Müller` | |
| H | driverPhone | Text | Driver contact | `+49 151 1234567` | |
| I | assignedAt | DateTime | Carrier acceptance | `2026-01-23T08:00:00Z` | |
| J | actualPickupTime | DateTime | Real pickup time | `2026-01-23T08:30:00Z` | |
| K | actualDeliveryTime | DateTime | Real delivery time | `2026-01-23T14:15:00Z` | |
| L | currentLocation | Text | Last known location | `Halfway point` | |
| M | currentLat | Number | Current GPS lat | `50.5` | |
| N | currentLng | Number | Current GPS lng | `10.2` | |
| O | equipmentLoaded | Number | Quantity picked up | `33` | For reconciliation |
| P | equipmentDelivered | Number | Quantity delivered | `28` | For reconciliation |
| Q | podUrl | Text | Proof of delivery link | `https://storage.../pod-trn-1.pdf` | |
| R | lastUpdated | DateTime | Last tracking update | `2026-01-23T12:00:00Z` | `=NOW()` |
| S | notes | Text | Transport-specific notes | `5 damaged pallets not loaded` | |

**Sample Data Row:**
```
1 | TRN-2026-0001 | 1 | in_transit | Regional Transport GmbH | DE-MUC-1234 | Hans Müller | +49 151 1234567 | 2026-01-23T08:00:00Z | 2026-01-23T08:30:00Z | | Halfway point | 50.5 | 10.2 | 33 | 0 | | 2026-01-23T12:00:00Z | On schedule
```

---

## Priority 3: Create Reconciliation Sheet

Create a new sheet named **"Reconciliation"** with these columns:

| Column | Header | Data Type | Description | Example Value | Formula |
|--------|--------|-----------|-------------|---------------|---------|
| A | id | Number | Reconciliation ID | `1` | Auto-increment |
| B | reconciliationDate | Date | When reconciliation ran | `2026-01-23` | `=TODAY()` |
| C | bookingId | Number | Links to Bookings | `1` | Foreign key |
| D | transportId | Number | Links to Transports | `1` | Foreign key |
| E | equipmentType | Text | EUR, H1, CAGE, etc. | `EUR` | |
| F | expectedQty | Number | From booking | `33` | |
| G | observedQty | Number | From POD/scans | `28` | |
| H | variance | Number | Difference | `-5` | `=G2-F2` |
| I | varianceReason | Text | Why discrepancy occurred | `Damaged pallets not loaded` | |
| J | status | Text | Reconciliation status | `variance` | Dropdown: `matched`, `variance`, `disputed`, `resolved` |
| K | financialImpact | Number (€) | € value of variance | `-12.50` | `=H2*CostSheet!B2` (lookup unit value) |
| L | resolutionOption | Text | Chosen solution | `PSP Pickup & Pool` | |
| M | resolvedBy | Text | User who closed | `Finance Controller` | |
| N | resolvedAt | DateTime | Resolution timestamp | `2026-01-24T10:00:00Z` | |
| O | notes | Text | Resolution details | `PSP collected 5 pallets for pooling` | |

**Sample Data Rows:**
```
Row 1: 1 | 2026-01-23 | 1 | 1 | EUR | 33 | 28 | -5 | Damaged pallets not loaded | variance | -12.50 | | | | 5 pallets damaged at origin

Row 2: 2 | 2026-01-23 | 2 | 2 | EUR | 33 | 33 | 0 | | matched | 0.00 | | System | 2026-01-23T14:00:00Z | Perfect match
```

---

## Priority 4: Create Disputes Sheet

Create a new sheet named **"Disputes"** with these columns:

| Column | Header | Data Type | Description | Example Value |
|--------|--------|-----------|-------------|---------------|
| A | id | Number | Dispute ID | `1` |
| B | disputeNumber | Text | Human-readable ID | `DSP-2026-0001` |
| C | createdAt | DateTime | When dispute was raised | `2026-01-23T15:00:00Z` |
| D | bookingId | Number | Links to Bookings | `1` |
| E | transportId | Number | Links to Transports | `1` |
| F | reconId | Number | Links to Reconciliation | `1` |
| G | disputeType | Text | Type of issue | `quantity_mismatch` |
| H | description | Text | What went wrong | `5 pallets missing from delivery` |
| I | raisedBy | Text | Who reported | `Consignee` |
| J | assignedTo | Text | Who's responsible | `Carrier` |
| K | status | Text | Dispute status | `open` |
| L | priority | Text | Urgency level | `high` |
| M | dueDate | Date | SLA deadline | `2026-01-30` |
| N | evidenceUrls | Text | Links to evidence | `https://storage.../evidence1.jpg, https://storage.../evidence2.jpg` |
| O | resolution | Text | How it was resolved | `Carrier credited €75, PSP collected 5 pallets` |
| P | resolvedBy | Text | Who closed | `Ops Manager` |
| Q | resolvedAt | DateTime | Closure timestamp | `2026-01-25T16:00:00Z` |
| R | financialImpact | Number (€) | € value | `-12.50` |

**Dispute Type Values:**
- `quantity_mismatch` - Wrong number of units
- `quality_issue` - Damaged or wrong grade
- `late_delivery` - SLA missed
- `damaged_equipment` - Physical damage
- `wrong_location` - Delivered to wrong place
- `documentation_missing` - No POD/signature

**Priority Values:**
- `low` - <€100 impact, no SLA risk
- `medium` - €100-500, minor SLA risk
- `high` - €500-1500, major SLA risk
- `critical` - >€1500, immediate action required

---

## Priority 5: Create Equipment Cost Configuration Sheet

Create a new sheet named **"CostConfig"** (user-configurable costs):

| Column | Header | Data Type | Description | Example Value | Notes |
|--------|--------|-----------|-------------|---------------|-------|
| A | costType | Text | Type of cost | `equipment_purchase` | Category identifier |
| B | equipmentType | Text | EUR, H1, CAGE, IBC, DOLLY | `EUR` | Equipment category |
| C | purchaseCost | Number (€) | New unit purchase price | `18.50` | Market buying price |
| D | poolingCostMonthly | Number (€) | Monthly pooling fee | `2.50` | PSP monthly fee |
| E | poolingCostPerMove | Number (€) | Per-movement fee | `0.50` | PSP handling fee |
| F | replacementValue | Number (€) | Insurance/invoice value | `15.00` | Standard reconciliation value |
| G | operationalCost | Number (€) | Internal handling cost | `3.50` | Your warehouse labor/storage |
| H | depreciationMonthly | Number (€) | Monthly wear | `0.75` | Owned equipment depreciation |
| I | costNotes | Text | Additional context | `CHEP blue pallet pricing Q1 2026` | Reference info |
| J | lastUpdated | Date | When costs were updated | `2026-01-20` | `=TODAY()` |
| K | updatedBy | Text | Who updated | `Finance Controller` | Audit trail |

**Sample Cost Configuration:**

| costType | equipmentType | purchaseCost | poolingCostMonthly | poolingCostPerMove | replacementValue | operationalCost | depreciationMonthly | costNotes | lastUpdated | updatedBy |
|----------|---------------|--------------|--------------------|--------------------|------------------|-----------------|---------------------|-----------|-------------|-----------|
| equipment_purchase | EUR | 18.50 | 2.50 | 0.50 | 15.00 | 3.50 | 0.75 | Standard EPAL pricing | 2026-01-20 | Finance |
| equipment_purchase | H1 | 32.00 | 3.00 | 0.60 | 25.00 | 4.00 | 1.25 | Plastic H1 1200x1000 | 2026-01-20 | Finance |
| equipment_purchase | CAGE | 175.00 | 8.00 | 2.00 | 150.00 | 12.00 | 5.00 | Gitterbox 800x600x900 | 2026-01-20 | Finance |
| equipment_purchase | IBC | 52.00 | 4.50 | 1.00 | 45.00 | 5.50 | 2.00 | IBC 1000L standard | 2026-01-20 | Finance |
| equipment_purchase | DOLLY | 22.00 | 2.80 | 0.55 | 18.00 | 4.00 | 0.85 | Roll dolly standard | 2026-01-20 | Finance |

**Service Cost Configuration:**

| costType | serviceName | baseCost | perUnitCost | notes | lastUpdated | updatedBy |
|----------|-------------|----------|-------------|-------|-------------|-----------|
| psp_service | pickup | 85.00 | 0.50 | CHEP/LPR standard rates | 2026-01-20 | Finance |
| transport | short_haul | 0.80 | - | Per km, <100km | 2026-01-20 | Ops |
| transport | medium_haul | 0.65 | - | Per km, 100-300km | 2026-01-20 | Ops |
| transport | long_haul | 0.55 | - | Per km, >300km | 2026-01-20 | Ops |
| admin | invoice_fee | 15.00 | - | Processing overhead | 2026-01-20 | Finance |
| admin | dispute_handling | 120.00 | - | Average resolution cost | 2026-01-20 | Ops |
| carrier | ltl_surcharge | 45.00 | - | Return load premium | 2026-01-20 | Ops |
| carrier | ftl_surcharge | 0.00 | - | Included in contract | 2026-01-20 | Ops |

---

## Advanced: Ledger Sheet (Optional)

Create a new sheet named **"Ledger"** for double-entry accounting:

| Column | Header | Data Type | Description | Example Value |
|--------|--------|-----------|-------------|---------------|
| A | id | Number | Entry ID | `1` |
| B | entryDate | Date | Transaction date | `2026-01-23` |
| C | entryType | Text | Type of entry | `reconciliation`, `booking`, `dispute` |
| D | bookingId | Number | Links to Bookings | `1` |
| E | transportId | Number | Links to Transports | `1` |
| F | reconId | Number | Links to Reconciliation | `1` |
| G | companyName | Text | Counterparty | `Regional Transport GmbH` |
| H | equipmentType | Text | EUR, H1, etc. | `EUR` |
| I | debit | Number | Equipment debit | `33` (received) |
| J | credit | Number | Equipment credit | `-28` (delivered) |
| K | balance | Number | Running balance | `5` (surplus) |
| L | status | Text | Entry status | `provisional`, `confirmed`, `disputed` |
| M | description | Text | Entry description | `Booking BK-2026-0001 reconciliation` |
| N | createdAt | DateTime | Entry timestamp | `2026-01-23T14:00:00Z` |

---

## Cost Model Comparison Matrix

The system now evaluates **4 cost models** for each variance:

| Cost Model | When to Use | Calculation | Example (33 EUR pallets) |
|------------|-------------|-------------|--------------------------|
| **Purchase Cost** | Buying new equipment | `quantity × purchaseCost` | `33 × €18.50 = €610.50` |
| **Pooling Cost** | PSP service (3 months) | `quantity × poolingCostMonthly × 3` | `33 × €2.50 × 3 = €247.50` |
| **Replacement Value** | Invoice/insurance claim | `quantity × replacementValue` | `33 × €15.00 = €495.00` |
| **Operational Cost** | Internal handling only | `quantity × operationalCost` | `33 × €3.50 = €115.50` |

**Decision Matrix:**

| Scenario | Best Cost Model | Reasoning |
|----------|-----------------|-----------|
| Carrier lost pallets | Replacement Value | Standard invoice practice |
| Need equipment urgently | Purchase Cost | Market rate for immediate buy |
| Have PSP contract | Pooling Cost | Lower than purchasing |
| Internal transfer | Operational Cost | Only labor/storage cost |
| Insurance claim | Replacement Value | Agreed insured value |

---

## Implementation Priority

### Week 1 (Before Monday Demo):
1. ✅ **Events Sheet** - Add 10 new columns (K-T)
2. ✅ **Transports Sheet** - Create with 19 columns
3. ✅ **CostConfig Sheet** - Create with 11 columns

### Week 2 (After Demo):
4. **Reconciliation Sheet** - Create with 15 columns
5. **Disputes Sheet** - Create with 18 columns

### Week 3 (Advanced):
6. **Ledger Sheet** - Create with 14 columns (optional)

---

## Quick Setup Commands

### Copy-Paste Headers:

**Events (add these 10 columns after J):**
```
eventSubtype	equipmentType	quantity	locationName	locationLat	locationLng	documentUrl	aiExtracted	verifiedBy	verifiedAt
```

**Transports (new sheet):**
```
id	transportNumber	bookingId	status	carrierName	vehicleId	driverName	driverPhone	assignedAt	actualPickupTime	actualDeliveryTime	currentLocation	currentLat	currentLng	equipmentLoaded	equipmentDelivered	podUrl	lastUpdated	notes
```

**CostConfig (new sheet):**
```
costType	equipmentType	purchaseCost	poolingCostMonthly	poolingCostPerMove	replacementValue	operationalCost	depreciationMonthly	costNotes	lastUpdated	updatedBy
```

**Reconciliation (new sheet):**
```
id	reconciliationDate	bookingId	transportId	equipmentType	expectedQty	observedQty	variance	varianceReason	status	financialImpact	resolutionOption	resolvedBy	resolvedAt	notes
```

**Disputes (new sheet):**
```
id	disputeNumber	createdAt	bookingId	transportId	reconId	disputeType	description	raisedBy	assignedTo	status	priority	dueDate	evidenceUrls	resolution	resolvedBy	resolvedAt	financialImpact
```

---

## Data Validation Rules

### Events Sheet:
- **eventSubtype** (Column K): Data validation list
  - `pickup_scan`, `delivery_scan`, `inventory_scan`, `gps_update`, `status_change`, `document_upload`

- **equipmentType** (Column L): Data validation list
  - `EUR`, `H1`, `CAGE`, `IBC`, `DOLLY`

- **aiExtracted** (Column R): Checkbox (TRUE/FALSE)

### Transports Sheet:
- **status** (Column D): Data validation list
  - `assigned`, `in_transit`, `arrived`, `delivered`, `cancelled`

### Reconciliation Sheet:
- **status** (Column J): Data validation list
  - `matched`, `variance`, `disputed`, `resolved`

- **variance** (Column H): Formula
  - `=G2-F2` (observedQty - expectedQty)

- **financialImpact** (Column K): Formula
  - `=H2*VLOOKUP(E2,CostConfig!B:F,4,FALSE)` (variance × replacementValue)

### Disputes Sheet:
- **disputeType** (Column G): Data validation list
  - `quantity_mismatch`, `quality_issue`, `late_delivery`, `damaged_equipment`, `wrong_location`, `documentation_missing`

- **priority** (Column L): Data validation list
  - `low`, `medium`, `high`, `critical`

- **status** (Column K): Data validation list
  - `open`, `investigating`, `resolved`, `closed`

---

This table format makes it easy to copy-paste into Google Sheets and set up the structure quickly!
