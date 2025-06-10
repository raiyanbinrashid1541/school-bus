// Global variables
let currentShift = 'morning';

// Tab switching
function switchTab(tabId) {
    console.log('switchTab called with:', tabId);
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    console.log('Found tab contents:', tabContents.length);
    tabContents.forEach(tab => {
        console.log('Hiding tab:', tab.id);
        tab.style.display = 'none';
    });
    
    // Remove active class from all tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    console.log('Found nav tabs:', navTabs.length);
    navTabs.forEach(tab => {
        console.log('Removing active from nav tab:', tab.getAttribute('data-tab'));
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    console.log('Selected tab element:', selectedTab);
    if (selectedTab) {
        console.log('Showing tab:', tabId);
        selectedTab.style.display = 'block';
        // Add active class to corresponding nav tab
        const navTab = document.querySelector(`[data-tab="${tabId}"]`);
        console.log('Found nav tab for data-tab:', navTab);
        if (navTab) {
            console.log('Adding active to nav tab');
            navTab.classList.add('active');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Settings page loaded');
    try {
        // Add event listeners for tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log('Found nav tabs:', navTabs.length);
        navTabs.forEach(tab => {
            console.log('Adding click listener to tab:', tab.getAttribute('data-tab'));
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Tab clicked:', e.target);
                const tabId = tab.getAttribute('data-tab');
                console.log('Tab ID from click:', tabId);
                switchTab(tabId);
            });
        });

        // Add event listeners for forms
        const routeForm = document.getElementById('route-form');
        const busForm = document.getElementById('bus-form');
        const audioForm = document.getElementById('audio-form');

        if (routeForm) {
            routeForm.addEventListener('submit', handleRouteSubmit);
        }
        if (busForm) {
            busForm.addEventListener('submit', handleBusSubmit);
        }
        if (audioForm) {
            audioForm.addEventListener('submit', handleAudioSubmit);
        }

        // Load initial data
        await loadInitialData();

        // Show default tab
        console.log('Showing default tab: routes-tab');
        switchTab('routes-tab');

        console.log('Settings page initialized successfully');
    } catch (error) {
        console.error('Error initializing settings page:', error);
        showStatus('সেটিংস পেজ শুরু করতে সমস্যা হয়েছে', 'error');
    }
});

// Shift switching
function switchShift(shift) {
    console.log('Switching to shift:', shift);
    currentShift = shift;
    
    // Update shift tabs
    const shiftTabs = document.querySelectorAll('.shift-tab');
    shiftTabs.forEach(tab => {
        if (tab.getAttribute('data-shift') === shift) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Reload data for the new shift
    loadData();
}

// Load data
async function loadData() {
    try {
        console.log('Loading data for shift:', currentShift);
        // Load routes
        const routes = await window.electronAPI.getRoutes(currentShift);
        console.log('Routes loaded:', routes);
        populateRoutesTable(routes);
        
        // Load buses
        const buses = await window.electronAPI.getBuses();
        console.log('Buses loaded:', buses);
        populateBusesTable(buses);
        
        // Load students
        const students = await window.electronAPI.getStudents('', currentShift);
        console.log('Students loaded:', students);
        populateStudentsTable(students);
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showStatus('ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Load initial data
async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        const [routes, buses] = await Promise.all([
            window.electronAPI.getRoutes(),
            window.electronAPI.getActiveBuses()
        ]);
        
        console.log('Routes and buses loaded:', { routes, buses });
        
        populateRoutesTable(routes);
        populateBusesTable(buses);
        populateAudioTable(routes.filter(route => route.audio_path));
        
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showStatus('ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Populate routes table
function populateRoutesTable(routes) {
    const tableBody = document.getElementById('routes-table')?.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    routes.forEach(route => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = route.name;
        
        const shiftCell = document.createElement('td');
        shiftCell.textContent = route.shift === 'morning' ? 'সকাল' : 'দুপুর';
        
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'মুছে ফেলুন';
        deleteBtn.onclick = () => deleteRoute(route.id);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(nameCell);
        row.appendChild(shiftCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Populate buses table
function populateBusesTable(buses) {
    const tableBody = document.getElementById('buses-table')?.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    buses.forEach(bus => {
        const row = document.createElement('tr');
        
        const numberCell = document.createElement('td');
        numberCell.textContent = bus.number;
        
        const capacityCell = document.createElement('td');
        capacityCell.textContent = bus.capacity;
        
        const typeCell = document.createElement('td');
        typeCell.textContent = bus.type === 'boys' ? 'ছেলেদের' : bus.type === 'girls' ? 'মেয়েদের' : 'মিশ্র';
        
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'মুছে ফেলুন';
        deleteBtn.onclick = () => deleteBus(bus.id);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(numberCell);
        row.appendChild(capacityCell);
        row.appendChild(typeCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Populate audio table
function populateAudioTable(routes) {
    const tableBody = document.getElementById('audio-table')?.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    routes.forEach(route => {
        const row = document.createElement('tr');
        
        const routeCell = document.createElement('td');
        routeCell.textContent = route.name;
        
        const shiftCell = document.createElement('td');
        shiftCell.textContent = route.shift === 'morning' ? 'সকাল' : 'দুপুর';
        
        const audioCell = document.createElement('td');
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = route.audio_path;
        audioCell.appendChild(audio);
        
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'মুছে ফেলুন';
        deleteBtn.onclick = () => deleteAudio(route.id);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(routeCell);
        row.appendChild(shiftCell);
        row.appendChild(audioCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Handle route form submission
async function handleRouteSubmit(e) {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('route-name'),
            shift: formData.get('route-shift')
        };
        
        await window.electronAPI.addRoute(data);
        showStatus('রাস্তা সফলভাবে যোগ করা হয়েছে', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reload data
        await loadInitialData();
    } catch (error) {
        console.error('Error adding route:', error);
        showStatus('রাস্তা যোগ করতে সমস্যা হয়েছে', 'error');
    }
}

// Handle bus form submission
async function handleBusSubmit(e) {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const data = {
            number: formData.get('bus-number'),
            capacity: parseInt(formData.get('bus-capacity')),
            type: formData.get('bus-type')
        };
        
        await window.electronAPI.addBus(data);
        showStatus('বাস সফলভাবে যোগ করা হয়েছে', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reload data
        await loadInitialData();
    } catch (error) {
        console.error('Error adding bus:', error);
        showStatus('বাস যোগ করতে সমস্যা হয়েছে', 'error');
    }
}

// Handle audio form submission
async function handleAudioSubmit(e) {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const routeId = formData.get('audio-route');
        
        if (!routeId) {
            showStatus('রাস্তা নির্বাচন করুন', 'error');
            return;
        }
        
        const audioPath = await window.electronAPI.selectAudioFile();
        if (!audioPath) {
            showStatus('অডিও ফাইল নির্বাচন করুন', 'error');
            return;
        }
        
        await window.electronAPI.updateRoute(routeId, { audio_path: audioPath });
        showStatus('অডিও ফাইল সফলভাবে আপলোড করা হয়েছে', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reload data
        await loadInitialData();
    } catch (error) {
        console.error('Error uploading audio:', error);
        showStatus('অডিও ফাইল আপলোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Delete route
async function deleteRoute(id) {
    try {
        await window.electronAPI.deleteRoute(id);
        showStatus('রাস্তা সফলভাবে মুছে ফেলা হয়েছে', 'success');
        await loadInitialData();
    } catch (error) {
        console.error('Error deleting route:', error);
        showStatus('রাস্তা মুছে ফেলতে সমস্যা হয়েছে', 'error');
    }
}

// Delete bus
async function deleteBus(id) {
    try {
        await window.electronAPI.deleteBus(id);
        showStatus('বাস সফলভাবে মুছে ফেলা হয়েছে', 'success');
        await loadInitialData();
    } catch (error) {
        console.error('Error deleting bus:', error);
        showStatus('বাস মুছে ফেলতে সমস্যা হয়েছে', 'error');
    }
}

// Delete audio
async function deleteAudio(routeId) {
    try {
        await window.electronAPI.updateRoute(routeId, { audio_path: null });
        showStatus('অডিও ফাইল সফলভাবে মুছে ফেলা হয়েছে', 'success');
        await loadInitialData();
    } catch (error) {
        console.error('Error deleting audio:', error);
        showStatus('অডিও ফাইল মুছে ফেলতে সমস্যা হয়েছে', 'error');
    }
}

// Show status message
function showStatus(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add(`status-${type}`);
    
    setTimeout(() => {
        statusMessage.classList.remove(`status-${type}`);
        statusMessage.textContent = '';
    }, 5000);
}

// Listen for refresh-data event
window.electronAPI.on('refresh-data', async () => {
    await loadInitialData();
    showStatus('ডেটা রিফ্রেশ করা হয়েছে', 'success');
}); 