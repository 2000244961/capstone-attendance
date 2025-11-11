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

// Add other utility functions as needed
