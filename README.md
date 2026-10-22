# MOCCE - My Own CCXML Editor

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

A modern, node-based visual state machine and telephony orchestration editor for **W3C CCXML (Call Control XML) 1.0**, built with **Svelte 5**, **Svelte Flow** (`@xyflow/svelte`), **Tailwind CSS v4**, and **TypeScript**.

Compliant with the **W3C Call Control eXtensible Markup Language (CCXML) Version 1.0 Recommendation**.

---

## 🚀 Features

- **Full CCXML 1.0 State Machine Support**:
  - `<eventprocessor statevariable="...">`: Finite State Machine execution container.
  - `<transition state="..." event="..." cond="...">`: Event-driven state transitions with ECMAScript guard conditions.
  - **Telephony & Connection Control**: `<accept>`, `<reject>`, `<redirect>`, `<createcall>`, `<disconnect>`, `<join>`, and `<unjoin>`.
  - **VoiceXML Dialog Management**: `<dialogstart>`, `<dialogterminate>`, and `<dialogprepare>` with parameter passing and session binding.
  - **Conferencing**: `<createconference>` and `<destroyconference>` audio bridge orchestration.
  - **Session Scripting**: `<var>`, `<assign>`, `<script>`, `<log>`, and `<exit>`.

- **Real-Time W3C CCXML 1.0 Code Generator**:
  - Live bi-directional synthesis of compliant XML markup with proper namespace declarations (`xmlns="http://www.w3.org/2002/09/ccxml"`).
  - One-click copy to clipboard and `.ccxml` file export.

- **CCXML 1.0 Specification Diagnostics & Validator**:
  - Live spec compliance diagnostics engine checking:
    - Unique XML NMTOKEN state identifiers.
    - Transition edge target integrity and reachability.
    - Orphaned call prevention (flags missing `<transition event="connection.disconnected">`).
    - Error handling recommendations (`error.*`).
    - Mandatory attributes (`dest` on `<createcall>`, `src` on `<dialogstart>`, `id1`/`id2` on `<join>`).

- **Bi-directional CCXML Parser / Importer**:
  - Import existing `.ccxml` files or paste raw CCXML markup.
  - Reverse-engineers states, event transitions, and action sequences into interactive canvas nodes and wiring.

- **Interactive Telephony PBX Simulator**:
  - Multi-line call control simulator (Inbound caller leg, Outbound agent leg).
  - Dual-tone multi-frequency (DTMF) audio tone generation via the Web Audio API.
  - VoiceXML dialog runner mock (simulates dialog start and emits `dialog.exit` with custom return values).
  - Live event queue and ECMAScript session variable inspection (`state`, `event$`, `session$`).

- **DAG Auto-Layout Algorithm**:
  - One-click topological DAG layering algorithm to neatly organize complex statecharts.

- **Pre-Built Telephony Industry Templates**:
  1. *VoiceXML Inbound Dialog Runner* (Accept incoming call, launch VoiceXML IVR, and tear down on completion)
  2. *Two-Party Consultation Transfer* (Accept call, initiate outbound leg via `<createcall>`, and bridge audio via `<join>`)
  3. *Multi-Party Audio Conference* (Create conference bridge and dynamically join incoming callers)
  4. *Call Screening & Deflection* (Caller ID inspection with automatic spam rejection and redirect)

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Run Test Suite
```bash
npm test
```

### 5. Typecheck & Lint
```bash
npm run check
```

---

## 📄 License

Licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**.
