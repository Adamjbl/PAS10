import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/database';
import testRoutes from './routes/test.routes';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import { setupSocketIO } from './socket';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : /^http:\/\/localhost:\d+$/;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Board Game Arena Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Setup Socket.io handlers
setupSocketIO(io);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`🎮 WebSocket server is ready`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    await disconnectDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing servers');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    await disconnectDatabase();
    process.exit(0);
  });
});

export { app, io };
