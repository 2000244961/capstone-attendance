import React, { useState, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './styles/ManageAttendance.css';
import { fetchAttendance, deleteAttendance, updateAttendance } from './attendanceApi';
import { fetchUserProfile } from '../../../api/userApi';

const ManageAttendance = () => {
        const navigate = useNavigate();
        const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
        // Use React state only for section/subject (no localStorage)
        const [selectedSection, setSelectedSection] = useState('');
        const [selectedSubject, setSelectedSubject] = useState('');
    const [allowedSubjects, setAllowedSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);
    const [allowedSections, setAllowedSections] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAttendance = async () => {
            setLoading(true);
            try {
                                // Get teacher info from backend/session/context (not localStorage)
                                let teacherId = null;
                                // Example: window.currentUser or from a React context
                                if (window.currentUser && (window.currentUser._id || window.currentUser.username)) {
                                    teacherId = window.currentUser._id || window.currentUser.username;
                                }
                                let allowedSectionsArr = [];
                                let allowedSubjectsArr = [];
                                if (teacherId) {
                                    try {
                                        const profile = await fetchUserProfile(teacherId);
                                        if (profile && Array.isArray(profile.assignedSections)) {
                                            allowedSectionsArr = profile.assignedSections.map(s => s.sectionName);
                                            // Collect subjects for each section
                                            if (profile.assignedSections.some(s => s.subjects)) {
                                                if (selectedSection) {
                                                    // Only subjects for selected section
                                                    const sectionObj = profile.assignedSections.find(s => s.sectionName === selectedSection);
                                                    allowedSubjectsArr = sectionObj && Array.isArray(sectionObj.subjects) ? sectionObj.subjects : [];
                                                } else {
                                                    // All subjects from all sections
                                                    allowedSubjectsArr = profile.assignedSections.flatMap(s => s.subjects || []);
                                                    allowedSubjectsArr = [...new Set(allowedSubjectsArr)];
                                                }
                                            }
                                        }
                                    } catch {}
                                }
                                setAllowedSections(allowedSectionsArr);
                                setAllowedSubjects(allowedSubjectsArr);
                const data = await fetchAttendance();
                // Only show records for allowed sections
                const filtered = data.filter(record =>
                  record.date === selectedDate &&
                  record.viaFacialRecognition === true &&
                  (allowedSectionsArr.length === 0 || allowedSectionsArr.includes(record.section))
                );
                setAttendanceData(filtered);
                setLastUpdate(Date.now());
            } catch (err) {
                setError('Failed to load attendance records');
            }
            setLoading(false);
        };
        loadAttendance();

        // Socket.IO setup for real-time updates
        const socket = io('http://localhost:7000');
        socket.on('attendance:new', (newRecord) => {
            // Only add if the record matches the selected date, is via facial recognition, and is in allowed sections
            if (
              newRecord.date === selectedDate &&
              newRecord.viaFacialRecognition === true &&
              (allowedSections.length === 0 || allowedSections.includes(newRecord.section))
            ) {
                setAttendanceData(prev => [newRecord, ...prev]);
                setLastUpdate(Date.now());
            }
        });
        return () => {
            socket.disconnect();
        };
    }, [selectedDate, selectedSection]);

    // Filter attendance data
    const filteredAttendance = useMemo(() => {
        return attendanceData.filter(record => {
            const matchesSection = !selectedSection || record.section === selectedSection;
            const matchesSubject = !selectedSubject || record.subject === selectedSubject;
            const matchesSearch = !searchTerm || 
                record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.studentId.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSection && matchesSubject && matchesSearch;
        });
    }, [attendanceData, selectedSection, selectedSubject, searchTerm]);

    // Summary statistics
    const summary = useMemo(() => {
    const present = filteredAttendance.filter(r => (r.status && r.status.toLowerCase() === 'present')).length;
    const late = filteredAttendance.filter(r => (r.status && r.status.toLowerCase() === 'late')).length;
    const absent = filteredAttendance.filter(r => (r.status && r.status.toLowerCase() === 'absent')).length;
    return { present, late, absent, total: present + late + absent };
    }, [filteredAttendance]);

    // Update attendance status
    const handleStatusChange = async (recordId, newStatus) => {
        try {
            const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
            const currentDateTime = new Date().toISOString();
            await updateAttendance(recordId, {
                status: newStatus,
                timestamp: newStatus !== 'Absent' ? currentTime : '-',
                recordedAt: currentDateTime
            });
            setAttendanceData(prev => prev.map(record =>
                record._id === recordId
                    ? { ...record, status: newStatus, timestamp: newStatus !== 'Absent' ? currentTime : '-', recordedAt: currentDateTime }
                    : record
            ));
            setLastUpdate(Date.now());
        } catch (err) {
            alert('Failed to update attendance status');
        }
    };

    // Delete attendance record
    const handleDeleteRecord = async (recordId) => {
        const recordToDelete = attendanceData.find(record => record._id === recordId);
        const studentName = recordToDelete ? recordToDelete.name : 'Unknown Student';
        if (window.confirm(`Are you sure you want to delete the attendance record for ${studentName}?`)) {
            try {
                await deleteAttendance(recordId);
                setAttendanceData(prev => prev.filter(record => record._id !== recordId));
                setLastUpdate(Date.now());
                alert(`✅ Attendance record for ${studentName} has been deleted.`);
            } catch (err) {
                alert('Failed to delete attendance record');
            }
        }
    };

    // Delete all attendance records for a student
    const handleDeleteAllAttendanceForStudent = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to delete ALL attendance records for ${studentName}?`)) {
            try {
                // Call backend API to delete all attendance records for this student
                const response = await fetch(`/api/attendance/deleteByStudent/${studentId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setAttendanceData(prev => prev.filter(record => record.studentId !== studentId));
                    setLastUpdate(Date.now());
                    alert(`✅ All attendance records for ${studentName} have been deleted.`);
                } else {
                    alert('Failed to delete all attendance records for this student');
                }
            } catch (err) {
                alert('Failed to delete all attendance records for this student');
            }
        }
    };

    // Group attendance records by studentId
    const groupedAttendance = useMemo(() => {
        const map = new Map();
        filteredAttendance.forEach(record => {
            if (!map.has(record.studentId)) {
                map.set(record.studentId, {
                    studentId: record.studentId,
                    name: record.name,
                    section: record.section,
                    subject: record.subject,
                    records: [record]
                });
            } else {
                map.get(record.studentId).records.push(record);
            }
        });
        return Array.from(map.values());
    }, [filteredAttendance]);

    if (loading) return <div>Loading attendance records...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="manage-attendance-container" style={{ backgroundColor: '#43a047' }}>
            <div className="page-header">
                <div className="header-top" style={{ justifyContent: 'flex-start', gap: '24px' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="back-button"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span style={{ fontSize: '1.2em' }}>←</span> Back
                    </button>
                    <h1 style={{ marginLeft: 0 }}>📋 Manage Attendance</h1>
                </div>
                {/* Removed real-time status and last updated */}
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
                        onChange={(e) => {
                          setSelectedSection(e.target.value);
                          setSelectedSubject(''); // Reset subject when section changes
                        }}
                    >
                        <option value="">All Sections</option>
                        {allowedSections.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="subject">📚 Filter by Subject:</label>
                    <select
                        id="subject"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        disabled={allowedSubjects.length === 0}
                    >
                        <option value="">All Subjects</option>
                        {allowedSubjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
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
                            {groupedAttendance.length > 0 ? (
                                groupedAttendance.map((student, idx) => (
                                    <React.Fragment key={student.studentId}>
                                        {student.records.map((record, recIdx) => (
                                            <tr key={record._id}>
                                                <td>{record.name}</td>
                                                <td>{record.studentId}</td>
                                                <td>{record.section}</td>
                                                <td>{record.subject}</td>
                                                <td>
                                                    <span className={`status-badge status-${record.status.toLowerCase()}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td>{(() => {
                                                    if (!record.timestamp || record.timestamp === '-') return '-';
                                                    // Try to parse ISO or fallback to string
                                                    let dateObj;
                                                    if (record.recordedAt) {
                                                        dateObj = new Date(record.recordedAt);
                                                    } else if (!isNaN(Date.parse(record.timestamp))) {
                                                        dateObj = new Date(record.timestamp);
                                                    } else {
                                                        return record.timestamp;
                                                    }
                                                    const y = dateObj.getFullYear();
                                                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                                    const d = String(dateObj.getDate()).padStart(2, '0');
                                                    let hour = dateObj.getHours();
                                                    const min = String(dateObj.getMinutes()).padStart(2, '0');
                                                    const ampm = hour >= 12 ? 'PM' : 'AM';
                                                    hour = hour % 12;
                                                    if (hour === 0) hour = 12;
                                                    return `${y}/${m}/${d} - ${hour}:${min} ${ampm}`;
                                                })()}</td>
                                                <td>
                                                    <button
                                                        onClick={() => alert('Edit functionality coming soon!')}
                                                        className="delete-button"
                                                        title="Edit Record"
                                                        style={{ marginRight: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: '#1976d2' }}
                                                    >
                                                        <span role="img" aria-label="edit">✏️</span> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecord(record._id)}
                                                        className="delete-button"
                                                        title="Delete Record"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <span role="img" aria-label="delete">🗑️</span> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        No attendance records found for the selected criteria.
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
