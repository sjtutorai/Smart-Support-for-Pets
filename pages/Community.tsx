
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  Share2, 
  Image as ImageIcon, 
  Send, 
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
  CheckCircle2,
  Globe,
  Users as UsersIcon,
  Smile,
  MagicWand,
  Palette,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, addCommentToPost, getCommentsForPost, onFollowsUpdate } from '../services/firebase';
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  createdAt: any;
}

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
  userId: string;
}

const PET_TYPES = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Reptile', 'Other'];

const AI_FILTERS = [
  { id: 'enhance', label: 'Vibrant Enhance', prompt: 'Enhance this pet photo to look cinematic, vibrant, and professional with high contrast and sharp focus.' },
  { id: 'cartoon', label: 'Playful Cartoon', prompt: 'Transform this pet into a cute, high-quality 3D animated character style, vibrant colors.' },
  { id: 'vintage', label: 'Vintage Film', prompt: 'Apply a warm, nostalgic vintage film aesthetic to this pet photo with subtle grain and soft lighting.' },
];

const Community: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAiStudio, setShowAiStudio] = useState(false);
  const [activePostComments, setActivePostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [feedMode, setFeedMode] = useState<'everyone' | 'following'>('everyone');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'talked'>('newest');

  useEffect(() => {
    if (user?.uid) {
      const savedPet = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (savedPet) {
        try {
          const parsed = JSON.parse(savedPet);
          if (parsed.length > 0) setPet(parsed[0]);
        } catch (e) { console.error(e); }
      }
      const unsub = onFollowsUpdate(user.uid, (data) => setFollowing(data.following));
      return () => unsub();
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
    });

    return () => unsubscribe();
  }, []);

  const applyAiFilter = async (filterPrompt: string) => {
    if (!selectedImage) return;
    setIsApplyingFilter(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.split(',')[1], mimeType: 'image/png' } },
            { text: filterPrompt }
          ]
        },
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setSelectedImage(`data:image/png;base64,${part.inlineData.data}`);
          addNotification('AI Studio', 'Filter applied successfully!', 'success');
          break;
        }
      }
    } catch (err) {
      addNotification('AI Studio Error', 'Could not apply filter.', 'error');
    } finally {
      setIsApplyingFilter(false);
      setShowAiStudio(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!newPostContent.trim()) return;
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Enhance this pet social media caption: "${newPostContent}". Make it engaging, add relevant pet hashtags, and keep it under 40 words.`,
      });
      if (response.text) setNewPostContent(response.text.trim());
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
      addNotification('Moment Shared', 'Your post is now visible!', 'success');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { likes: increment(1) });
  };

  const toggleComments = (postId: string) => {
    if (activePostComments[postId]) {
      const newComments = { ...activePostComments };
      delete newComments[postId];
      setActivePostComments(newComments);
    } else {
      getCommentsForPost(postId, (comments) => {
        setActivePostComments(prev => ({ ...prev, [postId]: comments }));
      });
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim() || !user) return;
    await addCommentToPost(postId, user.uid, user.displayName || 'User', user.photoURL, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const matchesSearch = (p.petName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                           (p.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || p.petType === typeFilter;
      const matchesFeed = feedMode === 'everyone' || following.includes(p.userId) || p.userId === user?.uid;
      return matchesSearch && matchesType && matchesFeed;
    });

    if (sortBy === 'popular') result = result.sort((a, b) => b.likes - a.likes);
    if (sortBy === 'talked') result = result.sort((a, b) => b.comments - a.comments);
    
    return result;
  }, [posts, searchQuery, typeFilter, sortBy, feedMode, following, user]);

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Community Pulse</h2>
          <p className="text-slate-500 font-medium text-sm">Discover and connect with pet parents worldwide.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 shrink-0">
          <button onClick={() => setFeedMode('everyone')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${feedMode === 'everyone' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
            <Globe size={14} /> Discovery
          </button>
          <button onClick={() => setFeedMode('following')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${feedMode === 'following' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
            <UsersIcon size={14} /> My Network
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm shrink-0">
            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-3 text-slate-300" />}
          </div>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search moments...`} 
              className="w-full bg-slate-50 border border-slate-100 rounded-full py-4 pl-14 pr-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-theme/5 outline-none transition-all" 
            />
          </div>
        </div>

        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder={`Share ${pet?.name || 'your pet'}'s latest adventures...`}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-theme/5 resize-none h-32 outline-none transition-all"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setSelectedImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-100"><ImageIcon size={20} /></button>
            <button onClick={handleEnhanceWithAI} disabled={isEnhancing} className="p-4 bg-slate-900 text-theme rounded-xl hover:bg-black transition-all shadow-md">{isEnhancing ? <Loader2 size={20} className="animate-spin text-white" /> : <Wand2 size={20} />}</button>
          </div>
          <button onClick={handleCreatePost} disabled={isPosting || !newPostContent.trim()} className="bg-theme text-white px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] hover:bg-theme-hover shadow-xl shadow-theme/20 disabled:opacity-50 transition-all">
            {isPosting ? <Loader2 size={16} className="animate-spin" /> : 'Broadcast Moment'}
          </button>
        </div>

        {selectedImage && (
          <div className="relative group/img w-full max-w-sm mt-6">
            <img src={selectedImage} className="w-full h-auto rounded-[2rem] shadow-2xl border-2 border-white" />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
               <button onClick={() => setSelectedImage(null)} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-rose-500 transition-all shadow-lg"><X size={16} /></button>
               <button onClick={() => setShowAiStudio(!showAiStudio)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                 <Sparkles size={14} className="animate-pulse" /> AI Studio
               </button>
            </div>
            
            {showAiStudio && (
              <div className="absolute top-16 right-4 w-56 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl p-4 shadow-2xl space-y-2 z-20 animate-in zoom-in-95">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <MagicWand size={10} /> Image Styles
                </h5>
                {AI_FILTERS.map(f => (
                  <button key={f.id} onClick={() => applyAiFilter(f.prompt)} disabled={isApplyingFilter} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                    <span className="text-[10px] font-black text-slate-700 uppercase">{f.label}</span>
                    <Palette size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
                {isApplyingFilter && <div className="p-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold text-center animate-pulse">Processing...</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-slate-100 overflow-x-auto scrollbar-hide">
        <button onClick={() => setSortBy('newest')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'newest' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
           <Clock size={14} /> Recent
        </button>
        <button onClick={() => setSortBy('popular')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'popular' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
           <TrendingUp size={14} /> Top Appreciation
        </button>
        <button onClick={() => setSortBy('talked')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${sortBy === 'talked' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
           <MessageSquare size={14} /> Most Discussed
        </button>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {loading ? (
          <div className="py-20 text-center"><Loader2 size={48} className="animate-spin text-slate-200 mx-auto" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-100 flex flex-col items-center justify-center gap-6">
            <LayoutGrid size={64} className="text-slate-100" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No matching moments found</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isFriend = following.includes(post.userId);
            const comments = activePostComments[post.id] || [];
            return (
              <article key={post.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-700">
                <div className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                      {post.avatar ? <img src={post.avatar} className="w-full h-full object-cover" /> : <UserIcon className="m-3 text-slate-200" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base tracking-tight">{post.user}</h4>
                        {isFriend && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Friend</span>}
                        <span className="text-theme mx-1">·</span>
                        <span className="text-theme font-black text-sm">{post.petName}</span>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        {post.petType} · {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-10 pb-8 text-slate-700 font-medium leading-relaxed text-lg">{post.content}</div>
                
                {post.image && (
                  <div className="px-6 pb-6 relative group/postimg">
                    <img src={post.image} className="w-full h-auto rounded-[3rem] shadow-2xl transition-all group-hover/postimg:scale-[1.01]" />
                  </div>
                )}
                
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-50 flex flex-col gap-6">
                  <div className="flex gap-8">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-all uppercase tracking-widest active:scale-90">
                      <Heart size={20} className={post.likes > 0 ? 'fill-rose-500 text-rose-500' : ''} /> {post.likes} Appreciation
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest">
                      <MessageSquare size={20} /> {post.comments} Thoughts
                    </button>
                    <button className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest ml-auto">
                      <Share2 size={20} /> Share
                    </button>
                  </div>

                  {activePostComments[post.id] && (
                    <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-5">
                        {comments.length === 0 ? (
                           <p className="text-[10px] font-black text-slate-300 text-center py-4 uppercase tracking-widest">No thoughts yet. Be the first!</p>
                        ) : (
                          comments.map(c => (
                            <div key={c.id} className="flex gap-3 items-start group/comment">
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-white">
                                {c.userAvatar ? <img src={c.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="m-2 text-slate-200" />}
                              </div>
                              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
                                <p className="text-[10px] font-black text-slate-900 mb-1">{c.userName}</p>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{c.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-3">
                         <input 
                            value={commentInputs[post.id] || ''} 
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                            placeholder="Share your thoughts..." 
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-theme/5 transition-all"
                         />
                         <button onClick={() => submitComment(post.id)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all">
                            <Send size={18} />
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Community;
