const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database('./database.db');
const all = promisify(db.all.bind(db));

async function checkTables() {
  try {
    console.log('=== VIDEOS TABLE ===');
    try {
      const videoCols = await all('PRAGMA table_info(videos)');
      videoCols.forEach(col => console.log(`  ${col.name} (${col.type})`));
    } catch (e) {
      console.log('  Table does not exist');
    }
    
    console.log('\n=== IMAGES TABLE ===');
    try {
      const imageCols = await all('PRAGMA table_info(images)');
      imageCols.forEach(col => console.log(`  ${col.name} (${col.type})`));
    } catch (e) {
      console.log('  Table does not exist');
    }
    
    db.close();
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
}

checkTables();
