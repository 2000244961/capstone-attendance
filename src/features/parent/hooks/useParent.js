import { useState, useEffect } from 'react';

// Custom hook for parent dashboard functionality
export const useParentDashboard = () => {
  const [parentData, setParentData] = useState({
    children: [],
    alerts: [],
    messages: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const parents = JSON.parse(localStorage.getItem('parents') || '[]');
      const students = JSON.parse(localStorage.getItem('students') || '[]');
      const attendance = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      const sections = JSON.parse(localStorage.getItem('sections') || '[]');
      
      // Find current parent
      const currentParent = parents.find(parent => parent.email === currentUser.username);
      
      if (currentParent && currentParent.children) {
        // Get detailed children information
        const childrenDetails = currentParent.children.map(childId => {
          const student = students.find(s => s.studentId === childId || s.id === childId);
          return student || { studentId: childId, name: `Student ${childId}`, section: 'Unknown' };
        });

        setParentData(prev => ({
          ...prev,
          children: childrenDetails,
          loading: false
        }));
      } else {
        // Initialize sample data if no parent data exists
        initializeSampleData();
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
      setParentData(prev => ({
        ...prev,
        error: 'Failed to load parent data',
        loading: false
      }));
    }
  };

  const initializeSampleData = () => {
    const sampleChildren = [
      {
        studentId: 'STU001',
        name: 'John Doe',
        section: 'A',
        grade: '10',
        subjects: ['Mathematics', 'Science', 'English']
      }
    ];

    setParentData(prev => ({
      ...prev,
      children: sampleChildren,
      loading: false
    }));
  };

  // Get today's attendance for a specific child
  const getTodayAttendance = (studentId) => {
    const today = new Date().toDateString();
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const todayRecord = attendanceRecords.find(record => 
      record.studentId === studentId && 
      new Date(record.date).toDateString() === today
    );
    
    return todayRecord ? todayRecord.status === 'present' : false;
  };

  // Get weekly attendance statistics
  const getWeeklyStats = (studentId) => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const weekRecords = attendanceRecords.filter(record => 
      record.studentId === studentId && 
      new Date(record.date) >= weekStart
    );
    
    const present = weekRecords.filter(record => record.status === 'present').length;
    const total = weekRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, total, percentage };
  };

  // Get monthly attendance statistics
  const getMonthlyStats = (studentId) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const monthRecords = attendanceRecords.filter(record => 
      record.studentId === studentId && 
      new Date(record.date) >= monthStart
    );
    
    const present = monthRecords.filter(record => record.status === 'present').length;
    const total = monthRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    let grade = 'Poor';
    if (percentage >= 95) grade = 'Excellent';
    else if (percentage >= 85) grade = 'Good';
    else if (percentage >= 70) grade = 'Average';
    
    return { present, total, percentage, grade };
  };

  // Get yearly attendance statistics
  const getYearlyStats = (studentId) => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const yearRecords = attendanceRecords.filter(record => 
      record.studentId === studentId && 
      new Date(record.date) >= yearStart
    );
    
    const present = yearRecords.filter(record => record.status === 'present').length;
    const total = yearRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, total, percentage };
  };

  // Get attendance for a specific date
  const getAttendanceForDate = (studentId, date) => {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    return attendanceRecords.find(record => 
      record.studentId === studentId && 
      new Date(record.date).toDateString() === date.toDateString()
    );
  };

  // Get subject-wise attendance statistics
  const getSubjectStats = (studentId) => {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    return subjects.map(subject => {
      const subjectRecords = attendanceRecords.filter(record => 
        record.studentId === studentId && record.subject === subject.name
      );
      
      const present = subjectRecords.filter(record => record.status === 'present').length;
      const total = subjectRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return {
        name: subject.name,
        section: subject.section || 'A',
        present,
        total,
        percentage
      };
    });
  };

  // Get recent activity for a child
  const getRecentActivity = (studentId) => {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    
    const recentRecords = attendanceRecords
      .filter(record => record.studentId === studentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    return recentRecords.map(record => ({
      type: record.status === 'present' ? 'attendance' : 'absence',
      title: record.status === 'present' ? 'Attended Class' : 'Missed Class',
      description: `${record.subject || 'General'} - ${record.status}`,
      time: new Date(record.date).toLocaleDateString()
    }));
  };

  // Get alerts and notifications
  const getAlerts = (studentId) => {
    const alerts = [];
    const monthlyStats = getMonthlyStats(studentId);
    const weeklyStats = getWeeklyStats(studentId);
    
    // Low attendance alert
    if (monthlyStats.percentage < 75) {
      alerts.push({
        type: 'low-attendance',
        title: 'Low Attendance Warning',
        message: `Attendance is ${monthlyStats.percentage}%. Minimum required is 75%.`,
        timestamp: new Date().toLocaleDateString()
      });
    }
    
    // Weekly absence alert
    if (weeklyStats.percentage < 80) {
      alerts.push({
        type: 'absence',
        title: 'Weekly Absence Alert',
        message: `Multiple absences this week. Current week attendance: ${weeklyStats.percentage}%`,
        timestamp: new Date().toLocaleDateString()
      });
    }
    
    // Achievement alert
    if (monthlyStats.percentage >= 95) {
      alerts.push({
        type: 'achievement',
        title: 'Excellent Attendance!',
        message: `Outstanding attendance record: ${monthlyStats.percentage}%`,
        timestamp: new Date().toLocaleDateString()
      });
    }
    
    return alerts;
  };

  // Get child's subjects
  const getSubjects = (studentId) => {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    const student = students.find(s => s.studentId === studentId);
    
    // Sample subjects if no data exists
    if (!student || subjects.length === 0) {
      return [
        {
          name: 'Mathematics',
          section: 'A',
          teacher: 'Ms. Smith',
          schedule: 'Mon, Wed, Fri - 9:00 AM',
          room: 'Room 101',
          attendance: 92
        },
        {
          name: 'Science',
          section: 'A',
          teacher: 'Mr. Johnson',
          schedule: 'Tue, Thu - 10:30 AM',
          room: 'Room 201',
          attendance: 88
        },
        {
          name: 'English',
          section: 'A',
          teacher: 'Mrs. Davis',
          schedule: 'Mon, Wed, Fri - 2:00 PM',
          room: 'Room 102',
          attendance: 95
        }
      ];
    }
    
    return subjects.filter(subject => subject.section === student.section);
  };

  // Get teacher feedback
  const getTeacherFeedback = (studentId) => {
    const feedback = JSON.parse(localStorage.getItem('teacherFeedback') || '[]');
    
    const studentFeedback = feedback.filter(item => item.studentId === studentId);
    
    // Sample feedback if no data exists
    if (studentFeedback.length === 0) {
      return [
        {
          subject: 'Mathematics',
          teacher: 'Ms. Smith',
          content: 'Excellent progress in algebra. Shows great problem-solving skills.',
          date: new Date().toLocaleDateString(),
          type: 'positive'
        },
        {
          subject: 'Science',
          teacher: 'Mr. Johnson',
          content: 'Good participation in lab activities. Could improve on homework submission.',
          date: new Date(Date.now() - 86400000).toLocaleDateString(),
          type: 'neutral'
        }
      ];
    }
    
    return studentFeedback;
  };

  // Get message history
  const getMessages = (studentId) => {
    const messages = JSON.parse(localStorage.getItem('parentTeacherMessages') || '[]');
    
    return messages.filter(message => message.studentId === studentId);
  };

  return {
    children: parentData.children,
    loading: parentData.loading,
    error: parentData.error,
    getTodayAttendance,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats,
    getAttendanceForDate,
    getSubjectStats,
    getRecentActivity,
    getAlerts,
    getSubjects,
    getTeacherFeedback,
    getMessages,
    refresh: loadParentData
  };
};

export default useParentDashboard;
