import {
  UserProfile,
  UserRole,
  Department,
  Complaint,
  ActivityLog,
  NotificationItem,
  ComplaintFeedback,
  ComplaintStatus,
  ComplaintPriority,
} from '../types';
import {
  DEMO_USERS,
  DEMO_COMPLAINTS,
  DEMO_ACTIVITY_LOGS,
  DEMO_NOTIFICATIONS,
  DEMO_FEEDBACKS,
} from './mockData';
import { INITIAL_DEPARTMENTS, getAutoRoutedDepartment, calculateDueDate, generateComplaintId } from './autoAssign';
import { db, isFirebaseConfigured, auth } from './firebase';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentUser?: { uid?: string; email?: string } | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'campusfix_users_v1',
  DEPARTMENTS: 'campusfix_departments_v1',
  COMPLAINTS: 'campusfix_complaints_v1',
  ACTIVITY_LOGS: 'campusfix_activity_logs_v1',
  NOTIFICATIONS: 'campusfix_notifications_v1',
  FEEDBACK: 'campusfix_feedback_v1',
  CURRENT_USER_ID: 'campusfix_current_user_id_v1',
  ESCALATION_CHECK: 'campusfix_last_escalation_v1',
  CREDENTIALS: 'campusfix_credentials_v1',
};

// Cross-tab broadcast channel for instantaneous sync across tabs
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('campusfix_sync_channel')
  : null;

// In-memory listeners for reactive subscriptions
type Listener = () => void;
const listeners: { [collection: string]: Set<Listener> } = {
  complaints: new Set(),
  users: new Set(),
  departments: new Set(),
  activityLogs: new Set(),
  notifications: new Set(),
  feedback: new Set(),
};

function notifyListeners(collection: string) {
  listeners[collection]?.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(`Error notifying listener on ${collection}:`, e);
    }
  });

  // Notify other browser tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'COLLECTION_UPDATED', collection });
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'COLLECTION_UPDATED' && event.data.collection) {
      const col = event.data.collection;
      listeners[col]?.forEach((cb) => cb());
    }
  };
}

import { getStorageBackend } from './storageUtils';

// Storage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const storage = getStorageBackend();
    const raw = storage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    const storage = getStorageBackend();
    storage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed writing ${key} to storage:`, err);
  }
}

// Initialize seed data if storage is empty
export function initializeCampusDatabase(forceReset = false): void {
  const storage = getStorageBackend();
  const existingUsers = storage.getItem(STORAGE_KEYS.USERS);

  if (forceReset || !existingUsers) {
    setToStorage(STORAGE_KEYS.USERS, DEMO_USERS);
  } else {
    // Ensure critical admin and default accounts exist even if storage was previously initialized
    const currentUsers = getFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, []);
    let modified = false;
    for (const demoUser of DEMO_USERS) {
      const idx = currentUsers.findIndex((u) => u.email.toLowerCase() === demoUser.email.toLowerCase());
      if (idx === -1) {
        currentUsers.push(demoUser);
        modified = true;
      } else if (demoUser.role === 'admin' && currentUsers[idx].role !== 'admin') {
        currentUsers[idx].role = 'admin';
        modified = true;
      }
    }
    if (modified) {
      setToStorage(STORAGE_KEYS.USERS, currentUsers);
    }
  }
  if (forceReset || !storage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    setToStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }
  if (forceReset || !storage.getItem(STORAGE_KEYS.COMPLAINTS)) {
    setToStorage(STORAGE_KEYS.COMPLAINTS, DEMO_COMPLAINTS);
  }
  if (forceReset || !storage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    setToStorage(STORAGE_KEYS.ACTIVITY_LOGS, DEMO_ACTIVITY_LOGS);
  }
  if (forceReset || !storage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
  }
  if (forceReset || !storage.getItem(STORAGE_KEYS.FEEDBACK)) {
    setToStorage(STORAGE_KEYS.FEEDBACK, DEMO_FEEDBACKS);
  }

  // Seed default credentials for initial users
  const creds = getFromStorage<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
  let credsModified = false;
  DEMO_USERS.forEach((u) => {
    if (!creds[u.email.toLowerCase()]) {
      creds[u.email.toLowerCase()] = 'password123';
      credsModified = true;
    }
  });
  if (!creds['aryan2008dbg@gmail.com']) {
    creds['aryan2008dbg@gmail.com'] = 'password123';
    credsModified = true;
  }
  if (!creds['admin@campusfix.edu']) {
    creds['admin@campusfix.edu'] = 'password123';
    credsModified = true;
  }
  if (credsModified || forceReset) {
    setToStorage(STORAGE_KEYS.CREDENTIALS, creds);
  }

  // Check overdue deadlines on startup
  runEscalationCheck();
}

/**
 * Escalation scanner:
 * Checks all active complaints against their SLA deadline (dueAt).
 * Flags overdue complaints, logs escalation history, and notifies higher management.
 */
export function runEscalationCheck(): number {
  const complaints = getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
  const users = getFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const adminUsers = users.filter((u) => u.role === 'admin');
  const adminTargetUids = Array.from(new Set(['admin-1', ...adminUsers.map((a) => a.uid)]));

  const now = new Date().getTime();
  let updatedCount = 0;

  const newComplaints = complaints.map((c) => {
    // If resolved or verified or rejected, not overdue
    if (['Resolved', 'Verified', 'Rejected'].includes(c.status)) {
      return c;
    }

    const dueTime = new Date(c.dueAt).getTime();
    if (now > dueTime && !c.isOverdue) {
      updatedCount++;
      const hoursOverdue = Math.max(1, Math.round((now - dueTime) / (1000 * 60 * 60)));
      const timestampIso = new Date().toISOString();

      const existingHistory = c.escalationHistory || [];
      const newHistoryItem = {
        escalatedAt: timestampIso,
        reason: `SLA resolution deadline (${new Date(c.dueAt).toLocaleString()}) breached by ${hoursOverdue} hour(s) for ${c.priority} priority ticket.`,
        triggeredBy: 'Automated SLA Escalation Service',
        hoursOverdue,
        notifiedRoles: ['admin'],
      };

      // Notify all authorized higher management (admin accounts)
      adminTargetUids.forEach((adminUid) => {
        addNotificationInternal({
          notificationId: `notif-esc-${Date.now()}-${adminUid}-${Math.random().toString(36).substring(2, 5)}`,
          userId: adminUid,
          title: `Overdue SLA Escalation: ${c.complaintId}`,
          message: `${c.priority} priority complaint "${c.title}" at ${c.location.building} is past its SLA deadline by ${hoursOverdue}h. Immediate attention required.`,
          complaintId: c.complaintId,
          read: false,
          timestamp: timestampIso,
          type: 'escalation',
        });
      });

      // Record activity audit log with user ID
      addActivityLogInternal({
        logId: `log-esc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        complaintId: c.complaintId,
        action: 'SLA Escalation Flagged',
        updatedBy: 'SLA Automation Monitor',
        updatedByUid: 'system-sla-escalation',
        updatedByRole: 'admin',
        timestamp: timestampIso,
        note: `Passed resolution deadline of ${new Date(c.dueAt).toLocaleString()} by ${hoursOverdue} hour(s). Flagged for emergency management escalation.`,
      });

      return {
        ...c,
        isOverdue: true,
        escalatedToManagement: true,
        escalatedAt: timestampIso,
        escalationHistory: [...existingHistory, newHistoryItem],
      };
    }
    return c;
  });

  if (updatedCount > 0) {
    setToStorage(STORAGE_KEYS.COMPLAINTS, newComplaints);
    notifyListeners('complaints');
  }

  return updatedCount;
}

// Internal activity log helper
function addActivityLogInternal(log: ActivityLog): void {
  const logs = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
  logs.unshift(log);
  setToStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);

  if (isFirebaseConfigured() && db) {
    setDoc(doc(db, 'activityLogs', log.logId), log).catch((err) => {
      console.warn('Firestore activityLogs sync note (handled):', err);
    });
  }

  notifyListeners('activityLogs');
}

// Internal notification helper
function addNotificationInternal(item: NotificationItem): void {
  const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  notifs.unshift(item);
  setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);

  if (isFirebaseConfigured() && db) {
    setDoc(doc(db, 'notifications', item.notificationId), item).catch((err) => {
      console.warn('Firestore notifications sync note (handled):', err);
    });
  }

  notifyListeners('notifications');
}

// Unified Database API (matches Firestore semantics)
export const CampusDB = {
  // Complaints
  getComplaints(): Complaint[] {
    return getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, DEMO_COMPLAINTS);
  },

  getComplaintById(id: string): Complaint | undefined {
    const list = this.getComplaints();
    return list.find((c) => c.complaintId === id);
  },

  createComplaint(data: Omit<Complaint, 'complaintId' | 'status' | 'createdAt' | 'updatedAt' | 'dueAt' | 'departmentId' | 'departmentName'> & {
    departmentId?: string;
    departmentName?: string;
  }): Complaint {
    const complaints = this.getComplaints();
    const complaintId = generateComplaintId();
    const now = new Date().toISOString();

    // Auto-routing if not overridden
    const autoDept = data.departmentId && data.departmentName
      ? { departmentId: data.departmentId, departmentName: data.departmentName }
      : getAutoRoutedDepartment(data.category);

    const departments = this.getDepartments();
    const dueAt = calculateDueDate(data.priority, autoDept.departmentId, departments);

    const newComplaint: Complaint = {
      ...data,
      complaintId,
      departmentId: autoDept.departmentId,
      departmentName: autoDept.departmentName,
      status: 'Submitted',
      dueAt,
      isOverdue: false,
      escalatedToManagement: false,
      createdAt: now,
      updatedAt: now,
    };

    complaints.unshift(newComplaint);
    setToStorage(STORAGE_KEYS.COMPLAINTS, complaints);

    // Create initial activity log
    addActivityLogInternal({
      logId: `log-${Date.now()}-init`,
      complaintId,
      action: 'Complaint Submitted',
      newStatus: 'Submitted',
      updatedBy: data.studentName,
      updatedByRole: 'student',
      timestamp: now,
      note: `Ticket created under ${data.category}. Auto-routed to ${autoDept.departmentName}.`,
    });

    // Notify all authorized Campus Management & Admins in real time
    const currentUsers = this.getUsers();
    const adminUsers = currentUsers.filter((u) => u.role === 'admin');
    const adminTargetUids = Array.from(new Set(['admin-1', ...adminUsers.map((a) => a.uid)]));

    adminTargetUids.forEach((adminUid) => {
      addNotificationInternal({
        notificationId: `notif-${Date.now()}-${adminUid}-${Math.random().toString(36).substring(2, 5)}`,
        userId: adminUid,
        title: `New Complaint Filed: ${complaintId}`,
        message: `${data.studentName} reported "${data.title}" at ${data.location.building} (${data.priority} Priority).`,
        complaintId,
        read: false,
        timestamp: now,
        type: 'status_update',
      });
    });

    // If Cloud Firebase Firestore is configured, asynchronously persist document
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'complaints', complaintId), newComplaint).catch((err) => {
        console.warn('Firestore complaints sync note (handled):', err);
      });
    }

    notifyListeners('complaints');
    return newComplaint;
  },

  updateComplaint(
    id: string,
    updates: Partial<Complaint>,
    actor: { name: string; role: 'student' | 'staff' | 'admin'; uid?: string },
    note?: string
  ): Complaint {
    const complaints = this.getComplaints();
    const idx = complaints.findIndex((c) => c.complaintId === id);
    if (idx === -1) {
      throw new Error(`Complaint ${id} not found`);
    }

    const prev = complaints[idx];
    const now = new Date().toISOString();

    // Strict Immutability & Tiered RBAC Enforcement
    const safeUpdates = { ...updates };
    delete safeUpdates.complaintId;
    delete safeUpdates.studentId;
    delete safeUpdates.createdAt;

    if (actor.role === 'student') {
      // Students can only update status (to Verified or Reopened) and reopenReason
      delete safeUpdates.assignedStaffId;
      delete safeUpdates.assignedStaffName;
      delete safeUpdates.departmentId;
      delete safeUpdates.departmentName;
      delete safeUpdates.resolutionNote;
      delete safeUpdates.resolutionImageUrls;
      delete safeUpdates.priority; // Students cannot change priority
      if (safeUpdates.status && !['Verified', 'Reopened'].includes(safeUpdates.status)) {
        delete safeUpdates.status;
      }
    } else if (actor.role === 'staff') {
      // Staff cannot alter student identity or basic complaint definition
      delete safeUpdates.studentEmail;
      delete safeUpdates.studentName;
      delete safeUpdates.studentPhone;
      delete safeUpdates.priority; // Only management can change priority
      delete safeUpdates.category;
    }

    // If management changed priority, adjust SLA due date dynamically
    if (safeUpdates.priority && safeUpdates.priority !== prev.priority) {
      const targetDeptId = safeUpdates.departmentId || prev.departmentId;
      safeUpdates.dueAt = calculateDueDate(safeUpdates.priority, targetDeptId, this.getDepartments());
    }

    const updated: Complaint = {
      ...prev,
      ...safeUpdates,
      studentId: prev.studentId, // Strictly immutable
      complaintId: prev.complaintId, // Strictly immutable
      createdAt: prev.createdAt, // Strictly immutable
      updatedAt: now,
    };

    // If status changed to resolved, set resolvedAt
    if (updates.status === 'Resolved' && !prev.resolvedAt) {
      updated.resolvedAt = now;
    }
    // If status changed to verified, set verifiedAt
    if (updates.status === 'Verified' && !prev.verifiedAt) {
      updated.verifiedAt = now;
    }

    complaints[idx] = updated;
    setToStorage(STORAGE_KEYS.COMPLAINTS, complaints);

    // Log activity if status changed or major field altered
    if (updates.status && updates.status !== prev.status) {
      addActivityLogInternal({
        logId: `log-${Date.now()}-status`,
        complaintId: id,
        action: `Status Changed to ${updates.status}`,
        oldStatus: prev.status,
        newStatus: updates.status,
        updatedBy: actor.name,
        updatedByUid: actor.uid,
        updatedByRole: actor.role,
        timestamp: now,
        note: note || updates.resolutionNote || updates.reopenReason || `Updated by ${actor.name} (${actor.role})`,
      });

      // Notify Student
      if (actor.role !== 'student') {
        addNotificationInternal({
          notificationId: `notif-${Date.now()}-student`,
          userId: prev.studentId,
          title: `Update on ${prev.complaintId}: ${updates.status}`,
          message: `${actor.name} updated your complaint status to "${updates.status}". ${note ? `Note: "${note}"` : ''}`,
          complaintId: id,
          read: false,
          timestamp: now,
          type: 'status_update',
        });
      }

      // Notify Staff if student reopened or verified
      if (actor.role === 'student' && prev.assignedStaffId) {
        addNotificationInternal({
          notificationId: `notif-${Date.now()}-staff`,
          userId: prev.assignedStaffId,
          title: updates.status === 'Reopened' ? `Issue Reopened: ${prev.complaintId}` : `Issue Verified: ${prev.complaintId}`,
          message: `${actor.name} ${updates.status === 'Reopened' ? 'reopened complaint. Reason: ' + (updates.reopenReason || 'Not fully fixed') : 'confirmed resolution.'}`,
          complaintId: id,
          read: false,
          timestamp: now,
          type: 'status_update',
        });
      }
    } else if (updates.assignedStaffId && updates.assignedStaffId !== prev.assignedStaffId) {
      addActivityLogInternal({
        logId: `log-${Date.now()}-assign`,
        complaintId: id,
        action: 'Assigned Staff Updated',
        oldStatus: prev.status,
        newStatus: prev.status,
        updatedBy: actor.name,
        updatedByUid: actor.uid,
        updatedByRole: actor.role,
        timestamp: now,
        note: `Assigned to ${updates.assignedStaffName || updates.assignedStaffId}`,
      });

      // Notify newly assigned staff
      if (updates.assignedStaffId) {
        addNotificationInternal({
          notificationId: `notif-${Date.now()}-staff-assign`,
          userId: updates.assignedStaffId,
          title: `New Task Assigned: ${prev.complaintId}`,
          message: `You were assigned "${prev.title}" at ${prev.location.building} by ${actor.name}.`,
          complaintId: id,
          read: false,
          timestamp: now,
          type: 'assignment',
        });
      }
    } else if (updates.priority && updates.priority !== prev.priority) {
      addActivityLogInternal({
        logId: `log-${Date.now()}-priority`,
        complaintId: id,
        action: `Priority Changed to ${updates.priority}`,
        updatedBy: actor.name,
        updatedByUid: actor.uid,
        updatedByRole: actor.role,
        timestamp: now,
        note: note || `Priority adjusted from ${prev.priority} to ${updates.priority} by ${actor.name}`,
      });
    }

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'complaints', id), updated, { merge: true }).catch((err) => {
        console.warn('Firestore complaints update sync note (handled):', err);
      });
    }

    notifyListeners('complaints');
    return updated;
  },

  // Users & Authentication Security
  getUsers(): UserProfile[] {
    return getFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, DEMO_USERS);
  },

  getUserById(uid: string): UserProfile | undefined {
    return this.getUsers().find((u) => u.uid === uid);
  },

  getUserByEmail(email: string): UserProfile | undefined {
    const normalized = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.toLowerCase() === normalized);
  },

  verifyCredentials(email: string, password: string): { success: boolean; user?: UserProfile; message?: string } {
    const normalized = email.trim().toLowerCase();
    const user = this.getUserByEmail(normalized);
    if (!user) {
      return { success: false, message: 'No registered account found with this campus email.' };
    }

    const creds = getFromStorage<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
    const expectedPassword = creds[normalized] || 'password123';

    if (password !== expectedPassword) {
      return { success: false, message: 'Invalid password. Please check your credentials and try again.' };
    }

    return { success: true, user };
  },

  registerStudent(
    data: Omit<UserProfile, 'uid' | 'createdAt' | 'role'>,
    password: string
  ): UserProfile {
    const normalized = data.email.trim().toLowerCase();
    const existing = this.getUserByEmail(normalized);
    if (existing) {
      throw new Error('An account with this campus email already exists. Please sign in instead.');
    }

    // STRICT ROLE INVARIANT: Public registration must ALWAYS be 'student'
    const newUid = `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStudent: UserProfile = {
      ...data,
      email: normalized,
      uid: newUid,
      role: 'student', // Forced on backend/store layer
      createdAt: new Date().toISOString(),
      avatarUrl: data.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
    };

    const users = this.getUsers();
    users.push(newStudent);
    setToStorage(STORAGE_KEYS.USERS, users);

    // Save credential securely
    const creds = getFromStorage<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
    creds[normalized] = password;
    setToStorage(STORAGE_KEYS.CREDENTIALS, creds);

    // Welcome Notification
    addNotificationInternal({
      notificationId: `notif-welcome-${Date.now()}`,
      userId: newUid,
      title: 'Welcome to CampusFix!',
      message: 'Your student account has been registered. You can now report campus issues and track resolutions live.',
      complaintId: '',
      read: false,
      timestamp: new Date().toISOString(),
      type: 'general',
    });

    notifyListeners('users');
    return newStudent;
  },

  updatePassword(email: string, newPassword: string): boolean {
    const normalized = email.trim().toLowerCase();
    const user = this.getUserByEmail(normalized);
    if (!user) return false;

    const creds = getFromStorage<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
    creds[normalized] = newPassword;
    setToStorage(STORAGE_KEYS.CREDENTIALS, creds);
    return true;
  },

  addUser(user: UserProfile, actor?: { role: UserRole }): UserProfile {
    // Only administrators can create staff or admin accounts
    if (user.role !== 'student' && actor?.role !== 'admin') {
      throw new Error('Forbidden: Only authorized campus administrators can create staff or admin accounts.');
    }

    const users = this.getUsers();
    users.push(user);
    setToStorage(STORAGE_KEYS.USERS, users);

    // Default password for newly added staff/student
    const creds = getFromStorage<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
    if (!creds[user.email.toLowerCase()]) {
      creds[user.email.toLowerCase()] = 'password123';
      setToStorage(STORAGE_KEYS.CREDENTIALS, creds);
    }

    notifyListeners('users');
    return user;
  },

  updateUser(uid: string, updates: Partial<UserProfile>, actor?: { role: UserRole }): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw new Error('User not found');

    // STRICT INVARIANT: Non-admin users cannot alter 'role', 'uid', or 'createdAt'
    if (updates.role && updates.role !== users[idx].role && actor?.role !== 'admin') {
      throw new Error('Forbidden: Role privilege escalation prevented. Only administrators can alter user roles.');
    }

    users[idx] = { ...users[idx], ...updates };
    setToStorage(STORAGE_KEYS.USERS, users);
    notifyListeners('users');
    return users[idx];
  },

  // Departments
  getDepartments(): Department[] {
    return getFromStorage<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  addDepartment(dept: Department): Department {
    const list = this.getDepartments();
    list.push(dept);
    setToStorage(STORAGE_KEYS.DEPARTMENTS, list);
    notifyListeners('departments');
    return dept;
  },

  updateDepartment(id: string, updates: Partial<Department>): Department {
    const list = this.getDepartments();
    const idx = list.findIndex((d) => d.departmentId === id);
    if (idx === -1) throw new Error('Department not found');
    list[idx] = { ...list[idx], ...updates };
    setToStorage(STORAGE_KEYS.DEPARTMENTS, list);
    notifyListeners('departments');
    return list[idx];
  },

  // Activity Logs
  getActivityLogs(complaintId?: string, actor?: { role: UserRole; uid?: string }): ActivityLog[] {
    const logs = getFromStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, DEMO_ACTIVITY_LOGS);
    if (complaintId) {
      return logs.filter((l) => l.complaintId === complaintId);
    }
    // Only authorized management (admin) can access the complete global audit stream
    if (actor && actor.role !== 'admin') {
      return logs.filter((l) => l.updatedByUid === actor.uid);
    }
    return logs;
  },

  // Notifications
  getNotifications(userId?: string): NotificationItem[] {
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    if (userId) {
      return notifs.filter((n) => n.userId === userId);
    }
    return notifs;
  },

  markNotificationAsRead(id: string): void {
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.notificationId === id ? { ...n, read: true } : n));
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    notifyListeners('notifications');
  },

  markAllNotificationsAsRead(userId: string): void {
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
    notifyListeners('notifications');
  },

  // Feedback
  getFeedbacks(complaintId?: string): ComplaintFeedback[] {
    const list = getFromStorage<ComplaintFeedback[]>(STORAGE_KEYS.FEEDBACK, DEMO_FEEDBACKS);
    if (complaintId) {
      return list.filter((f) => f.complaintId === complaintId);
    }
    return list;
  },

  submitFeedback(fb: Omit<ComplaintFeedback, 'feedbackId' | 'createdAt'>): ComplaintFeedback {
    const list = this.getFeedbacks();

    // Prevent duplicate ratings: Each complaint can only have one rating from the student
    const existing = list.find((f) => f.complaintId === fb.complaintId && f.studentId === fb.studentId);
    if (existing) {
      throw new Error('Duplicate rating blocked: A rating has already been recorded for this complaint.');
    }

    const newFeedback: ComplaintFeedback = {
      ...fb,
      comment: fb.comment?.trim() || '',
      feedbackId: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newFeedback);
    setToStorage(STORAGE_KEYS.FEEDBACK, list);

    // Notify Admin & Staff
    const complaint = this.getComplaintById(fb.complaintId);
    if (complaint?.assignedStaffId) {
      addNotificationInternal({
        notificationId: `notif-fb-${Date.now()}`,
        userId: complaint.assignedStaffId,
        title: `Rating Received: ${fb.rating} Stars!`,
        message: `${fb.studentName} rated resolution for ${complaint.complaintId}: "${fb.comment || 'No written comments.'}"`,
        complaintId: fb.complaintId,
        read: false,
        timestamp: new Date().toISOString(),
        type: 'feedback_request',
      });
    }

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'feedback', newFeedback.feedbackId), newFeedback).catch((err) => {
        console.warn('Firestore feedback sync note (handled):', err);
      });
    }

    notifyListeners('feedback');
    return newFeedback;
  },

  // Direct and Broadcast Notifications
  sendNotification(item: Omit<NotificationItem, 'notificationId' | 'timestamp' | 'read'>): NotificationItem {
    const full: NotificationItem = {
      ...item,
      notificationId: `notif-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    addNotificationInternal(full);
    return full;
  },

  broadcastNotification(data: { title: string; message: string; targetRole?: 'all' | 'student' | 'staff'; complaintId?: string }): number {
    const users = this.getUsers();
    let sent = 0;
    const now = new Date().toISOString();
    users.forEach((u) => {
      if (data.targetRole && data.targetRole !== 'all' && u.role !== data.targetRole) return;
      addNotificationInternal({
        notificationId: `notif-bcast-${Date.now()}-${u.uid}`,
        userId: u.uid,
        title: data.title,
        message: data.message,
        complaintId: data.complaintId,
        read: false,
        timestamp: now,
        type: 'general',
      });
      sent++;
    });
    return sent;
  },

  // Reactive subscription (emulates Firestore onSnapshot)
  subscribe(collection: 'complaints' | 'users' | 'departments' | 'activityLogs' | 'notifications' | 'feedback', callback: () => void): () => void {
    if (!listeners[collection]) {
      listeners[collection] = new Set();
    }
    listeners[collection].add(callback);
    return () => {
      listeners[collection]?.delete(callback);
    };
  },

  // Reset to original seed data
  resetToDemoSeed(): void {
    initializeCampusDatabase(true);
    notifyListeners('complaints');
    notifyListeners('users');
    notifyListeners('departments');
    notifyListeners('activityLogs');
    notifyListeners('notifications');
    notifyListeners('feedback');
  },
};

/**
 * Sets up bidirectional real-time Firestore synchronization for the authenticated user session.
 * Respects ABAC boundaries:
 * - Admin subscribes to all complaints and notifications.
 * - Staff subscribes to complaints for their department or assigned to their uid.
 * - Students subscribe exclusively to their own complaints and notifications.
 */
export function setupFirestoreRealtimeSync(user: UserProfile | null): () => void {
  if (typeof window === 'undefined' || !isFirebaseConfigured() || !db || !user) {
    return () => {};
  }

  const unsubs: (() => void)[] = [];

  try {
    // 1. Complaints Live Listener
    let complaintsQuery;
    if (user.role === 'admin') {
      complaintsQuery = collection(db, 'complaints');
    } else if (user.role === 'staff') {
      if (user.departmentId) {
        complaintsQuery = query(collection(db, 'complaints'), where('departmentId', '==', user.departmentId));
      } else {
        complaintsQuery = query(collection(db, 'complaints'), where('assignedStaffId', '==', user.uid));
      }
    } else {
      // student
      complaintsQuery = query(collection(db, 'complaints'), where('studentId', '==', user.uid));
    }

    const unsubComplaints = onSnapshot(
      complaintsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteComplaints: Complaint[] = [];
          snapshot.forEach((docSnap) => {
            remoteComplaints.push(docSnap.data() as Complaint);
          });

          // Merge with local storage
          const localComplaints = getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
          const merged = [...localComplaints];
          remoteComplaints.forEach((rc) => {
            const idx = merged.findIndex((c) => c.complaintId === rc.complaintId);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...rc };
            } else {
              merged.unshift(rc);
            }
          });
          setToStorage(STORAGE_KEYS.COMPLAINTS, merged);
          notifyListeners('complaints');
        }
      },
      (error) => {
        console.warn('Firestore complaints onSnapshot note:', error?.message);
      }
    );
    unsubs.push(unsubComplaints);

    // 2. Notifications Live Listener
    let notifQuery;
    if (user.role === 'admin') {
      notifQuery = collection(db, 'notifications');
    } else {
      notifQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    }

    const unsubNotifs = onSnapshot(
      notifQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteNotifs: NotificationItem[] = [];
          snapshot.forEach((docSnap) => {
            remoteNotifs.push(docSnap.data() as NotificationItem);
          });
          const localNotifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
          const merged = [...localNotifs];
          remoteNotifs.forEach((rn) => {
            const idx = merged.findIndex((n) => n.notificationId === rn.notificationId);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...rn };
            } else {
              merged.unshift(rn);
            }
          });
          setToStorage(STORAGE_KEYS.NOTIFICATIONS, merged);
          notifyListeners('notifications');
        }
      },
      (error) => {
        console.warn('Firestore notifications onSnapshot note:', error?.message);
      }
    );
    unsubs.push(unsubNotifs);

    // 3. Departments Live Listener
    const unsubDepts = onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteDepts: Department[] = [];
          snapshot.forEach((docSnap) => {
            remoteDepts.push(docSnap.data() as Department);
          });
          if (remoteDepts.length > 0) {
            setToStorage(STORAGE_KEYS.DEPARTMENTS, remoteDepts);
            notifyListeners('departments');
          }
        }
      },
      (error) => {
        console.warn('Firestore departments onSnapshot note:', error?.message);
      }
    );
    unsubs.push(unsubDepts);
  } catch (err) {
    console.warn('Error setting up Firestore real-time listeners:', err);
  }

  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
  };
}
