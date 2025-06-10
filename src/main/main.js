const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');

let mainWindow;
let displayWindow;
let settingsWindow;
let printWindow;

// Security configuration
const securityHeaders = {
  'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self';"],
  'X-Content-Type-Options': ['nosniff'],
  'X-Frame-Options': ['DENY'],
  'X-XSS-Protection': ['1; mode=block'],
  'Strict-Transport-Security': ['max-age=31536000; includeSubDomains']
};

// Create main window
async function createMainWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: true,
        webSecurity: true,
        nodeIntegration: false
      }
    });

    // Set security headers
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          ...securityHeaders
        }
      });
    });

    // Load the index page
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Open dev tools if in development
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    return true;
  } catch (error) {
    console.error('Error creating window:', error);
    dialog.showErrorBox('Error', 'Failed to initialize application. Please check the logs for details.');
    return false;
  }
}

// Create display window
async function createDisplayWindow() {
  try {
    if (displayWindow) {
      displayWindow.focus();
      return;
    }

    displayWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      }
    });

    await displayWindow.loadFile(path.join(__dirname, '../renderer/display.html'));

    displayWindow.on('closed', () => {
      displayWindow = null;
    });
  } catch (error) {
    console.error('Error creating display window:', error);
    throw error;
  }
}

// Create settings window
async function createSettingsWindow() {
  try {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }

    settingsWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      }
    });

    await settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });
  } catch (error) {
    console.error('Error creating settings window:', error);
    throw error;
  }
}

// Create print window
async function createPrintWindow(printData) {
  try {
    if (printWindow) {
      printWindow.focus();
      return;
    }

    printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      }
    });

    await printWindow.loadFile(path.join(__dirname, '../renderer/print.html'));
    
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.send('print-data', printData);
    });

    printWindow.on('closed', () => {
      printWindow = null;
    });
  } catch (error) {
    console.error('Error creating print window:', error);
    throw error;
  }
}

// App lifecycle handlers
app.whenReady().then(async () => {
  const success = await createMainWindow();
  if (!success) {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

// IPC handlers
ipcMain.handle('get-routes', async (event, shift) => {
  try {
    return db.getRoutes(shift);
  } catch (error) {
    console.error('Error getting routes:', error);
    throw error;
  }
});

ipcMain.handle('add-route', async (event, route) => {
  try {
    return db.addRoute(route);
  } catch (error) {
    console.error('Error adding route:', error);
    throw error;
  }
});

ipcMain.handle('update-route', async (event, id, updates) => {
  try {
    return db.updateRoute(id, updates);
  } catch (error) {
    console.error('Error updating route:', error);
    throw error;
  }
});

ipcMain.handle('delete-route', async (event, id) => {
  try {
    return db.deleteRoute(id);
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
});

ipcMain.handle('get-active-buses', async () => {
  try {
    return db.getActiveBuses();
  } catch (error) {
    console.error('Error getting active buses:', error);
    throw error;
  }
});

ipcMain.handle('add-bus', async (event, bus) => {
  try {
    return db.addBus(bus);
  } catch (error) {
    console.error('Error adding bus:', error);
    throw error;
  }
});

ipcMain.handle('update-bus', async (event, id, updates) => {
  try {
    return db.updateBus(id, updates);
  } catch (error) {
    console.error('Error updating bus:', error);
    throw error;
  }
});

ipcMain.handle('delete-bus', async (event, id) => {
  try {
    return db.deleteBus(id);
  } catch (error) {
    console.error('Error deleting bus:', error);
    throw error;
  }
});

ipcMain.handle('get-assignments', async (event, shift) => {
  try {
    return db.getAssignments(shift);
  } catch (error) {
    console.error('Error getting assignments:', error);
    throw error;
  }
});

ipcMain.handle('save-assignment', async (event, assignment) => {
  try {
    return db.saveAssignment(assignment);
  } catch (error) {
    console.error('Error saving assignment:', error);
    throw error;
  }
});

ipcMain.handle('delete-assignment', async (event, id) => {
  try {
    return db.deleteAssignment(id);
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
});

ipcMain.handle('auto-assign', async (event, shift) => {
  try {
    return db.autoAssign(shift);
  } catch (error) {
    console.error('Error auto-assigning:', error);
    throw error;
  }
});

ipcMain.handle('open-display-window', async () => {
  try {
    await createDisplayWindow();
    return true;
  } catch (error) {
    console.error('Error opening display window:', error);
    throw error;
  }
});

ipcMain.handle('open-settings-window', async () => {
  try {
    await createSettingsWindow();
    return true;
  } catch (error) {
    console.error('Error opening settings window:', error);
    throw error;
  }
});

ipcMain.handle('open-print-window', async (event, printData) => {
  try {
    await createPrintWindow(printData);
    return true;
  } catch (error) {
    console.error('Error opening print window:', error);
    throw error;
  }
});

ipcMain.handle('select-audio-file', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }
      ]
    });

    if (result.canceled) {
      return null;
    }

    const audioDir = path.join(__dirname, '../../data/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = path.basename(result.filePaths[0]);
    const targetPath = path.join(audioDir, fileName);
    fs.copyFileSync(result.filePaths[0], targetPath);

    return targetPath;
  } catch (error) {
    console.error('Error selecting audio file:', error);
    throw error;
  }
});

ipcMain.handle('get-audio-for-route', async (event, routeId) => {
  try {
    const route = db.getRoutes().find(r => r.id === routeId);
    return route ? route.audio_path : null;
  } catch (error) {
    console.error('Error getting audio for route:', error);
    throw error;
  }
});

ipcMain.handle('get-print-data', async () => {
  try {
    const [morningAssignments, dayAssignments] = await Promise.all([
      db.getAssignments('morning'),
      db.getAssignments('day')
    ]);
    return { morning: morningAssignments, day: dayAssignments };
  } catch (error) {
    console.error('Error getting print data:', error);
    throw error;
  }
});