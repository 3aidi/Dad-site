require('dotenv').config();
const db = require('./database');

async function migrateDatabase() {
  try {
    console.log('🔄 Adding video_url column to lessons table...');
    
    // Check if column already exists
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    
    if (isPostgres) {
      // PostgreSQL migration
      await db.run(`
        ALTER TABLE lessons 
        ADD COLUMN IF NOT EXISTS video_url TEXT
      `);
    } else {
      // SQLite migration
      // First check if column exists
      const columns = await db.all("PRAGMA table_info(lessons)");
      const hasVideoUrl = columns.some(col => col.name === 'video_url');
      
      if (!hasVideoUrl) {
        await db.run(`
          ALTER TABLE lessons 
          ADD COLUMN video_url TEXT
        `);
        console.log('✓ video_url column added successfully');
      } else {
        console.log('✓ video_url column already exists');
      }
    }
    
    console.log('\n✓ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
