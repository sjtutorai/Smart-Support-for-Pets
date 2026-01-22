import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Settings,
  Mail,
  Menu
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to auto-close/adjust logic if needed
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isOpen) {
        setIsOpen(false); // Reset mobile open state when switching to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, setIsOpen]);

  const menuGroups = [
    {
      title: "Main",
      items: [
        { label: 'Overview', path: AppRoutes.HOME, icon: LayoutDashboard },
        { label: 'AI Specialist', path: AppRoutes.AI_ASSISTANT, icon: Sparkles },
      ]
    },
    {
      title: "Social",
      items: [
        { label: 'Community', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Messages', path: AppRoutes.CHAT, icon: Send },
        { label: 'Find Friends', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Pet Care",
      items: [
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Registry', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    },
    {
      title: "System",
      items: [
        { label: 'Contact Support', path: AppRoutes.CONTACT, icon: Mail },
        { label: 'Settings', path: AppRoutes.SETTINGS, icon: Settings },
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
      {/* Mobile Backdrop - Glassmorphism */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-[70] 
          bg-white border-r border-slate-100
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          md:relative
          flex flex-col
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
          ${isCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'}
        `}
      >
        {/* Header / Brand */}
        <div className="h-24 flex items-center px-6 shrink-0 relative">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4 group w-full overflow-hidden">
            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
               <img src={LOGO_URL} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className={`flex flex-col min-w-0 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>
              <span className="text-lg font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">SS Paw Pal</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Care Portal</span>
            </div>
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden absolute right-4 p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className={`px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 hidden md:block' : 'opacity-100'}`}>
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)} // Close on mobile click
                      className={`
                        group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                        ${isActive 
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon 
                        size={20} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                      />
                      
                      <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                      
                      {/* Active Indicator Dot (only when expanded) */}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                      )}

                      {/* Tooltip for Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap shadow-xl">
                          {item.label}
                          <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-1 border-4 border-transparent border-r-slate-800" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-2">
          <Link 
            to={AppRoutes.SETTINGS}
            className={`
              flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 group-hover:border-indigo-200 transition-colors">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <UserIcon size={18} />
                </div>
              )}
            </div>
            
            <div className={`min-w-0 transition-opacity duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
              <p className="text-sm font-black text-slate-800 truncate leading-tight">
                {user?.displayName?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                View Profile
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 p-3 rounded-2xl transition-all 
              text-slate-400 hover:bg-rose-50 hover:text-rose-600
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut size={20} />
            <span className={`text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
              Sign Out
            </span>
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-28 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-md transition-all z-50 hover:scale-110 active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;