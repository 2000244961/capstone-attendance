const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'teacher', 'parent'], required: true }
  },
  recipient: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'teacher', 'parent'], required: true }
  },
  type: {
    type: String,
    enum: ['message', 'excuse_letter'],
    default: 'message',
    required: true
  },
  subject: { type: String },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ['unread', 'read', 'pending', 'approved', 'rejected'],
    default: 'unread'
  },
  excuseDate: { type: Date }, // Only for excuse letters
  response: { type: String }, // For teacher/admin response
  approverName: { type: String }, // For displaying who approved/rejected
  fileUrl: { type: String }, // For attached file (excuse letter)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
