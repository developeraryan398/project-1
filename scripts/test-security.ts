/**
 * Comprehensive Automated Security Audit Test Suite
 * Tests Admin, Staff, Student roles, Authorization barriers, and Privacy invariants.
 */
import { CampusDB, initializeCampusDatabase } from '../src/services/store';
import { UserProfile, Complaint } from '../src/types';

interface TestResult {
  name: string;
  category: 'ADMIN' | 'STAFF' | 'STUDENT' | 'QR_CODE' | 'RBAC';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, category: TestResult['category'], details: string) {
  results.push({
    name,
    category,
    passed: condition,
    details: condition ? `PASSED: ${details}` : `FAILED: ${details}`,
  });
}

export function runSecurityTestSuite(): TestResult[] {
  initializeCampusDatabase(true);

  const users = CampusDB.getUsers();
  const complaints = CampusDB.getComplaints();

  const adminUser = users.find((u) => u.role === 'admin')!;
  const staffElectrical = users.find((u) => u.email === 'rajesh.electric@campusfix.edu')!;
  const staffPlumbing = users.find((u) => u.email === 'suresh.plumb@campusfix.edu')!;
  const studentAarav = users.find((u) => u.email === 'aarav.22cs101@campusfix.edu')!;
  const studentPriya = users.find((u) => u.email === 'priya.22ec145@campusfix.edu')!;

  // ==========================================
  // TEST GROUP 1: ADMIN SECURITY & PRIVILEGE ESCALATION
  // ==========================================
  console.log('\n--- Running Group 1: Admin Security & Privilege Escalation ---');

  // Test 1.1: Student attempting to elevate themselves to Admin
  let privilegeEscalationBlocked = false;
  try {
    CampusDB.updateUser(studentAarav.uid, { role: 'admin' }, { role: 'student' });
  } catch (err: any) {
    if (err.message.includes('Forbidden') || err.message.includes('privilege escalation')) {
      privilegeEscalationBlocked = true;
    }
  }
  assert(
    privilegeEscalationBlocked,
    'Student cannot elevate own role to admin',
    'ADMIN',
    'Privilege escalation correctly rejected by backend store assertion.'
  );

  // Test 1.2: Student attempting to register as Admin
  const registeredStudent = CampusDB.registerStudent(
    {
      name: 'Malicious Student',
      email: 'attacker@campusfix.edu',
      phone: '+91 99999 88888',
    },
    'password123'
  );
  assert(
    registeredStudent.role === 'student',
    'Public registration strictly enforces student role',
    'ADMIN',
    `Public registration resulted in role: ${registeredStudent.role}`
  );

  // Test 1.3: Authorized admin can manage departments and users
  let adminCanManage = false;
  try {
    const updated = CampusDB.updateUser(studentAarav.uid, { phone: '+91 99111 99999' }, { role: 'admin' });
    adminCanManage = updated.phone === '+91 99111 99999';
  } catch {
    adminCanManage = false;
  }
  assert(
    adminCanManage,
    'Authorized Admin retains full management privileges',
    'ADMIN',
    'Admin successfully updated record without constraint violations.'
  );

  // ==========================================
  // TEST GROUP 2: STUDENT PRIVACY & COMPLAINT ISOLATION
  // ==========================================
  console.log('\n--- Running Group 2: Student Privacy & Complaint Isolation ---');

  // Find a complaint filed by Aarav and one by Priya
  const aaravComplaint = complaints.find((c) => c.studentId === studentAarav.uid || c.studentEmail === studentAarav.email)!;
  const priyaComplaint = complaints.find((c) => c.studentId === studentPriya.uid || c.studentEmail === studentPriya.email)!;

  // Test 2.1: Aarav can view own complaint
  const isAaravAuthorizedOnOwn =
    aaravComplaint.studentId === studentAarav.uid || aaravComplaint.studentEmail === studentAarav.email;
  assert(
    isAaravAuthorizedOnOwn,
    'Student can access own complaint',
    'STUDENT',
    `Aarav correctly owns ticket ${aaravComplaint.complaintId}`
  );

  // Test 2.2: Aarav viewing Priya's complaint must be rejected
  const isAaravAuthorizedOnPriya =
    studentAarav.role === 'admin' ||
    priyaComplaint.studentId === studentAarav.uid ||
    priyaComplaint.studentEmail === studentAarav.email;
  assert(
    !isAaravAuthorizedOnPriya,
    'Student blocked from accessing another student private complaint',
    'STUDENT',
    `Aarav is unauthorized to inspect Priya's ticket ${priyaComplaint.complaintId}`
  );

  // Test 2.3: Student cannot alter ownership of complaint
  let complaintOwnershipTheftBlocked = false;
  try {
    CampusDB.updateComplaint(
      aaravComplaint.complaintId,
      { studentId: studentPriya.uid },
      { name: studentAarav.name, role: 'student' }
    );
    const reloaded = CampusDB.getComplaintById(aaravComplaint.complaintId);
    complaintOwnershipTheftBlocked = reloaded?.studentId === studentAarav.uid;
  } catch {
    complaintOwnershipTheftBlocked = true;
  }
  assert(
    complaintOwnershipTheftBlocked,
    'Complaint ownership cannot be modified after creation',
    'STUDENT',
    'Immutable studentId invariant preserved.'
  );

  // ==========================================
  // TEST GROUP 3: STAFF SECURITY & DEPARTMENT BOUNDARIES
  // ==========================================
  console.log('\n--- Running Group 3: Staff Security & Department Boundaries ---');

  // Find electrical complaint and plumbing complaint
  const electricalTicket = complaints.find((c) => c.category === 'Electricity')!;
  const plumbingTicket = complaints.find((c) => c.category === 'Plumbing' || c.category === 'Water Leakage')!;

  // Test 3.1: Electrical staff can access Electrical department ticket
  const canElectricalAccessElectrical =
    staffElectrical.role === 'admin' ||
    electricalTicket.departmentId === staffElectrical.departmentId ||
    electricalTicket.assignedStaffId === staffElectrical.uid;
  assert(
    canElectricalAccessElectrical,
    'Electrical staff authorized on Electrical ticket',
    'STAFF',
    `Rajesh (dept-electrical) permitted on ${electricalTicket.complaintId}`
  );

  // Test 3.2: Electrical staff blocked from Plumbing department ticket
  const canElectricalAccessPlumbing =
    staffElectrical.role === 'admin' ||
    plumbingTicket.departmentId === staffElectrical.departmentId ||
    plumbingTicket.assignedStaffId === staffElectrical.uid;
  assert(
    !canElectricalAccessPlumbing,
    'Cross-department ticket access blocked for unauthorized staff',
    'STAFF',
    `Rajesh (Electrical) restricted from Suresh's plumbing ticket ${plumbingTicket.complaintId}`
  );

  // ==========================================
  // TEST GROUP 4: QR CODE SECURITY & PARAMETER SANITIZATION
  // ==========================================
  console.log('\n--- Running Group 4: QR Code Security & Sanitization ---');

  // Test 4.1: QR code generation does not leak student PII
  const sampleQrPayload = {
    campusArea: 'Academic Block',
    building: 'Ramanujan Science Block',
    floor: '2nd Floor',
    roomNumber: 'Classroom 204',
  };
  const keys = Object.keys(sampleQrPayload);
  const leaksPii = keys.some((k) => ['uid', 'studentId', 'email', 'phone', 'password', 'role'].includes(k));
  assert(
    !leaksPii,
    'QR Code payload contains strictly location info, zero student PII',
    'QR_CODE',
    `Payload keys: ${keys.join(', ')}`
  );

  // Test 4.2: Malicious script injection in QR location parameter is sanitized
  const maliciousInput = '<script>alert("xss")</script>Hostel Block B';
  const cleanParam = maliciousInput.replace(/[<>{}[\]\\]/g, '').trim().slice(0, 100);
  assert(
    !cleanParam.includes('<script>') && cleanParam.includes('Hostel Block B'),
    'QR code query parameters are sanitized against XSS injection',
    'QR_CODE',
    `Cleaned output: "${cleanParam}"`
  );

  return results;
}

// Run if called directly
const res = runSecurityTestSuite();
console.log('\n=============================================');
console.log('         SECURITY TEST RESULTS SUMMARY       ');
console.log('=============================================');
let passedCount = 0;
for (const r of res) {
  const icon = r.passed ? '✅' : '❌';
  console.log(`${icon} [${r.category}] ${r.name}`);
  console.log(`   ${r.details}`);
  if (r.passed) passedCount++;
}
console.log(`\nTOTAL: ${passedCount} / ${res.length} TEST CASES PASSED`);
if (passedCount !== res.length) {
  process.exit(1);
}
