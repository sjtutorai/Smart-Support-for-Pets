
import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  PlusSquare, 
  Dog, 
  LogOut, 
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Settings,
  Sparkles,
  Send
} from 'lucide-react';
import { AppRoutes, NavItem } from '../types';
import { logout } from '../services/firebase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: AppRoutes.HOME, icon: Home },
    { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare },
    { label: 'Daily Care', path: AppRoutes.PET_CARE, icon: Sparkles },
    { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
    { label: 'Messages', path: AppRoutes.CHAT, icon: Send },
    { label: 'Health Hub', path: AppRoutes.HEALTH_CHECKUP, icon: Stethoscope },
    { label: 'Pet Profile', path: AppRoutes.PET_PROFILE, icon: Dog },
    { label: 'Settings', path: AppRoutes.SETTINGS, icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Sidebar logout error:", error);
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-[25px_0_50px_-15px_rgba(0,0,0,0.1)] transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-24' : 'md:w-72'}
        w-72 flex flex-col border-r border-slate-100
      `}>
        <div className={`h-20 flex items-center justify-between px-6 flex-shrink-0 transition-all duration-500 transition-theme ${!isCollapsed || isOpen ? 'bg-theme' : 'bg-white border-b border-slate-50'}`}>
          <Link 
            to={AppRoutes.HOME}
            className={`flex items-center gap-4 overflow-hidden transition-all duration-500 hover:opacity-95 active:scale-95 ${isCollapsed && !isOpen ? 'md:justify-center w-full' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex-shrink-0 shadow-lg flex items-center justify-center transition-all duration-500 ${!isCollapsed || isOpen ? 'bg-white rotate-0' : 'bg-theme rotate-12'}`}>
              <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <span className="font-black text-white whitespace-nowrap tracking-tight text-sm">Smart Support for Pets</span>
            )}
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-white/80 hover:bg-white/20 rounded-xl transition-all"
          >
            <X size={24} />
          </button>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-1.5 absolute -right-3 top-24 bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl transition-all text-slate-400 hover:text-theme z-[60] active:scale-90`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-theme-light text-theme font-black shadow-inner' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-theme'}
                  ${isCollapsed && !isOpen ? 'md:justify-center' : ''}
                `}
              >
                <item.icon size={22} className={`transition-all duration-300 ${isActive ? 'text-theme scale-110' : 'text-slate-400 group-hover:text-theme group-hover:scale-110'}`} />
                {(!isCollapsed || isOpen) && (
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                )}
                
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-theme rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300
              text-slate-500 hover:bg-rose-50 hover:text-rose-600 group relative
              ${isCollapsed && !isOpen ? 'md:justify-center' : ''}
            `}
          >
            <LogOut size={22} className="text-slate-400 group-hover:text-rose-500 transition-all duration-300 group-hover:-translate-x-1" />
            {(!isCollapsed || isOpen) && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
