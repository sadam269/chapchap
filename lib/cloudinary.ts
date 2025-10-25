import { v2 as cloudinary } from 'cloudinary';

// Charger les variables d'environnement
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || 'dzgm0tljf', // Valeur par défaut pour dev
  api_key: CLOUDINARY_API_KEY || '654412332439992', // Valeur par défaut pour dev
  api_secret: CLOUDINARY_API_SECRET || 'DD9fK1yY_U-02jLipFyE3X6ljl0', // Valeur par défaut pour dev
  secure: true,
});

export default cloudinary;