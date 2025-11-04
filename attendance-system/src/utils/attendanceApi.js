import axios from 'axios';

// Make sure this matches your backend API endpoint and port!
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7000/api/attendance';

export const fetchAttendance = async () => {
  // If your backend uses /api/attendance/list, change to `${API_URL}/list`
  const res = await axios.get(API_URL);
  return res.data;
};

export const addAttendance = async (data) => {
  try {
    const res = await axios.post(API_URL, data);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 409) {
      // Rethrow for FaceRecognition.js to handle
      throw err;
    }
    throw new Error('Failed to add attendance');
  }
};

export const updateAttendance = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const deleteAttendance = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};