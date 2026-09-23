import { cloudinary } from '../config/cloudinary.js';

export interface CloudinaryAuthSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
}

/**
 * [SERVICE] Cloudinary Media Service
 * Handles signed media direct uploads, server-side asset uploading, and media deletion.
 */
export class CloudinaryService {
  /**
   * Generate signed authentication parameters for direct frontend-to-Cloudinary uploads
   */
  generateUploadSignature(folder: string = 'pujacircle'): CloudinaryAuthSignature {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      cloudinary.config().api_secret as string
    );

    return {
      signature,
      timestamp,
      apiKey: cloudinary.config().api_key as string,
      cloudName: cloudinary.config().cloud_name as string,
      folder,
    };
  }

  /**
   * Upload an image file, buffer, or base64 data URI to Cloudinary storage
   */
  async uploadImage(fileData: string, folder: string = 'pujacircle'): Promise<any> {
    return cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: 'image',
    });
  }

  /**
   * Delete a media asset from Cloudinary storage by public ID
   */
  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }
}

export const cloudinaryService = new CloudinaryService();
