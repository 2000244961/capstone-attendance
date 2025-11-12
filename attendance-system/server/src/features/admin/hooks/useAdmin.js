import { useState, useEffect, useCallback } from 'react';
import adminUtils from '../adminUtils';

// Hook for managing admin dashboard data
export const useAdminDashboard = (refreshInterval = 30000) => {
  const [data, setData] = useState({
    stats: {},
    analytics: {},
    diagnostics: {},
    loading: true,
    error: null
  });

  const refreshData = useCallback(() => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const stats = adminUtils.getSystemStats();
      const analytics = adminUtils.getAttendanceAnalytics();
      const diagnostics = adminUtils.performSystemDiagnostics();

      setData({
        stats,
        analytics,
        diagnostics,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    refreshData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, refreshInterval]);

  return { ...data, refresh: refreshData };
};

// Hook for user management
export const useUserManagement = () => {
  const [users, setUsers] = useState({
    teachers: [],
    students: [],
    parents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(() => {
    try {
      setLoading(true);
      const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
      const students = JSON.parse(localStorage.getItem('students')) || [];
      const parents = JSON.parse(localStorage.getItem('parents')) || [];
      
      setUsers({ teachers, students, parents });
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const addUser = useCallback((userType, userData) => {
    try {
      const validationErrors = adminUtils.validateUserData(userData, userType);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      const updatedUsers = [...users[userType], newUser];
      setUsers(prev => ({ ...prev, [userType]: updatedUsers }));
      localStorage.setItem(userType, JSON.stringify(updatedUsers));

      // Log the action
      logSystemAction(`Added new ${userType.slice(0, -1)}: ${userData.name || userData.email}`);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Error adding user:', error);
      return { success: false, error: error.message };
    }
  }, [users]);

  const updateUser = useCallback((userType, userId, updatedData) => {
    try {
      const updatedUsers = users[userType].map(user => 
        user.id === userId 
          ? { ...user, ...updatedData, updatedAt: new Date().toISOString() } 
          : user
      );
      
      setUsers(prev => ({ ...prev, [userType]: updatedUsers }));
      localStorage.setItem(userType, JSON.stringify(updatedUsers));

      logSystemAction(`Updated ${userType.slice(0, -1)} ID: ${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }, [users]);

  const deleteUser = useCallback((userType, userId) => {
    try {
      const updatedUsers = users[userType].filter(user => user.id !== userId);
      setUsers(prev => ({ ...prev, [userType]: updatedUsers }));
      localStorage.setItem(userType, JSON.stringify(updatedUsers));

      logSystemAction(`Deleted ${userType.slice(0, -1)} ID: ${userId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }, [users]);

  const searchUsers = useCallback((userType, searchTerm) => {
    if (!searchTerm) return users[userType];
    
    const term = searchTerm.toLowerCase();
    return users[userType].filter(user => 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.studentId?.toLowerCase().includes(term) ||
      user.employeeId?.toLowerCase().includes(term)
    );
  }, [users]);

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    searchUsers,
    refresh: loadUsers
  };
};

// Hook for system logs and audit trail
export const useSystemLogs = (maxLogs = 100) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(() => {
    try {
      setLoading(true);
      const systemLogs = JSON.parse(localStorage.getItem('systemLogs')) || [];
      setLogs(systemLogs.slice(0, maxLogs));
      setError(null);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maxLogs]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const addLog = useCallback((action, type = 'admin_action', admin = 'Admin User') => {
    const logEntry = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      admin,
      type
    };

    const updatedLogs = [logEntry, ...logs].slice(0, 1000); // Keep last 1000 logs
    setLogs(updatedLogs);
    localStorage.setItem('systemLogs', JSON.stringify(updatedLogs));
  }, [logs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('systemLogs');
  }, []);

  const filterLogs = useCallback((filters) => {
    let filteredLogs = [...logs];

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    if (filters.admin) {
      filteredLogs = filteredLogs.filter(log => 
        log.admin.toLowerCase().includes(filters.admin.toLowerCase())
      );
    }

    if (filters.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.action.toLowerCase().includes(term)
      );
    }

    return filteredLogs;
  }, [logs]);

  return {
    logs,
    loading,
    error,
    addLog,
    clearLogs,
    filterLogs,
    refresh: loadLogs
  };
};

// Hook for announcements management
export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnnouncements = useCallback(() => {
    try {
      setLoading(true);
      const storedAnnouncements = JSON.parse(localStorage.getItem('announcements')) || [];
      setAnnouncements(storedAnnouncements);
      setError(null);
    } catch (err) {
      console.error('Error loading announcements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const createAnnouncement = useCallback((announcementData) => {
    try {
      const announcement = {
        id: Date.now().toString(),
        ...announcementData,
        createdAt: new Date().toISOString(),
        status: 'active',
        readBy: []
      };

      const updatedAnnouncements = [announcement, ...announcements];
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));

      logSystemAction(`Created announcement: ${announcementData.title}`);
      
      return { success: true, announcement };
    } catch (error) {
      console.error('Error creating announcement:', error);
      return { success: false, error: error.message };
    }
  }, [announcements]);

  const updateAnnouncement = useCallback((id, updatedData) => {
    try {
      const updatedAnnouncements = announcements.map(announcement =>
        announcement.id === id
          ? { ...announcement, ...updatedData, updatedAt: new Date().toISOString() }
          : announcement
      );

      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));

      logSystemAction(`Updated announcement ID: ${id}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating announcement:', error);
      return { success: false, error: error.message };
    }
  }, [announcements]);

  const deleteAnnouncement = useCallback((id) => {
    try {
      const updatedAnnouncements = announcements.filter(announcement => announcement.id !== id);
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));

      logSystemAction(`Deleted announcement ID: ${id}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return { success: false, error: error.message };
    }
  }, [announcements]);

  const markAsRead = useCallback((announcementId, userId) => {
    try {
      const updatedAnnouncements = announcements.map(announcement => {
        if (announcement.id === announcementId) {
          const readBy = announcement.readBy || [];
          if (!readBy.includes(userId)) {
            return { ...announcement, readBy: [...readBy, userId] };
          }
        }
        return announcement;
      });

      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
      
      return { success: true };
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      return { success: false, error: error.message };
    }
  }, [announcements]);

  return {
    announcements,
    loading,
    error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead,
    refresh: loadAnnouncements
  };
};

// Hook for flagged records management
export const useFlaggedRecords = () => {
  const [flaggedRecords, setFlaggedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFlaggedRecords = useCallback(() => {
    try {
      setLoading(true);
      const storedFlagged = JSON.parse(localStorage.getItem('flaggedRecords')) || [];
      const duplicates = adminUtils.findDuplicateAttendanceRecords();
      
      // Combine stored flagged records with automatically detected issues
      const allFlagged = [
        ...storedFlagged,
        ...duplicates.map(dup => ({
          id: `dup_${dup.duplicate.index}`,
          type: 'duplicate_attendance',
          description: `Duplicate attendance record for student ${dup.duplicate.studentId}`,
          data: dup,
          createdAt: new Date().toISOString(),
          status: 'pending',
          severity: 'medium'
        }))
      ];

      setFlaggedRecords(allFlagged);
      setError(null);
    } catch (err) {
      console.error('Error loading flagged records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlaggedRecords();
  }, [loadFlaggedRecords]);

  const flagRecord = useCallback((recordData) => {
    try {
      const flaggedRecord = {
        id: Date.now().toString(),
        ...recordData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      const updatedFlagged = [...flaggedRecords, flaggedRecord];
      setFlaggedRecords(updatedFlagged);
      
      // Store only manually flagged records
      const manuallyFlagged = updatedFlagged.filter(record => !record.id.startsWith('dup_'));
      localStorage.setItem('flaggedRecords', JSON.stringify(manuallyFlagged));

      logSystemAction(`Flagged record: ${recordData.description}`);
      
      return { success: true, record: flaggedRecord };
    } catch (error) {
      console.error('Error flagging record:', error);
      return { success: false, error: error.message };
    }
  }, [flaggedRecords]);

  const resolveFlaggedRecord = useCallback((id, resolution) => {
    try {
      const updatedFlagged = flaggedRecords.map(record =>
        record.id === id
          ? { 
              ...record, 
              status: 'resolved', 
              resolution,
              resolvedAt: new Date().toISOString() 
            }
          : record
      );

      setFlaggedRecords(updatedFlagged);
      
      // Store only manually flagged records
      const manuallyFlagged = updatedFlagged.filter(record => !record.id.startsWith('dup_'));
      localStorage.setItem('flaggedRecords', JSON.stringify(manuallyFlagged));

      logSystemAction(`Resolved flagged record ID: ${id}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error resolving flagged record:', error);
      return { success: false, error: error.message };
    }
  }, [flaggedRecords]);

  const dismissFlaggedRecord = useCallback((id) => {
    try {
      const updatedFlagged = flaggedRecords.filter(record => record.id !== id);
      setFlaggedRecords(updatedFlagged);
      
      // Store only manually flagged records
      const manuallyFlagged = updatedFlagged.filter(record => !record.id.startsWith('dup_'));
      localStorage.setItem('flaggedRecords', JSON.stringify(manuallyFlagged));

      logSystemAction(`Dismissed flagged record ID: ${id}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error dismissing flagged record:', error);
      return { success: false, error: error.message };
    }
  }, [flaggedRecords]);

  return {
    flaggedRecords,
    loading,
    error,
    flagRecord,
    resolveFlaggedRecord,
    dismissFlaggedRecord,
    refresh: loadFlaggedRecords
  };
};

// Utility function for logging (used by hooks)
const logSystemAction = (action, type = 'admin_action', admin = 'Admin User') => {
  try {
    const logEntry = {
      id: Date.now().toString(),
      action,
      timestamp: new Date().toISOString(),
      admin,
      type
    };

    const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
    const updatedLogs = [logEntry, ...logs].slice(0, 1000);
    localStorage.setItem('systemLogs', JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error logging system action:', error);
  }
};
