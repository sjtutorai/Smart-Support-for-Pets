import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserByUsername, getUserById, getPetsByOwnerId, startChat, getFollowStatus } from '../services/firebase';
import { PetProfile, User, FollowStatus } from '../types';
import { Loader2, User as UserIcon, AtSign, PawPrint, MessageSquare, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppRoutes } from '../types';
import FollowButton from '../components/FollowButton';

const UserProfile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [followStatus, setFollowStatus] = useState<FollowStatus>('not_following');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!username || !currentUser) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');
                
                // Try fetching by username (handle) first
                let userData = await getUserByUsername(username);
                
                // If not found by username, try fetching by ID (UID)
                // This is important because many links in the feed use user.uid
                if (!userData) {
                    userData = await getUserById(username);
                }

                if (userData) {
                    setUser(userData);
                    const status = await getFollowStatus(currentUser.uid, userData.uid);
                    setFollowStatus(status);
                    
                    if (status === 'following' || userData.uid === currentUser.uid) {
                        const userPets = await getPetsByOwnerId(userData.uid);
                        setPets(userPets);
                    }
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
    }, [username, currentUser]);

    const handleStartChat = async () => {
        if (!currentUser || !user || currentUser.uid === user.uid || followStatus !== 'following') return;
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
            <div className="text-center py-32">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <UserIcon size={40} className="text-slate-200" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{error}</h2>
                <p className="text-slate-500 mt-2 font-medium">The guardian you are looking for does not exist in our directory.</p>
                <Link to={AppRoutes.HOME} className="inline-block mt-8 text-theme font-black uppercase text-xs tracking-widest hover:underline">Return to Hub</Link>
            </div>
        );
    }

    if (!user) return null;

    const isOwnProfile = currentUser?.uid === user.uid;
    const canSeePrivateInfo = isOwnProfile || followStatus === 'following';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fade-in">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><UserIcon size={200} /></div>
                
                <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-100 shrink-0 border-8 border-white shadow-2xl relative z-10">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName || 'user'} className="w-full h-full object-cover" />
                </div>
                
                <div className="text-center md:text-left flex-1 relative z-10">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{user.displayName}</h1>
                    <p className="text-slate-500 font-medium mt-2 flex items-center justify-center md:justify-start gap-2">
                        <AtSign size={16} className="text-theme" />
                        <span className="font-bold">{user.username}</span>
                    </p>
                    
                    {canSeePrivateInfo && user.phoneNumber && (
                        <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <Phone size={14} className="text-emerald-500" /> {user.phoneNumber}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                        {!isOwnProfile && <FollowButton targetUserId={user.uid} className="!px-10 !py-4 !text-sm" />}
                        {!isOwnProfile && followStatus === 'following' && (
                            <button onClick={handleStartChat} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
                                <MessageSquare size={18} /> Send Message
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">
                        {user.displayName?.split(' ')[0]}'s Registry
                    </h3>
                    <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {canSeePrivateInfo ? `${pets.length} Companions` : 'Private Access'}
                    </div>
                </div>

                {canSeePrivateInfo ? (
                    pets.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {pets.map(pet => (
                                <Link to={`/pet/${pet.id}`} key={pet.id} className="group block bg-slate-50/50 rounded-[2rem] p-5 border border-transparent hover:border-theme/10 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                    <div className="w-full h-44 rounded-2xl overflow-hidden mb-5 shadow-lg relative">
                                        <img src={pet.avatarUrl || `https://ui-avatars.com/api/?name=${pet.name}`} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PawPrint size={18} />
                                        </div>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xl group-hover:text-theme transition-colors">{pet.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{pet.breed} · {pet.species}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                            <PawPrint size={56} className="mx-auto text-slate-100 mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No registered companions found</p>
                        </div>
                    )
                ) : (
                     <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 border border-slate-50">
                            <Lock size={40} className="text-slate-200" />
                        </div>
                        <h4 className="font-black text-slate-800 text-xl tracking-tight">Access Restricted</h4>
                        <p className="text-slate-400 font-medium text-sm mt-2 max-w-xs mx-auto">Follow this guardian to unlock their pet registry and contact intelligence.</p>
                        {!isOwnProfile && <FollowButton targetUserId={user.uid} className="mt-10 !px-12" />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;