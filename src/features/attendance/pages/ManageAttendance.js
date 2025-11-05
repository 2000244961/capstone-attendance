// src/pages/ManageAttendance.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageAttendance.css';

const ManageAttendance = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch attendance data from backend API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        let url = `/api/attendance?date=${selectedDate}`;
        if (selectedSection) url += `&section=${encodeURIComponent(selectedSection)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch attendance records');
        const data = await res.json();
        // Sort by most recent first
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAttendanceData(data);
        setLastUpdate(Date.now());
      } catch (err) {
        setAttendanceData([]);
      }
    };

    fetchAttendanceData();
    const interval = setInterval(fetchAttendanceData, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [selectedDate, selectedSection]);

  // Fetch sections from backend API
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        setSections(data);
      } catch {
        setSections([]);
      }
    };
    fetchSections();
  }, []);

  // Fetch students from backend API (if needed)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();
        setStudents(data);
      } catch {
        setStudents([]);
      }
    };
    fetchStudents();
  }, []);

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
        (record.name && record.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.studentId && record.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSection && matchesSearch;
    });
  }, [attendanceData, selectedSection, searchTerm]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const present = filteredAttendance.filter(r => r.status && r.status.toLowerCase() === 'present').length;
    const late = filteredAttendance.filter(r => r.status && r.status.toLowerCase() === 'late').length;
    const absent = filteredAttendance.filter(r => r.status && r.status.toLowerCase() === 'absent').length;
    return { present, late, absent, total: present + late + absent };
  }, [filteredAttendance]);

  // Handle manual status change (updates backend)
  const handleStatusChange = async (recordId, newStatus) => {
    try {
      const res = await fetch(`/api/attendance/${recordId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setLastUpdate(Date.now());
      // Optionally, you can refetch attendance data here or rely on polling
    } catch (err) {
      alert('Failed to update attendance status.');
    }
  };

  // Delete attendance record (updates backend)
  const handleDeleteRecord = async (recordId) => {
    const recordToDelete = attendanceData.find(record => record._id === recordId || record.id === recordId);
    const studentName = recordToDelete ? recordToDelete.name : 'Unknown Student';

    if (window.confirm(`Are you sure you want to delete the attendance record for ${studentName}?`)) {
      try {
        const res = await fetch(`/api/attendance/${recordId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete record');
        setLastUpdate(Date.now());
      } catch (err) {
        alert('Failed to delete attendance record.');
      }
    }
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
        <div className="header-top">
          <h1>📋 Manage Attendance</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="back-button"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '20px'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <p className="subtext"></p>
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
              <option key={index} value={section.sectionName || section.name || section._id}>
                {section.sectionName || section.name || section._id}
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
          <div className="table-title-section">
            <h2>📊 Attendance Records</h2>
            <p>Real-time attendance tracking and management</p>
          </div>
          <div className="record-count">
            {filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''} found
          </div>
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
                  const isNew = record.timestamp && 
                    (Date.now() - new Date(record.timestamp).getTime()) < 30000;
                  
                  return (
                    <tr key={record._id || record.id || index} className={isNew ? 'new-record' : ''}>
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
                        <span className={`status-badge status-${(record.status || '').toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="timestamp-cell">
                          {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '-'}
                          {isNew && <span className="live-indicator">🔴 LIVE</span>}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select
                            value={record.status}
                            onChange={(e) => handleStatusChange(record._id || record.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                          </select>
                          <button
                            onClick={() => handleDeleteRecord(record._id || record.id)}
                            className="delete-button"
                            title="Delete Record"
                          >
                            🗑️ Delete
                          </button>
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