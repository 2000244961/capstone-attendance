import { debugDescriptor } from './debugHelper';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as XLSX from 'xlsx';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels, areModelsLoaded } from '../../shared/faceApiLoader';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from './studentApi';
import { fetchSubjectSections } from './subjectSectionApi';
import '../styles/ManageStudent.css';

// Helper for face detection
async function processFaceDetection(photo) {
  try {
    if (!areModelsLoaded()) {
      alert('Face detection models are still loading. Please wait a moment and try again.');
      return null;
    }
    const image = await faceapi.bufferToImage(photo);
    let detection = await faceapi
      .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) {
      detection = await faceapi
        .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }
    if (!detection) {
      const allDetections = await faceapi
        .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (allDetections.length > 0) {
        detection = allDetections[0];
      }
    }
    if (!detection) {
      alert('No face detected in the photo. Please ensure your face is clearly visible and try again.');
      return null;
    }
    debugDescriptor(Array.from(detection.descriptor));
    return Array.from(detection.descriptor);
  } catch (error) {
    alert('Error during face detection. Please try again.');
    return null;
  }
}

const INITIAL_FORM_DATA = {
  fullName: '',
  studentId: '',
  section: '',
  gradeLevel: '',
  descriptor: [],
  photo: null,
};

const ManageStudent = ({ refreshDashboard }) => {
  const [students, setStudents] = useState([]);
  const [faceVisible, setFaceVisible] = useState(null);
  const [cameraInterval, setCameraInterval] = useState(null);
  const [searchSection, setSearchSection] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupedStudents, setGroupedStudents] = useState({});
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [sectionList, setSectionList] = useState([]);
  const webcamRef = useRef(null);
  const excelInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch section list from subject/section table
  useEffect(() => {
    async function loadSections() {
      try {
        const data = await fetchSubjectSections();
        const uniqueSections = [...new Set(data.map(item => item.section))];
        setSectionList(uniqueSections);
      } catch {
        setSectionList([]);
      }
    }
    loadSections();
  }, []);

  // Batch upload handler
  const handleBatchClick = () => excelInputRef.current.click();

  const handleBatchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const batchStudents = XLSX.utils.sheet_to_json(sheet);

    let addedCount = 0;
    for (const s of batchStudents) {
      try {
        if (!s.fullName || !s.studentId || !s.section || !s.gradeLevel) continue;
        await addStudent({
          ...s,
          descriptor: [],
          photo: null,
          status: 'Active',
        });
        addedCount++;
      } catch (err) {
        console.error(`Failed to add student ${s.fullName}:`, err);
      }
    }

    const dbStudents = await fetchStudents();
    setStudents(dbStudents);

    alert(`Batch registration completed: ${addedCount} students processed.`);
  };

  // Live face detection in webcam
  useEffect(() => {
    if (showCamera && webcamRef.current) {
      const interval = setInterval(async () => {
        if (!areModelsLoaded()) return;
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) {
          try {
            const response = await fetch(screenshot);
            const blob = await response.blob();
            const image = await faceapi.bufferToImage(blob);
            const detection = await faceapi.detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }));
            setFaceVisible(!!detection);
          } catch {
            setFaceVisible(false);
          }
        } else {
          setFaceVisible(null);
        }
      }, 700);
      setCameraInterval(interval);
      return () => clearInterval(interval);
    } else if (cameraInterval) {
      clearInterval(cameraInterval);
      setCameraInterval(null);
    }
  }, [showCamera]);

  const openCamera = () => {
    setShowCamera(true);
    setFaceVisible(null);
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      setCapturedPhoto(screenshot);
      setFormData(prev => ({ ...prev, photo: screenshot }));
      setShowCamera(false);
    }
  }, [webcamRef]);

  const retakePhoto = () => { setCapturedPhoto(null); setShowCamera(true); };

  // Group students by section and subject
  const groupBySectionSubject = useCallback(() => {
    const groups = {};
    students.forEach(student => {
      const key = `${student.section} - ${student.subject}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
    });
    setGroupedStudents(groups);
    setShowGroupModal(true);
  }, [students]);

  // Add missing function definitions
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleRegister();
  };

  const validateForm = useCallback(() => {
    if (!formData.fullName.trim() || !formData.studentId.trim() || !formData.section.trim() || !formData.gradeLevel.trim()) {
      alert('Please fill in all required fields.');
      return false;
    }
    if (/\d/.test(formData.fullName)) {
      alert('Full Name should not contain numbers.');
      return false;
    }
    return true;
  }, [formData]);

  const validateSubjectSection = useCallback(() => {
    if (!sectionList.includes(formData.section)) {
      alert('Selected section does not exist.');
      return null;
    }
    return { sectionName: formData.section };
  }, [formData, sectionList]);

  const updateSubjectStudentCount = useCallback((subjectInfo, delta) => {
    // Placeholder: implement API call to update student count for section/subject
    console.log('Update student count for', subjectInfo, 'by', delta);
  }, []);

  const closeCamera = useCallback(() => {
    setShowCamera(false);
    setFaceVisible(null);
    if (cameraInterval) {
      clearInterval(cameraInterval);
      setCameraInterval(null);
    }
  }, [cameraInterval]);

  // Load face detection models and fetch students from backend
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await loadFaceApiModels();
      } catch (modelError) {
        console.error('Error loading face-api.js models:', modelError);
        alert('Failed to load face detection models. Please check /models files and refresh the page.');
        setIsLoading(false);
        return;
      }
      try {
        const dbStudents = await fetchStudents();
        const processedStudents = await Promise.all(dbStudents.map(async s => {
          if (s.photo) {
            if (typeof s.photo === 'string') {
              return { ...s };
            }
            if (s.photo instanceof Blob) {
              const reader = new FileReader();
              const base64 = await new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(s.photo);
              });
              return { ...s, photo: base64 };
            }
          }
          return { ...s, photo: null };
        }));
        setStudents(processedStudents);
        setIsLoading(false);
      } catch (apiError) {
        console.error('Error fetching students:', apiError);
        alert('Failed to fetch students from database. Please check your backend and refresh the page.');
        setIsLoading(false);
      }
    };
    initializeComponent();
  }, []);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        (student.fullName && student.fullName.toLowerCase().includes(query)) ||
        (student.studentId && student.studentId.toLowerCase().includes(query))
      );
    }
    if (searchSection) {
      filtered = filtered.filter(student => student.section === searchSection);
    }
    if (searchSubject) {
      filtered = filtered.filter(student => student.subject === searchSubject);
    }
    return filtered;
  }, [students, searchQuery, searchSection, searchSubject]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setFormMode('add');
    setSelectedIndex(null);
    setCapturedPhoto(null);
    setShowCamera(false);
  }, []);

  const getPhotoUrl = useCallback((student, index) => {
    if (formMode === 'edit' && selectedIndex === index) {
      if (capturedPhoto) {
        return capturedPhoto;
      } else if (formData.photo) {
        if (typeof formData.photo === 'string') {
          return formData.photo;
        }
        if (formData.photo instanceof Blob) {
          const reader = new FileReader();
          reader.readAsDataURL(formData.photo);
          reader.onloadend = () => reader.result;
        }
      }
    }
    return student.photo;
  }, [formMode, selectedIndex, formData.photo, capturedPhoto]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Main handler for adding/updating students (connect to backend)
  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    const subjectInfo = validateSubjectSection();
    if (!subjectInfo) return;
    if (isLoading) {
      alert('Please wait until face models load.');
      return;
    }
    let descriptor = formData.descriptor;
    let photoUrl = null;
    const photoSource = formData.photo || capturedPhoto;
    if (photoSource) {
      let detectionBlob = photoSource;
      if (typeof photoSource === 'string' && photoSource.startsWith('data:image')) {
        const response = await fetch(photoSource);
        detectionBlob = await response.blob();
      }
      descriptor = await processFaceDetection(detectionBlob);
      if (!descriptor) return;
      if (!Array.isArray(descriptor) || descriptor.length !== 128 || descriptor.some(isNaN)) {
        alert('Face descriptor is invalid. Please retake the photo.');
        return;
      }
      if (photoSource instanceof Blob) {
        const reader = new FileReader();
        photoUrl = await new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(photoSource);
        });
      } else if (typeof photoSource === 'string') {
        photoUrl = photoSource;
      } else {
        photoUrl = null;
      }
    } else if (formMode === 'edit' && selectedIndex !== null) {
      const existingStudent = students[selectedIndex];
      descriptor = existingStudent.descriptor;
      if (!Array.isArray(descriptor) || descriptor.length !== 128 || descriptor.some(isNaN)) {
        alert('Existing face descriptor is invalid. Please update the photo.');
        return;
      }
      if (existingStudent.photo && typeof existingStudent.photo === 'string') {
        photoUrl = existingStudent.photo;
      } else if (existingStudent.photo instanceof Blob) {
        const reader = new FileReader();
        photoUrl = await new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(existingStudent.photo);
        });
      } else {
        photoUrl = null;
      }
    }
    // Allow registration even if photo is missing (for batch or manual)
    const studentData = {
      fullName: formData.fullName.trim(),
      studentId: formData.studentId.trim(),
      section: formData.section.trim(),
      gradeLevel: formData.gradeLevel.trim(),
      descriptor: descriptor || [],
      photo: photoUrl || null,
      status: 'Active',
    };
    try {
      let result;
      if (formMode === 'add') {
        result = await addStudent(studentData);
        updateSubjectStudentCount(subjectInfo, 1);
      } else {
        result = await updateStudent(students[selectedIndex]._id, studentData);
      }
      const dbStudents = await fetchStudents();
      const processedStudents = await Promise.all(dbStudents.map(async s => {
        if (s.photo) {
          if (typeof s.photo === 'string') {
            return { ...s };
          }
          if (s.photo instanceof Blob) {
            const reader = new FileReader();
            const base64 = await new Promise(resolve => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(s.photo);
            });
            return { ...s, photo: base64 };
          }
        }
        return { ...s, photo: null };
      }));
      setStudents(processedStudents);
      resetForm();
      alert(`Student ${formMode === 'add' ? 'registered' : 'updated'} successfully!`);
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student data. Please try again.');
    }
  }, [
    formData,
    formMode,
    selectedIndex,
    students,
    isLoading,
    validateForm,
    validateSubjectSection,
    processFaceDetection,
    updateSubjectStudentCount,
    resetForm,
    navigate
  ]);

  const handleEdit = useCallback((index) => {
    const student = students[index];
    setFormData({ 
      ...student, 
      photo: null
    });
    setFormMode('edit');
    setSelectedIndex(index);
    setCapturedPhoto(null);
    setShowCamera(false);
  }, [students]);

  const handleDelete = useCallback(async (index) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    const studentToDelete = students[index];
    try {
      await deleteStudent(studentToDelete._id);
      const dbStudents = await fetchStudents();
      setStudents(dbStudents);
      const subjectInfo = {
        subjectName: studentToDelete.subject,
        sectionName: studentToDelete.section,
      };
      updateSubjectStudentCount(subjectInfo, -1);
      if (selectedIndex === index) {
        resetForm();
      }
      if (typeof refreshDashboard === 'function') refreshDashboard();
    } catch (error) {
      alert('Error deleting student.');
    }
  }, [students, selectedIndex, updateSubjectStudentCount, resetForm, refreshDashboard]);

  return (
    <div className="manage-student-container redesigned-manage-student">
      <div className="header-section redesigned-header-section">
        <h1>Manage Students</h1>
        <button onClick={handleBatchClick} style={{ marginBottom: 12 }}>📁 Batch Register</button>
        <input type="file" ref={excelInputRef} accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBatchUpload} />
      </div>
      {/* Search controls for section, subject, and student */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search student by name or ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 500, minWidth: 180 }}
        />
        <select
          value={searchSection || ''}
          onChange={e => setSearchSection(e.target.value)}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 600, background: '#fff', color: '#333' }}
        >
          <option key="all-section" value="">All Sections</option>
          {[...new Set(students.map(s => s.section))].map((sec, idx) => (
            <option key={`section-${sec}-${idx}`} value={sec}>{sec}</option>
          ))}
        </select>
      </div>
      
      <div className="student-controls">
        <h2>{formMode === 'add' ? 'Add Student' : 'Edit Student'}</h2>
        <div className="form-inputs">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={e => handleInputChange('fullName', e.target.value)}
          />
          <input
            type="text"
            placeholder="Student ID"
            value={formData.studentId}
            onChange={e => handleInputChange('studentId', e.target.value)}
          />
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <select
              name="section"
              value={formData.section}
              onChange={e => handleInputChange('section', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
            >
              <option key="form-select-section" value="">Select Section</option>
              {sectionList.map((section, idx) => (
                <option key={`form-section-${section}-${idx}`} value={section}>{section}</option>
              ))}
            </select>
            <select
              value={formData.gradeLevel}
              onChange={e => handleInputChange('gradeLevel', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
            >
              <option value="">Select Grade Level</option>
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>
          {/* Camera Section */}
          <div className="photo-section">
            <label className="photo-label">
              Student Photo *
            </label>
            {!showCamera && !capturedPhoto && (
              <div className="camera-controls" style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <button 
                  type="button"
                  onClick={openCamera}
                  className="camera-button"
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  📷 Take Photo
                </button>
                <label style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  📁 Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCapturedPhoto(reader.result);
                          setFormData(prev => ({ ...prev, photo: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
            {showCamera && (
              <div className="camera-container" style={{marginTop: '10px'}}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={320}
                  height={240}
                  mirrored={true}
                  style={{
                    border: '2px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
                <div style={{marginTop: '10px', fontWeight: 'bold'}}>
                  {faceVisible === true && <span style={{color: 'green'}}>Face detected</span>}
                  {faceVisible === false && <span style={{color: 'red'}}>No face detected</span>}
                  {faceVisible === null && <span style={{color: 'gray'}}>Checking...</span>}
                </div>
                <div className="camera-controls" style={{marginTop: '10px'}}>
                  <button 
                    type="button"
                    onClick={faceVisible === true ? capturePhoto : undefined}
                    className="capture-button"
                    style={{
                      backgroundColor: faceVisible === true ? '#007bff' : '#aaa',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: faceVisible === true ? 'pointer' : 'not-allowed',
                      marginRight: '10px',
                      opacity: faceVisible === true ? 1 : 0.7
                    }}
                    disabled={faceVisible !== true}
                    title={faceVisible === true ? '' : 'No face detected'}
                  >
                    📸 Capture
                  </button>
                  <button 
                    type="button"
                    onClick={closeCamera}
                    className="cancel-button"
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {capturedPhoto && (
              <div className="captured-photo" style={{marginTop: '10px'}}>
                <img 
                  src={capturedPhoto} 
                  alt="Captured" 
                  style={{
                    width: '200px',
                    height: '150px',
                    objectFit: 'cover',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    transform: 'scaleX(-1)'
                  }}
                />
                <div className="photo-controls" style={{marginTop: '10px'}}>
                  <button 
                    type="button"
                    onClick={retakePhoto}
                    className="retake-button"
                    style={{
                      backgroundColor: '#ffc107',
                      color: 'black',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Retake Photo
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button 
              onClick={handleRegister} 
              disabled={isLoading}
              className="primary-button"
            >
              {isLoading 
                ? 'Loading models...' 
                : formMode === 'add' 
                  ? 'Register Student' 
                  : 'Update Student'
              }
            </button>
            {formMode === 'edit' && (
              <button onClick={resetForm} className="secondary-button">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="student-table">
        {/* Grouped students modal */}
        {showGroupModal && (
          <div className="group-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 700, width: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(33,150,243,0.10)' }}>
              <h2>Students by Section & Subject</h2>
              <button onClick={() => setShowGroupModal(false)} style={{ float: 'right', background: '#ff4757', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>Close</button>
              {Object.keys(groupedStudents).length === 0 ? (
                <div>No students found.</div>
              ) : (
                Object.entries(groupedStudents).map(([key, students]) => (
                  <div key={key} style={{ marginBottom: 24 }}>
                    <h3 style={{ color: '#2196F3', marginBottom: 8 }}>{key}</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                      <thead>
                        <tr style={{ background: '#f3f6fa' }}>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Name</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Student ID</th>
                          <th style={{ padding: '8px', fontWeight: 700 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student.id}>
                            <td style={{ padding: '8px' }}>{student.name}</td>
                            <td style={{ padding: '8px' }}>{student.id}</td>
                            <td style={{ padding: '8px' }}>{student.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <h2 className="student-list-title">Students List <span className="student-list-count">({filteredStudents.length})</span></h2>
        {isLoading && (
          <div className="student-loading">
            <div className="student-spinner"></div>
            <div className="student-loading-text">Loading students...</div>
          </div>
        )}
        {(!isLoading && filteredStudents.length === 0) ? (
          <div className="no-students">
            {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
          </div>
        ) : (!isLoading && (
          <div className="student-card-list">
            {filteredStudents.map((student, index) => {
              const originalIndex = students.findIndex(s => s.studentId === student.studentId);
              const isEditing = formMode === 'edit' && selectedIndex === originalIndex;
              return (
                <div 
                  key={`${student.studentId}-${index}`} 
                  className={`student-card${isEditing ? ' editing' : ''}`}
                >
                  <div className="student-card-photo">
                    {student.photo ? (
                      <img
                        src={getPhotoUrl(student, originalIndex)}
                        alt={student.fullName}
                        width={64}
                        height={64}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjI1IiBjeT0iMjAiIHI9IjgiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDQwQzEwIDMxLjE2MzQgMTcuMTYzNCAyNCAyNiAyNENCMy40ODM2NiAyNCA0MiA0MS4xNjM0IDQyIDQwSDEwWkgiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                          e.target.onerror = null;
                        }}
                        className="student-avatar"
                      />
                    ) : (
                      <span className="student-avatar-placeholder">👤</span>
                    )}
                  </div>
                  <div className="student-card-info">
                    <div className="student-card-name">{student.fullName}</div>
                    <div className="student-card-meta">
                      <span className="student-card-id">ID: {student.studentId}</span>
                      <span className="student-card-section">Section: {student.section}</span>
                    </div>
                    <div className="student-card-status-row">
                      <span className={`status ${student.status && student.status.toLowerCase()}`}>{student.status}</span>
                    </div>
                  </div>
                  <div className="student-card-actions">
                    <button 
                      onClick={() => handleEdit(originalIndex)}
                      className="edit-button"
                      title="Edit student"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => {
                        setDeletingIndex(originalIndex);
                        if (window.confirm('Are you sure you want to delete this student?')) {
                          handleDelete(originalIndex);
                        }
                        setDeletingIndex(null);
                      }}
                      className="delete-button"
                      title="Delete student"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageStudent;
