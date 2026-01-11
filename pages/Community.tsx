
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
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  user: string;
  avatar: string;
  petName: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  time: string;
  isUser?: boolean;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    // Load pet data
    const savedPet = localStorage.getItem(`pet_${user?.uid}`);
    if (savedPet) setPet(JSON.parse(savedPet));

    // Initial Mock Feed
    const mockPosts: Post[] = [
      {
        id: '1',
        user: 'Sarah Miller',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        petName: 'Bella',
        content: 'Bella finally learned how to "shake" today! So proud of my clever girl. 🐾✨',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
        likes: 124,
        comments: 12,
        time: '2h ago'
      },
      {
        id: '2',
        user: 'David Chen',
        avatar: 'https://i.pravatar.cc/150?u=david',
        petName: 'Nimbus',
        content: 'Is it just me, or do Persians always look like they are judging your life choices? 😂',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
        likes: 89,
        comments: 5,
        time: '5h ago'
      },
      {
        id: '3',
        user: 'Emma Wilson',
        avatar: 'https://i.pravatar.cc/150?u=emma',
        petName: 'Oliver',
        content: 'Enjoying the sunset at Central Park. Oliver loves the fresh air!',
        image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=800',
        likes: 245,
        comments: 18,
        time: '8h ago'
      }
    ];

    // Load user's local posts if any
    const savedLocalPosts = localStorage.getItem(`community_posts_${user?.uid}`);
    const localPosts = savedLocalPosts ? JSON.parse(savedLocalPosts) : [];
    
    setPosts([...localPosts, ...mockPosts]);
  }, [user]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsPosting(true);

    const newPost: Post = {
      id: Date.now().toString(),
      user: user?.displayName || 'Pet Parent',
      avatar: user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`,
      petName: pet?.name || 'My Pet',
      content: newPostContent,
      image: `https://picsum.photos/seed/${Date.now()}/800/600`,
      likes: 0,
      comments: 0,
      time: 'Just now',
      isUser: true
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    
    // Persist user post locally
    const savedLocalPosts = localStorage.getItem(`community_posts_${user?.uid}`);
    const localPosts = savedLocalPosts ? JSON.parse(savedLocalPosts) : [];
    localStorage.setItem(`community_posts_${user?.uid}`, JSON.stringify([newPost, ...localPosts]));

    setNewPostContent('');
    setTimeout(() => setIsPosting(false), 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Community Feed</h2>
          <p className="text-slate-500 font-medium">Share moments and connect with other pet parents.</p>
        </div>
        <div className="hidden md:flex -space-x-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
              <img src={`https://i.pravatar.cc/150?u=friend${i}`} alt="User" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            +2.4k
          </div>
        </div>
      </div>

      {/* Post Composer */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
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
            {isPosting ? 'Posting...' : 'Share Moment'}
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-10">
        {posts.map((post) => (
          <article key={post.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            {/* Post Header */}
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                  <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 flex items-center gap-1.5">
                    {post.user}
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-indigo-600">{post.petName}</span>
                    {post.isUser && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{post.time}</p>
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
