import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * [CONFIG] Cloudinary SDK Instance
 * Configures media storage for avatars, KYC documents, and ceremony cover pictures.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
