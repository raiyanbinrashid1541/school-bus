const { getDb } = require('../database/db');

class RouteModel {
  static getAllRoutes() {
    const db = getDb();
    return db.prepare('SELECT * FROM routes ORDER BY name').all();
  }

  static addRoute(name, stands, boysCount, girlsCount) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO routes (name, stands, boys_count, girls_count) 
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, JSON.stringify(stands), boysCount, girlsCount);
    return info.lastInsertRowid;
  }

  static deleteRoute(id) {
    const db = getDb();
    db.prepare('DELETE FROM routes WHERE id = ?').run(id);
    return true;
  }
}

class BusModel {
  static getAllBuses() {
    const db = getDb();
    return db.prepare('SELECT * FROM buses ORDER BY number').all();
  }

  static addBus(number, capacity, type) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO buses (number, capacity, type) 
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(number, capacity, type);
    return info.lastInsertRowid;
  }

  static deleteBus(id) {
    const db = getDb();
    db.prepare('DELETE FROM buses WHERE id = ?').run(id);
    return true;
  }
}

class AssignmentModel {
  static getAssignments() {
    const db = getDb();
    return db.prepare(`
      SELECT 
        a.id,
        r.name as route_name,
        b1.number as boys_bus,
        b2.number as girls_bus
      FROM assignments a
      JOIN routes r ON a.route_id = r.id
      LEFT JOIN buses b1 ON a.boys_bus_id = b1.id
      LEFT JOIN buses b2 ON a.girls_bus_id = b2.id
      ORDER BY r.name
    `).all();
  }

  static saveAssignment(routeId, boysBusId, girlsBusId) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO assignments (route_id, boys_bus_id, girls_bus_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(routeId, boysBusId, girlsBusId);
    return true;
  }

  static deleteAssignment(id) {
    const db = getDb();
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
    return true;
  }

  static autoAssignBuses() {
    const db = getDb();
    
    // Get all routes and buses
    const routes = db.prepare('SELECT * FROM routes ORDER BY (total_boys + total_girls) DESC').all();
    const boysBuses = db.prepare('SELECT * FROM buses WHERE type = "boys" OR type = "mixed" ORDER BY capacity DESC').all();
    const girlsBuses = db.prepare('SELECT * FROM buses WHERE type = "girls" OR type = "mixed" ORDER BY capacity DESC').all();
    
    // Clear existing assignments
    db.prepare('DELETE FROM assignments').run();
    
    // Assign buses to routes
    const assignments = [];
    
    for (const route of routes) {
      let boysBusId = null;
      let girlsBusId = null;
      
      // Assign boys bus
      if (route.total_boys > 0) {
        for (let i = 0; i < boysBuses.length; i++) {
          if (boysBuses[i] && boysBuses[i].capacity >= route.total_boys) {
            boysBusId = boysBuses[i].id;
            boysBuses[i] = null; // Mark as used
            break;
          }
        }
      }
      
      // Assign girls bus
      if (route.total_girls > 0) {
        for (let i = 0; i < girlsBuses.length; i++) {
          if (girlsBuses[i] && girlsBuses[i].capacity >= route.total_girls) {
            girlsBusId = girlsBuses[i].id;
            girlsBuses[i] = null; // Mark as used
            break;
          }
        }
      }
      
      if (boysBusId || girlsBusId) {
        db.prepare(`
          INSERT INTO assignments (route_id, boys_bus_id, girls_bus_id)
          VALUES (?, ?, ?)
        `).run(route.id, boysBusId, girlsBusId);
        
        assignments.push({
          routeId: route.id,
          boysBusId,
          girlsBusId
        });
      }
    }
    
    return assignments;
  }
}

class AudioModel {
  static getAudioForRoute(routeId) {
    const db = getDb();
    return db.prepare('SELECT * FROM audio_files WHERE route_id = ?').get(routeId);
  }

  static saveAudioForRoute(routeId, filePath) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO audio_files (route_id, file_path)
      VALUES (?, ?)
    `);
    stmt.run(routeId, filePath);
    return { filePath };
  }

  static deleteAudioForRoute(routeId) {
    const db = getDb();
    const audio = db.prepare('SELECT file_path FROM audio_files WHERE route_id = ?').get(routeId);
    
    if (audio) {
      try {
        require('fs').unlinkSync(audio.file_path);
      } catch (error) {
        console.error('Error deleting audio file:', error);
      }
    }
    
    db.prepare('DELETE FROM audio_files WHERE route_id = ?').run(routeId);
    return true;
  }
}

// Combined model for display data
class DisplayModel {
  static getDisplayData() {
    const db = getDb();
    return db.prepare(`
      SELECT 
        r.name as route_name,
        b1.number as boys_bus,
        b2.number as girls_bus
      FROM assignments a
      JOIN routes r ON a.route_id = r.id
      LEFT JOIN buses b1 ON a.boys_bus_id = b1.id
      LEFT JOIN buses b2 ON a.girls_bus_id = b2.id
      ORDER BY r.name
    `).all();
  }
}

module.exports = {
  // Individual models
  ...RouteModel,
  ...BusModel,
  ...AssignmentModel,
  ...AudioModel,
  ...DisplayModel,
  
  // Combined operations
  getAllRoutes: RouteModel.getAllRoutes,
  addRoute: RouteModel.addRoute,
  deleteRoute: RouteModel.deleteRoute,
  getAllBuses: BusModel.getAllBuses,
  addBus: BusModel.addBus,
  deleteBus: BusModel.deleteBus,
  getAssignments: AssignmentModel.getAssignments,
  saveAssignment: AssignmentModel.saveAssignment,
  deleteAssignment: AssignmentModel.deleteAssignment,
  autoAssignBuses: AssignmentModel.autoAssignBuses,
  getAudioForRoute: AudioModel.getAudioForRoute,
  saveAudioForRoute: AudioModel.saveAudioForRoute,
  deleteAudioForRoute: AudioModel.deleteAudioForRoute,
  getDisplayData: DisplayModel.getDisplayData
};