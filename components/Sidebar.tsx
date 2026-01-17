
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
  ShieldCheck
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
        { label: 'Dashboard', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Assistant', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
        { label: 'Pet Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
      ]
    },
    {
      title: "Social",
      items: [
        { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Discovery', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Account",
      items: [
        { label: 'Registry', path: AppRoutes.PET_PROFILE, icon: Dog },
        { label: 'Settings', path: AppRoutes.SETTINGS, icon: UserIcon },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Guardian';

  return (
    <>
      {/* Mobile Overlay - Slide Blur Effect */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[60] transition-all duration-500 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)} 
      />

      {/* Main Slide Navigation Bar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-100 
          transition-all duration-500 ease-in-out
          md:relative md:translate-x-0 
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed ? 'md:w-[90px]' : 'lg:w-[300px] md:w-[260px]'} 
          flex flex-col shadow-[20px_0_60px_-15px_rgba(0,0,0,0.05)] md:shadow-none
        `}
      >
        {/* Branding Area */}
        <div className="h-28 flex items-center px-6 border-b border-slate-50 shrink-0">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-xl shadow-slate-900/10 overflow-hidden transition-transform duration-500 group-hover:rotate-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                <img src="https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2">
                <span className="font-black text-slate-900 tracking-tighter text-2xl leading-none">Paw Pal</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={10} className="text-theme" /> AI Specialist
                </span>
              </div>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-9 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 animate-in fade-in">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1.5">
                {group.items.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      onClick={() => setIsOpen(false)} 
                      className={`
                        flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 active:scale-[0.98]' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <item.icon size={20} className={`shrink-0 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      {!isCollapsed && (
                        <span className={`text-sm font-bold tracking-tight animate-in fade-in slide-in-from-left-2`}>
                          {item.label}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-theme shadow-[0_0_10px_rgba(79,70,229,0.8)] animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Actionable Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
          {!isCollapsed && user && (
            <div className="px-4 py-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow group animate-in fade-in">
                <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0 shadow-sm relative">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${userDisplayName}&background=random`} 
                      className="w-full h-full object-cover" 
                      alt="Profile"
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate uppercase tracking-widest leading-none">
                      {userDisplayName}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 truncate mt-1.5">
                      {user.email}
                    </p>
                </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">End Session</span>}
          </button>
        </div>

        {/* Desktop Collapse Toggle - Floating Pill */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden md:flex absolute -right-4 top-12 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 shadow-xl transition-all z-[80] hover:scale-110 hover:text-theme group"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
