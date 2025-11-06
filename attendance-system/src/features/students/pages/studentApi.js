import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch all students from backend
export const fetchStudents = async () => {
  const res = await axios.get(`${API_URL}/api/students`);
  return res.data;
};

// Add a new student
export const addStudent = async (student) => {
  const res = await axios.post(`${API_URL}/api/students/add`, student);
  return res.data;
};

// Update a student
export const updateStudent = async (student) => {
  const res = await axios.put(`${API_URL}/api/students/update/${student._id}`, student);
  return res.data;
};

// Delete a student
export const deleteStudent = async (id) => {
  const res = await axios.delete(`${API_URL}/api/students/delete/${id}`);
  return res.data;
};