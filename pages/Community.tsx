import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, Share2, Image as ImageIcon, Search, Filter, X, 
  User as UserIcon, ChevronDown, TrendingUp, Clock, Wand2, Loader2, Sparkles, MessageSquare, Users, UserPlus, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { db, getPetsByOwnerId, getAllUsers } from '../services/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { PetProfile, Post, User, AppRoutes } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import FollowButton from '../components/FollowButton';

const CATEGORY_OPTIONS = ['All', 'Mammals', 'Birds', 'Fish', 'Reptiles', 'Amphibians', 'Insects/Arthropods', 'Other'];

// Compress base64 images before uploading to Firestore to stay within document limits
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width, height = img.height;
      if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
      else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const Community: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user's primary pet and community suggestions on load
  useEffect(() => {
    const fetchPetData = async () => {
      if (user?.uid) {
        try {
          const userPets = await getPetsByOwnerId(user.uid);
          if (userPets.length > 0) setPet(userPets[0]);
        } catch (e) { console.error("Pet fetch error", e); }
      }
    };
    const fetchSuggested = async () => {
      try {
        const batch = await getAllUsers(12);
        const filtered = batch.filter(u => u.uid !== user?.uid).slice(0, 8);
        setSuggestedUsers(filtered);
      } catch (e) { console.error("User fetch error", e); }
    };
    fetchPetData();
    fetchSuggested();
  }, [user]);

  // Real-time listener for community posts
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
      setLoading(false);
    }, (err) => {
        console.error("Feed snapshot error", err);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Submit new post to Firestore
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPosting || (!newPostContent.trim() && !selectedImage) || !user) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        user: user.displayName || 'Guardian', 
        avatar: user.photoURL || null,
        petName: pet?.name || 'Companion', 
        petType: pet?.species || 'Other', 
        petSpecies: pet?.petSpecies || 'Other',
        content: newPostContent.trim(), 
        image: selectedImage || '',
        likes: 0, 
        comments: 0, 
        createdAt: serverTimestamp(), 
        userId: user.uid
      });
      setNewPostContent(''); 
      setSelectedImage(null);
      addNotification('Moment Shared', 'Your pet story is live!', 'success');
    } catch (e) { 
      console.error(e);
      addNotification('Post Error', 'Could not save moment.', 'error'); 
    } finally { 
      setIsPosting(false); 
    }
  };

  const filteredPosts = useMemo(() => {
    const queryTerm = searchQuery.toLowerCase();
    return posts.filter(p => {
      const matchesSearch = (p.petName || '').toLowerCase().includes(queryTerm) || (p.content || '').toLowerCase().includes(queryTerm);
      const matchesCategory = categoryFilter === 'All' || p.petSpecies === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, categoryFilter]);

  return (
    <div className="space-y-10 px-2 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium text-sm">Discover moments from other pet parents.</p>
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-slate-100 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 ring-theme/5">
          {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Discover Guardians</h4>
            <Link to={AppRoutes.FIND_FRIENDS} className="text-[10px] font-black uppercase tracking-widest text-theme hover:underline">See All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-hide">
          {suggestedUsers.length > 0 ? suggestedUsers.map(u => (
            <div key={u.uid} className="w-48 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm shrink-0 flex flex-col items-center text-center group hover:shadow-xl transition-all">
                <Link to={`/user/${u.username || u.uid}`} className="relative mb-4">
                    <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden bg-slate-100 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email?.split('@')[0]}&background=random`} className="w-full h-full object-cover" />
                    </div>
                </Link>
                <Link to={`/user/${u.username || u.uid}`} className="block w-full">
                    <h5 className="font-black text-slate-800 text-sm truncate">{u.displayName || u.email?.split('@')[0]}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">@{u.username || 'guardian'}</p>
                </Link>
                <div className="mt-4 w-full">
                    <FollowButton targetUserId={u.uid} className="w-full justify-center !py-2 !rounded-xl" />
                </div>
            </div>
          )) : (
              <div className="w-full py-10 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Finding active guardians...</span>
              </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-slate-100 border overflow-hidden">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-2.5 text-slate-300" />}
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Posting as {user?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-[9px] font-black uppercase text-theme mt-1">{pet ? `${pet.name} (${pet.petSpecies})` : 'New Guardian'}</p>
           </div>
        </div>
        <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={`Tell us about ${pet?.name || 'your pet'}...`} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-theme/5 resize-none h-28 outline-none" />
        <div className="flex items-center justify-between">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => setSelectedImage(await compressImage(reader.result as string)); reader.readAsDataURL(file); } }} />
          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"><ImageIcon size={20} className={selectedImage ? 'text-theme' : 'text-slate-400'} /></button>
          <button onClick={handleCreatePost} disabled={isPosting || (!newPostContent.trim() && !selectedImage)} className="bg-theme text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-50">
            {isPosting ? <Loader2 size={16} className="animate-spin" /> : 'Share Moment'}
          </button>
        </div>
      </div>

      <div className="space-y-8 mt-12">
        {loading ? <div className="text-center py-20"><Loader2 size={32} className="animate-spin text-slate-200 mx-auto" /></div>
         : filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    <Sparkles size={40} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900">Quiet in the neighborhood...</h3>
                    <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">No moments found for this category. Start following guardians above to fill your feed!</p>
                </div>
                <button onClick={() => navigate(AppRoutes.FIND_FRIENDS)} className="text-theme font-black uppercase text-xs tracking-widest flex items-center gap-2 mx-auto hover:gap-3 transition-all">
                    Go to Discovery <ArrowRight size={14} />
                </button>
            </div>
         )
         : filteredPosts.map(post => (
            <article key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${post.userId}`} className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border shrink-0">
                    <img src={post.avatar || `https://ui-avatars.com/api/?name=${post.user}&background=random`} className="w-full h-full object-cover" />
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/user/${post.userId}`} className="font-black text-slate-900 text-sm truncate block">{post.user} · <span className="text-theme">{post.petName}</span></Link>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{post.petType} · {post.petSpecies}</span>
                  </div>
                </div>
                <FollowButton targetUserId={post.userId} />
              </div>
              <p className="text-slate-700 font-medium whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
              {post.image && <img src={post.image} className="w-full rounded-[1.5rem] shadow-lg max-h-[500px] object-cover" />}
              <div className="flex gap-6 pt-2 border-t border-slate-50">
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors"><Heart size={16} /> {post.likes}</button>
                <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-theme transition-colors"><MessageSquare size={16} /> {post.comments}</button>
              </div>
            </article>
          ))
        }
      </div>
    </div>
  );
};

export default Community;