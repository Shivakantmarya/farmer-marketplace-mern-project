
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/senders', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user.userId });
    if (!messages || messages.length === 0) return res.json([]);

    const senderIds = [...new Set(messages.map(msg => Number(msg.senderId)))];
    const senders = [];
    for (const senderId of senderIds) {
      const user = await User.findOne({ userId: senderId });
      if (user) senders.push({ userId: senderId, username: user.username });
    }
    res.json(senders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = Number(req.user.userId);
  const parsedReceiverId = Number(receiverId);

  if (!receiverId || !content || isNaN(parsedReceiverId) || isNaN(senderId)) {
    return res.status(400).json({ message: 'Valid numeric sender/receiver IDs and content required' });
  }

  const message = new Message({
    senderId,
    receiverId: parsedReceiverId,
    content,
    read: false,
  });
  try {
    const savedMessage = await message.save();
    req.app.get('io').emit('sendMessage', savedMessage);
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:otherUserId', authMiddleware, async (req, res) => {
  const { otherUserId } = req.params;
  const parsedOtherUserId = Number(otherUserId);

  if (isNaN(parsedOtherUserId)) {
    return res.status(400).json({ message: 'Invalid otherUserId' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: parsedOtherUserId },
        { senderId: parsedOtherUserId, receiverId: req.user.userId },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.user.userId,
      read: false,
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/read/:senderId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const senderId = Number(req.params.senderId);

    if (isNaN(senderId)) {
      return res.status(400).json({ message: 'Invalid senderId' });
    }

    const result = await Message.updateMany(
      { senderId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    req.app.get('io').emit('messagesRead', { userId });
    res.json({ message: 'Messages marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
