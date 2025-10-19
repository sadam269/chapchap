import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlxXb8UxBCnHqTbhBH3gElTB9GFMRqWbY",
  authDomain: "chapchap-af2b4.firebaseapp.com",
  projectId: "chapchap-af2b4",
  storageBucket: "chapchap-af2b4.firebasestorage.app",
  messagingSenderId: "685717840693",
  appId: "1:685717840693:web:fb16ee623cdfc4ad8be27c"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);

// Initialiser Authentication
export const auth = getAuth(app);