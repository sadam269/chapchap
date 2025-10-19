"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AnnonceDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [annonce, setAnnonce] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnonce = async () => {
      try {
        const docRef = doc(db, 'annonces', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnnonce({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement de l’annonce :', error);
        setLoading(false);
      }
    };
    fetchAnnonce();
  }, [id]);

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!annonce) {
    return <div className="container mx-auto p-4">Annonce non trouvée.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md"> {/* Added darker background */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Détails de l’annonce</h1>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {annonce.imageUrl && (
          <img
            src={annonce.imageUrl}
            alt={annonce.titre}
            className="w-full h-64 object-contain rounded-lg mb-4"
          />
        )}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{annonce.titre}</h2>
        <p className="text-gray-600 mb-4">{annonce.description}</p>
        <p className="text-blue-600 font-bold text-xl mb-2">{annonce.prix} MAD</p>
        <p className="text-gray-500 mb-2">Catégorie: {annonce.categorie}</p>
        <p className="text-gray-500">Localisation: {annonce.localisation}</p>
      </div>
      <button
        onClick={() => router.back()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour à l’accueil
      </button>
    </div>
  );
}