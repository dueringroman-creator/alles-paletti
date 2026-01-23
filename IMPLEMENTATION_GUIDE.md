# LOGISTIKBUDE - GOOGLE SHEETS BACKEND IMPLEMENTATION GUIDE
## Complete Step-by-Step Guide for Sunday Demo

**Timeline:** Thursday → Sunday (4 days)
**Goal:** Working demo with Google Sheets backend by Sunday
**Cost:** €0 (all free tiers)

---

## 📋 TABLE OF CONTENTS

1. [Day 1 (Thursday): Google Sheets + API Setup](#day-1-thursday)
2. [Day 2 (Friday): Vercel Functions + Integration](#day-2-friday)
3. [Day 3 (Saturday): Demo Features + Polish](#day-3-saturday)
4. [Day 4 (Sunday): Testing + Deployment](#day-4-sunday)
5. [Complete Code Reference](#complete-code)
6. [Demo Script](#demo-script)
7. [Troubleshooting](#troubleshooting)

---

## DAY 1 (THURSDAY): GOOGLE SHEETS + API SETUP

### PART 1: Create Google Sheet (30 minutes)

#### Step 1.1: Create New Spreadsheet

1. Go to https://sheets.google.com
2. Click "Blank" to create new spreadsheet
3. Rename to: **"Logistikbude-Demo-Backend"**
4. Share settings: Keep private (only you have access)

#### Step 1.2: Create Sheet Tabs

Create 4 tabs with these exact names:
- `Bookings`
- `Tasks`
- `Events`
- `Companies`

#### Step 1.3: Set Up Bookings Sheet

**Tab: Bookings**

Row 1 (Headers):
```
A: id
B: bookingNumber
C: status
D: originName
E: originCity
F: originLat
G: originLng
H: destinationName
I: destinationCity
J: destinationLat
K: destinationLng
L: shipperName
M: consigneeName
N: carrierName
O: carrierType
P: quantity
Q: qualityGrade
R: scheduledPickup
S: scheduledDelivery
T: actualPickup
U: actualDelivery
V: currentNode
W: progress
X: lastUpdated
```

Row 2 (Sample Data):
```
1 | BK-20260122-3421 | in_transit | BMW Munich Warehouse | Munich | 48.1351 | 11.5820 | Customer Warehouse Hamburg | Hamburg | 53.5511 | 9.9937 | BMW AG | Customer GmbH | Dachser SE | EUR Pallet | 25 | A | 2026-01-22T08:00:00Z | 2026-01-22T14:30:00Z | 2026-01-22T08:15:00Z | | 2 | 50 | 2026-01-22T10:00:00Z
```

Row 3 (Sample Data):
```
2 | BK-20260122-3422 | completed | BASF Ludwigshafen | Ludwigshafen | 49.4821 | 8.4359 | Customer Depot | Stuttgart | 48.7758 | 9.1829 | BASF SE | Customer GmbH | Regional Transport | H1 Plastic | 30 | B | 2026-01-21T09:00:00Z | 2026-01-21T15:00:00Z | 2026-01-21T09:10:00Z | 2026-01-21T14:50:00Z | 4 | 100 | 2026-01-21T15:00:00Z
```

#### Step 1.4: Set Up Tasks Sheet

**Tab: Tasks**

Row 1 (Headers):
```
A: id
B: type
C: category
D: priority
E: urgencyScore
F: status
G: title
H: description
I: dueDate
J: hoursUntilDue
K: isOverdue
L: assignedToName
M: assignedToRole
N: bookingId
O: bookingNumber
P: companyName
Q: progress
R: createdAt
S: updatedAt
```

Row 2 (Sample Data):
```
1 | pod_missing | documentation | urgent | 95 | open | POD missing for BMW → Dachser delivery | Proof of Delivery not uploaded 6 hours after scheduled delivery | 2026-01-22T20:00:00Z | 2.5 | FALSE | Roman W. | logistics_manager | 1 | BK-20260122-3421 | Dachser SE | 0 | 2026-01-22T14:00:00Z | 2026-01-22T14:00:00Z
```

Row 3 (Sample Data):
```
2 | booking_draft | operational | medium | 60 | open | Complete draft booking BASF → Customer | Booking created but missing carrier assignment | 2026-01-23T12:00:00Z | 22 | FALSE | Roman W. | logistics_manager | 3 | BK-20260122-3425 | BASF SE | 60 | 2026-01-22T10:00:00Z | 2026-01-22T10:00:00Z
```

#### Step 1.5: Set Up Events Sheet

**Tab: Events**

Row 1 (Headers):
```
A: id
B: timestamp
C: eventType
D: bookingId
E: bookingNumber
F: taskId
G: userId
H: userName
I: details
J: metadata
```

Row 2 (Sample Data):
```
1 | 2026-01-22T08:15:00Z | booking_pickup_confirmed | 1 | BK-20260122-3421 | | 1 | Roman W. | Pickup confirmed at BMW Munich | {"actualQuantity": 25, "actualQuality": "A", "confirmedBy": "Hans Schmidt"}
```

Row 3 (Sample Data):
```
2 | 2026-01-22T14:00:00Z | task_created | 1 | BK-20260122-3421 | 1 | 0 | System | POD missing task auto-created | {"reason": "delivery_overdue", "hours": 6}
```

#### Step 1.6: Set Up Companies Sheet

**Tab: Companies**

Row 1 (Headers):
```
A: id
B: name
C: type
D: city
E: country
F: lat
G: lng
H: contactPerson
I: contactEmail
J: contactPhone
K: performance
```

Row 2-5 (Sample Data):
```
1 | BMW AG | facility | Munich | Germany | 48.1351 | 11.5820 | Hans Schmidt | hans.schmidt@bmw.de | +49 89 12345678 | 98.5
2 | Dachser SE | carrier | Munich | Germany | 48.1351 | 11.5820 | Maria Müller | maria.mueller@dachser.com | +49 89 87654321 | 95.2
3 | Regional Transport GmbH | carrier | Stuttgart | Germany | 48.7758 | 9.1829 | Thomas Weber | t.weber@regional.de | +49 711 11111111 | 92.8
4 | Customer GmbH | facility | Hamburg | Germany | 53.5511 | 9.9937 | Peter Klein | peter.klein@customer.de | +49 40 22222222 | 97.1
```

✅ **Checkpoint:** Your Google Sheet now has 4 tabs with sample data

---

### PART 2: Google Sheets API Setup (1 hour)

#### Step 2.1: Enable Google Sheets API

1. Go to https://console.cloud.google.com
2. Create new project: "Logistikbude-Demo"
3. Click "Enable APIs and Services"
4. Search for "Google Sheets API"
5. Click "Enable"

#### Step 2.2: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `logistikbude-sheets-api`
4. Description: `Service account for Logistikbude demo backend`
5. Click "Create and Continue"
6. Role: Select "Editor"
7. Click "Continue" → "Done"

#### Step 2.3: Generate Credentials

1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Click "Create"
6. File downloads: `logistikbude-sheets-api-xxxxxx.json`
7. **SAVE THIS FILE SECURELY** ⚠️

#### Step 2.4: Share Sheet with Service Account

1. Open your service account JSON file
2. Copy the `client_email` value (looks like: `...@...iam.gserviceaccount.com`)
3. Go back to your Google Sheet
4. Click "Share" button
5. Paste the service account email
6. Give "Editor" access
7. Click "Send" (uncheck "Notify people")

#### Step 2.5: Get Sheet ID

1. Open your Google Sheet
2. Look at URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the SHEET_ID (between `/d/` and `/edit`)
4. Save this for later

✅ **Checkpoint:** You have:
- Service account JSON file
- Sheet ID
- API enabled

---

### PART 3: Vercel Project Setup (30 minutes)

#### Step 3.1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

#### Step 3.2: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 3.3: Login to Vercel

```bash
vercel login
```

#### Step 3.4: Create API Directory

```bash
cd /home/user/alles-paletti
mkdir -p api
```

✅ **Checkpoint:** Ready to create serverless functions

---

### PART 4: Create Serverless Functions (2 hours)

#### Step 4.1: Install Dependencies

Create `package.json`:

```bash
cat > package.json << 'EOF'
{
  "name": "logistikbude-api",
  "version": "1.0.0",
  "description": "Serverless API for Logistikbude demo",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "googleapis": "^128.0.0"
  }
}
EOF
```

Install dependencies:

```bash
npm install
```

#### Step 4.2: Create Environment Variables

Create `.env` file (DO NOT commit this):

```bash
cat > .env << 'EOF'
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY=your_private_key_here
EOF
```

Replace values from your service account JSON:
- `GOOGLE_SHEET_ID`: Your sheet ID from earlier
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from JSON
- `GOOGLE_PRIVATE_KEY`: `private_key` from JSON (keep the `\n` characters)

#### Step 4.3: Create Sheets Helper

Create `api/_lib/sheets.js`:

```javascript
const { google } = require('googleapis');

// Initialize Google Sheets client
function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Read data from a sheet
async function readSheet(sheetName, range = 'A1:Z1000') {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return response.data.values || [];
}

// Write data to a sheet (append)
async function appendToSheet(sheetName, values) {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    resource: { values },
  });
  return response.data;
}

// Update specific row
async function updateRow(sheetName, rowNumber, values) {
  const sheets = getSheets();
  const range = `${sheetName}!A${rowNumber}:Z${rowNumber}`;
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'RAW',
    resource: { values: [values] },
  });
  return response.data;
}

// Parse sheet data to JSON
function parseSheetToJSON(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

module.exports = {
  readSheet,
  appendToSheet,
  updateRow,
  parseSheetToJSON,
};
```

#### Step 4.4: Create GET /api/bookings Endpoint

Create `api/bookings.js`:

```javascript
const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Read bookings from Google Sheets
    const data = await readSheet('Bookings');
    const bookings = parseSheetToJSON(data);

    // Transform to match frontend format
    const formatted = bookings.map(booking => ({
      id: parseInt(booking.id),
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      origin: {
        name: booking.originName,
        city: booking.originCity,
        coordinates: [parseFloat(booking.originLat), parseFloat(booking.originLng)],
      },
      destination: {
        name: booking.destinationName,
        city: booking.destinationCity,
        coordinates: [parseFloat(booking.destinationLat), parseFloat(booking.destinationLng)],
      },
      shipper: { name: booking.shipperName },
      consignee: { name: booking.consigneeName },
      carrier: { name: booking.carrierName },
      loadCarriers: {
        type: booking.carrierType,
        quantity: parseInt(booking.quantity),
        qualityGrade: booking.qualityGrade,
      },
      scheduledPickup: booking.scheduledPickup,
      scheduledDelivery: booking.scheduledDelivery,
      actualPickup: booking.actualPickup || null,
      actualDelivery: booking.actualDelivery || null,
      currentNode: parseInt(booking.currentNode),
      progress: parseInt(booking.progress),
      lastUpdated: booking.lastUpdated,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

#### Step 4.5: Create GET /api/tasks Endpoint

Create `api/tasks.js`:

```javascript
const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await readSheet('Tasks');
    const tasks = parseSheetToJSON(data);

    const formatted = tasks.map(task => ({
      id: parseInt(task.id),
      type: task.type,
      category: task.category,
      priority: task.priority,
      urgencyScore: parseInt(task.urgencyScore),
      status: task.status,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || null,
      hoursUntilDue: task.hoursUntilDue ? parseFloat(task.hoursUntilDue) : null,
      isOverdue: task.isOverdue === 'TRUE',
      assignedTo: {
        name: task.assignedToName,
        role: task.assignedToRole,
      },
      context: {
        bookingId: task.bookingId ? parseInt(task.bookingId) : null,
        bookingNumber: task.bookingNumber || null,
        companyName: task.companyName || null,
      },
      progress: parseInt(task.progress),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

#### Step 4.6: Create POST /api/tasks/[id]/complete Endpoint

Create `api/tasks/complete.js`:

```javascript
const { readSheet, updateRow, appendToSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { taskId, userId = 'Demo User', notes = '' } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, error: 'taskId required' });
    }

    // Read tasks sheet
    const tasksData = await readSheet('Tasks');
    const tasks = parseSheetToJSON(tasksData);

    // Find task
    const taskIndex = tasks.findIndex(t => parseInt(t.id) === parseInt(taskId));
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const task = tasks[taskIndex];
    const rowNumber = taskIndex + 2; // +2 because of header row and 0-index

    // Update task status to completed
    const now = new Date().toISOString();
    const updatedRow = [
      task.id,
      task.type,
      task.category,
      task.priority,
      task.urgencyScore,
      'completed', // status
      task.title,
      task.description,
      task.dueDate,
      task.hoursUntilDue,
      task.isOverdue,
      task.assignedToName,
      task.assignedToRole,
      task.bookingId,
      task.bookingNumber,
      task.companyName,
      '100', // progress
      task.createdAt,
      now, // updatedAt
    ];

    await updateRow('Tasks', rowNumber, updatedRow);

    // Log event
    const eventsData = await readSheet('Events');
    const nextEventId = eventsData.length; // New ID

    const eventRow = [
      nextEventId,
      now,
      'task_completed',
      task.bookingId || '',
      task.bookingNumber || '',
      task.id,
      userId,
      userId,
      `Task completed: ${task.title}`,
      JSON.stringify({ notes }),
    ];

    await appendToSheet('Events', [eventRow]);

    res.status(200).json({
      success: true,
      message: 'Task completed successfully',
      taskId: parseInt(taskId),
      eventId: nextEventId,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

#### Step 4.7: Create POST /api/bookings/update Endpoint

Create `api/bookings/update.js`:

```javascript
const { readSheet, updateRow, appendToSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      bookingId,
      nodeSequence,
      actualQuantity,
      actualQuality,
      actualTime,
      userId = 'Demo User',
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId required' });
    }

    // Read bookings
    const bookingsData = await readSheet('Bookings');
    const bookings = parseSheetToJSON(bookingsData);

    const bookingIndex = bookings.findIndex(b => parseInt(b.id) === parseInt(bookingId));
    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookings[bookingIndex];
    const rowNumber = bookingIndex + 2;

    // Calculate new progress
    const totalNodes = 4; // Assuming 4 nodes for demo
    const newCurrentNode = Math.min(parseInt(booking.currentNode) + 1, totalNodes);
    const newProgress = Math.round((newCurrentNode / totalNodes) * 100);

    const now = new Date().toISOString();
    const updatedRow = [
      booking.id,
      booking.bookingNumber,
      booking.status,
      booking.originName,
      booking.originCity,
      booking.originLat,
      booking.originLng,
      booking.destinationName,
      booking.destinationCity,
      booking.destinationLat,
      booking.destinationLng,
      booking.shipperName,
      booking.consigneeName,
      booking.carrierName,
      booking.carrierType,
      booking.quantity,
      booking.qualityGrade,
      booking.scheduledPickup,
      booking.scheduledDelivery,
      booking.actualPickup || actualTime || now,
      booking.actualDelivery,
      newCurrentNode,
      newProgress,
      now,
    ];

    await updateRow('Bookings', rowNumber, updatedRow);

    // Log event
    const eventsData = await readSheet('Events');
    const nextEventId = eventsData.length;

    const eventRow = [
      nextEventId,
      actualTime || now,
      'node_confirmed',
      booking.id,
      booking.bookingNumber,
      '',
      userId,
      userId,
      `Node ${nodeSequence} confirmed`,
      JSON.stringify({
        nodeSequence,
        actualQuantity,
        actualQuality,
        actualTime: actualTime || now,
      }),
    ];

    await appendToSheet('Events', [eventRow]);

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      bookingId: parseInt(bookingId),
      newCurrentNode,
      newProgress,
      eventId: nextEventId,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

#### Step 4.8: Create GET /api/events Endpoint

Create `api/events.js`:

```javascript
const { readSheet, parseSheetToJSON } = require('./_lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { bookingId, limit = '50' } = req.query;

    const data = await readSheet('Events');
    let events = parseSheetToJSON(data);

    // Filter by bookingId if provided
    if (bookingId) {
      events = events.filter(e => e.bookingId === bookingId);
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    events = events.slice(0, parseInt(limit));

    const formatted = events.map(event => ({
      id: parseInt(event.id),
      timestamp: event.timestamp,
      eventType: event.eventType,
      bookingId: event.bookingId ? parseInt(event.bookingId) : null,
      bookingNumber: event.bookingNumber || null,
      taskId: event.taskId ? parseInt(event.taskId) : null,
      userId: event.userId || null,
      userName: event.userName,
      details: event.details,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

✅ **Checkpoint Day 1:** You now have:
- Google Sheet with sample data
- Google Sheets API enabled
- Service account created
- 5 serverless API endpoints created

---

## DAY 2 (FRIDAY): FRONTEND INTEGRATION

### PART 5: Update Frontend to Use API (3 hours)

#### Step 5.1: Create API Client Module

Create `js/api.js`:

```javascript
// API Base URL - Update this after Vercel deployment
const API_BASE_URL = 'https://your-vercel-deployment.vercel.app/api';

// API Client
const api = {
  // Fetch bookings
  async getBookings() {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  // Fetch tasks
  async getTasks() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Complete a task
  async completeTask(taskId, userId = 'Demo User', notes = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, userId, notes }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  // Update booking node
  async updateBooking(bookingId, nodeSequence, details) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          nodeSequence,
          ...details,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Fetch events
  async getEvents(bookingId = null, limit = 50) {
    try {
      const url = bookingId
        ? `${API_BASE_URL}/events?bookingId=${bookingId}&limit=${limit}`
        : `${API_BASE_URL}/events?limit=${limit}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },
};

// Export for use in other files
window.logistikbudeAPI = api;
```

#### Step 5.2: Update HTML to Include API Client

Edit `index.html` - add before the closing `</body>` tag:

```html
<script src="js/api.js"></script>
<script src="js/logic.js"></script>
```

#### Step 5.3: Update logic.js to Use API

Edit `js/logic.js` - Add at the top:

```javascript
// ============================================
// API INTEGRATION
// ============================================

let USE_LIVE_DATA = false; // Toggle for demo mode
let cachedBookings = [];
let cachedTasks = [];

// Load data on init
async function loadLiveData() {
    if (!USE_LIVE_DATA) return;

    showLoading('Loading data...');

    try {
        // Fetch from API
        cachedBookings = await window.logistikbudeAPI.getBookings();
        cachedTasks = await window.logistikbudeAPI.getTasks();

        // Update UI
        renderInboxTasks();

        hideLoading();
        showToast('Data loaded from Google Sheets', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        showToast('Error loading data', 'error');
    }
}

// Helper: Show loading overlay
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Helper: Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

Add after existing `renderInboxTasks()` function:

```javascript
// Update renderInboxTasks to use live data if available
function renderInboxTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    const tasksToRender = USE_LIVE_DATA && cachedTasks.length > 0
        ? cachedTasks
        : inboxTasks;

    taskList.innerHTML = tasksToRender.map(task => {
        const priorityClass = task.priority === 'urgent' ? 'critical' :
                             task.priority === 'high' ? 'warning' : '';

        return `<div class="task-item ${priorityClass}" onclick="handleTaskClick(${task.id})">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${task.title}</div>
            <div style="font-size: 0.75rem; color: #64748b;">📍 ${task.context?.companyName || 'N/A'}</div>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">
                Status: <span style="color: ${task.status === 'completed' ? '#22c55e' : '#eab308'}">${task.status}</span>
            </div>
        </div>`;
    }).join('');
}
```

Add new function for task completion:

```javascript
// Complete a task
async function completeTask(taskId) {
    if (!USE_LIVE_DATA) {
        showToast('Live mode disabled - using demo data', 'info');
        return;
    }

    showLoading('Completing task...');

    const result = await window.logistikbudeAPI.completeTask(taskId, 'Demo User', 'Completed via demo');

    hideLoading();

    if (result.success) {
        showToast('Task completed! Check Google Sheet.', 'success');

        // Reload data
        await loadLiveData();
    } else {
        showToast('Error completing task: ' + result.error, 'error');
    }
}
```

#### Step 5.4: Add CSS for Loading & Toasts

Add to `css/style.css`:

```css
/* LOADING OVERLAY */
#loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.loading-content {
    text-align: center;
    color: var(--text);
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--border);
    border-top-color: var(--blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* TOAST NOTIFICATIONS */
.toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: var(--bg-panel);
    color: var(--text);
    padding: 1rem 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--blue);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 10000;
    max-width: 400px;
}

.toast.show {
    opacity: 1;
    transform: translateY(0);
}

.toast-success {
    border-left-color: var(--status-success);
}

.toast-error {
    border-left-color: var(--status-error);
}

.toast-warning {
    border-left-color: var(--status-warning);
}

/* DEMO MODE TOGGLE */
.demo-controls {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: var(--bg-panel);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
}

.demo-controls label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
}

.demo-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.3s;
}

.demo-toggle.active {
    background: var(--blue);
}

.demo-toggle::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}

.demo-toggle.active::after {
    transform: translateX(20px);
}
```

#### Step 5.5: Add Demo Mode Toggle to HTML

Add after opening `<body>` tag in `index.html`:

```html
<div class="demo-controls">
    <label for="demo-toggle">Live Data</label>
    <div class="demo-toggle" id="demo-toggle" onclick="toggleDemoMode()"></div>
</div>
```

Add to `js/logic.js`:

```javascript
function toggleDemoMode() {
    USE_LIVE_DATA = !USE_LIVE_DATA;
    const toggle = document.getElementById('demo-toggle');

    if (USE_LIVE_DATA) {
        toggle.classList.add('active');
        showToast('Live mode enabled - connecting to Google Sheets', 'info');
        loadLiveData();
    } else {
        toggle.classList.remove('active');
        showToast('Live mode disabled - using demo data', 'info');
    }
}
```

✅ **Checkpoint Day 2:** Frontend now has:
- API client module
- Loading states
- Toast notifications
- Demo mode toggle
- Task completion integration

---

## DAY 3 (SATURDAY): DEMO FEATURES + POLISH

### PART 6: Add Interactive Features (4 hours)

#### Step 6.1: Add Task Detail Modal

Add to `index.html` before closing `</body>`:

```html
<div id="task-detail-modal" class="modal hidden">
    <div class="modal-content" style="max-width: 800px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 id="task-modal-title">Task Details</h3>
            <button onclick="closeTaskModal()" style="background: transparent; border: none; color: var(--text); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>

        <div id="task-modal-content">
            <!-- Dynamic content -->
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button id="task-complete-btn" onclick="completeCurrentTask()" class="btn" style="flex: 1; background: var(--status-success);">
                ✓ Complete Task
            </button>
            <button onclick="closeTaskModal()" class="btn" style="flex: 1; background: var(--border);">
                Cancel
            </button>
        </div>
    </div>
</div>
```

Add to `js/logic.js`:

```javascript
let currentTask = null;

function handleTaskClick(taskId) {
    const tasksToSearch = USE_LIVE_DATA && cachedTasks.length > 0
        ? cachedTasks
        : inboxTasks;

    const task = tasksToSearch.find(t => t.id === taskId);
    if (!task) return;

    currentTask = task;
    openTaskDetailModal(task);
}

function openTaskDetailModal(task) {
    const modal = document.getElementById('task-detail-modal');
    const titleEl = document.getElementById('task-modal-title');
    const contentEl = document.getElementById('task-modal-content');

    titleEl.textContent = task.title;

    contentEl.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Priority</label>
                    <div style="margin-top: 0.25rem;">
                        <span class="badge" style="background: ${
                            task.priority === 'urgent' ? 'var(--priority-urgent)' :
                            task.priority === 'high' ? 'var(--priority-high)' :
                            'var(--priority-medium)'
                        };">${task.priority.toUpperCase()}</span>
                    </div>
                </div>
                <div>
                    <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Status</label>
                    <div style="margin-top: 0.25rem;">
                        <span class="badge" style="background: ${
                            task.status === 'completed' ? 'var(--status-success)' :
                            task.status === 'in_progress' ? 'var(--status-warning)' :
                            'var(--status-info)'
                        };">${task.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Description</label>
                <p style="margin-top: 0.5rem; color: var(--text);">${task.description}</p>
            </div>

            <div style="background: var(--bg-dark); padding: 1rem; border-radius: 8px;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.875rem;">Context</h4>
                <div style="display: grid; gap: 0.5rem; font-size: 0.875rem;">
                    ${task.context?.bookingNumber ? `<div>📦 Booking: <strong>${task.context.bookingNumber}</strong></div>` : ''}
                    ${task.context?.companyName ? `<div>🏢 Company: <strong>${task.context.companyName}</strong></div>` : ''}
                    ${task.assignedTo?.name ? `<div>👤 Assigned: <strong>${task.assignedTo.name}</strong> (${task.assignedTo.role})</div>` : ''}
                    ${task.dueDate ? `<div>⏰ Due: <strong>${new Date(task.dueDate).toLocaleString()}</strong></div>` : ''}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Progress</label>
                    <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; height: 8px; background: var(--bg-dark); border-radius: 4px; overflow: hidden; width: 200px;">
                            <div style="height: 100%; background: var(--blue); width: ${task.progress}%; transition: width 0.3s;"></div>
                        </div>
                        <span style="font-size: 0.875rem; font-weight: 600;">${task.progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show/hide complete button based on status
    const completeBtn = document.getElementById('task-complete-btn');
    if (task.status === 'completed') {
        completeBtn.style.display = 'none';
    } else {
        completeBtn.style.display = 'block';
    }

    modal.classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-detail-modal').classList.add('hidden');
    currentTask = null;
}

async function completeCurrentTask() {
    if (!currentTask) return;

    closeTaskModal();
    await completeTask(currentTask.id);
}
```

Add CSS for badge:

```css
.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
}
```

#### Step 6.2: Add Booking Status Update

Add button to booking view in `index.html`:

```html
<!-- Inside view-bookings section, after swimlane-container -->
<div style="margin-top: 2rem; text-align: center;">
    <button onclick="confirmBookingHandoff()" class="btn" style="background: var(--blue);">
        Confirm Current Handoff
    </button>
</div>
```

Add to `js/logic.js`:

```javascript
async function confirmBookingHandoff() {
    if (!USE_LIVE_DATA) {
        showToast('Live mode disabled - enable to update Google Sheets', 'info');
        return;
    }

    // For demo, use booking #3421
    const bookingId = 1;
    const nodeSequence = 2;

    showLoading('Confirming handoff...');

    const result = await window.logistikbudeAPI.updateBooking(
        bookingId,
        nodeSequence,
        {
            actualQuantity: 25,
            actualQuality: 'A',
            actualTime: new Date().toISOString(),
            userId: 'Demo User',
        }
    );

    hideLoading();

    if (result.success) {
        showToast(`Handoff confirmed! Progress: ${result.newProgress}%. Check Google Sheet.`, 'success');
    } else {
        showToast('Error: ' + result.error, 'error');
    }
}
```

#### Step 6.3: Add Reset Demo Function

Add to `js/logic.js`:

```javascript
async function resetDemo() {
    if (!confirm('Reset demo data in Google Sheets? This will restore initial values.')) {
        return;
    }

    showToast('Reset functionality requires manual Google Sheet restoration', 'info');

    // For demo purposes, just reload the page
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}
```

Add button to header:

```html
<!-- In demo-controls div -->
<button onclick="resetDemo()" class="btn" style="background: var(--status-warning); padding: 0.5rem 1rem; font-size: 0.875rem;">
    🔄 Reset Demo
</button>
```

✅ **Checkpoint Day 3:** Added:
- Task detail modal
- Task completion feature
- Booking handoff confirmation
- Reset demo function
- Polished animations

---

## DAY 4 (SUNDAY): DEPLOYMENT + TESTING

### PART 7: Deploy to Vercel (1 hour)

#### Step 7.1: Configure Vercel Project

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "GOOGLE_SHEET_ID": "@google-sheet-id",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": "@google-service-account-email",
    "GOOGLE_PRIVATE_KEY": "@google-private-key"
  }
}
```

#### Step 7.2: Set Environment Variables in Vercel

```bash
cd /home/user/alles-paletti

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add GOOGLE_SHEET_ID
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
```

Paste values from your `.env` file when prompted.

#### Step 7.3: Deploy

```bash
# Deploy to production
vercel --prod
```

You'll get a deployment URL like: `https://alles-paletti-xxx.vercel.app`

#### Step 7.4: Update API Base URL

Edit `js/api.js`:

```javascript
const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app/api';
```

#### Step 7.5: Push to GitHub

```bash
git add .
git commit -m "Add Google Sheets backend integration with Vercel serverless functions"
git push origin main
```

GitHub Pages will auto-deploy the frontend.

✅ **Checkpoint:** App is fully deployed!

---

## DEMO SCRIPT

### Preparation (Before Meeting)

1. ✅ Open Google Sheet in one tab
2. ✅ Open demo site in another tab
3. ✅ Enable "Live Data" mode
4. ✅ Verify data loads successfully
5. ✅ Have these tabs open:
   - Demo site: https://dueringroman-creator.github.io/alles-paletti/
   - Google Sheet: Your sheet URL
   - Vercel dashboard (optional): https://vercel.com/dashboard

### Demo Flow (5 minutes)

**Minute 0-1: Introduction**

*"This is Logistikbude - a logistics control tower prototype. What makes it unique is that it's connected to a live Google Sheets backend, demonstrating how we can rapidly prototype complex workflows."*

- Show dashboard
- Point out map with live locations
- Show task list

**Minute 1-2: Task Completion Demo**

*"Let me show you how task management works with live data sync."*

1. Click on urgent task (POD missing)
2. Task detail modal opens
3. Click "Complete Task"
4. Show toast: "Task completed! Check Google Sheet."
5. **Switch to Google Sheet tab**
6. Show new row in Events sheet
7. Show updated status in Tasks sheet
8. **Switch back to demo**
9. Toggle live mode off/on to reload
10. Task now shows "completed" status

**Minute 2-3: Booking Update Demo**

*"Now let's confirm a delivery handoff and see real-time updates."*

1. Go to Bookings tab
2. Show split-stream visualization
3. Click "Confirm Current Handoff"
4. Show loading spinner
5. Show success toast with progress update
6. **Switch to Google Sheet**
7. Show new row in Events sheet
8. Show updated progress in Bookings sheet
9. **Switch back**
10. Progress bar updated

**Minute 3-4: Live Data Sync**

*"Everything you see is pulling from and writing to Google Sheets in real-time."*

1. Show Google Sheet structure
2. Explain 4 sheets: Bookings, Tasks, Events, Companies
3. Show how events log creates audit trail
4. Explain scalability: can add more sheets/fields easily

**Minute 4-5: Technical Architecture**

*"The technical setup is surprisingly simple and cost-effective."*

1. Explain tech stack:
   - Frontend: Vanilla JS on GitHub Pages (free)
   - Backend: Vercel serverless functions (free tier)
   - Database: Google Sheets (free)
   - **Total cost: €0 per month**

2. Show Vercel dashboard (optional)
3. Explain API endpoints
4. Mention easy to extend

**Closing:**

*"This demonstrates how we can quickly build and iterate on complex logistics workflows using familiar tools like Google Sheets, while maintaining a professional frontend experience. The same approach can scale to a proper database when needed."*

---

## TROUBLESHOOTING

### Common Issues & Solutions

**Issue: API returns 500 error**
- Check service account has Editor access to sheet
- Verify environment variables in Vercel
- Check private key formatting (should have `\n` preserved)

**Issue: CORS error**
- Verify API endpoints have CORS headers
- Check API_BASE_URL in api.js matches Vercel deployment

**Issue: Data not loading**
- Check browser console for errors
- Verify "Live Data" toggle is enabled
- Test API endpoints directly: `https://your-url.vercel.app/api/bookings`

**Issue: Sheet not updating**
- Verify service account email is shared on sheet
- Check sheet tab names match exactly (case-sensitive)
- Look at Vercel function logs for errors

**Issue: Deployment fails**
- Run `npm install` to ensure dependencies
- Check `vercel.json` is properly formatted
- Verify environment variables are set

---

## COMPLETE FILE CHECKLIST

By Sunday, you should have:

```
alles-paletti/
├── index.html (updated with modal and toggle)
├── css/
│   └── style.css (updated with loading, toast, badge styles)
├── js/
│   ├── api.js (new - API client)
│   └── logic.js (updated with live data functions)
├── api/
│   ├── _lib/
│   │   └── sheets.js (new - Google Sheets helper)
│   ├── bookings.js (new)
│   ├── tasks.js (new)
│   ├── events.js (new)
│   ├── tasks/
│   │   └── complete.js (new)
│   └── bookings/
│       └── update.js (new)
├── package.json (new)
├── vercel.json (new)
├── .env (new - NOT committed)
├── .gitignore (new - includes .env, node_modules)
└── README.md (updated with deployment info)
```

✅ **You're ready for Sunday demo!**

---

## BONUS: Post-Demo Enhancements

If you have extra time or want to impress further:

1. **Add more API endpoints**
   - GET /api/companies
   - POST /api/events (manual event creation)

2. **Add data visualization**
   - Simple charts from Google Sheets data
   - Use Chart.js (CDN)

3. **Add filters to task list**
   - Filter by priority
   - Filter by status
   - Search by keyword

4. **Add export functionality**
   - Export current view to CSV
   - Download event log

5. **Add real-time updates**
   - Use setInterval to auto-refresh every 30s
   - Show last updated timestamp

---

## ESTIMATED TIME BREAKDOWN

- **Day 1 (Thu):** 4-6 hours (setup + API creation)
- **Day 2 (Fri):** 4-6 hours (frontend integration)
- **Day 3 (Sat):** 4-6 hours (demo features + polish)
- **Day 4 (Sun):** 2-4 hours (testing + deployment)

**Total: 14-22 hours over 4 days**

---

Good luck with your demo! 🚀
