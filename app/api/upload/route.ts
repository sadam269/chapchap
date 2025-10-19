import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File; // Changé de 'image' à 'file' pour correspondre au frontend

    if (!file) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Uploader vers Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'chapchap', 
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
          // Ajoute un preset si requis par ta configuration Cloudinary
          // upload_preset: 'ton_preset'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ imageUrl: (uploadResult as any).secure_url });
  } catch (error) {
    console.error('Erreur lors de l’upload :', error);
    return NextResponse.json({ error: 'Erreur lors de l’upload de l’image' }, { status: 500 });
  }
}