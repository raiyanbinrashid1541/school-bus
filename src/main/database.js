const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/school_bus.db');
        this.ensureDataDirectory();
        this.initializeDatabase();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async initializeDatabase() {
        this.db = await sqlite.open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await this.db.run('PRAGMA foreign_keys = ON');

        // Create routes table
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                shift TEXT NOT NULL,
                audio_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create buses table
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS buses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT NOT NULL UNIQUE,
                capacity INTEGER NOT NULL,
                type TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assignments table
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER,
                bus_id INTEGER,
                shift TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
                FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
            )
        `);

        // Create indexes
        await this.db.run('CREATE INDEX IF NOT EXISTS idx_routes_shift ON routes(shift)');
        await this.db.run('CREATE INDEX IF NOT EXISTS idx_assignments_shift ON assignments(shift)');
        await this.db.run('CREATE INDEX IF NOT EXISTS idx_buses_type ON buses(type)');
    }

    async getRoutes(shift) {
        const query = shift ? 'SELECT * FROM routes WHERE shift = ?' : 'SELECT * FROM routes';
        const params = shift ? [shift] : [];
        return await this.db.all(query, params);
    }

    async addRoute(route) {
        const result = await this.db.run(
            'INSERT INTO routes (name, shift, audio_path) VALUES (?, ?, ?)',
            [route.name, route.shift, route.audio_path]
        );
        return { id: result.lastID, ...route };
    }

    async updateRoute(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        await this.db.run(
            `UPDATE routes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
        return { id, ...updates };
    }

    async deleteRoute(id) {
        await this.db.run('DELETE FROM routes WHERE id = ?', [id]);
        return { id };
    }

    async getActiveBuses() {
        return await this.db.all('SELECT * FROM buses WHERE is_active = 1');
    }

    async addBus(bus) {
        const result = await this.db.run(
            'INSERT INTO buses (number, capacity, type) VALUES (?, ?, ?)',
            [bus.number, bus.capacity, bus.type]
        );
        return { id: result.lastID, ...bus };
    }

    async updateBus(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        await this.db.run(
            `UPDATE buses SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
        return { id, ...updates };
    }

    async deleteBus(id) {
        await this.db.run('UPDATE buses SET is_active = 0 WHERE id = ?', [id]);
        return { id };
    }

    async getAssignments(shift) {
        return await this.db.all(`
            SELECT a.*, r.name as route_name, b.number as bus_number, b.type as bus_type
            FROM assignments a
            JOIN routes r ON a.route_id = r.id
            JOIN buses b ON a.bus_id = b.id
            WHERE a.shift = ?
        `, [shift]);
    }

    async saveAssignment(assignment) {
        const result = await this.db.run(
            'INSERT INTO assignments (route_id, bus_id, shift) VALUES (?, ?, ?)',
            [assignment.route_id, assignment.bus_id, assignment.shift]
        );
        return { id: result.lastID, ...assignment };
    }

    async deleteAssignment(id) {
        await this.db.run('DELETE FROM assignments WHERE id = ?', [id]);
        return { id };
    }

    async autoAssign(shift) {
        await this.db.run('BEGIN TRANSACTION');

        try {
            // Clear existing assignments for the shift
            await this.db.run('DELETE FROM assignments WHERE shift = ?', [shift]);

            // Get all routes for the shift
            const routes = await this.db.all('SELECT * FROM routes WHERE shift = ?', [shift]);

            // Get all active buses
            const buses = await this.db.all('SELECT * FROM buses WHERE is_active = 1');

            // Separate buses by type
            const microBuses = buses.filter(bus => bus.type === 'micro');
            const miniBuses = buses.filter(bus => bus.type === 'mini');
            const largeBuses = buses.filter(bus => bus.type === 'large');

            // Assign buses to routes
            const assignments = [];
            let busIndex = 0;

            for (const route of routes) {
                let bus;
                if (shift === 'morning') {
                    // Morning shift: prefer micro and mini buses
                    if (busIndex < microBuses.length) {
                        bus = microBuses[busIndex];
                    } else if (busIndex < microBuses.length + miniBuses.length) {
                        bus = miniBuses[busIndex - microBuses.length];
                    } else {
                        bus = largeBuses[busIndex - microBuses.length - miniBuses.length];
                    }
                } else {
                    // Day shift: prefer mini and large buses
                    if (busIndex < miniBuses.length) {
                        bus = miniBuses[busIndex];
                    } else if (busIndex < miniBuses.length + largeBuses.length) {
                        bus = largeBuses[busIndex - miniBuses.length];
                    } else {
                        bus = microBuses[busIndex - miniBuses.length - largeBuses.length];
                    }
                }

                if (bus) {
                    const assignment = {
                        route_id: route.id,
                        bus_id: bus.id,
                        shift: shift
                    };
                    await this.db.run(
                        'INSERT INTO assignments (route_id, bus_id, shift) VALUES (?, ?, ?)',
                        [assignment.route_id, assignment.bus_id, assignment.shift]
                    );
                    assignments.push(assignment);
                    busIndex++;
                }
            }

            await this.db.run('COMMIT');
            return assignments;
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }
}

module.exports = new DatabaseService(); 