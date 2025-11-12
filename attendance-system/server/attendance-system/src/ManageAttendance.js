import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageAttendance.css';
import { fetchAttendance } from './api/attendanceApi';

const ManageAttendance = () => {
	 const navigate = useNavigate();
	 const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	 const [selectedSection, setSelectedSection] = useState('');
	 const [attendanceData, setAttendanceData] = useState([]);

	 useEffect(() => {
		 async function loadAttendance() {
			 try {
				 const data = await fetchAttendance({ date: selectedDate, section: selectedSection });
				 setAttendanceData(data);
			 } catch (err) {
				 setAttendanceData([]);
			 }
		 }
		 loadAttendance();
	 }, [selectedDate, selectedSection]);

	 return (
		 <div className="manage-attendance">
			 <h1>Manage Attendance</h1>
			 <div>
				 <label>Date: </label>
				 <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
				 <label>Section: </label>
				 <input type="text" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} placeholder="Section ID or Name" />
			 </div>
			 <table className="attendance-table">
				 <thead>
					 <tr>
						 <th>Student ID</th>
						 <th>Name</th>
						 <th>Section</th>
						 <th>Status</th>
						 <th>Timestamp</th>
					 </tr>
				 </thead>
				 <tbody>
					 {attendanceData.length === 0 ? (
						 <tr><td colSpan={5}>No attendance records found.</td></tr>
					 ) : (
						 attendanceData.map(record => (
							 <tr key={record._id} className={record.status === 'absent' ? 'absent-row' : ''}>
								 <td>{record.studentId}</td>
								 <td>{record.name}</td>
								 <td>{record.section}</td>
								 <td>{record.status}</td>
								 <td>{new Date(record.timestamp).toLocaleString()}</td>
							 </tr>
						 ))
					 )}
				 </tbody>
			 </table>
		 </div>
	 );
};

export default ManageAttendance;
