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

// Updated Firebase configuration from user input
const firebaseConfig = {
  apiKey: "AIzaSyCVUMhFhDzfbvF-iXthH6StOlI6mJreTmA",
  authDomain: "smart-support-for-pets.firebaseapp.com",
  projectId: "smart-support-for-pets",
  storageBucket: "smart-support-for-pets.firebasestorage.app",
  messagingSenderId: "737739952686",
  appId: "1:737739952686:web:17ecad5079401fb6ee05bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Email login failed:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    // Explicitly update the profile
    await updateProfile(result.user, { displayName });
    // IMPORTANT: Force a reload of the user object to get the updated profile data immediately
    await result.user.reload();
    // Return the freshest user object from the auth instance
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