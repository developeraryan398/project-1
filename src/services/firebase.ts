import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageBackend } from './storageUtils';

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

// Check for environment variables or saved config
export function getStoredFirebaseConfig(): FirebaseClientConfig | null {
  const storage = getStorageBackend();

  // Check custom saved config in storage
  const saved = storage.getItem('campusfix_custom_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) return parsed;
    } catch {
      // ignore
    }
  }

  // Check Vite env variables
  const envConfig: FirebaseClientConfig = {
    apiKey: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_API_KEY : undefined,
    authDomain: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined,
    projectId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined,
    storageBucket: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined,
    messagingSenderId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined,
    appId: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined,
    firestoreDatabaseId: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_FIREBASE_DATABASE_ID : undefined) || '(default)',
  };

  if (envConfig.projectId && envConfig.apiKey) {
    return envConfig;
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const cfg = getStoredFirebaseConfig();
  return Boolean(cfg?.projectId && cfg?.apiKey);
}

let firebaseAppInstance: any = null;
let firestoreDbInstance: any = null;
let firebaseAuthInstance: any = null;

try {
  const config = getStoredFirebaseConfig();
  if (config?.apiKey && config?.projectId) {
    firebaseAppInstance = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreDbInstance = getFirestore(firebaseAppInstance, config.firestoreDatabaseId || '(default)');
    firebaseAuthInstance = getAuth(firebaseAppInstance);
  }
} catch (err) {
  console.warn('Firebase initialization in dev mode (fallback reactive store active):', err);
}

export const db = firestoreDbInstance;
export const auth = firebaseAuthInstance;

let firebaseStorageInstance: any = null;
try {
  if (firebaseAppInstance && getStoredFirebaseConfig()?.storageBucket) {
    firebaseStorageInstance = getStorage(firebaseAppInstance);
  }
} catch (err) {
  console.warn('Firebase storage init warning:', err);
}

export const storage = firebaseStorageInstance;

/**
 * Uploads an image either to Cloud Firebase Storage if connected,
 * or returns a base64 Data URL for persistent in-document storage.
 */
export async function uploadComplaintImage(file: File, folder: string = 'complaints'): Promise<string> {
  // If real storage bucket is configured, upload to Firebase Storage
  if (storage) {
    try {
      const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase storage upload failed, falling back to base64 data URL:', err);
    }
  }

  // Graceful fallback to client data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export interface ConnectionTestResult {
  success: boolean;
  code?: 'permission-denied' | 'unavailable' | 'unauthenticated' | 'failed-precondition' | 'success' | string;
  message: string;
  details?: {
    projectId?: string;
    databaseId?: string;
    authUid?: string | null;
    authEmail?: string | null;
    authRole?: string | null;
    online: boolean;
    testedDocument: string;
    actualErrorCode?: string;
  };
}

/**
 * Validates connection to Firestore backend
 * Adheres to firebase-integration-rpc mandate: tests connection using getDocFromServer
 * Checks authentication context, browser network, project configuration, and granular error codes.
 */
export async function testConnection(): Promise<ConnectionTestResult> {
  const isOnline = typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true;
  const config = getStoredFirebaseConfig();

  // 1. Browser Network Connectivity Check
  if (!isOnline) {
    return {
      success: false,
      code: 'unavailable',
      message: 'Browser network status is OFFLINE. Cannot reach Google Cloud Firestore servers.',
      details: {
        projectId: config?.projectId,
        databaseId: config?.firestoreDatabaseId || '(default)',
        authUid: null,
        authEmail: null,
        authRole: null,
        online: false,
        testedDocument: 'test/connection',
        actualErrorCode: 'unavailable',
      },
    };
  }

  // 2. Firebase Authentication State Check (Zero-Trust Identity)
  const currentFbUser = auth?.currentUser;
  let authUid: string | null = currentFbUser?.uid || null;
  let authEmail: string | null = currentFbUser?.email || null;
  let authRole: string | null = null;

  // Retrieve active session role from persistent session storage
  const storage = getStorageBackend();
  try {
    const rawSession = storage.getItem('campusfix_auth_session_v1');
    if (rawSession) {
      const session = JSON.parse(rawSession);
      authRole = session.role || null;
      if (!authEmail) authEmail = session.email || null;
      if (!authUid) authUid = session.uid || null;
    }
  } catch {
    // ignore
  }

  // Under Zero-Trust Security, reading /test/connection requires an authenticated session (isSignedIn())
  if (!currentFbUser && !authUid) {
    return {
      success: false,
      code: 'unauthenticated',
      message: 'Zero-Trust Security Active: Firebase Firestore requires an authenticated campus session (isSignedIn()). Please log in as Admin, Staff, or Student before running the secured health check probe.',
      details: {
        projectId: config?.projectId,
        databaseId: config?.firestoreDatabaseId || '(default)',
        authUid: null,
        authEmail: null,
        authRole: null,
        online: true,
        testedDocument: 'test/connection',
        actualErrorCode: 'unauthenticated',
      },
    };
  }

  // 3. Firebase Initialization & Configuration Check
  if (!isFirebaseConfigured() || !db) {
    return {
      success: false,
      code: 'failed-precondition',
      message: `Cloud Firebase credentials not configured or Firestore is not initialized. Authenticated session verified as ${authEmail} (${authRole || 'user'}). CampusFix is operating in local reactive mode with multi-role persistence.`,
      details: {
        projectId: config?.projectId,
        databaseId: config?.firestoreDatabaseId || '(default)',
        authUid,
        authEmail,
        authRole,
        online: true,
        testedDocument: 'test/connection',
        actualErrorCode: 'failed-precondition',
      },
    };
  }

  // 4. Server Round-Trip with getDocFromServer
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);

    return {
      success: true,
      code: 'success',
      message: `Successfully connected to Google Cloud Firestore database [project: ${config?.projectId}]. Authenticated server probe verified with role: ${authRole || 'authenticated'}.`,
      details: {
        projectId: config?.projectId,
        databaseId: config?.firestoreDatabaseId || '(default)',
        authUid,
        authEmail,
        authRole,
        online: true,
        testedDocument: 'test/connection',
        actualErrorCode: 'success',
      },
    };
  } catch (error: any) {
    // 5. Granular Error Code Extraction & Classification
    const rawCode: string = error?.code || error?.error?.code || '';
    const rawMsg: string = error instanceof Error ? error.message : String(error);
    let normalizedCode: 'permission-denied' | 'unavailable' | 'unauthenticated' | 'failed-precondition' | string = 'unknown';

    if (rawCode.includes('permission-denied') || rawMsg.includes('insufficient permissions') || rawMsg.includes('PERMISSION_DENIED')) {
      normalizedCode = 'permission-denied';
    } else if (rawCode.includes('unavailable') || rawMsg.includes('client is offline') || rawMsg.includes('network') || rawMsg.includes('UNAVAILABLE')) {
      normalizedCode = 'unavailable';
    } else if (rawCode.includes('unauthenticated') || rawMsg.includes('unauthenticated')) {
      normalizedCode = 'unauthenticated';
    } else if (rawCode.includes('failed-precondition') || rawMsg.includes('failed-precondition')) {
      normalizedCode = 'failed-precondition';
    } else {
      normalizedCode = rawCode ? rawCode.replace(/^(firestore\/|auth\/)/, '') : 'unknown';
    }

    let userFriendlyMessage = rawMsg;
    if (normalizedCode === 'permission-denied') {
      userFriendlyMessage = `[permission-denied] Firestore Security Rules rejected document probe at /test/connection. Verify that your authenticated session (${authEmail || 'user'}) has the required permissions.`;
    } else if (normalizedCode === 'unavailable') {
      userFriendlyMessage = `[unavailable] Firestore backend is unreachable. Please verify network connection or Firebase cloud project endpoints.`;
    } else if (normalizedCode === 'unauthenticated') {
      userFriendlyMessage = `[unauthenticated] Firebase authentication token is missing or expired. Please sign in again.`;
    } else if (normalizedCode === 'failed-precondition') {
      userFriendlyMessage = `[failed-precondition] Database state or query precondition failed. Verify databaseId: ${config?.firestoreDatabaseId || '(default)'}.`;
    }

    return {
      success: false,
      code: normalizedCode,
      message: userFriendlyMessage,
      details: {
        projectId: config?.projectId,
        databaseId: config?.firestoreDatabaseId || '(default)',
        authUid,
        authEmail,
        authRole,
        online: isOnline,
        testedDocument: 'test/connection',
        actualErrorCode: rawCode || normalizedCode,
      },
    };
  }
}
