"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, where, getDocs, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useAuth } from '../lib/authContext';
import { useRouter } from 'next/navigation';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

export default function Home() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const [filters, setFilters] = useState({
    categorie: '',
    prixMax: '',
    localisation: '',
    searchTerm: '',
    dateMin: '',
    etat: '',
  });
  const [applyFilters, setApplyFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleRouteChange = () => setRefreshTrigger((prev) => prev + 1);
    const handlePopState = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('popstate', handlePopState);

    fetchInitialAnnonces();
    fetchCategories();
    const interval = setInterval(() => setRefreshTrigger((prev) => prev + 1), 30000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, [user]);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'annonces'), orderBy('categorie'));
      const querySnapshot = await getDocs(q);
      const allCategories = new Set<string>();
      querySnapshot.forEach((doc) => {
        const cat = doc.data().categorie || '';
        if (cat) allCategories.add(cat);
      });
      const predefinedCategories = ['', 'Vélos', 'Électronique', 'Meubles', 'Vêtements', 'Autres'];
      predefinedCategories.forEach((cat) => allCategories.add(cat));
      setCategories(Array.from(allCategories).sort());
    } catch (error) {
      console.error('Erreur lors du chargement des catégories :', error);
      setError('Impossible de charger les catégories. Réessayez plus tard.');
    }
  };

  const fetchInitialAnnonces = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'annonces'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      let annoncesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isFavori: false,
      }));
      if (user) {
        const favorisSnapshot = await getDocs(
          query(collection(db, 'favoris'), where('userId', '==', user.uid))
        );
        console.log('Favoris snapshot:', favorisSnapshot.docs.map(doc => doc.data()));
        const favorisIds = favorisSnapshot.docs.map((doc) => doc.data().annonceId);
        annoncesList = annoncesList.map((annonce) => ({
          ...annonce,
          isFavori: favorisIds.includes(annonce.id),
        }));
      }
      setAnnonces(annoncesList);
    } catch (error) {
      console.error('Erreur lors du chargement initial des annonces :', error);
      setError('Impossible de charger les annonces. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applyFilters) {
      const fetchAnnonces = async () => {
        setLoading(true);
        try {
          let q = query(collection(db, 'annonces'), orderBy('createdAt', 'desc'));

          if (filters.categorie) q = query(q, where('categorie', '==', filters.categorie));
          if (filters.prixMax && !isNaN(Number(filters.prixMax))) q = query(q, where('prix', '<=', Number(filters.prixMax)));
          if (filters.localisation) q = query(q, where('localisation', '==', filters.localisation));
          if (filters.dateMin) q = query(q, where('createdAt', '>=', new Date(filters.dateMin)));
          if (filters.etat) q = query(q, where('etat', '==', filters.etat));

          const querySnapshot = await getDocs(q);
          let annoncesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isFavori: false,
          }));

          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            annoncesList = annoncesList.filter((annonce) =>
              annonce.titre.toLowerCase().includes(searchTerm) ||
              (annonce.description && annonce.description.toLowerCase().includes(searchTerm))
            );
          }

          if (user) {
            const favorisSnapshot = await getDocs(
              query(collection(db, 'favoris'), where('userId', '==', user.uid))
            );
            const favorisIds = favorisSnapshot.docs.map((doc) => doc.data().annonceId);
            annoncesList = annoncesList.map((annonce) => ({
              ...annonce,
              isFavori: favorisIds.includes(annonce.id),
            }));
          }

          setAnnonces(annoncesList);
        } catch (error) {
          console.error('Erreur lors du chargement des annonces :', error);
          setError('Erreur lors de l’application des filtres. Vérifiez les données.');
        } finally {
          setLoading(false);
          setApplyFilters(false);
        }
      };
      fetchAnnonces();
    }
  }, [applyFilters, filters, user, refreshTrigger]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => setApplyFilters(true);

  const handleClearFilters = () => {
    setFilters({ categorie: '', prixMax: '', localisation: '', searchTerm: '', dateMin: '', etat: '' });
    setApplyFilters(true);
  };

  const handleShowMore = () => setVisibleCount((prev) => prev + 9);

  const addToFavoris = async (annonceId: string) => {
    if (!user) {
      setError('Vous devez être connecté pour ajouter aux favoris.');
      return;
    }
    try {
      const favorisRef = collection(db, 'favoris');
      const favorisSnapshot = await getDocs(
        query(favorisRef, where('userId', '==', user.uid), where('annonceId', '==', annonceId))
      );
      if (favorisSnapshot.empty) {
        await addDoc(favorisRef, {
          userId: user.uid,
          annonceId: annonceId,
          createdAt: new Date(),
        });
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Erreur lors de l’ajout aux favoris :', error);
      setError('Erreur lors de l’ajout aux favoris.');
    }
  };

  const removeFromFavoris = async (annonceId: string) => {
    if (!user) return;
    try {
      const favorisSnapshot = await getDocs(
        query(collection(db, 'favoris'), where('userId', '==', user.uid), where('annonceId', '==', annonceId))
      );
      favorisSnapshot.forEach(async (doc) => await deleteDoc(doc.ref));
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris :', error);
      setError('Erreur lors de la suppression des favoris.');
    }
  };

  if (loading) return <div className="container mx-auto p-4">Chargement...</div>;

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Bienvenue sur ChapChap</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            name="categorie"
            value={filters.categorie}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat || 'Toutes les catégories'}</option>
            ))}
          </select>
          <input
            type="number"
            name="prixMax"
            value={filters.prixMax}
            onChange={handleFilterChange}
            placeholder="Prix max (MAD)"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <input
            type="text"
            name="localisation"
            value={filters.localisation}
            onChange={handleFilterChange}
            placeholder="Localisation"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <input
            type="date"
            name="dateMin"
            value={filters.dateMin}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <select
            name="etat"
            value={filters.etat}
            onChange={handleFilterChange}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Tous les états</option>
            <option value="Neuf">Neuf</option>
            <option value="Usagé">Usagé</option>
          </select>
          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Rechercher (titre/description)"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 col-span-1 md:col-span-5"
          />
        </div>
        <button
          onClick={handleApplyFilters}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Rechercher
        </button>
        <button
          onClick={handleClearFilters}
          className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Effacer les filtres
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {annonces.slice(0, visibleCount).map((annonce) => (
          <Link key={annonce.id} href={`/annonces/${annonce.id}`} className="block">
            <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
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
              <p className="text-gray-500 text-sm">État: {annonce.etat || 'Non spécifié'}</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToFavoris(annonce.id);
                }}
                className="mt-2 text-red-600 hover:text-red-800 transition"
                disabled={annonce.isFavori}
              >
                {annonce.isFavori ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
              </button>
            </div>
          </Link>
        ))}
        {visibleCount < annonces.length && (
          <button
            onClick={handleShowMore}
            className="col-span-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold mt-4"
          >
            Voir plus
          </button>
        )}
      </div>
      {annonces.length === 0 && <p className="text-gray-600 mt-4">Aucune annonce disponible avec ces filtres.</p>}
    </div>
  );
}