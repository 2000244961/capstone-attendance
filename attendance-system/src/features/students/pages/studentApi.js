import axios from 'axios';

// Fetch all students from backend
export const fetchStudents = async () => {
  const res = await axios.get('http://localhost:7000/api/students');
  return res.data;
};

// Add a new student
export const addStudent = async (student) => {
  const res = await axios.post('http://localhost:7000/api/students/add', student);
  return res.data;
};

// Update a student
export const updateStudent = async (student) => {
  const res = await axios.put(`http://localhost:7000/api/students/update/${student._id}`, student);
  return res.data;
};

// Delete a student
export const deleteStudent = async (id) => {
  const res = await axios.delete(`http://localhost:7000/api/students/delete/${id}`);
  return res.data;
};