require('dotenv').config();
const db = require('./database');

async function migrateDatabase() {
  try {
    console.log('🔄 Adding video_explanation column to lessons table...');
    
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    
    if (isPostgres) {
      // PostgreSQL migration
      await db.run(`
        ALTER TABLE lessons 
        ADD COLUMN IF NOT EXISTS video_explanation TEXT
      `);
    } else {
      // SQLite migration
      const columns = await db.all("PRAGMA table_info(lessons)");
      
      if (!columns.some(col => col.name === 'video_explanation')) {
        await db.run(`
          ALTER TABLE lessons 
          ADD COLUMN video_explanation TEXT
        `);
        console.log('✓ video_explanation column added');
      } else {
        console.log('✓ video_explanation column already exists');
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
