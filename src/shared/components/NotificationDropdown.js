import React from 'react';
import './NotificationDropdown.css';

const NotificationDropdown = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}) => {
  if (!isOpen) return null;

  // Helper: prefer timestamp, fallback to createdAt, fallback to null
  const getDateString = (notification) => notification.timestamp || notification.createdAt || null;

  // Format "time ago" or fallback to full date if invalid
  const formatTimeAgo = (notification) => {
    const dateString = getDateString(notification);
    if (!dateString) return 'No date';
    const now = new Date();
    const time = new Date(dateString);
    if (isNaN(time.getTime())) return 'No date';
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('notification-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="notification-backdrop" onClick={handleBackdropClick}>
      <div className="notification-dropdown">
        <div className="notification-header">
          <h3>🔔 Notifications</h3>
          <div className="notification-actions">
            {notifications.some(n => !(n.read ?? n.isRead)) && (
              <button
                className="mark-all-read-btn"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                ✓ All
              </button>
            )}
            <button
              className="close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">🔕</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className={`notification-item ${!(notification.read ?? notification.isRead) ? 'unread' : ''}`}
              >
                <div className="notification-content">
                  <div className="notification-header-row">
                    <span className="notification-icon">{notification.icon}</span>
                    <div className="notification-title-row">
                      <span className="notification-title">
                        {notification.title || notification.message || notification.content}
                      </span>
                      <div
                        className="priority-indicator"
                        style={{ backgroundColor: getPriorityColor(notification.priority) }}
                        title={`${notification.priority} priority`}
                      />
                    </div>
                    <span className="notification-time">
                      {formatTimeAgo(notification)}
                    </span>
                  </div>
                  <div className="notification-message">
                    {/* Only show if message/content is different from title */}
                    {(notification.message && notification.message !== notification.title) && notification.message}
                    {(notification.content && notification.content !== notification.title && notification.content !== notification.message) && notification.content}
                  </div>
                </div>

                <div className="notification-actions">
                  {!(notification.read ?? notification.isRead) && (
                    <button
                      className="mark-read-btn"
                      onClick={() => onMarkAsRead(notification._id || notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(notification._id || notification.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <p>{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;