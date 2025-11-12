import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageSubjectSection.css';
// Replace with your actual backend API endpoints
const API_BASE = '/api/subjectSection';

function ManageSubjectSection() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [newSubject, setNewSubject] = useState({
    subjectName: '',
    sectionName: '',
  });

  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        setSections(data);
      } catch (err) {
        setSections([]);
      }
    }
    fetchSections();
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewSubject(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = async () => {
    if (!newSubject.subjectName || !newSubject.sectionName) {
      alert('Please fill in all fields.');
      return;
    }
    // Check for existing in backend
    const existing = sections.find(s =>
      s.subjectName.toLowerCase() === newSubject.subjectName.toLowerCase() &&
      s.sectionName.toLowerCase() === newSubject.sectionName.toLowerCase()
    );
    if (existing) {
      alert('This subject/section combination already exists.');
      return;
    }
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject)
      });
      if (!res.ok) throw new Error('Failed to add subject/section');
      setNewSubject({ subjectName: '', sectionName: '' });
      // Refresh list
      const updatedRes = await fetch(API_BASE);
      const updated = await updatedRes.json();
      setSections(updated);
    } catch (err) {
      alert('Error adding subject/section');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete section');
      // Refresh list
      const updatedRes = await fetch(API_BASE);
      const updated = await updatedRes.json();
      setSections(updated);
    } catch (err) {
      alert('Error deleting section');
    }
  };

  return (
    <div className="manage-subject-section-container">
      <div className="header-section">
        <h1>📘 Manage Subjects/Sections</h1>
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
            marginBottom: '20px'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Add New Subject/Section */}
      <div className="form-container">
        <h2>➕ Add New Subject/Section</h2>
        <div className="form-inputs">
          <input
            type="text"
            name="subjectName"
            placeholder="Subject Name"
            value={newSubject.subjectName}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="sectionName"
            placeholder="Section Name (e.g. Section A)"
            value={newSubject.sectionName}
            onChange={handleInputChange}
          />
        </div>
        <button onClick={handleAddSubject}>Add Subject/Section</button>
      </div>

      {/* List of Subjects/Sections */}
      <div className="table-container">
        <h2>📋 List of Subjects/Sections</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Section Name</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(s => (
                <tr key={s.id}>
                  <td>{s.subjectName}</td>
                  <td>{s.sectionName}</td>
                  <td>
                    <span className="student-count">{s.studentCount || 0}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-delete" onClick={() => handleDelete(s.id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No sections added yet. Add your first subject/section above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageSubjectSection;
