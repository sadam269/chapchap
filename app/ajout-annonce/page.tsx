"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';

export default function AjoutAnnonce() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [categorie, setCategorie] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour ajouter une annonce.');
      return;
    }

    try {
      await addDoc(collection(db, 'annonces'), {
        titre,
        description,
        prix: parseFloat(prix),
        categorie,
        localisation,
        imageUrl,
        userId: user.uid, // Ajout de l'userId de l'utilisateur connecté
        status: 'pending', // Statut par défaut
        createdAt: new Date().toISOString(),
      });
      router.push('/mes-annonces');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'annonce :', error);
      setError('Erreur lors de l\'ajout de l\'annonce.');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Ajouter une Annonce</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-gray-700">Titre</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Prix (MAD)</label>
          <input
            type="number"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Catégorie</label>
          <input
            type="text"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Localisation</label>
          <input
            type="text"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">URL de l'image</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Ajouter l'annonce
        </button>
      </form>
    </div>
  );
}