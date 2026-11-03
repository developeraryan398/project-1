import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem } from '../types';
import { CampusDB } from '../services/store';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  latestToast: NotificationItem | null;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestToast, setLatestToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const loadNotifications = () => {
      // If admin, show admin notifs or all notifs
      const all = CampusDB.getNotifications(currentUser.role === 'admin' ? undefined : currentUser.uid);
      setNotifications(all);
    };

    loadNotifications();

    let prevCount = CampusDB.getNotifications(currentUser.role === 'admin' ? undefined : currentUser.uid).length;

    // Listen to real-time updates
    const unsubscribe = CampusDB.subscribe('notifications', () => {
      const currentList = CampusDB.getNotifications(currentUser.role === 'admin' ? undefined : currentUser.uid);
      setNotifications(currentList);

      // If new notification added, show toast popup
      if (currentList.length > prevCount && currentList[0]) {
        setLatestToast(currentList[0]);
      }
      prevCount = currentList.length;
    });

    return unsubscribe;
  }, [currentUser]);

  const markAsRead = (id: string) => {
    CampusDB.markNotificationAsRead(id);
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    CampusDB.markAllNotificationsAsRead(currentUser.uid);
  };

  const clearToast = () => {
    setLatestToast(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        latestToast,
        clearToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
