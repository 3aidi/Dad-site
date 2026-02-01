require('dotenv').config();
const db = require('./database');

async function migrateDatabase() {
  try {
    console.log('🔄 Adding video controls columns to lessons table...');
    
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
    
    if (isPostgres) {
      // PostgreSQL migration
      await db.run(`
        ALTER TABLE lessons 
        ADD COLUMN IF NOT EXISTS video_position TEXT DEFAULT 'top'
      `);
      await db.run(`
        ALTER TABLE lessons 
        ADD COLUMN IF NOT EXISTS video_size TEXT DEFAULT 'large'
      `);
    } else {
      // SQLite migration
      const columns = await db.all("PRAGMA table_info(lessons)");
      
      if (!columns.some(col => col.name === 'video_position')) {
        await db.run(`
          ALTER TABLE lessons 
          ADD COLUMN video_position TEXT DEFAULT 'top'
        `);
        console.log('✓ video_position column added');
      } else {
        console.log('✓ video_position column already exists');
      }
      
      if (!columns.some(col => col.name === 'video_size')) {
        await db.run(`
          ALTER TABLE lessons 
          ADD COLUMN video_size TEXT DEFAULT 'large'
        `);
        console.log('✓ video_size column added');
      } else {
        console.log('✓ video_size column already exists');
      }
    }
    
    console.log('\n✓ Video controls migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
