
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
import { getFirestore, doc, setDoc, getDocs, collection, query, where, limit, updateDoc } from "firebase/firestore";

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
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync user to firestore
    await setDoc(doc(db, "users", result.user.uid), {
      username: result.user.displayName?.toLowerCase().replace(/\s/g, '') || result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    }, { merge: true });
    return result.user;
  } catch (error: any) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const loginWithIdentifier = async (identifier: string, pass: string) => {
  try {
    let email = identifier;
    // Check if identifier is a username (doesn't contain @)
    if (!identifier.includes('@')) {
      const q = query(collection(db, "users"), where("username", "==", identifier.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("Username not found.");
      }
      email = querySnapshot.docs[0].data().email;
    }
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const checkUsernameUnique = async (username: string, currentUid: string) => {
  const q = query(
    collection(db, "users"), 
    where("username", "==", username.toLowerCase()), 
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return true;
  
  // If it's the current user's own username, it's technically "available" for them to keep
  return querySnapshot.docs[0].id === currentUid;
};

export const updateUsername = async (uid: string, newUsername: string) => {
  const isUnique = await checkUsernameUnique(newUsername, uid);
  if (!isUnique) {
    throw new Error("This username is already taken. Please try another one.");
  }
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    username: newUsername.toLowerCase()
  });
};

export const signUpWithEmail = async (email: string, pass: string, displayName: string, username: string) => {
  try {
    // 1. Check if username exists
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("Username already taken.");
    }

    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName });
    
    // 2. Store user in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
      username: username.toLowerCase(),
      email: email,
      displayName: displayName,
      createdAt: new Date().toISOString()
    });

    await result.user.reload();
    return auth.currentUser;
  } catch (error: any) {
    console.error("Sign up failed:", error);
    throw error;
  }
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
