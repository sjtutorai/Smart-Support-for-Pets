import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, PawPrint, User as UserIcon, AtSign, Users, ArrowRight } from 'lucide-react';
import { getAllUsers } from '../services/firebase';
import { Link } from 'react-router-dom';
import { User } from '../types';
import FollowButton from '../components/FollowButton';

const FindFriends: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching community users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) return users;
    const query = searchText.toLowerCase();
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(query) || 
      u.username?.toLowerCase().includes(query)
    );
  }, [users, searchText]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Discovery</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Meet other pet parents and build your network.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <Users size={18} className="text-theme" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {users.length} Active Guardians
          </span>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-theme transition-colors">
          <Search size={22} />
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name or handle..."
          className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 pl-16 pr-6 text-lg font-bold outline-none focus:ring-8 focus:ring-theme/5 transition-all shadow-xl shadow-slate-200/40"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-theme opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Syncing Directory</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <UserIcon size={48} className="mx-auto text-slate-100 mb-4" />
            <h4 className="font-black text-slate-400 uppercase tracking-widest">No users match your criteria</h4>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="group bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center gap-5 transition-all hover:shadow-2xl hover:translate-y-[-4px] relative overflow-hidden"
            >
              <Link to={`/user/${user.username}`} className="shrink-0 relative">
                <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-slate-100 border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                    alt={user.displayName || ''} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </Link>
              
              <div className="flex-1 min-w-0">
                <Link to={`/user/${user.username}`} className="block">
                  <h4 className="font-black text-slate-900 text-lg leading-tight truncate group-hover:text-theme transition-colors">
                    {user.displayName}
                  </h4>
                  <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                    <AtSign size={10} /> {user.username}
                  </div>
                </Link>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <FollowButton targetUserId={user.uid} />
                <Link 
                  to={`/user/${user.username}`}
                  className="p-3 text-slate-300 hover:text-theme hover:bg-theme-light rounded-xl transition-all"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindFriends;