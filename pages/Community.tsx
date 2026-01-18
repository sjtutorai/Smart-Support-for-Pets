import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, Share2, Image as ImageIcon, Search, Filter, X, 
  User as UserIcon, ChevronDown, TrendingUp, Clock, Wand2, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db } from '../services/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { PetProfile, Post } from '../types';
import { Link } from 'react-router-dom';
import FollowButton from '../components/FollowButton';

const PET_TYPES = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Reptile', 'Other'];

const Community: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [pet, setPet] = useState<PetProfile | null>(null);
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
        } catch (e) { console.error("Failed to parse pet data", e); }
      }
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore feed error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEnhanceWithAI = async () => {
    if (!newPostContent.trim()) { addNotification('AI Assistant', 'Draft a message first!', 'info'); return; }
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Enhance this pet social media caption: "${newPostContent}". Make it engaging, add relevant pet hashtags, and keep it under 40 words.`,
      });
      if (response.text) { setNewPostContent(response.text.trim()); addNotification('AI Magical Touch', 'Caption enhanced!', 'success'); }
    } catch (error) { addNotification('AI Engine Error', 'Could not enhance caption.', 'error'); } 
    finally { setIsEnhancing(false); }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPosting || (!newPostContent.trim() && !selectedImage) || !user) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
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
      });
      setNewPostContent('');
      setSelectedImage(null);
      addNotification('Moment Shared', 'Your post is now visible.', 'success');
    } catch (error: any) { addNotification('Posting Error', 'Check connection and try again.', 'error'); } 
    finally { setIsPosting(false); }
  };

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const matchesSearch = (p.petName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || p.petType === typeFilter;
      return matchesSearch && matchesType;
    });
    if (sortBy === 'popular') result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return result;
  }, [posts, searchQuery, typeFilter, sortBy]);

  const handleSharePost = async (post: Post) => {
    if (navigator.share) {
      await navigator.share({ title: `${post.petName}'s Moment`, text: post.content, url: window.location.href });
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
          <p className="text-slate-500 font-medium text-sm">See what's happening in the pet world.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button onClick={() => setSortBy('newest')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'newest' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><Clock size={14} className="inline mr-1" /> New</button>
          <button onClick={() => setSortBy('popular')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'popular' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}><TrendingUp size={14} className="inline mr-1" /> Popular</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden shadow-sm border border-slate-200">
            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-3 text-slate-300" />}
          </div>
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search moments..." className="w-full bg-slate-50/50 border border-slate-100 rounded-full py-4 pl-14 pr-4 text-sm font-medium focus:ring-4 focus:ring-theme/5 outline-none" />
          </div>
          <div className="relative shrink-0 hidden md:block">
            <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50/50 border border-slate-100 rounded-full py-4 pl-12 pr-10 text-[11px] font-black uppercase tracking-[0.1em] focus:ring-4 focus:ring-theme/5 appearance-none outline-none">
              {PET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
        </div>
        <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0] || ''}?`} className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:ring-4 focus:ring-theme/5 resize-none h-28 outline-none" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); } }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 shadow-sm border ${selectedImage ? 'border-theme' : 'border-slate-100'}`}><ImageIcon size={20} className={selectedImage ? 'text-theme' : ''} /></button>
            <button type="button" onClick={handleEnhanceWithAI} disabled={isEnhancing} className="p-3.5 bg-slate-900 text-theme rounded-xl hover:bg-black shadow-md border border-slate-800">{isEnhancing ? <Loader2 size={20} className="animate-spin text-white" /> : <Wand2 size={20} />}</button>
          </div>
          <button onClick={handleCreatePost} disabled={isPosting || (!newPostContent.trim() && !selectedImage)} className="bg-theme text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover shadow-xl shadow-theme/20 disabled:opacity-50">
            {isPosting ? <Loader2 size={16} className="animate-spin" /> : 'Share Moment'}
          </button>
        </div>
        {selectedImage && <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 shadow-lg"><img src={selectedImage} className="w-full h-full object-cover" /><button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm"><X size={14} /></button></div>}
      </div>

      <div className="space-y-12 mt-12">
        {loading ? <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-slate-200 mx-auto" /></div>
         : filteredPosts.length === 0 ? <div className="py-20 text-center bg-white rounded-3xl border-dashed border-slate-200 text-slate-300 font-black uppercase text-xs">No Moments Found</div>
         : (
          filteredPosts.map(post => (
            <article key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
              <div className="p-6 flex items-center justify-between">
                <Link to={`/user/${post.user.toLowerCase().replace(/\s/g, '')}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border"><img src={post.avatar || `https://ui-avatars.com/api/?name=${post.user}`} className="w-full h-full object-cover" /></div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-none">{post.user} · <span className="text-theme">{post.petName}</span></h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{post.petType}</p>
                  </div>
                </Link>
                <FollowButton targetUserId={post.userId} />
              </div>
              <div className="px-6 pb-6 text-slate-700 font-medium">{post.content}</div>
              {post.image && <div className="px-4 pb-4"><img src={post.image} className="w-full h-auto rounded-[1.5rem] shadow-xl" /></div>}
              <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/20 flex gap-6">
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"><Heart size={16} /> {post.likes} Likes</button>
                <button onClick={() => handleSharePost(post)} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-theme uppercase tracking-widest"><Share2 size={16} /> Share</button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Community;