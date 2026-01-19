
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, updateUserProfile, isUsernameTaken } from '../services/firebase';
import { doc, getDoc } from "firebase/firestore";
import { countryCodes } from '../utils/countryCodes';

const THEME_PRESETS = [
  { name: 'Indigo', color: '#4f46e5' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Violet', color: '#7c3aed' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Sunset', color: '#f97316' },
];

const parsePhoneNumber = (fullNumber: string) => {
  if (!fullNumber) return { phoneCode: '+91', phoneNumber: '' };

  const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  
  for (const country of sortedCodes) {
    if (fullNumber.startsWith(country.code)) {
      const numberPart = fullNumber.substring(country.code.length).trim();
      return { phoneCode: country.code, phoneNumber: numberPart };
    }
  }
  
  return { phoneCode: '+91', phoneNumber: fullNumber.replace('+91', '').trim() };
};


const Settings: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [dbUser, setDbUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('ssp_theme_color') || '#4f46e5');
  
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameTakenStatus, setUsernameTakenStatus] = useState<'available' | 'taken' | 'none'>('none');
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);

  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    username: '',
    phoneCode: '+91',
    phoneNumber: ''
  });

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const { phoneCode, phoneNumber } = parsePhoneNumber(data.phoneNumber);
            setDbUser(data);
            setEditData({
              displayName: data.displayName || user.displayName || '',
              username: data.username || '',
              phoneCode,
              phoneNumber
            });
          }
        } catch (e) { console.error("Error fetching user settings:", e); }
      }
    };
    fetchUserData();
  }, [user]);

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
      } catch (err) { console.error("Validation error:", err); } 
      finally { setIsValidatingUsername(false); }
    }, 600);

    return () => clearTimeout(handler);
  }, [editData.username, isEditing, dbUser?.username, user?.uid]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountry = useMemo(() => {
      return countryCodes.find(c => c.code === editData.phoneCode) || countryCodes.find(c => c.name === 'India');
  }, [editData.phoneCode]);

  useEffect(() => {
    if (!isEditing || !selectedCountry || !editData.phoneNumber) {
      setPhoneValidationError(null);
      return;
    }
  
    const cleanNumber = editData.phoneNumber.replace(/[\s-]/g, '');
    const numberLength = cleanNumber.length;
    const expectedDigits = selectedCountry.digits;
  
    if (numberLength === 0) {
      setPhoneValidationError(null);
      return;
    }
  
    if (expectedDigits.includes('-')) {
      const [min, max] = expectedDigits.split('-').map(Number);
      if (numberLength < min || numberLength > max) {
        setPhoneValidationError(`Number must be ${min} to ${max} digits.`);
      } else {
        setPhoneValidationError(null);
      }
    } else {
      const expectedLength = Number(expectedDigits);
      if (numberLength !== expectedLength) {
        setPhoneValidationError(`Number must be ${expectedLength} digits.`);
      } else {
        setPhoneValidationError(null);
      }
    }
  }, [editData.phoneNumber, selectedCountry, isEditing]);

  const filteredCountryCodes = useMemo(() => {
      if (!countrySearchTerm) return countryCodes;
      const search = countrySearchTerm.toLowerCase();
      return countryCodes.filter(c => c.name.toLowerCase().includes(search));
  }, [countrySearchTerm]);


  const changeTheme = (color: string) => {
    setCurrentTheme(color);
    document.documentElement.style.setProperty('--theme-color', color);
    localStorage.setItem('ssp_theme_color', color);
    addNotification('Primary Color Updated', 'Branding preferences updated.', 'success');
  };

  const isPhoneNumberInvalid = !!phoneValidationError && editData.phoneNumber.trim().length > 0;

  const handleSaveProfile = async () => {
    if (!user || usernameTakenStatus === 'taken' || isValidatingUsername || isPhoneNumberInvalid || !editData.username.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const trimmedDisplayName = editData.displayName.trim();
      const trimmedUsername = editData.username.trim();
      const fullPhoneNumber = editData.phoneNumber.trim() ? `${editData.phoneCode.trim()} ${editData.phoneNumber.trim()}` : '';

      await updateUserProfile(user.uid, { 
        displayName: trimmedDisplayName, 
        username: trimmedUsername, 
        phoneNumber: fullPhoneNumber 
      });
      
      const { phoneCode, phoneNumber } = parsePhoneNumber(fullPhoneNumber);

      setDbUser((prev: any) => ({ 
        ...prev, 
        displayName: trimmedDisplayName, 
        username: trimmedUsername.toLowerCase(), 
        phoneNumber: fullPhoneNumber 
      }));
      setEditData(prev => ({ 
        ...prev, 
        displayName: trimmedDisplayName, 
        username: trimmedUsername, 
        phoneCode, 
        phoneNumber 
      }));
      
      const successStatus = { message: 'Profile updated successfully!', type: 'success' as const };
      setSaveStatus(successStatus);
      setTimeout(() => {
        setSaveStatus(currentStatus => (currentStatus && currentStatus.message === successStatus.message ? null : currentStatus));
      }, 5000);

      setIsEditing(false);
      setUsernameTakenStatus('none');
      addNotification('Profile Updated', 'Identity synced successfully.', 'success');

    } catch (error: any) {
      console.error("Profile update failed:", error);
      const msg = error.message?.includes("taken") ? "That username is already taken. Please try another." : (error.message || 'Update failed.');
      setSaveStatus({ message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = isSaving || isValidatingUsername || usernameTakenStatus === 'taken' || !editData.username.trim() || isPhoneNumberInvalid;

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-theme-light text-theme rounded-full text-xs font-black uppercase tracking-widest mb-2 transition-theme">Account Hub</div>
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
        <div className="bg-white rounded-[4rem] p-10 md:p-20 border border-slate-50 shadow-2xl space-y-16 relative overflow-hidden transition-all duration-700">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:items-start gap-16 lg:gap-24">
            
            <div className="relative group shrink-0">
              <div className="w-56 h-56 rounded-[3.5rem] bg-theme-light flex flex-col items-center justify-center overflow-hidden border-4 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:scale-105">
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={96} className="text-theme opacity-20" />}
                <div className="mt-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme/60">@{dbUser?.username || 'user'}</p>
                </div>
                {isEditing && <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"><Edit3 size={32} className="text-white" /></div>}
              </div>
              {!isEditing && <button onClick={() => setIsEditing(true)} className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-full shadow-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-theme transition-all whitespace-nowrap active:scale-95">Edit Profile</button>}
            </div>

            <div className="flex-1 w-full max-w-xl space-y-12">
              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                  <input readOnly={!isEditing} value={editData.displayName} onChange={(e) => setEditData({...editData, displayName: e.target.value})} placeholder="e.g. Sadanand Jyoti" className={`w-full p-6 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none transition-all ${isEditing ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent cursor-default'}`} />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Unique Handle</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"><AtSign size={20} /></div>
                    <input readOnly={!isEditing} value={editData.username} onChange={(e) => setEditData({...editData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="username" className={`w-full p-6 pl-14 pr-14 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none transition-all ${isEditing ? 'bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent cursor-default'} ${usernameTakenStatus === 'taken' ? 'border-rose-300 bg-rose-50/30' : ''}`} />
                    {isEditing && <div className="absolute right-6 top-1/2 -translate-y-1/2">{isValidatingUsername ? <Loader2 size={20} className="animate-spin text-theme opacity-50" /> : usernameTakenStatus === 'available' ? <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in" /> : usernameTakenStatus === 'taken' ? <AlertCircle size={20} className="text-rose-500 animate-in zoom-in" /> : null}</div>}
                  </div>
                  {isEditing && <div className="px-2 min-h-[20px] transition-all">{isValidatingUsername ? <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Checking handle availability...</p> : usernameTakenStatus === 'available' ? <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">This handle is available</p> : usernameTakenStatus === 'taken' ? <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">That handle is already taken.</p> : null}</div>}
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                  <div className={`relative flex items-center w-full rounded-[1.5rem] transition-all ${isEditing ? 'bg-slate-50 border focus-within:bg-white focus-within:ring-4 ring-theme/10' : 'bg-slate-50/50 border-transparent'} ${isPhoneNumberInvalid ? 'border-rose-300' : 'border-slate-200'}`}>
                    <div className="relative" ref={countryDropdownRef}>
                      <button type="button" disabled={!isEditing} onClick={() => setIsCountryDropdownOpen(prev => !prev)} className={`flex items-center gap-2 px-4 py-6 rounded-l-[1.5rem] ${isEditing ? 'cursor-pointer hover:bg-slate-100/50' : 'cursor-default'}`}>
                        <span className="text-xl">{selectedCountry?.flag}</span>
                        <span className="font-bold text-lg text-slate-800">{selectedCountry?.code}</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isCountryDropdownOpen && isEditing && (
                          <div className="absolute bottom-full mb-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 origin-bottom">
                            <div className="relative p-2">
                              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input type="text" value={countrySearchTerm} onChange={(e) => setCountrySearchTerm(e.target.value)} placeholder="Search country..." className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold" />
                            </div>
                            <ul className="max-h-60 overflow-y-auto custom-scrollbar mt-1 p-2 space-y-1">
                              {filteredCountryCodes.map(c => (
                                <li key={c.name}>
                                  <button type="button" onClick={() => { setEditData({ ...editData, phoneCode: c.code }); setIsCountryDropdownOpen(false); setCountrySearchTerm(''); }} className="w-full flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl text-left">
                                    <span className="font-bold text-sm text-slate-700">{c.flag} {c.name}</span>
                                    <span className="text-xs text-slate-400 font-medium">{c.code}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                      )}
                    </div>
                    <div className="w-px h-8 bg-slate-200 self-center"></div>
                    <input readOnly={!isEditing} value={editData.phoneNumber} onChange={(e) => setEditData({...editData, phoneNumber: e.target.value.replace(/[^0-9\s-]/g, '')})} placeholder="Phone Number" className={`w-full p-6 bg-transparent text-lg font-bold text-slate-800 outline-none ${isEditing ? '' : 'cursor-default'}`} />
                  </div>
                  {isEditing && <div className="px-2 min-h-[20px] transition-all">
                    {isPhoneNumberInvalid ? (
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">{phoneValidationError}</p>
                    ) : (
                      selectedCountry && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected length: {selectedCountry.digits.replace('-', ' to ')} digits</p>
                    )}
                  </div>}
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-500">
                  <button onClick={handleSaveProfile} disabled={isSaveDisabled} className="flex-[2] bg-theme text-white py-6 rounded-full font-black text-xl bg-theme-hover transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:bg-slate-300 flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setUsernameTakenStatus('none'); const { phoneCode, phoneNumber } = parsePhoneNumber(dbUser?.phoneNumber || ''); setEditData({ displayName: dbUser?.displayName || user?.displayName || '', username: dbUser?.username || '', phoneCode, phoneNumber }); }} disabled={isSaving} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-full font-black text-xl hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-theme-light text-theme rounded-[2rem] transition-theme shadow-sm"><Palette size={28} /></div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Primary Brand Color</h3>
              <p className="text-slate-500 font-medium">Customize your primary workspace accent.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {THEME_PRESETS.map((theme) => (<button key={theme.color} onClick={() => changeTheme(theme.color)} className={`group relative flex flex-col items-center gap-3 p-3 rounded-[2.5rem] transition-all duration-300 ${currentTheme === theme.color ? 'bg-slate-50 ring-2 ring-slate-100 scale-105 shadow-xl' : 'hover:bg-slate-50'}`}>
              <div className={`w-16 h-16 rounded-[2rem] shadow-lg transition-all duration-500 flex items-center justify-center ${currentTheme === theme.color ? 'scale-110' : ''}`} style={{ backgroundColor: theme.color }}>{currentTheme === theme.color && <Check size={32} className="text-white animate-in zoom-in" />}</div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme === theme.color ? 'text-theme' : 'text-slate-400'}`}>{theme.name}</span>
            </button>))}
            <label className="group relative flex flex-col items-center gap-3 p-3 rounded-[2.5rem] hover:bg-slate-50 cursor-pointer transition-all">
              <div className="w-16 h-16 rounded-[2rem] shadow-lg bg-gradient-to-tr from-rose-500 via-indigo-500 to-emerald-500 flex items-center justify-center transition-all group-hover:rotate-12"><Plus size={32} className="text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom</span>
              <input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => changeTheme(e.target.value)} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
