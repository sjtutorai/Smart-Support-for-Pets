
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
    <div className="relative min-h-screen w-full bg-slate-50/40 overflow-x-hidden">
      {/* Sidebar - Positioned to live within the 10% left margin on large screens */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div className="flex flex-col min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 md:px-12 z-40 sticky top-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-theme uppercase tracking-[0.3em] mb-0.5">Navigation / {getPageTitle()}</p>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter">{getPageTitle()}</h2>
            </div>

            <Link to={AppRoutes.HOME} className="flex items-center gap-3 md:hidden active:scale-95 transition-transform">
              <div className="w-8 h-8 bg-theme rounded-lg p-1.5 flex items-center justify-center shadow-lg shadow-theme/20">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center relative group">
              <Search size={16} className="absolute left-4 text-slate-400 group-focus-within:text-theme transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-slate-50/50 border border-slate-200/50 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:bg-white focus:ring-4 focus:ring-theme/10 focus:border-theme/30 outline-none transition-all w-48"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className={`p-2.5 rounded-xl transition-all relative ${isNotifOpen ? 'bg-theme text-white shadow-lg' : 'text-slate-500 hover:bg-theme/5 hover:text-theme'}`}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white text-[7px] font-black text-white flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-4 w-72 md:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in zoom-in-95 fade-in duration-300 origin-top-right">
                    <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase">Inbox</h4>
                      <button onClick={clearAll} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs italic">No alerts</div>
                      ) : (
                        notifications.map(notif => <NotificationItem key={notif.id} notif={notif} onMarkRead={markAsRead} />)
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Link to={AppRoutes.SETTINGS} className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white">
                {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-slate-300" />}
              </Link>
            </div>
          </div>
        </header>

        {/* Dynamic 80% Content Center Strategy */}
        <main className="flex-1 w-full flex flex-col items-center overflow-y-auto">
          {/* Main Wrapper: lg uses 80vw, centered via parent. md/sm uses 100% */}
          <div className="w-full lg:w-[80vw] px-6 py-10 md:px-12 md:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
            <div className="w-full max-w-7xl">
              {children}
            </div>
            
            <footer className="w-full mt-24 py-12 border-t border-slate-200/50 text-center">
               <div className="flex items-center justify-center gap-2 text-slate-300 font-black text-[9px] uppercase tracking-[0.4em]">
                 <Dog size={12} /> Smart Support <Sparkles size={12} />
               </div>
               <p className="text-slate-400 font-bold text-[8px] mt-2 opacity-50 uppercase tracking-widest">Global Pet Network © 2025</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
