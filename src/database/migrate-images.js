require('dotenv').config();
const db = require('./database');

async function migrate() {
  try {
    console.log('Running migration: Add multiple images support...');

    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

    // Create images table
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

    console.log('✓ images table created');
    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
