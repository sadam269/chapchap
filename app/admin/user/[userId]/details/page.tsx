"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

export default function UserAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { userId } = useParams(); // Récupère l'userId depuis l'URL
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [visibleAnnonces, setVisibleAnnonces] = useState(6); // Limite initiale
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie: '',
    localisation: '',
    imageUrl: '',
  });
  const ADMIN_EMAIL = 'masta@gmail.com';

  // Rediriger si non admin
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Charger les annonces de l'utilisateur
  useEffect(() => {
    const fetchAnnonces = async () => {
      if (!userId || typeof userId !== 'string') {
        console.error('userId non défini ou invalide:', userId);
        return;
      }
      try {
        console.log('Requête Firestore pour userId:', userId);
        const annoncesQuery = query(collection(db, 'annonces'), where('userId', '==', userId));
        const annoncesSnapshot = await getDocs(annoncesQuery);
        const annoncesList = annoncesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'pending',
        }));
        console.log('Annonces récupérées:', annoncesList);
        setAnnonces(annoncesList);
      } catch (error) {
        console.error('Erreur lors du chargement des annonces :', error);
      }
    };
    fetchAnnonces();
  }, [userId]);

  // Supprimer une annonce
  const handleDeleteAnnonce = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette annonce ?')) {
      try {
        await deleteDoc(doc(db, 'annonces', id));
        setAnnonces(annonces.filter((annonce) => annonce.id !== id));
        console.log('Annonce supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'annonce :', error);
      }
    }
  };

  // Approuver/Bloquer une annonce
  const handleToggleAnnonceStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'approved' : 'pending';
    try {
      await updateDoc(doc(db, 'annonces', id), { status: newStatus });
      const annonceRef = doc(db, 'annonces', id);
      const annonceDoc = await getDoc(annonceRef);
      const annonce = { id, ...annonceDoc.data() };
      let message = '';
      let type = '';
      if (newStatus === 'approved') {
        message = `Votre annonce "${annonce.titre}" a été approuvée.`;
        type = 'annonce_approbation';
      } else {
        message = `Votre annonce "${annonce.titre}" a été bloquée.`;
        type = 'annonce_blocage';
      }
      await addDoc(collection(db, 'notifications'), {
        userId: annonce.userId,
        message,
        type,
        createdAt: serverTimestamp(),
        read: false,
      });
      setAnnonces(annonces.map((annonce) =>
        annonce.id === id ? { ...annonce, status: newStatus } : annonce
      ));
      console.log(`Annonce ${id} mise à jour : ${newStatus}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  };

  // Ouvrir le formulaire d'édition
  const handleEdit = (annonce: any) => {
    setEditingId(annonce.id);
    setEditForm({
      titre: annonce.titre,
      description: annonce.description,
      prix: annonce.prix.toString(),
      categorie: annonce.categorie,
      localisation: annonce.localisation,
      imageUrl: annonce.imageUrl || '',
    });
  };

  // Sauvegarder les modifications
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'annonces', editingId), {
        titre: editForm.titre,
        description: editForm.description,
        prix: Number(editForm.prix),
        categorie: editForm.categorie,
        localisation: editForm.localisation,
        imageUrl: editForm.imageUrl,
        updatedAt: new Date().toISOString(),
      });
      setAnnonces(annonces.map((annonce) =>
        annonce.id === editingId ? { ...annonce, ...editForm, prix: Number(editForm.prix) } : annonce
      ));
      setEditingId(null);
      console.log(`Annonce ${editingId} modifiée avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la modification :', error);
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      titre: '',
      description: '',
      prix: '',
      categorie: '',
      localisation: '',
      imageUrl: '',
    });
  };

  // Gérer l'upload d'image
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file); // Correspond à 'file' dans /api/upload

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.imageUrl) {
        setEditForm({ ...editForm, imageUrl: data.imageUrl });
      }
    } catch (error) {
      console.error('Erreur lors de l’upload :', error);
    }
  };

  // Charger plus d'annonces
  const loadMoreAnnonces = () => {
    setVisibleAnnonces((prev) => prev + 6);
  };

  // Réduire le nombre d'annonces
  const loadLessAnnonces = () => {
    setVisibleAnnonces(6);
  };

  // Vérifier si une URL est valide
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null; // Redirigé par useEffect
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Annonces de l'Utilisateur</h1>

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.length > 0 ? ( // Changé pour vérifier directement annonces.length
            annonces.slice(0, visibleAnnonces).map((annonce) => (
              <div key={annonce.id} className="bg-white p-4 rounded-lg shadow-md">
                {editingId === annonce.id ? (
                  <form onSubmit={handleSaveEdit} className="space-y-6 bg-white p-6 rounded-lg shadow-inner">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Titre</label>
                      <input
                        type="text"
                        value={editForm.titre}
                        onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                        placeholder="Entrez le titre de l'annonce"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Entrez la description"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50 h-24"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Prix (MAD)</label>
                      <input
                        type="number"
                        value={editForm.prix}
                        onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })}
                        placeholder="Entrez le prix"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Catégorie</label>
                      <input
                        type="text"
                        value={editForm.categorie}
                        onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                        placeholder="Entrez la catégorie"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Localisation</label>
                      <input
                        type="text"
                        value={editForm.localisation}
                        onChange={(e) => setEditForm({ ...editForm, localisation: e.target.value })}
                        placeholder="Entrez la localisation"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">URL de l'image</label>
                      <input
                        type="text"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                        placeholder="Entrez l'URL de l'image ou téléchargez-en une"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                      />
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-gray-50"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Sauvegarder
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link href={`/annonces/${annonce.id}`} className="block">
                      {annonce.imageUrl && isValidUrl(annonce.imageUrl) && (
                        <img
                          src={annonce.imageUrl}
                          alt={annonce.titre}
                          className="w-full h-64 object-contain rounded-lg mb-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            console.error('Image non chargée :', annonce.imageUrl);
                          }}
                        />
                      )}
                      <h3 className="text-xl font-semibold text-gray-800">{annonce.titre}</h3>
                      <p className="text-gray-600 mt-2 line-clamp-2">{annonce.description}</p>
                      <p className="text-blue-600 font-bold mt-2">{annonce.prix} MAD</p>
                      <p className="text-gray-500 text-sm mt-1">Statut: {annonce.status}</p>
                    </Link>
                    <div className="mt-4 space-x-2">
                      <button
                        onClick={() => handleDeleteAnnonce(annonce.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition"
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => handleToggleAnnonceStatus(annonce.id, annonce.status)}
                        className={`px-2 py-1 rounded-lg transition ${
                          annonce.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {annonce.status === 'pending' ? 'Approuver' : 'Bloquer'}
                      </button>
                      <button
                        onClick={() => handleEdit(annonce)}
                        className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition"
                      >
                        Modifier
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600">Aucune annonce pour cet utilisateur.</p>
          )}
        </div>
        <div className="mt-4 flex space-x-4">
          {visibleAnnonces > 6 && (
            <button
              onClick={loadLessAnnonces}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Voir moins
            </button>
          )}
          {visibleAnnonces < annonces.length && (
            <button
              onClick={loadMoreAnnonces}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Voir plus
            </button>
          )}
        </div>
      </div>

      <Link
        href="/admin"
        className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour à la gestion
      </Link>
    </div>
  );
}