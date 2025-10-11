import React, { useState } from 'react';

const UserForm = ({ userType, user = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState(user || {
    name: '',
    email: '',
    studentId: '',
    employeeId: '',
    section: userType === 'teachers' ? [] : '',
    subject: userType === 'teachers' ? [] : '',
    phone: '',
    address: '',
    parentName: '',
    childId: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if ((name === 'section' || name === 'subject') && userType === 'teachers') {
      // Multi-select for teachers
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selected }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (userType === 'students' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    if (userType === 'teachers' && !formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    if (userType === 'parents' && !formData.childId.trim()) {
      newErrors.childId = 'Child ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="user-form-overlay">
      <div className="user-form-modal">
        <h3>{user ? 'Edit' : 'Add'} {userType.charAt(0).toUpperCase() + userType.slice(1, -1)}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {userType === 'students' && (
            <>
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className={errors.studentId ? 'error' : ''}
                />
                {errors.studentId && <span className="error-text">{errors.studentId}</span>}
              </div>
              
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {userType === 'teachers' && (
            <>
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={errors.employeeId ? 'error' : ''}
                />
                {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
              </div>
              <div className="form-group">
                <label>Subjects (select multiple)</label>
                <select
                  name="subject"
                  multiple
                  value={formData.subject}
                  onChange={handleChange}
                  style={{ minHeight: 80 }}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Filipino">Filipino</option>
                  <option value="History">History</option>
                  <option value="ICT">ICT</option>
                  <option value="MAPEH">MAPEH</option>
                  <option value="TLE">TLE</option>
                  {/* Add more subjects as needed */}
                </select>
              </div>
              <div className="form-group">
                <label>Sections (select multiple)</label>
                <select
                  name="section"
                  multiple
                  value={formData.section}
                  onChange={handleChange}
                  style={{ minHeight: 80 }}
                >
                  <option value="A1">A1</option>
                  <option value="B2">B2</option>
                  <option value="C3">C3</option>
                  <option value="D4">D4</option>
                  {/* Add more sections as needed */}
                </select>
              </div>
            </>
          )}

          {userType === 'parents' && (
            <>
              <div className="form-group">
                <label>Parent Name</label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label>Child Student ID *</label>
                <input
                  type="text"
                  name="childId"
                  value={formData.childId}
                  onChange={handleChange}
                  className={errors.childId ? 'error' : ''}
                />
                {errors.childId && <span className="error-text">{errors.childId}</span>}
              </div>
            </>
          )}

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {user ? 'Update' : 'Add'} {userType.charAt(0).toUpperCase() + userType.slice(1, -1)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
