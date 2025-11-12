import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels, areModelsLoaded } from '../../../shared/faceApiLoader';
import { debugFaceRecognition, debugDescriptor } from '../../../shared/debugHelper';
import '../styles/FacialRecognition.css';

const dimensions = {
  width: 640,
  height: 480,
};

function FaceRecognition() {
  const navigate = useNavigate();
  const webcamRef = useRef();
  const intervalRef = useRef();
  const scannedStudentsRef = useRef(new Set()); // Immediate reference for race condition prevention
  
  // Face detection states
  const [faceDetected, setFaceDetected] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [modelsStatus, setModelsStatus] = useState('loading'); // 'loading', 'ready', 'error'
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Session and attendance states
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true); // Enable auto-record by default
  const [detectionCount, setDetectionCount] = useState(0); // Debug: count detection attempts
  const [scannedStudents, setScannedStudents] = useState(new Set()); // Track students scanned in current session
  const [processingAttendance, setProcessingAttendance] = useState(false); // Prevent multiple simultaneous recordings
  
  // Load data from localStorage
  useEffect(() => {
    const savedSubjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const savedAttendance = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    
    setSubjects(savedSubjects);
    setAttendanceRecords(savedAttendance);
  }, []);

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading face detection models...');
        setIsProcessing(true);
        setModelsStatus('loading');
        
        await loadFaceApiModels();
        
        setModelsStatus('ready');
        setIsProcessing(false);
        console.log('✅ Face API models loaded successfully');
      } catch (error) {
        console.error('❌ Error loading models:', error);
        setModelsStatus('error');
        setIsProcessing(false);
        console.error('Failed to load face detection models. Please refresh the page.');
      }
    };

    loadModels();
  }, []);

  // Record attendance
  const recordAttendance = (student) => {
    console.log('📝 ATTENDANCE RECORDING STARTED');
    console.log('👤 Student to record:', student);
    console.log('📚 Selected subject:', selectedSubject);
    console.log('🏫 Selected section:', selectedSection);
    
    if (!selectedSubject || !selectedSection) {
      console.log('❌ Missing subject or section');
      console.error('Please select subject and section first!');
      return;
    }

    // Check if already processing attendance
    if (processingAttendance) {
      console.log('⚠️ Already processing attendance, skipping...');
      return;
    }

    // Set processing flag to prevent multiple simultaneous recordings
    setProcessingAttendance(true);

    // Check if student already scanned in current session
    console.log('🔍 === COMPREHENSIVE DUPLICATE CHECK ===');
    console.log('👤 Student name to check:', student.name);
    console.log('🆔 Student ID to check:', student.id);
    console.log('📋 Current scanned students (state):', Array.from(scannedStudents));
    console.log('📋 Current scanned students (ref):', Array.from(scannedStudentsRef.current));
    console.log('🔍 Is student in scanned list (state)?', scannedStudents.has(student.name));
    console.log('🔍 Is student in scanned list (ref)?', scannedStudentsRef.current.has(student.name));
    console.log('📊 Total scanned students:', scannedStudents.size);
    
    if (scannedStudents.has(student.name) || scannedStudentsRef.current.has(student.name)) {
      console.log('⚠️ DUPLICATE SCAN DETECTED - Student already scanned in current session');
      console.warn(`${student.name} has already been scanned in this session.`);
      setProcessingAttendance(false); // Reset processing flag
      return;
    }

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const currentDate = now.toISOString().split('T')[0];
    
    console.log('📅 Current date:', currentDate);
    console.log('🕐 Current time:', currentTime);
    
    // Get the most up-to-date attendance records
    const latestAttendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    console.log('📊 Latest attendance records from localStorage:', latestAttendanceRecords.length);
    
    // Check if student is already marked present today for this subject/section
    const existingRecord = latestAttendanceRecords.find(record => 
      record.studentId === student.id &&
      record.subject === selectedSubject &&
      record.section === selectedSection &&
      record.date === currentDate
    );

    console.log('🔍 Checking for existing record...');
    console.log('📋 Checking against', latestAttendanceRecords.length, 'total records');
    console.log('🔍 Found existing record:', existingRecord);
    console.log('🔍 Search criteria:', {
      studentId: student.id,
      subject: selectedSubject,
      section: selectedSection,
      date: currentDate
    });

    if (existingRecord) {
      console.log('⚠️ Student already marked today');
      console.warn(`${student.name} is already marked as ${existingRecord.status} for today's ${selectedSubject} class.`);
      return;
    }

    // Determine status based on time (assuming classes start at 8:00 AM)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 15);
    
    const attendanceRecord = {
      id: `${student.id}_${currentDate}_${Date.now()}`,
      studentId: student.id,
      name: student.name,
      subject: selectedSubject,
      section: selectedSection,
      status: isLate ? 'Late' : 'Present',
      timestamp: currentTime,
      date: currentDate,
      recordedAt: now.toISOString(),
      recognitionTime: now.toISOString()
    };

    // Final safety check - get the absolute latest records before saving
    const finalCheckRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const finalDuplicateCheck = finalCheckRecords.find(record => 
      record.studentId === student.id &&
      record.subject === selectedSubject &&
      record.section === selectedSection &&
      record.date === currentDate
    );

    if (finalDuplicateCheck) {
      console.log('🚨 FINAL SAFETY CHECK: Duplicate detected just before saving!');
      console.log('🔍 Existing record found:', finalDuplicateCheck);
      console.error(`${student.name} is already marked for today. Duplicate prevented!`);
      setProcessingAttendance(false);
      return;
    }

    const updatedRecords = [...finalCheckRecords, attendanceRecord];
    console.log('💾 Saving attendance record:', attendanceRecord);
    console.log('📊 Updated records count (from', finalCheckRecords.length, 'to', updatedRecords.length, ')');
    
    // Save to both state and localStorage
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
    console.log('✅ Attendance saved to localStorage');
    
    // Add student to scanned students set for current session (both state and ref)
    console.log('📋 ADDING TO SCANNED STUDENTS LIST:');
    console.log('👤 Adding student:', student.name);
    console.log('📋 Before adding - scanned students:', Array.from(scannedStudents));
    
    // Add to ref immediately to prevent race conditions
    scannedStudentsRef.current.add(student.name);
    console.log('📋 Added to ref immediately:', Array.from(scannedStudentsRef.current));
    
    setScannedStudents(prev => {
      const newSet = new Set([...prev, student.name]);
      console.log('📋 After adding to state - scanned students:', Array.from(newSet));
      console.log('📊 New total count:', newSet.size);
      return newSet;
    });
    
    console.log(`📋 Added ${student.name} to scanned students for this session`);
    
    // Show success message
    const statusMessage = isLate ? 'marked as LATE' : 'marked as PRESENT';
    console.log(`🎉 SUCCESS: ${student.name} ${statusMessage}`);
    console.log(`✅ ${student.name} has been ${statusMessage} for ${selectedSubject} - ${selectedSection}`);
    
    // Reset processing flag after successful recording
    setProcessingAttendance(false);
    
    // Clear recognition after recording
    setTimeout(() => {
      setFaceDetected(false);
      setStudentName('');
      setRecognizedStudent(null);
    }, 3000);
  };

  // Start/Stop recognition session
  const toggleSession = () => {
    if (!selectedSubject || !selectedSection) {
      console.error('Please select subject and section before starting the session!');
      return;
    }
    
    if (sessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = () => {
    console.log('🎬 Starting session...');
    setSessionActive(true);
    setDetectionCount(0); // Reset detection counter
    setScannedStudents(new Set()); // Reset scanned students for new session
    scannedStudentsRef.current = new Set(); // Reset ref immediately
    setProcessingAttendance(false); // Reset processing flag
    
    // Automatically trigger face detection test instead of direct handleVideoOnPlay
    console.log('🔄 Auto-triggering Test Face Detection...');
    setTimeout(() => {
      testFaceDetection();
    }, 1000); // Small delay to ensure UI is updated
  };

  const stopSession = () => {
    setSessionActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFaceDetected(false);
    setStudentName('');
    setRecognizedStudent(null);
    setScannedStudents(new Set()); // Clear scanned students when session ends
    scannedStudentsRef.current = new Set(); // Clear ref immediately
    setProcessingAttendance(false); // Reset processing flag
  };

  // Manual face detection test
  const testFaceDetection = async () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      console.error('Camera not ready. Please wait for camera to load.');
      return;
    }

    const video = webcamRef.current.video;
    console.log('🧪 === MANUAL TEST STARTING ===');
    console.log('📹 Manual test video info:', {
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      paused: video.paused
    });

    try {
      // Test multiple detection methods
      console.log('🔍 Manual Test Method 1: SSD MobileNet (confidence 0.05)');
      let detections = await faceapi
        .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log(`Manual test result 1: ${detections.length} faces found`);
      
      if (detections.length === 0) {
        console.log('🔍 Manual Test Method 2: SSD MobileNet (confidence 0.01)');
        detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.01 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        console.log(`Manual test result 2: ${detections.length} faces found`);
      }

      if (detections.length > 0) {
        console.log('✅ SUCCESS! Face detection working!');
        console.log('📊 Detection details:', detections.map((d, i) => ({
          index: i,
          confidence: d.detection.score,
          descriptorLength: d.descriptor?.length || 'MISSING',
          box: {
            x: Math.round(d.detection.box.x),
            y: Math.round(d.detection.box.y),
            width: Math.round(d.detection.box.width),
            height: Math.round(d.detection.box.height)
          }
        })));
        console.log(`SUCCESS! Detected ${detections.length} face(s). Now testing recognition...`);
        
        // Automatically trigger Test Recognition since face detection is working
        console.log('🔄 AUTO-TRIGGERING Test Recognition since face detection successful...');
        setTimeout(() => {
          testRecognition();
        }, 1000); // Small delay to allow alert to be seen
        
      } else {
        console.log('❌ MANUAL TEST FAILED: No faces detected with any method');
        console.log('💡 Suggestions:');
        console.log('  - Make sure your face is well-lit');
        console.log('  - Face camera directly');
        console.log('  - Move closer to camera');
        console.log('  - Check if models loaded properly');
        
        // Compare with live detection state
        console.log('🔄 === COMPARISON WITH LIVE DETECTION ===');
        console.log('Manual test uses same video element as live detection:', video === webcamRef.current.video);
        console.log('This suggests the issue is NOT with the video element itself');
        console.log('Possible causes:');
        console.log('  1. Timing difference (live detection runs every 1 second)');
        console.log('  2. Detection method differences');
        console.log('  3. Face position/lighting changes between manual test and live scan');
        
        console.error('FAILED: No faces detected. Please check console for detailed analysis.');
      }
    } catch (error) {
      console.error('❌ Error during manual face detection test:', error);
      console.error(`Error during test: ${error.message}`);
    }
    console.log('🧪 === MANUAL TEST COMPLETE ===');
  };

  // Check model loading status
  const checkModelsStatus = () => {
    console.log('🔧 Checking face-api models status...');
    
    const modelStatus = {
      ssdMobilenet: faceapi.nets.ssdMobilenetv1.isLoaded,
      faceLandmark68: faceapi.nets.faceLandmark68Net.isLoaded,
      faceRecognition: faceapi.nets.faceRecognitionNet.isLoaded,
      tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded
    };
    
    console.log('📋 Model Status:', modelStatus);
    
    const allLoaded = modelStatus.ssdMobilenet && modelStatus.faceLandmark68 && modelStatus.faceRecognition;
    
    if (allLoaded) {
      console.log('✅ All required models are loaded!');
      console.log('✅ All models loaded successfully!');
    } else {
      console.log('❌ Some models are missing!');
      console.error('❌ Some models failed to load. Check console for details.');
    }
    
    return allLoaded;
  };

  // Test recognition manually (same logic as live detection)
  const testRecognition = async () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      console.error('Camera not ready');
      return;
    }

    console.log('🧪 === MANUAL RECOGNITION TEST ===');
    
    // Get the same students data as live detection
    const storedStudents = JSON.parse(localStorage.getItem('students')) || [];
    const filteredStudents = storedStudents.filter(student => 
      student.subject === selectedSubject && student.section === selectedSection
    );

    console.log(`📚 Selected: ${selectedSubject} - ${selectedSection}`);
    console.log(`👥 Filtered students: ${filteredStudents.length}`);

    if (filteredStudents.length === 0) {
      console.error('No students in selected subject/section!');
      return;
    }

    // Create labeled descriptors (same as live detection)
    const labeledDescriptors = filteredStudents
      .filter(student => student.descriptor && student.descriptor.length === 128)
      .map(student => 
        new faceapi.LabeledFaceDescriptors(
          student.name,
          [new Float32Array(student.descriptor)]
        )
      );

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 1.3);

    // Detect faces (same method as live)
    const video = webcamRef.current.video;
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`🔍 Detections found: ${detections.length}`);

    if (detections.length > 0) {
      const detection = detections[0];
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      
      console.log('🎯 Recognition result:', bestMatch);
      
      if (bestMatch.label !== 'unknown') {
        console.log('✅ RECOGNITION SUCCESS!');
        const student = filteredStudents.find(s => s.name === bestMatch.label);
        console.log('👤 Student found:', student);
        
        // Test attendance recording
        if (student) {
          recordAttendance(student);
        }
        
        // Check if we're already in a session (started by Start Session button)
        if (sessionActive) {
          console.log(`✅ Recognition successful! Starting live detection...`);
          console.log('🚀 STARTING LIVE DETECTION since recognition test successful and session is active');
          
          // Enable auto-record and start live detection
          setAutoRecord(true);
          
          setTimeout(() => {
            console.log('📹 Starting live detection with handleVideoOnPlay...');
            handleVideoOnPlay();
          }, 2000); // Give time for alert
          
        } else {
          // If not in session, auto-start one (fallback for manual test)
          console.log(`✅ Recognition successful! Starting session automatically...`);
          console.log('🚀 AUTO-STARTING SESSION since recognition test successful');
          
          // Enable auto-record and start session
          setAutoRecord(true);
          
          setTimeout(() => {
            console.log('📖 Starting session automatically...');
            startSession();
          }, 2000); // Give time for alert
        }
        
      } else {
        console.log('❌ Face detected but not recognized');
      }
    } else {
      console.log('❌ No faces detected in manual recognition test');
    }
  };

  const handleVideoOnPlay = async () => {
    console.log('📹 Video onPlay triggered');
    
    if (!areModelsLoaded()) {
      console.log('⏳ Models not loaded yet, waiting...');
      setTimeout(() => handleVideoOnPlay(), 1000);
      return;
    }

    if (!sessionActive) {
      console.log('⚠️ Session not active, skipping detection start');
      return;
    }

    // Simple delay then start detection
    console.log('⏳ Starting detection in 2 seconds...');
    setTimeout(() => {
      if (sessionActive) {
        console.log('� Now starting live detection!');
        startDetection();
      }
    }, 2000);
  };

  // Start the actual face detection process
  const startDetection = async () => {
    console.log('🔄 startDetection called');
    
    if (!webcamRef.current || !webcamRef.current.video) {
      console.log('❌ No webcam or video element available');
      return;
    }

    if (!sessionActive) {
      console.log('❌ Session not active, aborting detection');
      return;
    }

    const storedStudents = JSON.parse(localStorage.getItem('students')) || [];
    
    // Debug localStorage data
    console.log('🔍 DEBUG: Starting face recognition session');
    const debugData = debugFaceRecognition();

    if (storedStudents.length === 0) {
      console.warn('⚠️ No students registered.');
      console.error('No students found. Please register students first in Manage Students.');
      return;
    }

    // Filter students by selected subject and section
    const filteredStudents = storedStudents.filter(student => 
      student.subject === selectedSubject && student.section === selectedSection
    );

    console.log(`🎯 Filtering for: ${selectedSubject} - ${selectedSection}`);
    console.log(`📊 Total students: ${storedStudents.length}, Filtered: ${filteredStudents.length}`);
    
    // Debug: Show students in current subject/section vs all students
    console.log('📋 Students in current subject/section:');
    console.table(filteredStudents.map((s, i) => ({
      index: i,
      name: s.name,
      id: s.id,
      subject: s.subject,
      section: s.section,
      hasDescriptor: s.descriptor?.length === 128 ? 'YES' : 'NO'
    })));
    
    // Debug: Log all student descriptors
    storedStudents.forEach((student, index) => {
      console.log(`👤 Student ${index + 1}: ${student.name} (${student.subject}-${student.section}), Descriptor length: ${student.descriptor?.length || 'MISSING'}`);
      if (student.descriptor?.length !== 128) {
        console.warn(`⚠️ Student ${student.name} has invalid descriptor!`);
      }
    });

    if (storedStudents.filter(s => s.descriptor?.length === 128).length === 0) {
      console.error('❌ No students with valid descriptors found!');
      console.error('No students with valid face data found. Please re-register students using the camera in Manage Students.');
      return;
    }

    if (filteredStudents.length === 0) {
      console.error(`No students found for ${selectedSubject} - ${selectedSection}. Please check your selection.`);
      return;
    }

    const labeledDescriptors = filteredStudents.map(student => {
      console.log(`🧬 Processing descriptor for ${student.name}`);
      debugDescriptor(student.descriptor);
      
      const descriptor = new Float32Array(student.descriptor);
      return new faceapi.LabeledFaceDescriptors(student.name, [descriptor]);
    });

    console.log(`🎯 Created ${labeledDescriptors.length} labeled descriptors`);
    // Make threshold very lenient for testing (1.1 -> 1.3)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 1.3);

    console.log('🚀 Starting detection interval...'); // Confirm we reach this point
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(async () => {
      console.log('🔄 Live detection interval triggered'); // Add this to confirm interval runs
      
      if (!webcamRef.current || !webcamRef.current.video || !sessionActive) {
        console.log('⚠️ Detection skipped - missing requirements:', {
          webcamRef: !!webcamRef.current,
          video: !!webcamRef.current?.video,
          sessionActive: sessionActive
        });
        return;
      }

      const video = webcamRef.current.video;
      
      // Increment detection counter for debugging
      setDetectionCount(prev => prev + 1);
      
      // Add video status debugging every 5th attempt to see what's happening
      if (detectionCount % 5 === 0) {
        console.log(`🔄 Detection attempt #${detectionCount + 1}`);
        console.log('📹 Video status:', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          currentTime: video.currentTime
        });
      }

      try {
        // Use EXACT same method as manual test that works
        console.log(`🔍 Starting detection attempt #${detectionCount + 1}...`);
        
        // Use the same simple method as manual test
        let detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.05 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        console.log(`🔍 Live detection result: ${detections.length} faces found`);

        console.log(`🔍 Total detections found: ${detections.length}`);

        if (detections.length > 0) {
          console.log('✅ Face detected, processing...');

          // Filter detections with valid descriptor length
          const validDetections = detections.filter(
            d => d.descriptor && d.descriptor.length === 128
          );

          console.log(`📊 Detections: ${detections.length}, Valid: ${validDetections.length}`);

          if (validDetections.length === 0) {
            console.log('❌ No valid detections (descriptor length != 128)');
            setStudentName('');
            setFaceDetected(false);
            setRecognizedStudent(null);
            return;
          }

          // Use the first valid detection's descriptor to find best match
          const detection = validDetections[0];
          console.log('🔍 Detection descriptor length:', detection.descriptor.length);
          
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          console.log('🎯 Best match result:', bestMatch);
          console.log('🎯 Match label:', bestMatch.label);
          console.log('🎯 Match distance:', bestMatch.distance);
          console.log('🎯 Threshold used: 1.3 (lower distance = better match)');
          
          // Additional debugging: show all students and their distances
          console.log('📋 Detailed matching analysis:');
          const allMatches = labeledDescriptors.map(desc => {
            const distance = faceapi.euclideanDistance(detection.descriptor, desc.descriptors[0]);
            return {
              student: desc.label,
              distance: distance.toFixed(4),
              isMatch: distance <= 1.3
            };
          });
          console.table(allMatches);
          
          // Check if we should lower the threshold
          const bestDistance = Math.min(...allMatches.map(m => parseFloat(m.distance)));
          console.log(`🔍 Best actual distance: ${bestDistance.toFixed(4)}`);
          if (bestDistance > 1.3 && bestDistance < 1.7) {
            console.log('💡 SUGGESTION: Distance is close but above threshold. Consider lowering threshold or re-registering.');
          }

          console.log('🎯 Best match:', bestMatch);

          if (bestMatch.label === 'unknown') {
            console.log('❌ Face not recognized - distance too high or no close match');
            console.log('💡 Try re-registering with a clearer, well-lit photo');
            setStudentName('Unknown Face');
            setRecognizedStudent(null);
          } else {
            console.log('✅ Face recognized successfully!');
            console.log(`👤 Matched with: ${bestMatch.label}`);
            const student = filteredStudents.find(s => s.name === bestMatch.label);
            console.log('🔍 Found student object:', student);
            setStudentName(bestMatch.label);
            setRecognizedStudent(student);
            
            // Auto-record attendance if enabled
            if (autoRecord && student) {
              // Check if already processing attendance
              if (processingAttendance) {
                console.log('⚠️ Already processing attendance, skipping this detection...');
                return;
              }
              
              // Additional safety check using localStorage directly
              const currentDate = new Date().toISOString().split('T')[0];
              const latestRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
              const alreadyRecorded = latestRecords.find(record => 
                record.studentId === student.id &&
                record.subject === selectedSubject &&
                record.section === selectedSection &&
                record.date === currentDate
              );
              
              if (alreadyRecorded) {
                console.log('⚠️ LIVE DETECTION: Student already has attendance record for today!');
                console.log('📋 Existing record:', alreadyRecorded);
                return;
              }
              
              // Check if student already scanned in current session
              if (scannedStudents.has(student.name) || scannedStudentsRef.current.has(student.name)) {
                console.log('⚠️ Student already scanned in this session, skipping detection cycle...');
                console.log(`📋 ${student.name} was already scanned. Total scanned: ${scannedStudents.size}`);
                console.log('🔄 Continuing to next detection cycle...');
                // Exit the entire detection function to prevent further processing
                setFaceDetected(false);
                return;
              }
              
              console.log('🤖 Auto-recording attendance...');
              console.log('📝 Recording attendance for:', student.name);
              console.log('🎉 *** AUTOMATIC RECOGNITION SUCCESS! ***');
              recordAttendance(student);
            } else {
              console.log('📝 Auto-record disabled or no student. Click "Record Attendance" button to mark attendance!');
              console.log('📊 Auto-record status:', autoRecord);
              console.log('📊 Student object exists:', !!student);
              
              if (!autoRecord) {
                console.log('💡 TIP: Enable auto-record checkbox to automatically mark attendance!');
              }
            }
          }

          setFaceDetected(true);
        } else {
          // More detailed debugging when no faces detected
          console.log(`❌ No face detected in attempt #${detectionCount + 1}`);
          if (detectionCount % 5 === 0) {
            console.log('🔧 Debug info (every 5 attempts):');
            console.log('  - Models loaded:', {
              ssd: faceapi.nets.ssdMobilenetv1.isLoaded,
              landmarks: faceapi.nets.faceLandmark68Net.isLoaded,
              recognition: faceapi.nets.faceRecognitionNet.isLoaded
            });
            console.log('  - Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            console.log('  - Session active:', sessionActive);
            console.log('  - Video ready state:', video.readyState);
            console.log('  - Video current time:', video.currentTime);
          }
          setStudentName('');
          setFaceDetected(false);
          setRecognizedStudent(null);
        }
      } catch (error) {
        console.error(`❌ Error in detection attempt #${detectionCount + 1}:`, error);
      }
    }, 500); // Reduced from 1000ms to 500ms for more frequent detection
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get today's attendance for selected subject/section
  const getTodaysAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.filter(record => 
      record.date === today &&
      record.subject === selectedSubject &&
      record.section === selectedSection
    );
  };

  const todaysAttendance = getTodaysAttendance();

  return (
    <div className="facial-recognition-container">
      <div className="header-section">
        <h1>🎯 Facial Recognition Attendance</h1>
        <p className="subtitle">Automated attendance tracking using face recognition technology</p>
        
        <div className="navigation-controls">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="nav-button"
          >
            ← Back to Dashboard
          </button>
          <button 
            onClick={() => navigate('/manage-attendance')} 
            className="nav-button"
          >
            View Attendance Records →
          </button>
        </div>
      </div>

      {/* Session Controls */}
      <div className="session-controls">
        <div className="control-group">
          <label htmlFor="subject">Select Subject:</label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={sessionActive}
          >
            <option value="">Choose Subject</option>
            {subjects.map((subject, index) => (
              <option key={index} value={subject.subjectName}>
                {subject.subjectName}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="section">Select Section:</label>
          <select
            id="section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={sessionActive}
          >
            <option value="">Choose Section</option>
            {subjects
              .filter(s => s.subjectName === selectedSubject)
              .map((subject, index) => (
                <option key={index} value={subject.sectionName}>
                  {subject.sectionName}
                </option>
              ))}
          </select>
        </div>

        <div className="control-group">
          <button
            onClick={toggleSession}
            className={`session-button ${sessionActive ? 'stop' : 'start'}`}
            disabled={isProcessing || (!selectedSubject || !selectedSection)}
          >
            {sessionActive ? '⏹️ Stop Session' : '▶️ Start Session'}
          </button>
        </div>

        <div className="control-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={autoRecord}
              onChange={(e) => setAutoRecord(e.target.checked)}
            />
            🤖 Auto-record attendance when face is recognized
          </label>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div className={`status-indicator ${modelsStatus === 'ready' ? 'ready' : 'loading'}`}>
          <span className="status-icon">{modelsStatus === 'ready' ? '✅' : modelsStatus === 'error' ? '❌' : '⏳'}</span>
          <span className="status-text">
            {modelsStatus === 'ready' ? 'Models Loaded' : modelsStatus === 'error' ? 'Models Failed' : 'Loading Models...'}
          </span>
        </div>

        <div className={`status-indicator ${sessionActive ? 'active' : 'inactive'}`}>
          <span className="status-icon">{sessionActive ? '🔴' : '⚪'}</span>
          <span className="status-text">
            {sessionActive ? 'Session Active' : 'Session Inactive'}
          </span>
        </div>

        <div className={`status-indicator ${faceDetected ? 'detected' : 'scanning'}`}>
          <span className="status-icon">{faceDetected ? '👤' : '🔍'}</span>
          <span className="status-text">
            {faceDetected ? 'Face Detected' : `Scanning... (${detectionCount} attempts)`}
          </span>
        </div>
        
        {sessionActive && (
          <div className="session-stats">
            <span className="stats-text">
              📋 Students scanned this session: {scannedStudents.size}
            </span>
          </div>
        )}
      </div>

      {/* Camera and Recognition */}
      <div className="camera-section">
        <div className="webcam-container">
          <Webcam
            ref={webcamRef}
            className="webcam"
            audio={false}
            width={dimensions.width}
            height={dimensions.height}
            videoConstraints={{ facingMode: 'user' }}
            onUserMedia={() => sessionActive && handleVideoOnPlay()}
          />
          {!sessionActive && (
            <div className="camera-overlay">
              <p>Select subject and section, then start session to begin</p>
            </div>
          )}
        </div>

        <div className={`recognition-result ${faceDetected ? 'detected' : 'not-detected'}`}>
          {faceDetected ? (
            <div className="student-recognized">
              {studentName === 'Unknown Face' ? (
                <div className="unknown-student">
                  <h2>
                    <span className="unknown-icon">❓</span>
                    Face Not Recognized
                  </h2>
                  <p className="unknown-message">This person is not registered in the selected class.</p>
                </div>
              ) : (
                <div className="recognized-student">
                  <h2 className="student-greeting">
                    <span className="success-icon">✅</span>
                    Hello, {studentName}!
                  </h2>
                  
                  {recognizedStudent && (
                    <div className="student-details">
                      <div className="primary-info">
                        <div className="info-card name-card">
                          <span className="info-label">Student Name</span>
                          <span className="info-value">{recognizedStudent.name}</span>
                        </div>
                        <div className="info-card section-card">
                          <span className="info-label">Section</span>
                          <span className="info-value">{recognizedStudent.section}</span>
                        </div>
                      </div>
                      
                      <div className="secondary-info">
                        <div className="info-item">
                          <span className="info-label">Student ID:</span>
                          <span className="info-value">{recognizedStudent.id}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Subject:</span>
                          <span className="info-value">{recognizedStudent.subject}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => recordAttendance(recognizedStudent)}
                        className="record-attendance-btn"
                      >
                        📝 Record Attendance
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="no-detection">
              <h2>
                <span className="scanning-icon">🔍</span>
                {sessionActive ? 'Position your face in the camera' : 'Start session to begin recognition'}
              </h2>
              <p className="scanning-instruction">
                {sessionActive 
                  ? 'Make sure your face is clearly visible and well-lit'
                  : 'Select subject and section, then click "Start Session"'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Attendance Summary */}
      {selectedSubject && selectedSection && (
        <div className="attendance-summary">
          <h3>📊 Today's Attendance - {selectedSubject} ({selectedSection})</h3>
          
          <div className="summary-stats">
            <div className="stat-card present">
              <span className="stat-number">{todaysAttendance.filter(r => r.status === 'Present').length}</span>
              <span className="stat-label">Present</span>
            </div>
            <div className="stat-card late">
              <span className="stat-number">{todaysAttendance.filter(r => r.status === 'Late').length}</span>
              <span className="stat-label">Late</span>
            </div>
            <div className="stat-card total">
              <span className="stat-number">{todaysAttendance.length}</span>
              <span className="stat-label">Total Recorded</span>
            </div>
          </div>

          {todaysAttendance.length > 0 && (
            <div className="recent-records">
              <h4>Recent Records:</h4>
              <div className="records-list">
                {todaysAttendance.slice(-5).reverse().map((record, index) => (
                  <div key={record.id} className={`record-item ${record.status.toLowerCase()}`}>
                    <span className="record-name">{record.name}</span>
                    <span className="record-status">{record.status}</span>
                    <span className="record-time">{record.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FaceRecognition;
