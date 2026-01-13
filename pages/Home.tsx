
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
  PartyPopper,
  Sparkles,
  ChevronDown,
  Edit2,
  X,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Link } from "react-router-dom";
import { AppRoutes, PetProfile } from '../types';

interface RoutineTask {
  id: string;
  task: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timeLabel: string;
}

const STAT_ROUTINE: RoutineTask[] = [
  { id: 'morning_walk', task: 'Morning Walk', startHour: 7, endHour: 8, timeLabel: '07:00 - 08:00' },
  { id: 'breakfast', task: 'Breakfast', startHour: 8, endHour: 9, timeLabel: '08:30 - 09:00' },
  { id: 'midday_play', task: 'Mid-day Play', startHour: 12, endHour: 13, timeLabel: '12:00 - 13:00' },
  { id: 'dinner', task: 'Dinner Time', startHour: 18, endHour: 19, timeLabel: '18:00 - 19:00' },
  { id: 'night_walk', task: 'Night Walk', startHour: 21, endHour: 22, timeLabel: '21:00 - 22:00' },
];

const StatCard: React.FC<{ 
  icon: React.ElementType, 
  label: string, 
  value: string, 
  color: string,
  onEdit?: () => void 
}> = ({ icon: Icon, label, value, color, onEdit }) => (
  <div className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative">
    {onEdit && (
      <button 
        onClick={onEdit}
        className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-xl opacity-0 group-hover:opacity-100 hover:text-theme hover:bg-theme-light transition-all"
      >
        <Edit2 size={14} />
      </button>
    )}
    <div className={`p-3.5 rounded-2xl inline-block mb-4 ${color} shadow-sm transition-theme`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
  </div>
);

const Home: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [activePet, setActivePet] = useState<PetProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Dashboard Editable Stats
  const [appointments, setAppointments] = useState(() => localStorage.getItem(`ssp_appointments_${user?.uid}`) || 'None');
  const [exercise, setExercise] = useState(() => localStorage.getItem(`ssp_exercise_${user?.uid}`) || '0');
  const [editingStat, setEditingStat] = useState<'appointments' | 'exercise' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const todayKey = currentTime.toISOString().split('T')[0];

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPets(parsed);
      if (parsed.length > 0) setActivePet(parsed[0]);
    }
  }, [user]);

  useEffect(() => {
    if (!activePet) return;

    STAT_ROUTINE.forEach(task => {
      if (currentHour === task.startHour) {
        const notificationKey = `notified_${task.id}_${todayKey}_${activePet.id}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (!alreadyNotified) {
          addNotification(
            `Time for ${task.task}!`, 
            `Hey! It's ${task.timeLabel}. Time to take care of ${activePet.name}.`,
            'info'
          );
          localStorage.setItem(notificationKey, 'true');
        }
      }
    });
  }, [currentHour, todayKey, activePet, addNotification]);

  const saveStat = () => {
    if (editingStat === 'appointments') {
      setAppointments(editValue || 'None');
      localStorage.setItem(`ssp_appointments_${user?.uid}`, editValue || 'None');
    } else if (editingStat === 'exercise') {
      setExercise(editValue || '0');
      localStorage.setItem(`ssp_exercise_${user?.uid}`, editValue || '0');
    }
    setEditingStat(null);
    setEditValue('');
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Pet Lover';
  const hasPets = pets.length > 0;

  const getTaskStatus = (task: RoutineTask) => {
    if (currentHour >= task.endHour) return 'done';
    if (currentHour >= task.startHour && currentHour < task.endHour) return 'active';
    return 'pending';
  };

  const isDayComplete = useMemo(() => {
    const lastTask = STAT_ROUTINE[STAT_ROUTINE.length - 1];
    return currentHour >= lastTask.endHour;
  }, [currentHour]);

  const formattedIST = currentTime.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Hello, {firstName}! 👋
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
              {formattedIST} (IST)
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          {hasPets && (
            <div className="relative group">
              <button className="flex items-center gap-3 bg-white border border-slate-200 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-100">
                  {activePet?.avatarUrl ? (
                    <img src={activePet.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-4 h-4 m-1 text-slate-300" />
                  )}
                </div>
                <span>{activePet?.name}</span>
                <ChevronDown size={16} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 p-2 space-y-1">
                {pets.map(p => (
                  <button key={p.id} onClick={() => setActivePet(p)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all font-bold text-sm text-slate-700">
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center">
                        {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} className="text-slate-300" />}
                    </div>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Link 
            to={AppRoutes.CREATE_POST}
            className="inline-flex items-center gap-3 bg-theme text-white px-8 py-4 rounded-2xl font-black hover:bg-theme-hover transition-all shadow-xl shadow-theme/10 active:scale-95 transition-theme"
          >
            <Plus size={20} /> Post Moment
          </Link>
        </div>
      </div>

      {!hasPets ? (
        <div className="bg-theme rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-theme/10 transition-theme">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-[100px]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16 text-center lg:text-left">
            <div className="max-w-2xl">
              <div className="inline-flex p-5 bg-white/20 rounded-[2rem] mb-10 backdrop-blur-xl border border-white/30 shadow-2xl">
                <PawPrint className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-5xl font-black mb-6 leading-[1.1] tracking-tighter">Your first pet profile is ready for creation.</h3>
              <p className="text-white/80 text-xl mb-12 leading-relaxed font-medium">
                Register your companions today to unlock custom health tracking, unique SSP-ID QR codes, and smart behavior monitoring.
              </p>
              <Link 
                to={AppRoutes.PET_PROFILE}
                className="inline-flex items-center gap-4 bg-white text-theme px-12 py-6 rounded-[2.5rem] font-black text-lg hover:bg-slate-50 transition-all shadow-2xl active:scale-95 group transition-theme"
              >
                Register Now
                <ChevronRight size={24} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
            <div className="hidden lg:block relative">
               <div className="w-80 h-80 bg-white/10 rounded-[5rem] rotate-[15deg] flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-2xl group cursor-pointer hover:rotate-0 transition-all duration-700">
                  <Dog size={160} className="text-white/30 -rotate-[15deg] group-hover:rotate-0 transition-all duration-700" />
               </div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-[60px] animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard icon={Heart} label="Recent Weight" value={activePet?.weightHistory?.[activePet.weightHistory.length - 1]?.weight ? `${activePet.weightHistory[activePet.weightHistory.length - 1].weight} kg` : '--'} color="bg-rose-500" />
            
            <StatCard 
              icon={Calendar} 
              label="Appointments" 
              value={appointments} 
              color="bg-indigo-500" 
              onEdit={() => { setEditingStat('appointments'); setEditValue(appointments); }} 
            />
            
            <StatCard 
              icon={Activity} 
              label="Exercise Today" 
              value={`${exercise} min`} 
              color="bg-emerald-500" 
              onEdit={() => { setEditingStat('exercise'); setEditValue(exercise); }} 
            />
            
            <StatCard icon={ShieldCheck} label="Pet Status" value="Active" color="bg-amber-500" />
          </div>

          {/* Inline Edit Overlay Modal */}
          {editingStat && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">Log {editingStat === 'exercise' ? 'Activity' : 'Appointments'}</h3>
                     <button onClick={() => setEditingStat(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        {editingStat === 'exercise' ? 'Minutes Spent Today' : 'Upcoming Event / Count'}
                     </label>
                     <input 
                        autoFocus
                        type={editingStat === 'exercise' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={editingStat === 'exercise' ? 'e.g. 45' : 'e.g. Vet Visit 3pm'}
                        className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-theme/10 focus:bg-white transition-all font-bold text-lg"
                     />
                  </div>
                  <button 
                    onClick={saveStat}
                    className="w-full py-5 bg-theme text-white rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-theme-hover shadow-xl shadow-theme/10 transition-all active:scale-95"
                  >
                    <Save size={20} /> Update Stats
                  </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 hover:shadow-2xl transition-all duration-500">
              <h4 className="font-black text-2xl text-slate-800 mb-8 flex items-center gap-3">
                <Activity className="text-theme w-6 h-6" />
                Monitoring: {activePet?.name}
              </h4>
              <Link 
                to={AppRoutes.PET_PROFILE}
                className="block h-80 bg-slate-50/50 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 group cursor-pointer hover:border-theme/40 hover:bg-white transition-all active:scale-[0.98] outline-none focus:ring-4 focus:ring-theme/5 overflow-hidden"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm group-hover:scale-110 group-hover:shadow-xl transition-all">
                    <Plus className="text-slate-300 w-12 h-12 group-hover:text-theme" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-black text-sm uppercase tracking-[0.2em]">Update {activePet?.name}'s Record</p>
                    <p className="text-slate-300 text-xs mt-3 font-medium italic">Manage all companions in Pet Profile</p>
                  </div>
                </div>
              </Link>
            </div>

            <div className={`rounded-[3rem] shadow-sm border p-10 flex flex-col transition-all duration-700 ${isDayComplete ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-8">
                <h4 className={`font-black text-2xl tracking-tight ${isDayComplete ? 'text-white' : 'text-slate-800'}`}>
                  Care Routine
                </h4>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDayComplete ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {isDayComplete ? <Sparkles size={12} /> : <Clock size={12} />} {isDayComplete ? 'Done' : 'Live'}
                </div>
              </div>
              
              {isDayComplete ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/30">
                    <Trophy size={48} className="text-white" />
                  </div>
                  <div>
                    <h5 className="text-3xl font-black mb-2 tracking-tight">Great Job!</h5>
                    <p className="text-emerald-50 font-medium leading-relaxed">
                      All tasks for {activePet?.name} are completed today. See you tomorrow at 07:00 AM!
                    </p>
                  </div>
                  <div className="w-full bg-black/10 rounded-3xl p-6 border border-white/10">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Last Updated (IST)</p>
                    <p className="font-bold text-sm">{currentTime.toLocaleTimeString('en-IN')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {STAT_ROUTINE.map((item) => {
                    const status = getTaskStatus(item);
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                          status === 'active' 
                          ? 'bg-theme-light border-theme shadow-md scale-[1.02]' 
                          : status === 'done'
                          ? 'bg-slate-50 border-transparent opacity-60'
                          : 'bg-white border-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          status === 'active' ? 'bg-theme text-white animate-pulse' : 
                          status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {status === 'done' ? <CheckCircle2 size={20} /> : 
                           status === 'active' ? <CircleDot size={20} /> : <Clock size={20} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`font-black text-sm truncate transition-all ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {item.task}
                            </span>
                            {status === 'active' && (
                              <span className="text-[8px] font-black bg-theme text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">Active</span>
                            )}
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${status === 'active' ? 'text-theme' : 'text-slate-400'}`}>
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
      )}
    </div>
  );
};

export default Home;
