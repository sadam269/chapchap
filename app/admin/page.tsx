"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import Link from 'next/link';

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [visibleAnnonces, setVisibleAnnonces] = useState(6); // Limite initiale
  const ADMIN_EMAIL = 'masta@gmail.com';

  // Rediriger si non admin
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Charger toutes les annonces et utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les annonces
        const annoncesSnapshot = await getDocs(collection(db, 'annonces'));
        const annoncesList = annoncesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'pending',
        }));
        setAnnonces(annoncesList);

        // Charger les utilisateurs et compter leurs annonces
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = await Promise.all(
          usersSnapshot.docs.map(async (doc) => {
            const userData = doc.data();
            const annoncesQuery = query(collection(db, 'annonces'), where('userId', '==', doc.id));
            const annoncesSnapshot = await getDocs(annoncesQuery);
            return {
              id: doc.id,
              ...userData,
              blocked: userData.blocked || false,
              articleCount: annoncesSnapshot.size, // Nombre d'articles publiés
            };
          })
        );
        setUsers(usersList);
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
      }
    };
    fetchData();
  }, []);

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
      setAnnonces(annonces.map((annonce) =>
        annonce.id === id ? { ...annonce, status: newStatus } : annonce
      ));
      console.log(`Annonce ${id} mise à jour : ${newStatus}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Voulez-vous supprimer cet utilisateur ?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter((user) => user.id !== userId));
        console.log('Utilisateur supprimé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
      }
    }
  };

  // Bloquer/Débloquer un utilisateur
  const handleToggleUserBlock = async (userId: string, currentBlocked: boolean) => {
    const newBlocked = !currentBlocked;
    try {
      await updateDoc(doc(db, 'users', userId), { blocked: newBlocked });
      setUsers(users.map((user) =>
        user.id === userId ? { ...user, blocked: newBlocked } : user
      ));
      console.log(`Utilisateur ${userId} ${newBlocked ? 'bloqué' : 'débloqué'}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut d\'utilisateur :', error);
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

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null; // Redirigé par useEffect
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Administration</h1>

      {/* Gestion des annonces */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gestion des Annonces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.slice(0, visibleAnnonces).length > 0 ? (
            annonces.slice(0, visibleAnnonces).map((annonce) => (
              <div key={annonce.id} className="bg-white p-4 rounded-lg shadow-md">
                <Link href={`/annonces/${annonce.id}`} className="block">
                  {annonce.imageUrl && (
                    <img
                      src={annonce.imageUrl}
                      alt={annonce.titre}
                      className="w-full h-48 object-contain rounded-lg mb-4"
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
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Aucune annonce à gérer.</p>
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

      {/* Gestion des utilisateurs */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gestion des Utilisateurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800">{user.displayName || 'Sans nom'}</h3>
                <p className="text-gray-600 mt-2">Email: {user.email}</p>
                <p className="text-gray-600">Téléphone: {user.phone || 'Non défini'}</p>
                <p className="text-gray-600">Adresse: {user.address || 'Non définie'}</p>
                <p className="text-gray-600">Genre: {user.gender || 'Non spécifié'}</p>
                <p className="text-gray-600 mt-2">Statut: {user.blocked ? 'Bloqué' : 'Actif'}</p>
                <p className="text-gray-600">Articles publiés: {user.articleCount || 0}</p>
                <div className="mt-4 space-x-2">
                  <Link href={`/admin/user/${user.id}`} className="bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 transition">
                    Voir les annonces
                  </Link>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => handleToggleUserBlock(user.id, user.blocked)}
                    className={`px-2 py-1 rounded-lg transition ${
                      user.blocked ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                    } text-white`}
                  >
                    {user.blocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Aucun utilisateur à gérer.</p>
          )}
        </div>
      </div>

      <Link
        href="/"
        className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour à l’accueil
      </Link>
    </div>
  );
}