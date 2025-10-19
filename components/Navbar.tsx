"use client";

import Link from 'next/link';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../lib/authContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const ADMIN_EMAIL = 'masta@gmail.com'; // Même e-mail que pour l'admin

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          ChapChap
        </Link>

        {/* Bouton hamburger pour mobile */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>

        {/* Menu desktop (toujours visible) */}
        <div className="hidden md:flex space-x-4">
          <Link href="/" className="hover:text-gray-200">
            Accueil
          </Link>
          <Link href="/publier" className="hover:text-gray-200">
            Publier une annonce
          </Link>
          <Link href="/a-propos" className="hover:text-gray-200">
            À propos
          </Link>
          {user && (
            <Link href="/mes-annonces" className="hover:text-gray-200">
              Mes annonces
            </Link>
          )}
          {user && (
            <Link href="/favoris" className="hover:text-gray-200">
              Mes favoris
            </Link>
          )}
          {user && (
            <Link href="/profil" className="hover:text-gray-200">
              Mon profil
            </Link>
          )}
          {user && user.email === ADMIN_EMAIL && (
            <Link href="/admin" className="hover:text-gray-200">
              Admin
            </Link>
          )}
          {user ? (
            <button onClick={handleSignOut} className="hover:text-gray-200">
              Se déconnecter
            </button>
          ) : (
            <Link href="/connexion" className="hover:text-gray-200">
              Se connecter
            </Link>
          )}
        </div>
      </div>

      {/* Menu mobile (affiché si isOpen est true) */}
      {isOpen && (
        <div className="md:hidden mt-2">
          <Link href="/" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
            Accueil
          </Link>
          <Link href="/publier" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
            Publier une annonce
          </Link>
          <Link href="/a-propos" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
            À propos
          </Link>
          {user && (
            <Link href="/mes-annonces" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
              Mes annonces
            </Link>
          )}
          {user && (
            <Link href="/favoris" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
              Mes favoris
            </Link>
          )}
          {user && (
            <Link href="/profil" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
              Mon profil
            </Link>
          )}
          {user && user.email === ADMIN_EMAIL && (
            <Link href="/admin" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={() => { handleSignOut(); toggleMenu(); }}
              className="block py-2 px-4 hover:bg-blue-700 w-full text-left"
            >
              Se déconnecter
            </button>
          ) : (
            <Link href="/connexion" className="block py-2 px-4 hover:bg-blue-700" onClick={toggleMenu}>
              Se connecter
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}