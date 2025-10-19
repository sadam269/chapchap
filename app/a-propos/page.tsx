"use client";

import { useRouter } from 'next/navigation';

export default function APropos() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md"> {/* Added darker background */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">À propos de ChapChap</h1>
      <p className="text-gray-600">
        ChapChap est une plateforme pour acheter et vendre des articles d’occasion au Maroc.
        Rejoignez notre communauté pour trouver des bonnes affaires près de chez vous !
      </p>
      <button
        onClick={() => router.back()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour à l’accueil
      </button>
    </div>
  );
}