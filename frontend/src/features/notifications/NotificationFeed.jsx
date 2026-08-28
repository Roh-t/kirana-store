import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Bell, ShoppingBag, AlertTriangle, Check, CheckCheck, X } from 'lucide-react';

export const NotificationFeed = ({ storeId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(storeId);
      setNotifications(res.data);
      setUnreadCount(res.meta?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10s sync
      return () => clearInterval(interval);
    }
  }, [storeId]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(storeId, id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(storeId);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
        title="Notifications Feed"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
              <Bell className="w-4 h-4 text-green-700" />
              Notifications ({unreadCount} new)
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-green-700 font-bold hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read All
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 text-xs">
            {loading && notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-400">Loading alerts...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                  className={`p-3 flex items-start gap-2.5 cursor-pointer transition ${
                    n.isRead ? 'bg-white text-gray-600' : 'bg-green-50/50 font-medium text-gray-900'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'NEW_ORDER' ? (
                      <ShoppingBag className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};