import { ApiError } from '../../utils/apiError.js';

export class NotificationValidator {
  static validateCreateNotification(data) {
    const errors = [];

    const validTypes = ['NEW_ORDER', 'ORDER_STATUS_CHANGE', 'LOW_STOCK_ALERT', 'SYSTEM'];
    if (!data.type || !validTypes.includes(data.type.toUpperCase())) {
      errors.push({ field: 'type', message: `Type must be one of: ${validTypes.join(', ')}` });
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Notification title is required' });
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push({ field: 'message', message: 'Notification message is required' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      type: data.type.toUpperCase(),
      title: data.title.trim(),
      message: data.message.trim(),
      channel: data.channel ? data.channel.toUpperCase() : 'IN_APP',
      data: data.data || null
    };
  }
}