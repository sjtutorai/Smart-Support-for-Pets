
import { initializeApp } from "firebase/app";
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
  User as FirebaseUser 
} from "firebase/auth";
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
  orderBy, 
  onSnapshot,
  deleteDoc,
  increment
} from "firebase/firestore";
import { AIChatMessage, AIChatSession } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCVUMhFhDzfbvF-iXthH6StOlI6mJreTmA",
  authDomain: "smart-support-for-pets.firebaseapp.com",
  projectId: "smart-support-for-pets",
  storageBucket: "smart-support-for-pets.firebasestorage.app",
  messagingSenderId: "737739952686",
  appId: "1:737739952686:web:17ecad5079401fb6ee05bf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// AI Chat Functions
export const createAIChatSession = async (userId: string, title: string) => {
  const sessionRef = await addDoc(collection(db, "users", userId, "ai_chats"), {
    title,
    lastTimestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return sessionRef.id;
};

export const saveAIChatMessage = async (userId: string, sessionId: string, message: AIChatMessage) => {
  const sessionRef = doc(db, "users", userId, "ai_chats", sessionId);
  await addDoc(collection(sessionRef, "messages"), {
    ...message,
    timestamp: serverTimestamp(),
  });
  await updateDoc(sessionRef, {
    lastTimestamp: serverTimestamp(),
  });
};

export const getAIChatMessages = async (userId: string, sessionId: string) => {
  const q = query(
    collection(db, "users", userId, "ai_chats", sessionId, "messages"),
    orderBy("timestamp", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AIChatMessage);
};

// User Functions
export const isUsernameTaken = async (username: string, excludeUid: string) => {
  if (!username) return false;
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase().trim()), 
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return false;
  return querySnapshot.docs[0].id !== excludeUid;
};

export const syncUserToDb = async (user: FirebaseUser, extraData: any = {}) => {
  const userRef = doc(db, "users", user.uid);
  const data = {
    uid: user.uid,
    email: user.email,
    displayName: extraData.displayName || user.displayName || 'Pet Parent',
    photoURL: user.photoURL || null,
    username: extraData.username || user.displayName?.toLowerCase().replace(/\s/g, '') || user.uid.slice(0, 8),
    lastLogin: new Date().toISOString(),
    ...extraData
  };
  try {
    await setDoc(userRef, data, { merge: true });
    return data;
  } catch (err) {
    console.error("Firestore sync failed:", err);
    return data;
  }
};

// Pet Functions
export const syncPetToDb = async (pet: any) => {
  const petRef = doc(db, "pets", pet.id);
  await setDoc(petRef, {
    ...pet,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getPetById = async (id: string) => {
  if (!id) return null;
  const petRef = doc(db, "pets", id);
  const snap = await getDoc(petRef);
  return snap.exists() ? snap.data() : null;
};

// Auth Actions
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account consent' });
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserToDb(result.user);
      return result.user;
    }
  } catch (error: any) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const loginWithApple = async () => {
  const provider = new OAuthProvider('apple.com');
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserToDb(result.user);
      return result.user;
    }
  } catch (error: any) {
    console.error("Apple login error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const loginWithIdentifier = async (identifier: string, password: string) => {
  let email = identifier.trim();
  if (!identifier.includes('@')) {
    const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase().trim()), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return signInWithEmailAndPassword(auth, identifier, password);
    const userData = querySnapshot.docs[0].data();
    if (!userData.email) throw { code: 'auth/invalid-credential', message: 'No email associated.' };
    email = userData.email;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToDb(userCredential.user);
  return userCredential.user;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
  const isTaken = await isUsernameTaken(username, '');
  if (isTaken) throw { code: 'auth/username-already-in-use', message: 'Username taken.' };
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });
  await syncUserToDb(user, { displayName: fullName, username: username.toLowerCase().trim() });
  return user;
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, username?: string, phoneNumber?: string }) => {
  const { displayName, username, phoneNumber } = data;
  if (username) {
    const taken = await isUsernameTaken(username, uid);
    if (taken) throw new Error("Username taken.");
  }
  const user = auth.currentUser;
  if (user && user.uid === uid && displayName && displayName !== user.displayName) {
    await updateProfile(user, { displayName });
  }
  const userRef = doc(db, "users", uid);
  const updateData: any = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (username !== undefined) updateData.username = username.toLowerCase().trim();
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (Object.keys(updateData).length > 0) await updateDoc(userRef, updateData);
};

// Social Functions
export const startChat = async (currentUserId: string, targetUserId: string): Promise<string> => {
  const participants = [currentUserId, targetUserId].sort();
  const q = query(collection(db, "chats"), where("participants", "==", participants), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) return querySnapshot.docs[0].id;
  const newChatRef = await addDoc(collection(db, "chats"), { participants, lastMessage: '', createdAt: serverTimestamp(), lastTimestamp: serverTimestamp() });
  return newChatRef.id;
};

export const sendChatMessage = async (chatId: string, senderId: string, text: string) => {
  const chatRef = doc(db, "chats", chatId);
  await addDoc(collection(chatRef, "messages"), { senderId, text, timestamp: serverTimestamp() });
  await updateDoc(chatRef, { lastMessage: text, lastTimestamp: serverTimestamp() });
};

// Commenting Functions
export const addCommentToPost = async (postId: string, userId: string, userName: string, userAvatar: string | null, text: string) => {
  const postRef = doc(db, "posts", postId);
  const commentsRef = collection(postRef, "comments");
  
  await addDoc(commentsRef, {
    userId,
    userName,
    userAvatar,
    text,
    createdAt: serverTimestamp()
  });

  await updateDoc(postRef, {
    comments: increment(1)
  });
};

export const getCommentsForPost = (postId: string, callback: (comments: any[]) => void) => {
  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const searchUsersByEmail = async (email: string, currentUserId: string) => {
  if (!email) return [];
  const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => user.id !== currentUserId);
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
  await setDoc(doc(db, 'users', currentUserId, 'following', targetUserId), { timestamp: serverTimestamp() });
  await setDoc(doc(db, 'users', targetUserId, 'followers', currentUserId), { timestamp: serverTimestamp() });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
  await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUserId));
};

export const onFollowsUpdate = (userId: string, callback: (data: { following: string[], followers: string[] }) => void) => {
  let following: string[] = [];
  let followers: string[] = [];
  const unsubFollowing = onSnapshot(query(collection(db, 'users', userId, 'following')), (snapshot) => {
    following = snapshot.docs.map(doc => doc.id);
    callback({ following, followers });
  });
  const unsubFollowers = onSnapshot(query(collection(db, 'users', userId, 'followers')), (snapshot) => {
    followers = snapshot.docs.map(doc => doc.id);
    callback({ following, followers });
  });
  return () => { unsubFollowing(); unsubFollowers(); };
};

export { onAuthStateChanged };
export type { FirebaseUser };
