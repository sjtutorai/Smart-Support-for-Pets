
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, Search, X, Loader2, Check } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { handleFollowRequestAction } from '../services/firebase';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes, AppNotification } from '../types';

interface NotificationItemProps { 
  notif: AppNotification; 
  onMarkRead: (id: string) => void; 
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Just now';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Just now';
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onMarkRead }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAction = async (action: 'accept' | 'decline') => {
    if (!notif.relatedId) return;
    setIsProcessing(true);
    try {
      await handleFollowRequestAction(notif.id, notif.relatedId, action);
    } catch (error) {
      console.error(`Failed to ${action} follow request:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    switch (notif.type) {
      case 'warning': return { Icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' };
      case 'success': return { Icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' };
      default: return { Icon: Info, color: 'text-theme bg-theme-light' };
    }
  };
  
  const { Icon, color } = getIcon();

  return (
    <div className={`p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 flex flex-col gap-4 ${!notif.read ? 'bg-indigo-50/10' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-[1rem] shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 space-y-1 cursor-pointer" onClick={() => onMarkRead(notif.id)}>
          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{notif.title}</h5>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {notif.message}
          </p>
          <p className="text-[9px] text-slate-300 font-black uppercase mt-1">
            {formatTimestamp(notif.timestamp)}
          </p>
        </div>
      </div>

      {notif.type === 'follow_request' && !notif.read && (
        <div className="pl-14 flex gap-2">
          <button 
            onClick={() => handleAction('accept')}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
          >
            {isProcessing ? <Loader2 size={12} className="animate-spin"/> : <Check size={14} />} Accept
          </button>
          <button 
            onClick={() => handleAction('decline')}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
          >
            <X size={14} /> Decline
          </button>
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === AppRoutes.HOME) return "Overview";
    if (path === AppRoutes.AI_ASSISTANT) return "Consultant";
    if (path === AppRoutes.PET_CARE) return "Vital Health";
    if (path === AppRoutes.CREATE_POST) return "Feed";
    if (path === AppRoutes.CHAT) return "Inbox";
    if (path === AppRoutes.PET_PROFILE) return "Registry";
    if (path === AppRoutes.SETTINGS) return "Configuration";
    if (path === AppRoutes.FIND_FRIENDS) return "Explorer";
    return "SS Paw Pal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-40 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter md:block hidden animate-in fade-in slide-in-from-left-2">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className={`p-3 rounded-2xl transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-95'}`}
              >
                <Bell size={20} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 text-[10px] flex items-center justify-center font-black rounded-full bg-rose-500 text-white border-2 border-white shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Guardian Intel</h4>
                    <button onClick={clearAll} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200">
                          <Check size={32} />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">System Clear</p>
                      </div>
                    ) : (
                      notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-slate-100 mx-1 md:block hidden"></div>

            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              <div className="hidden lg:block pr-2">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Profile</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Guardianship</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
          <div className="max-w-6xl mx-auto min-h-full flex flex-col">
            {children}
            <footer className="mt-auto pt-20 pb-10 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 pointer-events-none">
              Paw Pal Engine v3.1.2
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
