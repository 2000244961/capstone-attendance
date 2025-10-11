import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/ManageSubjectSection.css';
import { fetchSubjectSections, addSubjectSection, deleteSubjectSection } from './subjectSectionApi';

function ManageSubjectSection() {
  const [subjectSections, setSubjectSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ section: '', subject: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchSubjectSections();
      setSubjectSections(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load subject/sections.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject/section?')) return;
    try {
      await deleteSubjectSection(id);
      await loadData();
    } catch {
      alert('Failed to delete subject/section.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.section.trim() || !form.subject.trim()) {
      setFormError('Both fields are required.');
      return;
    }
    setFormLoading(true);
    try {
      await addSubjectSection(form);
      setForm({ section: '', subject: '' });
      await loadData();
    } catch (err) {
      setFormError('Failed to add subject/section.');
    }
    setFormLoading(false);
  };

  return (
    <div className="manage-subject-section-container">
      <h2 className="page-header">
        <span className="icon">📚</span> Manage Subjects & Sections
      </h2>
      <div className="subject-section-card">
        <div className="card-header">
          <span className="card-title">Add New Subject/Section</span>
        </div>
        <form className="subject-section-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <input
              name="section"
              type="text"
              placeholder="Section (e.g. A1)"
              value={form.section}
              onChange={handleFormChange}
              disabled={formLoading}
              required
            />
            <input
              name="subject"
              type="text"
              placeholder="Subject (e.g. Math)"
              value={form.subject}
              onChange={handleFormChange}
              disabled={formLoading}
              required
            />
            <button type="submit" className="add-btn" disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {formError && <div className="form-error">{formError}</div>}
        </form>
        <hr className="divider" />
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table className="subject-section-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjectSections.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign:'center'}}>No subject/sections found.</td></tr>
                ) : (
                  subjectSections.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td>{item.section || '-'}</td>
                      <td>{item.subject || '-'}</td>
                      <td>
                        <button className="edit-btn">Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(item._id)} style={{marginLeft:8}}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageSubjectSection;
