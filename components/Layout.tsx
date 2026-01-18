import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, Search, Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link, useLocation } from "react-router-dom";
import { AppRoutes, AppNotification } from '../types';

const NotificationItem: React.FC<{ notif: AppNotification; onMarkRead: (id: string) => void }> = ({ notif, onMarkRead }) => {
  const Icon = notif.type === 'warning' ? AlertTriangle : notif.type === 'success' ? CheckCircle2 : Info;
  const colorClass = notif.type === 'warning' ? 'text-amber-500 bg-amber-50' : notif.type === 'success' ? 'text-emerald-500 bg-emerald-50' : 'text-indigo-500 bg-indigo-50';

  return (
    <div 
      className={`p-5 hover:bg-slate-50 transition-all border-b border-slate-50 flex gap-4 items-start ${!notif.read ? 'bg-indigo-50/10' : ''}`}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{notif.title}</h5>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
        <p className="text-[9px] text-slate-300 font-black uppercase mt-2">Received · Just Now</p>
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
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      [AppRoutes.HOME]: "Dashboard Overview",
      [AppRoutes.AI_ASSISTANT]: "AI Support Specialist",
      [AppRoutes.PET_CARE]: "Wellness Hub",
      [AppRoutes.CREATE_POST]: "Community Moments",
      [AppRoutes.CHAT]: "Guardian Inbox",
      [AppRoutes.PET_PROFILE]: "Companion Registry",
      [AppRoutes.SETTINGS]: "System Settings"
    };
    return titles[location.pathname] || "SS Paw Pal Portal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/30">
        <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-[18px] font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Node Cluster Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center relative group">
              <Search size={16} className="absolute left-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input type="text" placeholder="Omni search..." className="bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold focus:bg-white outline-none w-64 transition-all" />
            </div>

            <div className="relative" ref={notifRef}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-3 rounded-2xl transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-[9px] flex items-center justify-center font-black rounded-full bg-rose-500 text-white border-[3px] border-white">{unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Alerts</h4>
                    <button onClick={clearAll} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Signal directory empty</div>
                    ) : (
                      notifications.map(n => <NotificationItem key={n.id} notif={n} onMarkRead={markAsRead} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-100 mx-1" />

            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={16} className="m-2.5 text-slate-300" />
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
          <footer className="mt-20 py-10 text-center border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              SS Paw Pal Portal Systems © 2026
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;