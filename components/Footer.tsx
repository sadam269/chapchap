export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} ChapChap. Tous droits réservés.</p>
        <a href="mailto:contact@chapchap.com" className="hover:text-gray-200">
          Contactez-nous
        </a>
      </div>
    </footer>
  );
}