
import React, { useState, useEffect } from 'react';
/* Fix: Standardized named imports from react-router-dom using double quotes */
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from './components/Layout';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import PetCare from './pages/PetCare';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Community from './pages/Community';
import { AppRoutes } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  Dog, Plus, PawPrint, Weight, Palette, Fingerprint, 
  AlertCircle, Camera, Check, ChevronRight, Cat, Bird, Rabbit, 
  Trash2, Edit3, ArrowLeft, Stethoscope, Search, Star, MessageCircle,
  Heart, Fish, Bug, Thermometer, Droplets
} from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Mouse: ['Fancy Mouse', 'Spiny Mouse'],
  Rat: ['Fancy Rat', 'Dumbo Rat', 'Hairless Rat'],
  Ferret: ['Sable', 'Albino', 'Silver Mitt'],
  Horse: ['Thoroughbred', 'Quarter Horse', 'Arabian', 'Appaloosa'],
  Goat: ['Nigerian Dwarf', 'Pygmy Goat', 'Alpine'],
  Pig: ['Mini Pig', 'Pot-bellied Pig', 'Kunekune'],
  Parrot: ['African Grey', 'Amazon Parrot', 'Macaw', 'Cockatoo'],
  Parakeet: ['Budgie', 'Monk Parakeet', 'Indian Ringneck'],
  Cockatiel: ['Grey', 'Lutino', 'Pied', 'Pearl'],
  Lovebird: ['Peach-faced', 'Fischer\'s Lovebird', 'Masked Lovebird'],
  Canary: ['Yellow Canary', 'Red Factor Canary', 'Gloster Canary'],
  Finch: ['Zebra Finch', 'Society Finch', 'Gouldian Finch'],
  Pigeon: ['Homing Pigeon', 'Fantail Pigeon', 'Racing Homer'],
  Goldfish: ['Comet', 'Fantail', 'Oranda', 'Shubunkin'],
  'Betta Fish': ['Veiltail', 'Crowntail', 'Halfmoon'],
  Guppy: ['Fancy Guppy', 'Endler Guppy', 'Cobra Guppy'],
  Angelfish: ['Marble Angelfish', 'Silver Angelfish', 'Koi Angelfish'],
  Koi: ['Kohaku', 'Sanke', 'Showa'],
  Tetra: ['Neon Tetra', 'Cardinal Tetra', 'Rummy Nose Tetra'],
  Turtle: ['Red-eared Slider', 'Painted Turtle', 'Box Turtle'],
  Tortoise: ['Sulcata Tortoise', 'Russian Tortoise', 'Hermann\'s Tortoise'],
  Lizard: ['Bearded Dragon', 'Iguana', 'Blue-tongued Skink'],
  Gecko: ['Leopard Gecko', 'Crested Gecko', 'Tokay Gecko'],
  Snake: ['Ball Python', 'Corn Snake', 'King Snake', 'Garter Snake'],
  Chameleon: ['Veiled Chameleon', 'Panther Chameleon', 'Jackson\'s Chameleon'],
  Frog: ['Tree Frog', 'Bullfrog', 'Pacman Frog'],
  Toad: ['Common Toad', 'Fire-bellied Toad', 'Cane Toad'],
  Salamander: ['Axolotl', 'Tiger Salamander', 'Fire Salamander'],
  Newt: ['Fire-bellied Newt', 'Eastern Newt', 'Ribbed Newt'],
  'Ant Farm': ['Harvester Ant', 'Carpenter Ant', 'Garden Ant'],
  'Stick Insect': ['Indian Stick Insect', 'Giant Prickly Stick Insect'],
  Tarantula: ['Mexican Red Knee', 'Rose Hair', 'Pink Toe'],
  Beetle: ['Hercules Beetle', 'Stag Beetle', 'Rhino Beetle'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Guinea Pig', 'Mouse', 'Rat', 'Ferret', 'Horse', 'Goat', 'Pig'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Parrot', 'Parakeet', 'Cockatiel', 'Lovebird', 'Canary', 'Finch', 'Pigeon'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Goldfish', 'Betta Fish', 'Guppy', 'Angelfish', 'Koi', 'Tetra'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Turtle', 'Tortoise', 'Lizard', 'Gecko', 'Snake', 'Chameleon'] },
  { id: 'amphibian', name: 'Amphibians', icon: Droplets, species: ['Frog', 'Toad', 'Salamander', 'Newt'] },
  { id: 'insect', name: 'Insects', icon: Bug, species: ['Ant Farm', 'Stick Insect', 'Tarantula', 'Beetle'] },
];

const HealthCheckupPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const filtered = [
    { id: 1, name: 'Itchy Skin / Allergies', treatment: 'Apoquel or Cytopoint injections' },
    { id: 2, name: 'Joint Pain / Arthritis', treatment: 'Librela injections' },
    { id: 3, name: 'Upset Stomach', treatment: 'Probiotics and plain rice diet' }
  ].filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Stethoscope className="text-indigo-600" /> Health Checkup
        </h2>
        <p className="text-slate-500 mt-2">Diagnose common issues and see how other pet parents treated them.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-4 text-slate-400" />
        <input type="text" placeholder="Search symptoms..." className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-6 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest px-2">Conditions</h3>
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelectedCondition(c)} className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedCondition?.id === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-300'}`}>
              <div className="font-black text-lg">{c.name}</div>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm min-h-[300px]">
          {selectedCondition ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h4 className="font-black text-2xl text-slate-900">{selectedCondition.name}</h4>
              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Recommended Treatment</div>
                <div className="text-indigo-900 font-bold">{selectedCondition.treatment}</div>
              </div>
            </div>
          ) : <p className="text-slate-400 flex items-center justify-center h-full">Select a condition to see details.</p>}
        </div>
      </div>
    </div>
  );
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState({ name: '', breed: '', ageYears: '0', ageMonths: '0', species: 'Dog', healthNotes: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ageError, setAgeError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) setPet(JSON.parse(saved));
  }, [user]);

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    setAgeError(false);

    // Validation: Impossible age check
    if (newPet.ageYears === '0' && newPet.ageMonths === '0') {
      setAgeError(true);
      return;
    }

    const validatedPet = { ...newPet };
    localStorage.setItem(`pet_${user?.uid}`, JSON.stringify(validatedPet));
    setPet(validatedPet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  if (!pet && !isAdding) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="bg-indigo-50 w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><PawPrint className="w-16 h-16 text-indigo-600" /></div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Register Your Companion</h2>
        <p className="text-slate-500 mb-10 font-medium">Create a profile to unlock personalized AI support and tracking.</p>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold hover:bg-indigo-700 shadow-2xl transition-all active:scale-95">Add Profile</button>
      </div>
    );
  }

  if (isAdding) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="bg-white p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {saveSuccess && <div className="absolute inset-0 bg-indigo-600/95 flex flex-col items-center justify-center z-50 text-white"><Check size={48} className="mb-4" /><h3 className="text-2xl font-black">Saved Successfully!</h3></div>}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900">{step === 1 ? 'Choose Category' : step === 2 ? 'Select Species' : 'Complete Details'}</h2>
            {step > 1 && <button onClick={() => setStep(step - 1)} className="text-slate-400 font-bold flex items-center gap-1"><ArrowLeft size={16} /> Back</button>}
          </div>
          {step === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-6 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-indigo-500 hover:bg-white hover:shadow-xl transition-all flex flex-col items-center gap-4 group">
                  <cat.icon className="w-10 h-10 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-xs uppercase tracking-widest text-slate-600">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedCategory?.species.map((s: string) => (
                <button key={s} onClick={() => { setNewPet({ ...newPet, species: s, breed: BREED_DATA[s]?.[0] || 'Unknown' }); setStep(3); }} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-slate-700">{s}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pet Name</label>
                  <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. Luna" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Breed / Variety</label>
                  <select value={newPet.breed} onChange={e => setNewPet({ ...newPet, breed: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:ring-4 focus:ring-indigo-100">
                    {BREED_DATA[newPet.species]?.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Years Old</label>
                  <select value={newPet.ageYears} onChange={e => setNewPet({...newPet, ageYears: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:ring-4 focus:ring-indigo-100 outline-none">
                    {[...Array(26)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Months Old (0-11)</label>
                  <select value={newPet.ageMonths} onChange={e => setNewPet({...newPet, ageMonths: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:ring-4 focus:ring-indigo-100 outline-none">
                    {[...Array(12)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              {ageError && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake"><AlertCircle size={14} /> Your pet must be at least 1 month old to create a profile.</div>}
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2.5rem] font-bold text-lg hover:bg-indigo-700 shadow-xl active:scale-95 transition-all">Create Profile</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
        <div className="w-48 h-48 rounded-[4rem] bg-indigo-100 overflow-hidden shadow-2xl border-4 border-white"><img src={`https://picsum.photos/seed/${pet.name}/400`} className="w-full h-full object-cover" /></div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-6xl font-black text-slate-900 mb-3 tracking-tighter">{pet.name}</h2>
          <p className="text-slate-500 text-xl font-medium">{pet.breed} • {pet.ageYears} Years {pet.ageMonths} Months Old</p>
          <div className="flex gap-4 mt-8 justify-center md:justify-start">
            <button className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl transition-all">Edit Profile</button>
            <button onClick={() => { if(confirm("Delete profile?")) { localStorage.removeItem(`pet_${user?.uid}`); setPet(null); } }} className="px-8 py-3 border border-rose-100 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path={AppRoutes.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path={AppRoutes.AI_ASSISTANT} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path={AppRoutes.PET_CARE} element={<ProtectedRoute><PetCare /></ProtectedRoute>} />
      <Route path={AppRoutes.HEALTH_CHECKUP} element={<ProtectedRoute><HealthCheckupPage /></ProtectedRoute>} />
      <Route path={AppRoutes.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={AppRoutes.PET_PROFILE} element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
      <Route path={AppRoutes.CREATE_POST} element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
