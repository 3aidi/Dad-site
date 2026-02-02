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
const db = require('./src/database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure required tables exist on startup
async function ensureTablesExist() {
  try {
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    
    // Create videos table if not exists
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS videos (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER NOT NULL,
          video_url TEXT NOT NULL,
          position TEXT DEFAULT 'bottom',
          size TEXT DEFAULT 'large',
          explanation TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.run(`
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          position TEXT DEFAULT 'bottom',
          size TEXT DEFAULT 'medium',
          caption TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lesson_id INTEGER NOT NULL,
          video_url TEXT NOT NULL,
          position TEXT DEFAULT 'bottom',
          size TEXT DEFAULT 'large',
          explanation TEXT,
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        )
      `);
      await db.run(`
        CREATE TABLE IF NOT EXISTS images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lesson_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          position TEXT DEFAULT 'bottom',
          size TEXT DEFAULT 'medium',
          caption TEXT,
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        )
      `);
    }
    console.log('✓ Database tables verified');
  } catch (error) {
    console.error('Warning: Could not verify tables:', error.message);
  }
}

// Run table check after a short delay to allow DB connection
setTimeout(ensureTablesExist, 1000);

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
