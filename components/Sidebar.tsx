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
  Sparkles,
  Send,
  User as UserIcon,
  UserSearch
} from 'lucide-react';
import { AppRoutes } from '../types';
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
      {/* High-fidelity Backdrop Blur */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[60] transition-all duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Modern Responsive Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-white/95 backdrop-blur-3xl border-r border-slate-200/60 
        transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-28' : 'lg:w-80 md:w-72'}
        flex flex-col shadow-[40px_0_100px_-20px_rgba(0,0,0,0.12)]
      `}>
        
        {/* Identity & Control Layer */}
        <div className="h-32 flex items-center px-8 shrink-0 relative border-b border-slate-100/50">
          <Link 
            to={AppRoutes.HOME}
            className={`flex items-center gap-5 transition-all duration-500 ${isCollapsed && !isOpen ? 'justify-center w-full' : ''}`}
          >
            <div className={`
              bg-theme rounded-[1.5rem] p-0.5 shadow-2xl shadow-theme/40 flex-shrink-0 flex items-center justify-center transition-all duration-500
              ${isCollapsed ? 'w-14 h-14' : 'w-16 h-16'}
              hover:rotate-12 active:scale-90
            `}>
              <div className="w-full h-full bg-white rounded-[1.25rem] p-2 flex items-center justify-center">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-6 duration-700">
                <span className="font-black text-slate-900 whitespace-nowrap tracking-tighter text-3xl leading-none block">SS Paw Pal</span>
                <span className="text-[10px] font-black text-theme uppercase tracking-[0.4em] mt-1.5 block">Care Engine v1.2</span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-10 right-6 p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* Dynamic Navigation Stack */}
        <nav className="flex-1 px-5 py-10 space-y-12 overflow-y-auto custom-scrollbar-hide">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-4">
              {(!isCollapsed || isOpen) && (
                <h3 className="px-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400/70 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                  {group.title}
                </h3>
              )}
              
              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        group relative flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-500 overflow-hidden
                        ${isActive 
                          ? 'bg-theme text-white shadow-2xl shadow-theme/30 scale-[1.02]' 
                          : 'text-slate-500 hover:bg-theme-light hover:text-theme hover:translate-x-2'}
                        ${isCollapsed && !isOpen ? 'md:justify-center px-0' : ''}
                      `}
                    >
                      {/* Interaction Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.6)]" />
                      )}

                      <item.icon size={24} className={`flex-shrink-0 transition-all duration-500 ${isActive ? 'scale-125 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-6'}`} />
                      
                      {(!isCollapsed || isOpen) ? (
                        <span className="text-[16px] font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                      ) : (
                        <div 
                          className="absolute left-full ml-10 px-5 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-[100] translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap shadow-2xl backdrop-blur-md bg-opacity-95"
                        >
                          {item.label}
                          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rotate-45 bg-slate-900" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Presence Portal */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-50 border border-slate-100/50 rounded-[3rem] p-3 space-y-2 shadow-inner overflow-hidden">
            <Link 
              to={AppRoutes.SETTINGS}
              className={`flex items-center gap-4 p-3 rounded-[2rem] transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <div className="w-14 h-14 rounded-[1.5rem] overflow-hidden bg-white border border-slate-100 flex-shrink-0 shadow-lg transition-all group-hover:scale-105 group-hover:rotate-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><UserIcon size={28} /></div>
                )}
              </div>
              {(!isCollapsed || isOpen) && (
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-slate-900 truncate leading-tight group-hover:text-theme transition-colors">{user?.displayName || 'Pet Parent'}</p>
                  <p className="text-[10px] font-black text-theme uppercase tracking-widest mt-1.5 opacity-60">Identity Verified</p>
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all text-slate-400 hover:text-rose-600 hover:bg-rose-50 group
                ${isCollapsed && !isOpen ? 'justify-center' : ''}
              `}
            >
              <LogOut size={22} className="transition-transform duration-500 group-hover:-translate-x-2" />
              {(!isCollapsed || isOpen) && <span className="text-[11px] font-black uppercase tracking-[0.3em]">Exit Portal</span>}
            </button>
          </div>
        </div>

        {/* Global Toggle Controller */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            hidden md:flex absolute -right-5 top-40 w-10 h-16 bg-white border border-slate-200 rounded-[1.25rem] shadow-2xl 
            items-center justify-center text-slate-400 hover:text-theme transition-all z-[80] 
            hover:scale-110 active:scale-90 group/toggle
          `}
        >
          {isCollapsed ? (
            <ChevronRight size={22} className="group-hover/toggle:translate-x-1 transition-transform duration-500" />
          ) : (
            <ChevronLeft size={22} className="group-hover/toggle:-translate-x-1 transition-transform duration-500" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;