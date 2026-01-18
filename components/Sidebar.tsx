import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
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
  Search,
  LayoutDashboard,
  Settings
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
      title: "Core",
      items: [
        { label: 'Dashboard', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Support', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
      ]
    },
    {
      title: "Social",
      items: [
        { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Inbox', path: AppRoutes.CHAT, icon: Send },
        { label: 'Search', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Health",
      items: [
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Pet Profiles', path: AppRoutes.PET_PROFILE, icon: Dog },
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
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] transition-all duration-500 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] 
        bg-white border-r border-slate-100
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[90px]' : 'lg:w-[280px] md:w-[240px]'}
        flex flex-col shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] md:shadow-none
      `}>
        
        {/* Header/Logo Area */}
        <div className="h-24 flex items-center px-6 shrink-0 border-b border-slate-50 overflow-hidden">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4 group">
            <div className="w-11 h-11 bg-white border border-slate-100 rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">
                  Paw Pal
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Engine</span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden ml-auto w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-8 space-y-9 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
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
                        group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <item.icon size={20} className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-theme' : ''}`} />
                      {!isCollapsed && (
                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-theme animate-pulse" />
                      )}
                      
                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-[calc(100%+12px)] px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-xl opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[80] whitespace-nowrap shadow-2xl">
                          {item.label}
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Footer Section */}
        <div className="p-4 border-t border-slate-50 space-y-3">
          {!isCollapsed && (
            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={18} className="m-2.5 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Settings</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Profile Info</p>
              </div>
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-[0.2em]">Sign Out</span>}
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-4 top-24 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 hover:text-slate-900 shadow-xl transition-all z-[80] hover:scale-110 active:scale-90"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;