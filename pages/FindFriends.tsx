
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, User as UserIcon, AtSign, Users, ArrowRight, ChevronDown } from 'lucide-react';
import { getUsersPaginated } from '../services/firebase';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import FollowButton from '../components/FollowButton';

const PAGE_SIZE = 12;

const FindFriends: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Initial fetch on mount
  useEffect(() => {
    fetchInitialUsers();
  }, []);

  // Retrieve first page of users from Firestore
  const fetchInitialUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsersPaginated(PAGE_SIZE);
      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error fetching community users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Retrieve next page of users using the cursor
  const loadMoreUsers = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const result = await getUsersPaginated(PAGE_SIZE, lastDoc);
      setUsers(prev => [...prev, ...result.users]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more users:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Search through currently loaded users in local state
  const filteredUsers = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    if (!query) return users;
    
    return users.filter(u => {
      const name = (u.displayName || '').toLowerCase();
      const handle = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(query) || handle.includes(query) || email.includes(query);
    });
  }, [users, searchText]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Discovery</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Meet other pet parents and build your network.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <Users size={18} className="text-theme" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Explorer Mode Active
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
          placeholder="Search loaded guardians..."
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
            <h4 className="font-black text-slate-400 uppercase tracking-widest">No matching guardians found</h4>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const displayName = u.displayName || u.email?.split('@')[0] || 'Guardian';
            return (
              <div
                key={u.uid}
                className="group bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center gap-5 transition-all hover:shadow-2xl hover:translate-y-[-4px] relative overflow-hidden"
              >
                <Link to={`/user/${u.username || u.uid}`} className="shrink-0 relative">
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-slate-100 border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={u.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                      alt={displayName} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${u.username || u.uid}`} className="block">
                    <h4 className="font-black text-slate-900 text-lg leading-tight truncate group-hover:text-theme transition-colors">
                      {displayName}
                    </h4>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                      <AtSign size={10} /> {u.username || 'guardian'}
                    </div>
                  </Link>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <FollowButton targetUserId={u.uid} />
                  <Link 
                    to={`/user/${u.username || u.uid}`}
                    className="p-3 text-slate-300 hover:text-theme hover:bg-theme-light rounded-xl transition-all"
                  >
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hasMore && !isLoading && (
        <div className="pt-10 flex justify-center">
          <button 
            onClick={loadMoreUsers}
            disabled={isLoadingMore}
            className="flex items-center gap-3 px-12 py-5 bg-white border border-slate-100 text-slate-600 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-theme hover:text-white hover:border-theme shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Expanding Directory...
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Load More Guardians
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FindFriends;
