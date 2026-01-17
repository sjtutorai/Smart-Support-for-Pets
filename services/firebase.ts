import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  collection, 
  query, 
  where, 
  limit, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  deleteDoc,
  writeBatch,
  orderBy,
  startAfter,
  documentId
} from 'firebase/firestore';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { User as AppUser, PetProfile, FollowStatus } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCVUMhFhDzfbvF-iXthH6StOlI6mJreTmA",
  authDomain: "smart-support-for-pets.firebaseapp.com",
  databaseURL: "https://smart-support-for-pets-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-support-for-pets",
  storageBucket: "smart-support-for-pets.firebasestorage.app",
  messagingSenderId: "737739952686",
  appId: "1:737739952686:web:17ecad5079401fb6ee05bf"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Check if username is already in use
export const isUsernameTaken = async (username: string, excludeUid: string) => {
  if (!username) return false;
  try {
    const q = query(
      collection(db, "users"), 
      where("username", "==", username.toLowerCase().trim()), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return false;
    return querySnapshot.docs[0].id !== excludeUid;
  } catch (err: any) {
    return false; 
  }
};

// Sync auth user data to Firestore
export const syncUserToDb = async (user: FirebaseUser, extraData: any = {}) => {
  const userRef = doc(db, "users", user.uid);
  const displayName = extraData.displayName || user.displayName || user.email?.split('@')[0] || 'Pet Parent';
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    photoURL: user.photoURL || null,
    username: extraData.username || user.displayName?.toLowerCase().replace(/\s/g, '') || user.uid.slice(0, 8),
    lastLogin: new Date().toISOString(),
    lowercaseDisplayName: displayName.toLowerCase(),
    ...extraData
  };
  
  try {
    await setDoc(userRef, data, { merge: true });
    return data;
  } catch (err) {
    return data;
  }
};

// Update existing user profile in Firestore
export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, "users", uid);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  if (data.displayName) {
    updateData.lowercaseDisplayName = data.displayName.toLowerCase();
  }
  await updateDoc(userRef, updateData);
};

// Resend email verification
export const resendVerificationEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};

// Sync pet profile to Firestore
export const syncPetToDb = async (pet: any) => {
  const petRef = doc(db, "pets", pet.id);
  await setDoc(petRef, {
    ...pet,
    lowercaseName: pet.name?.toLowerCase() || '',
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// Delete pet profile from Firestore
export const deletePet = async (petId: string) => {
  if (!petId) return;
  await deleteDoc(doc(db, "pets", petId));
};

// Fetch pet by ID
export const getPetById = async (id: string) => {
  if (!id) return null;
  const petRef = doc(db, "pets", id);
  const snap = await getDoc(petRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } as PetProfile : null;
};

// Fetch user by ID
export const getUserById = async (id: string) => {
  if (!id) return null;
  const userRef = doc(db, "users", id);
  const snap = await getDoc(userRef);
  return snap.exists() ? { uid: snap.id, ...snap.data() } as AppUser : null;
};

// Fetch user by username
export const getUserByUsername = async (username: string): Promise<AppUser | null> => {
  if (!username) return null;
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase().trim()), 
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as AppUser;
};

// Fetch pets owned by a specific user
export const getPetsByOwnerId = async (ownerId: string): Promise<PetProfile[]> => {
  if (!ownerId) return [];
  const q = query(collection(db, "pets"), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PetProfile);
};

// Fetch all users with a limit - optimized for faster initial load
export const getAllUsers = async (count: number = 100): Promise<AppUser[]> => {
  const q = query(collection(db, "users"), limit(count));
  const usersSnapshot = await getDocs(q);
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as AppUser);
};

// Fetch paginated users - uses documentId for fastest possible indexing-free sorting
export const getUsersPaginated = async (pageSize: number, lastDoc: QueryDocumentSnapshot | null = null) => {
  let q = query(
    collection(db, "users"), 
    orderBy(documentId()), 
    limit(pageSize)
  );
  
  if (lastDoc) {
    q = query(
      collection(db, "users"), 
      orderBy(documentId()), 
      startAfter(lastDoc), 
      limit(pageSize)
    );
  }
  
  const snapshot = await getDocs(q);
  const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as AppUser);
  return {
    users,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] as QueryDocumentSnapshot || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

// Login with Google Popup
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  if (result.user) await syncUserToDb(result.user);
  return result.user;
};

// Login with Apple Popup
export const loginWithApple = async () => {
  const provider = new OAuthProvider('apple.com');
  const result = await signInWithPopup(auth, provider);
  if (result.user) await syncUserToDb(result.user);
  return result.user;
};

// Sign out from auth
export const logout = () => signOut(auth);

// Login with email or username
export const loginWithIdentifier = async (identifier: string, password: string) => {
  let email = identifier.trim();
  if (!identifier.includes('@')) {
    const q = query(
      collection(db, "users"), 
      where("username", "==", identifier.toLowerCase().trim()), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      email = querySnapshot.docs[0].data().email;
    }
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToDb(userCredential.user);
  return userCredential.user;
};

// Sign up with email, password, and profile data
export const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
  if (await isUsernameTaken(username, '')) throw { code: 'auth/username-already-in-use' };
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });
  await syncUserToDb(user, { displayName: fullName, username: username.toLowerCase().trim() });
  return user;
};

// Start or retrieve a chat session between two users
export const startChat = async (currentUserId: string, targetUserId: string): Promise<string> => {
  const participants = [currentUserId, targetUserId].sort();
  const q = query(collection(db, "chats"), where("participants", "==", participants), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) return querySnapshot.docs[0].id;
  
  const newChatRef = await addDoc(collection(db, "chats"), { 
    participants, 
    lastMessage: '', 
    createdAt: serverTimestamp(), 
    lastTimestamp: serverTimestamp() 
  });
  return newChatRef.id;
};

// Send a chat message within a session
export const sendChatMessage = async (chatId: string, senderId: string, text: string) => {
  const chatRef = doc(db, "chats", chatId);
  await addDoc(collection(chatRef, "messages"), { 
    senderId, 
    text, 
    timestamp: serverTimestamp() 
  });
  await updateDoc(chatRef, { 
    lastMessage: text, 
    lastTimestamp: serverTimestamp() 
  });
};

// Retrieve follow status between two users
export const getFollowStatus = async (followerId: string, followingId: string): Promise<FollowStatus> => {
  if (followerId === followingId) return 'is_self';
  const q = query(
    collection(db, "follows"), 
    where("followerId", "==", followerId), 
    where("followingId", "==", followingId), 
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 'not_following';
  return snapshot.docs[0].data().status === 'pending' ? 'pending' : 'following';
};

// Request to follow another user
export const requestFollow = async (followerId: string, followerName: string, followingId: string) => {
  const followRef = await addDoc(collection(db, "follows"), { 
    followerId, 
    followingId, 
    status: 'pending', 
    createdAt: serverTimestamp() 
  });
  await addDoc(collection(db, "notifications"), { 
    userId: followingId, 
    type: 'follow_request', 
    fromUserId: followerId, 
    fromUserName: followerName, 
    read: false, 
    timestamp: serverTimestamp(), 
    relatedId: followRef.id 
  });
};

// Handle follow request action (accept or decline)
export const handleFollowRequestAction = async (notificationId: string, followId: string, action: 'accept' | 'decline') => {
  const batch = writeBatch(db);
  if (action === 'accept') {
    batch.update(doc(db, "follows", followId), { status: 'accepted' });
  } else {
    batch.delete(doc(db, "follows", followId));
  }
  batch.update(doc(db, "notifications", notificationId), { read: true }); 
  await batch.commit();
};

export { onAuthStateChanged };
export type { FirebaseUser, QueryDocumentSnapshot };