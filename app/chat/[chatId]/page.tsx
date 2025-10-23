"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../../lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/authContext';

export default function ChatPage() {
  const { chatId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user || !chatId) {
      router.push('/');
      return;
    }

    // Vérifier si l'utilisateur est impliqué dans ce chat
    const [user1, user2] = chatId.split('_');
    if (user.uid !== user1 && user.uid !== user2) {
      router.push('/messages');
      return;
    }
    setRecipientId(user.uid === user1 ? user2 : user1);

    // Récupérer les noms des utilisateurs de manière synchrone
    const fetchUserNames = async () => {
      const names: { [key: string]: string } = {};
      await Promise.all([user1, user2].map(async (uid) => {
        const userDoc = doc(db, 'users', uid);
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
          names[uid] = userSnap.data().displayName || userSnap.data().name || 'Inconnu';
        } else {
          names[uid] = 'Inconnu';
        }
      }));
      setUserNames(names);
    };
    fetchUserNames().catch((error) => console.error('Erreur lors du chargement des noms :', error));

    const messagesRef = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp'));
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const msgList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log('Messages reçus depuis onSnapshot:', msgList);

      // Marquer les messages comme lus pour cet utilisateur
      msgList.forEach((msg) => {
        if (msg.recipientId === user.uid && !msg.read) {
          updateDoc(doc(db, `chats/${chatId}/messages`, msg.id), { read: true })
            .then(() => console.log(`Message ${msg.id} marqué comme lu`))
            .catch((error) => console.error('Erreur lors du marquage comme lu :', error));
        }
      });

      setMessages(msgList);
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors du chargement des messages :', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatId, router]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientId || !user) return;

    try {
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        senderId: user.uid,
        recipientId: recipientId,
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l’envoi du message :', error);
    }
  };

  if (loading || authLoading || !user) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Conversation avec {userNames[recipientId] || 'Inconnu'}</h1>
      <div className="bg-white p-4 rounded-lg shadow-md h-96 overflow-y-auto mb-4">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const senderName = userNames[msg.senderId] || 'Inconnu';
            const timestamp = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : 'N/A';
            return (
              <div key={msg.id} className={`mb-4 ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                <p className={`inline-block p-2 rounded-lg ${msg.senderId === user.uid ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  {msg.text}
                </p>
                <p className={`text-xs ${msg.senderId === user.uid ? 'text-blue-200' : 'text-gray-500'}`}>
                  {senderName} - {timestamp}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">Aucun message pour le moment.</p>
        )}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          disabled={!newMessage.trim()}
        >
          Envoyer
        </button>
      </div>
      <button
        onClick={() => router.back()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
      >
        Retour
      </button>
    </div>
  );
}