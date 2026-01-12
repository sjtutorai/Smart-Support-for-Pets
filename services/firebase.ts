
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
  onSnapshot 
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
 * Force-saves user data to Firestore. 
 * Essential to call this on every login/signup to prevent "missing document" errors later.
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

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserToDb(result.user);
      return result.user;
    }
  } catch (error: any) {
    console.error("Google login error:", error.code, error.message);
    throw error;
  }
};

export const loginWithIdentifier = async (identifier: string, pass: string) => {
  try {
    let email = identifier;
    if (!identifier.includes('@')) {
      const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("Username not found. Try your email address.");
      }
      email = querySnapshot.docs[0].data().email;
    }
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) await syncUserToDb(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Login error:", error.code, error.message);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, fullName: string, username: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: fullName });
      await syncUserToDb(result.user, { displayName: fullName, username: username.toLowerCase() });
      return result.user;
    }
    throw new Error("Failed to create user session.");
  } catch (error: any) {
    console.error("Signup error:", error.code, error.message);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: { displayName?: string, username?: string, phoneNumber?: string }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No active session found.");

  const userRef = doc(db, "users", uid);
  const firestoreData: any = { ...data };
  if (data.username) firestoreData.username = data.username.toLowerCase().replace(/\s/g, '');
  
  try {
    // Crucial: setDoc with merge: true ensures document exists and avoids update errors.
    await setDoc(userRef, firestoreData, { merge: true });
    if (data.displayName) {
      await updateProfile(user, { displayName: data.displayName });
    }
    await user.reload();
    return auth.currentUser;
  } catch (err: any) {
    console.error("Profile update failed:", err);
    throw new Error(err.message || "Unable to save profile to database.");
  }
};

/**
 * Starts a new chat session or returns an existing one between two users.
 * Used for direct messaging in the community feed.
 */
export const startChat = async (currentUserId: string, targetUserId: string) => {
  const chatsRef = collection(db, "chats");
  
  // Check if a chat session between these two users already exists
  const q = query(chatsRef, where("participants", "array-contains", currentUserId));
  const querySnapshot = await getDocs(q);
  
  let existingChatId = "";
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.participants && data.participants.includes(targetUserId)) {
      existingChatId = doc.id;
    }
  });

  if (existingChatId) return existingChatId;

  // Create a new chat session if none exists
  const newChatDoc = await addDoc(chatsRef, {
    participants: [currentUserId, targetUserId],
    lastMessage: "",
    lastTimestamp: serverTimestamp()
  });

  return newChatDoc.id;
};

/**
 * Sends a message within a chat session and updates the session's last message preview.
 */
export const sendChatMessage = async (chatId: string, senderId: string, text: string) => {
  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");

  // Add the message to the messages subcollection
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: serverTimestamp()
  });

  // Update the parent chat document for sorting the messages list
  await updateDoc(chatRef, {
    lastMessage: text,
    lastTimestamp: serverTimestamp()
  });
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { FirebaseUser };
