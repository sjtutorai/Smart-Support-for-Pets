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
  LayoutDashboard
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
        { label: 'Feed', path: AppRoutes.CREATE_POST, icon: PlusSquare },
        { label: 'Inbox', path: AppRoutes.CHAT, icon: Send },
        { label: 'Search', path: AppRoutes.FIND_FRIENDS, icon: Search },
      ]
    },
    {
      title: "Health",
      items: [
        { label: 'Wellness', path: AppRoutes.PET_CARE, icon: Stethoscope },
        { label: 'Profiles', path: AppRoutes.PET_PROFILE, icon: Dog },
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Guardian';
  const userHandle = user?.uid.slice(0, 8); // Fallback handle

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-[70] bg-white border-r border-slate-100 transition-all duration-500 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isCollapsed ? 'md:w-[90px]' : 'lg:w-[280px] md:w-[240px]'} flex flex-col shadow-2xl md:shadow-none`}>
        
        {/* Logo Section */}
        <div className="h-28 flex items-center px-6 border-b border-slate-50">
          <Link to={AppRoutes.HOME} className="flex items-center gap-4">
            <div className="w-16 h-16 bg-theme-surface rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-black/10 overflow-hidden group">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 transition-transform group-hover:scale-110">
                <img src="https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">Paw Pal</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 mt-1">Specialist Hub</span>
              </div>
            )}
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {!isCollapsed && <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{group.title}</h3>}
              {group.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setIsOpen(false)} 
                    className={`flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group ${isActive ? 'bg-theme-surface shadow-2xl shadow-black/20' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <item.icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-slate-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && <span className={`text-sm font-black tracking-tight ${isActive ? 'text-theme' : 'group-hover:text-slate-600'}`}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile Footer - Now Clickable to move to Profile */}
        <div className="p-4 border-t border-slate-50 space-y-4">
          {!isCollapsed && user && (
            <Link 
              to={`/user/${userHandle}`} 
              className="px-4 py-3 bg-slate-50 rounded-2xl flex items-center gap-3 hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all group"
            >
                <div className="w-8 h-8 rounded-lg bg-white overflow-hidden border border-slate-100 shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${userDisplayName}&background=random`} 
                      className="w-full h-full object-cover" 
                      alt="Profile"
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-widest leading-none group-hover:text-theme transition-colors">
                      {userDisplayName}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 truncate mt-1">
                      {user.email}
                    </p>
                </div>
            </Link>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
            <LogOut size={20} />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex absolute -right-4 top-24 w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center text-slate-400 shadow-xl transition-all z-[80] hover:scale-110 hover:text-theme">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;