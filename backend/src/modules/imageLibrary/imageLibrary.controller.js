import { ImageLibraryService } from './imageLibrary.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ImageLibraryController {
  static async list(req, res, next) {
    try {
      const images = await ImageLibraryService.list(req.query.search || '');
      return ApiResponse.success(res, { statusCode: 200, message: 'Image library retrieved', data: images });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const image = await ImageLibraryService.create(req.user._id, req.body);
      return ApiResponse.success(res, { statusCode: 201, message: 'Image uploaded to library', data: image });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await ImageLibraryService.remove(req.params.id);
      return ApiResponse.success(res, { statusCode: 200, message: 'Image removed from library', data: null });
    } catch (error) {
      next(error);
    }
  }
}
