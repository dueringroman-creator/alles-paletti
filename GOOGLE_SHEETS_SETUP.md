# Google Sheets Setup Guide

This document explains what needs to be added to your Google Sheets to complete the backend integration.

## Current Sheets (Already Set Up)

You already have these sheets configured:
- ✅ **Bookings** - Equipment movement bookings
- ✅ **Tasks** - Intelligent inbox tasks
- ✅ **Events** - Event log for auditing
- ✅ **Companies** - Partner organizations

## Required Enhancements

### 1. Update Events Sheet (PRIORITY)

The Events sheet needs additional columns to support different event types according to the AI handover document.

**Current Columns:**
```
id | timestamp | eventType | bookingNumber | transportId | details | userName | status | metadata | confidence
```

**Add These Columns** (after confidence):
```
eventSubtype | equipmentType | quantity | locationName | locationLat | locationLng | documentUrl | aiExtracted | verifiedBy | verifiedAt
```

**Column Descriptions:**
- `eventSubtype` - For ScanEvent: "pickup_scan", "delivery_scan", "inventory_scan"
- `equipmentType` - EUR, H1, CAGE, IBC, DOLLY
- `quantity` - Number of units scanned/moved
- `locationName` - Where the event occurred
- `locationLat` / `locationLng` - GPS coordinates
- `documentUrl` - Link to POD, photo, or document
- `aiExtracted` - TRUE/FALSE if data came from AI extraction
- `verifiedBy` - User who verified AI extraction
- `verifiedAt` - Timestamp of verification

**Event Types to Support:**
- `BookingCreated` - When a booking is created (already working)
- `BookingConfirmed` - When carrier confirms
- `ScanEvent` - Equipment scanned (pickup, delivery, inventory)
- `LocationEvent` - GPS update from vehicle
- `StatusEvent` - Status change (in_transit, arrived, delayed)
- `DocumentEvent` - POD uploaded, signed
- `ReconciliationEvent` - Expected vs actual comparison
- `DisputeCreated` - Variance dispute opened
- `DisputeResolved` - Dispute closed

### 2. Create Transports Sheet (NEW)

**Purpose:** Separate "booking" (intent to move) from "transport" (actual execution).

**Why:** Per the AI handover document, a booking is the *intent* to move equipment, but a transport is the *actual execution* with carrier assignment, vehicle, driver, and tracking.

**Columns for Transports Sheet:**
```
id | transportNumber | bookingId | status | carrierName | vehicleId | driverName | driverPhone | assignedAt | actualPickupTime | actualDeliveryTime | currentLocation | currentLat | currentLng | equipmentLoaded | equipmentDelivered | podUrl | lastUpdated | notes
```

**Sample Data:**
```
1 | TRN-2026-0001 | 1 | in_transit | Regional Transport GmbH | DE-MUC-1234 | Hans Müller | +49 151 1234567 | 2026-01-23T08:00:00Z | 2026-01-23T08:30:00Z | | Halfway point | 50.5 | 10.2 | 33 | 0 | | 2026-01-23T12:00:00Z | On schedule
```

**Column Descriptions:**
- `id` - Unique transport ID
- `transportNumber` - Human-readable (TRN-YYYY-0001)
- `bookingId` - Links to Bookings sheet
- `status` - assigned, in_transit, arrived, delivered, cancelled
- `carrierName` - Transport company
- `vehicleId` - License plate or vehicle identifier
- `driverName` / `driverPhone` - Driver details
- `assignedAt` - When carrier accepted the booking
- `actualPickupTime` / `actualDeliveryTime` - Real timestamps
- `currentLocation` / `currentLat` / `currentLng` - Live tracking
- `equipmentLoaded` - Quantity picked up (for reconciliation)
- `equipmentDelivered` - Quantity delivered (for reconciliation)
- `podUrl` - Link to proof of delivery document
- `lastUpdated` - Last tracking update
- `notes` - Transport-specific notes

**Workflow:**
1. Booking created → status: `pending`
2. Carrier confirms → Create Transport record → Booking status: `active`
3. Driver picks up → Transport status: `in_transit` → ScanEvent logged
4. Driver delivers → Transport status: `delivered` → ScanEvent logged
5. Reconciliation compares booking quantity vs equipmentDelivered

### 3. Create Reconciliation Sheet (NEW)

**Purpose:** Track expected vs observed equipment quantities for financial reconciliation.

**Columns:**
```
id | reconciliationDate | bookingId | transportId | equipmentType | expectedQty | observedQty | variance | varianceReason | status | financialImpact | resolvedBy | resolvedAt | notes
```

**Sample Data:**
```
1 | 2026-01-23 | 1 | 1 | EUR | 33 | 28 | -5 | Damaged pallets not loaded | variance | -12.50 | | | 5 pallets damaged at origin
2 | 2026-01-23 | 2 | 2 | EUR | 33 | 33 | 0 | | matched | 0.00 | System | 2026-01-23T14:00:00Z | Perfect match
```

**Column Descriptions:**
- `id` - Reconciliation record ID
- `reconciliationDate` - When reconciliation was run
- `bookingId` / `transportId` - Links to source records
- `equipmentType` - What was expected to move
- `expectedQty` - From booking
- `observedQty` - From POD/scans
- `variance` - Difference (negative = missing, positive = surplus)
- `varianceReason` - Why there's a discrepancy
- `status` - matched, variance, disputed, resolved
- `financialImpact` - € value of variance (e.g., €2.50 per pallet)
- `resolvedBy` / `resolvedAt` - Who closed the variance
- `notes` - Resolution details

### 4. Create Disputes Sheet (NEW)

**Purpose:** First-class dispute objects as per AI handover document.

**Columns:**
```
id | disputeNumber | createdAt | bookingId | transportId | reconId | disputeType | description | raisedBy | assignedTo | status | priority | dueDate | evidenceUrls | resolution | resolvedBy | resolvedAt | financialImpact
```

**Sample Data:**
```
1 | DSP-2026-0001 | 2026-01-23T15:00:00Z | 1 | 1 | 1 | quantity_mismatch | 5 pallets missing from delivery | Consignee | Carrier | open | high | 2026-01-30 | https://... | | | | -12.50
```

**Column Descriptions:**
- `id` - Dispute ID
- `disputeNumber` - Human-readable (DSP-YYYY-0001)
- `createdAt` - When dispute was raised
- `bookingId` / `transportId` / `reconId` - Links to related records
- `disputeType` - quantity_mismatch, quality_issue, late_delivery, damaged_equipment
- `description` - What went wrong
- `raisedBy` / `assignedTo` - Who reported, who's responsible
- `status` - open, investigating, resolved, closed
- `priority` - low, medium, high, critical
- `dueDate` - SLA deadline
- `evidenceUrls` - Comma-separated links to photos, PODs, etc.
- `resolution` - How it was resolved
- `resolvedBy` / `resolvedAt` - Closure details
- `financialImpact` - € value

### 5. Create Ledger Sheet (OPTIONAL - Future)

**Purpose:** Double-entry accounting for equipment movements.

**Columns:**
```
id | entryDate | entryType | bookingId | transportId | reconId | companyName | equipmentType | debit | credit | balance | status | description | createdAt
```

This is for advanced financial tracking. Can be added later once core workflows are stable.

## Implementation Priority

### Phase 1 (Do This First):
1. ✅ Update Events sheet with new columns
2. ✅ Create Transports sheet
3. Test booking creation (should work after Vercel redeploys)

### Phase 2 (After Testing):
1. Create Reconciliation sheet
2. Test reconciliation view with real data
3. Add dispute creation functionality

### Phase 3 (Advanced):
1. Create Disputes sheet
2. Add POD upload functionality
3. Implement dispute resolution workflow
4. Optional: Add Ledger sheet for accounting

## API Endpoints Ready

These endpoints are already implemented:
- ✅ `GET /api/bookings` - List all bookings
- ✅ `POST /api/bookings/create` - Create new booking (just added!)
- ✅ `GET /api/tasks` - List tasks
- ✅ `POST /api/tasks/complete` - Complete a task
- ✅ `GET /api/events` - List events

## Next API Endpoints Needed

Create these files to complete the backend:
- `POST /api/transports/create` - Convert booking to transport
- `POST /api/transports/update` - Update transport status/location
- `GET /api/reconciliation` - Run reconciliation
- `POST /api/reconciliation/resolve` - Resolve variance
- `POST /api/disputes/create` - Create dispute
- `POST /api/disputes/resolve` - Close dispute

## Testing After Setup

1. Go to https://alles-paletti.vercel.app/
2. Click **Bookings** → **New Booking**
3. Fill the form and click **Create Booking**
4. Should see success message with booking number
5. Check your Google Sheets Bookings tab - new row should appear
6. Check Events tab - BookingCreated event should be logged
7. Go to **Reconciliation** tab - should see new booking pending

## Questions?

If any column or sheet structure is unclear, let me know and I can provide more examples or explanations!
