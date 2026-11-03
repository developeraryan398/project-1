# CampusFix Security Specification & Threat Model

This document establishes the Attribute-Based Access Control (ABAC), Zero-Trust security rules, and data invariants for CampusFix Firestore database.

---

## 1. Core Data Invariants

1. **Role Immutability:** Users cannot modify their own `role` field under any circumstances. Roles (`student`, `staff`, `admin`) can only be modified by verified administrators.
2. **Student Privacy & Ownership:** Students can create complaints and read their own complaints. They cannot view other students' complaints unless authorized as staff or admin.
3. **Technician Department Boundary:** Maintenance technicians (`staff`) can only read and update complaints assigned to their department or assigned directly to their `uid`.
4. **Restricted Status Transitions:**
   - Only staff or admins can transition tickets to `Accepted`, `In Progress`, or `Resolved`.
   - Students can only transition their own resolved tickets to `Verified` or `Reopened`.
   - Only admins can mark tickets as `Rejected`.
5. **Immutable Audit Logs:** `activityLogs` documents are append-only. No user (including admin) may alter or delete existing log records to maintain legal audit integrity.
6. **Temporal Server Integrity:** Timestamps (`createdAt`, `updatedAt`, `timestamp`) must strictly match `request.time` on mutations.
7. **Size & Type Boundaries:** All IDs must match `^[a-zA-Z0-9_\-]+$`, strings must not exceed defined lengths (e.g. descriptions <= 2000 chars), and arrays must have bounded limits.

---

## 2. The "Dirty Dozen" Adversarial Payloads

The following 12 attack vectors are modeled and must return `PERMISSION_DENIED`:

| ID | Attack Vector | Payload Snippet | Expected Result |
|----|---------------|-----------------|-----------------|
| **D1** | Privilege Escalation | `{ uid: "student-1", role: "admin" }` (student self-promoting to admin) | `PERMISSION_DENIED` |
| **D2** | Cross-Student Complaint Peeking | Student `B` attempts `get(/complaints/CF-2026-1001)` owned by Student `A` | `PERMISSION_DENIED` |
| **D3** | Unauthorized Status Shortcutting | Student attempts update `{ status: "Resolved" }` on their own complaint | `PERMISSION_DENIED` |
| **D4** | Ghost Field Injection (Shadow Update) | `{ title: "...", ghostField: "injected" }` without schema allowlist | `PERMISSION_DENIED` |
| **D5** | Identity Spoofing | User `X` attempts to set `studentId: "Y"` during complaint create | `PERMISSION_DENIED` |
| **D6** | Technician Department Bypass | Staff in Housekeeping attempts to accept Electrical ticket | `PERMISSION_DENIED` |
| **D7** | Tampering with Historical Audit Trail | Staff attempts `update` or `delete` on an `/activityLogs/{logId}` doc | `PERMISSION_DENIED` |
| **D8** | Fake Timestamp Forgery | Client sends `{ createdAt: "2020-01-01T00:00:00Z" }` instead of `request.time` | `PERMISSION_DENIED` |
| **D9** | Denial of Wallet (Payload Bloat) | Injected 1.5MB malicious string into `description` | `PERMISSION_DENIED` |
| **D10** | Post-Verification Status Modification | Modifying complaint state after reaching terminal status `Verified` without Admin override | `PERMISSION_DENIED` |
| **D11** | Feedback Spoofing | Student `A` submitting feedback for a complaint belonging to Student `B` | `PERMISSION_DENIED` |
| **D12** | Department SLA Tampering | Non-admin user attempting to write to `/departments/{deptId}` | `PERMISSION_DENIED` |

---

## 3. Security Rules Architecture

The rules enforce:
- Default deny: `match /{document=**} { allow read, write: if false; }`
- Reusable primitives: `isValidId()`, `isSignedIn()`, `isAdmin()`, `isOwner()`, `isStaffInDept()`
- Dedicated standalone validation blueprints: `isValidComplaint()`, `isValidUser()`, `isValidFeedback()`, `isValidLog()`
- Split action updates with `affectedKeys().hasOnly(...)`
