import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPetById, getUserById } from '../services/firebase';
import { PetProfile, User } from '../types';
import { Loader2, PawPrint, Dog, User as UserIcon, Calendar, Info, ShieldCheck, AtSign, MessageSquare } from 'lucide-react';
import { AppRoutes } from '../types';

const StatPill: React.FC<{ label: string, value: string | undefined, icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-center">
        <Icon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="font-bold text-slate-700 mt-1">{value || 'N/A'}</p>
    </div>
);

const PublicPetProfile: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const [pet, setPet] = useState<PetProfile | null>(null);
    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!petId) {
                setLoading(false);
                return;
            }
            try {
                const petData = await getPetById(petId);
                setPet(petData);

                if (petData && petData.ownerId) {
                    const ownerData = await getUserById(petData.ownerId);
                    setOwner(ownerData);
                }
            } catch (error) {
                console.error("Error fetching public profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [petId]);

    if (loading) {
        return <div className="flex h-full w-full items-center justify-center p-20"><Loader2 className="animate-spin text-theme" size={32} /></div>;
    }

    if (!pet) {
        return (
            <div className="text-center py-20">
                <PawPrint size={48} className="mx-auto text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">Pet Profile Not Found</h2>
                <p className="text-slate-500">This companion may not exist or the profile is private.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Main Profile Card */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="w-48 h-48 rounded-full overflow-hidden bg-slate-100 shrink-0 border-8 border-white shadow-2xl">
                    <img src={pet.avatarUrl || `https://ui-avatars.com/api/?name=${pet.name}&background=random`} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-theme uppercase tracking-widest">{pet.species}</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mt-1">{pet.name}</h1>
                    <p className="text-slate-500 font-medium mt-2 max-w-lg">{pet.breed}</p>
                    
                    {owner && (
                        <div className="mt-6 flex items-center justify-center md:justify-start gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 self-start inline-flex">
                             <div className="w-10 h-10 rounded-xl overflow-hidden bg-white">
                                <img src={owner.photoURL || `https://ui-avatars.com/api/?name=${owner.displayName}`} alt={owner.displayName || ''} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold uppercase text-slate-400">Owner</p>
                                <p className="font-bold text-slate-700 leading-tight">{owner.displayName}</p>
                             </div>
                             <Link to={AppRoutes.CHAT} className="p-3 bg-white rounded-xl shadow-sm text-slate-400 hover:bg-theme-light hover:text-theme transition-colors">
                                <MessageSquare size={18} />
                             </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatPill label="Age" value={`${pet.ageYears || '0'}y ${pet.ageMonths || '0'}m`} icon={Calendar} />
                <StatPill label="Last Weight" value={pet.weightHistory?.[pet.weightHistory.length - 1] ? `${pet.weightHistory[pet.weightHistory.length - 1].weight} kg` : undefined} icon={PawPrint} />
                <StatPill label="Public Profile" value="Visible" icon={ShieldCheck} />
                 <StatPill label="Pet ID" value={pet.id.split('-')[1]} icon={AtSign} />
            </div>

            {/* Bio section */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100">
                <h3 className="font-black text-slate-800 flex items-center gap-3 mb-4">
                    <Info size={18} className="text-theme"/>
                    About {pet.name}
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed italic">
                    {pet.bio || "This pet's parent hasn't added a bio yet."}
                </p>
            </div>
        </div>
    );
};

export default PublicPetProfile;
