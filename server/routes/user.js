const express = require('express');
const router = express.Router();

// List users endpoint (move above /:id)
router.get('/list', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const users = await User.find(query);
    console.log('User list response:', users);
    // Always include linkedStudent for parent users
    const usersWithLinked = users.map(u => {
      if (u.type === 'parent') {
        console.log(`[USER LIST] Parent ${u.username} linkedStudent:`, u.linkedStudent);
        return { ...u.toObject(), linkedStudent: u.linkedStudent };
      }
      return u;
    });
    res.json({ users: usersWithLinked });
  } catch (err) {
    console.error('User list error:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});
// (Removed misplaced destructuring line)

// Get user profile by id or username
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    // Try to find by MongoDB _id only if id looks like an ObjectId
    if (/^[a-fA-F0-9]{24}$/.test(id)) {
      user = await User.findById(id);
    }
    // If not found or not ObjectId, try username
    if (!user) {
      user = await User.findOne({ username: id });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in GET /api/user/:id:', err);
    res.status(500).json({ message: 'Failed to fetch user profile.', error: err.message });
  }
});
// (Removed misplaced spread logic)
const User = require('../models/User');

// Auto-approve all parent users on server startup
User.updateMany({ type: 'parent', approved: false }, { $set: { approved: true } })
  .then(result => console.log('Auto-approved all parent users on startup:', result.modifiedCount))
  .catch(err => console.error('Failed to auto-approve parents on startup:', err));

// Approve all parent users endpoint
router.post('/approve-all-parents', async (req, res) => {
  try {
    const result = await User.updateMany({ type: 'parent' }, { $set: { approved: true } });
    res.json({ message: 'All parent users approved.', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve all parents.', error: err.message });
  }
});

// Force-create admin user endpoint (for recovery)
router.post('/force-create-admin', async (req, res) => {
  try {
    const username = req.body.username || 'admin';
    const password = req.body.password || 'admin123';
    const email = req.body.email || 'admin@spcc.edu.ph';
    // Check if admin already exists
    let user = await User.findOne({ username, type: 'admin' });
    if (user) {
      return res.status(409).json({ message: 'Admin user already exists.' });
    }
    user = new User({
      username,
      password,
      email,
      type: 'admin',
      approved: true
    });
    await user.save();
    res.status(201).json({ message: 'Admin user created.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create admin user.', error: err.message });
  }
});
// Delete user endpoint
router.delete('/delete/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// List users endpoint
router.get('/list', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const users = await User.find(query);
    console.log('User list response:', users);
    res.json({ users });
  } catch (err) {
    console.error('User list error:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// Update user endpoint
router.post('/update', async (req, res) => {
  try {
  const { id, username, email, type, approved, assignedSections, subjects, linkedStudent } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
  const updateFields = {};
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (type) updateFields.type = type;
  if (typeof approved !== 'undefined') updateFields.approved = approved;
  if (Array.isArray(assignedSections)) updateFields.assignedSections = assignedSections;
  if (Array.isArray(subjects)) updateFields.subjects = subjects;
  if (Array.isArray(linkedStudent)) updateFields.linkedStudent = linkedStudent;
    const user = await User.findByIdAndUpdate(id, updateFields, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User updated successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// Approve user endpoint
router.post('/approve', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const user = await User.findByIdAndUpdate(id, { approved: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User approved successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve user.' });
  }
});

// Registration endpoint (admin, teacher, parent)
router.post('/register', async (req, res) => {
  try {
    console.log('Incoming registration payload:', req.body);
    if (req.body.type === 'parent') {
      console.log('[REGISTER] linkedStudent received:', req.body.linkedStudent);
    }
  const { username, password, email, type, assignedSections, subjects, linkedStudent } = req.body;
    if (!username || !password || !email || !type) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!['teacher', 'parent', 'admin'].includes(type)) {
      return res.status(400).json({ message: 'Invalid user type.' });
    }
    // Check for duplicate username/email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    // Normalize type value for robust admin detection
    const normalizedType = String(type).trim().toLowerCase();
  // Always set approved true for admin and teacher (case-insensitive)
  const approvedValue = (normalizedType === 'admin' || normalizedType === 'teacher' || normalizedType === 'parent') ? true : false;
    const user = new User({
      username,
      password, // In production, hash the password!
      email,
      type: normalizedType,
      approved: approvedValue,
      ...(normalizedType === 'teacher' && Array.isArray(assignedSections) ? { assignedSections } : {}),
      ...(normalizedType === 'teacher' && Array.isArray(subjects) ? { subjects } : {}),
      ...(normalizedType === 'parent' && Array.isArray(linkedStudent) ? { linkedStudent } : {})
    });
    await user.save();
    console.log('User registered:', user);
    let registrationMsg = 'Registration successful.';
    if (approvedValue) {
      registrationMsg += ' You can log in immediately.';
    } else {
      registrationMsg += ' Awaiting admin approval.';
    }
    res.status(201).json({
      message: registrationMsg
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    const user = await User.findOne({ username, password });
    if (!user) {
      console.log('Login failed: user not found or password mismatch');
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    if (user && typeof user.type === 'string') {
      user.type = user.type.trim().toLowerCase();
    }
    console.log('Login found user:', user);
    // Always allow parent accounts to log in and persist approval
    if (user.type === 'parent' && !user.approved) {
      user.approved = true;
      await user.save();
      console.log('Login fixed: parent auto-approved and saved');
    }
    // Never block admin login by approval status
    if (user.type === 'admin') {
      user.approved = true;
    }
    // Force teacher accounts to always be approved
    if (user.type === 'teacher' && !user.approved) {
      user.approved = true;
      await user.save();
    }
    // Exclude password from response
    // Avoid variable redeclaration by using different names
    const { _id, username: userUsername, email, type: userType, approved, assignedSections, subjects, linkedStudent } = user;
    res.json({
      message: 'Login successful.',
      _id,
      username: userUsername,
      email,
      type: userType,
      role: userType, // Add role for frontend compatibility
      approved,
      assignedSections,
      subjects,
      ...(userType === 'parent' ? { linkedStudent } : {})
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.' });
  }
});

module.exports = router;