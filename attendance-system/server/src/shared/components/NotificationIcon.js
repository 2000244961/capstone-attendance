import React from 'react';
import './NotificationIcon.css';

const NotificationIcon = ({ unreadCount, onClick, color = '#2196F3' }) => {
  return (
    <div className="notification-icon-container" onClick={onClick}>
      <span className="notification-bell" style={{ color }}>
        🔔
      </span>
      {unreadCount > 0 && (
        <span className="notification-badge" style={{ backgroundColor: color }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationIcon;
