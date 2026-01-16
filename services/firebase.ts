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
  deleteDoc
} from "firebase/firestore";
import { User, PetProfile } from '../types';

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

/**
 * Checks if a username is taken. 
 * If Firestore permissions block unauthenticated reads, it defaults to false 
 * to allow the user to proceed with account creation.
 */
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
    console.warn("Username availability check skipped (likely permissions):", err.message);
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
    console.error("Firestore sync failed:", err);
    return data;
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
  const lowerCaseUsername = username.toLowerCase().trim();
  const q = query(collection(db, "users"), where("username", "==", lowerCaseUsername), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const userDoc = querySnapshot.docs[0];
  return { uid: userDoc.id, ...userDoc.data() } as User;
};

export const getPetsByOwnerId = async (ownerId: string): Promise<PetProfile[]> => {
  if (!ownerId) return [];
  const q = query(collection(db, "pets"), where("ownerId", "==", ownerId), limit(10));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PetProfile);
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as User);
};

export const searchPetsAndOwners = async (searchText: string): Promise<{ pet: PetProfile, owner: User | null }[]> => {
  if (!searchText.trim()) return [];
  const lowerCaseSearch = searchText.toLowerCase();
  const petsQuery = query(
    collection(db, "pets"),
    where("lowercaseName", ">=", lowerCaseSearch),
    where("lowercaseName", "<=", lowerCaseSearch + '\uf8ff'),
    limit(10)
  );
  const ownersQuery = query(
    collection(db, "users"),
    where("lowercaseDisplayName", ">=", lowerCaseSearch),
    where("lowercaseDisplayName", "<=", lowerCaseSearch + '\uf8ff'),
    limit(10)
  );
  const [petsSnapshot, ownersSnapshot] = await Promise.all([getDocs(petsQuery), getDocs(ownersQuery)]);
  const resultsMap = new Map<string, { pet: PetProfile, owner: User | null }>();
  const petResults = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PetProfile);
  for (const pet of petResults) {
    if (!resultsMap.has(pet.id)) {
      const owner = pet.ownerId ? await getUserById(pet.ownerId) : null;
      resultsMap.set(pet.id, { pet, owner });
    }
  }
  const ownerResults = ownersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
  for (const owner of ownerResults) {
    const petsOfOwner = await getPetsByOwnerId(owner.uid);
    for (const pet of petsOfOwner) {
      if (!resultsMap.has(pet.id)) {
        resultsMap.set(pet.id, { pet, owner });
      }
    }
  }
  return Array.from(resultsMap.values());
};

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
  provider.addScope('email');
  provider.addScope('name');
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
  
  // If no @, assume it's a username and try to find the email
  if (!identifier.includes('@')) {
    try {
      const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase().trim()), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.email) email = userData.email;
      }
    } catch (err) {
      console.warn("Username lookup failed (permissions?), attempting direct login with identifier as email.");
    }
  }
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToDb(userCredential.user);
  return userCredential.user;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
  // 1. Check if username is taken
  const isTaken = await isUsernameTaken(username, '');
  if (isTaken) throw { code: 'auth/username-already-in-use' };
  
  // 2. Create the user
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;
  
  // 3. Update profile
  await updateProfile(user, { displayName: fullName });
  
  // 4. Send verification
  try {
    await sendEmailVerification(user);
  } catch (e) {
    console.warn("Verification email could not be sent:", e);
  }
  
  // 5. Sync to database
  await syncUserToDb(user, {
    displayName: fullName,
    username: username.toLowerCase().trim(),
  });
  
  return user;
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  } else if (!user) {
    throw new Error("No user session found to resend verification.");
  }
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, username?: string, phoneNumber?: string }) => {
  const { displayName, username, phoneNumber } = data;
  if (username) {
    const taken = await isUsernameTaken(username, uid);
    if (taken) throw new Error("Username already taken.");
  }
  const user = auth.currentUser;
  if (user && user.uid === uid && displayName && displayName !== user.displayName) {
    await updateProfile(user, { displayName });
  }
  const userRef = doc(db, "users", uid);
  const updateData: any = {};
  if (displayName !== undefined) {
    updateData.displayName = displayName;
    updateData.lowercaseDisplayName = displayName.toLowerCase();
  }
  if (username !== undefined) updateData.username = username.toLowerCase().trim();
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (Object.keys(updateData).length > 0) await updateDoc(userRef, updateData);
};

export const startChat = async (currentUserId: string, targetUserId: string): Promise<string> => {
  const participants = [currentUserId, targetUserId].sort();
  const q = query(collection(db, "chats"), where("participants", "==", participants), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) return querySnapshot.docs[0].id;
  const newChatRef = await addDoc(collection(db, "chats"), {
    participants,
    lastMessage: '',
    createdAt: serverTimestamp(),
    lastTimestamp: serverTimestamp(),
  });
  return newChatRef.id;
};

export const sendChatMessage = async (chatId: string, senderId: string, text: string) => {
  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(chatRef, "messages");
  await addDoc(messagesRef, { senderId, text, timestamp: serverTimestamp() });
  await updateDoc(chatRef, { lastMessage: text, lastTimestamp: serverTimestamp() });
};

export { onAuthStateChanged };
export type { FirebaseUser };