import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  limit 
} from 'firebase/firestore';
import { AppNotification } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const STAT_ROUTINE = [
  { id: 1, task: 'Morning Walk', timeLabel: '07:00 AM - 08:00 AM', startHour: 7, endHour: 8 },
  { id: 2, task: 'Breakfast Time', timeLabel: '08:00 AM - 09:00 AM', startHour: 8, endHour: 9 },
  { id: 3, task: 'Mid-day Play', timeLabel: '11:00 AM - 12:00 PM', startHour: 11, endHour: 12 },
  { id: 4, task: 'Lunch', timeLabel: '01:00 PM - 02:00 PM', startHour: 13, endHour: 14 },
  { id: 5, task: 'Afternoon Nap', timeLabel: '02:00 PM - 04:00 PM', startHour: 14, endHour: 16 },
  { id: 6, task: 'Evening Stroll', timeLabel: '05:00 PM - 06:00 PM', startHour: 17, endHour: 18 },
  { id: 7, task: 'Dinner', timeLabel: '07:00 PM - 08:00 PM', startHour: 19, endHour: 20 },
  { id: 8, task: 'Bedtime Cuddles', timeLabel: '09:00 PM - 10:00 PM', startHour: 21, endHour: 22 },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AppNotification[];
      setNotifications(fetchedNotifications);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback(async (title: string, message: string, type: AppNotification['type'] = 'info') => {
    if (!user) return; 
    
    try {
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title,
        message,
        type,
        read: false,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  const clearAll = async () => {
    if (!user) return;
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};