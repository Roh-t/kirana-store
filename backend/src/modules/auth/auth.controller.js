import { AuthService } from './auth.service.js';
import { AuthValidator } from './auth.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const validatedData = AuthValidator.validateRegister(req.body);
      const result = await AuthService.register(validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Account registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const validatedData = AuthValidator.validateLogin(req.body);
      const result = await AuthService.login(validatedData);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const userProfile = await AuthService.getMe(req.user._id);
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'User profile retrieved',
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
  }

  static async switchStore(req, res, next) {
    try {
      const { storeId } = req.body;
      const result = await AuthService.switchActiveStore(req.user._id, storeId);
      
      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Switched active store workspace',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}