import { NotificationService } from './notification.service.js';
import { NotificationValidator } from './notification.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class NotificationController {
  static async createNotification(req, res, next) {
    try {
      const validatedData = NotificationValidator.validateCreateNotification(req.body);
      const notification = await NotificationService.createNotification(
        req.storeId,
        req.user._id,
        validatedData
      );

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Notification generated',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req, res, next) {
    try {
      const unreadOnly = req.query.unreadOnly === 'true';
      const { notifications, unreadCount } = await NotificationService.getStoreNotifications(
        req.storeId,
        req.user._id,
        unreadOnly
      );

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Notifications retrieved',
        data: notifications,
        meta: { unreadCount }
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const updated = await NotificationService.markAsRead(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Notification marked as read',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.storeId);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}