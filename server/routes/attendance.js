const express = require('express');
const Attendance = require('../models/Attendance');
const { sendMail } = require('../utils/mailer');
const { findParentEmailByStudentId } = require('../utils/findParentEmail');
const router = express.Router();

// Get attendance summary grouped by section for a given date (or today if not specified)
router.get('/sections', async (req, res) => {
  try {
    let date = req.query.date;
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }
    // Get DB records
    const dbRecords = await Attendance.find({ date });
    // Get localStorage records if available (for demo/testing)
    let localRecords = [];
    if (global.localAttendanceRecords && Array.isArray(global.localAttendanceRecords)) {
      localRecords = global.localAttendanceRecords.filter(r => r.date === date);
    }
    // Merge DB and local records
    const allRecords = [...dbRecords, ...localRecords];
    // Group by section
    const sectionMap = {};
    allRecords.forEach(r => {
      const section = r.section || 'Unassigned';
      if (!sectionMap[section]) {
        sectionMap[section] = { section, present: 0, absent: 0 };
      }
      if (r.status === 'present') sectionMap[section].present++;
      if (r.status === 'absent') sectionMap[section].absent++;
    });
    const result = Object.values(sectionMap);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  });
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
  const { studentId, date, name, section, subject, status } = req.body;
  // Check for existing record for this student, subject, and date
  const existing = await Attendance.findOne({ studentId, subject, date });
  if (existing) {
    return res.status(409).json({ error: 'Attendance already recorded for this student for this subject today.' });
  }

  // Time-based attendance rule
  let scanTime = req.body.time;
  let scanDateObj;
  if (scanTime) {
    // Try to parse as local time (HH:mm or HH:mm:ss)
    const timeParts = scanTime.split(':');
    if (timeParts.length >= 2) {
      // Build a local date string
      const now = new Date();
      scanDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(timeParts[0]), parseInt(timeParts[1]), timeParts[2] ? parseInt(timeParts[2]) : 0);
    } else {
      scanDateObj = new Date();
    }
  } else {
    scanDateObj = new Date();
  }
  // Get hours and minutes
  const hours = scanDateObj.getHours();
  const minutes = scanDateObj.getMinutes();
  let attendanceStatus = status;
  if (attendanceStatus === 'present') {
    // Only allow present between 6:00 AM and 4:00 PM (16:00)
    const isAfterStart = (hours > 6 || (hours === 6 && minutes >= 0));
    const isBeforeEnd = (hours < 16 || (hours === 16 && minutes === 0));
    if (isAfterStart && isBeforeEnd) {
      attendanceStatus = 'present';
    } else {
      attendanceStatus = 'absent';
    }
  }
  // Create new attendance record with enforced status
  const newRecord = new Attendance({ ...req.body, status: attendanceStatus });
  await newRecord.save();
    // Emit real-time event if Socket.IO is available
    if (req.io) {
      req.io.emit('attendance:new', newRecord);
    }
    // Notify parent by email (if found)
    try {
      const parentEmail = await findParentEmailByStudentId(studentId);
      // Use provided time or current time if not present
      let scanTime = req.body.time;
      let formattedTime = '';
      console.log('Scan time received from frontend:', scanTime);
      if (scanTime) {
        // If scanTime is already in HH:mm AM/PM format, use as is
        if (/\d{1,2}:\d{2} (AM|PM)/.test(scanTime)) {
          formattedTime = scanTime;
        } else {
          // Try to parse as time string
          const dateObj = new Date(`${date}T${scanTime}`);
          if (!isNaN(dateObj.getTime())) {
            formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          } else {
            formattedTime = scanTime;
          }
        }
      } else {
        formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      if (parentEmail) {
        // If image is present, attach as inline image
        let attachments = undefined;
        let htmlContent = `<p>Dear Parent,</p><p>Your child <b>${name}</b> has been marked <b>present</b> for section <b>${section}</b> and subject <b>${subject}</b> on <b>${date}</b> at <b>${formattedTime}</b>.</p>`;
        if (req.body.image) {
          attachments = [{
            filename: 'student.jpg',
            content: req.body.image.split(',')[1],
            encoding: 'base64',
            cid: 'studentphoto@attendance'
          }];
          htmlContent += `<p><img src="cid:studentphoto@attendance" alt="Student Photo" style="max-width:200px;max-height:200px;border-radius:8px;" /></p>`;
        }
        htmlContent += '<p>Thank you.</p>';
        await sendMail({
          to: parentEmail,
          subject: `Attendance Notification for ${name}`,
          text: `Dear Parent,\n\nYour child ${name} has been marked present for section ${section} and subject ${subject} on ${date} at ${formattedTime}.\n\nThank you.`,
          html: htmlContent,
          attachments
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
