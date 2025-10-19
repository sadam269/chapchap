"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth } from '../../lib/authContext';

export default function Connexion() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Nouveau champ pour le nom
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Mettre à jour le displayName après création
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (user) {
    return null; // Redirigé par useEffect
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isSignUp ? 'Créer un compte' : 'Se connecter'}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {isSignUp && (
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-900 font-semibold mb-2">
              Nom
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Votre nom"
              required
            />
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-900 font-semibold mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Ex: utilisateur@example.com"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-900 font-semibold mb-2">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Votre mot de passe"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </button>
        <p className="text-gray-600 mt-4 text-center">
          {isSignUp ? 'Déjà un compte ?' : 'Pas de compte ?'}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline ml-1"
          >
            {isSignUp ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </form>
    </div>
  );
}