
import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  // Use PUBLIC_URL for compatibility with subdirectory deployments
  const base = process.env.PUBLIC_URL || '';
  const MODEL_URL = base + '/models';
  try {
    console.log('[face-api] Loading models from:', MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    console.log('[face-api] ssdMobilenetv1 loaded');
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log('[face-api] faceRecognitionNet loaded');
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log('[face-api] faceLandmark68Net loaded');
    modelsLoaded = true;
    console.log('[face-api] All models loaded successfully.');
    return;
  } catch (err) {
    modelsLoaded = false;
    console.error('[face-api] Error loading models:', err);
    throw err;
  }
}

export function areModelsLoaded() {
  return modelsLoaded;
}
