# CampusFix — Smart Campus Maintenance & Complaint Management System

> **Tagline:** *"Report It. Track It. Fix It."*

CampusFix is an enterprise-grade, responsive full-stack web application designed for universities and residential colleges. It provides a centralized maintenance platform connecting **Students**, **Department Maintenance Staff**, and **College Management (Admin)** in real time.

---

## 🌟 Key Capabilities

1. **Student Self-Service Portal:**
   - 1-Click QR Code location scan (Hostel room, Lab complex, Lecture hall, Washroom).
   - Category-based reporting with automated department routing.
   - Severity & priority tagging (Low, Medium, High) with computed SLA resolution deadline.
   - Proof photo attachments (upload files or choose demo samples).
   - Real-time `onSnapshot` tracking of ticket lifecycle stages:
     `Submitted` → `Assigned` → `Accepted` → `In Progress` → `Resolved` → `Verified` (or `Reopened` / `Rejected`).
   - Post-resolution 5-star quality review & 1-click reopen if issue persists.

2. **Specialized Maintenance Staff Workspace:**
   - Department-specific queues (Electrical, Plumbing, Housekeeping, AC / HVAC, Furniture, IT Support, General Maintenance).
   - Accept assigned tickets and transition to `In Progress`.
   - Add maintenance work notes with timestamp.
   - Upload Before & After repair proof images.
   - Overdue countdown & deadline alerts.

3. **College Management & Admin Control:**
   - University-wide dashboard with live KPIs: Total, Pending, In Progress, Resolved, Overdue count, SLA Resolution rate.
   - Interactive Recharts analytics (Status donut, Department performance bar, Category distribution).
   - Reassignment modal: dynamically reassign departments, technician staff, priority, and status.
   - Automated SLA escalation scanner (detects overdue tickets and triggers emergency management notifications).
   - Complete audit trail of all activity logs.
   - Comprehensive CSV export for institutional accreditation and audits.

---

## 🏗️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Canvas Confetti.
- **Routing:** React Router v7 (`react-router-dom`).
- **Analytics:** Recharts responsive charting engine.
- **Data & Real-time Layer:** Cloud Firestore / Firebase SDK with dual-mode reactive synchronization across tabs via `BroadcastChannel` and `localStorage`.
- **Security:** ABAC (Attribute-Based Access Control) in `firestore.rules`.

---

## 👥 Demo Personas (1-Click Switcher Available in Navbar)

| Role | Name | Email / Department | Credentials / Notes |
|------|------|--------------------|---------------------|
| **Admin** | Dr. K. S. Ramanathan | `admin@campusfix.edu` | Master administrator |
| **Staff** | Rajesh Kumar | `rajesh.electric@campusfix.edu` | Electrical Department Technician |
| **Staff** | Suresh Rao | `suresh.plumb@campusfix.edu` | Plumbing Department Technician |
| **Staff** | Anita Mehra | `anita.housekeep@campusfix.edu` | Housekeeping Supervisor |
| **Staff** | Amit Sharma | `amit.it@campusfix.edu` | IT & Network Technician |
| **Student** | Aarav Sharma | `aarav.22cs101@campusfix.edu` | Hostel Block B, Room 304 |
| **Student** | Priya Patel | `priya.22ec145@campusfix.edu` | Girls Hostel 1, Room 210 |
| **Student** | Rohan Verma | `rohan.23me042@campusfix.edu` | Hostel Block A, Room 112 |
| **Student** | Sneha Iyer | `sneha.21it088@campusfix.edu` | Girls Hostel 2, Room 405 |
| **Student** | Kabir Singh | `kabir.23ce019@campusfix.edu` | Hostel Block C, Room 102 |

*Default password for manual logins: `password123`*

---

## ⚡ Complete Workflows Tested & Verified

### Workflow 1: Student Reporting & Auto-Routing
1. Login as Student (Aarav Sharma).
2. Click **Report Issue** or scan location QR.
3. Select **Electricity** → observe badge previewing automatic routing to **Electrical Department**.
4. Set Priority to **High** → observe SLA resolution target calculated automatically.
5. Click **Submit** → ticket `CF-2026-XXXX` created, activity log saved, notification dispatched.

### Workflow 2: Technician Pickup & Resolution
1. Switch to Staff (Rajesh Kumar - Electrical).
2. Go to **Assigned Complaints** → open newly assigned ticket.
3. Click **Accept Ticket** → status shifts to `Accepted`.
4. Click **Start Work** → status shifts to `In Progress`.
5. Attach after-repair proof photo, write work note, and click **Mark Task as Resolved**.

### Workflow 3: Student Verification & Feedback
1. Switch back to Student (Aarav).
2. Open ticket details → observe live status is now `Resolved` with technician notes and proof photo.
3. Click **Confirm & Rate Service** → rate 5 stars, submit review → confetti fires and status shifts to `Verified`.
4. Alternatively, click **Issue Not Fixed? Reopen** → explain issue → status transitions to `Reopened`.

### Workflow 4: Administrator Reassignment & Analytics
1. Switch to Admin (Dr. Ramanathan).
2. Open **Campus Overview** → observe dynamic KPI stats and Recharts department performance.
3. Click **All Complaints** → filter by Overdue or Department.
4. Click **Reassign** on any ticket → change allocated technician or priority.
5. Click **Export CSV** in Reports to download audited spreadsheet.

---

## 📁 Project Structure

```
├── /
├── index.html                  # HTML entry with Plus Jakarta Sans & SEO meta
├── index.css                   # Tailwind CSS v4 styling
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite + React + Tailwind configuration
├── firebase-blueprint.json     # Firestore Intermediate Representation schema
├── firestore.rules             # Production ABAC Firestore security rules
├── security_spec.md            # Threat model & Dirty Dozen attack tests
├── .env.example                # Environment variables template
├── README.md                   # System documentation
└── src/
    ├── main.tsx                # React DOM mount point
    ├── App.tsx                 # Master router, layouts, and notifications
    ├── types/
    │   └── index.ts            # Domain TypeScript models
    ├── context/
    │   ├── AuthContext.tsx     # Session management & 1-click persona switch
    │   └── NotificationContext.tsx # Real-time alerts & unread badges
    ├── services/
    │   ├── firebase.ts         # Firebase SDK init & getDocFromServer test
    │   ├── store.ts            # Unified reactive database & BroadcastChannel
    │   ├── mockData.ts         # Seed data (5 students, 4 staff, 1 admin, 10 tickets)
    │   └── autoAssign.ts       # Category-to-Department routing & SLA calculation
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx      # Header, role switcher, notifications, QR button
    │   │   ├── Sidebar.tsx     # Role-specific navigation drawer
    │   │   └── Footer.tsx      # Footer info & hotline
    │   ├── common/
    │   │   ├── StatusBadge.tsx # Color-coded status badges
    │   │   ├── PriorityBadge.tsx # Low, Medium, High badges
    │   │   ├── Timeline.tsx    # Progress stepper & activity timeline
    │   │   ├── ImageUploadModal.tsx # Proof photos & sample presets
    │   │   ├── FeedbackModal.tsx   # Star ratings & verification
    │   │   ├── QrCodeModal.tsx     # QR generator & location scanner
    │   │   └── FirebaseConfigModal.tsx # Health checks & custom keys
    │   └── analytics/
    │       └── AdminCharts.tsx # Recharts pie, bar, and category charts
    └── pages/
        ├── public/             # Landing, Login, Register, About
        ├── student/            # Dashboard, Create, My Complaints, Detail, Profile
        ├── staff/              # Dashboard, Assigned, Detail, History, Profile
        └── admin/              # Dashboard, All Complaints, Depts, Users, Analytics, Reports, Settings
```

---

## 🚀 Local Development & Deployment

### Run Locally:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Deploy to Firebase Hosting:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize hosting: `firebase init hosting` (set public directory to `dist`)
4. Build production bundle: `npm run build`
5. Deploy: `firebase deploy`
