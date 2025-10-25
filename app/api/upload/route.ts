import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// Type pour le résultat de Cloudinary
interface CloudinaryUploadResult {
  secure_url: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    // Limite de taille (ex: 5MB)
    const maxSize = 5 * 1024 * 1024; // 5 Mo
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 5MB)' }, { status: 400 });
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Uploader vers Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'chapchap', 
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
          // Décommente et ajuste si un preset est requis
          // upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        }
      ).end(buffer);
    });

    return NextResponse.json({ imageUrl: uploadResult.secure_url }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de l’upload :', error);
    return NextResponse.json({ error: 'Erreur lors de l’upload de l’image' }, { status: 500 });
  }
}