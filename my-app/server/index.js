const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { Anthropic } = require('@anthropic-ai/sdk');
const { promisify } = require('util');
const retry = require('retry');
const path = require('path');
const compression = require('compression');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Production optimizations
app.use(compression()); // Add compression
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Security middleware with production config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com"]
    }
  }
}));

// CORS configuration for production
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined')); // Logging

// Serve static React files in production
app.use(express.static(path.join(__dirname, '../client/build')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.RATE_LIMIT || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/chat', limiter);

// Rest of your existing code remains the same until the end...

// Add React routing handler for production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Create server instance for proper shutdown
const server = app.listen(port, () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
});

// Enhanced graceful shutdown
const shutdown = async () => {
    console.log('Shutdown initiated...');
    
    // Set a timeout for forceful shutdown
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    try {
        await server.close();
        console.log('Server closed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
/* 
curl -X POST http://localhost:3000/chat \
-H "Content-Type: application/json" \
-d '{
    "message": "What are three interesting facts about quantum computing?",
    "temperature": 0.7,
    "maxTokens": 1000,
    "systemPrompt": "You are a helpful AI assistant focused on providing clear and concise responses."
}'

*/