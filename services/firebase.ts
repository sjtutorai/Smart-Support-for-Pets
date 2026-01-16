import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
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
  deleteDoc
} from "firebase/firestore";

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

/**
 * Checks if a username is already taken by a different user.
 */
export const isUsernameTaken = async (username: string, excludeUid: string) => {
  if (!username) return false;
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase().trim()), 
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return false;
  
  // Taken if the existing document belongs to a different UID
  return querySnapshot.docs[0].id !== excludeUid;
};

/**
 * Force-saves user data to Firestore. 
 */
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

/**
 * Syncs pet profile to global Firestore collection.
 */
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

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account consent' });
  provider.addScope('profile');
  provider.addScope('email');
  
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

export const logout = () => {
  return signOut(auth);
};

export const loginWithIdentifier = async (identifier: string, password: string) => {
  let email = identifier.trim();
  if (!identifier.includes('@')) {
    const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase().trim()), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return signInWithEmailAndPassword(auth, identifier, password);
    }
    const userData = querySnapshot.docs[0].data();
    if (!userData.email) {
      throw { code: 'auth/invalid-credential', message: 'No email associated with this username.' };
    }
    email = userData.email;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToDb(userCredential.user);
  return userCredential.user;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string, username: string) => {
  const isTaken = await isUsernameTaken(username, '');
  if (isTaken) {
    throw { code: 'auth/username-already-in-use', message: 'This username is already taken.' };
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, { displayName: fullName });
  await syncUserToDb(user, {
    displayName: fullName,
    username: username.toLowerCase().trim(),
  });
  return user;
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, username?: string, phoneNumber?: string }) => {
  const { displayName, username, phoneNumber } = data;
  if (username) {
    const taken = await isUsernameTaken(username, uid);
    if (taken) {
      throw new Error("That username is already taken. Please try another.");
    }
  }

  const user = auth.currentUser;
  if (user && user.uid === uid) {
    if (displayName && displayName !== user.displayName) {
      await updateProfile(user, { displayName });
    }
  }
  
  const userRef = doc(db, "users", uid);
  const updateData: any = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (username !== undefined) updateData.username = username.toLowerCase().trim();
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

  if (Object.keys(updateData).length > 0) {
    await updateDoc(userRef, updateData);
  }
};

export const startChat = async (currentUserId: string, targetUserId: string): Promise<string> => {
  const participants = [currentUserId, targetUserId].sort();
  const q = query(
    collection(db, "chats"),
    where("participants", "==", participants),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
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
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });
  await updateDoc(chatRef, {
    lastMessage: text,
    lastTimestamp: serverTimestamp(),
  });
};

export const searchUsersByEmail = async (email: string, currentUserId: string) => {
  if (!email) return [];
  const q = query(
    collection(db, "users"),
    where("email", "==", email.toLowerCase().trim())
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => user.id !== currentUserId);
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  await setDoc(followingRef, { timestamp: serverTimestamp() });
  const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  await setDoc(followersRef, { timestamp: serverTimestamp() });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
  await deleteDoc(followingRef);
  const followersRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
  await deleteDoc(followersRef);
};

export const onFollowsUpdate = (
  userId: string,
  callback: (data: { following: string[], followers: string[] }) => void
) => {
  const followingQuery = query(collection(db, 'users', userId, 'following'));
  const followersQuery = query(collection(db, 'users', userId, 'followers'));

  let following: string[] = [];
  let followers: string[] = [];
  let combinedData = { following, followers };

  const unsubFollowing = onSnapshot(followingQuery, (snapshot) => {
    following = snapshot.docs.map(doc => doc.id);
    combinedData = { ...combinedData, following };
    callback(combinedData);
  });

  const unsubFollowers = onSnapshot(followersQuery, (snapshot) => {
    followers = snapshot.docs.map(doc => doc.id);
    combinedData = { ...combinedData, followers };
    callback(combinedData);
  });

  return () => {
    unsubFollowing();
    unsubFollowers();
  };
};

export const checkMutualFollow = async (userId1: string, userId2: string) => {
  const user1Follows2Doc = await getDoc(doc(db, 'users', userId1, 'following', userId2));
  if (!user1Follows2Doc.exists()) return false;
  
  const user2Follows1Doc = await getDoc(doc(db, 'users', userId2, 'following', userId1));
  return user2Follows1Doc.exists();
};

export { onAuthStateChanged };
export type { FirebaseUser };