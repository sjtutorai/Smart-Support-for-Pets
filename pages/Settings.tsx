
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Dog, 
  Bot, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Trash2, 
  ShieldAlert, 
  Save,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { BREED_DATA } from '../App';

const SettingsCard: React.FC<{ title: string, icon: React.ElementType, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) {
      setPet(JSON.parse(saved));
    }
  }, [user]);

  const handlePetUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (pet) {
      localStorage.setItem(`pet_${user?.uid}`, JSON.stringify(pet));
      triggerSuccess('Profile updated successfully!');
    }
  };

  const triggerSuccess = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      alert("Account deletion initiated. This is a demo action.");
      handleLogout();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Get all available species for the dropdown
  const allSpecies = Object.keys(BREED_DATA).sort();

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
          <p className="text-slate-500 font-medium">Manage your personal and pet preferences.</p>
        </div>
        {saveStatus && (
          <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full animate-in slide-in-from-top-2 border border-emerald-100">
            <CheckCircle2 size={18} />
            {saveStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Account Section */}
        <SettingsCard title="Account Settings" icon={User}>
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 gap-4">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Email</p>
              <p className="text-slate-800 font-bold text-lg">{user?.email || 'No email available'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-white text-rose-600 font-bold rounded-2xl border border-rose-100 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
          
          <div className={`p-6 rounded-[2rem] transition-all duration-300 ${showDeleteConfirm ? 'bg-rose-50 border-2 border-rose-200 shadow-lg shadow-rose-100' : 'bg-transparent border border-slate-100'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className={`${showDeleteConfirm ? 'text-rose-600' : 'text-slate-300'}`} size={24} />
                <div>
                  <p className="font-bold text-slate-800">Delete Account</p>
                  <p className="text-xs text-slate-400">Permanently remove all your pet data and history.</p>
                </div>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${showDeleteConfirm ? 'bg-rose-600 text-white hover:bg-rose-700' : 'text-rose-400 hover:text-rose-600 underline underline-offset-4'}`}
              >
                {showDeleteConfirm ? 'Confirm Permanent Deletion' : 'Delete Account'}
              </button>
            </div>
            {showDeleteConfirm && (
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 block text-center w-full"
              >
                Cancel Action
              </button>
            )}
          </div>
        </SettingsCard>

        {/* Pet Profile Section */}
        {pet ? (
          <SettingsCard title="Pet Profile" icon={Dog}>
            <form onSubmit={handlePetUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pet Name</label>
                  <input 
                    value={pet.name} 
                    onChange={e => setPet({...pet, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Species</label>
                  <select 
                    value={pet.species} 
                    onChange={e => {
                        const newSpecies = e.target.value;
                        setPet({...pet, species: newSpecies, breed: BREED_DATA[newSpecies]?.[0] || 'Unknown'});
                    }}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all appearance-none"
                  >
                    {allSpecies.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Variety / Breed</label>
                  <select 
                    value={pet.breed} 
                    onChange={e => setPet({...pet, breed: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all appearance-none"
                  >
                    {BREED_DATA[pet.species]?.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Years</label>
                  <input 
                    type="number"
                    value={pet.ageYears} 
                    onChange={e => setPet({...pet, ageYears: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Months</label>
                  <input 
                    type="number"
                    value={pet.ageMonths || 0} 
                    onChange={e => setPet({...pet, ageMonths: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ClipboardList size={14} /> Health Notes
                </label>
                <textarea 
                  value={pet.healthNotes || ''} 
                  onChange={e => setPet({...pet, healthNotes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-medium focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all min-h-[120px]"
                  placeholder="Note allergies, medications, or recent surgeries..."
                />
              </div>

              <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95">
                <Save size={20} /> Save Pet Profile
              </button>
            </form>
          </SettingsCard>
        ) : (
          <div className="bg-amber-50 border border-amber-100 p-10 rounded-[3rem] flex flex-col items-center gap-6 text-center">
            <div className="p-5 bg-white rounded-full shadow-sm text-amber-500">
               <ShieldAlert size={40} />
            </div>
            <div>
              <h4 className="text-xl font-black text-amber-900 mb-2 tracking-tight">Profile Not Found</h4>
              <p className="text-amber-700 max-w-sm font-medium">Register your pet in the Pet Profile section to unlock health management and preferences.</p>
            </div>
            <button 
              onClick={() => navigate('/pet-profile')}
              className="px-8 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
            >
              Go to Profile
            </button>
          </div>
        )}

        {/* AI Preferences */}
        <SettingsCard title="AI Assistant" icon={Bot}>
          <div className="flex items-center justify-between p-2">
            <div>
              <p className="font-bold text-slate-800">Enable Smart Analysis</p>
              <p className="text-xs text-slate-400">Allow the AI to analyze your pet's vitals for insights.</p>
            </div>
            <button 
              onClick={() => { setAiEnabled(!aiEnabled); triggerSuccess(`AI Support ${!aiEnabled ? 'Enabled' : 'Disabled'}`); }}
              className={`w-14 h-8 rounded-full transition-all relative ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${aiEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <button 
              onClick={() => { if(window.confirm('This will wipe all conversation history with the assistant. Proceed?')) triggerSuccess('Chat history cleared.'); }}
              className="w-full text-left py-4 px-5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors font-bold text-slate-600 flex items-center justify-between group"
            >
              <span className="flex items-center gap-3"><Bot size={18} className="text-slate-400 group-hover:text-indigo-600" /> Reset AI Memory</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            
            <div className="p-5 bg-indigo-50/50 rounded-2xl flex gap-4 items-start border border-indigo-100/50">
              <ShieldCheck size={24} className="text-indigo-600 flex-shrink-0 mt-1" />
              <div>
                <h5 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">AI Disclaimer</h5>
                <p className="text-xs text-indigo-900/70 font-medium leading-relaxed">
                  Smart Support for Pets Assistant provides general guidance based on provided data. It is NOT a replacement for a qualified veterinarian. In emergencies, seek immediate medical attention for your pet.
                </p>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* UI & App Preferences */}
        <SettingsCard title="App Preferences" icon={Bell}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-amber-500'}`}>
                   {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <p className="font-bold text-slate-800">Dark Mode</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'left-6.5' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${notifsEnabled ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                   <Bell size={18} />
                </div>
                <p className="font-bold text-slate-800">Notifications</p>
              </div>
              <button 
                onClick={() => { setNotifsEnabled(!notifsEnabled); triggerSuccess('Notification preferences updated.'); }}
                className={`w-12 h-6 rounded-full transition-all relative ${notifsEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${notifsEnabled ? 'left-6.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default Settings;
