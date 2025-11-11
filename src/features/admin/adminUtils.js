// Admin Dashboard Utilities
export const adminUtils = {
  // User Management
  validateUserData: (userData, userType) => {
    const errors = [];
    
    if (!userData.name || userData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!userData.email || !adminUtils.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }
    
    if (userType === 'students' && !userData.studentId) {
      errors.push('Student ID is required');
    }
    
    if (userType === 'teachers' && !userData.employeeId) {
      errors.push('Employee ID is required');
    }
    
    return errors;
  },

  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // System Statistics
  getSystemStats: () => {
    try {
      const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
      const students = JSON.parse(localStorage.getItem('students')) || [];
      const parents = JSON.parse(localStorage.getItem('parents')) || [];
      const subjects = JSON.parse(localStorage.getItem('subjectSections')) || [];
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
      const announcements = JSON.parse(localStorage.getItem('announcements')) || [];

      // Calculate today's attendance
      const today = new Date().toDateString();
      const todaysAttendance = attendanceRecords.filter(record => 
        new Date(record.timestamp).toDateString() === today
      );

      // Calculate unique students present today
      const uniqueStudentsToday = new Set(
        todaysAttendance.map(record => record.studentId)
      ).size;

      // Calculate attendance percentage
      const attendancePercentage = students.length > 0 
        ? Math.round((uniqueStudentsToday / students.length) * 100)
        : 0;

      // Calculate classes conducted today
      const classesToday = new Set(
        todaysAttendance.map(record => `${record.subject}-${record.section}`)
      ).size;

      return {
        totalUsers: teachers.length + students.length + parents.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalParents: parents.length,
        totalSubjects: subjects.length,
        studentsPresent: uniqueStudentsToday,
        attendancePercentage,
        classesToday,
        totalAttendanceRecords: attendanceRecords.length,
        activeAnnouncements: announcements.filter(a => a.status === 'active').length
      };
    } catch (error) {
      console.error('Error calculating system stats:', error);
      return {
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalParents: 0,
        totalSubjects: 0,
        studentsPresent: 0,
        attendancePercentage: 0,
        classesToday: 0,
        totalAttendanceRecords: 0,
        activeAnnouncements: 0
      };
    }
  },

  // Attendance Analytics
  getAttendanceAnalytics: (dateRange = 7) => {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
      const students = JSON.parse(localStorage.getItem('students')) || [];
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);

      const filteredRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
      });

      // Daily attendance trends
      const dailyTrends = [];
      for (let i = 0; i < dateRange; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayRecords = filteredRecords.filter(record => 
          new Date(record.timestamp).toDateString() === dateStr
        );
        
        const uniqueStudents = new Set(dayRecords.map(r => r.studentId)).size;
        const percentage = students.length > 0 ? (uniqueStudents / students.length) * 100 : 0;
        
        dailyTrends.unshift({
          date: dateStr,
          studentsPresent: uniqueStudents,
          percentage: Math.round(percentage),
          totalRecords: dayRecords.length
        });
      }

      // Subject-wise attendance
      const subjectStats = {};
      filteredRecords.forEach(record => {
        const key = `${record.subject}-${record.section}`;
        if (!subjectStats[key]) {
          subjectStats[key] = {
            subject: record.subject,
            section: record.section,
            totalRecords: 0,
            uniqueStudents: new Set()
          };
        }
        subjectStats[key].totalRecords++;
        subjectStats[key].uniqueStudents.add(record.studentId);
      });

      const subjectAnalytics = Object.values(subjectStats).map(stat => ({
        ...stat,
        uniqueStudents: stat.uniqueStudents.size
      }));

      return {
        dailyTrends,
        subjectAnalytics,
        totalRecordsInRange: filteredRecords.length,
        averageAttendance: dailyTrends.reduce((sum, day) => sum + day.percentage, 0) / dailyTrends.length || 0
      };
    } catch (error) {
      console.error('Error calculating attendance analytics:', error);
      return {
        dailyTrends: [],
        subjectAnalytics: [],
        totalRecordsInRange: 0,
        averageAttendance: 0
      };
    }
  },

  // System Health Check
  performSystemDiagnostics: () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      issues: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Check localStorage availability and size
      const storageTest = 'test';
      localStorage.setItem(storageTest, storageTest);
      localStorage.removeItem(storageTest);
      
      // Check data integrity
      const requiredKeys = ['teachers', 'students', 'subjectSections', 'attendanceRecords'];
      requiredKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            JSON.parse(data);
          } else {
            diagnostics.warnings.push(`Missing data for ${key}`);
          }
        } catch (error) {
          diagnostics.issues.push(`Corrupted data in ${key}: ${error.message}`);
          diagnostics.status = 'warning';
        }
      });

      // Check for performance issues
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
      if (attendanceRecords.length > 10000) {
        diagnostics.warnings.push('Large number of attendance records may affect performance');
        diagnostics.recommendations.push('Consider archiving old attendance records');
      }

      // Check for duplicate records
      const duplicates = adminUtils.findDuplicateAttendanceRecords();
      if (duplicates.length > 0) {
        diagnostics.issues.push(`Found ${duplicates.length} duplicate attendance records`);
        diagnostics.status = 'warning';
      }

      // Memory usage check (approximate)
      const totalStorageSize = Object.keys(localStorage).reduce((total, key) => {
        return total + localStorage.getItem(key).length;
      }, 0);
      
      if (totalStorageSize > 5000000) { // ~5MB
        diagnostics.warnings.push('High localStorage usage detected');
        diagnostics.recommendations.push('Consider implementing data cleanup routines');
      }

    } catch (error) {
      diagnostics.status = 'error';
      diagnostics.issues.push(`System diagnostic failed: ${error.message}`);
    }

    return diagnostics;
  },

  // Find duplicate attendance records
  findDuplicateAttendanceRecords: () => {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
      const seen = new Map();
      const duplicates = [];

      attendanceRecords.forEach((record, index) => {
        const key = `${record.studentId}-${record.subject}-${record.section}-${new Date(record.timestamp).toDateString()}`;
        
        if (seen.has(key)) {
          duplicates.push({
            original: seen.get(key),
            duplicate: { ...record, index }
          });
        } else {
          seen.set(key, { ...record, index });
        }
      });

      return duplicates;
    } catch (error) {
      console.error('Error finding duplicates:', error);
      return [];
    }
  },

  // Generate reports
  generateReport: (reportType, options = {}) => {
    const timestamp = new Date().toISOString();
    const reportId = `report_${Date.now()}`;

    switch (reportType) {
      case 'attendance':
        return adminUtils.generateAttendanceReport(reportId, timestamp, options);
      case 'users':
        return adminUtils.generateUsersReport(reportId, timestamp, options);
      case 'system':
        return adminUtils.generateSystemReport(reportId, timestamp, options);
      case 'flagged':
        return adminUtils.generateFlaggedRecordsReport(reportId, timestamp, options);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  },

  generateAttendanceReport: (reportId, timestamp, options) => {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const subjects = JSON.parse(localStorage.getItem('subjectSections')) || [];

    let filteredRecords = attendanceRecords;
    
    // Apply date filters if provided
    if (options.startDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.timestamp) >= new Date(options.startDate)
      );
    }
    
    if (options.endDate) {
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.timestamp) <= new Date(options.endDate)
      );
    }

    const analytics = adminUtils.getAttendanceAnalytics();

    return {
      id: reportId,
      type: 'attendance',
      generated: timestamp,
      summary: {
        totalRecords: filteredRecords.length,
        dateRange: {
          start: options.startDate || 'All time',
          end: options.endDate || 'Present'
        },
        averageAttendance: analytics.averageAttendance
      },
      data: filteredRecords,
      analytics: analytics
    };
  },

  generateUsersReport: (reportId, timestamp, options) => {
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const parents = JSON.parse(localStorage.getItem('parents')) || [];

    return {
      id: reportId,
      type: 'users',
      generated: timestamp,
      summary: {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalParents: parents.length,
        totalUsers: teachers.length + students.length + parents.length
      },
      data: {
        teachers,
        students,
        parents
      }
    };
  },

  generateSystemReport: (reportId, timestamp, options) => {
    const stats = adminUtils.getSystemStats();
    const diagnostics = adminUtils.performSystemDiagnostics();
    const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];

    return {
      id: reportId,
      type: 'system',
      generated: timestamp,
      summary: stats,
      diagnostics,
      recentLogs: logs.slice(0, 100)
    };
  },

  generateFlaggedRecordsReport: (reportId, timestamp, options) => {
    const flaggedRecords = JSON.parse(localStorage.getItem('flaggedRecords')) || [];
    const duplicates = adminUtils.findDuplicateAttendanceRecords();

    return {
      id: reportId,
      type: 'flagged',
      generated: timestamp,
      summary: {
        totalFlagged: flaggedRecords.length,
        duplicateRecords: duplicates.length
      },
      data: {
        flaggedRecords,
        duplicates
      }
    };
  },

  // Export data as CSV
  exportToCSV: (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Backup and restore functions
  createBackup: () => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Backup all relevant localStorage data
    const keys = ['teachers', 'students', 'parents', 'subjectSections', 'attendanceRecords', 'systemLogs', 'announcements', 'flaggedRecords'];
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backup.data[key] = JSON.parse(data);
        } catch (error) {
          console.error(`Error backing up ${key}:`, error);
        }
      }
    });

    return backup;
  },

  restoreFromBackup: (backup) => {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup format');
    }

    Object.keys(backup.data).forEach(key => {
      try {
        localStorage.setItem(key, JSON.stringify(backup.data[key]));
      } catch (error) {
        console.error(`Error restoring ${key}:`, error);
      }
    });

    // Log the restore action
    const logEntry = {
      id: Date.now().toString(),
      action: `System restored from backup (${backup.timestamp})`,
      timestamp: new Date().toISOString(),
      admin: 'System',
      type: 'system_restore'
    };

    const logs = JSON.parse(localStorage.getItem('systemLogs')) || [];
    logs.unshift(logEntry);
    localStorage.setItem('systemLogs', JSON.stringify(logs.slice(0, 1000)));
  }
};

export default adminUtils;
