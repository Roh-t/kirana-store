import { StaffService } from './staff.service.js';
import { StaffValidator } from './staff.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class StaffController {
  static async addStaff(req, res, next) {
    try {
      const validatedData = StaffValidator.validateAddStaff(req.body);
      const staff = await StaffService.addStaffToStore(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Staff member added successfully',
        data: staff
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStaff(req, res, next) {
    try {
      const staffList = await StaffService.getStoreStaff(req.storeId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Store staff list retrieved',
        data: staffList
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeStaff(req, res, next) {
    try {
      const result = await StaffService.removeStaffFromStore(req.storeId, req.user._id, req.params.staffUserId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Staff member removed from store',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}