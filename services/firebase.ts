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
  sendEmailVerification,
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
  onSnapshot,
  deleteDoc,
  writeBatch,
  orderBy
} from "firebase/firestore";
import { User, PetProfile, FollowStatus } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCVUMhFhDzfbvF-iXthH6StOlI6mJreTmA",
  authDomain: "smart-support-for-pets.firebaseapp.com",
  databaseURL: "https://smart-support-for-pets-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-support-for-pets",
  storageBucket: "smart-support-for-pets.firebasestorage.app",
  messagingSenderId: "737739952686",
  appId: "1:737739952686:web:17ecad5079401fb6ee05bf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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

export const syncUserToDb = async (user: FirebaseUser, extraData: any = {}) => {
  const userRef = doc(db, "users", user.uid);
  const displayName = extraData.displayName || user.displayName || 'Pet Parent';
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

export const updateUserProfile = async (uid: string, data: any) => {
  const userRef = doc(db, "users", uid);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  if (data.displayName) {
    updateData.lowercaseDisplayName = data.displayName.toLowerCase();
  }
  await setDoc(userRef, updateData, { merge: true });
};

export const resendVerificationEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};

export const syncPetToDb = async (pet: any) => {
  const petRef = doc(db, "pets", pet.id);
  await setDoc(petRef, {
    ...pet,
    lowercaseName: pet.name?.toLowerCase() || '',
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deletePet = async (petId: string) => {
  if (!petId) return;
  await deleteDoc(doc(db, "pets", petId));
};

export const getPetById = async (id: string) => {
  if (!id) return null;
  const petRef = doc(db, "pets", id);
  const snap = await getDoc(petRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } as PetProfile : null;
};

export const getUserById = async (id: string) => {
  if (!id) return null;
  const userRef = doc(db, "users", id);
  const snap = await getDoc(userRef);
  return snap.exists() ? { uid: snap.id, ...snap.data() } as User : null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  if (!username) return null;
  const q = query(collection(db, "users"), where("username", "==", username.toLowerCase().trim()), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
};

export const getPetsByOwnerId = async (ownerId: string): Promise<PetProfile[]> => {
  if (!ownerId) return [];
  const q = query(collection(db, "pets"), where("ownerId", "==", ownerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PetProfile);
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  if (result.user) await syncUserToDb(result.user);
  return result.user;
};

export const loginWithApple = async () => {
  const provider = new OAuthProvider('apple.com');
  const result = await signInWithPopup(auth, provider);
  if (result.user) await syncUserToDb(result.user);
  return result.user;
};

export const logout = () => signOut(auth);

export const loginWithIdentifier = async (identifier: string, password: string) => {
  let email = identifier.trim();
  if (!identifier.includes('@')) {
    const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase().trim()), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) email = querySnapshot.docs[0].data().email;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToDb(userCredential.user);
  return userCredential.user;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
  if (await isUsernameTaken(username, '')) throw { code: 'auth/username-already-in-use' };
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });
  await syncUserToDb(user, { displayName: fullName, username: username.toLowerCase().trim() });
  return user;
};

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

export const getFollowStatus = async (followerId: string, followingId: string): Promise<FollowStatus> => {
  if (followerId === followingId) return 'is_self';
  const q = query(collection(db, "follows"), where("followerId", "==", followerId), where("followingId", "==", followingId), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 'not_following';
  return snapshot.docs[0].data().status === 'pending' ? 'pending' : 'following';
};

export const requestFollow = async (followerId: string, followerName: string, followingId: string) => {
  const followRef = await addDoc(collection(db, "follows"), { followerId, followingId, status: 'pending', createdAt: serverTimestamp() });
  await addDoc(collection(db, "notifications"), { userId: followingId, type: 'follow_request', fromUserId: followerId, fromUserName: followerName, read: false, timestamp: serverTimestamp(), relatedId: followRef.id });
};

export const handleFollowRequestAction = async (notificationId: string, followId: string, action: 'accept' | 'decline') => {
  const batch = writeBatch(db);
  if (action === 'accept') batch.update(doc(db, "follows", followId), { status: 'accepted' });
  else batch.delete(doc(db, "follows", followId));
  batch.update(doc(db, "notifications", notificationId), { read: true }); 
  await batch.commit();
};

export { onAuthStateChanged };
export type { FirebaseUser };