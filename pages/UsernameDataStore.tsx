import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers } from '../services/firebase';
import { User } from '../types';
import { Loader2, Users as UsersIcon, AtSign, Mail, ChevronRight } from 'lucide-react';

const UsernameDataStore: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                setLoading(true);
                const allUsers = await getAllUsers();
                setUsers(allUsers);
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setError("Could not load user data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllUsers();
    }, []);

    if (loading) {
        return <div className="flex h-full w-full items-center justify-center p-20"><Loader2 className="animate-spin text-theme" size={32} /></div>;
    }

    if (error) {
        return <div className="text-center py-20 text-rose-500 font-bold">{error}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-5">
                <div className="p-4 bg-theme-light text-theme rounded-[1.5rem]">
                    <UsersIcon size={28} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">User Directory</h1>
                    <p className="text-slate-500 font-medium">A complete list of all registered users in the Paw Pal network.</p>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50">
                        <div className="col-span-5 md:col-span-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</div>
                        <div className="col-span-4 md:col-span-3 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">Username</div>
                        <div className="col-span-4 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">Email</div>
                        <div className="col-span-1"></div>
                    </div>
                    {/* Table Body */}
                    {users.map(user => (
                        <Link 
                            to={`/user/${user.username}`} 
                            key={user.uid}
                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-slate-50 transition-colors"
                        >
                            <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt={user.displayName || ''} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-slate-700 text-sm truncate group-hover:text-theme transition-colors">{user.displayName}</span>
                            </div>
                            <div className="col-span-3 items-center gap-2 text-slate-500 hidden md:flex">
                                <AtSign size={14} />
                                <span className="text-sm font-medium truncate">{user.username}</span>
                            </div>
                            <div className="col-span-4 items-center gap-2 text-slate-500 hidden md:flex">
                                <Mail size={14} />
                                <span className="text-sm font-medium truncate">{user.email}</span>
                            </div>
                            <div className="col-span-5 md:col-span-1 flex justify-end">
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-theme group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
                {users.length === 0 && (
                    <div className="text-center py-20 text-slate-400 font-medium">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default UsernameDataStore;
