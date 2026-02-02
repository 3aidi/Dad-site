require('dotenv').config();
const db = require('./database');

async function ensureTables() {
  try {
    console.log('Ensuring all required tables exist...');

    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    console.log('Database type:', isPostgres ? 'PostgreSQL' : 'SQLite');

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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
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
    }
    console.log('✓ videos table ready');

    // Create images table if not exists
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS images (
          id SERIAL PRIMARY KEY,
          lesson_id INTEGER NOT NULL,
          image_path TEXT NOT NULL,
          position TEXT DEFAULT 'bottom',
          size TEXT DEFAULT 'medium',
          caption TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        )
      `);
    } else {
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
    console.log('✓ images table ready');

    // List all tables for verification
    if (isPostgres) {
      const tables = await db.all("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
      console.log('\nDatabase tables:', tables.map(t => t.tablename).join(', '));
    } else {
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('\nDatabase tables:', tables.map(t => t.name).join(', '));
    }

    console.log('\n✓ All tables verified!');
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring tables:', error);
    process.exit(1);
  }
}

ensureTables();
