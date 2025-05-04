import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import * as ml5 from 'ml5'; 

function App() {
  const webcamRef = useRef(null);  // Reference for webcam video element
  const [faceDetected, setFaceDetected] = useState(false);  // Track if a face is detected

  useEffect(() => {
    // Initialize webcam stream
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    // Initialize ml5 faceApi model
    const faceApi = ml5.faceApi(webcamRef.current, { 
      withLandmarks: true, 
      withDescriptors: true 
    }, () => {
      console.log("FaceAPI model loaded");
    });
    //changes
    // Detect faces every 100ms
    const detectFace = () => {
      faceApi.detect((err, results) => {
        if (err) {
          console.error(err);
        } else {
          if (results && results.length > 0) {
            setFaceDetected(true);  // If faces are detected
          } else {
            setFaceDetected(false);  // No faces detected
          }
        }
      });
    };

    // Start webcam
    startWebcam();

    // Run face detection periodically
    const interval = setInterval(detectFace, 100);

    return () => {
      clearInterval(interval);  // Cleanup the interval when the component is unmounted
    };
  }, []);

  return (
    <div className="App">
      <div className="container">
        <h1 className="header">Facial Recognition Attendance</h1>
        <h2 className="subheader">Place your face in front of the camera to get recognized</h2>

        {/* Webcam video element */}
        <div className="webcam-container">
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            className="webcam"
          ></video>
        </div>

        {/* Face detection status */}
        <div id="prediction" className={`prediction ${faceDetected ? 'detected' : 'not-detected'}`}>
          <h2>{faceDetected ? 'Face Detected' : 'No Face Detected'}</h2>
        </div>

        {/* Optional attendance log */}
        <div id="attendanceListContainer">
          <h2>Attendance Log</h2>
          <ul id="attendanceList">
            {/* This is where the attendance list would go, you can use this list to store names or timestamps */}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;