import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { CampusDB, initializeCampusDatabase, setupFirestoreRealtimeSync } from '../services/store';
import {
  auth,
  db,
  isFirebaseConfigured,
} from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SESSION_STORAGE_KEY = 'campusfix_auth_session_v1';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24-hour session persistence

// Designated trusted campus administrators
const DESIGNATED_ADMIN_EMAILS = [
  'aryan2008dbg@gmail.com',
  'admin@campusfix.edu',
];

interface AuthSession {
  uid: string;
  email: string;
  role: UserRole;
  timestamp: number;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user: UserProfile }>;
  register: (
    data: Omit<UserProfile, 'uid' | 'createdAt' | 'role'>,
    password: string
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateCurrentUser: (data: Partial<UserProfile>) => void;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize DB and validate persistent active session
  useEffect(() => {
    initializeCampusDatabase();
    const users = CampusDB.getUsers();
    setAllUsers(users);

    // 1. Check local session cache first
    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        const session: AuthSession = JSON.parse(rawSession);
        const isExpired = Date.now() - session.timestamp > SESSION_EXPIRY_MS;

        if (isExpired) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setCurrentUser(null);
        } else {
          // Look up user document to ensure role integrity
          const found = users.find((u) => u.uid === session.uid || u.email.toLowerCase() === session.email.toLowerCase());
          if (found) {
            // Ensure designated admin maintains admin role
            if (DESIGNATED_ADMIN_EMAILS.includes(found.email.toLowerCase())) {
              found.role = 'admin';
            }
            setCurrentUser(found);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }

    // 2. Firebase Auth State Listener & Firestore Role Synchronization
    let unsubAuth = () => {};
    if (isFirebaseConfigured() && auth && db) {
      unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(userDocRef);
            const userEmail = fbUser.email?.toLowerCase() || '';
            const isDesignated = DESIGNATED_ADMIN_EMAILS.includes(userEmail);

            if (snap.exists()) {
              const profile = snap.data() as UserProfile;
              if (isDesignated && profile.role !== 'admin') {
                profile.role = 'admin';
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              }
              setCurrentUser(profile);
            } else if (isDesignated) {
              // Auto-provision admin user document in Firestore
              const adminProfile: UserProfile = {
                uid: fbUser.uid,
                email: userEmail,
                name: fbUser.displayName || 'Campus Administrator',
                role: 'admin',
                createdAt: new Date().toISOString(),
                avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              };
              await setDoc(userDocRef, adminProfile);
              setCurrentUser(adminProfile);
            }
          } catch (err) {
            console.warn('Error syncing auth state with Firestore users:', err);
          }
        }
      });
    }

    // Subscribe to user directory updates
    const unsubscribe = CampusDB.subscribe('users', () => {
      const refreshed = CampusDB.getUsers();
      setAllUsers(refreshed);
      setCurrentUser((prev) => {
        if (!prev) return null;
        return refreshed.find((u) => u.uid === prev.uid) || prev;
      });
    });

    return () => {
      unsubscribe();
      unsubAuth();
    };
  }, []);

  // Bidirectional real-time Firestore synchronization for active session
  useEffect(() => {
    if (!currentUser) return;
    const cleanupSync = setupFirestoreRealtimeSync(currentUser);
    return () => {
      cleanupSync();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.departmentId]);

  /**
   * Real Authentication: Verifies credentials across admin, staff, and student roles.
   * Fetches the authenticated user's role from Firestore users collection.
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user: UserProfile }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error('Please enter both campus email and password.');
    }

    const isDesignatedAdmin = DESIGNATED_ADMIN_EMAILS.includes(normalized);

    // 1. Firebase Authentication & Firestore Role Retrieval
    if (isFirebaseConfigured() && auth && db) {
      try {
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, normalized, password);
        } catch (signInErr: any) {
          // If app owner admin account doesn't exist yet in Firebase Auth, securely provision initial admin
          if (
            isDesignatedAdmin &&
            (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential')
          ) {
            cred = await createUserWithEmailAndPassword(auth, normalized, password);
          } else {
            throw signInErr;
          }
        }

        if (cred && cred.user) {
          // Fetch authenticated user's role directly from Firestore users collection
          const userDocRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(userDocRef);
          let userProfile: UserProfile;

          if (snap.exists()) {
            userProfile = snap.data() as UserProfile;
            // Strict role guard: App owner & designated admin emails always have admin privileges
            if (isDesignatedAdmin && userProfile.role !== 'admin') {
              userProfile.role = 'admin';
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }
          } else {
            // Provision initial user profile in Firestore
            userProfile = {
              uid: cred.user.uid,
              email: normalized,
              name: isDesignatedAdmin
                ? 'Campus Administrator'
                : cred.user.displayName || normalized.split('@')[0],
              role: isDesignatedAdmin ? 'admin' : 'student',
              createdAt: new Date().toISOString(),
              avatarUrl:
                cred.user.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            };
            await setDoc(userDocRef, userProfile);
          }

          // Sync into local reactive database for seamless zero-latency UI
          const localUsers = CampusDB.getUsers();
          const existingLocal = localUsers.find((u) => u.email.toLowerCase() === normalized);
          if (!existingLocal) {
            CampusDB.addUser(userProfile, { role: 'admin' });
          } else if (existingLocal.role !== userProfile.role) {
            CampusDB.updateUser(existingLocal.uid, { role: userProfile.role }, { role: 'admin' });
          }

          // Secure persistent session
          const session: AuthSession = {
            uid: userProfile.uid,
            email: userProfile.email,
            role: userProfile.role,
            timestamp: Date.now(),
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          setCurrentUser(userProfile);

          return { success: true, user: userProfile };
        }
      } catch (fbErr: any) {
        console.warn('Firebase Auth sign in failed, verifying local security store:', fbErr?.message);
        // If it was wrong password on real Firebase Auth, propagate message unless local fallback succeeds
      }
    }

    // 2. Local Verified Store Authentication (for offline or local reactive mode)
    const res = CampusDB.verifyCredentials(normalized, password);
    if (!res.success || !res.user) {
      throw new Error(res.message || 'Invalid email or password. Access denied.');
    }

    const verifiedUser = { ...res.user };
    if (isDesignatedAdmin) {
      verifiedUser.role = 'admin';
    }

    // Create secure persistent session with timestamp
    const session: AuthSession = {
      uid: verifiedUser.uid,
      email: verifiedUser.email,
      role: verifiedUser.role,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setCurrentUser(verifiedUser);

    return { success: true, user: verifiedUser };
  };

  /**
   * Student Registration: STRICT INVARIANT - forces role: 'student' on backend
   */
  const register = async (
    data: Omit<UserProfile, 'uid' | 'createdAt' | 'role'>,
    password: string
  ): Promise<UserProfile> => {
    const normalized = data.email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error('Email and password are required for registration.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // If Firebase Auth is configured, create Firebase Auth user
    if (isFirebaseConfigured() && auth) {
      try {
        await createUserWithEmailAndPassword(auth, normalized, password);
      } catch (fbErr: any) {
        if (fbErr?.code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        console.warn('Firebase Auth register warning, falling back to local store:', fbErr?.message);
      }
    }

    // Save student profile (strictly role: 'student')
    const created = CampusDB.registerStudent(data, password);

    // Save session
    const session: AuthSession = {
      uid: created.uid,
      email: created.email,
      role: 'student',
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setCurrentUser(created);

    return created;
  };

  /**
   * Password Reset Flow
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new Error('Please provide your campus email.');
    }

    const user = CampusDB.getUserByEmail(normalized);
    if (!user) {
      throw new Error('No registered account was found with that campus email.');
    }

    if (isFirebaseConfigured() && auth) {
      try {
        await sendPasswordResetEmail(auth, normalized);
      } catch (fbErr: any) {
        console.warn('Firebase reset email failed:', fbErr?.message);
      }
    }

    // Set temporary password reset in store
    CampusDB.updatePassword(normalized, 'CampusFix@2026');

    // Issue system notification to user
    CampusDB.sendNotification({
      userId: user.uid,
      title: 'Password Reset Requested',
      message: 'Your temporary access password has been set to "CampusFix@2026". Please sign in and update your security credentials.',
      type: 'general',
    });

    return true;
  };

  /**
   * Secure Logout
   */
  const logout = async (): Promise<void> => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);

    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
  };

  const updateCurrentUser = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    // Strip role modification attempts from frontend client
    const safeUpdates = { ...data };
    delete safeUpdates.role;
    delete safeUpdates.uid;
    delete safeUpdates.createdAt;

    const updated = CampusDB.updateUser(currentUser.uid, safeUpdates, { role: currentUser.role });
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        loading,
        login,
        register,
        logout,
        resetPassword,
        updateCurrentUser,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
