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
      ? [process.env.BASE_URL] 
      : '*',
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.BASE_URL]
      : '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
   
  })
);

app.use(express.json());

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

// Socket.io real-time game handling
import { setupGameSocket } from './sockets/gameSocket.js';
setupGameSocket(io);

// Error handling middleware
app.use(errorResponseHandler);

// Start server - only if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3005;
  server.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Server is running successfully!`);
    console.log(`🌐 Server Address: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready for real-time connections`);
    console.log('='.repeat(50) + '\n');
  });
}

export default app;
