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
const isProd = process.env.NODE_ENV === 'production';

// Ensure required tables exist on startup
async function ensureTablesExist() {
  try {
    const isPostgres = process.env.DATABASE_URL && isProd;
    const tables = isPostgres ? [
      `CREATE TABLE IF NOT EXISTS videos (id SERIAL PRIMARY KEY, lesson_id INTEGER NOT NULL, video_url TEXT NOT NULL, position TEXT DEFAULT 'bottom', size TEXT DEFAULT 'large', explanation TEXT, display_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS images (id SERIAL PRIMARY KEY, lesson_id INTEGER NOT NULL, image_path TEXT NOT NULL, position TEXT DEFAULT 'bottom', size TEXT DEFAULT 'medium', caption TEXT, display_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS questions (id SERIAL PRIMARY KEY, lesson_id INTEGER NOT NULL, question_text TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_answer CHAR(1) NOT NULL, display_order INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    ] : [
      `CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id INTEGER NOT NULL, video_url TEXT NOT NULL, position TEXT DEFAULT 'bottom', size TEXT DEFAULT 'large', explanation TEXT, display_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id INTEGER NOT NULL, image_path TEXT NOT NULL, position TEXT DEFAULT 'bottom', size TEXT DEFAULT 'medium', caption TEXT, display_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id INTEGER NOT NULL, question_text TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_answer CHAR(1) NOT NULL, display_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE)`
    ];
    for (const sql of tables) await db.run(sql);
    if (!isProd) console.log('✓ Tables verified');
  } catch (e) {
    if (!isProd) console.error('Table check warning:', e.message);
  }
}
setTimeout(ensureTablesExist, 1000);

// Middleware
if (isProd) app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Static files with aggressive caching in production
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: isProd ? '30d' : 0,
  immutable: isProd
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/lessons', lessonRoutes);

// SPA fallback
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Error handling
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (!isProd) console.error(`[ERROR] ${status}:`, err.message);
  res.status(status).json({ error: err.message || 'خطأ في الخادم' });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
