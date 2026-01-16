import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  Camera, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  User as UserIcon, 
  MessageSquare, 
  ChevronDown, 
  TrendingUp, 
  Clock,
  Wand2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, startChat, checkMutualFollow } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { AppRoutes } from '../types';

interface Post {
  id: string;
  user: string;
  avatar: string | null;
  petName: string;
  petType?: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  createdAt: any;
  isUser?: boolean;
  userId: string;
}

const PET_TYPES = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Reptile', 'Other'];

const Community: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Discovery State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    if (user?.uid) {
      const savedPet = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (savedPet) {
        try {
          const parsed = JSON.parse(savedPet);
          if (parsed.length > 0) setPet(parsed[0]);
        } catch (e) {
          console.error("Failed to parse pet data", e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore feed error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEnhanceWithAI = async () => {
    if (!newPostContent.trim()) {
      addNotification('AI Assistant', 'Please type a draft first so I can enhance it!', 'info');
      return;
    }

    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a professional pet social media manager. Enhance the following draft post to be more engaging, cute, and include a few relevant hashtags. Keep the tone friendly and warm. Draft: "${newPostContent}"`,
      });
      
      if (response.text) {
        setNewPostContent(response.text.trim());
        addNotification('AI Magic', 'Your caption has been enhanced!', 'success');
      }
    } catch (error) {
      console.error("AI Enhancement failed:", error);
      addNotification('AI Error', 'Failed to reach AI engine. Please try again.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      addNotification('Empty Post', 'Please write something before sharing!', 'warning');
      return;
    }
    if (!user) return;

    setIsPosting(true);
    try {
      const postPayload = {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || null,
        petName: pet?.name || 'My Pet',
        petType: pet?.species || 'Other',
        content: newPostContent.trim(),
        image: selectedImage || '',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(collection(db, "posts"), postPayload);
      setNewPostContent('');
      setSelectedImage(null);
      addNotification('Moment Shared!', 'Your post is now live.', 'success');
    } catch (error) {
      addNotification('Posting Failed', 'Could not share your moment.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSharePost = async (post: Post) => {
    const shareData = {
      title: `${post.petName}'s Moment | SS Paw Pal`,
      text: `${post.petName}: ${post.content}`,
      url: window.location.origin + '/#/community',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n\nRead more on SS Paw Pal: ${shareData.url}`);
      addNotification('Copied to Clipboard', 'The post link and content are ready to paste.', 'success');
    }
  };

  const handleMessageUser = async (targetUserId: string) => {
    if (!user || user.uid === targetUserId) return;
    const areMutuals = await checkMutualFollow(user.uid, targetUserId);
    if (areMutuals) {
      const chatId = await startChat(user.uid, targetUserId);
      if (chatId) navigate(AppRoutes.CHAT);
    } else {
      addNotification('Privacy Notice', 'You need to follow each other to message directly.', 'info');
    }
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 1. Search Filter (Pet Name or Content)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.petName?.toLowerCase() || '').includes(q) || 
        (p.content?.toLowerCase() || '').includes(q)
      );
    }

    // 2. Pet Type Filter
    if (typeFilter !== 'All') {
      result = result.filter(p => p.petType === typeFilter);
    }

    // 3. Sorting
    if (sortBy === 'popular') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Newest is handled by Firestore query naturally, but we preserve local order if needed
    }

    return result;
  }, [posts, searchQuery, typeFilter, sortBy]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-fade-in">
      {/* Header & Sorting Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium text-lg">Daily moments from pets around the world.</p>
        </div>
        
        <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-xl self-start">
          <button 
            onClick={() => setSortBy('newest')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-theme text-white shadow-lg shadow-theme/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Clock size={14} /> Newest
          </button>
          <button 
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-theme text-white shadow-lg shadow-theme/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TrendingUp size={14} /> Popular
          </button>
        </div>
      </div>

      {/* Discovery Dashboard (Search & Filters) */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-4 border border-slate-100 shadow-xl flex flex-col md:flex-row gap-4 sticky top-4 z-40">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search moments by pet name..." 
            className="w-full bg-slate-50 border border-transparent rounded-[1.75rem] py-4 pl-14 pr-12 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-theme/10 transition-all" 
          />
        </div>

        <div className="relative min-w-[180px]">
          <Filter size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full h-full bg-slate-50 border border-transparent rounded-[1.75rem] py-4 pl-14 pr-10 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-theme/10 transition-all cursor-pointer"
          >
            {PET_TYPES.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'Every Species' : type}</option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <form onSubmit={handleCreatePost} className="bg-white rounded-[3.5rem] p-8 md:p-10 border border-slate-100 shadow-2xl space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles size={100} className="text-theme" />
        </div>

        <div className="flex gap-6">
          <div className="w-16 h-16 rounded-[1.75rem] overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center shadow-lg">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={28} className="text-slate-300" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <textarea
              required
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`Tell the community what ${pet?.name || 'your pet'} is doing...`}
              className="w-full bg-slate-50 border border-transparent rounded-[2.5rem] p-8 text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-theme/5 transition-all resize-none min-h-[160px] font-medium text-lg leading-relaxed shadow-inner"
            />
            
            {selectedImage && (
              <div className="relative w-48 h-48 rounded-[2rem] overflow-hidden group shadow-2xl border-4 border-white animate-in zoom-in">
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setSelectedImage(null)} 
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                >
                  <X size={28} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              className="px-8 py-4 text-theme hover:bg-theme-light rounded-2xl transition-all flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] group/btn"
            >
              <ImageIcon size={20} className="group-hover/btn:scale-110 transition-transform" />
              Attach Moment
            </button>

            <button 
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className={`px-8 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] relative overflow-hidden group/magic ${isEnhancing ? 'bg-indigo-50 text-indigo-300' : 'bg-slate-900 text-indigo-400 hover:text-white'}`}
              title="Enhance with AI Magic"
            >
              {isEnhancing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} className="group-hover/magic:rotate-12 transition-transform" />}
              {isEnhancing ? 'Rewriting...' : 'AI Enhance'}
              {!isEnhancing && <div className="absolute inset-0 bg-gradient-to-r from-theme/0 via-white/5 to-theme/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>}
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={isPosting} 
            className="w-full sm:w-auto bg-theme text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-theme-hover transition-all shadow-2xl shadow-theme/30 disabled:opacity-50 active:scale-95 transition-theme group"
          >
            {isPosting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            {isPosting ? 'Sharing...' : 'Share Now'}
          </button>
        </div>
      </form>

      {/* Posts Feed */}
      <div className="space-y-16">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-6">
            <Loader2 size={48} className="animate-spin text-theme opacity-40" />
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Global Moments</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-[4rem] p-24 text-center border border-slate-100 shadow-sm">
            <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 text-slate-200">
              <Camera size={56} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No moments found</h3>
            <p className="text-slate-500 font-medium text-lg">Try adjusting your filters or search terms.</p>
          </div>
        ) : filteredPosts.map((post) => (
          <article key={post.id} className="bg-white rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-700">
            <div className="p-10 md:p-12 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.75rem] overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-lg">
                  {post.avatar ? (
                    <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-900 flex items-center gap-3">
                    {post.user} 
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                    <span className="text-theme font-black">{post.petName}</span>
                    {post.petType && post.petType !== 'Other' && (
                      <span className="px-4 py-1.5 bg-theme-light text-[9px] font-black text-theme rounded-full uppercase tracking-widest transition-theme">
                        {post.petType}
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{formatTime(post.createdAt)}</p>
                </div>
              </div>
              
              {user?.uid !== post.userId && (
                <button 
                  onClick={() => handleMessageUser(post.userId)}
                  className="p-5 bg-slate-50 text-slate-400 rounded-[2rem] hover:bg-theme hover:text-white transition-all shadow-sm group/btn hover:rotate-12"
                  title="Message Pet Parent"
                >
                  <MessageSquare size={24} />
                </button>
              )}
            </div>

            <div className="px-10 md:px-12 pb-10 text-slate-600 font-medium text-xl md:text-2xl leading-[1.6] tracking-tight">
              {post.content}
            </div>

            {post.image && (
              <div className="px-8 pb-8">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden rounded-[4rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]">
                  <img src={post.image} alt="Moment" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="p-10 md:p-12 flex items-center justify-between border-t border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-8">
                <button className="flex items-center gap-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-all group/like">
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 group-hover/like:bg-rose-50 group-hover/like:border-rose-100 shadow-sm transition-all group-hover/like:scale-110">
                    <Heart size={20} className="group-hover/like:fill-rose-500" />
                  </div>
                  {post.likes} Appreciation
                </button>

                <button 
                  onClick={() => handleSharePost(post)}
                  className="flex items-center gap-4 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-theme transition-all group/share"
                >
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 group-hover/share:bg-theme-light group-hover/share:border-theme/20 shadow-sm transition-all group-hover/share:scale-110">
                    <Share2 size={20} />
                  </div>
                  Share Moment
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Community;