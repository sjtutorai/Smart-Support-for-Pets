
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import PetCare from './pages/PetCare';
import Login from './pages/Login';
import Settings from './pages/Settings';
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

// Comprehensive Breed and Type Data
export const BREED_DATA: Record<string, string[]> = {
  // Mammals
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
  // Birds
  Parrot: ['African Grey', 'Amazon Parrot', 'Macaw', 'Cockatoo'],
  Parakeet: ['Budgie', 'Monk Parakeet', 'Indian Ringneck'],
  Cockatiel: ['Grey', 'Lutino', 'Pied', 'Pearl'],
  Lovebird: ['Peach-faced', 'Fischer\'s Lovebird', 'Masked Lovebird'],
  Canary: ['Yellow Canary', 'Red Factor Canary', 'Gloster Canary'],
  Finch: ['Zebra Finch', 'Society Finch', 'Gouldian Finch'],
  Pigeon: ['Homing Pigeon', 'Fantail Pigeon', 'Racing Homer'],
  // Fish
  Goldfish: ['Comet', 'Fantail', 'Oranda', 'Shubunkin'],
  'Betta Fish': ['Veiltail', 'Crowntail', 'Halfmoon'],
  Guppy: ['Fancy Guppy', 'Endler Guppy', 'Cobra Guppy'],
  Angelfish: ['Marble Angelfish', 'Silver Angelfish', 'Koi Angelfish'],
  Koi: ['Kohaku', 'Sanke', 'Showa'],
  Tetra: ['Neon Tetra', 'Cardinal Tetra', 'Rummy Nose Tetra'],
  // Reptiles
  Turtle: ['Red-eared Slider', 'Painted Turtle', 'Box Turtle'],
  Tortoise: ['Sulcata Tortoise', 'Russian Tortoise', 'Hermann\'s Tortoise'],
  Lizard: ['Bearded Dragon', 'Iguana', 'Blue-tongued Skink'],
  Gecko: ['Leopard Gecko', 'Crested Gecko', 'Tokay Gecko'],
  Snake: ['Ball Python', 'Corn Snake', 'King Snake', 'Garter Snake'],
  Chameleon: ['Veiled Chameleon', 'Panther Chameleon', 'Jackson\'s Chameleon'],
  // Amphibians
  Frog: ['Tree Frog', 'Bullfrog', 'Pacman Frog'],
  Toad: ['Common Toad', 'Fire-bellied Toad', 'Cane Toad'],
  Salamander: ['Axolotl', 'Tiger Salamander', 'Fire Salamander'],
  Newt: ['Fire-bellied Newt', 'Eastern Newt', 'Ribbed Newt'],
  // Insects
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

const HEALTH_CONDITIONS = [
  { 
    id: 1, 
    name: 'Itchy Skin / Allergies', 
    treatment: 'Apoquel or Cytopoint injections', 
    reviews: [
      { user: 'Sarah W.', rating: 5, text: 'Worked wonders for my Golden Retriever within 24 hours!' },
      { user: 'Mark K.', rating: 4, text: 'Expensive but definitely effective for seasonal allergies.' }
    ] 
  },
  { 
    id: 2, 
    name: 'Joint Pain / Arthritis', 
    treatment: 'Librela (monthly injection) or Glucosamine supplements', 
    reviews: [
      { user: 'Dave L.', rating: 5, text: 'My 12-year-old Lab is acting like a puppy again thanks to Librela!' }
    ] 
  },
  { 
    id: 3, 
    name: 'Upset Stomach', 
    treatment: 'Plain boiled chicken and rice + Probiotics', 
    reviews: [
      { user: 'Emma B.', rating: 5, text: 'The golden rule for every dog owner. Works every time.' }
    ] 
  }
];

const HealthCheckupPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });

  const filtered = HEALTH_CONDITIONS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Stethoscope className="text-indigo-600" />
          Health Checkup
        </h2>
        <p className="text-slate-500 mt-2">Diagnose common issues and see how other pet parents treated them.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search symptoms or conditions (e.g. Skin, Stomach)..."
          className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-6 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest px-2">Common Conditions</h3>
          {filtered.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCondition(c)}
              className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedCondition?.id === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-300'}`}
            >
              <div className="font-black text-lg">{c.name}</div>
              <div className={`text-sm mt-1 ${selectedCondition?.id === c.id ? 'text-indigo-100' : 'text-slate-400'}`}>See treatment & reviews</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
          {selectedCondition ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h4 className="font-black text-2xl text-slate-900">{selectedCondition.name}</h4>
                <div className="mt-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Recommended Treatment</div>
                  <div className="text-indigo-900 font-bold">{selectedCondition.treatment}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Community Reviews
                </h5>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedCondition.reviews.map((r: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-xs text-slate-700">{r.user}</span>
                        <div className="flex text-amber-400"><Star size={10} fill="currentColor" /></div>
                      </div>
                      <p className="text-sm text-slate-500 italic">"{r.text}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <textarea 
                  placeholder="Share your experience with this treatment..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={3}
                  value={newReview.text}
                  onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                />
                <button className="w-full mt-3 bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95">
                  Submit Review
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
              <Stethoscope className="w-16 h-16 text-slate-100" />
              <p className="text-slate-400 font-medium">Select a condition to see expert treatments and real parent reviews.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1); // 1: Category, 2: Species, 3: Details
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState({ 
    name: '', breed: '', ageYears: '0', ageMonths: '0', 
    gender: 'Male', species: 'Dog', healthNotes: '' 
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) setPet(JSON.parse(saved));
  }, [user]);

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`pet_${user?.uid}`, JSON.stringify(newPet));
    setPet(newPet);
    setSaveSuccess(true);
    setTimeout(() => {
      setIsAdding(false);
      setSaveSuccess(false);
      setStep(1);
    }, 1500);
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleSpeciesSelect = (s: string) => {
    setNewPet({ ...newPet, species: s, breed: BREED_DATA[s]?.[0] || 'Unknown' });
    setStep(3);
  };

  if (!pet && !isAdding) {
    return (
      <div className="max-w-2xl mx-auto py-12 md:py-24 text-center">
        <div className="bg-indigo-50 w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce-subtle">
          <PawPrint className="w-16 h-16 text-indigo-600" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Every Pet Deserves a Profile</h2>
        <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Join the family! Registration is now faster—just tell us about your pet's age and breed.
        </p>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-3 mx-auto active:scale-95"
        >
          <Plus size={24} />
          Register Your Pet
        </button>
      </div>
    );
  }

  if (isAdding) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {saveSuccess && (
             <div className="absolute inset-0 bg-indigo-600/95 flex flex-col items-center justify-center z-50">
                <div className="bg-white rounded-full p-4 mb-4 shadow-xl">
                  <Check className="text-indigo-600 w-12 h-12" />
                </div>
                <h3 className="text-white text-3xl font-black tracking-tight">Saved Successfully!</h3>
             </div>
          )}
          
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
               <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
                 <PawPrint className="text-white w-6 h-6" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {step === 1 ? 'Select Category' : step === 2 ? `Select ${selectedCategory?.name}` : 'Pet Details'}
               </h2>
             </div>
             {step > 1 && (
               <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-bold text-sm">
                 <ArrowLeft size={16} /> Back
               </button>
             )}
          </div>

          {step === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-right-4 duration-300">
              {PET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="p-6 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-500 hover:shadow-xl transition-all flex flex-col items-center gap-4 group"
                >
                  <cat.icon className="w-10 h-10 text-slate-400 group-hover:text-indigo-600" />
                  <span className="font-black text-xs text-slate-600 uppercase tracking-widest group-hover:text-indigo-600">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-in slide-in-from-right-4 duration-300">
              {selectedCategory?.species.map((s: string) => (
                <button
                  key={s}
                  onClick={() => handleSpeciesSelect(s)}
                  className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-lg transition-all text-left group"
                >
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700">{s}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pet's Name</label>
                  <input required value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="e.g. Luna" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{newPet.species} Variety/Breed</label>
                  <select 
                    required 
                    value={newPet.breed} 
                    onChange={e => setNewPet({...newPet, breed: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none appearance-none cursor-pointer"
                  >
                    {BREED_DATA[newPet.species]?.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Age</label>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold ml-1">Years</span>
                    <select value={newPet.ageYears} onChange={e => setNewPet({...newPet, ageYears: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none">
                      {[...Array(21)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold ml-1">Months</span>
                    <select value={newPet.ageMonths} onChange={e => setNewPet({...newPet, ageMonths: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none">
                      {[...Array(12)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[2.5rem] font-bold text-lg hover:bg-indigo-700 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  Save Profile
                  <Check size={20} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
        <div className="relative group">
          <div className="w-48 h-48 rounded-[4rem] bg-indigo-100 flex items-center justify-center overflow-hidden shadow-2xl transition-transform group-hover:rotate-3 duration-500">
            <img src={`https://picsum.photos/seed/${pet.name}/400`} alt={pet.name} className="w-full h-full object-cover" />
          </div>
          <button className="absolute -bottom-2 -right-2 bg-white p-4 rounded-[2rem] shadow-2xl text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90 border border-slate-100">
            <Camera size={24} />
          </button>
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            {pet.species} Family Member
          </div>
          <h2 className="text-6xl font-black text-slate-900 mb-3 tracking-tighter">{pet.name}</h2>
          <p className="text-slate-500 text-xl font-medium flex items-center justify-center md:justify-start gap-3 italic">
            {pet.breed} <span className="w-2 h-2 bg-indigo-200 rounded-full"></span> {pet.ageYears}Y {pet.ageMonths || 0}M Old
          </p>
          <div className="flex gap-4 mt-8 justify-center md:justify-start">
            <button className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-bold hover:bg-indigo-700 transition-all shadow-2xl active:scale-95 flex items-center gap-2">
              <Edit3 size={18} /> Update
            </button>
            <button 
               onClick={() => {
                 if(window.confirm("Delete profile?")) {
                   localStorage.removeItem(`pet_${user?.uid}`);
                   setPet(null);
                 }
               }}
               className="px-6 py-4 bg-white text-slate-400 rounded-[2rem] font-bold hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-200"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-2xl">
              <Fingerprint className="text-indigo-600 w-6 h-6" />
            </div>
            ID & Health
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Species</span>
              <span className="font-black text-slate-800 text-lg">{pet.species}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Variety / Breed</span>
              <span className="font-black text-slate-800 text-lg">{pet.breed}</span>
            </div>
          </div>
        </div>
        <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white flex flex-col justify-between shadow-2xl shadow-indigo-100 relative overflow-hidden">
           <PawPrint className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
           <div className="relative z-10">
              <h4 className="text-2xl font-black mb-4">Quick Tip</h4>
              <p className="text-indigo-100 leading-relaxed italic">
                "{pet.name} is in their prime! Remember to visit the Health Checkup section if you notice any changes in appetite or activity."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) setPet(JSON.parse(saved));
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path={AppRoutes.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path={AppRoutes.AI_ASSISTANT} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path={AppRoutes.PET_CARE} element={<ProtectedRoute><PetCare /></ProtectedRoute>} />
      <Route path={AppRoutes.HEALTH_CHECKUP} element={<ProtectedRoute><HealthCheckupPage /></ProtectedRoute>} />
      <Route path={AppRoutes.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path={AppRoutes.CREATE_POST} element={
        <ProtectedRoute>
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {pet?.species === 'Dog' ? '🐶 Dog Parent Community' : '🐾 Community Feed'}
              </h2>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                New Post
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-xl transition-all">
                  <img src={`https://picsum.photos/seed/petpost${i}/600/400`} className="w-full h-48 object-cover" alt="Post" />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                      <PawPrint size={12} /> {pet?.species || 'Pet'} Care Tip
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Best {pet?.species === 'Dog' ? 'dog park' : 'spots'} in the city!</h3>
                    <p className="text-slate-500 text-sm">Always remember to bring fresh water and keep your {pet?.species || 'friend'} on a leash unless in designated areas.</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200" />
                         <span className="text-xs font-bold text-slate-600">User_{i}42</span>
                       </div>
                       <div className="flex items-center gap-3 text-slate-400">
                          <Heart size={16} /> <MessageCircle size={16} />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ProtectedRoute>
      } />
      <Route path={AppRoutes.PET_PROFILE} element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
