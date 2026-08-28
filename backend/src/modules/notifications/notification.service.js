import { Notification } from './notification.model.js';
import { ApiError } from '../../utils/apiError.js';

export class NotificationService {
  static async createNotification(storeId, recipientId, validatedData) {
    return Notification.create({
      storeId,
      recipientId: recipientId || null,
      type: validatedData.type,
      channel: validatedData.channel || 'IN_APP',
      title: validatedData.title,
      message: validatedData.message,
      data: validatedData.data || null,
      isRead: false
    });
  }

  static async getStoreNotifications(storeId, recipientId, unreadOnly = false) {
    const query = { storeId };

    if (recipientId) {
      query.$or = [{ recipientId }, { recipientId: null }];
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ ...query, isRead: false })
    ]);

    return {
      notifications,
      unreadCount
    };
  }

  static async markAsRead(storeId, notificationId) {
    const notification = await Notification.findOne({ _id: notificationId, storeId });
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  static async markAllAsRead(storeId) {
    await Notification.updateMany({ storeId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    return { success: true };
  }
}