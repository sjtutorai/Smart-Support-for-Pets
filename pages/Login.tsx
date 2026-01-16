import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginWithGoogle, loginWithIdentifier, signUpWithEmail } from '../services/firebase';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
    if (code === 'auth/popup-blocked') return "Sign-in popup was blocked.";
    if (code === 'auth/popup-closed-by-user') return "Sign-in was cancelled.";
    if (code === 'auth/invalid-credential') return "Incorrect credentials.";
    if (code === 'auth/email-already-in-use') return "Email already in use.";
    if (code === 'auth/weak-password') return "Password is too weak.";
    return err.message || "An authentication error occurred.";
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(formatFirebaseError(err));
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!agreedToTerms) {
        setError("Please agree to the Terms and Privacy Policy.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!formData.username) {
        formData.username = formData.fullName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000);
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await loginWithIdentifier(formData.identifier, formData.password);
      } else {
        await signUpWithEmail(formData.identifier, formData.password, formData.fullName, formData.username);
      }
    } catch (err: any) {
      setError(formatFirebaseError(err));
      setIsLoading(false);
    }
  };
  
  if (loading || (user && !isLoading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center shadow-xl border border-slate-50 mx-auto mb-6">
            <img src={LOGO_URL} alt="SS Paw Pal Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            {isLogin ? "Log in to your account" : "Create an Account"}
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Welcome back to SS Paw Pal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Name</label>
              <input 
                required 
                name="fullName" 
                type="text" 
                placeholder="Enter your name" 
                value={formData.fullName} 
                onChange={handleChange} 
                className="w-full bg-white border border-slate-200 rounded-lg py-3.5 px-4 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">
              {isLogin ? "Username or Email" : "Email"}
            </label>
            <input 
              required 
              name="identifier" 
              type={isLogin ? "text" : "email"} 
              placeholder={isLogin ? "Enter username or email" : "example@gmail.com"} 
              value={formData.identifier} 
              onChange={handleChange} 
              className="w-full bg-white border border-slate-200 rounded-lg py-3.5 px-4 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <input 
                required 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your Password" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full bg-white border border-slate-200 rounded-lg py-3.5 px-4 pr-12 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
              <div className="relative">
                <input 
                  required 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Please confirm your Password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full bg-white border border-slate-200 rounded-lg py-3.5 px-4 pr-12 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-3 py-1">
              <input 
                id="terms"
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 leading-tight">
                I agree with the <Link to={AppRoutes.TERMS} className="text-slate-900 underline hover:text-indigo-600 transition-colors">Terms of Service</Link> and <Link to={AppRoutes.PRIVACY} className="text-slate-900 underline hover:text-indigo-600 transition-colors">Privacy Policy</Link>.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-[#334155] text-white py-4 rounded-lg font-bold text-base hover:bg-[#1e293b] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Log in" : "Create Account")}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-600 text-sm font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="ml-1.5 text-slate-900 font-bold hover:text-indigo-600 transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

        {isLogin && (
           <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-4 text-slate-300">
                <div className="h-px flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <button 
                onClick={handleGoogleLogin} 
                disabled={isLoading} 
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3.5 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                Continue with Google
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Login;