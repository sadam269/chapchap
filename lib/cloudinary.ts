import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dzgm0tljf', // Remplace par ton Cloud Name
  api_key: '654412332439992', // Remplace par ton API Key
  api_secret: 'DD9fK1yY_U-02jLipFyE3X6ljl0', // Remplace par ton API Secret
  secure: true,
});

export default cloudinary;