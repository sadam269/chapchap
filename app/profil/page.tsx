"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../lib/authContext';
import { EmailAuthProvider, signOut } from 'firebase/auth';
import { FaEdit, FaHome } from 'react-icons/fa';
import Link from 'next/link';

export default function Profil() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    phone: '',
    phoneCode: '+212',
    address: '',
    gender: '',
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    phoneCode: '+212',
    address: '',
    gender: '',
  });
  const phoneCodes = [
    '+212', '+269', '+33', '+1', '+44', '+91', '+86', '+81', '+55', '+34',
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setError('Vous devez être connecté pour voir votre profil.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            email: data.email || user.email || '',
            phone: data.phone || '',
            phoneCode: data.phoneCode || '+212',
            address: data.address || '',
            gender: data.gender || '',
          });
          setFormData({
            email: data.email || user.email || '',
            password: '',
            phone: data.phone || '',
            phoneCode: data.phoneCode || '+212',
            address: data.address || '',
            gender: data.gender || '',
          });
        } else {
          setUserData({ email: user.email || '', phone: '', phoneCode: '+212', address: '', gender: '' });
          setFormData({ email: user.email || '', password: '', phone: '', phoneCode: '+212', address: '', gender: '' });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
        setError('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation personnalisée pour le numéro de téléphone (7 à 15 chiffres)
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!formData.phone || !formData.phoneCode || !phoneRegex.test(formData.phone)) {
      setError('Le numéro de téléphone doit contenir entre 7 et 15 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: formData.email,
        phone: formData.phone,
        phoneCode: formData.phoneCode,
        address: formData.address,
        gender: formData.gender,
        isPhonePublic: true,
      }, { merge: true });

      if (formData.email !== user.email) {
        const credential = EmailAuthProvider.credential(user.email, formData.password);
        await user.reauthenticateWithCredential(credential);
        await user.updateEmail(formData.email);
      }

      setUserData({ ...formData, password: '' });
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde :', error);
      setError('Erreur lors de la sauvegarde. Vérifiez votre mot de passe si vous changez l’email.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="container mx-auto p-4">Chargement...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Veuillez vous connecter pour voir votre profil.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Mon Profil</h1>

      {error && <div className="text-red-600 mb-4 p-2 bg-red-100 rounded">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations</h2>
        {!isEditing ? (
          <div className="space-y-3">
            <div className="border-b pb-2">
              <strong className="text-gray-700">Nom :</strong>
              <span className="ml-2 text-gray-900">{user.displayName || 'Non défini'}</span>
            </div>
            {userData.email && (
              <div className="border-b pb-2">
                <strong className="text-gray-700">Email :</strong>
                <span className="ml-2 text-gray-900">{userData.email}</span>
              </div>
            )}
            {userData.phone && (
              <div className="border-b pb-2">
                <strong className="text-gray-700">Téléphone :</strong>
                <span className="ml-2 text-gray-900">{userData.phoneCode} {userData.phone}</span>
              </div>
            )}
            {userData.address && (
              <div className="border-b pb-2">
                <strong className="text-gray-700">Adresse :</strong>
                <span className="ml-2 text-gray-900">{userData.address}</span>
              </div>
            )}
            {userData.gender && (
              <div className="border-b pb-2">
                <strong className="text-gray-700">Genre :</strong>
                <span className="ml-2 text-gray-900">{userData.gender}</span>
              </div>
            )}
            {(userData.email || userData.phone || userData.address || userData.gender) && (
              <button
                onClick={handleEdit}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <FaEdit size={16} className="mr-2" /> Modifier
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-800 font-semibold mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-800 font-semibold mb-2">Mot de passe (requis pour changer l’email)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-gray-800 font-semibold mb-2">Téléphone</label>
              <div className="flex space-x-2">
                <select
                  id="phoneCode"
                  name="phoneCode"
                  value={formData.phoneCode}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  {phoneCodes.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-gray-800 font-semibold mb-2">Adresse</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-gray-800 font-semibold mb-2">Genre</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Non spécifié</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="ml-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition font-semibold"
            >
              Annuler
            </button>
          </form>
        )}
      </div>
      <Link href="/" className="mt-4 inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center">
        <FaHome size={16} className="mr-2" /> Retour à l'accueil
      </Link>
    </div>
  );
}