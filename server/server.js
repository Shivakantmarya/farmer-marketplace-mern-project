
// const express = require('express');
// const mongoose = require('mongoose');
// const http = require('http');
// const socketIo = require('socket.io');
// const productRoutes = require('./routes/products');
// const authRoutes = require('./routes/auth');
// const messageRoutes = require('./routes/messages');
// const path = require('path');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true,
//   },
// });

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true,
// }));

// mongoose.connect(process.env.MONGODB_URI, { 
//   useNewUrlParser: true, 
//   useUnifiedTopology: true 
// })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// app.use(express.json());

// //  Serve static files for images
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // API Routes
// app.use('/api/products', productRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/messages', messageRoutes);

// const Product = require('./models/Product');

// app.set('emitProductUpdate', async () => {
//   try {
//     const products = await Product.find().exec();
//     io.emit('productsUpdated', products);
//   } catch (err) {
//     console.error('Error emitting product update:', err);
//   }
// });

// app.set('io', io);

// io.on('connection', (socket) => {
//   console.log('Socket connected:', socket.id);

//   socket.on('productAdded', () => {
//     app.get('emitProductUpdate')();
//   });

//   socket.on('sendMessage', (message) => {
//     io.emit('sendMessage', message);
//   });

//   socket.on('messagesRead', ({ userId }) => {
//     io.emit('messagesRead', { userId });
//   });

//   socket.on('disconnect', () => {
//     console.log('Socket disconnected:', socket.id);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow both Netlify and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173'
];

//  Express CORS Setup
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

//  Socket.io CORS Setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

//  MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

//  Middleware
app.use(express.json());

//  Serve static files for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//  API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const Product = require('./models/Product');

//  Real-time product update emitter
app.set('emitProductUpdate', async () => {
  try {
    const products = await Product.find().exec();
    io.emit('productsUpdated', products);
  } catch (err) {
    console.error('Error emitting product update:', err);
  }
});

app.set('io', io);

//  Socket.io Event Listeners
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('productAdded', () => {
    app.get('emitProductUpdate')();
  });

  socket.on('sendMessage', (message) => {
    io.emit('sendMessage', message);
  });

  socket.on('messagesRead', ({ userId }) => {
    io.emit('messagesRead', { userId });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

//  Server Startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));







