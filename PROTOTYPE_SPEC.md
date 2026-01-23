# LOGISTIKBUDE - HIGH FIDELITY PROTOTYPE SPECIFICATION
## Streamlined for Maximum Impact with Achievable Scope

---

## 🎯 PROTOTYPE GOAL

Build a **demo-ready, visually impressive prototype** that:
- Looks and feels like a production application
- Demonstrates core product value in 5 minutes
- Uses realistic data and workflows
- Can be built in 2-3 weeks
- Runs entirely client-side (GitHub Pages compatible)

**Target Audience:** Investors, potential customers, user testing

---

## 🏗️ TECHNICAL ARCHITECTURE (SIMPLIFIED)

### **Tech Stack**

```
FRONTEND:
├─ Framework: React 18 + TypeScript
├─ Build: Vite
├─ UI: shadcn/ui + Tailwind CSS
├─ State: React Context (no Redux needed)
├─ Routing: React Router v6
├─ Charts: Recharts
├─ Map: Leaflet.js (already working)
└─ Icons: Lucide React

DATA LAYER:
├─ Mock Data: JSON files (realistic datasets)
├─ Storage: localStorage (for demo persistence)
├─ Simulated AI: Predefined responses
└─ No backend required (pure frontend)

DEPLOYMENT:
├─ GitHub Pages (same as current prototype)
├─ Single-page application
└─ Fast, reliable, no server costs
```

### **What We're KEEPING from Full MVP:**
✅ Role-based cockpit dashboards
✅ Task management with rich details
✅ Booking visualization (split-stream)
✅ Document upload with simulated AI extraction
✅ Balance tracking interface
✅ Interactive map with real locations
✅ Communication templates (UI only)
✅ Auto-booking suggestions (simulated)

### **What We're REMOVING/SIMPLIFYING:**
❌ Full database (use JSON + localStorage)
❌ Real authentication (simple role switcher)
❌ Real AI API calls (simulate responses)
❌ Email/SMS sending (show UI only)
❌ Complex multi-party chains (show 2-3 patterns)
❌ Full CRUD operations (mostly read-only with key demos)
❌ Backend API (all client-side)

---

## 📊 DATA MODEL (SIMPLIFIED)

### **Core Entities (JSON Structure)**

```typescript
// Mock data stored in /src/data/*.json

// companies.json
interface Company {
  id: number;
  name: string;
  type: 'facility' | 'carrier' | 'psp';
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  performance: {
    onTimePercentage: number;
    qualityScore: number;
  };
}

// bookings.json
interface Booking {
  id: number;
  bookingNumber: string;
  status: 'draft' | 'confirmed' | 'in_transit' | 'at_handoff' | 'delivered' | 'completed';
  origin: {
    facilityId: number;
    name: string;
    coordinates: [number, number];
  };
  destination: {
    facilityId: number;
    name: string;
    coordinates: [number, number];
  };
  shipper: { id: number; name: string };
  consignee: { id: number; name: string };
  carrier: { id: number; name: string };
  loadCarriers: {
    type: string; // "EUR Pallet", "H1 Plastic"
    quantity: number;
    qualityGrade: 'A' | 'B' | 'C';
  };
  scheduledPickup: string; // ISO datetime
  scheduledDelivery: string;
  actualPickup?: string;
  actualDelivery?: string;
  nodes: BookingNode[];
  documents: Document[];
  currentNode: number;
  progress: number; // 0-100
}

interface BookingNode {
  id: number;
  sequence: number;
  type: 'origin' | 'handoff' | 'destination';
  location: string;
  coordinates?: [number, number];
  scheduledTime: string;
  actualTime?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'exception';
  carrier?: { id: number; name: string };
  expected: { quantity: number; quality: string };
  actual?: { quantity: number; quality: string };
  confirmedBy?: string;
  requiresConfirmation: boolean;
  requiresPhoto: boolean;
}

// tasks.json
interface Task {
  id: number;
  type: 'pod_missing' | 'pod_review' | 'confirmation_missing' | 'booking_draft' |
        'discrepancy_review' | 'psp_approval' | 'overdue_return';
  category: 'operational' | 'financial' | 'documentation' | 'approval';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  urgencyScore: number; // 1-100
  status: 'open' | 'in_progress' | 'completed';
  title: string;
  description: string;
  dueDate?: string;
  hoursUntilDue?: number;
  isOverdue: boolean;
  assignedTo: {
    userId?: number;
    role?: string;
    name?: string;
  };
  context: {
    bookingId?: number;
    bookingNumber?: string;
    companyId?: number;
    companyName?: string;
    documentId?: number;
    amount?: number;
    [key: string]: any;
  };
  actions: Action[];
  quickActions: QuickAction[];
  progress: number;
  createdAt: string;
}

interface Action {
  action: string; // 'upload_document', 'approve', 'reject', etc.
  label: string;
  type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  icon: string;
  requiresConfirm?: boolean;
  url?: string;
}

// documents.json
interface Document {
  id: number;
  bookingId?: number;
  type: 'POD' | 'BOL' | 'CMR' | 'pallet_voucher' | 'photo';
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string; // Mock URL or base64
  previewUrl?: string;
  extractionResult?: {
    status: 'pending' | 'completed' | 'failed';
    data: {
      quantity?: number;
      qualityGrade?: string;
      signedBy?: string;
      signaturePresent?: boolean;
      [key: string]: any;
    };
    confidence: {
      overall: number;
      [field: string]: number;
    };
    requiresReview: boolean;
    reviewReason?: string;
  };
}

// balances.json
interface Balance {
  companyId: number;
  companyName: string;
  counterpartyId: number;
  counterpartyName: string;
  carrierType: string;
  netQuantity: number; // positive = they owe us, negative = we owe them
  netValue: number; // EUR
  lastTransactionDate: string;
  daysOutstanding: number;
  severity: 'urgent' | 'high' | 'medium' | 'low';
  actions: Action[];
}

// users.json (for role switching)
interface User {
  id: number;
  name: string;
  email: string;
  role: 'logistics_manager' | 'finance_manager' | 'operations_analyst';
  avatar?: string;
  preferences: {
    dashboardLayout: 'compact' | 'detailed';
    notifications: boolean;
  };
}
```

---

## 🎨 KEY FEATURES & USER FLOWS

### **Feature 1: Role-Based Cockpit Dashboard**

**Purpose:** Show different views based on user role

**Roles to Demo:**
1. **Logistics Manager** (Primary focus)
   - Urgent alerts (missing PODs, confirmations)
   - Active transports on map
   - Task list with quick actions
   - Overdue items

2. **Finance Manager**
   - Outstanding balances
   - PSP charges pending approval
   - Bound capital metrics
   - Payment status

3. **Operations Analyst**
   - KPIs and trends
   - Performance charts
   - Exception rate
   - Carrier scorecards

**Implementation:**
- Role switcher in top-right corner (demo feature)
- Dashboard content changes based on selected role
- Persistent selection in localStorage
- Smooth transitions between views

---

### **Feature 2: Task Center (Core Workflow)**

**Purpose:** Central hub for all actions needing attention

**Task Types to Demo:**
1. **POD Missing** (Urgent)
   - Shows booking details
   - Contact carrier quick action
   - Upload document button
   - Send reminder email (simulated)

2. **POD Review Required** (High Priority)
   - Embedded document viewer
   - AI extraction results displayed
   - Editable fields if confidence low
   - Approve/Dispute buttons
   - Booking matrix view

3. **Booking Draft** (Medium)
   - Complete booking form
   - Auto-suggest feature (simulated AI)
   - Apply pattern button
   - Save/Confirm actions

4. **PSP Charge Approval** (Financial)
   - Charge breakdown display
   - Compare to expected cost
   - Approve/Dispute/Request Info
   - One-click actions

**UI Components:**
- Task list with filters (status, priority, category)
- Task detail modal with rich context
- Embedded micro-frontends (booking matrix, doc viewer)
- Activity timeline
- Quick actions bar

---

### **Feature 3: Booking Visualization (Split-Stream)**

**Purpose:** Show complex transport chains visually

**What to Demonstrate:**
1. **Simple Exchange** (2 nodes)
   - Origin → Destination
   - Single carrier
   - Basic timeline

2. **Complex Chain** (4 nodes)
   - Origin → Handoff1 → Handoff2 → Destination
   - Multiple carriers
   - PSP returns branch visualization
   - Real-time status updates (simulated)

3. **Interactive Flow Diagram**
   - Horizontal timeline with nodes
   - Color-coded status (pending/in-progress/completed/exception)
   - Click node to see details
   - Progress bar
   - ETA calculations

**Visual Elements:**
- Node cards with status icons
- Connecting lines (solid for completed, dashed for pending)
- Carrier logos/icons
- PSP branch indicator (dashed line downward)
- Timestamp overlays
- Exception highlighting

---

### **Feature 4: Document Processing (Simulated AI)**

**Purpose:** Demo AI-powered document extraction

**Workflow:**
1. **Upload Document**
   - Drag & drop zone
   - File preview
   - Mock upload progress (instant)

2. **AI Processing** (Simulated)
   - Show "Analyzing..." spinner (2 seconds)
   - Display extraction results
   - Confidence scores per field
   - Highlight low-confidence fields

3. **Review Interface**
   - Side-by-side: document preview + extracted data
   - Editable fields
   - Confidence indicators (color-coded)
   - Accept/Correct/Reject buttons

**Mock Extraction Results:**
```json
{
  "quantity": { "value": 23, "confidence": 0.98 },
  "qualityGrade": { "value": "A", "confidence": 0.85 },
  "signedBy": { "value": "Peter Weber", "confidence": 0.99 },
  "signaturePresent": { "value": true, "confidence": 0.99 }
}
```

**Smart Discrepancy Detection:**
- Compare extracted vs expected
- Auto-flag mismatches
- Suggest liability (simulated AI reasoning)
- Create task automatically

---

### **Feature 5: Balance Reconciliation Interface**

**Purpose:** Show financial tracking and resolution

**Components:**
1. **Balance Overview**
   - List of companies with outstanding balances
   - Color-coded by severity
   - Sort by: amount, days overdue, company
   - Quick filters (overdue only, >€500, etc.)

2. **Balance Detail Card**
   - Company info + contact
   - Breakdown by carrier type
   - Transaction history (last 10)
   - Days outstanding
   - Calculated liability

3. **Resolution Actions**
   - Generate invoice (download mock PDF)
   - Request PSP pickup (show form)
   - Send reminder (show email template)
   - Schedule compensation transport
   - Mark as disputed

---

### **Feature 6: Auto-Booking Intelligence (Simulated)**

**Purpose:** Demo AI-powered booking suggestions

**Triggers to Show:**
1. **Recurring Pattern Detected**
   - "BMW → Customer every Monday at 08:00"
   - Confidence: 94%
   - Reasoning displayed
   - One-click accept

2. **Balance Optimization**
   - "Regional Transport has surplus nearby"
   - Suggest return pickup
   - Calculate cost savings
   - Show route on map

3. **Historical Analysis**
   - "Similar routes completed successfully"
   - Show past bookings
   - Apply pattern button

**UI:**
- Suggestion cards on dashboard
- Accept/Reject/Modify buttons
- Confidence score visual (progress ring)
- Reasoning text
- Preview booking before accepting

---

## 🎨 UI/UX DESIGN SPECIFICATIONS

### **Color Palette (Dark Mode)**

```css
:root {
  /* Backgrounds */
  --bg-dark: #0f172a;      /* Main background */
  --bg-panel: #1e293b;     /* Panels, cards */
  --bg-elevated: #334155;  /* Elevated elements */

  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;

  /* Status Colors */
  --status-success: #22c55e;
  --status-warning: #eab308;
  --status-error: #ef4444;
  --status-info: #3b82f6;

  /* Priority Colors */
  --priority-urgent: #dc2626;
  --priority-high: #f97316;
  --priority-medium: #eab308;
  --priority-low: #64748b;

  /* Borders */
  --border: #334155;
  --border-hover: #475569;
}
```

### **Component Library (shadcn/ui)**

Use these pre-built components:
- Button
- Card
- Badge
- Table
- Dialog (Modal)
- Dropdown Menu
- Tabs
- Avatar
- Progress
- Tooltip
- Alert
- Input
- Select
- Checkbox
- Separator

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Role Switcher, User Menu)               │
├──────┬──────────────────────────────────────────────────┤
│      │                                                  │
│      │  Main Content Area                              │
│  S   │  (Dashboard / Task Center / Bookings / etc)    │
│  i   │                                                  │
│  d   │                                                  │
│  e   │                                                  │
│  b   │                                                  │
│  a   │                                                  │
│  r   │                                                  │
│      │                                                  │
│      │                                                  │
└──────┴──────────────────────────────────────────────────┘
```

---

## 📁 PROJECT STRUCTURE

```
alles-paletti/
├── public/
│   ├── mock-documents/        # Sample PDFs, images
│   └── company-logos/         # Carrier/company logos
│
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── cockpit/
│   │   │   ├── DashboardLogistics.tsx
│   │   │   ├── DashboardFinance.tsx
│   │   │   ├── DashboardAnalytics.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── KPIWidget.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── bookings/
│   │   │   ├── BookingFlow.tsx
│   │   │   ├── BookingNode.tsx
│   │   │   ├── BookingMatrix.tsx
│   │   │   └── SplitStreamView.tsx
│   │   ├── documents/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentViewer.tsx
│   │   │   ├── ExtractionResults.tsx
│   │   │   └── FieldEditor.tsx
│   │   ├── balances/
│   │   │   ├── BalanceList.tsx
│   │   │   ├── BalanceCard.tsx
│   │   │   └── ResolutionModal.tsx
│   │   ├── map/
│   │   │   ├── InteractiveMap.tsx
│   │   │   └── LocationMarker.tsx
│   │   └── shared/
│   │       ├── RoleSwitcher.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── StatusBadge.tsx
│   │
│   ├── data/                  # Mock data JSON files
│   │   ├── companies.json
│   │   ├── bookings.json
│   │   ├── tasks.json
│   │   ├── documents.json
│   │   ├── balances.json
│   │   └── users.json
│   │
│   ├── lib/
│   │   ├── mockData.ts       # Helper to load mock data
│   │   ├── simulateAI.ts     # Simulate AI responses
│   │   ├── calculations.ts   # Business logic (dates, amounts)
│   │   └── utils.ts          # Utilities
│   │
│   ├── contexts/
│   │   ├── UserContext.tsx   # Current user & role
│   │   └── DataContext.tsx   # Mock data provider
│   │
│   ├── pages/
│   │   ├── Cockpit.tsx
│   │   ├── TaskCenter.tsx
│   │   ├── BookingDetail.tsx
│   │   ├── Balances.tsx
│   │   └── Settings.tsx
│   │
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
│
├── index.html (keep existing for now)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🚀 IMPLEMENTATION PHASES

### **PHASE 1: Foundation (Week 1)**

**Goals:**
- Set up React + TypeScript + Vite
- Install shadcn/ui components
- Create mock data files
- Build layout structure
- Implement role switcher

**Deliverables:**
- ✅ Project scaffolding
- ✅ All mock data loaded
- ✅ Basic routing working
- ✅ Sidebar + Header components
- ✅ Role switching functional

---

### **PHASE 2: Cockpit Dashboard (Week 1-2)**

**Goals:**
- Build 3 role-based dashboards
- KPI widgets
- Alert cards
- Active transport list
- Map integration (reuse existing Leaflet)

**Deliverables:**
- ✅ Logistics Manager dashboard
- ✅ Finance Manager dashboard
- ✅ Operations Analyst dashboard
- ✅ Interactive map with real-time data
- ✅ Alert system

---

### **PHASE 3: Task Center (Week 2)**

**Goals:**
- Task list with filtering
- Task detail modals
- Rich context display
- Quick actions
- Simulated AI suggestions

**Deliverables:**
- ✅ Full task list UI
- ✅ 4-5 different task type details
- ✅ Embedded booking matrix
- ✅ Document viewer
- ✅ Action execution (simulated)

---

### **PHASE 4: Booking Visualization (Week 2-3)**

**Goals:**
- Split-stream flow diagram
- Interactive nodes
- Booking matrix editor
- Progress tracking
- PSP branch visualization

**Deliverables:**
- ✅ Flow diagram component
- ✅ Node detail modals
- ✅ Editable booking matrix
- ✅ Real-time status updates (simulated)

---

### **PHASE 5: Document & Balance Features (Week 3)**

**Goals:**
- Document upload UI
- Simulated AI extraction
- Review interface
- Balance reconciliation
- Resolution actions

**Deliverables:**
- ✅ Upload component with preview
- ✅ Extraction results display
- ✅ Field editing interface
- ✅ Balance list and detail cards
- ✅ Resolution modal with actions

---

### **PHASE 6: Polish & Demo Prep (Week 3)**

**Goals:**
- Smooth animations
- Loading states
- Error handling
- Sample data scenarios
- Demo script

**Deliverables:**
- ✅ Polished transitions
- ✅ Realistic loading indicators
- ✅ 3-5 demo scenarios
- ✅ Screenshot/video ready
- ✅ Deployed to GitHub Pages

---

## 🎬 DEMO SCENARIOS

### **Scenario 1: Missing POD (Logistics Manager)**
1. Login as Logistics Manager
2. See urgent alert: "POD missing - 6 hours overdue"
3. Click alert → Task detail opens
4. View booking details on map
5. Click "Contact Carrier" → Email template pre-filled
6. Click "Upload POD" → Upload interface
7. Upload mock document
8. See "AI processing..." (2 sec delay)
9. Extraction results show quantity mismatch
10. System auto-creates discrepancy task
11. Task status updates to "Review Required"

### **Scenario 2: POD Review (Logistics Manager)**
1. Click "Review POD" task
2. Document preview on left, extracted data on right
3. See confidence scores (98%, 85%, 99%)
4. Low-confidence field highlighted
5. Edit quality grade from "A" to "B"
6. Click "Approve with Changes"
7. Booking matrix updates
8. Task marked complete

### **Scenario 3: Balance Resolution (Finance Manager)**
1. Switch to Finance Manager role
2. Dashboard shows "€1,616 outstanding"
3. Click "Regional Transport" balance card
4. See 47 pallets owed, 12 days overdue
5. Click "Request PSP Pickup"
6. Modal shows pickup form
7. Select "Charge Debtor" for fee
8. Click "Schedule Pickup"
9. Success message + PDF preview
10. Balance card updates with "Pickup Scheduled" badge

### **Scenario 4: Auto-Booking Suggestion**
1. Dashboard shows suggestion card
2. "Recurring pattern detected: BMW → Customer"
3. 94% confidence, "Every Monday 08:00"
4. Click "Preview Booking"
5. See pre-filled booking form
6. All fields populated from pattern
7. Click "Accept Suggestion"
8. New booking created
9. Appears in active transports

### **Scenario 5: Complex Transport Chain**
1. Open booking #3421
2. See 4-node split-stream visualization
3. Node 1: Completed (green checkmark)
4. Node 2: In Progress (yellow, pulsing)
5. Node 3: Pending (gray)
6. Node 4: Pending (gray)
7. Click Node 2 → Details modal
8. "Confirm Arrival" button
9. Enter actual quantity, quality, time
10. Click Confirm → Node turns green
11. Node 3 unlocks, turns yellow
12. Progress bar updates to 50%

---

## 💾 MOCK DATA EXAMPLES

### **Sample Booking (JSON)**

```json
{
  "id": 3421,
  "bookingNumber": "BK-20260122-3421",
  "status": "in_transit",
  "origin": {
    "facilityId": 1,
    "name": "BMW Munich Warehouse",
    "city": "Munich",
    "coordinates": [48.1351, 11.5820]
  },
  "destination": {
    "facilityId": 5,
    "name": "Customer Warehouse Hamburg",
    "city": "Hamburg",
    "coordinates": [53.5511, 9.9937]
  },
  "shipper": { "id": 1, "name": "BMW AG" },
  "consignee": { "id": 4, "name": "Customer GmbH" },
  "carrier": { "id": 2, "name": "Dachser SE" },
  "loadCarriers": {
    "type": "EUR Pallet",
    "quantity": 25,
    "qualityGrade": "A"
  },
  "scheduledPickup": "2026-01-22T08:00:00Z",
  "scheduledDelivery": "2026-01-22T14:30:00Z",
  "actualPickup": "2026-01-22T08:15:00Z",
  "currentNode": 1,
  "progress": 25,
  "nodes": [
    {
      "id": 1,
      "sequence": 1,
      "type": "origin",
      "location": "BMW Munich Warehouse",
      "coordinates": [48.1351, 11.5820],
      "scheduledTime": "2026-01-22T08:00:00Z",
      "actualTime": "2026-01-22T08:15:00Z",
      "status": "completed",
      "carrier": { "id": 2, "name": "Dachser SE" },
      "expected": { "quantity": 25, "quality": "A" },
      "actual": { "quantity": 25, "quality": "A" },
      "confirmedBy": "Hans Schmidt",
      "requiresConfirmation": true,
      "requiresPhoto": false
    },
    {
      "id": 2,
      "sequence": 2,
      "type": "handoff",
      "location": "Dachser Depot Kempten",
      "coordinates": [47.7328, 10.3174],
      "scheduledTime": "2026-01-22T10:30:00Z",
      "status": "in_progress",
      "carrier": { "id": 2, "name": "Dachser SE" },
      "expected": { "quantity": 25, "quality": "A" },
      "requiresConfirmation": true,
      "requiresPhoto": true
    },
    {
      "id": 3,
      "sequence": 3,
      "type": "handoff",
      "location": "Regional Transport Hub",
      "scheduledTime": "2026-01-22T11:00:00Z",
      "status": "pending",
      "carrier": { "id": 3, "name": "Regional Transport" },
      "expected": { "quantity": 25, "quality": "A" },
      "requiresConfirmation": true,
      "requiresPhoto": false
    },
    {
      "id": 4,
      "sequence": 4,
      "type": "destination",
      "location": "Customer Warehouse Hamburg",
      "coordinates": [53.5511, 9.9937],
      "scheduledTime": "2026-01-22T14:30:00Z",
      "status": "pending",
      "expected": { "quantity": 25, "quality": "A" },
      "requiresConfirmation": true,
      "requiresPhoto": false
    }
  ],
  "documents": [
    {
      "id": 89,
      "type": "BOL",
      "filename": "BOL_BMW_20260122.pdf",
      "uploadedAt": "2026-01-22T08:20:00Z",
      "uploadedBy": "Hans Schmidt"
    }
  ]
}
```

### **Sample Task (JSON)**

```json
{
  "id": 1,
  "type": "pod_missing",
  "category": "documentation",
  "priority": "urgent",
  "urgencyScore": 95,
  "status": "open",
  "title": "POD missing for BMW → Dachser delivery",
  "description": "Proof of Delivery not uploaded 6 hours after scheduled delivery",
  "dueDate": "2026-01-22T20:00:00Z",
  "hoursUntilDue": 2.5,
  "isOverdue": false,
  "assignedTo": {
    "userId": 1,
    "name": "Roman W.",
    "role": "logistics_manager"
  },
  "context": {
    "bookingId": 3421,
    "bookingNumber": "BK-20260122-3421",
    "carrier": "Dachser SE",
    "quantity": 25,
    "carrierType": "EUR Pallet",
    "contactPerson": "Maria Müller",
    "contactPhone": "+49 123 456789",
    "contactEmail": "maria.mueller@dachser.com"
  },
  "actions": [
    {
      "action": "upload_document",
      "label": "Upload POD",
      "type": "primary",
      "icon": "upload"
    },
    {
      "action": "contact_carrier",
      "label": "Contact Dachser",
      "type": "secondary",
      "icon": "phone"
    },
    {
      "action": "mark_as_lost",
      "label": "Report as Lost",
      "type": "danger",
      "icon": "alert-triangle",
      "requiresConfirm": true
    }
  ],
  "quickActions": [
    {
      "action": "send_reminder",
      "label": "📧 Send Reminder"
    }
  ],
  "progress": 0,
  "createdAt": "2026-01-22T14:00:00Z"
}
```

---

## 🎨 KEY UI COMPONENTS TO BUILD

### **1. AlertCard Component**

```tsx
interface AlertCardProps {
  severity: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: ReactNode;
  actions: Action[];
  onClick?: () => void;
}

// Visual: Card with colored left border, icon, title, message, action buttons
// Hover effect, click to open detail
```

### **2. BookingFlow Component**

```tsx
interface BookingFlowProps {
  booking: Booking;
  interactive?: boolean;
  onNodeClick?: (nodeId: number) => void;
}

// Visual: Horizontal timeline with node cards
// Lines connecting nodes (solid/dashed based on status)
// Progress bar at top
// Animated transitions when status changes
```

### **3. TaskDetailModal Component**

```tsx
interface TaskDetailModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onActionExecute: (action: string, payload?: any) => void;
}

// Visual: Full-screen or large modal
// Left: context data (booking, company, etc)
// Right: actions panel
// Bottom: activity timeline
// Embedded components based on task type
```

### **4. ExtractionResults Component**

```tsx
interface ExtractionResultsProps {
  document: Document;
  extractionResult: ExtractionResult;
  onFieldEdit: (field: string, value: any) => void;
  onApprove: () => void;
  onReject: () => void;
}

// Visual: Grid of extracted fields
// Each field shows: label, value, confidence score
// Color-coded confidence (green >90%, yellow 70-90%, red <70%)
// Inline editing for low-confidence fields
```

### **5. BalanceCard Component**

```tsx
interface BalanceCardProps {
  balance: Balance;
  onActionClick: (action: string) => void;
}

// Visual: Card with company header, balance amount, breakdown, actions
// Color-coded severity border
// Days overdue badge
// Quick actions as icon buttons
```

---

## 🎯 SUCCESS METRICS FOR PROTOTYPE

**Demo Readiness:**
- ✅ 5-minute walkthrough covers all key features
- ✅ No broken links or console errors
- ✅ Smooth transitions and animations
- ✅ Realistic data in all views
- ✅ Works on desktop and tablet

**Visual Polish:**
- ✅ Consistent dark mode theme
- ✅ Professional typography and spacing
- ✅ Intuitive navigation
- ✅ Loading states for all actions
- ✅ Hover effects and micro-interactions

**Technical Quality:**
- ✅ TypeScript with no `any` types
- ✅ Reusable component architecture
- ✅ Clean code structure
- ✅ Fast initial load (<2 seconds)
- ✅ Responsive on modern browsers

**Demo Scenarios:**
- ✅ All 5 scenarios work flawlessly
- ✅ Can reset to initial state
- ✅ Data persists in localStorage
- ✅ Can share demo URL

---

## 📋 NEXT STEPS

1. **Review & Approve Spec** (you)
2. **Set Up React Project** (me)
3. **Create Mock Data Files** (me)
4. **Build Phase 1: Foundation** (me)
5. **Iterate on feedback** (us)

---

**This specification balances:**
- ✅ High visual quality
- ✅ Realistic workflows
- ✅ Achievable scope (2-3 weeks)
- ✅ Demo-ready presentation
- ✅ No backend complexity
- ✅ GitHub Pages deployment

**Ready to proceed?**
