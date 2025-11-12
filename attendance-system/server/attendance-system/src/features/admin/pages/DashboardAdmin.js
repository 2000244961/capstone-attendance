import React, { useState } from 'react';
import { useUser } from '../../../shared/UserContext';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../shared/useDashboard';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import NotificationIcon from '../../../shared/components/NotificationIcon';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import ManageStudent from '../../students/pages/ManageStudent';
import './styles/DashboardAdmin.css';

function DashboardAdmin() {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { data: dashboardData, refresh: refreshDashboard } = useDashboardData(30000);
  const [activeSection, setActiveSection] = useState('overview');
  // Notification system
  const notifications = useNotifications('admin');

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">SPCC Admin Portal</h2>
        <nav className="admin-nav">
          <ul>
            <li className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}>Overview</li>
            {/* ...other nav items... */}
            <li onClick={() => navigate('/')}>Logout</li>
          </ul>
        </nav>
      </aside>
      {/* Main content */}
      <main className="admin-main-content">
        {activeSection === 'students' && (
          <ManageStudent refreshDashboard={refreshDashboard} />
        )}
        {/* ...dashboard content... */}
      </main>
    </div>
  );
}

export default DashboardAdmin;
