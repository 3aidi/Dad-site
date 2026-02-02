const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database('./database.db');
const all = promisify(db.all.bind(db));

async function checkSchema() {
  try {
    console.log('=== LESSONS TABLE SCHEMA ===');
    const columns = await all('PRAGMA table_info(lessons)');
    columns.forEach(col => {
      console.log(`${col.name} (${col.type})`);
    });
    
    console.log('\n=== SAMPLE LESSON DATA ===');
    const lessons = await all('SELECT * FROM lessons LIMIT 1');
    if (lessons.length > 0) {
      console.log(JSON.stringify(lessons[0], null, 2));
    } else {
      console.log('No lessons found');
    }
    
    db.close();
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

checkSchema();
