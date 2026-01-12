
import React, { useState, useRef, useEffect } from 'react';
// Corrected the import: 'AlertCircleTriangle' is not a valid export, it should be 'AlertTriangle'
import { Menu, Bell, User as UserIcon, Trash2, CheckCircle2, AlertTriangle, Info, X, Search, Settings as SettingsIcon, Dog, Sparkles } from 'lucide-react';
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
      className={`p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 flex gap-4 items-start ${!notif.read ? 'bg-indigo-50/20' : ''}`}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className={`p-2 rounded-xl shrink-0 ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 space-y-0.5">
        <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{notif.title}</h5>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync breadcrumbs based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === AppRoutes.HOME) return "Dashboard";
    if (path === AppRoutes.AI_ASSISTANT) return "AI Consultation";
    if (path === AppRoutes.PET_CARE) return "Daily Wellness";
    if (path === AppRoutes.CREATE_POST) return "Community Feed";
    if (path === AppRoutes.CHAT) return "Direct Messages";
    if (path === AppRoutes.PET_PROFILE) return "Pet Family";
    if (path === AppRoutes.SETTINGS) return "Account Hub";
    return "Smart Support";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/40">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        /* Fix: Use setIsSidebarCollapsed instead of setIsCollapsed */
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 md:px-12 z-40 transition-all duration-500">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:block">
              <p className="text-[10px] font-black text-theme uppercase tracking-[0.3em] mb-1">Navigation / {getPageTitle()}</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{getPageTitle()}</h2>
            </div>

            <Link to={AppRoutes.HOME} className="flex items-center gap-3 md:hidden active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-theme rounded-xl p-2 flex items-center justify-center shadow-lg shadow-theme/20">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {/* Global Search */}
            <div className="hidden lg:flex items-center relative group">
              <Search size={18} className="absolute left-4 text-slate-400 group-focus-within:text-theme transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-slate-50/50 border border-slate-200/50 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-theme/10 focus:border-theme/30 outline-none transition-all w-64"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className={`p-3.5 rounded-2xl transition-all relative ${isNotifOpen ? 'bg-theme text-white shadow-xl shadow-theme/30' : 'text-slate-500 hover:bg-theme/5 hover:text-theme'}`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-rose-500 border-2 border-white text-[8px] font-black text-white flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-6 w-80 md:w-[26rem] bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[100] animate-in zoom-in-95 fade-in duration-300 origin-top-right">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">Notification Center</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inbox ({unreadCount} unread)</p>
                      </div>
                      <button 
                        onClick={clearAll} 
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Clear all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-24 text-center space-y-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Bell className="text-slate-200" size={32} />
                          </div>
                          <p className="text-slate-400 font-bold text-sm italic">Nothing new to show</p>
                        </div>
                      ) : (
                        notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                        <button className="text-[10px] font-black uppercase tracking-widest text-theme hover:underline">View all alerts</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link 
                to={AppRoutes.SETTINGS}
                className="hidden md:flex p-3.5 text-slate-500 hover:bg-theme/5 hover:text-theme rounded-2xl transition-all"
              >
                <SettingsIcon size={20} />
              </Link>
            </div>
            
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            
            <Link 
              to={AppRoutes.SETTINGS}
              className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50/50 hover:bg-white rounded-2xl transition-all border border-slate-200/50 hover:border-theme/30 hover:shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-slate-300" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-black text-slate-800 leading-none">{user?.displayName || 'Pet Parent'}</p>
                <p className="text-[10px] font-black text-theme uppercase tracking-widest mt-1">Verified Parent</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Updated main area to allow 80% content width with horizontal centering */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
          <div className="max-w-none lg:max-w-[80vw] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
          
          {/* Subtle footer */}
          <footer className="mt-20 py-10 border-t border-slate-100 text-center">
             <div className="flex items-center justify-center gap-2 text-slate-300 font-black text-[10px] uppercase tracking-[0.4em]">
               <Dog size={12} /> Smart Support for Pets <Sparkles size={12} />
             </div>
             <p className="text-slate-400 font-bold text-[9px] mt-4 opacity-50 uppercase tracking-widest">Global Pet Care Network © 2025</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
