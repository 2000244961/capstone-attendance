import React, { useState, useEffect } from 'react';
import { useUser } from '../shared/UserContext';
import InboxIcon from '../shared/components/InboxIcon';
import { fetchInbox, sendExcuseLetter, fetchSentMessages } from '../api/messageApi';
import { fetchAllTeachers } from '../api/userApi';
import '../styles/DashboardParent.css';

function DashboardParent() {
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const { user: currentUser } = useUser();
  const parentName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Parent';

  useEffect(() => {
    // Placeholder for data fetching
  }, [currentUser]);

  return (
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
              <InboxIcon unreadCount={unreadInboxCount} onClick={() => {}} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 500, marginTop: 8, marginBottom: 4 }}>Welcome, {parentName}</div>
        <div style={{marginTop:4,fontSize:'1rem',color:'#e0e8f3',fontWeight:500}}>
          Unread Messages: <span style={{color:'#ffd700'}}>{unreadInboxCount}</span>
        </div>
      </header>
      {/* Main content placeholder */}
      {showProfile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginBottom:8}}>Parent Profile</h2>
            <div style={{display:'flex',alignItems:'center',gap:24}}>
              <div>
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
  );
}

export default DashboardParent;
