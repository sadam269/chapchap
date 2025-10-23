"use client";

import { useState, useEffect } from 'react'; // Ajout de useEffect
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';

export default function Publier() {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie: '',
    categoriePersonnalisee: '',
    localisation: '',
    etat: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [existingCategories, setExistingCategories] = useState<string[]>([]); // Liste des catégories existantes

  useEffect(() => {
    if (!loading && !user) {
      router.push('/connexion');
    }

    // Récupérer les catégories existantes
    const fetchCategories = async () => {
      try {
        const annoncesSnapshot = await getDocs(collection(db, 'annonces'));
        const categories = new Set<string>();
        annoncesSnapshot.forEach((doc) => {
          const categorie = doc.data().categorie;
          if (categorie) categories.add(categorie);
        });
        setExistingCategories(Array.from(categories));
      } catch (error) {
        console.error('Erreur lors du chargement des catégories :', error);
      }
    };

    fetchCategories();
  }, [user, loading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      setImageUrl(value);
      setImagePreview(value);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    if (!user) {
      setError('Vous devez être connecté pour publier une annonce.');
      setUploading(false);
      return;
    }

    let finalImageUrl = '';
    if (imageFile) {
      try {
        const formDataToUpload = new FormData();
        formDataToUpload.append('image', imageFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataToUpload,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de l’upload');
        }

        finalImageUrl = result.imageUrl;
      } catch (error: any) {
        console.error('Erreur lors de l’upload de l’image :', error);
        setError(error.message || 'Erreur lors de l’upload de l’image.');
        setUploading(false);
        return;
      }
    } else if (imageUrl && isValidUrl(imageUrl)) {
      finalImageUrl = imageUrl;
    } else if (!imageFile && (!imageUrl || !isValidUrl(imageUrl))) {
      setError('Veuillez fournir une image ou une URL valide.');
      setUploading(false);
      return;
    }

    try {
      const categorieFinale = formData.categorie === 'Autres' ? formData.categoriePersonnalisee : formData.categorie;
      if (formData.categorie === 'Autres' && existingCategories.includes(formData.categoriePersonnalisee)) {
        setError('Cette catégorie existe déjà. Veuillez la sélectionner dans la liste.');
        setUploading(false);
        return;
      }
      await addDoc(collection(db, 'annonces'), {
        titre: formData.titre,
        description: formData.description,
        prix: Number(formData.prix),
        categorie: categorieFinale,
        localisation: formData.localisation,
        etat: formData.etat,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid,
        status: 'pending',
      });
      console.log('Annonce publiée avec succès !');
      setUploading(false);
      router.push('/mes-annonces');
    } catch (error) {
      console.error('Erreur lors de la publication :', error);
      setError('Erreur lors de la publication de l’annonce.');
      setUploading(false);
    }
  };

  // Réinitialiser le formulaire
  const handleCancel = () => {
    setFormData({
      titre: '',
      description: '',
      prix: '',
      categorie: '',
      categoriePersonnalisee: '',
      localisation: '',
      etat: '',
    });
    setImageFile(null);
    setImageUrl('');
    setImagePreview(null);
    setError(null);
  };

  if (loading) return <div className="container mx-auto p-4">Chargement...</div>;
  if (!user) return null; // Redirection gérée par useEffect

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Publier une annonce</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Titre</label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Prix (MAD)</label>
          <input
            type="number"
            name="prix"
            value={formData.prix}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Catégorie</label>
          <select
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Autres">Autres</option>
          </select>
        </div>
        {formData.categorie === 'Autres' && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Catégorie personnalisée</label>
            <input
              type="text"
              name="categoriePersonnalisee"
              value={formData.categoriePersonnalisee}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Entrez une nouvelle catégorie"
              required
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Localisation</label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">État du produit</label>
          <select
            name="etat"
            value={formData.etat}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Sélectionner l'état</option>
            <option value="Neuf">Neuf</option>
            <option value="Usagé">Usagé</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Image ou URL</label>
          <input
            type="text"
            name="imageUrl"
            value={imageUrl}
            onChange={handleChange}
            placeholder="Entrez une URL d'image (ex: https://example.com/image.jpg)"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {(imagePreview || (imageUrl && isValidUrl(imageUrl))) && (
            <div className="mt-4">
              <img
                src={imagePreview || imageUrl}
                alt="Prévisualisation"
                className="w-64 h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
        <div className="flex space-x-2 mb-4">
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {uploading ? 'Publication...' : 'Publier'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </form>
    </div>
  );
}