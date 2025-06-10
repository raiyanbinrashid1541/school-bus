const migrations = [
  // Migration 1: Create students table
  `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      roll TEXT NOT NULL,
      stand TEXT NOT NULL,
      shift TEXT NOT NULL,
      contact TEXT,
      address TEXT,
      image_path TEXT,
      image_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  // Migration 2: Update assignments table
  `
    DROP TABLE IF EXISTS assignments;
    CREATE TABLE assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      boys_bus_id INTEGER,
      girls_bus_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (boys_bus_id) REFERENCES buses(id) ON DELETE SET NULL,
      FOREIGN KEY (girls_bus_id) REFERENCES buses(id) ON DELETE SET NULL
    );
  `,
  
  // Migration 3: Create audio_phrases table
  `
    CREATE TABLE IF NOT EXISTS audio_phrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
];

const runMigrations = (db) => {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_number INTEGER NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Get executed migrations
  const executedMigrations = db.prepare('SELECT migration_number FROM migrations').all()
    .map(m => m.migration_number);
  
  // Run pending migrations
  migrations.forEach((migration, index) => {
    const migrationNumber = index + 1;
    if (!executedMigrations.includes(migrationNumber)) {
      try {
        db.exec(migration);
        db.prepare('INSERT INTO migrations (migration_number) VALUES (?)')
          .run(migrationNumber);
        console.log(`Migration ${migrationNumber} executed successfully`);
      } catch (error) {
        console.error(`Error executing migration ${migrationNumber}:`, error);
        throw error;
      }
    }
  });
};

module.exports = {
  runMigrations
}; 