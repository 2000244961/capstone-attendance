// src/pages/ManageAttendance.js
import React, { useState, useEffect, useMemo } from 'react';
import './ManageAttendance.css';

const ManageAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load real-time attendance data from localStorage
  useEffect(() => {
    const loadAttendanceData = () => {
      const savedStudents = JSON.parse(localStorage.getItem('students')) || [];
      const savedSections = JSON.parse(localStorage.getItem('subjects')) || [];
      const savedAttendance = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
      
      setStudents(savedStudents);
      setSections(savedSections);
      
      // Filter attendance records for the selected date
      const todaysAttendance = savedAttendance.filter(record => 
        record.date === selectedDate
      );
      
      // Map attendance records to the format expected by the component
      const formattedAttendance = todaysAttendance.map(record => ({
        id: record.id,
        name: record.name,
        studentId: record.studentId,
        section: record.section,
        subject: record.subject,
        status: record.status,
        timestamp: record.timestamp,
        date: record.date,
        recordedAt: record.recordedAt // Keep the original timestamp for sorting
      }));
      
      // Sort by most recent first
      formattedAttendance.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
      
      setAttendanceData(formattedAttendance);
      setLastUpdate(Date.now());
    };

    // Initial load
    loadAttendanceData();

    // Set up real-time polling to check for new attendance records
    const interval = setInterval(loadAttendanceData, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Listen for localStorage changes (for real-time updates from FaceRecognition)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'attendanceRecords') {
        // Reload attendance data when records are updated
        const savedAttendance = JSON.parse(e.newValue || '[]');
        const todaysAttendance = savedAttendance.filter(record => 
          record.date === selectedDate
        );
        
        const formattedAttendance = todaysAttendance.map(record => ({
          id: record.id,
          name: record.name,
          studentId: record.studentId,
          section: record.section,
          subject: record.subject,
          status: record.status,
          timestamp: record.timestamp,
          date: record.date,
          recordedAt: record.recordedAt
        }));
        
        formattedAttendance.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
        setAttendanceData(formattedAttendance);
        setLastUpdate(Date.now());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedDate]);

  // Generate current time for real-time updates
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filter attendance data
  const filteredAttendance = useMemo(() => {
    return attendanceData.filter(record => {
      const matchesSection = !selectedSection || record.section === selectedSection;
      const matchesSearch = !searchTerm || 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSection && matchesSearch;
    });
  }, [attendanceData, selectedSection, searchTerm]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const present = filteredAttendance.filter(r => r.status === 'Present').length;
    const late = filteredAttendance.filter(r => r.status === 'Late').length;
    const absent = filteredAttendance.filter(r => r.status === 'Absent').length;
    
    return { present, late, absent, total: present + late + absent };
  }, [filteredAttendance]);

  // Handle manual status change (updates both local state and localStorage)
  const handleStatusChange = (studentId, newStatus) => {
    const currentTime = getCurrentTime();
    const currentDateTime = new Date().toISOString();
    
    // Update local state
    setAttendanceData(prev => 
      prev.map(record => 
        record.id === studentId 
          ? { 
              ...record, 
              status: newStatus, 
              timestamp: newStatus !== 'Absent' ? currentTime : '-',
              recordedAt: currentDateTime
            }
          : record
      )
    );
    
    // Update localStorage
    const savedAttendance = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const updatedAttendance = savedAttendance.map(record => 
      record.id === studentId && record.date === selectedDate
        ? { 
            ...record, 
            status: newStatus, 
            timestamp: newStatus !== 'Absent' ? currentTime : '-',
            recordedAt: currentDateTime
          }
        : record
    );
    
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedAttendance));
    setLastUpdate(Date.now());
  };

  // Manual attendance entry for students not yet recorded
  const addManualAttendance = (student, status) => {
    const currentTime = getCurrentTime();
    const currentDateTime = new Date().toISOString();
    
    const newRecord = {
      id: `${student.id}_${selectedDate}_${Date.now()}`,
      studentId: student.id,
      name: student.name,
      section: student.section,
      subject: student.subject,
      status: status,
      timestamp: status !== 'Absent' ? currentTime : '-',
      date: selectedDate,
      recordedAt: currentDateTime
    };
    
    // Update local state
    setAttendanceData(prev => [newRecord, ...prev]);
    
    // Update localStorage
    const savedAttendance = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    savedAttendance.push(newRecord);
    localStorage.setItem('attendanceRecords', JSON.stringify(savedAttendance));
    setLastUpdate(Date.now());
  };

  // Export functionality
  const handleExport = () => {
    const csvData = filteredAttendance.map(record => 
      `${record.name},${record.studentId},${record.section},${record.status},${record.timestamp}`
    );
    const csvContent = 'Name,Student ID,Section,Status,Timestamp\n' + csvData.join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="manage-attendance-container">
      <div className="page-header">
        <h1>📋 Manage Attendance</h1>
        <p className="subtext">
          Track and manage student attendance records with real-time updates from facial recognition system.
        </p>
        <div className="real-time-status">
          <div className="status-indicator live">
            <span className="status-dot"></span>
            <span>Live Updates Active</span>
          </div>
          <div className="last-update">
            Last updated: {new Date(lastUpdate).toLocaleTimeString('en-US', { 
              hour12: true, 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="date">📆 View by Date:</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="section">🏫 Filter by Section:</label>
          <select
            id="section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">All Sections</option>
            {sections.map((section, index) => (
              <option key={index} value={section.sectionName}>
                {section.sectionName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search">🔍 Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button onClick={handleExport} className="export-btn">
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-container">
        <div className="summary-card present">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>{summary.present}</h3>
            <p>Present</p>
          </div>
        </div>
        <div className="summary-card late">
          <div className="summary-icon">⏰</div>
          <div className="summary-content">
            <h3>{summary.late}</h3>
            <p>Late</p>
          </div>
        </div>
        <div className="summary-card absent">
          <div className="summary-icon">❌</div>
          <div className="summary-content">
            <h3>{summary.absent}</h3>
            <p>Absent</p>
          </div>
        </div>
        <div className="summary-card total">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <h3>{summary.total}</h3>
            <p>Total</p>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <div className="table-header">
          <h2>📊 Attendance Records</h2>
          <p>Real-time attendance tracking and management</p>
        </div>
        
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record, index) => {
                  // Check if record is new (within last 30 seconds)
                  const isNew = record.recordedAt && 
                    (Date.now() - new Date(record.recordedAt).getTime()) < 30000;
                  
                  return (
                    <tr key={record.id} className={isNew ? 'new-record' : ''}>
                      <td>
                        <div className="name-cell">
                          {record.name}
                          {isNew && <span className="new-badge">NEW</span>}
                        </div>
                      </td>
                      <td>{record.studentId}</td>
                      <td>{record.section}</td>
                      <td>{record.subject}</td>
                      <td>
                        <span className={`status-badge status-${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="timestamp-cell">
                          {record.timestamp}
                          {isNew && <span className="live-indicator">🔴 LIVE</span>}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select
                            value={record.status}
                            onChange={(e) => handleStatusChange(record.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    {students.length === 0 
                      ? 'No students registered yet. Add students first in Manage Students.'
                      : 'No attendance records found for the selected criteria.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAttendance;
