import './App.css';
import * as ml5 from "ml5";
import Webcam from "react-webcam";
import { useEffect, useRef, useState } from "react";

const dimensions = {
  width: 800,
  height: 500
};

function App() {
  const webcamRef = useRef();
  // const canvasRef = useRef();
  const [faceDetected, setFaceDetected] = useState(false); // Track face detection status
  const { width, height } = dimensions;

  // Dummy data for student names and IDs
  const dummyStudents = [
    { name: "John Doe", studentNo: "S001" },
    { name: "Jane Smith", studentNo: "S002" },
    { name: "Alex Johnson", studentNo: "S003" }
  ];

  useEffect(() => {
    let detectionInterval;

    const modelLoaded = () => {
      webcamRef.current.video.width = width;
      webcamRef.current.video.height = height;
      // Initialize canvas size
      // canvasRef.current.width = width;
      // canvasRef.current.height = height;
      detectionInterval = setInterval(() => {
        detect();
      }, 200);
    };

    const objectDetector = ml5.objectDetector('cocossd', modelLoaded);

    const detect = () => {
      if (webcamRef.current.video.readyState !== 4) {
        console.warn('Video not ready yet');
        return;
      }

      objectDetector.detect(webcamRef.current.video, (err, results) => {
        // const ctx = canvasRef.current.getContext('2d');
        // ctx.clearRect(0, 0, width, height); // Clear previous detections

        if (results && results.length) {
          results.forEach((detection) => {
            // If the object is a face (the label can vary based on the detector model)
            if (detection.label === 'person') {
              setFaceDetected(true);
              // capture image
              // upload to api
              // wait for the response
              // identify timing when the next person should be detected.
            } else {
              setFaceDetected(false);
            }

            // Draw bounding box
            // ctx.beginPath();
            // ctx.fillStyle = "#FF0000";
            // const { label, x, y, width, height } = detection;
            // ctx.fillText(label, x, y - 5);
            // ctx.rect(x, y, width, height);
            // ctx.stroke();
          });
        } else {
          setFaceDetected(false); // No detection, reset faceDetected
        }
      });
    };

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };

  }, [width, height]);

  return (
    <div className="container">
      <h1>Facial Recognition Attendance</h1>
      <h2>Place your face in front of the camera to get recognized</h2>

      {/* Webcam Video Feed */}
      <div className="webcam-container">
        <Webcam
          ref={webcamRef}
          className="webcam"
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "user",
          }}
        />
        {/* <canvas ref={canvasRef} className="canvas-overlay"></canvas> */}
      </div>

      {/* Prediction Result */}
      <div id="prediction" className={`prediction ${faceDetected ? 'detected' : 'not-detected'}`}>
        <h2>{faceDetected ? 'Face Detected' : 'No Face Detected'}</h2>
      </div>

      {/* Dummy Attendance Log */}
      <div id="attendanceListContainer">
        <h2>Attendance Log</h2>
        <ul id="attendanceList">
          {dummyStudents.map((entry, index) => (
            <li key={index} className="attendance-item">
              <span className="student-name">{entry.name}</span>
              <span className="student-no">Student No: {entry.studentNo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
