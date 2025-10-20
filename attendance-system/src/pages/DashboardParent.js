import React, { useState, useEffect } from 'react';
import { useUser } from '../shared/UserContext';
import NotificationIcon from '../shared/components/NotificationIcon';
import InboxIcon from '../shared/components/InboxIcon';
import NotificationDropdown from '../shared/components/NotificationDropdown';
import { fetchInbox, sendExcuseLetter, fetchSentMessages } from '../api/messageApi';
import { fetchAllTeachers } from '../api/userApi';
import '../styles/DashboardParent.css';

function DashboardParent() {
  // Unread inbox count (based on parentInbox)
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  useEffect(() => {
    setUnreadInboxCount(Array.isArray(parentInbox) ? parentInbox.filter(msg => msg.status !== 'read').length : 0);
  }, [parentInbox]);
  const [activeSidebar, setActiveSidebar] = useState('dashboard');
  const [excuseLetters, setExcuseLetters] = useState([]);
  const [excuseForm, setExcuseForm] = useState({ reason: '', file: null, teacherId: '' });
  const [excuseStatus, setExcuseStatus] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // Get current parent user from React context
  const { user: currentUser } = useUser();
  const parentName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Parent';
  // Example parent state
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    // Fetch teachers for dropdown
    fetchAllTeachers().then(setTeachers).catch(() => setTeachers([]));
  }, []);

  const handleExcuseFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setExcuseForm(prev => ({ ...prev, file: files[0] }));
    } else {
      setExcuseForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExcuseFormSubmit = async (e) => {
    e.preventDefault();
    if (!excuseForm.teacherId) {
      setExcuseStatus('Please select a teacher.');
      return;
    }
    setExcuseStatus('Submitting...');
    try {
      const result = await sendExcuseLetter({
        senderId: currentUser._id,
        senderRole: 'parent',
        recipientId: excuseForm.teacherId,
        recipientRole: 'teacher',
        reason: excuseForm.reason,
        excuseDate: new Date().toISOString().slice(0, 10),
        subject: 'Excuse Letter'
      });
      // Immediately add the new excuse letter to the list for instant feedback
      const newLetter = {
        _id: result?._id || Math.random().toString(36).slice(2),
        content: excuseForm.reason,
        recipient: excuseForm.teacherId,
        sender: currentUser._id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        approverName: '',
        type: 'excuse_letter',
      };
  setExcuseLetters(prev => [newLetter, ...prev]);
  setParentSent(prev => [newLetter, ...prev]);
      setExcuseStatus('Submitted!');
      setExcuseForm({ reason: '', file: null, teacherId: '' });
      // Optionally refresh from backend after a short delay
      setTimeout(() => {
        fetchParentSentExcuseLetters();
        setExcuseStatus('');
      }, 2000);
    } catch (err) {
      setExcuseStatus('Failed to submit: ' + err.message);
    }
  };
  // ...existing code...

  useEffect(() => {
    async function fetchParentData() {
      if (!currentUser) return;
      let ids = [];
      if (Array.isArray(currentUser.linkedStudent)) ids = currentUser.linkedStudent;
      else if (typeof currentUser.linkedStudent === 'string' && currentUser.linkedStudent) ids = [currentUser.linkedStudent];
      else if (currentUser.linkedStudent != null) ids = Array.from(currentUser.linkedStudent);
      if (ids.length === 0) {
        setLinkedStudents([]);
        return;
      }
      try {
        const res = await fetch('/api/student/list');
        if (res.ok) {
          const allStudents = await res.json();
          const linked = allStudents.filter(s => ids.includes(s._id) || ids.includes(s.studentId));
          setLinkedStudents(linked.map(s => ({
            id: s._id || s.studentId,
            name: s.fullName,
            grade: s.gradeLevel,
            section: s.section,
            photo: s.photo,
            subjects: s.subjects || [],
            status: s.status || 'N/A',
            recentAttendance: s.recentAttendance || [],
          })));
        } else {
          setLinkedStudents([]);
        }
      } catch {
        setLinkedStudents([]);
      }
    }
    fetchParentData();
    fetchParentNotifications();
    fetchParentSentExcuseLetters();
    // eslint-disable-next-line
  }, [currentUser]);

  // Fetch sent excuse letters for parent
  async function fetchParentSentExcuseLetters() {
    if (!currentUser || !currentUser._id) return;
    try {
      const sent = await fetchSentMessages(currentUser._id);
      // Merge backend and local excuseLetters, deduplicating by _id
      setExcuseLetters(prev => {
        const backendLetters = sent.filter(msg => msg.type === 'excuse_letter');
        const prevMap = new Map(prev.map(l => [l._id, l]));
        backendLetters.forEach(l => prevMap.set(l._id, l));
        return Array.from(prevMap.values());
      });
    } catch {
      setExcuseLetters(prev => [...prev]); // keep local if backend fails
    }
  }

  async function fetchParentNotifications() {
    if (!currentUser || !currentUser._id) return;
    try {
      const inbox = await fetchInbox(currentUser._id, 'parent');
      // Map messages to notification format for dropdown
      setNotifications(inbox.map(msg => {
        // If the message is an approved excuse letter, show which teacher approved it
        let messageText = msg.content;
        if (msg.approverName) {
          messageText = `Excuse letter approved by ${msg.approverName}. ${msg.content}`;
        }
        // Compose sender string for display
        let senderString = 'Unknown';
        if (msg.sender) {
          if (msg.sender.id && msg.sender.role) {
            senderString = `${msg.sender.role} (${msg.sender.id})`;
          } else if (msg.sender.id) {
            senderString = msg.sender.id;
          } else {
            senderString = JSON.stringify(msg.sender);
          }
        }
        return {
          id: msg._id,
          title: msg.subject || 'Message',
          message: messageText,
          isRead: msg.status === 'read',
          icon: msg.type === 'excuse_letter' ? '✉️' : '🔔',
          priority: msg.status === 'approved' ? 'high' : (msg.status === 'pending' ? 'medium' : 'low'),
          timestamp: msg.createdAt,
          sender: senderString
        };
      }));
    } catch {
      setNotifications([]);
    }
  }

  // Parent inbox state and logic
  const [parentInbox, setParentInbox] = useState([]);
  const [parentInboxLoading, setParentInboxLoading] = useState(false);
  const [parentInboxError, setParentInboxError] = useState('');
  const [inboxView, setInboxView] = useState('received'); // 'received' or 'sent'
  const [parentSent, setParentSent] = useState([]);

  // Fetch parent inbox messages (received)
  useEffect(() => {
    async function fetchParentInbox() {
      if (!currentUser || !currentUser._id) return;
      setParentInboxLoading(true);
      setParentInboxError('');
      try {
        const inbox = await fetchInbox(currentUser._id, 'parent');
        setParentInbox(Array.isArray(inbox) ? inbox : []);
      } catch (err) {
        setParentInbox([]);
        setParentInboxError('Failed to load inbox');
      } finally {
        setParentInboxLoading(false);
      }
    }
    fetchParentInbox();
  }, [currentUser, unreadInboxCount]);

  // Fetch parent sent messages (excuse letters only)
  useEffect(() => {
    async function fetchParentSent() {
      if (!currentUser || !currentUser._id) return;
      try {
        const sent = await fetchSentMessages(currentUser._id);
        setParentSent(Array.isArray(sent) ? sent.filter(msg => msg.type === 'excuse_letter') : []);
      } catch {
        setParentSent([]);
      }
    }
    fetchParentSent();
  }, [currentUser]);

  // Mark as read handler (localStorage or backend)
  async function handleMarkAsRead(msgId) {
    const isValidObjectId = id => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
    const msg = parentInbox.find(m => m._id === msgId);
    if (!msg) return;
    if (!isValidObjectId(msgId)) {
      // LocalStorage message: update status locally
      try {
        const local = localStorage.getItem('adminSentMessages');
        let arr = local ? JSON.parse(local) : [];
        arr = arr.map(m => m._id === msgId ? { ...m, status: 'read' } : m);
        localStorage.setItem('adminSentMessages', JSON.stringify(arr));
      } catch {}
      setParentInbox(prev => prev.map(m => m._id === msgId ? { ...m, status: 'read' } : m));
    } else {
      // Backend message: update via API
      try {
        const { updateMessageStatus } = await import('../api/messageApi');
        await updateMessageStatus(msgId, 'read');
        setParentInbox(prev => prev.map(m => m._id === msgId ? { ...m, status: 'read' } : m));
      } catch {}
    }
    setUnreadInboxCount(Array.isArray(parentInbox) ? parentInbox.filter(msg => msg.status !== 'read').length : 0);
  }
  // Delete message handler for parent inbox (localStorage or backend)
  async function handleDeleteParentInboxMessage(msgId) {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    const isValidObjectId = id => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
    if (!isValidObjectId(msgId)) {
      // LocalStorage message: remove from localStorage
      try {
        const local = localStorage.getItem('adminSentMessages');
        let arr = local ? JSON.parse(local) : [];
        arr = arr.filter(m => m._id !== msgId);
        localStorage.setItem('adminSentMessages', JSON.stringify(arr));
      } catch {}
      setParentInbox(msgs => msgs.filter(m => m._id !== msgId));
    } else {
      // Backend message: delete via API
      try {
        const { deleteMessage } = await import('../api/messageApi');
        await deleteMessage(msgId);
        setParentInbox(msgs => msgs.filter(m => m._id !== msgId));
      } catch (err) {
        alert('Failed to delete message: ' + err.message);
      }
    }
    setUnreadInboxCount(Array.isArray(parentInbox) ? parentInbox.filter(msg => msg.status !== 'read').length : 0);
  }

  return (
    <div className="parent-dashboard-container" style={{display:'flex'}}>
      {/* Sidebar */}
      <aside style={{width:220,background:'#f7fafc',padding:'32px 0 0 0',borderRight:'1px solid #e3e3e3',minHeight:'100vh'}}>
        <nav style={{display:'flex',flexDirection:'column',gap:8}}>
          <button className="dashboard-btn" style={{margin:'0 16px',background:activeSidebar==='dashboard'?'#38b2ac':'#fff',color:activeSidebar==='dashboard'?'#fff':'#333'}} onClick={()=>setActiveSidebar('dashboard')}>Dashboard</button>
          <button className="dashboard-btn" style={{margin:'0 16px',background:activeSidebar==='excuse'?'#38b2ac':'#fff',color:activeSidebar==='excuse'?'#fff':'#333'}} onClick={()=>setActiveSidebar('excuse')}>Excuse Letter</button>
          <button className="dashboard-btn" style={{margin:'0 16px',background:activeSidebar==='inbox'?'#38b2ac':'#fff',color:activeSidebar==='inbox'?'#fff':'#333'}} onClick={()=>setActiveSidebar('inbox')}>Inbox {unreadInboxCount > 0 && (<span style={{ color: 'red', fontWeight: 'bold', marginLeft: 6 }}>{unreadInboxCount}</span>)}</button>
          <button className="dashboard-btn" style={{margin:'0 16px',background:activeSidebar==='profile'?'#38b2ac':'#fff',color:activeSidebar==='profile'?'#fff':'#333'}} onClick={()=>setShowProfile(true)}>Profile</button>
        </nav>
      </aside>
      <div style={{flex:1}}>
        <header className="parent-header" style={{
          background: 'linear-gradient(90deg, #010662 0%, #38b2ac 100%)',
          color: '#fff',
          padding: '24px 32px 18px 32px',
          borderBottom: '1px solid #e3e3e3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{display:'flex',alignItems:'center',width:'100%'}}>
            <h1 style={{fontSize:'2rem',fontWeight:700,margin:0,letterSpacing:'0.5px'}}>Parent Dashboard</h1>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:18}}>
              <div style={{position:'relative'}}>
                <NotificationIcon unreadCount={notifications.filter(n => !n.isRead).length} onClick={() => setShowNotifications(v => !v)} />
                <InboxIcon unreadCount={unreadInboxCount} onClick={() => setActiveSidebar('inbox')} />
                <NotificationDropdown
                  notifications={notifications}
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAsRead={id => setNotifications(n => n.map(msg => msg.id === id ? { ...msg, isRead: true } : msg))}
                  onMarkAllAsRead={() => setNotifications(n => n.map(msg => ({ ...msg, isRead: true })))}
                  onDelete={id => {
                    setNotifications(n => n.filter(msg => msg.id !== id));
                  }}
                />
              </div>
              <button className="dashboard-btn" onClick={() => setShowProfile(true)} style={{background:'#fff',color:'#010662',fontWeight:600,padding:'8px 18px',borderRadius:6,border:'none',boxShadow:'0 2px 8px rgba(1,6,98,0.08)',marginLeft:8}}>View Profile</button>
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 500, marginTop: 8, marginBottom: 4 }}>Welcome, {parentName}</div>
          <div style={{marginTop:4,fontSize:'1rem',color:'#e0e8f3',fontWeight:500}}>
            Unread Messages: <span style={{color:'#ffd700'}}>{unreadInboxCount}</span>
          </div>
        </header>
        <div className="parent-main-content">
          {activeSidebar === 'inbox' ? (
            <section className="parent-inbox-section" style={{marginBottom:32}}>
              <h2>Inbox</h2>
              <div style={{display:'flex',gap:12,marginBottom:18}}>
                <button
                  className="dashboard-btn"
                  style={{background:inboxView==='received'?'#3182ce':'#fff',color:inboxView==='received'?'#fff':'#3182ce',fontWeight:700}}
                  onClick={()=>setInboxView('received')}
                >Received</button>
                <button
                  className="dashboard-btn"
                  style={{background:inboxView==='sent'?'#3182ce':'#fff',color:inboxView==='sent'?'#fff':'#3182ce',fontWeight:700}}
                  onClick={()=>setInboxView('sent')}
                >Sent</button>
              </div>
              {inboxView === 'received' ? (
                parentInboxLoading ? (
                  <div>Loading...</div>
                ) : parentInboxError ? (
                  <div style={{color:'red'}}>{parentInboxError}</div>
                ) : parentInbox.length === 0 ? (
                  <div>No messages in your inbox.</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:18}}>
                    {parentInbox.map(msg => (
                      <div key={msg._id} style={{background:'#fff',borderRadius:10,padding:'18px 24px',boxShadow:'0 2px 8px rgba(33,150,243,0.07)',textAlign:'left',marginBottom:8}}>
                        <div style={{fontWeight:700,color:'#2b6cb0',marginBottom:4}}>
                          {msg.type === 'excuse_letter' ? 'Excuse Letter' : 'Message'} from{' '}
                          {/* Show teacher name if excuse letter and sender is teacher */}
                          {msg.type === 'excuse_letter' && (msg.approverName || (teachers.find(t => t._id === (msg.sender?.id || msg.sender))?.fullName))
                            ? (msg.approverName || teachers.find(t => t._id === (msg.sender?.id || msg.sender))?.fullName)
                            : (msg.sender?.id || 'Unknown')}
                          </div>
                          <div style={{fontSize:'1.05rem',color:'#333',marginBottom:6}}>{msg.content}</div>
                          <div style={{fontSize:'0.98rem',color:'#888'}}>Status: <b>{msg.status}</b>
                            {msg.status === 'approved' && (
                              <span style={{color:'#38a169',marginLeft:8}}>
                                (Approved by: {
                                  msg.approverName
                                    ? msg.approverName
                                    : (
                                        teachers.find(t => t._id === (msg.sender?.id || msg.sender))?.fullName ||
                                        teachers.find(t => t._id === (msg.recipient?.id || msg.recipient))?.fullName ||
                                        'Unknown'
                                      )
                                })
                              </span>
                            )}
                          </div>
                          <div style={{fontSize:'0.92rem',color:'#aaa'}}>Received: {new Date(msg.createdAt).toLocaleString()}</div>
                          <div style={{marginTop:10,display:'flex',gap:12}}>
                            {msg.status === 'unread' && (
                              <button onClick={() => handleMarkAsRead(msg._id)} style={{background:'#3182ce',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:600,cursor:'pointer'}}>Mark as Read</button>
                            )}
                            <button onClick={() => handleDeleteParentInboxMessage(msg._id)} style={{background:'#fff',color:'#e53e3e',border:'1px solid #e53e3e',borderRadius:6,padding:'6px 16px',fontWeight:600,cursor:'pointer'}}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                )
              ) : (
                parentSent.length === 0 ? (
                  <div>No sent excuse letters.</div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:18}}>
                    {parentSent.map(msg => (
                      <div key={msg._id} style={{background:'#f7fafc',borderRadius:10,padding:'18px 24px',boxShadow:'0 2px 8px rgba(33,150,243,0.07)',textAlign:'left',marginBottom:8}}>
                        <div style={{fontWeight:700,color:'#2b6cb0',marginBottom:4}}>
                          Excuse Letter to{' '}
                          {/* Show teacher name for sent excuse letter */}
                          {teachers.find(t => t._id === (msg.recipient?.id || msg.recipient))?.fullName || 'Unknown'}
                        </div>
                        <div style={{fontSize:'1.05rem',color:'#333',marginBottom:6}}>{msg.content}</div>
                        <div style={{fontSize:'0.98rem',color:'#888'}}>Status: <b>{msg.status}</b>
                          {msg.status === 'approved' && (
                            <span style={{color:'#38a169',marginLeft:8}}>
                              (Approved by: {
                                msg.approverName
                                  ? msg.approverName
                                  : (
                                      teachers.find(t => t._id === (msg.sender?.id || msg.sender))?.fullName ||
                                      teachers.find(t => t._id === (msg.recipient?.id || msg.recipient))?.fullName ||
                                      'Unknown'
                                    )
                              })
                            </span>
                          )}
                        </div>
                        <div style={{fontSize:'0.92rem',color:'#aaa'}}>Sent: {new Date(msg.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </section>
          ) : activeSidebar === 'excuse' ? (
            <section className="parent-excuse-section" style={{marginBottom:32}}>
              <h2>Excuse Letter Submission</h2>
              <form onSubmit={handleExcuseFormSubmit} style={{display:'flex',flexDirection:'column',gap:12,maxWidth:400}}>
                <label>Select Teacher:</label>
                <select name="teacherId" value={excuseForm.teacherId || ''} onChange={handleExcuseFormChange} required style={{minHeight:36}}>
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.fullName || t.name || t.username}</option>
                  ))}
                </select>
                <label>Reason for Absence:</label>
                <textarea name="reason" value={excuseForm.reason} onChange={handleExcuseFormChange} required style={{minHeight:60}} />
                <label>Upload Supporting Document:</label>
                <input type="file" name="file" accept="image/*,.pdf,.doc,.docx" onChange={handleExcuseFormChange} />
                <button type="submit" className="dashboard-btn">Submit Excuse Letter</button>
                {excuseStatus && <div style={{marginTop:8,color:'#38b2ac'}}>{excuseStatus}</div>}
              </form>
              <div style={{marginTop:24}}>
                <h3>Submitted Excuse Letters</h3>
                {excuseLetters.length === 0 ? (
                  <div>No excuse letters submitted yet.</div>
                ) : (
                  <table style={{width:'100%',marginTop:8}}>
                    <thead>
                      <tr>
                        <th>Reason</th>
                        <th>Teacher</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excuseLetters.map(letter => (
                        <tr key={letter._id}>
                          <td>{letter.content}</td>
                          <td>
                            {letter.approverName
                              ? <span style={{color:'#38b2ac',fontWeight:600}}>Approved by: {letter.approverName}</span>
                              : (teachers.find(t => t._id === (letter.recipient?.id || letter.recipient))?.fullName ||
                                 teachers.find(t => t._id === (letter.sender?.id || letter.sender))?.fullName || 'Unknown')}
                          </td>
                          <td>
                            {letter.status}
                            {letter.status === 'approved' && letter.approverName && (
                              <span style={{color:'#38a169',marginLeft:8}}>(Approved by: {letter.approverName})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : (
            <>
              <section className="parent-students-section">
                <h2>My Children</h2>
                <div className="parent-students-list">
                  {linkedStudents.length === 0 ? (
                    <div>No linked students found.</div>
                  ) : (
                    linkedStudents.map(student => (
                      <div key={student.id} className="parent-student-card" style={{display:'flex',alignItems:'center',gap:24,marginBottom:24,padding:'16px 24px',background:'#f7fafc',borderRadius:10,boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                        <div>
                          <img src={student.photo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(student.name)} alt="Student" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',background:'#e3f2fd'}} />
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:20,fontWeight:600}}>{student.name}</div>
                          <div style={{marginTop:4,color:'#555'}}>Grade: {student.grade || 'N/A'} | Section: {student.section}</div>
                          <div style={{marginTop:4,color:'#555'}}>Subjects: {student.subjects?.join(', ') || 'N/A'}</div>
                          <div style={{marginTop:8}}>
                            <strong>Status:</strong> <span style={{color:student.status==='present'?'#38b2ac':'#ff4757',fontWeight:600}}>{student.status}</span>
                          </div>
                          <div style={{marginTop:12}}>
                            <strong>Recent Attendance:</strong>
                            <div style={{display:'flex',gap:6,marginTop:4}}>
                              {(student.recentAttendance||[]).slice(-7).map((att,i) => (
                                <span key={i} style={{width:22,height:22,borderRadius:'50%',background:att==='present'?'#38b2ac':'#ff4757',display:'inline-block',color:'#fff',textAlign:'center',lineHeight:'22px',fontWeight:700}}>{att==='present'?'P':'A'}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{marginTop:12}}>
                            <strong>Teachers in Section:</strong>
                            <div style={{marginTop:4}}>
                              {teachers.filter(t => Array.isArray(t.assignedSections) && t.assignedSections.includes(student.section)).length === 0 ? (
                                <span style={{color:'#888'}}>No teachers found for this section.</span>
                              ) : (
                                teachers.filter(t => Array.isArray(t.assignedSections) && t.assignedSections.includes(student.section)).map(t => (
                                  <div key={t._id} style={{color:'#3182ce',fontWeight:600,marginBottom:4}}>
                                    {t.fullName || t.name || t.username}
                                    <div style={{fontSize:'0.98rem',color:'#555',marginLeft:8}}>
                                      Contact: {t.contact || 'N/A'}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section className="parent-attendance-section">
                <h2>Attendance Records</h2>
                <div className="parent-attendance-list">
                  {attendanceRecords.length === 0 ? (
                    <div>No attendance records found.</div>
                  ) : (
                    attendanceRecords.map(record => (
                      <div key={record.date} className="attendance-record">
                        <div>Date: {record.date}</div>
                        <div>Status: {record.status}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section className="parent-announcements-section">
                <h2>Upcoming Events & Announcements</h2>
                <div className="parent-announcements-scroll" style={{display:'flex',overflowX:'auto',gap:16,padding:'8px 0'}}>
                  {announcements.length === 0 ? (
                    <div style={{padding:'16px'}}>No announcements found.</div>
                  ) : (
                    announcements.map(announcement => (
                      <div key={announcement.id} className="announcement-card" style={{minWidth:280,maxWidth:320,background:'#fffbea',borderRadius:10,padding:'18px 16px',boxShadow:'0 2px 8px rgba(246,173,85,0.10)'}}>
                        <div className="announcement-title" style={{fontWeight:700,fontSize:18,color:'#f6ad55',marginBottom:6}}>{announcement.title}</div>
                        <div className="announcement-date" style={{fontSize:13,color:'#555',marginBottom:8}}>{announcement.date}</div>
                        <div className="announcement-content" style={{fontSize:15}}>{announcement.content}</div>
                        {announcement.details && <div style={{marginTop:8,fontSize:14,color:'#444'}}>{announcement.details}</div>}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
        {showProfile && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{marginBottom:8}}>Parent Profile</h2>
              <div style={{display:'flex',alignItems:'center',gap:24}}>
                <div>
                  {/* Placeholder for photo, can be replaced with real photo field */}
                  <div style={{width:100,height:100,borderRadius:'50%',background:'#e3f2fd',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#2196F3'}}>
                    {parentName ? parentName[0] : '👤'}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:22,fontWeight:600}}>{parentName}</div>
                  <div style={{marginTop:8,color:'#555'}}>Role: Parent</div>
                  <div style={{marginTop:8,color:'#555'}}>Email: {currentUser?.email}</div>
                  <div style={{marginTop:12}}><strong>Contact:</strong> {currentUser?.contact || 'No contact set.'}</div>
                  <div style={{marginTop:12}}><strong>Address:</strong> {currentUser?.address || 'No address set.'}</div>
                  <div style={{marginTop:12}}><strong>Linked Student(s):</strong> {
                    (() => {
                      let linked = currentUser?.linkedStudent;
                      if (!Array.isArray(linked)) {
                        if (typeof linked === 'string' && linked) linked = [linked];
                        else if (linked == null) linked = [];
                        else linked = Array.from(linked);
                      }
                      if (linked.length === 0) return 'None linked.';
                      return linked.join(', ');
                    })()
                  }</div>
                </div>
              </div>
              <div style={{marginTop:24,textAlign:'right'}}>
                <button className="dashboard-btn" onClick={() => setShowProfile(false)}>Close</button>
              </div>
            </div>
            <style>{`
              .modal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 9999;
              }
              .modal-content {
                background: #fff; padding: 32px 24px; border-radius: 10px; box-shadow: 0 2px 16px rgba(0,0,0,0.15); min-width: 340px; max-width: 95vw;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardParent;
