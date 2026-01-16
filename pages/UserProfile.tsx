import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserByUsername, getPetsByOwnerId, startChat } from '../services/firebase';
import { PetProfile, User } from '../types';
import { Loader2, User as UserIcon, AtSign, PawPrint, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';

const UserProfile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!username) {
                setError('No username provided.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');
                const userData = await getUserByUsername(username);
                if (userData) {
                    setUser(userData);
                    const userPets = await getPetsByOwnerId(userData.uid);
                    setPets(userPets);
                } else {
                    setError('User not found.');
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [username]);

    const handleStartChat = async () => {
        if (!currentUser || !user || currentUser.uid === user.uid) return;
        try {
            await startChat(currentUser.uid, user.uid);
            navigate(AppRoutes.CHAT);
        } catch (error) {
            console.error("Failed to start chat:", error);
        }
    };

    if (loading) {
        return <div className="flex h-full w-full items-center justify-center p-20"><Loader2 className="animate-spin text-theme" size={32} /></div>;
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <UserIcon size={48} className="mx-auto text-slate-200 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">{error}</h2>
                <p className="text-slate-500">The profile you're looking for might not exist.</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* User Info Card */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-100 shrink-0 border-8 border-white shadow-2xl">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt={user.displayName || 'user'} className="w-full h-full object-cover" />
                </div>
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{user.displayName}</h1>
                    <p className="text-slate-500 font-medium mt-2 flex items-center justify-center md:justify-start gap-2">
                        <AtSign size={16} />
                        {user.username}
                    </p>
                </div>
                {currentUser?.uid !== user.uid && (
                    <button onClick={handleStartChat} className="bg-theme text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-theme-hover transition-all shadow-xl shadow-theme/10 active:scale-95 flex items-center gap-3">
                        <MessageSquare size={18} /> Message
                    </button>
                )}
            </div>

            {/* Pets Section */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100">
                <h3 className="font-black text-2xl text-slate-800 mb-6">{user.displayName?.split(' ')[0]}'s Companions ({pets.length})</h3>
                {pets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pets.map(pet => (
                            <Link to={`/pet/${pet.id}`} key={pet.id} className="group block bg-slate-50 rounded-2xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
                                <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-inner">
                                    <img src={pet.avatarUrl || `https://ui-avatars.com/api/?name=${pet.name}&background=random`} alt={pet.name} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-black text-slate-700 text-lg group-hover:text-theme transition-colors">{pet.name}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pet.breed}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                        <PawPrint size={40} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">This user has not registered any companions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;