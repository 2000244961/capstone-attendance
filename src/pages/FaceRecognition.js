
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
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
	const webcamRef = useRef(null);
	const [loading, setLoading] = useState(true);
	const [descriptors, setDescriptors] = useState([]);
	const [faceVisible, setFaceVisible] = useState(null);
	const [cameraInterval, setCameraInterval] = useState(null);

	const checkFaceRealtime = async () => {
		if (!areModelsLoaded()) {
			setFaceVisible(null);
			return;
		}
		if (webcamRef.current) {
			const imageSrc = webcamRef.current.getScreenshot();
			if (!imageSrc) {
				setFaceVisible(null);
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
			setFaceVisible(!!detection);
		}
	};

	useEffect(() => {
		let interval = null;
		if (areModelsLoaded()) {
			interval = setInterval(checkFaceRealtime, 700);
			setCameraInterval(interval);
		} else {
			if (cameraInterval) clearInterval(cameraInterval);
			setCameraInterval(null);
		}
		return () => {
			if (interval) clearInterval(interval);
			if (cameraInterval) clearInterval(cameraInterval);
		};
	}, [loading]);


		useEffect(() => {
			const setupTFAndLoadModels = async () => {
				await tf.setBackend('webgl'); // or 'cpu' if needed
				await tf.ready();
				await loadFaceApiModels();
				setLoading(false);
			};
			setupTFAndLoadModels();
		}, []);

	const capture = async () => {
			if (!faceVisible) {
				alert('No face detected. Please ensure your face is clearly visible and try again.');
				return;
			}
			const imageSrc = webcamRef.current.getScreenshot();
			const img = await faceapi.fetchImage(imageSrc);
			// Use same logic as ManageStudent: detectSingleFace and extract descriptor
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
			if (!detection) {
				const allDetections = await faceapi
					.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
					.withFaceLandmarks()
					.withFaceDescriptors();
				if (allDetections.length > 0) {
					detection = allDetections[0];
				}
			}
			if (!detection) {
				alert('No face detected. Please try again.');
				setDescriptors([]);
				return;
			}
			const descriptor = Array.from(detection.descriptor);
			setDescriptors(descriptor);
			debugFaceRecognition(descriptor);
			// TODO: Add matching logic to compare descriptor with students from backend
	};

	if (loading) {
		return <div>Loading models...</div>;
	}

	 return (
		 <div>
			 <Webcam
				 audio={false}
				 ref={webcamRef}
				 screenshotFormat="image/jpeg"
				 width={dimensions.width}
				 height={dimensions.height}
				 mirrored={true}
			 />
			 <div style={{marginTop: '10px', fontWeight: 'bold'}}>
				 {faceVisible === true && <span style={{color: 'green'}}>Face detected</span>}
				 {faceVisible === false && <span style={{color: 'red'}}>No face detected</span>}
				 {faceVisible === null && <span style={{color: 'gray'}}>Checking...</span>}
			 </div>
				 <button 
					 onClick={faceVisible ? capture : undefined}
					 style={{
						 backgroundColor: faceVisible ? '#007bff' : '#aaa',
						 color: 'white',
						 padding: '8px 16px',
						 border: 'none',
						 borderRadius: '4px',
						 cursor: faceVisible ? 'pointer' : 'not-allowed',
						 marginTop: '10px',
						 opacity: faceVisible ? 1 : 0.7
					 }}
					 disabled={!faceVisible}
					 title={faceVisible ? '' : 'No face detected'}
				 >
					 Capture
				 </button>
			 {/* Additional UI and logic for face recognition */}
		 </div>
	 );
}

export default FaceRecognition;
