const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Delete a message by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inbox for a user (by userId and role)
router.get('/inbox/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query; // 'admin', 'teacher', 'parent'
  const mongoose = require('mongoose');
  try {
    // Convert userId to ObjectId for correct matching
    const objectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const messages = await Message.find({
      $and: [
        { 'recipient.id': { $eq: objectId } },
        { 'recipient.role': role }
      ]
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const upload = require('../middleware/upload');
// Send a message (admin/teacher/parent) with file upload support for excuse letters
router.post('/send', upload.single('file'), async (req, res) => {
  try {
    let sender, recipient, type, subject, content, excuseDate;
    if (req.is('multipart/form-data')) {
      // Parse fields from multipart form
      sender = { id: req.body.senderId, role: req.body.senderRole };
      recipient = { id: req.body.recipientId, role: req.body.recipientRole };
      type = req.body.type || 'excuse_letter';
      subject = req.body.subject;
      content = req.body.reason;
      excuseDate = req.body.excuseDate;
    } else {
      // JSON body
      ({ sender, recipient, type, subject, content, excuseDate } = req.body);
    }
    // Debug log for recipient and sender
    console.log('[BACKEND] /send called. Sender:', sender, 'Recipient:', recipient);
    console.log('[BACKEND] senderId:', req.body.senderId, 'recipientId:', req.body.recipientId);
    // Validate senderId and recipientId
    if (!sender.id || !recipient.id) {
      return res.status(400).json({ error: 'Missing senderId or recipientId' });
    }
    const isValidObjectId = (id) => typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
    if (!isValidObjectId(sender.id)) {
      return res.status(400).json({ error: 'Invalid senderId: ' + sender.id });
    }
    if (!isValidObjectId(recipient.id)) {
      return res.status(400).json({ error: 'Invalid recipientId: ' + recipient.id });
    }
    let fileUrl = undefined;
    if (req.file) {
      // Save file URL relative to /uploads
      fileUrl = '/uploads/' + req.file.filename;
    }
    // Merge: Always set title and message for frontend notification compatibility
    const message = new Message({
      sender,
      recipient,
      type: type || 'message',
      title: subject,      // <-- Add this line for notification title
      message: content,    // <-- Add this line for notification message/body
      subject,             // (optional, keep for reference)
      content,             // (optional, keep for reference)
      excuseDate: type === 'excuse_letter' ? excuseDate : undefined,
      status: type === 'excuse_letter' ? 'pending' : 'unread',
      fileUrl
    });
    await message.save();
    // Debug log for saved message
    console.log('[BACKEND] Message saved:', message);
    res.status(201).json(message);
  } catch (err) {
    console.error('[BACKEND] Error in /send:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update message status (e.g., mark as read, approve/reject excuse letter)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, response } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status, response, updatedAt: Date.now() },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // If this is an excuse letter and status is approved/rejected, notify the parent
    if (message.type === 'excuse_letter' && ['approved', 'rejected'].includes(status)) {
      // Fetch the teacher's name (approver)
      let approverName = '';
      if (message.recipient && message.recipient.id) {
        const teacher = await User.findById(message.recipient.id);
        if (teacher && teacher.fullName) {
          approverName = teacher.fullName;
        }
      }
      // Create a notification message for the parent
      await Message.create({
        sender: message.recipient, // teacher
        recipient: message.sender, // parent
        type: 'message',
        title: `Excuse Letter ${status.charAt(0).toUpperCase() + status.slice(1)}`, // Add title
        message: `Your excuse letter for ${message.excuseDate ? new Date(message.excuseDate).toLocaleDateString() : 'an absence'} was ${status}. ${response ? 'Response: ' + response : ''}`, // Add message
        subject: `Excuse Letter ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        content: `Your excuse letter for ${message.excuseDate ? new Date(message.excuseDate).toLocaleDateString() : 'an absence'} was ${status}. ${response ? 'Response: ' + response : ''}`,
        status: 'unread',
        approverName: approverName || ''
      });
    }
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get sent messages for a user
router.get('/sent/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;
  try {
    const messages = await Message.find({
      'sender.id': userId,
      'sender.role': role
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;