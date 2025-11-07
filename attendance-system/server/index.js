// Basic Express server with MongoDB connection using mongoose
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['https://attendance-backend-4-gl1f.onrender.com/','http://localhost','*'],
    methods: ['GET', 'POST']
  }
});
app.set('io', io); // Make io accessible in routes
const PORT = process.env.PORT || 7000;


app.use(cors());
app.use(express.json());
// Serve uploads folder as static files, but force download for all files
const path = require('path');

// Serve uploads folder as static files for direct access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Force download for /uploads/:filename (optional, for explicit download)
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  // Ensure default admin user exists
  const User = require('./models/User');
  // Always upsert admin user on startup
  User.findOneAndUpdate(
    { username: 'admin' },
    {
      username: 'admin',
      password: 'admin123',
      email: 'admin@admin.com',
      type: 'admin',
      approved: true
    },
    { upsert: true, new: true }
  ).then(() => {
    console.log('Default admin user ensured.');
    // Auto-approve all teachers on startup
    User.updateMany({ type: 'teacher' }, { $set: { approved: true } })
      .then(result => {
        console.log('All teachers auto-approved:', result.modifiedCount);
      })
      .catch(err => {
        console.error('Error auto-approving teachers:', err);
      });
  }).catch(err => {
    console.error('Error upserting default admin user:', err);
  });
});

// Example route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Enable attendance and user routes for testing
// Pass io to attendance routes for emitting events
app.use('/api/attendance', (req, res, next) => {
  req.io = io;
  next();
}, require('./routes/attendance'));
// Mount debug attendance route
app.use('/api/attendance', require('./routes/attendanceDebug'));
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);
// Mount /api/announcement route
if (userRoutes.announcementRouter) {
  app.use('/api/announcement', userRoutes.announcementRouter);
}
app.use('/api/students', require('./routes/student'));
app.use('/api/subjectSection', require('./routes/subjectSection'));
app.use('/api/message', require('./routes/message'));

//notification routes
const notificationRoutes = require('./routes/notification');
app.use('/api/notifications', notificationRoutes);

const announcementRoutes = require('./routes/announcement');
app.use('/api/announcements', announcementRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
