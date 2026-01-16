import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Eye, EyeOff, MailCheck, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithApple, 
  loginWithIdentifier, 
  signUpWithEmail, 
  resendVerificationEmail,
  logout 
} from '../services/firebase';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationNeeded, setVerificationNeeded] = useState(false);
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
    // If user is logged in and verified, send to dashboard
    if (!loading && user && user.emailVerified) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const formatFirebaseError = (err: any) => {
    const code = err.code || '';
    console.error("Auth Exception:", code, err);
    
    switch (code) {
      case 'auth/popup-blocked': return "Sign-in popup was blocked by your browser.";
      case 'auth/popup-closed-by-user': return "Sign-in was cancelled.";
      case 'auth/invalid-credential': return "The email or password you entered is incorrect.";
      case 'auth/user-not-found': return "No account exists with this email.";
      case 'auth/wrong-password': return "Incorrect password.";
      case 'auth/email-already-in-use': return "This email is already registered.";
      case 'auth/weak-password': return "Password must be at least 6 characters.";
      case 'auth/username-already-in-use': return "This handle is already taken.";
      case 'auth/invalid-email': return "Please enter a valid email address.";
      case 'auth/network-request-failed': return "Connection lost. Please check your internet.";
      case 'auth/too-many-requests': return "Access disabled due to many failed attempts. Try later.";
      default: return err.message || "An unexpected error occurred during authentication.";
    }
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
  
  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithApple();
    } catch (err: any) {
      setError(formatFirebaseError(err));
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      await resendVerificationEmail();
      setSuccessMessage("Success! A new verification link has been sent.");
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setIsResending(false);
    }
  };

  const validate = () => {
    if (!isLogin) {
      if (!agreedToTerms) {
        setError("You must agree to the Terms and Privacy Policy.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }
      if (!formData.identifier.includes('@')) {
        setError("Please enter a valid email address.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setSuccessMessage('');
    setVerificationNeeded(false);

    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const loggedUser = await loginWithIdentifier(formData.identifier, formData.password);
        if (!loggedUser.emailVerified) {
          setVerificationNeeded(true);
          setError("Your email isn't verified yet.");
        } else {
          navigate('/', { replace: true });
        }
      } else {
        await signUpWithEmail(
          formData.identifier, 
          formData.password, 
          formData.fullName, 
          formData.username
        );
        setSuccessMessage("Registration successful! Verify your email to continue.");
        setVerificationNeeded(true);
        setIsLogin(true); // Switch to login view after successful signup
      }
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const AppleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-22.1-82.6-22.1-41.9 0-80.6 24.1-102.2 61.9-43.2 75.3-11.1 185.9 31.5 247.4 20.8 29.9 45.3 63.6 77.3 62.6 31.1-1 42.8-20.1 80.5-20.1 37.7 0 48.6 20.1 80.5 19.3 32.7-.8 53.7-30.5 73.8-60 23.2-33.9 32.7-66.8 33-68.5-.8-.4-64.1-24.6-64.4-97.5zm-58.5-157.4c16-19.7 26.8-47 23.8-74.3-23.3 1-51.3 15.6-68 35.3-14.9 17.5-28 45.3-24.5 71.5 26.1 2 52.7-12.8 68.7-32.5z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 text-center">
          <div className="w-24 h-24 bg-white rounded-3xl p-3 flex items-center justify-center shadow-2xl shadow-slate-200 border border-slate-50 mx-auto mb-6 group hover:rotate-6 transition-transform">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-[#0f172a] tracking-tighter">
            {isLogin ? "Welcome Back" : "Join the Pack"}
          </h1>
          <p className="text-slate-400 text-xs mt-2 font-black uppercase tracking-[0.2em]">SS Paw Pal Hub</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-black flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-black flex items-start gap-3 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {verificationNeeded && (
          <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-indigo-700">
              <MailCheck className="w-6 h-6" />
              <h3 className="font-black text-sm uppercase tracking-tight">Verify Your Identity</h3>
            </div>
            <p className="text-xs text-indigo-600/80 font-medium leading-relaxed">
              We've sent a magic link to your email. Please click it to activate your companion portal.
            </p>
            <button 
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
            >
              {isResending ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
              Resend magic link
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-8">
            <button 
              onClick={handleGoogleLogin} 
              disabled={isLoading} 
              className="flex items-center justify-center gap-3 bg-white border border-slate-100 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
            <button 
              onClick={handleAppleLogin} 
              disabled={isLoading} 
              className="flex items-center justify-center gap-3 bg-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
            >
              <AppleIcon />
              Continue with Apple
            </button>
            <div className="flex items-center gap-4 text-slate-200 mt-2">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or use email</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Guardian Name</label>
              <input 
                required 
                name="fullName" 
                type="text" 
                placeholder="Pet Parent Name" 
                value={formData.fullName} 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all placeholder:text-slate-300" 
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {isLogin ? "Username or Email" : "Email Address"}
            </label>
            <input 
              required 
              name="identifier" 
              type={isLogin ? "text" : "email"} 
              placeholder={isLogin ? "Enter handle or email" : "hello@example.com"} 
              value={formData.identifier} 
              onChange={handleChange} 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all placeholder:text-slate-300" 
            />
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Handle</label>
              <input 
                required 
                name="username" 
                type="text" 
                placeholder="unique_username" 
                value={formData.username} 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all placeholder:text-slate-300" 
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Key</label>
            <div className="relative">
              <input 
                required 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 pr-14 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all placeholder:text-slate-300" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Repeat Key</label>
              <div className="relative">
                <input 
                  required 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 pr-14 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all placeholder:text-slate-300" 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-3 py-2">
              <input 
                id="terms"
                type="checkbox" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded-lg border-slate-200 text-slate-900 focus:ring-slate-100"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-500 font-bold leading-tight">
                I agree to the <Link to={AppRoutes.TERMS} className="text-slate-900 underline hover:text-slate-700">Terms</Link> and <Link to={AppRoutes.PRIVACY} className="text-slate-900 underline hover:text-slate-700">Privacy Policy</Link>.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-slate-200"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Authenticate" : "Create Account")}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {isLogin ? "New to Paw Pal?" : "Member already?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); setVerificationNeeded(false); }} 
              className="ml-2 text-slate-900 hover:underline transition-all"
            >
              {isLogin ? "Join Now" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;