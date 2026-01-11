
import React, { useEffect, useState } from 'react';
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
  CircleDot 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from "react-router-dom";
import { AppRoutes } from '../types';

interface RoutineTask {
  id: string;
  task: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timeLabel: string;
}

const STAT_ROUTINE: RoutineTask[] = [
  { id: '1', task: 'Morning Walk', startHour: 7, endHour: 8, timeLabel: '07:00 - 08:00' },
  { id: '2', task: 'Breakfast', startHour: 8, endHour: 9, timeLabel: '08:30 - 09:00' },
  { id: '3', task: 'Mid-day Play', startHour: 12, endHour: 13, timeLabel: '12:00 - 13:00' },
  { id: '4', task: 'Dinner Time', startHour: 18, endHour: 19, timeLabel: '18:00 - 19:00' },
  { id: '5', task: 'Night Walk', startHour: 21, endHour: 22, timeLabel: '21:00 - 22:00' },
];

const StatCard: React.FC<{ icon: React.ElementType, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
    <div className={`p-3.5 rounded-2xl inline-block mb-4 ${color} shadow-sm`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
  </div>
);

const Home: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  // Update time every minute to keep routine in sync
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedPet = localStorage.getItem(`pet_${user?.uid}`);
    if (savedPet) {
      setPet(JSON.parse(savedPet));
    } else {
      setPet(null);
    }
  }, [user]);

  const firstName = user?.displayName?.split(' ')[0] || 'Pet Lover';
  const hasPet = !!pet;

  const getTaskStatus = (task: RoutineTask) => {
    if (currentHour >= task.endHour) return 'done';
    if (currentHour >= task.startHour && currentHour < task.endHour) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Hello, {firstName}! 👋
          </h2>
          <p className="text-slate-500 mt-2 font-medium text-lg">
            {hasPet ? `Here is the latest data for ${pet.name}.` : "Let's welcome your pet to the family."}
          </p>
        </div>
        {hasPet && (
          <Link 
            to={AppRoutes.CREATE_POST}
            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            <Plus size={20} />
            Post Update
          </Link>
        )}
      </div>

      {!hasPet ? (
        <div className="bg-indigo-600 rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-indigo-100">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-[100px]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16 text-center lg:text-left">
            <div className="max-w-2xl">
              <div className="inline-flex p-5 bg-white/20 rounded-[2rem] mb-10 backdrop-blur-xl border border-white/30 shadow-2xl">
                <PawPrint className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-5xl font-black mb-6 leading-[1.1] tracking-tighter">Your pet's health, simplified by AI.</h3>
              <p className="text-indigo-100 text-xl mb-12 leading-relaxed font-medium">
                Register your companion today to unlock custom health tracking, dietary recommendations, and smart behavior monitoring.
              </p>
              <Link 
                to={AppRoutes.PET_PROFILE}
                className="inline-flex items-center gap-4 bg-white text-indigo-600 px-12 py-6 rounded-[2.5rem] font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 group"
              >
                Register Now
                <ChevronRight size={24} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
            <div className="hidden lg:block relative">
               <div className="w-80 h-80 bg-white/10 rounded-[5rem] rotate-[15deg] flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-2xl group cursor-pointer hover:rotate-0 transition-all duration-700">
                  <Dog size={160} className="text-white/30 -rotate-[15deg] group-hover:rotate-0 transition-all duration-700" />
               </div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/30 rounded-full blur-[60px] animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard icon={Heart} label="Vitals Score" value="--" color="bg-rose-500" />
            <StatCard icon={Calendar} label="Appointments" value="None" color="bg-indigo-500" />
            <StatCard icon={Activity} label="Exercise" value="0 min" color="bg-emerald-500" />
            <StatCard icon={ShieldCheck} label="Safety Status" value="Secured" color="bg-amber-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 hover:shadow-2xl transition-all duration-500">
              <h4 className="font-black text-2xl text-slate-800 mb-8 flex items-center gap-3">
                <Activity className="text-indigo-600 w-6 h-6" />
                Active Monitoring
              </h4>
              <Link 
                to={AppRoutes.PET_PROFILE}
                className="block h-80 bg-slate-50/50 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 group cursor-pointer hover:border-indigo-300 hover:bg-white transition-all active:scale-[0.98] outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-xl transition-all">
                  <Plus className="text-slate-300 w-12 h-12 group-hover:text-indigo-500" />
                </div>
                <p className="text-slate-400 font-black text-sm uppercase tracking-[0.2em]">Start Health Log</p>
                <p className="text-slate-300 text-xs mt-3 font-medium italic">Collect enough data for AI insights</p>
              </Link>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-2xl text-slate-800 tracking-tight">Care Routine</h4>
                <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={12} /> Live
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                {STAT_ROUTINE.map((item) => {
                  const status = getTaskStatus(item);
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                        status === 'active' 
                        ? 'bg-indigo-50 border-indigo-200 shadow-md scale-[1.02]' 
                        : status === 'done'
                        ? 'bg-slate-50 border-transparent opacity-60'
                        : 'bg-white border-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        status === 'active' ? 'bg-indigo-600 text-white animate-pulse' : 
                        status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {status === 'done' ? <CheckCircle2 size={20} /> : 
                         status === 'active' ? <CircleDot size={20} /> : <Clock size={20} />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className={`font-black text-sm transition-all ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {item.task}
                          </span>
                          {status === 'active' && (
                            <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${status === 'active' ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {item.timeLabel}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Reset: 00:00 AM</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
