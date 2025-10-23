"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/authContext';
import Link from 'next/link';

export default function AnnonceDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [annonce, setAnnonce] = useState<any>(null);
  const [annonceur, setAnnonceur] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contacted, setContacted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAnnonce = async () => {
      try {
        const docRef = doc(db, 'annonces', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const annonceData = { id: docSnap.id, ...docSnap.data() };
          setAnnonce(annonceData);
          if (annonceData.userId) {
            const userRef = doc(db, 'users', annonceData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setAnnonceur(userSnap.data());
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement de l’annonce :', error);
        setLoading(false);
      }
    };
    fetchAnnonce();
  }, [id]);

  const handleContact = () => {
    if (!user && !contacted) {
      setContacted(true);
      alert('Pour continuer à contacter, veuillez vous inscrire ou vous connecter.');
      router.push('/connexion');
      return;
    }

    if (annonceur && annonceur.phone && annonceur.isPhonePublic) {
      const whatsappUrl = `https://wa.me/${annonceur.phoneCode.replace('+', '')}${annonceur.phone}?text=Bonjour, je suis intéressé par votre annonce "${annonce.titre}".`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleChat = async () => {
    if (!user || !annonceur || !annonce || !message.trim()) return;

    try {
      const chatId = `${user.uid}_${annonce.userId}`;
      const chatRef = doc(db, 'chats', chatId);
      const messagesRef = collection(chatRef, 'messages');

      await addDoc(messagesRef, {
        senderId: user.uid,
        recipientId: annonce.userId,
        text: message,
        timestamp: serverTimestamp(),
        read: false, // Ajout explicite pour s'assurer que le champ existe
      });

      // Ajouter à userChats pour les deux utilisateurs
      await setDoc(doc(db, `users/${user.uid}/chats`, chatId), { timestamp: serverTimestamp() });
      await setDoc(doc(db, `users/${annonce.userId}/chats`, chatId), { timestamp: serverTimestamp() });

      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: annonce.userId,
        text: `Nouveau message de ${user.uid} concernant l’annonce ${annonce.titre}`,
        type: 'nouveau_message',
        read: false,
        timestamp: serverTimestamp(),
        chatId: chatId,
      });

      setMessage('');
      alert('Message envoyé ! L’annonceur a été notifié.');
    } catch (error) {
      console.error('Erreur lors de l’envoi du message :', error);
      alert('Erreur lors de l’envoi du message.');
    }
  };

  if (loading || authLoading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!annonce) {
    return <div className="container mx-auto p-4">Annonce non trouvée.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
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
        <div className="mt-6">
          {annonceur && annonceur.phone && annonceur.isPhonePublic && (
            <button
              onClick={handleContact}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold mr-2"
            >
              Contacter via WhatsApp
            </button>
          )}
          {user && (
            <>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message..."
                className="w-full p-2 border border-gray-300 rounded-lg mb-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleChat}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold mb-2"
                disabled={!message.trim()}
              >
                Contacter par chat
              </button>
              {message.trim() && (
                <Link href={`/chat/${user.uid}_${annonce.userId}`} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold inline-block">
                  Aller à la conversation
                </Link>
              )}
            </>
          )}
          {contacted && !user && (
            <p className="mt-2 text-red-600">Vous devez vous connecter pour continuer.</p>
          )}
        </div>
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