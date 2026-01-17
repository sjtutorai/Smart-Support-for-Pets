import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById, getPetsByOwnerId, deletePet } from '../services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Camera, CheckCircle2, Bird, Fish, Thermometer,  
  Trash2, Stethoscope, Brain, Wand2, Scan, X, Syringe, TrendingUp, Loader2, Palette, Sparkles, Bug, Droplets, AlertTriangle
} from 'lucide-react';
import { PetProfile, WeightRecord, VaccinationRecord } from '../types';

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Bird: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure', 'Lovebird', 'Cockatoo'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Rodent: ['Hamster', 'Guinea Pig', 'Fancy Rat', 'Gerbil', 'Chinchilla'],
  Reptile: ['Leopard Gecko', 'Bearded Dragon', 'Ball Python', 'Corn Snake', 'Russian Tortoise'],
  Amphibian: ['Axolotl', 'Pacman Frog', 'African Clawed Frog', 'Fire-Bellied Toad', 'Tiger Salamander'],
  Insect: ['Tarantula', 'Praying Mantis', 'Stick Insect', 'Hissing Cockroach', 'Ant Colony'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Rodent'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Bird'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Fish'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Reptile'] },
  { id: 'amphibian', name: 'Amphibians', icon: Droplets, species: ['Amphibian'] },
  { id: 'insect', name: 'Insects/Arthropods', icon: Bug, species: ['Insect'] },
  { id: 'other', name: 'Other', icon: Sparkles, species: ['Other'] }
];

const calculateAge = (birthday: string) => {
  if (!birthday) return { years: 0, months: 0 };
  const birthDate = new Date(birthday);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState<'vaccine' | 'weight' | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const initialPetState: Partial<PetProfile> = { 
    name: '', breed: '', birthday: '', bio: '', species: 'Dog', 
    petSpecies: 'Mammals', weightHistory: [], vaccinations: [] 
  };
  
  const [newPet, setNewPet] = useState<Partial<PetProfile>>(initialPetState);
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPets = async () => {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        const firestorePets = await getPetsByOwnerId(user.uid);
        setPets(firestorePets);
        if (firestorePets.length > 0) setSelectedPet(firestorePets[0]);
        localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(firestorePets));
      } catch (e) {
        const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
        if (saved) setPets(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPets();
  }, [user?.uid]);

  const savePet = async (pet: PetProfile) => {
    await syncPetToDb(pet);
    const updated = await getPetsByOwnerId(user!.uid);
    setPets(updated);
    localStorage.setItem(`ssp_pets_${user!.uid}`, JSON.stringify(updated));
    return updated;
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = `SSP-${Date.now()}`;
    const { years, months } = calculateAge(newPet.birthday || '');
    const completePet: PetProfile = { 
        ...newPet as PetProfile, 
        id, ownerId: user.uid, ownerName: user.displayName || 'Parent', 
        ageYears: String(years), ageMonths: String(months), 
        weightHistory: [], vaccinations: [], isPublic: false,
        lowercaseName: newPet.name?.toLowerCase() || ''
    };
    await savePet(completePet);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    
    // Snappy auto-close and state reset
    setTimeout(() => { 
      setIsAdding(false); 
      setSaveSuccess(false); 
      setStep(1); 
      setNewPet(initialPetState);
    }, 1200);
  };

  const handleDeletePet = async () => {
    if (!selectedPet || !user) return;
    
    const confirmMessage = `Are you sure you want to remove ${selectedPet.name} from the registry? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      await deletePet(selectedPet.id);
      const updated = await getPetsByOwnerId(user.uid);
      setPets(updated);
      localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(updated));
      
      addNotification('Registry Updated', `${selectedPet.name}'s profile has been removed.`, 'info');
      
      // Select next pet or null
      if (updated.length > 0) setSelectedPet(updated[0]);
      else setSelectedPet(null);
      
    } catch (err) {
      addNotification('Registry Error', 'Failed to remove companion profile.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    let updatedPet = { ...selectedPet };
    if (isAddingRecord === 'vaccine') updatedPet.vaccinations = [...(updatedPet.vaccinations || []), { name: newRecord.name, date: newRecord.date, nextDueDate: newRecord.nextDueDate }];
    else updatedPet.weightHistory = [...(updatedPet.weightHistory || []), { date: newRecord.date, weight: parseFloat(newRecord.weight) }];
    await savePet(updatedPet);
    setSelectedPet(updatedPet);
    setIsAddingRecord(null);
    setNewRecord({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  };

  const generateAIAvatar = async (base64Source?: string) => {
    if (!selectedPet) return;
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A cinematic, realistic 4K portrait of a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name} (${selectedPet.petSpecies}).`;
      const contents: any = { parts: [{ text: prompt }] };
      if (base64Source) contents.parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents, config: { imageConfig: { aspectRatio: "1:1" } } });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const updatedPet = { ...selectedPet, avatarUrl: `data:image/png;base64,${part.inlineData.data}` };
          await savePet(updatedPet);
          setSelectedPet(updatedPet);
          break;
        }
      }
    } catch (err) { addNotification('AI Studio', 'Avatar generation failed.', 'error'); } 
    finally { setIsGeneratingAvatar(false); }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-theme" size={40} /></div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Companion Registry</h2>
          <p className="text-slate-500 font-medium text-sm">Manage profiles and wellness records for your pets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-2 px-6 py-3.5 bg-theme text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover transition-all shadow-xl active:scale-95">
            <Plus size={18} /> Register Companion
          </button>
        </div>
      </div>

      {/* Selector Scroll */}
      <div className="gap-3 overflow-x-auto pb-4 flex scroll-hide">
        {pets.map(p => (
          <button key={p.id} onClick={() => { setSelectedPet(p); setIsAdding(false); }} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all shrink-0 ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme' : 'bg-white border-transparent hover:border-slate-100'}`}>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} className="text-slate-300" />}
            </div>
            <span className={`font-black text-[10px] uppercase tracking-widest ${selectedPet?.id === p.id ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-300">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white rounded-[2.5rem] animate-in fade-in"><CheckCircle2 size={48} className="animate-bounce"/><h3 className="text-2xl font-black mt-4">Companion Registered</h3><p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Syncing Intelligence...</p></div>}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black">Step {step}: {step === 1 ? 'Select Domain' : 'Details'}</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={20} /></button>
          </div>
          {step === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-8 rounded-3xl bg-slate-50 hover:bg-theme-light hover:text-theme flex flex-col items-center gap-4 group transition-all text-slate-400">
                  <cat.icon size={32} />
                  <span className="font-black text-[9px] uppercase tracking-widest">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border border-slate-50 focus:bg-white focus:ring-4 ring-theme/5 outline-none transition-all" placeholder="Companion's Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Species</label>
                <select value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm border border-slate-50 outline-none focus:bg-white transition-all">
                  {selectedCategory?.species.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birth Date</label>
                <input type="date" required value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm border border-slate-50 outline-none focus:bg-white transition-all" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 mt-4">Complete Registration</button>
            </form>
          )}
        </div>
      ) : selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl text-center space-y-8 relative overflow-hidden group">
              <div className="w-52 h-52 rounded-[3.5rem] overflow-hidden mx-auto shadow-2xl relative border-4 border-white group">
                {selectedPet.avatarUrl ? <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Dog size={64} /></div>}
                {isGeneratingAvatar && <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center"><Loader2 size={32} className="animate-spin text-theme" /></div>}
                <button onClick={() => generateAIAvatar()} className="absolute bottom-4 right-4 p-3 bg-slate-900 text-theme rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"><Wand2 size={20}/></button>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                <p className="text-[10px] font-black text-theme uppercase tracking-[0.2em] mt-2">{selectedPet.breed} · {selectedPet.petSpecies}</p>
              </div>

              {/* Management Actions */}
              <div className="pt-8 border-t border-slate-50">
                <button 
                  onClick={handleDeletePet} 
                  disabled={isDeleting}
                  className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />} Remove Profile
                </button>
              </div>
            </div>

            {/* Basic Info Pill */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={64} /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-theme mb-2">Age Context</h4>
                <p className="text-2xl font-black">{selectedPet.ageYears}y {selectedPet.ageMonths}m</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Born {selectedPet.birthday}</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-sm">
               <div className="flex items-center justify-between mb-10">
                 <div>
                    <h4 className="font-black text-2xl tracking-tight text-slate-900">Health Intelligence</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Bio-Security & Prevention logs</p>
                 </div>
                 <button onClick={() => setIsAddingRecord('vaccine')} className="px-6 py-3 bg-theme text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-theme/10 hover:bg-theme-hover active:scale-95">+ Add Record</button>
               </div>
               
               <div className="space-y-4">
                  {selectedPet.vaccinations.length > 0 ? selectedPet.vaccinations.map((v, i) => (
                    <div key={i} className="group p-5 bg-slate-50 rounded-[1.75rem] flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-theme shadow-sm group-hover:scale-110 transition-transform"><Syringe size={18} /></div>
                        <div><p className="font-black text-slate-800 text-sm">{v.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Administered: {v.date}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-theme uppercase tracking-widest">Next Phase Due</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{v.nextDueDate}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <AlertTriangle size={32} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No medical records indexed</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Weight History - Visualized */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <h4 className="font-black text-2xl tracking-tight text-slate-900">Growth Vitals</h4>
                    <button onClick={() => setIsAddingRecord('weight')} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all"><TrendingUp size={20}/></button>
                </div>
                <div className="space-y-4">
                    {selectedPet.weightHistory.map((w, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{w.date}</span>
                            <span className="text-lg font-black text-slate-800">{w.weight} <span className="text-[10px] text-slate-300 uppercase ml-0.5">kg</span></span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-100">
            <Dog size={64} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Your Registry is Empty</h3>
          <p className="text-slate-400 font-medium text-sm mt-2 max-w-xs mx-auto">Start building biological profiles for your companions to unlock care intelligence.</p>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="mt-10 bg-theme text-white px-12 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-theme/20 hover:bg-theme-hover active:scale-95 transition-all">
            Begin First Registration
          </button>
        </div>
      )}

      {/* Record Addition Modal */}
      {isAddingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black tracking-tight">{isAddingRecord === 'vaccine' ? 'New Health Log' : 'Update Vitals'}</h3>
                    <button onClick={() => setIsAddingRecord(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddRecord} className="space-y-6">
                    {isAddingRecord === 'vaccine' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observation / vaccine</label>
                                <input required value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="e.g. Rabies, Checkup" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                                    <input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Next Phase</label>
                                    <input type="date" value={newRecord.nextDueDate} onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight (kg)</label>
                            <input type="number" step="0.1" required value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="e.g. 12.5" />
                        </div>
                    )}
                    <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Store Analytics</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default PetProfilePage;