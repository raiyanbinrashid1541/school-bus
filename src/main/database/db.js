const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const { runMigrations } = require('./migrations');

let dbInstance;

const initialize = async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'school-bus.db');
    console.log('Initializing database at:', dbPath);
    
    // Create directory if it doesn't exist
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log('Creating database directory:', dbDir);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Check if database file exists
    const dbExists = fs.existsSync(dbPath);
    console.log('Database file exists:', dbExists);
    
    // Open database connection
    console.log('Opening database connection...');
    dbInstance = new Database(dbPath, { verbose: console.log });
    
    // Enable foreign key constraints
    console.log('Enabling foreign key constraints...');
    dbInstance.pragma('foreign_keys = ON');
    
    // Create base tables if they don't exist
    console.log('Creating base tables...');
    
    // Create routes table
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        shift TEXT NOT NULL CHECK(shift IN ('morning', 'day')),
        audio_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create buses table
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('boys', 'girls', 'mixed')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create assignments table
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id INTEGER NOT NULL,
        boys_bus_id INTEGER,
        girls_bus_id INTEGER,
        shift TEXT NOT NULL CHECK(shift IN ('morning', 'day')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (boys_bus_id) REFERENCES buses(id) ON DELETE SET NULL,
        FOREIGN KEY (girls_bus_id) REFERENCES buses(id) ON DELETE SET NULL
      );
    `);
    
    // Create indexes after tables are created
    console.log('Creating indexes...');
    dbInstance.exec(`
      CREATE INDEX IF NOT EXISTS idx_routes_shift ON routes(shift);
      CREATE INDEX IF NOT EXISTS idx_buses_type ON buses(type);
      CREATE INDEX IF NOT EXISTS idx_assignments_shift ON assignments(shift);
    `);
    
    // Run migrations
    console.log('Running migrations...');
    await runMigrations(dbInstance);
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    if (dbInstance) {
      try {
        dbInstance.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
      dbInstance = null;
    }
    throw error;
  }
};

const getDb = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return dbInstance;
};

const backupDatabase = () => {
  const dbPath = path.join(app.getPath('userData'), 'school-bus.db');
  const backupPath = path.join(app.getPath('userData'), 'school-bus-backup.db');
  
  try {
    console.log('Creating database backup...');
    fs.copyFileSync(dbPath, backupPath);
    console.log('Database backup created successfully');
    return true;
  } catch (error) {
    console.error('Database backup failed:', error);
    return false;
  }
};

module.exports = {
  initialize,
  getDb,
  backupDatabase
};