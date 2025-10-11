const express = require('express');
const Attendance = require('../models/Attendance');
const { sendMail } = require('../utils/mailer');
const { findParentEmailByStudentId } = require('../utils/findParentEmail');
const router = express.Router();
// Get today's attendance summary
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let query = { date: today };
    // If ?all=true, do not filter by teacher/section/subject, just aggregate all records for today
    // (Default behavior is already all records for today)
    // This is for future extensibility if you want to filter by teacherId, etc.
    // For now, just aggregate all records for today
    const records = await Attendance.find(query);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    res.json({ present, absent, late, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new attendance record
router.post('/', async (req, res) => {
  try {
    console.log('Received attendance POST:', req.body);
    const { studentId, date, name, section, subject } = req.body;
    // Check for existing record for this student, subject, and date
    const existing = await Attendance.findOne({ studentId, subject, date });
    if (existing) {
      return res.status(409).json({ error: 'Attendance already recorded for this student for this subject today.' });
    }
    const newRecord = new Attendance(req.body);
    await newRecord.save();
    // Emit real-time event if Socket.IO is available
    if (req.io) {
      req.io.emit('attendance:new', newRecord);
    }
    // Notify parent by email (if found)
    try {
      const parentEmail = await findParentEmailByStudentId(studentId);
      if (parentEmail) {
        await sendMail({
          to: parentEmail,
          subject: `Attendance Notification for ${name}`,
          text: `Dear Parent,\n\nYour child ${name} has been marked present for section ${section} and subject ${subject} on ${date}.\n\nThank you.`,
          html: `<p>Dear Parent,</p><p>Your child <b>${name}</b> has been marked <b>present</b> for section <b>${section}</b> and subject <b>${subject}</b> on <b>${date}</b>.</p><p>Thank you.</p>`
        });
        console.log('Parent notified by email:', parentEmail);
      } else {
        console.log('No parent email found for student:', studentId);
      }
    } catch (emailErr) {
      console.error('Failed to send parent notification email:', emailErr);
    }
    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Attendance save error:', err);
    res.status(400).json({ error: err.message });
  }
});


// Update a student record
router.put('/:id', async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a student record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
    
    // Debug route: Get latest 10 attendance records
    router.get('/debug/latest', async (req, res) => {
      try {
        const records = await Attendance.find().sort({ date: -1, timestamp: -1 }).limit(10);
        res.json(records);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

// Delete attendance records by studentId
router.delete('/deleteByStudent/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const result = await Attendance.deleteMany({ studentId });
    if (result.deletedCount > 0) {
      // Emit real-time event for bulk delete
      if (req.io) {
        req.io.emit('attendance:bulkDelete', { studentId });
      }
      res.json({ message: `Deleted ${result.deletedCount} attendance records for student ${studentId}` });
    } else {
      res.status(404).json({ error: 'No attendance records found for this student' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
