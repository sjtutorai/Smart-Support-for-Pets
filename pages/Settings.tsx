import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  X, 
  Save, 
  Loader2, 
  AtSign, 
  Phone, 
  Palette,
  Plus,
  Check,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, updateUserProfile, isUsernameTaken } from '../services/firebase';
import { doc, getDoc } from "firebase/firestore";

const THEME_PRESETS = [
  { name: 'Indigo', color: '#4f46e5' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Violet', color: '#7c3aed' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Sunset', color: '#f97316' },
];

const SURFACE_PRESETS = [
  { name: 'Deep Slate', color: '#0f172a' },
  { name: 'Charcoal', color: '#334155' },
  { name: 'Midnight', color: '#1e293b' },
  { name: 'Deep Indigo', color: '#1e1b4b' },
];

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [dbUser, setDbUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('ssp_theme_color') || '#4f46e5');
  const [currentSurface, setCurrentSurface] = useState(() => localStorage.getItem('ssp_surface_color') || '#334155');
  
  // Username Validation States
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameTakenStatus, setUsernameTakenStatus] = useState<'available' | 'taken' | 'none'>('none');

  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    username: '',
    phoneNumber: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setDbUser(data);
            setEditData({
              displayName: data.displayName || user.displayName || '',
              username: data.username || '',
              phoneNumber: data.phoneNumber || ''
            });
          }
        } catch (e) {
          console.error("Error fetching user settings:", e);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Debounced Username Validation
  useEffect(() => {
    if (!isEditing || !editData.username || editData.username === dbUser?.username) {
      setIsValidatingUsername(false);
      setUsernameTakenStatus('none');
      return;
    }

    const handler = setTimeout(async () => {
      setIsValidatingUsername(true);
      try {
        const taken = await isUsernameTaken(editData.username, user?.uid || '');
        setUsernameTakenStatus(taken ? 'taken' : 'available');
      } catch (err) {
        console.error("Validation error:", err);
      } finally {
        setIsValidatingUsername(false);
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [editData.username, isEditing, dbUser?.username, user?.uid]);

  const changeTheme = (color: string) => {
    setCurrentTheme(color);
    const root = document.documentElement;
    root.style.setProperty('--theme-color', color);
    root.style.setProperty('--theme-color-hover', color + 'dd'); 
    root.style.setProperty('--theme-color-light', color + '15');
    localStorage.setItem('ssp_theme_color', color);
    addNotification('Primary Color Updated', 'Branding preferences updated.', 'success');
  };

  const changeSurface = (color: string) => {
    setCurrentSurface(color);
    const root = document.documentElement;
    root.style.setProperty('--theme-surface', color);
    localStorage.setItem('ssp_surface_color', color);
    addNotification('Surface Color Updated', 'Interface aesthetic updated.', 'success');
  };

  const handleSaveProfile = async () => {
    if (!user || usernameTakenStatus === 'taken' || isValidatingUsername) return;
    
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      await updateUserProfile(user.uid, {
        displayName: editData.displayName,
        username: editData.username,
        phoneNumber: editData.phoneNumber
      });
      
      setDbUser((prev: any) => ({ 
        ...prev, 
        displayName: editData.displayName,
        username: editData.username.toLowerCase(),
        phoneNumber: editData.phoneNumber
      }));
      
      setSaveStatus({ message: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      setUsernameTakenStatus('none');
      addNotification('Profile Updated', 'Identity synced successfully.', 'success');
    } catch (error: any) {
      console.error("Profile update failed:", error);
      const msg = error.message?.includes("taken") ? "That username is already taken. Please try another." : (error.message || 'Update failed.');
      setSaveStatus({ message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
      if (!saveStatus || saveStatus.type === 'success') {
        setTimeout(() => setSaveStatus(null), 5000);
      }
    }
  };

  const isSaveDisabled = isSaving || isValidatingUsername || usernameTakenStatus === 'taken' || !editData.username.trim();

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-12 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-theme-light text-theme rounded-full text-xs font-black uppercase tracking-widest mb-2 transition-theme">Aesthetic Hub</div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Profile Settings</h2>
        </div>
        
        {saveStatus && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border animate-in slide-in-from-top-4 shadow-xl ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            {saveStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="font-bold text-sm">{saveStatus.message}</span>
            <button onClick={() => setSaveStatus(null)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
          </div>
        )}
      </div>

      <div className="space-y-10">
        {/* Profile Card */}
        <div className="bg-white rounded-[4rem] p-10 md:p-20 border border-slate-50 shadow-2xl space-y-16 relative overflow-hidden transition-all duration-700">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:items-start gap-16 lg:gap-24">
            
            {/* Avatar Area */}
            <div className="relative group shrink-0">
              <div className="w-56 h-56 rounded-[3.5rem] bg-theme-light flex flex-col items-center justify-center overflow-hidden border-4 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:scale-105">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={96} className="text-theme opacity-20" />
                )}
                <div className="mt-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme/60">@{dbUser?.username || 'user'}</p>
                </div>
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Edit3 size={32} className="text-white" />
                  </div>
                )}
              </div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-full shadow-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-theme transition-all whitespace-nowrap active:scale-95"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Fields Area */}
            <div className="flex-1 w-full max-w-xl space-y-12">
              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                  <input 
                    readOnly={!isEditing}
                    value={isEditing ? editData.displayName : (dbUser?.displayName || user?.displayName || '')}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                    placeholder="e.g. Sadanand Jyoti"
                    className={`w-full p-6 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none transition-all ${
                      isEditing ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent cursor-default'
                    }`}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Unique Handle</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                      <AtSign size={20} />
                    </div>
                    <input 
                      readOnly={!isEditing}
                      value={isEditing ? editData.username : (dbUser?.username || '')}
                      onChange={(e) => setEditData({...editData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      placeholder="username"
                      className={`w-full p-6 pl-14 pr-14 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none transition-all ${
                        isEditing ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent cursor-default'
                      } ${usernameTakenStatus === 'taken' ? 'border-rose-300 bg-rose-50/30' : ''}`}
                    />
                    
                    {isEditing && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        {isValidatingUsername ? (
                          <Loader2 size={20} className="animate-spin text-theme opacity-50" />
                        ) : usernameTakenStatus === 'available' ? (
                          <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in" />
                        ) : usernameTakenStatus === 'taken' ? (
                          <AlertCircle size={20} className="text-rose-500 animate-in zoom-in" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="px-2 min-h-[20px] transition-all">
                      {isValidatingUsername ? (
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Checking handle availability...</p>
                      ) : usernameTakenStatus === 'available' ? (
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">This handle is available</p>
                      ) : usernameTakenStatus === 'taken' ? (
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">That handle is already taken. Please try another.</p>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={20} />
                    </div>
                    <input 
                      readOnly={!isEditing}
                      value={isEditing ? editData.phoneNumber : (dbUser?.phoneNumber || '')}
                      onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                      placeholder="e.g. +91 9876543210"
                      className={`w-full p-6 pl-14 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none transition-all ${
                        isEditing ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent cursor-default'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaveDisabled}
                    className="flex-[2] bg-theme text-white py-6 rounded-full font-black text-xl bg-theme-hover transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setUsernameTakenStatus('none');
                      setEditData({
                        displayName: dbUser?.displayName || user?.displayName || '',
                        username: dbUser?.username || '',
                        phoneNumber: dbUser?.phoneNumber || ''
                      });
                    }}
                    disabled={isSaving}
                    className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-full font-black text-xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Picker Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Theme Picker */}
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-12">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-theme-light text-theme rounded-[2rem] transition-theme shadow-sm">
                        <Palette size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Brand Highlight</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary UI Accents</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    {THEME_PRESETS.map((theme) => (
                    <button
                        key={theme.color}
                        onClick={() => changeTheme(theme.color)}
                        className={`group relative flex flex-col items-center gap-2 p-2 rounded-[2rem] transition-all duration-300 ${
                        currentTheme === theme.color ? 'bg-slate-50 ring-2 ring-slate-100 scale-105' : 'hover:bg-slate-50'
                        }`}
                    >
                        <div 
                        className={`w-12 h-12 rounded-[1.25rem] shadow-lg transition-all duration-500 flex items-center justify-center`}
                        style={{ backgroundColor: theme.color }}
                        >
                        {currentTheme === theme.color && <Check size={24} className="text-white animate-in zoom-in" />}
                        </div>
                    </button>
                    ))}
                    <label className="group relative flex flex-col items-center gap-3 p-2 rounded-[2.5rem] hover:bg-slate-50 cursor-pointer transition-all">
                        <div className="w-12 h-12 rounded-[1.25rem] shadow-lg bg-gradient-to-tr from-rose-500 via-indigo-500 to-emerald-500 flex items-center justify-center transition-all group-hover:rotate-12">
                            <Plus size={24} className="text-white" />
                        </div>
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => changeTheme(e.target.value)} />
                    </label>
                </div>
            </div>

            {/* Surface Theme Picker */}
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-12">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-white rounded-[2rem] transition-theme shadow-sm">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Surface Aesthetic</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sidebar & Layout Base</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    {SURFACE_PRESETS.map((surf) => (
                    <button
                        key={surf.color}
                        onClick={() => changeSurface(surf.color)}
                        className={`group relative flex flex-col items-center gap-2 p-2 rounded-[2rem] transition-all duration-300 ${
                        currentSurface === surf.color ? 'bg-slate-50 ring-2 ring-slate-100 scale-105' : 'hover:bg-slate-50'
                        }`}
                    >
                        <div 
                        className={`w-12 h-12 rounded-[1.25rem] shadow-lg transition-all duration-500 flex items-center justify-center`}
                        style={{ backgroundColor: surf.color }}
                        >
                        {currentSurface === surf.color && <Check size={24} className="text-white animate-in zoom-in" />}
                        </div>
                    </button>
                    ))}
                    <label className="group relative flex flex-col items-center gap-3 p-2 rounded-[2.5rem] hover:bg-slate-50 cursor-pointer transition-all">
                        <div className="w-12 h-12 rounded-[1.25rem] shadow-lg bg-slate-200 flex items-center justify-center transition-all group-hover:rotate-12">
                            <Plus size={24} className="text-slate-400" />
                        </div>
                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => changeSurface(e.target.value)} />
                    </label>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;