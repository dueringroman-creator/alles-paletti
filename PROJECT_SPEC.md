# PROJECT SPECIFICATION: Logistikbude 3.0 (Immersive Control Tower)

## 1. Project Overview

**Goal:** Build a high-fidelity prototype for a "Logistikbude 3.0" logistics platform.
**Core Pivot:** Shift from a static "Admin Dashboard" (tables/lists) to an **Immersive Control Tower** (spatial maps, network graphs, and flow visualizations).
**Tech Stack:** Vanilla HTML, CSS, and JavaScript. No frameworks (React/Vue) to ensure maximum flexibility for DOM manipulation and rapid prototyping.

### Key Conceptual Shifts

1. **Spatial vs. Linear:** Instead of text lists of issues, use interactive maps with pulsing pins.
2. **Split-Stream Visualization:** Separating the **Physical Transport** (Truck moving A → B) from the **Liability Flow** (Pallet debt shifting A → PSP).
3. **Active Resolution:** Instead of just showing "Balances," provide a **Compensation Engine** to resolve debts (e.g., requesting PSP pickups).

---

## 2. Functional Pillars

### A. The "Intelligent" Cockpit

* **Visual:** Dark-mode map of Europe (Leaflet.js integration).
* **Logic:**
  * **Pins:** Red Pulse (Critical Exception), Yellow (Warning), Green (Active Transport).
  * **Interaction:** Clicking a pin opens a "Flight Card" overlay, not a new page.
  * **Unified Inbox:** A sidebar integrating Emails and System Tasks.

### B. The "Split-Stream" Visual Builder (Bookings Tab)

* **Problem:** Standard timelines fail when a truck drops goods at a customer but drives to a different location (PSP Depot) to drop empty pallets.
* **Solution:** Two parallel "Swimlanes":
  * **Top Lane (Physical):** The Truck's Journey (Nodes: Origin → Transit → Dest).
  * **Bottom Lane (Liability):** The Financial/Custody transfer.

* **Feature:** **"Post-Trip Branching"** — The ability to draw a dashed line from the Destination Node to a *new* PSP Node to represent the return of empties.

### C. The Compensation Engine (Balances Tab)

* **Problem:** Knowing you are owed 50 pallets is useless without a way to collect.
* **Solution:** A "Recovery Console" modal.
* **Actions:**
  1. **Invoice:** Generate PDF.
  2. **Compensation Transport:** Send own truck.
  3. **PSP Pickup:** Request a third party (Dachser) to pick up.
* **Critical Logic:** "Who Pays?" Selector. (Options: Debtor, Split 50/50, Creditor).

---

## 3. Data Model & Logic

The system relies on a non-linear data structure to support the "Split-Stream" view.

```javascript
const bookingModel = {
  id: "3421",
  status: "in-transit",
  // Lane 1: Physical Reality
  physicalRoute: [
    { type: "origin", location: "BMW Munich", time: "08:00" },
    { type: "destination", location: "Customer Hamburg", time: "16:00" }
  ],
  // Lane 2: Liability & Ownership
  liabilityEvents: [
    { type: "transfer", from: "BMW", to: "Carrier", qty: 33 },
    { type: "transfer", from: "Carrier", to: "Customer", qty: 33 },
    // The "Branch" event tailored for PSP returns
    {
      type: "psp_return",
      isBranch: true,
      branchFromNodeIndex: 1, // Branches off Destination
      location: "Dachser Depot",
      payer: "sender" // "Who pays" logic
    }
  ]
};
```

---

## 4. Implementation Codebase

*Use the following files as the FOUNDATION. Do not rewrite them from scratch unless improving the logic defined above.*

### File 1: `index.html`

Structure: Sidebar (Nav + Inbox), Main Content (Views for Cockpit, Bookings, Balances), and the Compensation Modal.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logistikbude 3.0</title>
    <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="app-container">
    <aside class="sidebar">
        <div class="logo-area"><i class="ri-truck-line"></i> LOGISTIKBUDE 3.0</div>
        <nav class="main-nav">
            <a href="#" class="nav-item active" onclick="switchTab('cockpit')"><i class="ri-dashboard-line"></i> Cockpit</a>
            <a href="#" class="nav-item" onclick="switchTab('bookings')"><i class="ri-route-line"></i> Bookings</a>
            <a href="#" class="nav-item" onclick="switchTab('balances')"><i class="ri-scales-line"></i> Balances</a>
        </nav>
        <div class="inbox-panel">
            <div class="panel-header"><h5>INTELLIGENT INBOX</h5></div>
            <div id="task-list"></div> </div>
    </aside>

    <main class="content-area">
        <div id="view-cockpit" class="view active">
            <header><h1>Operations Control Tower</h1></header>
            <div class="map-container" id="map-placeholder">
                <div class="map-overlay"><h2>[Interactive Map Layer]</h2></div>
            </div>
        </div>

        <div id="view-bookings" class="view hidden">
            <header><h1>Booking #3421: Split-Stream View</h1></header>
            <div class="swimlane-container">
                <div class="lane-header">Physical Route (Truck)</div>
                <div class="lane-track" id="lane-physical"></div>
                <div class="lane-header">Liability Flow (Pallets)</div>
                <div class="lane-track" id="lane-liability"></div>
            </div>
        </div>

        <div id="view-balances" class="view hidden">
            <header><h1>Reconciliation & Compensation</h1></header>
            <div id="balance-grid">
                <button class="btn btn-danger" onclick="openCompensationModal()">Resolve -50 Pallet Debt</button>
            </div>
        </div>
    </main>
</div>

<div id="compensation-modal" class="modal hidden">
    <div class="modal-content">
        <h3>Resolve Balance Mismatch</h3>
        <p>Regional Transport owes 50 EUR Pallets.</p>
        <div class="option-cards">
            <div class="option-card" onclick="selectOption('invoice')">Invoice</div>
            <div class="option-card" onclick="selectOption('psp')">PSP Pickup</div>
        </div>
        <div id="psp-options" class="hidden">
            <label>Who pays the €120 fee?</label>
            <select><option>Charge Debtor</option><option>Split 50/50</option></select>
        </div>
        <button onclick="closeModal()">Execute</button>
    </div>
</div>

<script src="js/logic.js"></script>
</body>
</html>
```

### File 2: `css/style.css`

Key Requirements: Dark Mode variables, Flexbox layout, and the specific `::before` pseudo-elements to draw the connecting lines for the timeline.

```css
:root { --bg-dark: #0f172a; --bg-panel: #1e293b; --text: #f8fafc; --blue: #3b82f6; --border: #334155; }
body { background: var(--bg-dark); color: var(--text); font-family: sans-serif; margin: 0; display: flex; height: 100vh; }
.app-container { display: flex; width: 100%; }
.sidebar { width: 280px; background: var(--bg-panel); padding: 1rem; border-right: 1px solid var(--border); }
.content-area { flex: 1; padding: 2rem; }
.hidden { display: none; }

/* SWIMLANE VISUALS */
.swimlane-container { background: var(--bg-panel); padding: 2rem; border-radius: 12px; }
.lane-track { display: flex; position: relative; padding-bottom: 3rem; margin-bottom: 2rem; }
.lane-track::before { content: ''; position: absolute; top: 24px; left: 0; right: 0; height: 4px; background: var(--border); z-index: 0; }
.node { position: relative; z-index: 1; margin-right: 60px; background: var(--bg-dark); padding: 10px; border: 1px solid var(--border); width: 140px; }
.node.psp { border-style: dashed; border-color: #eab308; margin-top: 40px; }
/* The vertical branch line for PSP nodes */
.node.psp::before { content: ''; position: absolute; top: -40px; left: 20px; width: 2px; height: 40px; border-left: 2px dashed #eab308; }

/* MODAL */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; }
.modal-content { background: var(--bg-panel); padding: 2rem; width: 400px; border-radius: 8px; }
```

### File 3: `js/logic.js`

Key Logic: Dynamic rendering of nodes, handling the "Split-Stream" logic, and managing the modal state.

```javascript
const bookingData = {
    physical: [
        { title: "BMW Munich", desc: "Origin" },
        { title: "In Transit", desc: "A8 Highway" },
        { title: "Hamburg", desc: "Destination" }
    ],
    liability: [
        { title: "Carrier X", desc: "Has Custody" },
        { title: "Customer", desc: "Received Goods" },
        // The Branch Node
        { title: "PSP Return", desc: "Dachser Depot", type: "psp-branch" }
    ]
};

function renderBooking() {
    const pLane = document.getElementById('lane-physical');
    const lLane = document.getElementById('lane-liability');

    pLane.innerHTML = bookingData.physical.map(n => `<div class="node"><h5>${n.title}</h5></div>`).join('');

    lLane.innerHTML = bookingData.liability.map(n => {
        const cls = n.type === 'psp-branch' ? 'node psp' : 'node';
        return `<div class="${cls}"><h5>${n.title}</h5><p>${n.desc}</p></div>`;
    }).join('');
}

function switchTab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${id}`).classList.remove('hidden');
}

function openCompensationModal() { document.getElementById('compensation-modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('compensation-modal').classList.add('hidden'); }
function selectOption(opt) {
    if(opt === 'psp') document.getElementById('psp-options').classList.remove('hidden');
}

// Init
renderBooking();
```

---

## 5. Development Plan for Claude Code

**Phase 1: Setup & Shell**

1. Create the folder structure: `/css`, `/js`.
2. Implement `index.html` and `style.css` exactly as provided above.
3. Ensure the Sidebar navigation correctly toggles the visibility of the three main Views.

**Phase 2: The Logic Injection**

1. Implement `logic.js`.
2. Focus on the `renderBooking()` function. Ensure it dynamically generates the HTML for the "Swimlanes" based on the JSON data.
3. Verify that the `psp-branch` node renders with the dashed border and the dashed connector line (via CSS).

**Phase 3: The Interaction Layer**

1. Connect the Inbox: Create an array of dummy tasks in JS and render them into the sidebar.
2. Connect the Modal: Ensure clicking the "PSP Pickup" option reveals the "Who Pays?" dropdown.

**Phase 4: Refinement (Optional)**

1. Add Leaflet.js to the Cockpit view for a real map.
2. Add a "Drag and Drop" feature to the Inbox tasks to move them to "Done".
