
import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Contact: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSending(true);

    // Build the mailto link
    const mailtoLink = `mailto:support@sspawpal.com?subject=${encodeURIComponent(formData.subject || 'Inquiry from SS Paw Pal User')}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;

    // Simulate sending delay for UI feedback
    setTimeout(() => {
      window.location.href = mailtoLink;
      setIsSending(false);
      setIsSuccess(true);
      addNotification('Signal Dispatched', 'Your message relay has been initiated.', 'success');
      
      // Reset success state after a few seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-5xl mx-auto pb-32 space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-2 transition-theme">Support Portal</div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Get in Touch</h2>
          <p className="text-slate-500 font-medium text-lg">Connect with the SS Paw Pal core engineering team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Mail size={120}/></div>
            
            <div className="relative z-10 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Direct Channels</h4>
              <h3 className="text-3xl font-black tracking-tight">Relay Intel</h3>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-white/10 rounded-2xl text-indigo-300"><Mail size={20} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Email Terminal</p>
                  <p className="font-bold text-sm">support@sspawpal.com</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="p-3 bg-white/10 rounded-2xl text-indigo-300"><Phone size={20} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Crisis Hotline</p>
                  <p className="font-bold text-sm">+1 (888) PAW-PAL-0</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="p-3 bg-white/10 rounded-2xl text-indigo-300"><Zap size={20} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Response Time</p>
                  <p className="font-bold text-sm">&lt; 24h Synchronized</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">End-to-End Encrypted Relay</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MessageSquare size={20} /></div>
                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Community FAQ</h4>
             </div>
             <p className="text-sm text-slate-500 font-medium leading-relaxed">Check our community discovery hub for quick answers from other guardians before opening a relay ticket.</p>
             <button className="w-full mt-6 py-4 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                Visit Discovery Hub <ArrowRight size={14} />
             </button>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-50 shadow-sm relative overflow-hidden transition-all duration-700">
            {isSuccess && (
              <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center text-center p-12 animate-in fade-in">
                <div className="p-6 bg-emerald-50 text-emerald-600 rounded-full mb-6 animate-bounce">
                  <CheckCircle2 size={64} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Transmission Started</h3>
                <p className="text-slate-500 font-medium mt-4 max-w-sm mx-auto">Your mail client has been opened. Please complete the send action from there. We'll be in touch soon!</p>
                <button onClick={() => setIsSuccess(false)} className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Close Overlay</button>
              </div>
            )}

            <form onSubmit={handleSendMail} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Identity</label>
                  <input 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name" 
                    className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-8 ring-indigo-500/5 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Communication Hub (Email)</label>
                  <input 
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address" 
                    className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-8 ring-indigo-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Topic Protocol (Subject)</label>
                <input 
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this regarding?" 
                  className="w-full p-6 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-8 ring-indigo-500/5 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Encrypted Message Payload</label>
                <textarea 
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your Message..." 
                  className="w-full p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-8 ring-indigo-500/5 transition-all resize-none min-h-[250px]"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSending}
                className="w-full bg-slate-900 text-white py-6 rounded-full font-black text-xl hover:bg-black transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                {isSending ? 'Transmitting...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
