import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDtayfKmor42owPdJSNfPl73E5uJ_J-Exw",
  authDomain: "feverdreams-9c94c.firebaseapp.com", 
  projectId: "feverdreams-9c94c",
  storageBucket: "feverdreams-9c94c.firebasestorage.app",
  messagingSenderId: "33080240494",
  appId: "1:33080240494:web:a064d99ddaecb92851397f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);