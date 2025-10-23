"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import Link from 'next/link';

export default function Notifications() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const notificationsList = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
            let senderName = 'Inconnu';
            let notificationText = data.message;
            if (data.type === 'nouveau_message') {
              const senderIdMatch = data.message.match(/Nouveau message de (\w+)/);
              const senderId = senderIdMatch ? senderIdMatch[1] : null;
              if (senderId) {
                const senderDoc = await getDoc(doc(db, 'users', senderId));
                if (senderDoc.exists()) {
                  senderName = senderDoc.data().displayName || senderDoc.data().name || senderId;
                }
              }
              notificationText = `Nouveau message de ${senderName}`;
            } else if (data.type === 'annonce_approbation') {
              notificationText = data.message; // "Votre annonce a été approuvée."
            } else if (data.type === 'annonce_blocage') {
              notificationText = data.message; // "Votre annonce a été bloquée."
            }
            return { id: doc.id, ...data, createdAt, senderName, notificationText };
          }));
          setNotifications(notificationsList);
        } catch (error) {
          console.error('Erreur lors du chargement des notifications :', error);
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  const markAsRead = async (id: string) => {
    const notificationRef = doc(db, 'notifications', id);
    await updateDoc(notificationRef, { read: true });
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDeleteNotification = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette notification ?')) {
      try {
        const notificationRef = doc(db, 'notifications', id);
        await deleteDoc(notificationRef);
        setNotifications(notifications.filter((n) => n.id !== id));
        console.log('Notification supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression de la notification :', error);
      }
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `${diffMinutes} min`;
    return 'moins d\'1 min';
  };

  if (loading || loadingNotifications) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Connectez-vous pour voir vos notifications.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mes Notifications</h1>
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white p-4 rounded-lg shadow-md ${!notification.read ? 'border-l-4 border-blue-600' : ''}`}
            >
              <p className="text-gray-800">
                {notification.notificationText}
              </p>
              <p className="text-gray-500 text-sm">Il y a {getTimeAgo(notification.createdAt)}</p>
              {notification.type === 'annonce_approbation' && <p className="text-green-600 font-semibold">Article approuvé</p>}
              {notification.type === 'annonce_blocage' && <p className="text-red-600 font-semibold">Article bloqué</p>}
              {notification.type === 'nouveau_message' && <p className="text-blue-600 font-semibold">Message à répondre</p>}
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition mr-2"
                >
                  Marquer comme lu
                </button>
              )}
              {notification.type === 'nouveau_message' && (
                <Link href={`/chat/${notification.chatId}`} className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition inline-block mr-2">
                  Répondre
                </Link>
              )}
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Aucune notification pour le moment.</p>
      )}
    </div>
  );
}