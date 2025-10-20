import React, { useState } from 'react';

function AnnouncementForm({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onSubmit({ title, message });
    setTitle('');
    setMessage('');
  };

  return (
    <form className="announcement-form" onSubmit={handleSubmit} style={{marginBottom:24, background:'#f7fafc', padding:24, borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
      <h3 style={{marginBottom:12}}>📢 Create Announcement</h3>
      <div style={{marginBottom:12}}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{width:'100%',padding:8,fontSize:16,borderRadius:6,border:'1px solid #cbd5e0'}}
          required
        />
      </div>
      <div style={{marginBottom:12}}>
        <textarea
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{width:'100%',padding:8,fontSize:16,borderRadius:6,border:'1px solid #cbd5e0',minHeight:80}}
          required
        />
      </div>
      <button type="submit" className="dashboard-btn" style={{padding:'8px 24px',fontSize:16}} disabled={loading}>
        {loading ? 'Sending...' : 'Announce to All Parents'}
      </button>
    </form>
  );
}

export default AnnouncementForm;
