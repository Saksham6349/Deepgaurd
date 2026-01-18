import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ScanHistoryItem } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAjjVRpKVhZL89ZufkYuvjyRkht0gKoD4M",
  authDomain: "deepfraud-ef936.firebaseapp.com",
  projectId: "deepfraud-ef936",
  storageBucket: "deepfraud-ef936.firebasestorage.app",
  messagingSenderId: "1025168785871",
  appId: "1:1025168785871:web:08c49508cf55fdd3a252ba",
  measurementId: "G-GNENHY30SY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth Functions - Simplified to return promises directly
// This prevents double logging of errors in the console
export const loginWithGoogle = async () => {
  await signInWithPopup(auth, googleProvider);
};

export const registerWithEmail = async (email: string, password: string) => {
  await createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  await signOut(auth);
};

// Firestore Functions
export const saveScanResult = async (item: ScanHistoryItem) => {
  // Clean data and add server timestamp
  // We create a new object to ensure no undefined values are passed (which Firestore dislikes)
  const docData = {
    ...item,
    thumbnail: item.thumbnail || null, // Ensure undefined is null
    createdAt: Timestamp.now()
  };
  
  await addDoc(collection(db, 'scans'), docData);
};

export const subscribeToHistory = (callback: (items: ScanHistoryItem[]) => void) => {
  const q = query(collection(db, 'scans'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove the internal firestore timestamp before passing to the app
      // We rely on the 'result.timestamp' for UI display
      const { createdAt, ...itemData } = data;
      return itemData as ScanHistoryItem;
    });
    callback(items);
  });
};