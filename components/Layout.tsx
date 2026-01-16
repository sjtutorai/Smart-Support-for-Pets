
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, Search, Dog, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes } from '../types';

interface NotificationItemProps { 
  notif: AppNotification; 
  onMarkRead: (id: string) => void; 
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onMarkRead }) => {
  const Icon = notif.type === 'warning' ? AlertTriangle : notif.type === 'success' ? CheckCircle2 : Info;
  const colorClass = notif.type === 'warning' ? 'text-amber-500 bg-amber-50' : notif.type === 'success' ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-500 bg-indigo-50';

  return (
    <div 
      className={`p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 flex gap-3 items-start cursor-pointer ${!notif.read ? 'bg-indigo-50/10' : ''}`}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 space-y-0.5">
        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{notif.title}</h5>
        <p className="text-xs text-slate-500 font-medium leading-tight">{notif.message}</p>
        <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
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
    if (path === AppRoutes.HOME) return "Dashboard";
    if (path === AppRoutes.AI_ASSISTANT) return "AI Consultant";
    if (path === AppRoutes.PET_CARE) return "Wellness";
    if (path === AppRoutes.CREATE_POST) return "Community";
    if (path === AppRoutes.CHAT) return "Messages";
    if (path === AppRoutes.PET_PROFILE) return "Pet Profiles";
    if (path === AppRoutes.SETTINGS) return "Settings";
    return "SS Paw Pal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/30">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-black text-slate-900 tracking-tight md:block hidden">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notifications</h4>
                    <button onClick={clearAll} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Inbox Zero</div>
                    ) : (
                      notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-100"></div>

            <Link 
              to={AppRoutes.SETTINGS}
              className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={16} className="m-2 text-slate-300" />
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
          <footer className="mt-24 py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            SS Paw Pal Engine
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
