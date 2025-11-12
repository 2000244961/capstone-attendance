// Debug route for raw attendance records for today
const express = require('express');
const Attendance = require('../models/Attendance');
const router = express.Router();

router.get('/today/raw', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const records = await Attendance.find({ date: today });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
