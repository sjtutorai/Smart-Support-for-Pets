
import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, UserCheck, Mail, Loader2, User as UserIcon, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchUsersByEmail, followUser, unfollowUser, onFollowsUpdate, startChat } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../types';
import debounce from 'lodash.debounce';

interface FoundUser {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
}

const FindFriends: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FoundUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [follows, setFollows] = useState<{ following: string[], followers: string[] }>({ following: [], followers: [] });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onFollowsUpdate(user.uid, setFollows);
    return () => unsubscribe();
  }, [user]);

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (!query.trim() || !user) {
      setResults([]);
      setNoResults(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNoResults(false);
    try {
      const users = await searchUsersByEmail(query, user.uid);
      setResults(users as FoundUser[]);
      if (users.length === 0) {
        setNoResults(true);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, 500), [user]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsLoading(true);
    debouncedSearch(query);
  };

  const handleFollowToggle = async (targetId: string, isFollowing: boolean) => {
    if (!user) return;
    if (isFollowing) {
      await unfollowUser(user.uid, targetId);
    } else {
      await followUser(user.uid, targetId);
    }
  };

  const handleMessageUser = async (targetUserId: string) => {
    if (!user) return;
    const chatId = await startChat(user.uid, targetUserId);
    if (chatId) {
      navigate(AppRoutes.CHAT);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20 animate-fade-in">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Find Friends</h2>
        <p className="text-slate-500 font-medium">Connect with other pet parents by searching their email.</p>
      </div>

      <div className="relative">
        <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="email"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Enter an email address to find a user..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-6 pl-14 pr-6 text-lg font-medium outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
        />
        {isLoading && <Loader2 size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>

      <div className="space-y-4">
        {results.map(foundUser => {
          const isFollowing = follows.following.includes(foundUser.id);
          const isFollower = follows.followers.includes(foundUser.id);
          const isMutual = isFollowing && isFollower;
          
          return (
            <div key={foundUser.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between gap-4 transition-all hover:shadow-lg hover:border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100">
                  <img src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${foundUser.displayName}`} alt={foundUser.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{foundUser.displayName}</h4>
                  <p className="text-sm font-medium text-slate-400">@{foundUser.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMutual && (
                    <button
                        onClick={() => handleMessageUser(foundUser.id)}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                        title="Message"
                    >
                        <MessageSquare size={20} />
                    </button>
                )}
                <button
                  onClick={() => handleFollowToggle(foundUser.id, isFollowing)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          );
        })}
        {noResults && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <UserIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <h4 className="font-black text-slate-700">No User Found</h4>
            <p className="text-slate-500 text-sm">Check the email address and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindFriends;