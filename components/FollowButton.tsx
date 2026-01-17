import React, { useState, useEffect } from 'react';
import { UserPlus, Check, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFollowStatus, requestFollow } from '../services/firebase';
import { FollowStatus } from '../types';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId, className = "" }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<FollowStatus>('not_following');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUserId) return;

    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const currentStatus = await getFollowStatus(user.uid, targetUserId);
        setStatus(currentStatus);
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user, targetUserId]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !user.displayName) return;
    setIsLoading(true);
    try {
      await requestFollow(user.uid, user.displayName, targetUserId);
      setStatus('pending');
    } catch (error) {
      console.error("Follow request failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'is_self' || isLoading) return null;
  
  if (status === 'following') {
    return (
      <div className={`flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest ${className}`}>
        <Check size={14} /> Following
      </div>
    );
  }
  
  if (status === 'pending') {
    return (
      <div className={`flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-widest ${className}`}>
        <Clock size={14} /> Pending
      </div>
    );
  }

  return (
    <button 
      onClick={handleFollow} 
      className={`flex items-center gap-2 bg-theme-light text-theme px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-theme hover:text-white transition-all shadow-sm active:scale-95 ${className}`}
    >
      <UserPlus size={14} /> Follow
    </button>
  );
};

export default FollowButton;