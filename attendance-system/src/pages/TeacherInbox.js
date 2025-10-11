import React, { useState, useEffect } from 'react';
import { fetchInbox, updateMessageStatus, deleteMessage } from '../api/messageApi';
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(id);
      setMessages(msgs => msgs.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };
import '../styles/TeacherInbox.css';

function TeacherInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  // Get current teacher user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const fetchMessages = () => {
    setLoading(true);
    if (!currentUser || !currentUser._id) return;
    fetchInbox(currentUser._id, 'teacher')
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [currentUser]);

  const handleStatus = async (id, status) => {
    try {
      await updateMessageStatus(id, status);
      setMessages(msgs => msgs.map(m => m._id === id ? { ...m, status } : m));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="teacher-inbox-container">
      <h2>Inbox - Excuse Letters</h2>
      <button onClick={fetchMessages} style={{marginBottom:12}}>Refresh Inbox</button>
      {loading ? (
        <div>Loading...</div>
      ) : messages.length === 0 ? (
        <div>No excuse letters received.</div>
      ) : (
        <table style={{width:'100%',marginTop:8}}>
          <thead>
            <tr>
              <th>From</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.filter(m => m.type === 'excuse_letter').map(msg => (
              <tr key={msg._id}>
                <td>{msg.sender?.name || msg.sender?.fullName || msg.sender?.id || 'Unknown'}</td>
                <td>{msg.content}</td>
                <td>{msg.status}</td>
                <td>{msg.excuseDate ? new Date(msg.excuseDate).toLocaleDateString() : ''}</td>
                <td>
                  {msg.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatus(msg._id, 'approved')}>Approve</button>
                      <button onClick={() => handleStatus(msg._id, 'rejected')} style={{marginLeft:8}}>Decline</button>
                    </>
                  )}
                  <button onClick={() => handleDeleteMessage(msg._id)} style={{marginLeft:8, color:'red'}}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TeacherInbox;
