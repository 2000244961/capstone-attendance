import React from 'react';
import '../shared/components/NotificationDropdown.css';
import { useNotifications } from '../shared/hooks/useNotifications';

const NotificationPage = () => {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  return (
    <div className="notification-main-page" style={{ minHeight: '100vh', background: '#f4f6fb', padding: '32px 0' }}>
      <div className="notification-dropdown" style={{ margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', maxWidth: 600 }}>
        <div className="notification-header">
          <h3>🔔 Notifications</h3>
          <div className="notification-actions">
            {notifications.some(n => !n.isRead) && (
              <button className="mark-all-read-btn" onClick={markAllAsRead} title="Mark all as read">✓ All</button>
            )}
          </div>
        </div>
        <ul className="notification-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <li className="notification-empty">No notifications</li>
          ) : (
            notifications.map(n => (
              <li key={n.id} className={`notification-item ${n.isRead ? 'read' : 'unread'}`} style={{ borderLeft: `4px solid ${getPriorityColor(n.priority)}` }}>
                <span className="notification-icon">{n.icon}</span>
                <div className="notification-info">
                  <div className="notification-title">{n.title}</div>
                  <div className="notification-message">{n.message}</div>
                  {n.sender && (
                    <div className="notification-sender" style={{ color: '#888', fontSize: '0.95em', marginTop: 2 }}>
                      <b>From:</b> {n.sender}
                    </div>
                  )}
                  <div className="notification-time">{formatTimeAgo(n.timestamp)}</div>
                </div>
                <div className="notification-actions">
                  {!n.isRead && (
                    <button className="mark-read-btn" onClick={() => markAsRead(n.id)} title="Mark as read">✓</button>
                  )}
                  <button className="delete-btn" onClick={() => deleteNotification(n.id)} title="Delete">🗑️</button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default NotificationPage;
