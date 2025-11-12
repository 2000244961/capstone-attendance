import React from 'react';
import './InboxIcon.css';


const InboxIcon = ({ onClick, unreadCount }) => (
  <span className="inbox-icon" onClick={onClick} title="Inbox" style={{ position: 'relative', fontSize: 25, lineHeight: 1 }}>
    <span role="img" aria-label="inbox">📥</span>
      {unreadCount > 0 && (
        <span className="inbox-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </span>
  );

export default InboxIcon;
