"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import Link from 'next/link';

export default function MesAnnonces() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/connexion');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchUserAnnonces = async () => {
        try {
          const q = query(collection(db, 'annonces'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const annoncesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAnnonces(annoncesList);
        } catch (error) {
          console.error('Erreur lors du chargement des annonces :', error);
        }
      };
      fetchUserAnnonces();
    }
  }, [user]);

  // Supprimer une annonce
  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette annonce ?')) {
      try {
        await deleteDoc(doc(db, 'annonces', id));
        setAnnonces(annonces.filter((annonce) => annonce.id !== id));
        console.log('Annonce supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mes annonces</h1>
      {annonces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((annonce) => (
            <div key={annonce.id} className="bg-white p-4 rounded-lg shadow-md">
              <Link href={`/annonces/${annonce.id}`} className="block">
                {annonce.imageUrl && (
                  <img
                    src={annonce.imageUrl}
                    alt={annonce.titre}
                    className="w-full h-48 object-contain rounded-lg mb-4"
                  />
                )}
                <h2 className="text-xl font-semibold text-gray-800">{annonce.titre}</h2>
                <p className="text-gray-600 mt-2 line-clamp-2">{annonce.description}</p>
                <p className="text-blue-600 font-bold mt-2">{annonce.prix} MAD</p>
                <p className="text-gray-500 text-sm mt-1">Catégorie: {annonce.categorie}</p>
                <p className="text-gray-500 text-sm">Localisation: {annonce.localisation}</p>
              </Link>
              <div className="mt-4 flex space-x-2">
                <Link href={`/mes-annonces/modifier/${annonce.id}`}>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    Modifier
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(annonce.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Vous n’avez pas encore publié d’annonces.</p>
      )}
      <button
        onClick={() => router.back()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour à l’accueil
      </button>
    </div>
  );
}