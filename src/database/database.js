const path = require('path');

// Check if using PostgreSQL (production) or SQLite (local)
const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

class Database {
  constructor() {
    this.db = null;
    this.isPostgres = usePostgres;
  }

  async connect() {
    if (this.isPostgres) {
      // PostgreSQL connection
      const { Pool } = require('pg');
      this.db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      console.log('Connected to PostgreSQL database');
    } else {
      // SQLite connection
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = path.join(__dirname, '../../database.db');
      
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error('Error connecting to database:', err);
            reject(err);
          } else {
            console.log('Connected to SQLite database');
            resolve();
          }
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.isPostgres) {
      // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
      let pgSql = sql;
      let pgParams = params;
      let paramIndex = 1;
      pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      
      const result = await this.db.query(pgSql, pgParams);
      return { 
        id: result.rows[0]?.id || result.rows.length, 
        changes: result.rowCount 
      };
    } else {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, changes: this.changes });
          }
        });
      });
    }
  }

  async get(sql, params = []) {
    if (this.isPostgres) {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      
      const result = await this.db.query(pgSql, params);
      return result.rows[0];
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    }
  }

  async all(sql, params = []) {
    if (this.isPostgres) {
      let pgSql = sql;
      let paramIndex = 1;
      pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      
      const result = await this.db.query(pgSql, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  async close() {
    if (this.isPostgres) {
      await this.db.end();
    } else {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

const db = new Database();
db.connect().catch(console.error);

module.exports = db;
