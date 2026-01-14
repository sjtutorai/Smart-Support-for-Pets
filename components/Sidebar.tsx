
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
  UserSearch,
  PawPrint
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
      title: "Navigation",
      items: [
        { label: 'Dashboard', path: AppRoutes.HOME, icon: Home },
        { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare },
        { label: 'Daily Care', path: AppRoutes.PET_CARE, icon: Sparkles },
      ]
    },
    {
      title: "Pet Social",
      items: [
        { label: 'Moments', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Inbox', path: AppRoutes.CHAT, icon: Send },
        { label: 'Exploration', path: AppRoutes.FIND_FRIENDS, icon: UserSearch },
      ]
    },
    {
      title: "Records",
      items: [
        { label: 'Health Hub', path: AppRoutes.HEALTH_CHECKUP, icon: Stethoscope },
        { label: 'Pet Family', path: AppRoutes.PET_PROFILE, icon: Dog },
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
      {/* Mobile Backdrop - High Blur */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] transition-all duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white/95 backdrop-blur-3xl border-r border-slate-200/60 
        transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-24' : 'lg:w-80 md:w-72'}
        flex flex-col shadow-[20px_0_80px_-20px_rgba(0,0,0,0.06)]
      `}>
        
        {/* Branding Section */}
        <div className="h-28 flex items-center px-6 shrink-0 relative">
          <Link 
            to={AppRoutes.HOME}
            className={`flex items-center gap-4 transition-all duration-500 ${isCollapsed && !isOpen ? 'justify-center w-full' : ''}`}
          >
            <div className={`
              bg-theme rounded-[1.25rem] p-0.5 shadow-2xl shadow-theme/30 flex-shrink-0 flex items-center justify-center transition-all duration-500
              ${isCollapsed ? 'w-12 h-12' : 'w-14 h-14'}
              hover:rotate-12 active:scale-90
            `}>
              <div className="w-full h-full bg-white rounded-[1rem] p-1.5 flex items-center justify-center">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-slate-900 whitespace-nowrap tracking-tighter text-2xl leading-none block">SS Paw Pal</span>
                <span className="text-[10px] font-black text-theme uppercase tracking-[0.4em] mt-1 block">Care Engine</span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-9 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <nav className="flex-1 px-4 py-6 space-y-10 overflow-y-auto custom-scrollbar-hide">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              {(!isCollapsed || isOpen) && (
                <h3 className="px-5 text-[9px] font-black uppercase tracking-[0.35em] text-slate-400/80 mb-2 animate-in fade-in duration-1000">
                  {group.title}
                </h3>
              )}
              
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 overflow-hidden
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-xl' 
                          : 'text-slate-500 hover:bg-theme-light hover:text-theme'}
                        ${isCollapsed && !isOpen ? 'md:justify-center px-0' : ''}
                      `}
                    >
                      {/* Active Indicator Bar - Refined to match screenshot stripe */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[5px] h-7 bg-theme rounded-r-full shadow-[0_0_10px_var(--theme-color)]" />
                      )}

                      <item.icon size={22} className={`flex-shrink-0 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`} />
                      
                      {(!isCollapsed || isOpen) ? (
                        <span className="text-[15px] font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                      ) : (
                        <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-[100] translate-x-[-15px] group-hover:translate-x-0 whitespace-nowrap shadow-2xl">
                          {item.label}
                          <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Identity Footprint */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-2 space-y-1 transition-all duration-500 overflow-hidden">
            <Link 
              to={AppRoutes.SETTINGS}
              className={`flex items-center gap-3 p-2 rounded-full transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><UserIcon size={24} /></div>
                )}
              </div>
              {(!isCollapsed || isOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-800 truncate leading-tight">{user?.displayName || 'Pet Parent'}</p>
                  <p className="text-[10px] font-black text-theme uppercase tracking-widest mt-1 opacity-60">Verified Admin</p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3.5 rounded-full transition-all text-slate-400 hover:text-rose-600 hover:bg-rose-50 group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
              {(!isCollapsed || isOpen) && <span className="text-[11px] font-black uppercase tracking-[0.2em]">Exit Portal</span>}
            </button>
          </div>
        </div>

        {/* Floating Toggle Trigger (Desktop) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            hidden md:flex absolute -right-4 top-32 w-8 h-12 bg-white border border-slate-200 rounded-2xl shadow-xl 
            items-center justify-center text-slate-400 hover:text-theme transition-all z-[80] 
            hover:scale-105 active:scale-95 group/toggle
          `}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="group-hover/toggle:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft size={18} className="group-hover/toggle:-translate-x-0.5 transition-transform" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
