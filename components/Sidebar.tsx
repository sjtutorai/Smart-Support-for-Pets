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
      title: "Main Operations",
      items: [
        { label: 'Overview', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Specialist', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
      ]
    },
    {
      title: "Social Hub",
      items: [
        { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Direct Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Find Guardians', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Pet Management",
      items: [
        { label: 'Health Hub', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Registry', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-500 md:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] 
        bg-white border-r border-slate-100
        transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[88px]' : 'lg:w-[300px] md:w-[260px]'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        
        {/* Header Branding */}
        <div className="h-24 flex items-center px-6 shrink-0 border-b border-slate-50 relative">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4 group overflow-hidden">
            <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform duration-500">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="font-black text-slate-900 tracking-tighter text-xl whitespace-nowrap">
                  Paw Pal
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] -mt-1 whitespace-nowrap">System Interface</span>
              </div>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-900"><X size={24}/></button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-10 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-60">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
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
                          ? 'bg-slate-900 text-white shadow-xl shadow-indigo-100' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                        active:scale-[0.97]
                      `}
                    >
                      <item.icon size={20} className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${isActive ? 'text-indigo-400' : ''}`} />
                      
                      {!isCollapsed && (
                        <span className="text-[13px] font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                      )}
                      
                      {/* Active Indicator Dot */}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                      
                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-6 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[100] whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Actions & Collapse Toggle */}
        <div className="p-4 border-t border-slate-50 space-y-2">
          {!isCollapsed && (
            <Link to={AppRoutes.SETTINGS} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={18} className="m-2.5 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-slate-900 truncate tracking-tight">@{user?.displayName?.split(' ')[0] || 'Guardian'}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] truncate">Access Level 01</p>
              </div>
              <Settings size={14} className="ml-auto text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-slate-400 hover:text-rose-500 hover:bg-rose-50 group ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="shrink-0 transition-transform group-hover:-translate-x-1" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.3em]">Disconnect</span>}
            
            {isCollapsed && (
              <div className="absolute left-full ml-6 px-3 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all z-[100] whitespace-nowrap">
                Disconnect
              </div>
            )}
          </button>
        </div>

        {/* Desktop Collapse Trigger */}
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