import cloudinary from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import { ImageLibrary } from './imageLibrary.model.js';
import { ApiError } from '../../utils/apiError.js';

export class ImageLibraryService {
  static async list(search = '') {
    const query = search.trim()
      ? { $or: [{ label: new RegExp(search.trim(), 'i') }, { aliases: new RegExp(search.trim(), 'i') }] }
      : {};
    return ImageLibrary.find(query).sort({ createdAt: -1 }).limit(100);
  }

  static async create(userId, data) {
    if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
      throw ApiError.serviceUnavailable('Cloudinary is not configured on the server');
    }

    if (!data.imageData || typeof data.imageData !== 'string' || !data.imageData.startsWith('data:image/')) {
      throw ApiError.badRequest('A valid image file is required');
    }
    if (!data.label || data.label.trim().length < 2) {
      throw ApiError.badRequest('Image label must be at least 2 characters');
    }
    if (data.imageData.length > 8 * 1024 * 1024) {
      throw ApiError.badRequest('Image file is too large. Maximum size is 6 MB');
    }

    let upload;
    try {
      upload = await cloudinary.uploader.upload(data.imageData, {
        folder: 'kiranaflow/image-library',
        resource_type: 'image'
      });
    } catch (error) {
      console.error('[Cloudinary] Image upload failed:', {
        name: error.name,
        httpCode: error.http_code,
        message: error.message
      });
      throw ApiError.badGateway('Cloudinary rejected the image upload. Check the server Cloudinary credentials.');
    }
    return ImageLibrary.create({
      label: data.label.trim(),
      aliases: Array.isArray(data.aliases) ? data.aliases.map((alias) => alias.trim()).filter(Boolean) : [],
      imageUrl: upload.secure_url,
      cloudinaryPublicId: upload.public_id,
      createdBy: userId
    });
  }

  static async remove(id) {
    const image = await ImageLibrary.findById(id);
    if (!image) throw ApiError.notFound('Image asset not found');
    await cloudinary.uploader.destroy(image.cloudinaryPublicId, { resource_type: 'image' });
    await image.deleteOne();
  }
}
