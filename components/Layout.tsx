
import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AppRoutes } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            
            {/* Mobile Branding Link */}
            <Link to={AppRoutes.HOME} className="flex items-center gap-3 md:hidden active:scale-95 transition-transform group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl p-1 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">Smart Support for Pets</h1>
            </Link>

            <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Platform</span>
                  <span className="text-slate-200">/</span>
                  <span className="text-sm text-slate-500 font-bold">Dashboard Overview</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            <button className="p-3 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all relative group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
            
            <div className="h-10 w-px bg-slate-100 mx-1 hidden md:block"></div>
            
            <button className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Account</p>
                <p className="text-sm font-black text-slate-700 mt-0.5">
                  {user?.displayName || 'User'}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-slate-50/30">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Layout;
