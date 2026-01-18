import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithApple, 
  loginWithIdentifier, 
  signUpWithEmail 
} from '../services/firebase';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';

// Validation Utilities
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password: string) => {
  // Requirement: 8+ chars, 1 uppercase, 1 lowercase, 1 number. 
  // Supports all special characters.
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  const [formData, setFormData] = useState({
    identifier: '', 
    password: '',
    confirmPassword: '',
    fullName: '',
    username: '',
  });

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const formatFirebaseError = (err: any) => {
    const code = err.code || '';
    switch (code) {
      case 'auth/invalid-credential': return "Incorrect email or password.";
      case 'auth/user-not-found': return "No account associated with this email.";
      case 'auth/wrong-password': return "Invalid credentials.";
      case 'auth/email-already-in-use': return "This email is already registered.";
      case 'auth/weak-password': return "Password is not secure enough.";
      default: return err.message || "An unexpected error occurred.";
    }
  };

  const validate = () => {
    if (!isLogin) {
      if (!formData.fullName.trim()) { setError("Full Name is required."); return false; }
      if (!validateEmail(formData.identifier)) { setError("Invalid email format."); return false; }
      if (!formData.username.trim()) { setError("Handle is required."); return false; }
      if (!validatePassword(formData.password)) {
        setError("Secret Key must be 8+ characters with uppercase, lowercase, and a number.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) { setError("Keys do not match."); return false; }
      if (!agreedToTerms) { setError("Accept the Terms to proceed."); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await loginWithIdentifier(formData.identifier, formData.password);
        navigate('/', { replace: true });
      } else {
        await signUpWithEmail(formData.identifier, formData.password, formData.fullName, formData.username);
        setSuccessMessage("Identity verified. Welcome to the pack.");
        setTimeout(() => navigate('/', { replace: true }), 1500);
      }
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      if (isLogin) setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) { setError(formatFirebaseError(err)); }
    finally { setIsLoading(false); }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithApple();
      navigate('/', { replace: true });
    } catch (err) { setError(formatFirebaseError(err)); }
    finally { setIsLoading(false); }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center animate-in zoom-in-95">
          <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verified</h2>
          <p className="text-slate-500 mt-4 font-medium">{successMessage}</p>
          <Loader2 className="mx-auto mt-8 w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 text-center">
          <div className="w-20 h-20 bg-white rounded-3xl p-2 flex items-center justify-center shadow-xl border border-slate-50 mx-auto mb-6">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-[#0f172a] tracking-tighter">
            {isLogin ? "System Entry" : "Join Network"}
          </h1>
          <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">SS Paw Pal Hub</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-bold flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-8">
          <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 bg-white border border-slate-100 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          <button onClick={handleAppleLogin} className="flex items-center justify-center gap-3 bg-slate-900 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-black transition-all shadow-xl">
             <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-22.1-82.6-22.1-41.9 0-80.6 24.1-102.2 61.9-43.2 75.3-11.1 185.9 31.5 247.4 20.8 29.9 45.3 63.6 77.3 62.6 31.1-1 42.8-20.1 80.5-20.1 37.7 0 48.6 20.1 80.5 19.3 32.7-.8 53.7-30.5 73.8-60 23.2-33.9 32.7-66.8 33-68.5-.8-.4-64.1-24.6-64.4-97.5zm-58.5-157.4c16-19.7 26.8-47 23.8-74.3-23.3 1-51.3 15.6-68 35.3-14.9 17.5-28 45.3-24.5 71.5 26.1 2 52.7-12.8 68.7-32.5z"/></svg>
             Sign in with Apple
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <input name="fullName" type="text" placeholder="e.g. Sadanand Jyoti" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white outline-none transition-all" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{isLogin ? "Username or Email" : "Email"}</label>
            <input name="identifier" type="text" placeholder="hello@example.com" value={formData.identifier} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white outline-none transition-all" />
          </div>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unique Handle</label>
              <input name="username" type="text" placeholder="username" value={formData.username} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white outline-none transition-all" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Key</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white outline-none transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Key</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white outline-none transition-all" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          )}
          {!isLogin && (
            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1" />
              <label className="text-[11px] text-slate-500 font-medium">I agree to the <Link to={AppRoutes.TERMS} className="text-slate-900 font-bold underline">Terms</Link>.</label>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? "Connect" : "Initialize Account")}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-50 pt-6">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">
            {isLogin ? "Unauthorized?" : "Already verified?"}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 text-indigo-600 hover:underline">
              {isLogin ? "Register Access" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;