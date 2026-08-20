require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const workspaceRoutes = require('./routes/workspace');
const adminRoutes = require('./routes/admin');
const partnershipRoutes = require('./routes/partnerships');
const threatRoutes = require('./routes/threats');
const insiderThreatRoutes = require('./routes/insiderThreats');
const activityRoutes = require('./routes/activity');
const supportRoutes = require('./routes/support');

const app = express();
const path = require('path');

const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150, // Limit each IP to 150 requests per `window` (here, per 1 minute)
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(globalLimiter);
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cognivault')
  .then(() => console.log('✅ Successfully connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes (Auth & Support now handled by Python FastAPI on port 8000)
app.use('/api/documents', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/insider-threats', insiderThreatRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/support', supportRoutes);

// New Routes
const webhookRoutes = require('./routes/webhooks');
const advertisementRoutes = require('./routes/advertisements');
app.use('/api/webhooks', webhookRoutes);
app.use('/api/advertisements', advertisementRoutes);


// Basic Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'CogniVault API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
