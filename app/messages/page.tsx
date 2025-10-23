"use client";

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Messages() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      const fetchConversations = async () => {
        setLoadingConversations(true);
        try {
          const userChatsSnapshot = await getDocs(collection(db, `users/${user.uid}/chats`));
          const convList = await Promise.all(userChatsSnapshot.docs.map(async (chatDoc) => {
            const chatId = chatDoc.id;
            const [user1, user2] = chatId.split('_');
            const otherUserId = user.uid === user1 ? user2 : user1;
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUserName = otherUserDoc.exists() ? otherUserDoc.data().displayName || otherUserDoc.data().name || 'Inconnu' : 'Inconnu';
            const messagesQuery = query(
              collection(db, `chats/${chatId}/messages`),
              where('recipientId', '==', user.uid),
              where('read', '==', false)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const unreadCount = messagesSnapshot.size;
            return { chatId, otherUserName, unreadCount };
          }));
          setConversations(convList);
        } catch (error) {
          console.error('Erreur lors du chargement des conversations :', error);
        } finally {
          setLoadingConversations(false);
        }
      };
      fetchConversations();
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loading]);

  if (loading || loadingConversations) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Connectez-vous pour voir vos messages.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mes Messages</h1>
      {conversations.length > 0 ? (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <Link key={conv.chatId} href={`/chat/${conv.chatId}`} className="block bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
              <p className="text-gray-800 font-semibold">Conversation avec {conv.otherUserName}</p>
              <p className="text-gray-500 text-sm">Messages non lus: {conv.unreadCount}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Aucune conversation pour le moment.</p>
      )}
    </div>
  );
}