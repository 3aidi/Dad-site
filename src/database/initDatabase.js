require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

    // ===== Admin Table =====
    await db.run(isPostgres ? `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Admin table verified');

    // ===== Identity Settings Table =====
    await db.run(isPostgres ? `
      CREATE TABLE IF NOT EXISTS identity_settings (
        id SERIAL PRIMARY KEY,
        school_name TEXT NOT NULL,
        platform_label TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        admin_role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS identity_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_name TEXT NOT NULL,
        platform_label TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        admin_role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Identity settings table verified');

    // ===== Classes, Units, Lessons Tables =====
    // (Merge your previous logic here with similar conditional Postgres/SQLite queries)
    // Classes
    await db.run(isPostgres ? `
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Classes table verified');

    // Units
    await db.run(isPostgres ? `
      CREATE TABLE IF NOT EXISTS units (
        id SERIAL PRIMARY KEY,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Units table verified');

    // Lessons
    await db.run(isPostgres ? `
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        video_url TEXT,
        video_position TEXT DEFAULT 'top',
        video_size TEXT DEFAULT 'large',
        video_explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ` : `
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        video_url TEXT,
        video_position TEXT DEFAULT 'top',
        video_size TEXT DEFAULT 'large',
        video_explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Lessons table verified');

    // ===== Default Admin =====
    const existingAdmin = await db.get('SELECT * FROM admins LIMIT 1');
    if (!existingAdmin) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
      const passwordHash = await bcrypt.hash(password, 10);
      await db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
      console.log(`✓ Default admin created (username: ${username})`);
    } else {
      console.log('✓ Admin already exists');
    }

    // ===== Default Identity =====
    const existingIdentity = await db.get('SELECT * FROM identity_settings LIMIT 1');
    if (!existingIdentity) {
      await db.run(
        'INSERT INTO identity_settings (school_name, platform_label, admin_name, admin_role) VALUES (?, ?, ?, ?)',
        ['مدرسة أبو فراس الحمداني للتعليم الأساسي', 'المنصة التعليمية', 'إدارة المدرسة', 'مسؤول النظام التعليمي']
      );
      console.log('✓ Default identity settings created');
    } else {
      console.log('✓ Identity settings already exist');
    }

    console.log('✅ Database initialization complete');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}

// Export for server.js
module.exports = { initializeDatabase };
