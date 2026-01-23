# STOP-CENTRIC TABLES - GOOGLE SHEETS SETUP GUIDE

**Quick Setup Guide for Stop-Level Equipment Tracking**

---

## TABLE 1: STOPS

Create a new sheet named **"Stops"** with these columns:

### Copy-Paste Headers (Tab-Separated):
```
id	stopNumber	bookingId	bookingNumber	stopSequence	stopType	stopNature	locationName	locationCity	locationLat	locationLng	companyName	companyRole	scheduledArrival	actualArrival	scheduledDeparture	actualDeparture	dwellTimeMinutes	status	confirmationRequired	photoRequired	signatureRequired	qualityCheckRequired	confirmed	confirmedBy	confirmedAt	signatureCaptured	photosUploaded	custodyBeforeCompany	custodyAfterCompany	custodyTransfer	contactPerson	contactPhone	notes	createdAt	updatedAt
```

### Column Definitions:

| Column | Type | Description | Example | Validation |
|--------|------|-------------|---------|------------|
| A: id | Number | Auto-increment stop ID | 1 | |
| B: stopNumber | Text | STP-YYYYMMDD-XXXX | STP-20260123-0001 | |
| C: bookingId | Number | Links to Bookings.id | 1 | Foreign key |
| D: bookingNumber | Text | Human-readable booking ref | BK-2026-0001 | |
| E: stopSequence | Number | Order in journey (1,2,3...) | 1 | |
| F: stopType | Text | Type of stop | origin | Dropdown: `origin, destination, consolidation_hub, psp_service_point, handoff_point, quality_checkpoint, storage_depot` |
| G: stopNature | Text | Human description | Primary shipper handoff | |
| H: locationName | Text | Facility/location name | BMW Munich Warehouse | |
| I: locationCity | Text | City | Munich | |
| J: locationLat | Number | GPS latitude | 48.1351 | |
| K: locationLng | Number | GPS longitude | 11.5820 | |
| L: companyName | Text | Company at this stop | BMW AG | |
| M: companyRole | Text | Role of company | shipper | Dropdown: `shipper, receiver, carrier, psp, warehouse, customs` |
| N: scheduledArrival | DateTime | Planned arrival time | 2026-01-23T08:00:00Z | |
| O: actualArrival | DateTime | Real arrival time | 2026-01-23T08:05:00Z | |
| P: scheduledDeparture | DateTime | Planned departure | 2026-01-23T08:30:00Z | |
| Q: actualDeparture | DateTime | Real departure | 2026-01-23T08:35:00Z | |
| R: dwellTimeMinutes | Number | Time at stop | 30 | Formula: `=(Q2-O2)*24*60` |
| S: status | Text | Stop status | pending | Dropdown: `pending, in_progress, completed, skipped, exception` |
| T: confirmationRequired | Boolean | Needs confirmation? | TRUE | Checkbox |
| U: photoRequired | Boolean | Needs photos? | FALSE | Checkbox |
| V: signatureRequired | Boolean | Needs signature? | TRUE | Checkbox |
| W: qualityCheckRequired | Boolean | Needs quality check? | FALSE | Checkbox |
| X: confirmed | Boolean | Is confirmed? | FALSE | Checkbox |
| Y: confirmedBy | Text | Who confirmed | Hans Schmidt | |
| Z: confirmedAt | DateTime | When confirmed | 2026-01-23T08:35:00Z | |
| AA: signatureCaptured | Boolean | Signature received? | TRUE | Checkbox |
| AB: photosUploaded | Number | Number of photos | 2 | |
| AC: custodyBeforeCompany | Text | Custody before stop | BMW AG | |
| AD: custodyAfterCompany | Text | Custody after stop | Dachser SE | |
| AE: custodyTransfer | Boolean | Custody changed? | TRUE | Checkbox |
| AF: contactPerson | Text | Contact name | Hans Müller | |
| AG: contactPhone | Text | Phone number | +49 151 1234567 | |
| AH: notes | Text | Additional notes | Equipment loaded correctly | |
| AI: createdAt | DateTime | Created timestamp | 2026-01-23T07:00:00Z | `=NOW()` |
| AJ: updatedAt | DateTime | Updated timestamp | 2026-01-23T08:35:00Z | `=NOW()` |

### Sample Data Row:
```
1	STP-20260123-0001	1	BK-2026-0001	1	origin	Primary shipper handoff	BMW Munich Warehouse	Munich	48.1351	11.5820	BMW AG	shipper	2026-01-23T08:00:00Z	2026-01-23T08:05:00Z	2026-01-23T08:30:00Z	2026-01-23T08:35:00Z	30	completed	TRUE	FALSE	TRUE	FALSE	TRUE	Hans Schmidt	2026-01-23T08:35:00Z	TRUE	0	BMW AG	Dachser SE	TRUE	Hans Müller	+49 151 1234567	25 EUR pallets loaded	2026-01-23T07:00:00Z	2026-01-23T08:35:00Z
```

---

## TABLE 2: STOP_TRANSACTIONS

Create a new sheet named **"StopTransactions"** with these columns:

### Copy-Paste Headers (Tab-Separated):
```
id	transactionNumber	stopId	stopNumber	bookingId	bookingNumber	direction	equipmentType	quantity	qualityGrade	fromCompany	toCompany	transactionNature	expectedQuantity	variance	hasVariance	evidenceType	evidenceConfidence	documentUrl	documentPageNumber	transactionValueEur	pspChargeId	timestamp	recordedBy	notes	reconciled	reconciliationId	createdAt
```

### Column Definitions:

| Column | Type | Description | Example | Validation |
|--------|------|-------------|---------|------------|
| A: id | Number | Transaction ID | 1 | |
| B: transactionNumber | Text | STX-YYYYMMDD-XXXXX | STX-20260123-00001 | |
| C: stopId | Number | Links to Stops.id | 1 | Foreign key |
| D: stopNumber | Text | Stop reference | STP-20260123-0001 | |
| E: bookingId | Number | Links to Bookings.id | 1 | Foreign key |
| F: bookingNumber | Text | Booking reference | BK-2026-0001 | |
| G: direction | Text | Equipment flow | out | Dropdown: `in, out` |
| H: equipmentType | Text | EUR, H1, CAGE, IBC, DOLLY | EUR | Dropdown |
| I: quantity | Number | Units | 25 | |
| J: qualityGrade | Text | A, B, damaged, mixed | A | Dropdown |
| K: fromCompany | Text | Giving party | BMW AG | |
| L: toCompany | Text | Receiving party | Dachser SE | |
| M: transactionNature | Text | Type of transaction | pickup | Dropdown: `pickup, delivery, handoff, exchange, inspection, adjustment, return` |
| N: expectedQuantity | Number | What was expected | 25 | |
| O: variance | Number | Difference | 0 | Formula: `=I2-N2` |
| P: hasVariance | Boolean | Is there variance? | FALSE | Formula: `=O2<>0` |
| Q: evidenceType | Text | Type of proof | scan | Dropdown: `scan, document, photo, signature, manual, ai_extracted` |
| R: evidenceConfidence | Number | Confidence 0-1 | 0.98 | |
| S: documentUrl | Text | Link to document | https://... | |
| T: documentPageNumber | Number | Specific page | 3 | |
| U: transactionValueEur | Number | € value | 375.00 | Formula: `=I2*15` (quantity × value) |
| V: pspChargeId | Number | PSP charge ref | 1 | |
| W: timestamp | DateTime | Transaction time | 2026-01-23T08:05:00Z | |
| X: recordedBy | Text | Who recorded | Hans Schmidt | |
| Y: notes | Text | Additional info | All pallets scanned | |
| Z: reconciled | Boolean | Is reconciled? | FALSE | Checkbox |
| AA: reconciliationId | Number | Reconciliation ref | 1 | |
| AB: createdAt | DateTime | Created | 2026-01-23T08:05:00Z | `=NOW()` |

### Sample Data Rows:

**Transaction 1 (Pickup - Equipment OUT):**
```
1	STX-20260123-00001	1	STP-20260123-0001	1	BK-2026-0001	out	EUR	25	A	BMW AG	Dachser SE	pickup	25	0	FALSE	scan	0.98		 	375.00		2026-01-23T08:05:00Z	Scanner App	All units scanned individually	FALSE		2026-01-23T08:05:00Z
```

**Transaction 2 (PSP Exchange - IN):**
```
5	STX-20260123-00005	3	STP-20260123-0003	1	BK-2026-0001	in	EUR	5	A	Dachser SE	PalletPool GmbH	exchange	5	0	FALSE	document	1.00	https://...	 	75.00	1	2026-01-23T11:20:00Z	PSP Staff	Quality exchange A to B	FALSE		2026-01-23T11:20:00Z
```

**Transaction 3 (Delivery with Variance):**
```
10	STX-20260123-00010	5	STP-20260123-0005	1	BK-2026-0001	in	EUR	23	A	Regional Transport	Customer Hamburg	delivery	25	-2	TRUE	document	0.95	https://...	3	345.00		2026-01-23T14:25:00Z	Receiving Staff	2 pallets missing	FALSE	1	2026-01-23T14:25:00Z
```

---

## TABLE 3: PSP_CHARGES

Create a new sheet named **"PSPCharges"** with these columns:

### Copy-Paste Headers (Tab-Separated):
```
id	chargeNumber	stopId	stopNumber	bookingId	bookingNumber	pspCompany	chargedToCompany	chargeType	equipmentType	quantity	baseChargeEur	perUnitChargeEur	totalChargeEur	vatRate	vatAmountEur	totalInclVatEur	currency	pspVoucherNumber	documentUrl	status	approvedBy	approvedAt	disputeReason	disputedAt	paidAt	notes	createdAt
```

### Column Definitions:

| Column | Type | Description | Example | Validation |
|--------|------|-------------|---------|------------|
| A: id | Number | Charge ID | 1 | |
| B: chargeNumber | Text | PSP-YYYY-XXXX | PSP-2026-0001 | |
| C: stopId | Number | Stop where incurred | 3 | Foreign key |
| D: stopNumber | Text | Stop reference | STP-20260123-0003 | |
| E: bookingId | Number | Booking reference | 1 | Foreign key |
| F: bookingNumber | Text | Booking ref | BK-2026-0001 | |
| G: pspCompany | Text | PSP provider | PalletPool GmbH | |
| H: chargedToCompany | Text | Who pays | Dachser SE | |
| I: chargeType | Text | Type of charge | exchange_fee | Dropdown: `exchange_fee, inspection_fee, storage_fee, handling_fee, damage_repair, rental_fee` |
| J: equipmentType | Text | EUR, H1, etc. | EUR | Dropdown |
| K: quantity | Number | Units | 5 | |
| L: baseChargeEur | Number | Base cost | 85.00 | |
| M: perUnitChargeEur | Number | Per-unit cost | 0.50 | |
| N: totalChargeEur | Number | Total before VAT | 87.50 | Formula: `=L2+(M2*K2)` |
| O: vatRate | Number | VAT % | 19.00 | |
| P: vatAmountEur | Number | VAT amount | 16.63 | Formula: `=N2*O2/100` |
| Q: totalInclVatEur | Number | Total with VAT | 104.13 | Formula: `=N2+P2` |
| R: currency | Text | Currency | EUR | |
| S: pspVoucherNumber | Text | PSP internal ref | V-2026-4567 | |
| T: documentUrl | Text | Scanned voucher | https://... | |
| U: status | Text | Charge status | pending | Dropdown: `pending, approved, disputed, paid, cancelled` |
| V: approvedBy | Text | Who approved | Finance Controller | |
| W: approvedAt | DateTime | Approval time | 2026-01-24T10:00:00Z | |
| X: disputeReason | Text | Why disputed |  | |
| Y: disputedAt | DateTime | Dispute time |  | |
| Z: paidAt | DateTime | Payment time |  | |
| AA: notes | Text | Additional info | Quality exchange 5A to 5B | |
| AB: createdAt | DateTime | Created | 2026-01-23T11:20:00Z | `=NOW()` |

### Sample Data Row:
```
1	PSP-2026-0001	3	STP-20260123-0003	1	BK-2026-0001	PalletPool GmbH	Dachser SE	exchange_fee	EUR	5	85.00	0.50	87.50	19.00	16.63	104.13	EUR	V-2026-4567	https://storage.../voucher.pdf	approved	Finance Controller	2026-01-24T10:00:00Z				Quality exchange 5A to 5B	2026-01-23T11:20:00Z
```

---

## DATA IMPORT INSTRUCTIONS

### Step 1: Create the Sheets
1. Open your Google Sheet (Logistikbude 3.0 Backend)
2. Create three new sheets:
   - **Stops**
   - **StopTransactions**
   - **PSPCharges**

### Step 2: Add Headers
1. For each sheet, copy the tab-separated headers above
2. Paste into row 1 of each sheet
3. Format header row (bold, freeze, background color)

### Step 3: Set Up Data Validations

**Stops Sheet:**
- Column F (stopType): Dropdown list
  - Values: `origin, destination, consolidation_hub, psp_service_point, handoff_point, quality_checkpoint, storage_depot`
- Column M (companyRole): Dropdown list
  - Values: `shipper, receiver, carrier, psp, warehouse, customs`
- Column S (status): Dropdown list
  - Values: `pending, in_progress, completed, skipped, exception`
- Columns T, U, V, W, X, AA, AE: Checkbox (TRUE/FALSE)

**StopTransactions Sheet:**
- Column G (direction): Dropdown list
  - Values: `in, out`
- Column H (equipmentType): Dropdown list
  - Values: `EUR, H1, CAGE, IBC, DOLLY`
- Column J (qualityGrade): Dropdown list
  - Values: `A, B, damaged, mixed`
- Column M (transactionNature): Dropdown list
  - Values: `pickup, delivery, handoff, exchange, inspection, adjustment, return`
- Column Q (evidenceType): Dropdown list
  - Values: `scan, document, photo, signature, manual, ai_extracted`
- Columns P, Z: Checkbox (TRUE/FALSE)

**PSPCharges Sheet:**
- Column I (chargeType): Dropdown list
  - Values: `exchange_fee, inspection_fee, storage_fee, handling_fee, damage_repair, rental_fee`
- Column J (equipmentType): Dropdown list
  - Values: `EUR, H1, CAGE, IBC, DOLLY`
- Column U (status): Dropdown list
  - Values: `pending, approved, disputed, paid, cancelled`

### Step 4: Import Generated Test Data

You have generated test data in `/test-data/`:
- `stops.json` - 405 stops
- `transactions.json` - 610 transactions
- `events.json` - 1377 events
- `bookings.json` - 100 bookings with embedded stops

**Option A: Manual Import (Recommended for demo)**
1. Open `stops.json` in a text editor
2. Convert JSON to CSV using online tool or script
3. Import to Google Sheets via File → Import

**Option B: Script Import (For production)**
Create an import script using Google Sheets API:

```javascript
// scripts/import-to-sheets.js
const { google } = require('googleapis');
const fs = require('fs');

async function importStops() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const stops = JSON.parse(fs.readFileSync('./test-data/stops.json'));

  const values = stops.map(stop => [
    stop.stopNumber,
    stop.bookingId,
    stop.stopSequence,
    stop.stopType,
    stop.locationName,
    // ... map all fields
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: 'YOUR_SHEET_ID',
    range: 'Stops!A2',
    valueInputOption: 'RAW',
    resource: { values }
  });
}
```

### Step 5: Verify Data

**Run these validation queries:**

1. **Total Stops per Booking:**
```sql
SELECT bookingNumber, COUNT(*) as total_stops
FROM Stops
GROUP BY bookingNumber
ORDER BY total_stops DESC
```

2. **Stops with Variances:**
```sql
SELECT s.stopNumber, st.transactionNumber, st.variance
FROM Stops s
JOIN StopTransactions st ON s.id = st.stopId
WHERE st.hasVariance = TRUE
```

3. **PSP Charges Summary:**
```sql
SELECT pspCompany, COUNT(*) as total_charges, SUM(totalInclVatEur) as total_amount
FROM PSPCharges
GROUP BY pspCompany
```

---

## RELATIONSHIPS

```
Bookings (existing)
    ↓ (1:N)
Stops
    ↓ (1:N)
StopTransactions
    ↓ (0:1)
PSPCharges
```

**Foreign Keys:**
- `Stops.bookingId` → `Bookings.id`
- `StopTransactions.stopId` → `Stops.id`
- `StopTransactions.bookingId` → `Bookings.id`
- `PSPCharges.stopId` → `Stops.id`
- `PSPCharges.bookingId` → `Bookings.id`

---

## NEXT STEPS AFTER SETUP

Once you have the tables set up:

1. ✅ **Test with sample data** - Import 5-10 bookings manually
2. ✅ **Build API endpoints** - Create POST/GET endpoints for stops
3. ✅ **Create UI components** - Build stop timeline visualization
4. ✅ **Import full test data** - Import all 100 bookings with 405 stops

---

**Ready to proceed?** After you set up these three sheets, I'll build the API endpoints to read/write this data!
