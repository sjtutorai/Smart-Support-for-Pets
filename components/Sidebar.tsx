
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
  Send,
  User as UserIcon,
  ShieldCheck,
  LayoutGrid,
  UserSearch
} from 'lucide-react';
import { AppRoutes, NavItem } from '../types';
import { logout } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuGroups = [
    {
      title: "Main Menu",
      items: [
        { label: 'Dashboard', path: AppRoutes.HOME, icon: Home },
        { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare },
        { label: 'Daily Care', path: AppRoutes.PET_CARE, icon: Sparkles },
      ]
    },
    {
      title: "Community",
      items: [
        { label: 'Social Feed', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Find Friends', path: AppRoutes.FIND_FRIENDS, icon: UserSearch },
      ]
    },
    {
      title: "Management",
      items: [
        { label: 'Health Hub', path: AppRoutes.HEALTH_CHECKUP, icon: Stethoscope },
        { label: 'Pet Profile', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Sidebar logout error:", error);
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white/80 backdrop-blur-2xl border-r border-slate-200/50 
        transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-24' : 'lg:w-[20vw] md:w-72'}
        flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.04)]
      `}>
        
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 mb-4">
          <Link 
            to={AppRoutes.HOME}
            className={`flex items-center gap-4 transition-all duration-500 ${isCollapsed && !isOpen ? 'justify-center w-full' : ''}`}
          >
            <div className="w-12 h-12 bg-white rounded-2xl p-1 shadow-lg flex-shrink-0 flex items-center justify-center transition-transform hover:rotate-6 active:scale-90 border border-slate-100">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2">
                <span className="font-black text-slate-900 whitespace-nowrap tracking-tighter text-xl leading-tight block">SS Paw Pal</span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-7 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {(!isCollapsed || isOpen) && (
                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 animate-in fade-in duration-700">
                  {group.title}
                </h3>
              )}
              
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300
                        ${isActive 
                          ? 'bg-theme text-white shadow-xl shadow-theme/25' 
                          : 'text-slate-500 hover:bg-theme/5 hover:text-theme'}
                        ${isCollapsed && !isOpen ? 'md:justify-center' : ''}
                      `}
                    >
                      <item.icon size={20} className={`flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`} />
                      
                      {(!isCollapsed || isOpen) ? (
                        <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                      ) : (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-[100] translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap shadow-xl">
                          {item.label}
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        </div>
                      )}

                      {isActive && !isCollapsed && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Identity Hub */}
        <div className="p-4 space-y-4">
          <div className="h-px bg-slate-100 mx-2" />
          
          <div className={`p-2 rounded-[2rem] bg-slate-50 border border-slate-100/50 flex flex-col gap-2 transition-all duration-300`}>
            <Link 
              to={AppRoutes.SETTINGS}
              className={`flex items-center gap-3 p-2 rounded-2xl transition-all hover:bg-white hover:shadow-sm group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon size={20} /></div>
                )}
              </div>
              {(!isCollapsed || isOpen) && (
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs font-black text-slate-800 truncate leading-tight">{user?.displayName || 'Pet Parent'}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-0.5">Settings</p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-slate-400 hover:text-rose-600 hover:bg-rose-50 group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
              {(!isCollapsed || isOpen) && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
            </button>
          </div>
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            hidden md:flex absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-lg 
            items-center justify-center text-slate-400 hover:text-theme transition-all z-[80] 
            hover:scale-110 active:scale-90
          `}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;