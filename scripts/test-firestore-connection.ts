import { testConnection, isFirebaseConfigured, getStoredFirebaseConfig } from '../src/services/firebase';
import { CampusDB, initializeCampusDatabase } from '../src/services/store';
import { getStorageBackend } from '../src/services/storageUtils';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
}

async function runFirestoreConnectionTestSuite() {
  console.log('\n======================================================');
  console.log(' CAMPUSFIX FIRESTORE CONNECTION & REAL-TIME TEST SUITE');
  console.log('======================================================\n');

  const storage = getStorageBackend();

  // Test 1: Verify firestore.rules for /test/{testId} and Zero-Trust Security
  console.log('--- 1. FIRESTORE SECURITY RULES INSPECTION ---');
  const rulesPath = resolve(process.cwd(), 'firestore.rules');
  const rulesContent = readFileSync(rulesPath, 'utf-8');

  assert(
    rulesContent.includes('match /{document=**}') && rulesContent.includes('allow read, write: if false;'),
    'Default-Deny Catch-All rule active (Anti-Scraping Shield)'
  );

  assert(
    rulesContent.includes('match /test/{testId}') && rulesContent.includes('allow read: if isSignedIn()'),
    'Secure Health Check rule present: match /test/{testId} requires isSignedIn()'
  );

  assert(
    rulesContent.includes('allow write: if isAdmin() && isValidId(testId);'),
    'Health Check write restricted strictly to isAdmin()'
  );

  assert(
    !rulesContent.includes('allow read: if true;') && !rulesContent.includes('allow write: if true;'),
    'Zero unrestricted public reads or writes exist in entire ruleset'
  );

  // Test 2: Verify firebase-blueprint.json Intermediate Representation
  console.log('\n--- 2. FIREBASE BLUEPRINT SCHEMA SYNC ---');
  const blueprintPath = resolve(process.cwd(), 'firebase-blueprint.json');
  const blueprint = JSON.parse(readFileSync(blueprintPath, 'utf-8'));

  assert(
    Boolean(blueprint.entities?.HealthCheck),
    'HealthCheck entity defined in firebase-blueprint.json'
  );

  assert(
    Boolean(blueprint.firestore?.['/test/{testId}']),
    '/test/{testId} path registered in firebase-blueprint.json firestore mapping'
  );

  // Test 3: Unauthenticated testConnection Probe
  console.log('\n--- 3. UNAUTHENTICATED SESSION CONNECTIVITY PROBE ---');
  // Clear any existing active session
  storage.removeItem('campusfix_auth_session_v1');

  const unauthResult = await testConnection();
  console.log('  Result Message:', unauthResult.message);
  console.log('  Reported Code :', unauthResult.code);

  assert(
    unauthResult.success === false,
    'Unauthenticated probe correctly rejected (Does not allow unauthenticated access)'
  );

  assert(
    unauthResult.code === 'unauthenticated' || unauthResult.code === 'failed-precondition',
    `Returns specific zero-trust error code (Received: ${unauthResult.code})`
  );

  // Test 4: Authenticated Sessions (Admin, Staff, Student)
  console.log('\n--- 4. MULTI-ROLE AUTHENTICATED SESSION CONNECTIVITY PROBES ---');
  initializeCampusDatabase();

  // 4a. Admin Session Probe
  storage.setItem(
    'campusfix_auth_session_v1',
    JSON.stringify({
      uid: 'admin-1',
      email: 'aryan2008dbg@gmail.com',
      role: 'admin',
      timestamp: Date.now(),
    })
  );

  const adminResult = await testConnection();
  console.log('  [Admin Session] Code:', adminResult.code, '| Message:', adminResult.message);
  assert(
    adminResult.details?.authRole === 'admin' && adminResult.details?.authEmail === 'aryan2008dbg@gmail.com',
    'Admin authenticated identity verified in diagnostic context'
  );

  // 4b. Staff Session Probe
  storage.setItem(
    'campusfix_auth_session_v1',
    JSON.stringify({
      uid: 'staff-electric-1',
      email: 'rajesh.electric@campusfix.edu',
      role: 'staff',
      timestamp: Date.now(),
    })
  );

  const staffResult = await testConnection();
  console.log('  [Staff Session] Code:', staffResult.code, '| Message:', staffResult.message);
  assert(
    staffResult.details?.authRole === 'staff' && staffResult.details?.authEmail === 'rajesh.electric@campusfix.edu',
    'Staff authenticated identity verified in diagnostic context'
  );

  // 4c. Student Session Probe
  storage.setItem(
    'campusfix_auth_session_v1',
    JSON.stringify({
      uid: 'student-1',
      email: 'aarav.22cs101@campusfix.edu',
      role: 'student',
      timestamp: Date.now(),
    })
  );

  const studentResult = await testConnection();
  console.log('  [Student Session] Code:', studentResult.code, '| Message:', studentResult.message);
  assert(
    studentResult.details?.authRole === 'student' && studentResult.details?.authEmail === 'aarav.22cs101@campusfix.edu',
    'Student authenticated identity verified in diagnostic context'
  );

  // Test 5: Real-Time Sync Verification (Student submits complaint -> Admin Dashboard receives in real-time)
  console.log('\n--- 5. REAL-TIME STUDENT COMPLAINT DISPATCH TO ADMIN DASHBOARD ---');
  let adminListenerTriggered = false;
  let receivedTicketId = '';

  // Simulate Admin Dashboard subscribing to real-time complaint updates
  const unsubscribeAdmin = CampusDB.subscribe('complaints', () => {
    adminListenerTriggered = true;
    const latest = CampusDB.getComplaints();
    if (latest.length > 0) {
      receivedTicketId = latest[0].complaintId;
    }
  });

  // Student submits a new complaint
  const testStudentComplaint = CampusDB.createComplaint({
    title: 'Water Leakage in Lab 304 Sink',
    description: 'Continuous dripping from cold water faucet causing pool on counter.',
    category: 'Plumbing',
    priority: 'Urgent',
    location: {
      building: 'Aryabhata Academic Block',
      floor: '3rd Floor',
      room: 'Room 304 - Computer Science Lab',
    },
    studentId: 'student-1',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav.22cs101@campusfix.edu',
    studentPhone: '+91 98765 43210',
    imageUrls: [],
  });

  assert(
    adminListenerTriggered === true,
    'Admin Dashboard real-time subscriber triggered instantly upon student complaint creation'
  );

  assert(
    receivedTicketId === testStudentComplaint.complaintId,
    `Admin Dashboard received new complaint (${receivedTicketId}) in real time`
  );

  const adminNotifications = CampusDB.getNotifications('admin-1');
  const hasNewTicketNotif = adminNotifications.some((n) => n.complaintId === testStudentComplaint.complaintId);
  assert(
    hasNewTicketNotif,
    'Admin received instant notification for newly submitted student complaint'
  );

  unsubscribeAdmin();

  // Test 6: Summary
  console.log('\n======================================================');
  console.log(` TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runFirestoreConnectionTestSuite().catch((err) => {
  console.error('Test suite crashed with unhandled error:', err);
  process.exit(1);
});
