import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { errorResponseHandler } from './middleware/errorHandler.js';
import routes from './routes/RootRoute.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import database connection
import connectDB from './config/db.js';
import { seedQuestions } from './config/seedQuestions.js';

const app = express();
const server = createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.BASE_URL, "https://backend.tfadhloon.com", "https://tfadhloon.com"] 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', '*'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.BASE_URL, "https://backend.tfadhloon.com", "https://tfadhloon.com"]
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', '*'],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Serve static files for testing
app.use(express.static('.'));

// Connect to database
if (process.env.NODE_ENV === 'production') {
  // In production (serverless), connect per request
  app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 0) {
      try {
        await connectDB();
      } catch (error) {
        console.error('Database connection failed:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database connection failed' 
        });
      }
    }
    next();
  });
} else {
  // In development, connect once
  await connectDB();
  // Seed questions if database is empty
  await seedQuestions();
}

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to TFADHLOON Game API',
    description: 'Real-time multiplayer prediction game backend'
  });
});

// Routes
app.use("/api", routes);

// Socket.io real-time game handling with score animations
import { setupGameSocket } from './sockets/gameSocket.js';
setupGameSocket(io);

// Error handling middleware
app.use(errorResponseHandler);

// Socket.io connection status endpoint
app.get('/api/socket-status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Socket.io server is running',
    data: {
      socketConnected: io.engine.clientsCount || 0,
      transport: 'websocket,polling',
      cors: process.env.NODE_ENV === 'production' 
        ? 'production-cors-enabled'
        : 'development-cors-enabled',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server - Fixed for production
const PORT = process.env.PORT || 3005;

if (process.env.NODE_ENV === 'production') {
  // In production, always start the server
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Production Server Running!`);
    console.log(`🌐 Server Address: https://backend.tfadhloon.com`);
    console.log(`🔌 Socket.io ready for connections`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50) + '\n');
  });
} else {
  // Development mode
  server.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Development Server Running!`);
    console.log(`🌐 Server Address: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready for connections`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50) + '\n');
  });
}

export default app;
