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

        // Sort by timestamp (newest first)
        const sortedNotifications = allNotifications.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );

        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Set up interval to check for new notifications
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [userRole]);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'teacher': return '👨‍🏫';
      case 'parent': return '👨‍👩‍👧‍👦';
      default: return '🔔';
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );

    // Update localStorage
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.type === 'announcement') {
      const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
      const updatedAnnouncements = announcements.map(announcement => {
        if (`announcement-${announcement.id}` === notificationId) {
          const readBy = announcement.readBy || [];
          if (!readBy.includes(userRole)) {
            readBy.push(userRole);
          }
          return { ...announcement, readBy };
        }
        return announcement;
      });
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    }

    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);

    // Update announcements in localStorage
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const updatedAnnouncements = announcements.map(announcement => {
      const readBy = announcement.readBy || [];
      if (!readBy.includes(userRole)) {
        readBy.push(userRole);
      }
      return { ...announcement, readBy };
    });
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.isRead ? prev - 1 : prev;
    });
  };

  const toggleNotifications = () => {
    setIsOpen(prev => !prev);
  };

  const closeNotifications = () => {
    setIsOpen(false);
  };

  // Add a new notification (for role-specific notifications)
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium',
      ...notification
    };

    const roleNotifications = JSON.parse(localStorage.getItem(`${userRole}Notifications`)) || [];
    roleNotifications.unshift(newNotification);
    localStorage.setItem(`${userRole}Notifications`, JSON.stringify(roleNotifications.slice(0, 100))); // Keep only 100 recent

    setNotifications(prev => [
      {
        ...newNotification,
        id: `${userRole}-${newNotification.id}`,
        type: userRole,
        icon: getRoleIcon(userRole)
      },
      ...prev
    ]);
    setUnreadCount(prev => prev + 1);
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleNotifications,
    closeNotifications,
    addNotification
  };
};
