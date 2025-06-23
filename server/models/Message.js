// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//   senderId: { type: Number, required: true },
//   receiverId: { type: Number, required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
//   read: { type: Boolean, default: false },
// });

// module.exports = mongoose.model('Message', messageSchema);



const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: Number, required: true },
  receiverId: { type: Number, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema);