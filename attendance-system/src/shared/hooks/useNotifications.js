import { useState, useEffect } from 'react';
import axios from 'axios';

// This hook supports both localStorage (for admin/role-based) and API (for userId-based) notifications.
// If userId is provided, it fetches from API. Otherwise, it falls back to localStorage using userRole.
export function useNotifications({ userId, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications from API if userId is provided, else from localStorage (role-based)
  useEffect(() => {
    if (userId) {
      // API-based notifications
      axios
        .get(`http://localhost:7000/api/notifications/${userId}`)
        .then((res) => setNotifications(res.data))
        .catch(() => setNotifications([]));
    } else if (userRole) {
      // LocalStorage-based notifications
      const loadNotifications = () => {
        try {
          const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
          const systemNotifications = JSON.parse(localStorage.getItem('systemNotifications')) || [];
          const roleNotifications = JSON.parse(localStorage.getItem(`${userRole}Notifications`)) || [];
          const allNotifications = [
            ...announcements.map((announcement) => ({
              id: `announcement-${announcement.id}`,
              type: 'announcement',
              title: 'New Announcement',
              message: announcement.title,
              content: announcement.content,
              timestamp: announcement.createdAt,
              priority: announcement.priority || 'medium',
              isRead: announcement.readBy?.includes(userRole) || false,
              icon: '📢',
            })),
            ...systemNotifications.map((notification) => ({
              id: `system-${notification.id}`,
              type: 'system',
              title: notification.title,
              message: notification.message,
              timestamp: notification.timestamp,
              priority: notification.priority || 'medium',
              isRead: notification.readBy?.includes(userRole) || false,
              icon: '🔔',
            })),
            ...roleNotifications.map((notification) => ({
              id: `${userRole}-${notification.id}`,
              type: userRole,
              title: notification.title,
              message: notification.message,
              timestamp: notification.timestamp,
              priority: notification.priority || 'medium',
              isRead: notification.isRead || false,
              icon: getRoleIcon(userRole),
            })),
          ];
          setNotifications(allNotifications);
        } catch (err) {
          setNotifications([]);
        }
      };
      loadNotifications();
    }
  }, [userId, userRole]);

  // Unread count logic (API: .read, Local: .isRead)
  const unreadCount = notifications.filter(
    (n) => !(n.read ?? n.isRead)
  ).length;

  // Actions
  const toggleNotifications = () => setIsOpen((v) => !v);
  const closeNotifications = () => setIsOpen(false);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        (n._id || n.id) === id ? { ...n, read: true, isRead: true } : n
      )
    );
    // API update if userId
    if (userId) {
      axios.patch(`http://localhost:7000/api/notifications/${id}/read`);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }))
    );
    if (userId) {
      notifications.forEach((n) => {
        if (!n.read) axios.patch(`http://localhost:7000/api/notifications/${n._id}/read`);
      });
    }
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((n) => (n._id || n.id) !== id)
    );
    if (userId) {
      axios.delete(`http://localhost:7000/api/notifications/${id}`);
    }
  };

  // Only for localStorage/role-based usage
  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  function getRoleIcon(role) {
    switch (role) {
      case 'admin':
        return '🛡️';
      case 'teacher':
        return '👨‍🏫';
      case 'parent':
        return '👨‍👩‍👧';
      default:
        return '👤';
    }
  }

  return {
    notifications,
    unreadCount,
    isOpen,
    toggleNotifications,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification, // Only use for localStorage/role-based
  };
}