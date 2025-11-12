const express = require('express');
const Attendance = require('../models/Attendance');
const { sendMail } = require('../utils/mailer');
const { findParentEmailByStudentId } = require('../utils/findParentEmail');
const router = express.Router();

// Get attendance summary grouped by section for a given date (or today if not specified)
router.get('/sections', async (req, res) => {
  try {
    const { date, month } = req.query;
    let query = {};
    if (date) {
      // Single day
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    } else if (month) {
      // Month format: YYYY-MM
      const start = new Date(month + '-01');
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    } else {
      // Default: today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    const dbRecords = await Attendance.find(query);

    const sectionMap = {};
    dbRecords.forEach(r => {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    });
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    res.json({ present, absent, late, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all attendance records for a specific date (and section if provided)
router.get('/', async (req, res) => {
  try {
    const { date, section } = req.query;
    let query = {};
    if (date) {
      // Accept any time on the selected date
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    if (section) {
      query.section = section;
    }
    const records = await Attendance.find(query).sort({ timestamp: -1 });
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

    // Time-based attendance rule
    let scanTime = req.body.time;
    let scanDateObj;
    if (scanTime) {
      const timeParts = scanTime.split(':');
      if (timeParts.length >= 2) {
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
    // --- FIXED LOGIC: Mark present only if scan is between 6:00 and 16:00 inclusive ---
    const scanMinutes = hours * 60 + minutes;
    const isWithinWindow = scanMinutes >= 360 && scanMinutes <= 960; // 6:00 to 16:00
    let attendanceStatus = isWithinWindow ? 'present' : 'absent';

    // Set date to midnight for consistency
    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    // Create new attendance record with enforced status
    const newRecord = new Attendance({
      ...req.body,
      status: attendanceStatus,
      date: recordDate,
      timestamp: scanDateObj
    });
    await newRecord.save();

    // Emit real-time event if Socket.IO is available
    if (req.io) {
      req.io.emit('attendance:new', newRecord);
    }

    // Notify parent by email (if found)
    try {
      const parentEmail = await findParentEmailByStudentId(studentId);
      let scanTime = req.body.time;
      let formattedTime = '';
      if (scanTime) {
        if (/\d{1,2}:\d{2} (AM|PM)/.test(scanTime)) {
          formattedTime = scanTime;
        } else {
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
        let attachments = undefined;
        let htmlContent = `<p>Dear Parent,</p><p>Your child <b>${name}</b> has been marked <b>${attendanceStatus}</b> for section <b>${section}</b> and subject <b>${subject}</b> on <b>${date}</b> at <b>${formattedTime}</b>.</p>`;
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
          text: `Dear Parent,\n\nYour child ${name} has been marked ${attendanceStatus} for section ${section} and subject ${subject} on ${date} at ${formattedTime}.\n\nThank you.`,
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

    // --- PARENT ATTENDANCE LOGIC ---
    // Mark parent as present if any linked student is present for this subject/section/date
    const User = require('../models/User');
    const mongoose = require('mongoose');
    // Find all parents linked to this student
    const parents = await User.find({ type: 'parent', linkedStudent: mongoose.Types.ObjectId.isValid(studentId) ? mongoose.Types.ObjectId(studentId) : undefined }).populate('linkedStudent');
    for (const parent of parents) {
      // Check if parent already has attendance for this date/section/subject
      const parentAttendance = await Attendance.findOne({ studentId: parent._id.toString(), date: recordDate, section, subject });
      if (!parentAttendance) {
        // Mark parent as present if any linked student is present for this subject/section/date
        await Attendance.create({
          studentId: parent._id.toString(),
          name: parent.fullName || parent.username,
          section,
          subject,
          status: attendanceStatus, // present/absent same as student
          date: recordDate,
          timestamp: scanDateObj,
          markedBy: 'system-parent'
        });
      } else {
        // Optionally, update status if needed (e.g., if any student is present, parent is present)
        if (attendanceStatus === 'present' && parentAttendance.status !== 'present') {
          parentAttendance.status = 'present';
          await parentAttendance.save();
        }
      }
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