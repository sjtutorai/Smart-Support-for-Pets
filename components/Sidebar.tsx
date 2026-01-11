
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Sparkles
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
    { label: 'Home', path: AppRoutes.HOME, icon: Home },
    { label: 'AI Assistant', path: AppRoutes.AI_ASSISTANT, icon: MessageSquare },
    { label: 'Pet Care & Fun', path: AppRoutes.PET_CARE, icon: Sparkles },
    { label: 'Community Feed', path: AppRoutes.CREATE_POST, icon: PlusSquare },
    { label: 'Health Checkup', path: AppRoutes.HEALTH_CHECKUP, icon: Stethoscope },
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

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
    md:relative md:translate-x-0 md:transition-[width]
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${isCollapsed ? 'md:w-24' : 'md:w-72'}
    w-72 flex flex-col border-r border-slate-100 h-full
  `;

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png";

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={sidebarClasses}>
        {/* Header with Logo as Link */}
        <div className={`h-28 flex items-center justify-between px-5 flex-shrink-0 transition-colors duration-300 ${!isCollapsed || isOpen ? 'bg-indigo-600' : 'bg-white border-b border-slate-100'}`}>
          <Link 
            to={AppRoutes.HOME}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-4 overflow-hidden transition-all duration-300 group hover:opacity-95 active:scale-95 ${isCollapsed ? 'md:justify-center w-full' : ''}`}
          >
            <div className={`w-16 h-16 rounded-2xl flex-shrink-0 shadow-2xl overflow-hidden flex items-center justify-center p-2 transition-all group-hover:rotate-6 ${!isCollapsed || isOpen ? 'bg-white shadow-indigo-900/30' : 'bg-indigo-600 shadow-indigo-100'}`}>
              <img src={LOGO_URL} alt="Logo" className={`w-full h-full object-contain ${!isCollapsed || isOpen ? '' : 'brightness-0 invert'}`} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-white">
                <span className="font-black text-lg whitespace-nowrap tracking-tighter leading-none">Smart Support</span>
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest mt-1">For Pets</span>
              </div>
            )}
          </Link>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2.5 text-white/80 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>

          {/* Collapse Toggle for Desktop */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-2 absolute -right-4 top-10 bg-white border border-slate-100 rounded-full shadow-lg hover:shadow-xl transition-all text-slate-400 hover:text-indigo-600 z-50 active:scale-90`}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-black shadow-inner' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  ${isCollapsed ? 'md:justify-center' : ''}
                `}
              >
                <item.icon size={22} className={`transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`} />
                {(!isCollapsed || !isOpen) && (
                  <span className={`md:${isCollapsed ? 'hidden' : 'block'} text-sm font-bold tracking-tight`}>{item.label}</span>
                )}
                
                {isCollapsed && (
                   <div className="absolute left-20 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all hidden md:block z-[60] whitespace-nowrap shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                    {item.label}
                   </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-50 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all
              text-slate-500 hover:bg-rose-50 hover:text-rose-600 group relative
              ${isCollapsed ? 'md:justify-center' : ''}
            `}
          >
            <LogOut size={22} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
            {!isCollapsed && <span className="md:block text-sm font-bold tracking-tight">Logout Session</span>}
            {isCollapsed && (
              <div className="absolute left-20 bg-rose-600 text-white px-3 py-2 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all hidden md:block z-[60] whitespace-nowrap shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
