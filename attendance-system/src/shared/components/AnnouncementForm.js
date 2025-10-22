import React, { useState } from 'react';
import './Announcement.css';

function AnnouncementForm({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!title.trim() || !message.trim()) {
      setError('Please fill in both title and message.');
      return;
    }
    onSubmit({ title, message });
    setTitle('');
    setMessage('');
    setSuccess('Announcement sent successfully!');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <form className="announcement-form" onSubmit={handleSubmit}>
      <div className="announcement-form-header">
        <span role="img" aria-label="announcement">📢</span>
        Create Announcement
      </div>
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <textarea
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Announce to All Parents'}
      </button>
      {success && <div className="announcement-success">{success}</div>}
      {error && <div className="announcement-error">{error}</div>}
    </form>
  );
}

export default AnnouncementForm;
