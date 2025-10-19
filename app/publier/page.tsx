"use client";

import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const { user } = useAuth();
  const router = useRouter();

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

  if (!user) {
    return <div className="container mx-auto p-4">Veuillez vous connecter pour publier une annonce.</div>;
  }

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
            <option value="Vélos">Vélos</option>
            <option value="Électronique">Électronique</option>
            <option value="Meubles">Meubles</option>
            <option value="Vêtements">Vêtements</option>
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
              placeholder="Ex: Jouets, Livres"
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
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {uploading ? 'Publication...' : 'Publier'}
        </button>
      </form>
    </div>
  );
}