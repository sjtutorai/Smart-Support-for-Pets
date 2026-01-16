import React, { useState, useEffect } from 'react';
import { Heart, Shield, Mail, Lock, User, MapPin, PawPrint, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { loginWithGoogle, loginWithIdentifier, signUpWithEmail } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: '',
    fullName: '',
    username: '',
    petName: '',
    address: ''
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const formatFirebaseError = (err: any) => {
    const code = err.code || '';
    if (code === 'auth/popup-blocked') return "Sign-in popup was blocked. Please enable popups for this site.";
    if (code === 'auth/popup-closed-by-user') return "Sign-in was cancelled.";
    if (code === 'auth/cancelled-by-user') return "Action cancelled.";
    if (code === 'auth/invalid-credential') return "The username/email or password you entered is incorrect.";
    if (code === 'auth/email-already-in-use') return "This email is already registered. Try signing in instead.";
    if (code === 'auth/weak-password') return "Password should be at least 6 characters.";
    if (code === 'auth/network-request-failed') return "Network error. Please check your internet connection.";
    return err.message || "An unexpected authentication error occurred.";
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Redirection is now handled by the useEffect hook
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginWithIdentifier(formData.identifier, formData.password);
      } else {
        await signUpWithEmail(formData.identifier, formData.password, formData.fullName, formData.username);
      }
      // Redirection is now handled by the useEffect hook
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500 min-h-[600px]">
        <div className="md:w-5/12 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white p-2 rounded-2xl shadow-lg w-12 h-12 flex items-center justify-center overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">SS Paw Pal</h1>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-6">
              {isLogin ? "Your pet's best life starts here." : "Join our community of pet lovers."}
            </h2>
          </div>
        </div>

        <div className="md:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-3xl font-bold text-slate-800 mb-2">{isLogin ? "Welcome Back!" : "Get Started"}</h3>
              <p className="text-slate-500 text-sm">
                {isLogin ? "Sign in with username or email." : "Create an account to join."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs leading-relaxed flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                    <input required name="fullName" type="text" placeholder="John Doe" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desired Username</label>
                    <input required name="username" type="text" placeholder="johndoe" value={formData.username} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{isLogin ? "Username or Email" : "Email Address"}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
                  <input required name="identifier" type={isLogin ? "text" : "email"} placeholder={isLogin ? "Username or email" : "email@example.com"} value={formData.identifier} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
                  <input required name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white h-[56px] rounded-2xl font-bold text-base hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-100">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : (isLogin ? "Sign In" : "Create Account")}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4 text-slate-300">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-bold">OR</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm font-medium">
                {isLogin ? "New to SS Paw Pal?" : "Already have an account?"}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 text-indigo-600 font-bold hover:underline">
                  {isLogin ? "Join Now" : "Sign In"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;