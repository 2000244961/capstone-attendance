// Custom React hook for dashboard data
// This provides real-time dashboard statistics that auto-refresh

import { useState, useEffect } from 'react';
import { getDashboardStats } from './dashboardUtils';

export const useDashboardData = (refreshInterval = 30000) => {
  const [dashboardData, setDashboardData] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    studentsPresent: 0,
    attendancePercentage: 0,
    todaysClasses: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshData = () => {
    try {
      setError(null);
      const stats = getDashboardStats();
      setDashboardData(stats);
      setLoading(false);
      console.log('📊 Dashboard data refreshed via hook');
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Error in dashboard hook:', err);
    }
  };

  useEffect(() => {
    refreshData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
    data: dashboardData,
    loading,
    error,
    refresh: refreshData
  };
};

// Remove useSubjectData since getSubjectStats is not available
