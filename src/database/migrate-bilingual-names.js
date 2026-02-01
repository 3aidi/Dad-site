require('dotenv').config();
const db = require('./database');

async function migrateBilingualNames() {
  try {
    console.log('Starting migration: Add bilingual names (Arabic and English)...');

    // Migrate Classes table
    console.log('Migrating classes table...');
    try {
      await db.run(`ALTER TABLE classes ADD COLUMN name_ar TEXT`);
      console.log('✓ Added name_ar to classes');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ name_ar column already exists in classes');
      } else {
        throw err;
      }
    }

    try {
      await db.run(`ALTER TABLE classes ADD COLUMN name_en TEXT`);
      console.log('✓ Added name_en to classes');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ name_en column already exists in classes');
      } else {
        throw err;
      }
    }

    // Migrate Units table
    console.log('Migrating units table...');
    try {
      await db.run(`ALTER TABLE units ADD COLUMN title_ar TEXT`);
      console.log('✓ Added title_ar to units');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ title_ar column already exists in units');
      } else {
        throw err;
      }
    }

    try {
      await db.run(`ALTER TABLE units ADD COLUMN title_en TEXT`);
      console.log('✓ Added title_en to units');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ title_en column already exists in units');
      } else {
        throw err;
      }
    }

    // Migrate Lessons table
    console.log('Migrating lessons table...');
    try {
      await db.run(`ALTER TABLE lessons ADD COLUMN title_ar TEXT`);
      console.log('✓ Added title_ar to lessons');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ title_ar column already exists in lessons');
      } else {
        throw err;
      }
    }

    try {
      await db.run(`ALTER TABLE lessons ADD COLUMN title_en TEXT`);
      console.log('✓ Added title_en to lessons');
    } catch (err) {
      if (err.message.includes('duplicate column')) {
        console.log('✓ title_en column already exists in lessons');
      } else {
        throw err;
      }
    }

    // Populate existing data to maintain backward compatibility
    console.log('Populating existing data...');
    
    // Copy name to name_ar and name_en if they exist
    try {
      await db.run(`UPDATE classes SET name_ar = name, name_en = name WHERE name_ar IS NULL AND name_en IS NULL`);
      console.log('✓ Populated classes bilingual names');
    } catch (err) {
      console.log('✓ Classes already populated or empty');
    }

    try {
      await db.run(`UPDATE units SET title_ar = title, title_en = title WHERE title_ar IS NULL AND title_en IS NULL`);
      console.log('✓ Populated units bilingual titles');
    } catch (err) {
      console.log('✓ Units already populated or empty');
    }

    try {
      await db.run(`UPDATE lessons SET title_ar = title, title_en = title WHERE title_ar IS NULL AND title_en IS NULL`);
      console.log('✓ Populated lessons bilingual titles');
    } catch (err) {
      console.log('✓ Lessons already populated or empty');
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateBilingualNames();
