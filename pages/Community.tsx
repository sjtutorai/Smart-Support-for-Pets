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
  Sparkles,
  Smile,
  PawPrint
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
      addNotification('AI Assistant', 'Draft a message first for AI to enhance!', 'info');
      return;
    }
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Enhance this pet social media caption: "${newPostContent}". Make it engaging, add relevant pet hashtags, and keep it under 40 words.`,
      });
      if (response.text) {
        setNewPostContent(response.text.trim());
        addNotification('AI Magical Touch', 'Caption enhanced!', 'success');
      }
    } catch (error) {
      addNotification('AI Engine Error', 'Could not enhance caption.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;
    setIsPosting(true);
    try {
      const postPayload = {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || null,
        petName: pet?.name || 'My Companion',
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
      addNotification('Moment Shared', 'Your post is now visible to the community.', 'success');
    } catch (error) {
      addNotification('Posting Error', 'Check your connection and try again.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const matchesSearch = (p.petName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                           (p.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || p.petType === typeFilter;
      return matchesSearch && matchesType;
    });

    if (sortBy === 'popular') {
      result = result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return result;
  }, [posts, searchQuery, typeFilter, sortBy]);

  const handleSharePost = async (post: Post) => {
    const shareData = {
      title: `${post.petName}'s Moment`,
      text: post.content,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { /* silent cancel */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      addNotification('Link Copied', 'URL copied to clipboard.', 'success');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium text-sm">See what's happening in the pet world today.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setSortBy('newest')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Clock size={14} className="inline mr-1" /> New
          </button>
          <button 
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TrendingUp size={14} className="inline mr-1" /> Popular
          </button>
        </div>
      </div>

      {/* Discovery Dashboard: Fixed Search/Filter Bar matching Screenshot 1 */}
      <div className="sticky top-0 z-40 py-2">
        <div className="bg-white rounded-full p-2 shadow-sm border border-slate-100 flex items-center gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search moments by pet name..." 
              className="w-full bg-slate-50/50 border-none rounded-full py-4 pl-14 pr-4 text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:ring-0 outline-none transition-all" 
            />
          </div>
          <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
          <div className="relative shrink-0 md:min-w-[180px]">
            <Filter size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50/50 border-none rounded-full py-4 pl-12 pr-10 text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 focus:ring-0 appearance-none outline-none cursor-pointer"
            >
              {PET_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'Every Species' : t}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>
      </div>

      <form onSubmit={handleCreatePost} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-3 text-slate-300" />}
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`Tell the community what ${pet?.name || 'your companion'} is up to...`}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-theme/5 resize-none h-24 outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setSelectedImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-theme-light hover:text-theme transition-all">
              <ImageIcon size={20} />
            </button>
            <button type="button" onClick={handleEnhanceWithAI} disabled={isEnhancing} className="p-3 bg-slate-900 text-theme rounded-xl hover:bg-black transition-all">
              {isEnhancing ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
            </button>
          </div>
          <button 
            type="submit" 
            disabled={isPosting || !newPostContent.trim()} 
            className="bg-theme text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover shadow-lg shadow-theme/20 transition-all disabled:opacity-50"
          >
            Share Moment
          </button>
        </div>
        {selectedImage && (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md">
            <img src={selectedImage} className="w-full h-full object-cover" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><X size={12} /></button>
          </div>
        )}
      </form>

      <div className="space-y-12 mt-12">
        {loading ? (
          <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-slate-200 mx-auto" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 font-black uppercase tracking-widest text-xs">No matching moments found</div>
        ) : filteredPosts.map(post => (
          <article key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                  {post.avatar ? <img src={post.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-2 text-slate-300" />}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{post.user} <span className="text-theme">· {post.petName}</span></h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{post.petType}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 text-slate-700 font-medium leading-relaxed">{post.content}</div>
            {post.image && <div className="px-4 pb-4"><img src={post.image} className="w-full h-auto rounded-[1.5rem] shadow-xl" /></div>}
            <div className="px-6 py-4 border-t border-slate-50 flex gap-6">
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">
                <Heart size={16} /> {post.likes} Appreciation
              </button>
              <button onClick={() => handleSharePost(post)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-theme transition-colors uppercase tracking-widest">
                <Share2 size={16} /> Share Moment
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Community;
