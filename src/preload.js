const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI', {
        // Route methods
        getRoutes: (shift) => ipcRenderer.invoke('get-routes', shift),
        addRoute: (data) => ipcRenderer.invoke('add-route', data),
        updateRoute: (id, updates) => ipcRenderer.invoke('update-route', id, updates),
        deleteRoute: (id) => ipcRenderer.invoke('delete-route', id),
        
        // Bus methods
        getActiveBuses: () => ipcRenderer.invoke('get-active-buses'),
        addBus: (data) => ipcRenderer.invoke('add-bus', data),
        updateBus: (id, updates) => ipcRenderer.invoke('update-bus', id, updates),
        deleteBus: (id) => ipcRenderer.invoke('delete-bus', id),
        
        // Assignment methods
        getAssignments: (shift) => ipcRenderer.invoke('get-assignments', shift),
        saveAssignment: (data) => ipcRenderer.invoke('save-assignment', data),
        deleteAssignment: (id) => ipcRenderer.invoke('delete-assignment', id),
        
        // Auto assignment methods
        autoAssign: (shift) => ipcRenderer.invoke('auto-assign', shift),
        
        // Window management
        openDisplayWindow: () => ipcRenderer.invoke('open-display-window'),
        openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
        openPrintWindow: (printData) => ipcRenderer.invoke('open-print-window', printData),
        
        // Audio methods
        selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
        getAudioForRoute: (routeId) => ipcRenderer.invoke('get-audio-for-route', routeId),
        
        // Print methods
        getPrintData: () => ipcRenderer.invoke('get-print-data'),
        
        // Event listeners
        on: (channel, callback) => {
            const validChannels = ['refresh-data', 'print-data'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => callback(...args));
            }
        },
        
        // Remove event listeners
        removeListener: (channel, callback) => {
            const validChannels = ['refresh-data', 'print-data'];
            if (validChannels.includes(channel)) {
                ipcRenderer.removeListener(channel, callback);
            }
        }
    }
);