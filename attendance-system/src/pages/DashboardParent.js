
import React, { useState, useEffect } from 'react';
import { useUser } from '../shared/UserContext';
import InboxIcon from '../shared/components/InboxIcon';
import { fetchInbox, sendExcuseLetter, fetchSentMessages } from '../api/messageApi';
import { fetchAllTeachers, fetchUserProfile } from '../api/userApi';
import { fetchAttendance } from '../api/attendanceApi';
import '../styles/DashboardParent.css';


function DashboardParent() {
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today in yyyy-mm-dd
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useUser();
  const parentName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Parent';

  // Fetch linked students for this parent
  useEffect(() => {
    async function fetchLinked() {
      if (!currentUser?._id) return;
      try {
        const profile = await fetchUserProfile(currentUser._id);
        // linkedStudent is now an array of string IDs
        setLinkedStudents(profile.linkedStudent || []);
      } catch (e) {
        setLinkedStudents([]);
      }
    }
    fetchLinked();
  }, [currentUser]);

  // Fetch attendance for linked students and selected date
  useEffect(() => {
    async function fetchAttendanceForStudents() {
      if (!linkedStudents.length || !selectedDate) {
        setAttendance([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch all attendance for the date
        const allAttendance = await fetchAttendance({ date: selectedDate });
        // linkedStudents is now an array of string IDs
        const filtered = allAttendance.filter(a => linkedStudents.includes(a.studentId));
        setAttendance(filtered);
      } catch (e) {
        setAttendance([]);
      }
      setLoading(false);
    }
    fetchAttendanceForStudents();
  }, [linkedStudents, selectedDate]);


  return (
    <div style={{ flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Parent Dashboard</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative' }}>
              <InboxIcon unreadCount={unreadInboxCount} onClick={() => {}} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 500, marginTop: 8, marginBottom: 4 }}>Welcome, {parentName}</div>
        <div style={{ marginTop: 4, fontSize: '1rem', color: '#e0e8f3', fontWeight: 500 }}>
          Unread Messages: <span style={{ color: '#ffd700' }}>{unreadInboxCount}</span>
        </div>
      </header>

      {/* Attendance Section */}
      <div style={{ margin: '32px 24px 0 24px', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Student Attendance</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ marginLeft: 16, fontSize: 16, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        {loading ? (
          <div>Loading attendance...</div>
        ) : (
          <>
            {linkedStudents.length === 0 ? (
              <div style={{ color: '#888' }}>No linked students found for this parent.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr style={{ background: '#f5f7fa' }}>
                    <th style={{ padding: 8, border: '1px solid #e3e3e3' }}>Student Name</th>
                    <th style={{ padding: 8, border: '1px solid #e3e3e3' }}>Status</th>
                    <th style={{ padding: 8, border: '1px solid #e3e3e3' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedStudents.map(studentId => {
                    const att = attendance.find(a => a.studentId === studentId);
                    return (
                      <tr key={studentId}>
                        <td style={{ padding: 8, border: '1px solid #e3e3e3' }}>{studentId}</td>
                        <td style={{ padding: 8, border: '1px solid #e3e3e3' }}>{att ? att.status : 'Absent'}</td>
                        <td style={{ padding: 8, border: '1px solid #e3e3e3' }}>{att ? (att.time || '-') : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Main content placeholder */}
      {showProfile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: 8 }}>Parent Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#2196F3' }}>
                  {parentName ? parentName[0] : '👤'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{parentName}</div>
                <div style={{ marginTop: 8, color: '#555' }}>Role: Parent</div>
                <div style={{ marginTop: 8, color: '#555' }}>Email: {currentUser?.email}</div>
                <div style={{ marginTop: 12 }}><strong>Contact:</strong> {currentUser?.contact || 'No contact set.'}</div>
                <div style={{ marginTop: 12 }}><strong>Address:</strong> {currentUser?.address || 'No address set.'}</div>
              </div>
            </div>
            <div style={{ marginTop: 24, textAlign: 'right' }}>
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
  );
}

export default DashboardParent;
