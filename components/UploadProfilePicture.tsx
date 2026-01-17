
import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db, storage, onAuthStateChanged } from '../services/firebase';
import { Camera, Loader2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

const UploadProfilePicture: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfilePicture(userDocSnap.data().profilePictureUrl || userDocSnap.data().photoURL || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const fileExtension = file.name.split('.').pop();
    const storageRef = ref(storage, `profilePictures/${user.uid}.${fileExtension}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profilePictureUrl: downloadURL,
        photoURL: downloadURL // Sync with standard photoURL for consistency
      });

      setProfilePicture(downloadURL);
      setSuccess('Identity refreshed successfully!');
      setFile(null);
    } catch (err: any) {
      console.error('Error during upload:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Guardian Identity</h3>
        {success && <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in"><CheckCircle2 size={12}/> Success</div>}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[2rem] bg-white overflow-hidden border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                <Camera size={32} />
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 bg-theme text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
            <UploadCloud size={16} />
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </label>
        </div>

        <div className="flex-1 space-y-3 w-full">
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-center sm:text-left">
            Upload a professional or personal photo to represent you in the Paw Pal network.
          </p>
          
          <div className="flex gap-2">
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : "Commit Change"}
            </button>
            {file && !uploading && (
              <button onClick={() => setFile(null)} className="px-4 py-3.5 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">
                Reset
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mt-2">
              <AlertCircle size={12}/> {error}
            </div>
          )}
        </div>
      </div>
      
      {file && (
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-[10px] font-black text-slate-400 uppercase truncate max-w-[150px]">{file.name}</span>
          <span className="text-[10px] font-black text-theme uppercase">Ready to Sync</span>
        </div>
      )}
    </div>
  );
};

export default UploadProfilePicture;
