require('dotenv').config();
const db = require('./database');

async function migrate() {
  try {
    console.log('Running migration: Add multiple videos support...');

    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

    // Create videos table
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

    console.log('✓ videos table created');

    // Migrate existing videos from lessons table to videos table
    const lessons = await db.all('SELECT id, video_url, video_position, video_size, video_explanation FROM lessons WHERE video_url IS NOT NULL');
    
    if (lessons.length > 0) {
      console.log(`Migrating ${lessons.length} existing videos...`);
      for (const lesson of lessons) {
        await db.run(
          'INSERT INTO videos (lesson_id, video_url, position, size, explanation, display_order) VALUES (?, ?, ?, ?, ?, ?)',
          [lesson.id, lesson.video_url, lesson.video_position || 'bottom', lesson.video_size || 'large', lesson.video_explanation, 0]
        );
      }
      console.log(`✓ Migrated ${lessons.length} videos`);
    }

    console.log('✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
