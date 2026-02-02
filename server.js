require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const classRoutes = require('./src/routes/classRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const lessonRoutes = require('./src/routes/lessonRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration (for production when frontend/backend are separate)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
}

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
const isProd = process.env.NODE_ENV === 'production';
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: isProd ? '7d' : 0
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/lessons', lessonRoutes);

// Serve admin pages (protected on API level)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve public pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler (before global error handler)
app.use((req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';
  
  console.error(`[ERROR] ${status} - ${err.message}`);
  if (isDev) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: err.message || 'حدث خطأ في الخادم',
    ...(isDev && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/login`);
});
