const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Student model (define if not exists)
const Student = mongoose.model('Student', new mongoose.Schema({
  fullName: String,
  studentId: String,
  section: String,
  subject: String,
  photo: String,
  status: String,
  descriptor: [Number] // Face descriptor for recognition
}));

// GET /api/student/list
router.get('/list', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/student
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});
// POST /api/student/add
router.post('/add', async (req, res) => {
  router.get('/', async (req, res) => {
    try {
      const students = await Student.find();
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });
  try {
    const student = new Student(req.body);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// DELETE /api/student/delete/:id
router.delete('/delete/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
