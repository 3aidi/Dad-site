require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./database');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

    // Create Admin table
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    console.log('✓ Admin table created');

    // Create identity/settings table for school-wide identity
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS identity_settings (
          id SERIAL PRIMARY KEY,
          school_name TEXT NOT NULL,
          platform_label TEXT NOT NULL,
          admin_name TEXT NOT NULL,
          admin_role TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(`
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
    }
    console.log('✓ Identity settings table created');

    // Create Classes table
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS classes (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS classes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    console.log('✓ Classes table created');

    // Create Units table
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS units (
          id SERIAL PRIMARY KEY,
          class_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        )
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          class_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        )
      `);
    }
    console.log('✓ Units table created');

    // Create Lessons table
    if (isPostgres) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS lessons (
          id SERIAL PRIMARY KEY,
          unit_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          video_url TEXT,
          video_position TEXT DEFAULT 'top',
          video_size TEXT DEFAULT 'large',
          video_explanation TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
        )
      `);
    } else {
      await db.run(`
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
    }
    console.log('✓ Lessons table created');

    // Check if admin exists
    const existingAdmin = await db.get('SELECT * FROM admins LIMIT 1');
    
    if (!existingAdmin) {
      // Create default admin account
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
      const passwordHash = await bcrypt.hash(password, 10);

      await db.run(
        'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
        [username, passwordHash]
      );
      console.log('✓ Default admin account created');
      console.log(`  Username: ${username}`);
      console.log('  ⚠️  Set ADMIN_PASSWORD in production and change default password.');
    } else {
      console.log('✓ Admin account already exists');
    }

    // Ensure there is at least one identity settings row
    const existingIdentity = await db.get('SELECT * FROM identity_settings LIMIT 1');
    if (!existingIdentity) {
      const defaultSchoolName = 'مدرسة أبو فراس الحمداني للتعليم الأساسي';
      const defaultPlatformLabel = 'المنصة التعليمية';
      const defaultAdminName = 'إدارة المدرسة';
      const defaultAdminRole = 'مسؤول النظام التعليمي';

      await db.run(
        'INSERT INTO identity_settings (school_name, platform_label, admin_name, admin_role) VALUES (?, ?, ?, ?)',
        [defaultSchoolName, defaultPlatformLabel, defaultAdminName, defaultAdminRole]
      );
      console.log('✓ Default identity settings created');
    } else {
      console.log('✓ Identity settings already exist');
    }

    console.log('\n✓ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
