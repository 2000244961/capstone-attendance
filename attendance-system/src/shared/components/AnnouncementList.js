import React, { useEffect, useState } from 'react';
// import { fetchAnnouncements } from '../../api/announcementApi';


const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);

  // Load announcements from localStorage
  const fetchAndSet = () => {
    const data = JSON.parse(localStorage.getItem('teacherAnnouncements') || '[]');
    setAnnouncements(data);
  };

  useEffect(() => {
    fetchAndSet();
    // Listen for localStorage changes (other tabs/windows)
    window.addEventListener('storage', fetchAndSet);
    return () => window.removeEventListener('storage', fetchAndSet);
  }, []);

  // Refresh on new announcement
  useEffect(() => {
    const interval = setInterval(fetchAndSet, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    const updated = announcements.filter(a => a.id !== id);
    localStorage.setItem('teacherAnnouncements', JSON.stringify(updated));
    setAnnouncements(updated);
  };

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

  return (
    <div className="announcement-list" style={{background: '#f7fafc', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, marginTop: 24}}>
      <ul className="notification-list" style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0, padding: 0 }}>
        {announcements.length === 0 ? (
          <li className="notification-empty">No announcements</li>
        ) : (
          announcements.map(a => (
            <li key={a.id} className={`notification-item`} style={{ borderLeft: `4px solid #3182ce` }}>
              <span className="notification-icon">{a.icon || '📢'}</span>
              <div className="notification-info">
                <div className="notification-title">{a.title}</div>
                <div className="notification-message">{a.message}</div>
                {a.sender && (
                  <div className="notification-sender" style={{ color: '#888', fontSize: '0.95em', marginTop: 2 }}>
                    <b>From:</b> {a.sender}
                  </div>
                )}
                <div className="notification-time">{formatTimeAgo(a.timestamp)}</div>
              </div>
              <button onClick={() => handleDelete(a.id)} style={{ marginLeft: 12, background: '#ff4757', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default AnnouncementList;
