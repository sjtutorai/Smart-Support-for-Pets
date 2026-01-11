
import React, { useState } from 'react';
import { Heart, Shield, Mail, Lock, User, MapPin, PawPrint, Loader2, ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png";

  // Form State
  const [formData, setFormData] = useState({
    email: '', // Used for "Email or Username"
    password: '',
    fullName: '',
    username: '',
    petName: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const formatFirebaseError = (err: any) => {
    const code = err.code || '';
    if (code === 'auth/configuration-not-found') return "Auth misconfigured. Check Firebase console.";
    if (code === 'auth/invalid-credential') return "Invalid credentials. If using a username, please ensure you registered with it.";
    if (code === 'auth/email-already-in-use') return "This email is already registered.";
    if (code === 'auth/weak-password') return "Password must be at least 6 characters.";
    return err.message || "An unexpected error occurred.";
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
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
        // In this implementation, we treat the 'email' field as either an email or a pseudo-username.
        // For standard Firebase, it must be an email. If users register with a username, 
        // we'd typically map that to an internal email.
        await loginWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password, formData.fullName);
      }
      navigate('/');
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200/50 flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-6xl w-full lg:w-[80%] bg-white rounded-[4rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col md:flex-row min-h-[750px] relative z-10 border border-white/50">
        
        {/* Left Section */}
        <div className="md:w-5/12 bg-indigo-600 p-12 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[25rem] h-[25rem] bg-white/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-14">
              <div className="bg-white p-3 rounded-[2rem] shadow-2xl w-24 h-24 flex items-center justify-center overflow-hidden border-4 border-white/20">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain scale-110" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter leading-none">Smart Support</h1>
                <p className="text-indigo-200 font-bold text-lg">for Pets</p>
              </div>
            </div>
            
            <h2 className="text-5xl font-black leading-tight mb-8 tracking-tighter">
              {isLogin ? "Welcome back to the family." : "Join the most caring community."}
            </h2>
            <p className="text-indigo-100 text-xl font-medium max-w-xs leading-relaxed opacity-90">
              Personalized AI care and community support for every companion.
            </p>
          </div>

          <div className="space-y-8 relative z-10 pt-10">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-indigo-300">Health & Love</p>
                <p className="font-bold">Proactive Wellness</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest text-indigo-300">Security</p>
                <p className="font-bold">Protected Data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-7/12 p-12 md:p-20 bg-white flex flex-col relative">
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <div className="mb-12">
              <h3 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">
                {isLogin ? "Sign In" : "Create Account"}
              </h3>
              <p className="text-slate-500 font-medium">
                {isLogin ? "Access your dashboard and AI care logs." : "Unlock smart monitoring for your best friend."}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-700 rounded-3xl text-sm leading-relaxed flex items-start gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                      <input required name="fullName" type="text" placeholder="John" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Username</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-3.5 text-slate-400 font-black text-lg">@</span>
                      <input required name="username" type="text" placeholder="jdoe" value={formData.username} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email or Username</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                  <input required name="email" type="text" placeholder="your@email.com or username" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors w-5 h-5" />
                  <input required name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 mt-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? "Sign In" : "Register")}
                {!isLoading && <ArrowRight size={22} />}
              </button>
            </form>

            <div className="my-10 flex items-center gap-6 text-slate-200">
              <div className="h-px flex-1 bg-slate-100"></div>
              <span className="text-[10px] font-black tracking-widest text-slate-300">OR</span>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-4 bg-white border border-slate-200 py-4 rounded-[2rem] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              Continue with Google
            </button>

            <div className="mt-10 text-center">
              <p className="text-slate-500 font-bold">
                {isLogin ? "Don't have an account?" : "Already registered?"}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-3 text-indigo-600 font-black hover:underline underline-offset-4">
                  {isLogin ? "Join Now" : "Sign In"}
                </button>
              </p>
            </div>
          </div>

          {/* Terms and Conditions Footer Link */}
          <div className="mt-12 text-center">
            <button 
              onClick={() => setShowTerms(true)}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              <FileText size={14} />
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Terms & Conditions</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated: March 2024</p>
                </div>
              </div>
              <button onClick={() => setShowTerms(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all active:scale-90">
                <ArrowRight className="rotate-180" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10 prose prose-slate max-w-none">
              <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 border-l-4 border-indigo-500 pl-4">1. Purpose of the Platform</h4>
                <p className="text-slate-500 leading-relaxed font-medium">SSP – Smart Support for Pets is a web-based community platform designed to allow pet owners to connect, share experiences, and provide AI-powered pet care guidance in a supportive environment. <strong>SSP does not replace professional veterinary services.</strong></p>
              </section>
              <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 border-l-4 border-indigo-500 pl-4">5. AI-Powered Assistance Disclaimer</h4>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <p className="text-sm text-amber-900 font-bold italic leading-relaxed">The AI assistant provides general care guidance only. It does NOT provide medical diagnoses. Always consult a licensed veterinarian for serious health concerns.</p>
                </div>
              </section>
              <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 border-l-4 border-indigo-500 pl-4">6. Data Usage & Privacy</h4>
                <p className="text-slate-500 leading-relaxed font-medium">User data is stored securely using Firebase. Pet profile data is used only to personalize your experience. We do not sell your personal information.</p>
              </section>
              <section className="space-y-4">
                <h4 className="text-lg font-black text-slate-900 border-l-4 border-indigo-500 pl-4">7. Limitation of Liability</h4>
                <p className="text-slate-500 leading-relaxed font-medium">SSP is not responsible for actions taken based on AI responses or user-generated content accuracy. Use the platform at your own discretion.</p>
              </section>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowTerms(false)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg hover:bg-black transition-all active:scale-[0.98]">
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
