import { useState, useEffect } from 'react';

export const useNotifications = (userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        // Get announcements (created by admin)
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        
        // Get system notifications
        const systemNotifications = JSON.parse(localStorage.getItem('systemNotifications')) || [];
        
        // Get role-specific notifications
        const roleNotifications = JSON.parse(localStorage.getItem(`${userRole}Notifications`)) || [];
        
        // Combine all notifications
        const allNotifications = [
          // Admin announcements (visible to all)
          ...announcements.map(announcement => ({
            id: `announcement-${announcement.id}`,
            type: 'announcement',
            title: 'New Announcement',
            message: announcement.title,
            content: announcement.content,
            timestamp: announcement.createdAt,
            priority: announcement.priority || 'medium',
            isRead: announcement.readBy?.includes(userRole) || false,
            icon: '📢'
          })),
          
          // System notifications
          ...systemNotifications.map(notification => ({
            id: `system-${notification.id}`,
            type: 'system',
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp,
            priority: notification.priority || 'medium',
            isRead: notification.readBy?.includes(userRole) || false,
            icon: '🔔'
          })),
          
          // Role-specific notifications
          ...roleNotifications.map(notification => ({
            id: `${userRole}-${notification.id}`,
            type: userRole,
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp,
            priority: notification.priority || 'medium',
            isRead: notification.isRead || false,
            icon: getRoleIcon(userRole)
          }))
        ];

        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter(n => !n.isRead).length);
      } catch (err) {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    loadNotifications();
  }, [userRole]);

  // Notification actions
  const toggleNotifications = () => setIsOpen(!isOpen);
  const closeNotifications = () => setIsOpen(false);
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(notifications.filter(n => !n.isRead && n.id !== id).length);
  };
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setUnreadCount(notifications.filter(n => !n.isRead && n.id !== id).length);
  };
  const addNotification = (notification) => {
    setNotifications([notification, ...notifications]);
    setUnreadCount(unreadCount + 1);
  };

  function getRoleIcon(role) {
    switch (role) {
      case 'admin': return '🛡️';
      case 'teacher': return '👨‍🏫';
      case 'parent': return '👨‍👩‍👧';
      default: return '👤';
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
    addNotification
  };
};
