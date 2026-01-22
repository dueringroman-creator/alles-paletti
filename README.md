# Logistikbude 3.0 - Immersive Control Tower

A high-fidelity prototype for a modern logistics platform with spatial visualization and flow-based interfaces.

## Overview

Logistikbude 3.0 represents a paradigm shift from traditional "Admin Dashboard" interfaces to an **Immersive Control Tower** experience. Instead of static tables and lists, this platform uses:

- **Interactive Maps** with status-driven pins (Red = Critical, Yellow = Warning, Green = Active)
- **Split-Stream Visualization** separating physical transport from liability flows
- **Active Resolution Tools** for compensation and debt settlement

## Tech Stack

- **Pure Vanilla JavaScript** - No frameworks for maximum flexibility
- **Leaflet.js** - Interactive map visualization
- **CSS Grid & Flexbox** - Modern responsive layout
- **Dark Mode UI** - Optimized for long operations monitoring sessions

## Features

### 1. Operations Control Tower (Cockpit)
- Real-time map of Europe with location pins
- Color-coded status indicators (Critical/Warning/Normal)
- Pulsing animations for urgent items
- Interactive popups with shipment details

### 2. Split-Stream Booking View
- **Physical Route Lane** - Tracks actual truck movements
- **Liability Flow Lane** - Tracks financial/custody transfers
- **PSP Branch Visualization** - Dashed lines for empty pallet returns
- Handles non-linear flows (e.g., truck delivers goods to Customer A but returns empties to PSP Depot B)

### 3. Intelligent Inbox
- Unified view of emails and system tasks
- Priority-based color coding
- Auto-navigation to relevant views on task click
- Real-time filtering by task type

### 4. Compensation Engine (Balances)
- Debt visualization and resolution tools
- Multiple resolution options:
  - Invoice generation
  - PSP pickup requests with cost allocation
  - Compensation transport
- "Who Pays?" logic for shared costs

## Project Structure

```
alles-paletti/
├── index.html          # Main application shell
├── css/
│   └── style.css       # Dark mode theme and component styles
├── js/
│   └── logic.js        # Application logic and data models
├── PROJECT_SPEC.md     # Comprehensive technical specification
└── README.md           # This file
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alles-paletti
   ```

2. **Open in browser**
   - Simply open `index.html` in any modern web browser
   - No build process or dependencies required

3. **Development**
   - Edit files directly
   - Refresh browser to see changes
   - Use browser DevTools for debugging

## Key Concepts

### Split-Stream Data Model

The system uses a non-linear data structure to support complex logistics flows:

```javascript
const bookingModel = {
  id: "3421",
  status: "in-transit",
  physicalRoute: [
    { type: "origin", location: "BMW Munich", time: "08:00" },
    { type: "destination", location: "Customer Hamburg", time: "16:00" }
  ],
  liabilityEvents: [
    { type: "transfer", from: "BMW", to: "Carrier", qty: 33 },
    { type: "transfer", from: "Carrier", to: "Customer", qty: 33 },
    {
      type: "psp_return",
      isBranch: true,
      branchFromNodeIndex: 1,
      location: "Dachser Depot",
      payer: "sender"
    }
  ]
};
```

### Visual Language

- **Red Pulsing Pins** - Critical exceptions requiring immediate attention
- **Yellow Pins** - Warnings and delays
- **Green Pins** - Active normal operations
- **Dashed Lines** - PSP/return flows that branch from main route

## Implementation Phases

✅ **Phase 1: Setup & Shell** - Folder structure, HTML, CSS, navigation
✅ **Phase 2: Logic Injection** - JavaScript data models and rendering
✅ **Phase 3: Interaction Layer** - Inbox, modals, task management
✅ **Phase 4: Refinement** - Leaflet.js integration, animations

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

- Real-time data integration via WebSocket
- PDF invoice generation
- Drag-and-drop task management
- Multi-language support
- Mobile responsive layout
- Historical data visualization

## License

[Your License Here]

## Contact

For questions or contributions, please open an issue in the repository.
