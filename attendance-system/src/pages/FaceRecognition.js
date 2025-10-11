
import React, { useState, useEffect, useRef } from 'react';
// For teacher profile
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels, areModelsLoaded } from '../shared/faceApiLoader';
import { fetchStudents } from '../api/studentApi';
import { fetchSubjectSections } from '../features/students/pages/subjectSectionApi';


function FaceRecognition() {
  // Get current user and teacher profile from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const [profileData, setProfileData] = useState(null);
  const webcamRef = useRef(null);
  const [faceVisible, setFaceVisible] = useState(null);
  const [cameraInterval, setCameraInterval] = useState(null);
  const [students, setStudents] = useState([]);
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  // Dropdown state
  const [sectionList, setSectionList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Load students with descriptors on mount
  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await fetchStudents();
        setStudents(data.filter(s => Array.isArray(s.descriptor) && s.descriptor.length === 128));
      } catch {
        setStudents([]);
      }
    }
    loadStudents();
  }, []);

  // Load teacher profile and filter section/subject lists
  useEffect(() => {
    async function loadProfileAndSectionSubject() {
      let teacherProfile = null;
      try {
        // Try to fetch teacher profile from backend
        if (currentUser && currentUser._id) {
          const res = await fetch(`/api/user/${currentUser._id}`);
          if (res.ok) {
            teacherProfile = await res.json();
            setProfileData(teacherProfile);
          }
        }
      } catch { setProfileData(null); }
      try {
        const data = await fetchSubjectSections();
        // Filter by teacher's assignedSections/subjects
        let allowedSections = [];
        let allowedSubjects = [];
        if (teacherProfile) {
          if (Array.isArray(teacherProfile.assignedSections)) {
            allowedSections = teacherProfile.assignedSections.map(s => s.sectionName).filter(Boolean);
            allowedSubjects = teacherProfile.assignedSections.map(s => s.subjectName).filter(Boolean);
          }
          if (Array.isArray(teacherProfile.subjects)) {
            allowedSubjects = allowedSubjects.concat(teacherProfile.subjects.map(s => s.subjectName || s.type || s.name || s).filter(Boolean));
          }
        }
        // Fallback: show all if none assigned
        if (!allowedSections.length) allowedSections = [...new Set(data.map(item => item.section))];
        if (!allowedSubjects.length) allowedSubjects = [...new Set(data.map(item => item.subject))];
        setSectionList([...new Set(allowedSections)]);
        setSubjectList([...new Set(allowedSubjects)]);
      } catch {
        setSectionList([]);
        setSubjectList([]);
      }
    }
    loadProfileAndSectionSubject();
  }, []);

  // Real-time face detection and matching
  const checkFaceRealtime = async () => {
    if (!areModelsLoaded()) {
      setFaceVisible(null);
      setRecognizedStudent(null);
      return;
    }
    const video = webcamRef.current && webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      setFaceVisible(null);
      setRecognizedStudent(null);
      return;
    }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setFaceVisible(null);
      setRecognizedStudent(null);
      return;
    }
    const img = await faceapi.fetchImage(imageSrc);
    let detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) {
      detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }
    if (detection && detection.descriptor && students.length > 0) {
      // Find best match
      let minDistance = Infinity;
      let bestStudent = null;
      students.forEach(student => {
        const dist = faceapi.euclideanDistance(detection.descriptor, student.descriptor);
        if (dist < minDistance) {
          minDistance = dist;
          bestStudent = student;
        }
      });
      // Debug output
      console.log('Detected descriptor:', detection.descriptor);
      console.log('Best match:', bestStudent ? bestStudent.fullName : null, 'Distance:', minDistance);
      // Threshold for match (adjustable)
      if (minDistance < 0.65) {
        setRecognizedStudent(bestStudent);
      } else {
        setRecognizedStudent(null);
      }
      setFaceVisible(true);
    } else {
      setFaceVisible(detection ? true : false);
      setRecognizedStudent(null);
      if (detection && detection.descriptor) {
        console.log('No students to match or descriptor missing. Descriptor:', detection.descriptor);
      }
    }
  };

  useEffect(() => {
    let interval = null;
    setFaceVisible(null);
    setRecognizedStudent(null);
    async function loadAndStartDetection() {
      await loadFaceApiModels();
      interval = setInterval(checkFaceRealtime, 700);
      setCameraInterval(interval);
    }
    loadAndStartDetection();
    return () => {
      if (interval) clearInterval(interval);
      if (cameraInterval) clearInterval(cameraInterval);
    };
  }, [students]);

  const capture = async () => {
    if (faceVisible !== true) {
      alert('No face detected. Please ensure your face is clearly visible and try again.');
      return;
    }
    // ...existing capture logic...
  };


  return (
    <div>
      <div style={{display:'flex',gap:24,marginBottom:16}}>
        <div>
          <label style={{fontWeight:500}}>Section:</label><br/>
          <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} style={{padding:'6px 12px',borderRadius:6,minWidth:120}}>
            <option value="">Select section</option>
            {sectionList.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{fontWeight:500}}>Subject:</label><br/>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{padding:'6px 12px',borderRadius:6,minWidth:120}}>
            <option value="">Select subject</option>
            {subjectList.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>
      {(!selectedSection || !selectedSubject) ? (
        <div style={{marginTop:32, color:'#e53e3e', fontWeight:600, fontSize:'1.1em'}}>Please select a section and subject to start face recognition.</div>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={640}
            height={480}
            mirrored={true}
          />
          <div style={{marginTop: '10px', fontWeight: 'bold'}}>
            {faceVisible === true && <span style={{color: 'green'}}>Face detected</span>}
            {faceVisible === false && <span style={{color: 'red'}}>No face detected</span>}
            {faceVisible === null && <span style={{color: 'gray'}}>Checking...</span>}
          </div>
          {recognizedStudent && (
            <div style={{marginTop: '12px', fontSize: '1.2em', color: '#007bff'}}>
              Recognized: <strong>{recognizedStudent.fullName} ({recognizedStudent.studentId})</strong>
            </div>
          )}
          {faceVisible === true ? (
            <button
              type="button"
              onClick={capture}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px',
                opacity: 1
              }}
              title=""
            >
              Scan
            </button>
          ) : (
            <button
              type="button"
              style={{
                backgroundColor: '#aaa',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'not-allowed',
                marginTop: '10px',
                opacity: 0.7
              }}
              disabled
              title="No face detected"
            >
              Scan
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default FaceRecognition;