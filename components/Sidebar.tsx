import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
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
  Search,
  LayoutDashboard,
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
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] 
        bg-white border-r border-slate-100
        transition-all duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[88px]' : 'lg:w-[280px] md:w-[240px]'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        
        {/* Header/Logo Area */}
        <div className="h-24 flex items-center px-6 shrink-0 border-b border-slate-50">
          <Link to={AppRoutes.HOME} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl p-2 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
              <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="font-black text-slate-900 tracking-tighter text-xl truncate animate-in fade-in slide-in-from-left-2">
                SS Paw Pal
              </span>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
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
                        group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all
                        ${isActive 
                          ? 'bg-theme text-white shadow-lg shadow-theme/20' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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

        {/* User / Logout Section */}
        <div className="p-4 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-2 space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200">
                  {user?.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={16} className="m-2 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">Account</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">Manage</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-slate-500 hover:text-rose-500 hover:bg-rose-50 ${isCollapsed ? 'justify-center' : ''}`}
            >
              <LogOut size={18} />
              {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Logout</span>}
            </button>
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-theme shadow-sm transition-all z-50 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;