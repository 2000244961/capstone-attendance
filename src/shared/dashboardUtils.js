// Dashboard utilities for calculating real-time statistics
// This file provides functions to get dashboard data from localStorage

export const getDashboardStats = () => {
  try {
    // Get subjects data
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const totalSubjects = subjects.length;
    
    // Get students data
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const totalStudents = students.length;
    
    // Get attendance records for today
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendanceRecords.filter(record => record.date === today);
    
    // Calculate unique students present today
    const uniqueStudentsPresent = new Set(todaysAttendance.map(record => record.studentId)).size;
    
    // Calculate attendance percentage
    const attendancePercentage = totalStudents > 0 
      ? Math.round((uniqueStudentsPresent / totalStudents) * 100) 
      : 0;
    
    // Calculate today's classes (unique subject-section combinations)
    const todaysClasses = new Set(
      todaysAttendance.map(record => `${record.subject}-${record.section}`)
    ).size;

    // Calculate weekly stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoString = weekAgo.toISOString().split('T')[0];
    
    const weeklyAttendance = attendanceRecords.filter(record => 
      record.date >= weekAgoString && record.date <= today
    );
    
    const weeklyUniqueStudents = new Set(weeklyAttendance.map(record => record.studentId)).size;

    return {
      totalSubjects,
      totalStudents,
      studentsPresent: uniqueStudentsPresent,
      attendancePercentage,
      todaysClasses,
      todaysAttendanceRecords: todaysAttendance.length,
      weeklyAttendance: weeklyUniqueStudents,
      subjects: subjects,
      students: students,
      recentAttendance: todaysAttendance.slice(-10) // Last 10 attendance records
    };

  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    return {
      totalSubjects: 0,
      totalStudents: 0,
      studentsPresent: 0,
      attendancePercentage: 0,
      todaysClasses: 0,
      todaysAttendanceRecords: 0,
      weeklyAttendance: 0,
      subjects: [],
      students: [],
      recentAttendance: []
    };
  }
};

export const getSubjectStats = () => {
  try {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const today = new Date().toISOString().split('T')[0];

    return subjects.map(subject => {
      const subjectStudents = students.filter(s => 
        s.subject === subject.subjectName && s.section === subject.sectionName
      );
      
      const subjectAttendance = attendanceRecords.filter(record => 
        record.subject === subject.subjectName && 
        record.section === subject.sectionName &&
        record.date === today
      );

      return {
        subjectName: subject.subjectName,
        sectionName: subject.sectionName,
        totalStudents: subjectStudents.length,
        presentToday: subjectAttendance.length,
        attendanceRate: subjectStudents.length > 0 
          ? Math.round((subjectAttendance.length / subjectStudents.length) * 100)
          : 0
      };
    });
  } catch (error) {
    console.error('Error calculating subject stats:', error);
    return [];
  }
};

export const getRecentActivity = () => {
  try {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    
    // Get last 10 attendance records, sorted by most recent
    return attendanceRecords
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
      .slice(0, 10)
      .map(record => ({
        studentName: record.name,
        subject: record.subject,
        section: record.section,
        status: record.status,
        timestamp: record.timestamp,
        date: record.date
      }));
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

export const getAttendanceTrends = (days = 7) => {
  try {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayAttendance = attendanceRecords.filter(record => record.date === dateString);
      const uniqueStudents = new Set(dayAttendance.map(record => record.studentId)).size;
      
      trends.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        studentsPresent: uniqueStudents,
        totalRecords: dayAttendance.length
      });
    }
    
    return trends;
  } catch (error) {
    console.error('Error calculating attendance trends:', error);
    return [];
  }
};
