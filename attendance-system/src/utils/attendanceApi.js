import axios from 'axios';

// Make sure this matches your backend API endpoint and port!
const API_URL = process.env.REACT_APP_API_URL || 'https://attendance-backend-4-gl1f.onrender.com/api/attendance';

// Fetch attendance records with optional date and section filters
export const fetchAttendance = async ({ date, section } = {}) => {
  let url = API_URL;
  const params = [];
  if (date) params.push(`date=${encodeURIComponent(date)}`);
  if (section) params.push(`section=${encodeURIComponent(section)}`);
  if (params.length > 0) url += `?${params.join('&')}`;
  const res = await axios.get(url);
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