
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  MoreHorizontal,
  Smile,
  MapPin,
  CheckCircle2,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

interface Post {
  id: string;
  user: string;
  avatar: string;
  petName: string;
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
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load pet data
    const savedPet = localStorage.getItem(`pet_${user?.uid}`);
    if (savedPet) setPet(JSON.parse(savedPet));

    // Real-time listener for Firestore posts
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;

    setIsPosting(true);

    try {
      // Create global post in Firestore
      await addDoc(collection(db, "posts"), {
        user: user.displayName || 'Pet Parent',
        avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        petName: pet?.name || 'My Pet',
        content: newPostContent,
        image: `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800&sig=${Date.now()}`, // Shared placeholder
        likes: Math.floor(Math.random() * 10), // Mock initial likes
        comments: 0,
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      setNewPostContent('');
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to share post. Please check your internet connection.");
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium">Shared by pet parents globally.</p>
        </div>
        <div className="hidden md:flex -space-x-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
              <img src={`https://i.pravatar.cc/150?u=friend${i}`} alt="User" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            +{posts.length > 0 ? posts.length : '...'}
          </div>
        </div>
      </div>

      {/* Post Composer */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6 transition-all focus-within:shadow-xl focus-within:shadow-indigo-50/50">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md">
            <img src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`} alt="Me" className="w-full h-full object-cover" />
          </div>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={`What's ${pet?.name || 'your pet'} up to today?`}
            className="flex-1 bg-slate-50 border border-slate-50 rounded-[2rem] p-5 font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none min-h-[120px]"
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <ImageIcon size={18} />
              Photo
            </button>
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <MapPin size={18} />
              Location
            </button>
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <Smile size={18} />
            </button>
          </div>
          
          <button 
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() || isPosting}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
          >
            {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isPosting ? 'Sharing...' : 'Share Moment'}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
            <p className="font-bold uppercase tracking-[0.2em] text-xs">Loading Shared Moments...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Camera size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No moments shared yet</h3>
            <p className="text-slate-500 font-medium">Be the first to share a moment with the global community!</p>
          </div>
        ) : posts.map((post) => (
          <article key={post.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500">
            {/* Post Header */}
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                  <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                    {post.user}
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-indigo-600">{post.petName}</span>
                    {post.userId === user?.uid && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatTime(post.createdAt)}</p>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-600 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-8 pb-6">
              <p className="text-slate-700 font-medium leading-relaxed text-lg">{post.content}</p>
            </div>

            {/* Post Image */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer">
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} />
              </div>
            </div>

            {/* Post Footer / Actions */}
            <div className="p-8 flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 font-black text-sm text-slate-500 hover:text-rose-500 transition-all group/btn">
                  <div className="p-2.5 rounded-xl bg-slate-50 group-hover/btn:bg-rose-50 group-hover/btn:text-rose-500 transition-all">
                    <Heart size={20} className={post.likes > 100 ? 'fill-rose-500 text-rose-500' : ''} />
                  </div>
                  {post.likes}
                </button>
                <button className="flex items-center gap-2 font-black text-sm text-slate-500 hover:text-indigo-600 transition-all group/btn">
                  <div className="p-2.5 rounded-xl bg-slate-50 group-hover/btn:bg-indigo-50 group-hover/btn:text-indigo-600 transition-all">
                    <MessageCircle size={20} />
                  </div>
                  {post.comments}
                </button>
              </div>
              
              <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Community;
