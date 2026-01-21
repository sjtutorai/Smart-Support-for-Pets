import React, { useEffect, lazy, Suspense } from 'react';
// Changed to HashRouter to ensure compatibility with specialized hosting environments
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AppRoutes } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Loader2 } from 'lucide-react';
import { registerDevice } from './services/firebase';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const PetCare = lazy(() => import('./pages/PetCare'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Community = lazy(() => import('./pages/Community'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Chat = lazy(() => import('./pages/Chat'));
const FindFriends = lazy(() => import('./pages/FindFriends'));
const PublicPetProfile = lazy(() => import('./pages/PublicPetProfile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UsernameDataStore = lazy(() => import('./pages/UsernameDataStore'));
const PetProfilePage = lazy(() => import('./pages/PetProfile'));
const Contact = lazy(() => import('./pages/Contact'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-theme" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Portal</span>
    </div>
  </div>
);

// Interface definition to fix TypeScript errors during build
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const AppContent: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 500);
    }
  }, []);

  // Register device for push notifications when user logs in
  useEffect(() => {
    const initNotifications = async () => {
      if (user) {
        try {
          const token = await registerDevice();
          if (token) {
            await fetch("/api/register-device", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, uid: user.uid }),
            });
            console.log("Device registered for notifications");
          }
        } catch (error) {
          console.error("Failed to register device for notifications:", error);
        }
      }
    };

    initNotifications();
  }, [user]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path={AppRoutes.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={AppRoutes.AI_ASSISTANT} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path={AppRoutes.PET_CARE} element={<ProtectedRoute><PetCare /></ProtectedRoute>} />
        <Route path={AppRoutes.HEALTH_CHECKUP} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path={AppRoutes.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path={AppRoutes.PET_PROFILE} element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
        <Route path={AppRoutes.CREATE_POST} element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path={AppRoutes.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path={AppRoutes.FIND_FRIENDS} element={<ProtectedRoute><FindFriends /></ProtectedRoute>} />
        <Route path={AppRoutes.CONTACT} element={<ProtectedRoute><Contact /></ProtectedRoute>} />
        <Route path="/pet/:petId" element={<ProtectedRoute><PublicPetProfile /></ProtectedRoute>} />
        <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/usernamedatastore" element={<ProtectedRoute><UsernameDataStore /></ProtectedRoute>} />
        <Route path={AppRoutes.TERMS} element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path={AppRoutes.PRIVACY} element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  </Router>
);

export default App;