
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  MoreHorizontal,
  Smile,
  CheckCircle2,
  Camera,
  Loader2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

const Community: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const savedPet = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (savedPet) {
      const parsed = JSON.parse(savedPet);
      if (parsed.length > 0) setPet(parsed[0]);
    }

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
    if (!newPostContent.trim() || !user) return;

    setIsPosting(true);

    try {
      await addDoc(collection(db, "posts"), {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || null,
        petName: pet?.name || 'My Pet',
        petType: pet?.species || 'Unknown',
        content: newPostContent,
        image: selectedImage || '',
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      setNewPostContent('');
      setSelectedImage(null);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to share post.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleMessageUser = async (targetUserId: string) => {
    if (!user || user.uid === targetUserId) return;

    const areMutuals = await checkMutualFollow(user.uid, targetUserId);
    if (areMutuals) {
      const chatId = await startChat(user.uid, targetUserId);
      if (chatId) {
        navigate(AppRoutes.CHAT);
      }
    } else {
      alert("You and this user must follow each other to start a conversation.");
    }
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.content.toLowerCase().includes(q) || p.petName.toLowerCase().includes(q));
    }
    if (typeFilter !== 'All') result = result.filter(p => p.petType === typeFilter);
    return result;
  }, [posts, searchQuery, typeFilter]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32 animate-fade-in">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
        <p className="text-slate-500 font-medium">Shared by pet parents globally.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search moments..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-14 pr-12 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all" 
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={24} className="text-slate-400" />
            )}
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`What's ${pet?.name || 'your pet'} up to?`}
            className="flex-1 bg-slate-50 border border-slate-50 rounded-[2rem] p-5 text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none min-h-[100px]"
          />
        </div>

        {selectedImage && (
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden group ml-16">
            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
            <button onClick={() => setSelectedImage(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <X size={24} />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <ImageIcon size={18} />
              Photo
            </button>
          </div>
          
          <button onClick={handleCreatePost} disabled={!newPostContent.trim() || isPosting} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50">
            {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Share
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading moments...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Camera size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No moments found</h3>
            <p className="text-slate-500">Share your first memory!</p>
          </div>
        ) : filteredPosts.map((post) => (
          <article key={post.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border">
                  {post.avatar ? (
                    <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{post.user} <span className="text-indigo-600 font-bold ml-1">{post.petName}</span></h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatTime(post.createdAt)}</p>
                </div>
              </div>
              
              {user?.uid !== post.userId && (
                <button 
                  onClick={() => handleMessageUser(post.userId)}
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  title="Message Pet Parent"
                >
                  <MessageSquare size={20} />
                </button>
              )}
            </div>

            <div className="px-8 pb-6 text-slate-700 font-medium text-lg leading-relaxed">
              {post.content}
            </div>

            {post.image && (
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img src={post.image} alt="Moment" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-8 flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 font-black text-sm text-slate-500 hover:text-rose-500 transition-all">
                  <div className="p-2.5 rounded-xl bg-slate-50"><Heart size={20} /></div>
                  {post.likes}
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