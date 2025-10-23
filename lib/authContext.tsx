"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, phone: string, phoneCode: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => { throw new Error('Fonction signUp non initialisée'); },
  signIn: async () => { throw new Error('Fonction signIn non initialisée'); },
  logOut: async () => { throw new Error('Fonction logOut non initialisée'); },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signUp = async (email: string, password: string, phone: string, phoneCode: string) => {
    if (!phone || !phoneCode) {
      throw new Error('Le numéro de téléphone et le code pays sont obligatoires.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: '' }); // À ajuster si tu utilises name
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        phone,
        phoneCode,
        isPhonePublic: true,
        createdAt: new Date(),
      });

      return user;
    } catch (error) {
      console.error('Erreur lors de l’inscription :', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (!userData.phone || !userData.phoneCode) {
            router.push('/profil');
          }
        } else {
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email,
            phone: '',
            phoneCode: '+212',
            isPhonePublic: false,
          });
          router.push('/profil');
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);