const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new announcement
router.post('/', async (req, res) => {
  try {
    const { title, content, audience, postedBy, fileUrl } = req.body;
    const announcement = new Announcement({
      title,
      content,
      audience,
      postedBy,
      fileUrl,
      createdAt: new Date()
    });
    await announcement.save();

    // Notification logic
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    let userQuery = {};
    if (audience === 'teachers') userQuery = { type: 'teacher' };
    else if (audience === 'parents') userQuery = { type: 'parent' };
    else if (audience === 'both' || audience === 'all') userQuery = { type: { $in: ['teacher', 'parent'] } };
    const users = await User.find(userQuery);
    const notifications = users.map(u => ({
      userId: u._id.toString(),
      type: 'announcement',
      message: `New announcement: ${title}`,
      announcementId: announcement._id.toString(),
      read: false
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(announcement);
  } catch (err) {
    console.error('Announcement POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an announcement by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;