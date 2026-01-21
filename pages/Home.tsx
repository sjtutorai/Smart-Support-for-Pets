import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Heart, 
  Calendar, 
  Activity, 
  Plus, 
  PawPrint, 
  Dog, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  CircleDot,
  Trophy,
  Sparkles,
  ChevronDown,
  Edit2,
  X,
  Save,
  Zap,
  Loader2,
  LayoutDashboard,
  ArrowRight,
  Scale,
  Dumbbell,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AppRoutes, PetProfile, WeightRecord } from '../types';
import { STAT_ROUTINE } from '../context/NotificationContext';
import { syncPetToDb, getPetsByOwnerId } from '../services/firebase';

const StatCard: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  color: string,
  onEdit: () => void 
}> = ({ icon: Icon, label, value, color, onEdit }) => (
  <div 
    onClick={onEdit}
    className="group bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 relative cursor-pointer"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color} shadow-lg transition-transform group-hover:scale-110 duration-500`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
    <h3 className="text-3xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
    
    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
        <Edit2 size={14} />
      </div>
    </div>
  </div>
);

const Home: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  const [appointments, setAppointments] = useState(() => localStorage.getItem(`ssp_appointments_${user?.uid}`) || 'None');
  const [exercise, setExercise] = useState(() => localStorage.getItem(`ssp_exercise_${user?.uid}`) || '0');
  const [petStatus, setPetStatus] = useState(() => localStorage.getItem(`ssp_status_${user?.uid}`) || 'Active');
  
  const [editingStat, setEditingStat] = useState<'appointments' | 'exercise' | 'weight' | 'status' | null>(null);
  const [showLogOptions, setShowLogOptions] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();

  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      setIsLoading(true);
      const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPets(parsed);
          if (parsed.length > 0 && !activePet) setActivePet(parsed[0]);
        } catch (e) {}
      }

      try {
        const remotePets = await getPetsByOwnerId(user.uid);
        if (remotePets.length > 0) {
          setPets(remotePets);
          localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(remotePets));
          if (!activePet) setActivePet(remotePets[0]);
        }
      } catch (err) {
        console.warn("Home dashboard sync warning:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const handleUpdateStat = async () => {
    if (!user) return;

    if (editingStat === 'weight' && activePet) {
      const newWeight = parseFloat(editValue);
      if (!isNaN(newWeight)) {
        const newRecord: WeightRecord = { 
          date: new Date().toISOString().split('T')[0], 
          weight: newWeight 
        };
        const updatedPet = { 
          ...activePet, 
          weightHistory: [...(activePet.weightHistory || []), newRecord] 
        };
        const updatedPets = pets.map(p => p.id === activePet.id ? updatedPet : p);
        
        setPets(updatedPets);
        setActivePet(updatedPet);
        localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(updatedPets));
        await syncPetToDb(updatedPet);
      }
    } else if (editingStat === 'appointments') {
      setAppointments(editValue || 'None');
      localStorage.setItem(`ssp_appointments_${user.uid}`, editValue || 'None');
    } else if (editingStat === 'exercise') {
      setExercise(editValue || '0');
      localStorage.setItem(`ssp_exercise_${user.uid}`, editValue || '0');
    } else if (editingStat === 'status') {
      setPetStatus(editValue || 'Active');
      localStorage.setItem(`ssp_status_${user.uid}`, editValue || 'Active');
    }

    setEditingStat(null);
    setEditValue('');
  };

  const hasPets = pets.length > 0;
  const firstName = user?.displayName?.split(' ')[0] || 'Pet Parent';

  const getTaskStatus = (task: any) => {
    if (currentHour >= task.endHour) return 'done';
    if (currentHour >= task.startHour && currentHour < task.endHour) return 'active';
    return 'pending';
  };

  const isDayComplete = useMemo(() => {
    const lastTask = STAT_ROUTINE[STAT_ROUTINE.length - 1];
    return currentHour >= lastTask.endHour;
  }, [currentHour]);

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const recentWeight = activePet?.weightHistory?.[activePet.weightHistory.length - 1]?.weight;

  // Input validation handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Strict numeric validation for weight and exercise
    if (editingStat === 'weight') {
      // Allow only numbers and one dot
      val = val.replace(/[^0-9.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
      if (val.length > 6) return; // Limit total chars
    } else if (editingStat === 'exercise') {
      // Allow only integers
      val = val.replace(/[^0-9]/g, '');
      if (val.length > 3) return; // Max 999 minutes
    }

    setEditValue(val);
  };

  const openEditor = (type: 'appointments' | 'exercise' | 'weight' | 'status') => {
    setEditingStat(type);
    if (type === 'weight') setEditValue(recentWeight ? String(recentWeight) : '');
    else if (type === 'appointments') setEditValue(appointments === 'None' ? '' : appointments);
    else if (type === 'exercise') setEditValue(exercise);
    else if (type === 'status') setEditValue(petStatus);
    setShowLogOptions(false);
  };

  if (isLoading && pets.length === 0) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-theme" size={40} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Portal Link Active</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
            Hi, {firstName}!
          </h2>
          <p className="text-slate-400 font-medium flex items-center gap-2">
            <Clock size={14} /> 
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {formattedTime}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {hasPets && (
            <div className="relative group">
              <button className="flex items-center gap-4 bg-white border border-slate-100 px-6 py-4 rounded-[1.5rem] font-bold shadow-sm hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                  {activePet?.avatarUrl ? (
                    <img src={activePet.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <span className="text-sm font-black text-slate-700">{activePet?.name}</span>
                <ChevronDown size={16} className="text-slate-300" />
              </button>
              <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 p-3 space-y-1 scale-95 group-hover:scale-100 origin-top-right">
                <p className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Select Companion</p>
                {pets.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => setActivePet(p)} 
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm ${activePet?.id === p.id ? 'bg-theme text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center">
                        {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} />}
                    </div>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link 
            to={AppRoutes.CREATE_POST}
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95"
          >
            <Plus size={24} />
          </Link>
        </div>
      </div>

      {hasPets ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard 
              icon={Heart} 
              label="Recent Weight" 
              value={recentWeight ? `${recentWeight} kg` : '--'} 
              color="bg-rose-500" 
              onEdit={() => openEditor('weight')}
            />
            <StatCard 
              icon={Calendar} 
              label="Appointments" 
              value={appointments} 
              color="bg-indigo-600" 
              onEdit={() => openEditor('appointments')} 
            />
            <StatCard 
              icon={Activity} 
              label="Exercise Today" 
              value={`${exercise} min`} 
              color="bg-emerald-500" 
              onEdit={() => openEditor('exercise')} 
            />
            <StatCard 
              icon={ShieldCheck} 
              label="Pet Status" 
              value={petStatus} 
              color="bg-amber-500" 
              onEdit={() => openEditor('status')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-50 p-10 hover:shadow-xl transition-all duration-700">
              <div className="flex items-center justify-between mb-10">
                <h4 className="font-black text-2xl text-slate-900 flex items-center gap-4">
                  <div className="p-3 bg-theme-light rounded-2xl"><Activity size={20} className="text-theme" /></div>
                  Guardian Analytics
                </h4>
                <Link to={AppRoutes.PET_PROFILE} className="text-[10px] font-black text-theme uppercase tracking-widest hover:underline">Full Registry</Link>
              </div>
              
              <button 
                onClick={() => setShowLogOptions(true)}
                className="w-full h-80 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center group cursor-pointer hover:bg-white hover:border-theme/20 transition-all duration-500"
              >
                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Plus size={32} className="text-slate-200 group-hover:text-theme" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Daily Observations</p>
              </button>
            </div>

            {/* Routine Section */}
            <div className={`rounded-[3.5rem] p-10 flex flex-col transition-all duration-1000 shadow-2xl ${isDayComplete ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border border-slate-50 shadow-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-10">
                <h4 className={`font-black text-2xl tracking-tight ${isDayComplete ? 'text-white' : 'text-slate-900'}`}>Routine</h4>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isDayComplete ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                  {isDayComplete ? 'Optimized' : 'Live Check'}
                </div>
              </div>
              
              {isDayComplete ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-700">
                  <div className="w-28 h-28 bg-white/10 rounded-[3rem] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                    <Trophy size={56} className="text-white" />
                  </div>
                  <div>
                    <h5 className="text-3xl font-black mb-3 tracking-tight">Full Sync Complete</h5>
                    <p className="text-emerald-50/70 font-medium leading-relaxed">
                      All care protocols for {activePet?.name} have been executed.
                    </p>
                  </div>
                  <div className="w-full bg-black/10 rounded-3xl p-6 text-center">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Next Phase</span>
                    <p className="font-bold text-sm mt-1">Tomorrow 07:00 AM</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {STAT_ROUTINE.map((item) => {
                    const status = getTaskStatus(item);
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all duration-500 ${
                          status === 'active' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.03]' 
                          : status === 'done'
                          ? 'bg-slate-50 border-transparent opacity-40'
                          : 'bg-white border-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          status === 'active' ? 'bg-theme text-white' : 
                          status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'
                        }`}>
                          {status === 'done' ? <CheckCircle2 size={18} /> : 
                          status === 'active' ? <Zap size={18} className="animate-pulse" /> : <Clock size={18} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-xs truncate uppercase tracking-widest ${status === 'done' ? 'line-through opacity-50' : ''}`}>
                            {item.task}
                          </p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60`}>
                            {item.timeLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Empty State Placeholder */
        <div className="bg-white rounded-[4rem] p-12 md:p-20 text-center border border-slate-100 shadow-sm animate-in zoom-in-95 duration-700">
          <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner group">
            <Dog size={64} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">No Companions Registered</h3>
          <p className="text-slate-500 font-medium mb-12 max-w-lg mx-auto text-lg leading-relaxed">
            Your guardian dashboard will activate once you've registered a pet. Track health, manage routines, and get AI insights for your companions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={AppRoutes.PET_PROFILE} 
              className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 group"
            >
              <Plus size={20} /> Register Your First Pet
            </Link>
            <Link 
              to={AppRoutes.AI_ASSISTANT} 
              className="flex items-center gap-3 bg-white border border-slate-100 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Sparkles size={18} className="text-theme" /> Consult AI Specialist
            </Link>
          </div>
        </div>
      )}

      {/* Log Options Modal */}
      {showLogOptions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Log Entry</h3>
                <p className="text-slate-400 font-medium text-xs">Select data point to update</p>
              </div>
              <button onClick={() => setShowLogOptions(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => openEditor('weight')} className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-theme hover:text-white rounded-[1.5rem] transition-all group">
                <div className="p-3 bg-white text-slate-400 rounded-xl group-hover:text-theme"><Scale size={20} /></div>
                <span className="font-black text-sm uppercase tracking-widest">Log Weight</span>
              </button>
              <button onClick={() => openEditor('exercise')} className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-theme hover:text-white rounded-[1.5rem] transition-all group">
                <div className="p-3 bg-white text-slate-400 rounded-xl group-hover:text-theme"><Dumbbell size={20} /></div>
                <span className="font-black text-sm uppercase tracking-widest">Log Exercise</span>
              </button>
              <button onClick={() => openEditor('appointments')} className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-theme hover:text-white rounded-[1.5rem] transition-all group">
                <div className="p-3 bg-white text-slate-400 rounded-xl group-hover:text-theme"><Calendar size={20} /></div>
                <span className="font-black text-sm uppercase tracking-widest">Add Appointment</span>
              </button>
              <button onClick={() => openEditor('status')} className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-theme hover:text-white rounded-[1.5rem] transition-all group">
                <div className="p-3 bg-white text-slate-400 rounded-xl group-hover:text-theme"><Stethoscope size={20} /></div>
                <span className="font-black text-sm uppercase tracking-widest">Update Health Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {editingStat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quick Update</h3>
                    <p className="text-slate-400 font-medium text-xs">Update {activePet?.name || 'companion'} stats</p>
                 </div>
                 <button onClick={() => setEditingStat(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                    {editingStat === 'weight' ? 'Current Weight (KG)' : 
                     editingStat === 'exercise' ? 'Daily Exercise (Minutes)' : 
                     editingStat === 'status' ? 'Companion Health Status' : 'Next Appointment'}
                 </label>
                 {editingStat === 'status' ? (
                   <select 
                     value={editValue} 
                     onChange={(e) => setEditValue(e.target.value)}
                     className="w-full p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:ring-4 focus:ring-theme/10 focus:bg-white transition-all font-bold text-lg appearance-none"
                   >
                     <option value="Active">Active</option>
                     <option value="Resting">Resting</option>
                     <option value="Recovering">Recovering</option>
                     <option value="Sleepy">Sleepy</option>
                     <option value="Energetic">Energetic</option>
                   </select>
                 ) : (
                   <input 
                      autoFocus
                      type={editingStat === 'weight' || editingStat === 'exercise' ? 'text' : 'text'}
                      inputMode={editingStat === 'weight' ? 'decimal' : editingStat === 'exercise' ? 'numeric' : 'text'}
                      value={editValue}
                      onChange={handleInputChange}
                      placeholder={editingStat === 'weight' ? 'e.g. 12.5' : editingStat === 'exercise' ? 'e.g. 45' : 'e.g. Grooming 2pm'}
                      className="w-full p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 outline-none focus:ring-4 focus:ring-theme/10 focus:bg-white transition-all font-bold text-lg"
                   />
                 )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditingStat(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Discard</button>
                <button 
                  onClick={handleUpdateStat}
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black shadow-xl transition-all active:scale-95"
                >
                  <Save size={18} /> Update Status
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Home;