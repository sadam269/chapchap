"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '../../lib/authContext';
import { FaHeart } from 'react-icons/fa';

export default function Favoris() {
  const [favoris, setFavoris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavoris = async () => {
      if (!user) {
        setError('Vous devez être connecté pour voir vos favoris.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const favorisSnapshot = await getDocs(
          query(collection(db, 'favoris'), where('userId', '==', user.uid))
        );
        console.log('Favoris snapshot:', favorisSnapshot.docs.map(doc => doc.data())); // Débogage
        const favorisList = await Promise.all(
          favorisSnapshot.docs.map(async (favoriDoc) => {
            const annonceId = favoriDoc.data().annonceId;
            const annonceRef = doc(db, 'annonces', annonceId); // Référence directe au document
            const annonceSnapshot = await getDoc(annonceRef);
            if (annonceSnapshot.exists()) {
              const annonceData = annonceSnapshot.data();
              return {
                id: annonceId,
                favoriDocId: favoriDoc.id,
                ...annonceData,
              };
            }
            console.warn(`Aucune annonce trouvée pour l'ID: ${annonceId}`); // Débogage
            return null;
          })
        );
        setFavoris(favorisList.filter((item) => item !== null));
      } catch (error) {
        console.error('Erreur lors du chargement des favoris :', error);
        setError('Erreur lors du chargement des favoris.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavoris();
  }, [user]);

  const removeFromFavoris = async (favoriDocId: string, annonceId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'favoris', favoriDocId));
      setFavoris((prev) => prev.filter((annonce) => annonce.id !== annonceId));
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris :', error);
      setError('Erreur lors de la suppression des favoris.');
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Veuillez vous connecter pour voir vos favoris.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Mes Favoris</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {favoris.length === 0 ? (
        <p className="text-gray-600">Aucun favori pour le moment. Ajoutez des annonces depuis la page d’accueil !</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoris.map((annonce) => (
            <div key={annonce.id} className="bg-white p-4 rounded-lg shadow-md">
              <Link href={`/annonces/${annonce.id}`}>
                <div>
                  {annonce.imageUrl && (
                    <img
                      src={annonce.imageUrl}
                      alt={annonce.titre || 'Article favori'}
                      className="w-full h-48 object-contain rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800">{annonce.titre || 'Titre inconnu'}</h2>
                  <p className="text-gray-600 mt-2 line-clamp-2">{annonce.description || 'Aucune description'}</p>
                  {annonce.prix && (
                    <p className="text-blue-600 font-bold mt-2">{annonce.prix} MAD</p>
                  )}
                  {annonce.categorie && (
                    <p className="text-gray-500 text-sm mt-1">Catégorie: {annonce.categorie}</p>
                  )}
                  {annonce.localisation && (
                    <p className="text-gray-500 text-sm">Localisation: {annonce.localisation}</p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => removeFromFavoris(annonce.favoriDocId, annonce.id)}
                className="mt-2 bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition flex items-center"
              >
                <FaHeart size={16} className="mr-1" /> Supprimer des favoris
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}