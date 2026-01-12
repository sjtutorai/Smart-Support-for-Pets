
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { PetProfile } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  permissionStatus: NotificationPermission;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (!user) return [];
    const saved = localStorage.getItem(`notifications_${user?.uid}`);
    return saved ? JSON.parse(saved) : [];
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
      localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [requestPermission]);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 20));

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: 'https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png'
        });
      } catch (e) {
        console.error("Failed to trigger system notification", e);
      }
    }
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const savedPet = localStorage.getItem(`pet_${user.uid}`);
      if (!savedPet) return;
      const pet: PetProfile = JSON.parse(savedPet);

      pet.vaccinations?.forEach(v => {
        if (!v.nextDueDate) return;
        const dueDate = new Date(v.nextDueDate);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7 && diffDays > 0) {
          const alreadyNotified = notifications.some(n => n.message.includes(v.name) && n.timestamp.startsWith(today.toISOString().split('T')[0]));
          if (!alreadyNotified && localStorage.getItem('ssp_pref_vaccines') !== 'false') {
            addNotification('Vaccination Reminder', `${pet.name}'s ${v.name} booster is due in ${diffDays} days!`, 'warning');
          }
        }
      });

      if (pet.weightHistory?.length > 0 && localStorage.getItem('ssp_pref_weight') !== 'false') {
        const lastLog = new Date(pet.weightHistory[pet.weightHistory.length - 1].date);
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) {
          const alreadyNotified = notifications.some(n => n.title === 'Weight Check' && n.timestamp.startsWith(today.toISOString().split('T')[0]));
          if (!alreadyNotified) {
            addNotification('Weight Check', `It's been a month since ${pet.name}'s last weight log.`, 'info');
          }
        }
      }
    };

    const interval = setInterval(checkReminders, 60000 * 60);
    checkReminders();
    return () => clearInterval(interval);
  }, [user, addNotification, notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, permissionStatus, addNotification, markAsRead, clearAll, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};