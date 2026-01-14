
import React, { useState, useRef, useEffect } from 'react';
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
      className={`p-5 hover:bg-slate-50 transition-colors border-b border-slate-100 flex gap-4 items-start ${!notif.read ? 'bg-indigo-50/20' : ''}`}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass} shadow-sm`}>
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

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

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
    if (path === AppRoutes.AI_ASSISTANT) return "AI Consultation";
    if (path === AppRoutes.PET_CARE) return "Daily Wellness";
    if (path === AppRoutes.CREATE_POST) return "Community Feed";
    if (path === AppRoutes.CHAT) return "Direct Messages";
    if (path === AppRoutes.PET_PROFILE) return "Pet Family";
    if (path === AppRoutes.SETTINGS) return "Account Hub";
    return "SS Paw Pal";
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/60">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className={`
        flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      `}>
        <header className="h-28 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-8 md:px-14 z-40 transition-all duration-500">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-4 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-theme uppercase tracking-[0.5em] mb-1.5 opacity-60">System / {getPageTitle()}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{getPageTitle()}</h2>
            </div>

            <Link to={AppRoutes.HOME} className="flex items-center gap-3 md:hidden active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-xl border border-slate-100">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <div className="hidden lg:flex items-center relative group">
              <Search size={20} className="absolute left-5 text-slate-400 group-focus-within:text-theme transition-all" />
              <input 
                type="text" 
                placeholder="Deep Search..." 
                className="bg-slate-100/50 border border-transparent rounded-[1.5rem] py-3.5 pl-14 pr-6 text-[15px] font-bold text-slate-700 focus:bg-white focus:ring-[10px] focus:ring-theme/5 focus:border-theme/20 outline-none transition-all w-72 lg:w-96"
              />
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className={`p-4 rounded-[1.25rem] transition-all relative ${isNotifOpen ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'text-slate-500 hover:bg-theme-light hover:text-theme'}`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-8 w-80 md:w-[28rem] bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[100] animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-500 origin-top-right">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight">Activity Log</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5">Queued Messages: {unreadCount}</p>
                      </div>
                      <button 
                        onClick={clearAll} 
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Clear History"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-28 text-center space-y-6">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                            <Bell className="text-slate-200" size={40} />
                          </div>
                          <p className="text-slate-400 font-bold text-sm italic">System clear. No updates found.</p>
                        </div>
                      ) : (
                        notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-5 bg-slate-50 border-t border-slate-100 text-center">
                        <button className="text-[11px] font-black uppercase tracking-[0.3em] text-theme hover:underline">Launch Full Log View</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link 
                to={AppRoutes.SETTINGS}
                className="hidden md:flex p-4 text-slate-500 hover:bg-theme-light hover:text-theme rounded-[1.25rem] transition-all"
              >
                <SettingsIcon size={22} />
              </Link>
            </div>
            
            <div className="h-12 w-px bg-slate-200 hidden md:block opacity-50"></div>
            
            <Link 
              to={AppRoutes.SETTINGS}
              className="flex items-center gap-4 p-2 pr-6 bg-slate-100/40 hover:bg-white rounded-[1.5rem] transition-all border border-transparent hover:border-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/40 group"
            >
              <div className="h-12 w-12 rounded-[1rem] overflow-hidden bg-slate-200 border-2 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={22} className="text-slate-400" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[15px] font-black text-slate-800 leading-none truncate max-w-[120px]">{user?.displayName || 'Pet Parent'}</p>
                <p className="text-[9px] font-black text-theme uppercase tracking-[0.4em] mt-1.5">Pro Identity</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-20 scroll-smooth bg-transparent">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {children}
          </div>
          
          <footer className="mt-32 py-16 border-t border-slate-200/40 text-center">
             <div className="flex items-center justify-center gap-3 text-slate-300 font-black text-[11px] uppercase tracking-[0.5em]">
               <Dog size={14} /> SS Paw Pal <Sparkles size={14} />
             </div>
             <p className="text-slate-400 font-black text-[10px] mt-6 opacity-40 uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                <span>Terms of Service</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Privacy Standards</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span>Global v1.0</span>
             </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
