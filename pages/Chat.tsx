
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Phone, 
  Search, 
  MoreVertical, 
  User as UserIcon, 
  Loader2, 
  ArrowLeft,
  MessageSquare,
  AtSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, sendChatMessage } from '../services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc,
  Timestamp 
} from "firebase/firestore";
import { ChatSession, ChatMessage } from '../types';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastTimestamp", "desc")
    );

    // Fix: Refactored the async onSnapshot callback into a stable function to fix scoping and syntax errors.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updateSessionsList = async () => {
        const sessionData = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.participants.find((p: string) => p !== user.uid);
          const userDoc = await getDoc(doc(db, "users", otherId));
          const userData = userDoc.data();

          return {
            id: d.id,
            ...data,
            otherUser: {
              uid: otherId,
              displayName: userData?.displayName || 'Unknown User',
              photoURL: userData?.photoURL || '',
              phoneNumber: userData?.phoneNumber || '',
              username: userData?.username || ''
            }
          } as ChatSession;
        }));
        setSessions(sessionData);
        setLoading(false);
      };
      
      updateSessionsList();
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ChatMessage[];
      setMessages(msgData);
    });

    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;

    const text = newMessage;
    setNewMessage('');
    await sendChatMessage(activeChat.id, user.uid, text);
  };

  const handleCall = () => {
    if (activeChat?.otherUser?.phoneNumber) {
      window.location.href = `tel:${activeChat.otherUser.phoneNumber}`;
    } else {
      alert("This user hasn't shared their phone number yet.");
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-50 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Messages</h2>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 px-10">
              <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold text-sm">No messages yet. Start a chat from the community feed!</p>
            </div>
          ) : (
            sessions
              .filter(s => s.otherUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(session => (
              <button 
                key={session.id}
                onClick={() => setActiveChat(session)}
                className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-all border-b border-slate-50 ${activeChat?.id === session.id ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={session.otherUser?.photoURL || `https://ui-avatars.com/api/?name=${session.otherUser?.displayName}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-slate-800 truncate text-sm">@{session.otherUser?.username || 'user'}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{formatTime(session.lastTimestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-medium">{session.lastMessage || 'Start a conversation'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white p-4 md:px-8 border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-slate-400 hover:text-indigo-600"><ArrowLeft size={20} /></button>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                  <img src={activeChat.otherUser?.photoURL || `https://ui-avatars.com/api/?name=${activeChat.otherUser?.displayName}`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">{activeChat.otherUser?.displayName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <AtSign size={10} /> {activeChat.otherUser?.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCall}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all flex items-center gap-2 shadow-sm"
                  title="Call via Phone"
                >
                  <Phone size={20} />
                  <span className="hidden md:inline font-black text-xs uppercase tracking-widest">Call</span>
                </button>
                <button className="p-3 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-[2rem] shadow-sm relative ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest block mt-2 ${isMe ? 'text-white/60' : 'text-slate-300'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-4 max-w-4xl mx-auto">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
                >
                  <Send size={24} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8">
              <MessageSquare size={48} className="text-indigo-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">Your Inbox</h3>
            <p className="text-slate-500 font-medium max-w-sm">Select a conversation from the list or message a user from their community posts to start talking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
