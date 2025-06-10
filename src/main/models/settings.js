const { getDb } = require('../database/db');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class SettingsModel {
  // Route Management
  static async getRoutes(shift) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM routes 
      WHERE shift = ? 
      ORDER BY name
    `);
    return stmt.all(shift);
  }

  static async addRoute(routeData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO routes (name, shift, audio_path)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      routeData.name,
      routeData.shift || 'morning',
      routeData.audio_path || null
    );
    
    return result.lastInsertRowid;
  }

  static async updateRoute(id, field, value) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE routes 
      SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(value, id);
  }

  static async deleteRoute(id) {
    const db = getDb();
    return db.prepare('DELETE FROM routes WHERE id = ?').run(id);
  }

  // Bus Management
  static async getActiveBuses() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM buses 
      WHERE is_active = 1 
      ORDER BY number
    `);
    return stmt.all();
  }

  static async addBus(busData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO buses (number, capacity, type)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      busData.number,
      busData.capacity,
      busData.type || 'mixed'
    );
    
    return result.lastInsertRowid;
  }

  static async updateBus(id, field, value) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE buses 
      SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(value, id);
  }

  static async deleteBus(id) {
    const db = getDb();
    return db.prepare('UPDATE buses SET is_active = 0 WHERE id = ?').run(id);
  }

  // Audio Management
  static async getAudioForRoute(routeId) {
    const db = getDb();
    const route = db.prepare('SELECT audio_path FROM routes WHERE id = ?').get(routeId);
    return route ? { filePath: route.audio_path } : null;
  }

  static async saveAudioForRoute(audioData) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE routes 
      SET audio_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const audioDir = path.join(app.getPath('userData'), 'route-audios');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${audioData.fileName}`;
    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(audioData.audioData));
    
    return stmt.run(filePath, audioData.routeId);
  }

  static async deleteAudioForRoute(routeId) {
    const db = getDb();
    const route = db.prepare('SELECT audio_path FROM routes WHERE id = ?').get(routeId);
    
    if (route && route.audio_path) {
      try {
        fs.unlinkSync(route.audio_path);
      } catch (error) {
        console.error('Error deleting audio file:', error);
      }
    }
    
    return db.prepare('UPDATE routes SET audio_path = NULL WHERE id = ?').run(routeId);
  }

  // Student Management
  static async addStudent(studentData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO students (name, class, roll, stand, shift, contact, address, image_path, image_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let imagePath = null;
    if (studentData.image) {
      const imagesDir = path.join(app.getPath('userData'), 'student-images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${studentData.imageName}`;
      imagePath = path.join(imagesDir, fileName);
      fs.writeFileSync(imagePath, Buffer.from(studentData.image));
    }
    
    const result = stmt.run(
      studentData.name,
      studentData.class,
      studentData.roll,
      studentData.stand,
      studentData.shift,
      studentData.contact,
      studentData.address,
      imagePath,
      studentData.imageName
    );
    
    return result.lastInsertRowid;
  }

  static async getStudents(searchTerm = '', shift = 'morning') {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT * FROM students 
      WHERE (name LIKE ? OR class LIKE ? OR roll LIKE ?)
      AND shift = ?
      ORDER BY name
    `);
    
    const searchPattern = `%${searchTerm}%`;
    return stmt.all(searchPattern, searchPattern, searchPattern, shift);
  }

  static async updateStudent(id, field, value) {
    const db = getDb();
    const stmt = db.prepare(`UPDATE students SET ${field} = ? WHERE id = ?`);
    return stmt.run(value, id);
  }

  static async deleteStudent(id) {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    return stmt.run(id);
  }

  // Audio Phrase Management
  static async saveAudioPhrase(phraseData) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO audio_phrases (type, text, file_path)
      VALUES (?, ?, ?)
    `);
    
    const audioDir = path.join(app.getPath('userData'), 'audio-phrases');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${phraseData.fileName}`;
    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(phraseData.audioData));
    
    return stmt.run(phraseData.type, phraseData.text, filePath);
  }

  static async getAudioPhrases() {
    const db = getDb();
    return db.prepare('SELECT * FROM audio_phrases ORDER BY type, text').all();
  }

  static async getAudioPhrase(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM audio_phrases WHERE id = ?').get(id);
  }

  static async deleteAudioPhrase(id) {
    const db = getDb();
    const phrase = db.prepare('SELECT file_path FROM audio_phrases WHERE id = ?').get(id);
    if (phrase && phrase.file_path) {
      try {
        fs.unlinkSync(phrase.file_path);
      } catch (error) {
        console.error('Error deleting audio phrase file:', error);
      }
    }
    return db.prepare('DELETE FROM audio_phrases WHERE id = ?').run(id);
  }

  // Data Management
  static async exportData(type) {
    const db = getDb();
    let data;
    
    switch (type) {
      case 'routes':
        data = db.prepare('SELECT * FROM routes').all();
        break;
      case 'buses':
        data = db.prepare('SELECT * FROM buses').all();
        break;
      case 'students':
        data = db.prepare('SELECT * FROM students').all();
        break;
      default:
        throw new Error('Invalid export type');
    }
    
    const exportDir = path.join(app.getPath('userData'), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const fileName = `${type}-${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    fs.writeFileSync(filePath, csv);
    return filePath;
  }

  static async importData(csvData) {
    const db = getDb();
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    // Determine the type based on headers
    let type;
    if (headers.includes('shift')) {
      type = 'routes';
    } else if (headers.includes('capacity')) {
      type = 'buses';
    } else if (headers.includes('class')) {
      type = 'students';
    } else {
      throw new Error('Invalid import data format');
    }
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    try {
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        
        switch (type) {
          case 'routes':
            await this.addRoute(row);
            break;
          case 'buses':
            await this.addBus(row);
            break;
          case 'students':
            await this.addStudent(row);
            break;
        }
      }
      
      db.prepare('COMMIT').run();
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  static async eraseAllData() {
    const db = getDb();
    db.prepare('BEGIN').run();
    
    try {
      db.prepare('DELETE FROM audio_phrases').run();
      db.prepare('DELETE FROM audio_files').run();
      db.prepare('DELETE FROM assignments').run();
      db.prepare('DELETE FROM students').run();
      db.prepare('DELETE FROM buses').run();
      db.prepare('DELETE FROM routes').run();
      
      // Delete all files
      const userDataPath = app.getPath('userData');
      const dirs = ['student-images', 'route-audios', 'phrase-audios', 'exports'];
      
      dirs.forEach(dir => {
        const dirPath = path.join(userDataPath, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      });
      
      db.prepare('COMMIT').run();
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  static async getAutoAssignments(shift) {
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
      WHERE r.shift = ?
    `).all(shift);
  }
}

module.exports = SettingsModel; 