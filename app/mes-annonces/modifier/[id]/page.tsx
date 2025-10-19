"use client";

import { useState, useEffect } from 'react';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/authContext';

export default function Modifier({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie: '',
    categoriePersonnalisee: '',
    localisation: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchAnnonce = async () => {
      if (!user) return;
      try {
        const annonceRef = doc(db, 'annonces', id);
        const docSnap = await getDoc(annonceRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          const data = docSnap.data();
          setFormData({
            titre: data.titre || '',
            description: data.description || '',
            prix: data.prix?.toString() || '',
            categorie: data.categorie || '',
            categoriePersonnalisee: data.categoriePersonnalisee || '',
            localisation: data.localisation || '',
          });
          setImageUrl(data.imageUrl || null);
        } else {
          setError('Annonce non trouvée ou vous n’avez pas les droits.');
          router.push('/mes-annonces');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l’annonce :', error);
        setError('Erreur lors du chargement de l’annonce.');
      }
    };
    fetchAnnonce();
  }, [id, user, router]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    let newImageUrl = imageUrl;
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

        newImageUrl = result.imageUrl;
      } catch (error: any) {
        console.error('Erreur lors de l’upload de l’image :', error);
        setError(error.message || 'Erreur lors de l’upload de l’image.');
        setUploading(false);
        return;
      }
    }

    try {
      const annonceRef = doc(db, 'annonces', id);
      await updateDoc(annonceRef, {
        titre: formData.titre,
        description: formData.description,
        prix: Number(formData.prix),
        categorie: formData.categorie === 'Autres' ? formData.categoriePersonnalisee : formData.categorie,
        localisation: formData.localisation,
        imageUrl: newImageUrl || '',
        userId: user.uid, // Assure que userId est maintenu
        updatedAt: new Date().toISOString(),
      });
      console.log('Annonce modifiée avec succès !');
      setUploading(false);
      router.push('/mes-annonces');
    } catch (error) {
      console.error('Erreur lors de la modification :', error);
      setError('Erreur lors de la modification de l’annonce.');
      setUploading(false);
    }
  };

  if (!user) {
    return <div className="container mx-auto p-4">Veuillez vous connecter.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Modifier une annonce</h1>
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
          <label className="block text-gray-700 text-sm font-bold mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {(imagePreview || (imageUrl && imageUrl !== '')) && (
            <div className="mt-4">
              <img
                src={imagePreview || imageUrl}
                alt="Prévisualisation"
                className="w-48 h-48 object-contain rounded-lg"
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {uploading ? 'Modification...' : 'Modifier'}
        </button>
      </form>
    </div>
  );
}