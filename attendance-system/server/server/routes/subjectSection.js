// subjectSection.js
const express = require('express');
const router = express.Router();
const SubjectSection = require('../models/SubjectSection');

// Get all subject/sections
router.get('/list', async (req, res) => {
  try {
    const items = await SubjectSection.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject/sections.' });
  }
});

// Add new subject/section
router.post('/add', async (req, res) => {
  try {
    const { section, subject } = req.body;
    if (!section || !subject) {
      return res.status(400).json({ error: 'Both fields are required.' });
    }
    const newItem = new SubjectSection({ section, subject });
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add subject/section.' });
  }
});

// Update subject/section
router.put('/update/:id', async (req, res) => {
  try {
    const { section, subject } = req.body;
    const updated = await SubjectSection.findByIdAndUpdate(
      req.params.id,
      { section, subject },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subject/section.' });
  }
});

// Delete subject/section
router.delete('/delete/:id', async (req, res) => {
  try {
    await SubjectSection.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subject/section.' });
  }
});

module.exports = router;
