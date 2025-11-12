// Custom React hook for dashboard data
// This provides real-time dashboard statistics that auto-refresh

import { useState, useEffect } from 'react';
import { getDashboardStats, getSubjectStats, getRecentActivity, getAttendanceTrends } from './dashboardUtils';

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

export const useSubjectData = () => {
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshSubjectData = () => {
    try {
      const stats = getSubjectStats();
      setSubjectData(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading subject data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubjectData();
  }, []);

  return {
    subjects: subjectData,
    loading,
    refresh: refreshSubjectData
  };
};

export const useRecentActivity = (limit = 10) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshActivities = () => {
    try {
      const recentActivities = getRecentActivity().slice(0, limit);
      setActivities(recentActivities);
      setLoading(false);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshActivities();
  }, [limit]);

  return {
    activities,
    loading,
    refresh: refreshActivities
  };
};

export const useAttendanceTrends = (days = 7) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshTrends = () => {
    try {
      const trendData = getAttendanceTrends(days);
      setTrends(trendData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading attendance trends:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTrends();
  }, [days]);

  return {
    trends,
    loading,
    refresh: refreshTrends
  };
};
