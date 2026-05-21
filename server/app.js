const express = require('express'); // Framework to build the backend server
const cors = require('cors'); // Allows frontend (running on another port/domain) to talk to backend
const session = require('express-session'); // manages sessions (needed for Passport OAuth)
const passport = require('./config/passport'); // authentication system (Google login)

const roomRoutes = require('./routes/room.routes');
require('dotenv').config(); // Loads environment variables

const authRoutes = require('./routes/auth.routes'); // all the auth endpoints
const executionRoutes = require('./routes/execution.routes');
const aiRoutes = require('./routes/ai.routes');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Initializes the server, app is the main object used to define routes, middleware, etc.

// Helmet sets secure HTTP headers — prevents common attacks
app.use(helmet());

// General API rate limiter — 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for AI endpoint — 20 requests per hour per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'AI question limit reached. Try again in an hour.' },
});

// Strict limiter for execution — 30 runs per 15 minutes
const executionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    message: 'Execution limit reached. Please wait before running more code.',
  },
});

app.use(cors({
   origin: [
    'http://localhost:5173',
    'https://your-client.onrender.com',  // add this
  ],
  credentials: true,
}));

// The frontend will run on different port possibly 5173, backend port is different.
// Browsers block such cross-origin requests by default(security).
// Therefore this line allows requests only from our frontend.
// credentials: true → Allows cookies/auth headers (important for login systems)

app.use(express.json()); // Converts incoming JSON request body into JS object

app.use(session({
  // Stores session data on server
  secret: process.env.SESSION_SECRET, // secret → used to sign session ID (must be private)
  resave: false, // don’t save unchanged sessions
  saveUninitialized: false, // don’t create empty sessions
}));

app.use(passport.initialize()); // starts passport
app.use(passport.session()); // enables session-based login support

// Apply general rate limiter to all routes
app.use(generalLimiter);

app.get('/', (req, res) => {
  // Creates a simple GET endpoint
  res.json({ message: 'CollabX API is running.' }); // returns a JSON response
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Apply specific limiters
app.use('/api/execute', executionLimiter, executionRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

module.exports = app;

// This file is the entry setup for the express application.
// It configures middleware and defines routes, basically preparing the backend before adding actual APIs.

/*
This file:

Sets up Express
Allows frontend to connect (CORS)
Handles JSON requests
Adds session-based authentication
Secures app with Helmet
Adds API rate limiting
Exports the app
*/
