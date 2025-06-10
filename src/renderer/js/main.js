// Global variables
let currentShift = 'morning';
let allRoutes = [];
let allBuses = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    try {
        // Set default shift
        currentShift = 'morning';
        
        // Add event listeners for tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log('Found nav tabs for event listeners:', navTabs.length);
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
        
        // Add event listeners for shift toggle
        const shiftTabs = document.querySelectorAll('.shift-tab');
        console.log('Found shift tabs:', shiftTabs.length);
        shiftTabs.forEach(tab => {
            console.log('Adding click listener to shift tab:', tab.getAttribute('data-shift'));
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Shift tab clicked:', e.target);
                const shift = tab.getAttribute('data-shift');
                console.log('Shift from click:', shift);
                switchShift(shift);
            });
        });
        
        // Add event listeners for buttons
        const settingsBtn = document.getElementById('settingsBtn');
        console.log('Found settings button:', settingsBtn);
        if (settingsBtn) {
            settingsBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    console.log('Opening settings page...');
                    const result = await window.electronAPI.openSettingsWindow();
                    console.log('Settings window result:', result);
                    if (!result) {
                        throw new Error('Failed to open settings page');
                    }
                    console.log('Settings page opened successfully');
                } catch (error) {
                    console.error('Error opening settings page:', error);
                    showStatus('সেটিংস পেজ খুলতে সমস্যা হয়েছে', 'error');
                }
            });
        }
        
        const displayBtn = document.getElementById('displayBtn');
        console.log('Found display button:', displayBtn);
        if (displayBtn) {
            displayBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    console.log('Opening display window...');
                    await window.electronAPI.openDisplayWindow();
                    console.log('Display window opened successfully');
                } catch (error) {
                    console.error('Error opening display window:', error);
                    showStatus('ডিসপ্লে উইন্ডো খুলতে সমস্যা হয়েছে', 'error');
                }
            });
        }
        
        const printBtn = document.getElementById('printBtn');
        console.log('Found print button:', printBtn);
        if (printBtn) {
            printBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    console.log('Opening print window...');
                    const printData = await window.electronAPI.getPrintData();
                    await window.electronAPI.openPrintWindow(printData);
                    console.log('Print window opened successfully');
                } catch (error) {
                    console.error('Error opening print window:', error);
                    showStatus('প্রিন্ট উইন্ডো খুলতে সমস্যা হয়েছে', 'error');
                }
            });
        }

        // Add event listeners for save buttons
        const morningSaveBtn = document.getElementById('morning-save-btn');
        const daySaveBtn = document.getElementById('day-save-btn');
        
        if (morningSaveBtn) {
            morningSaveBtn.addEventListener('click', () => saveAssignment('morning'));
        }
        if (daySaveBtn) {
            daySaveBtn.addEventListener('click', () => saveAssignment('day'));
        }

        // Add event listeners for auto-assign buttons
        const morningAutoAssignBtn = document.getElementById('morning-auto-assign-btn');
        const dayAutoAssignBtn = document.getElementById('day-auto-assign-btn');
        
        if (morningAutoAssignBtn) {
            morningAutoAssignBtn.addEventListener('click', () => autoAssign('morning'));
        }
        if (dayAutoAssignBtn) {
            dayAutoAssignBtn.addEventListener('click', () => autoAssign('day'));
        }
        
        // Load initial data
        await loadInitialData();
        
        // Show default tab
        console.log('Showing default tab: assignments-tab');
        switchTab('assignments-tab');
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showStatus('অ্যাপ্লিকেশন শুরু করতে সমস্যা হয়েছে', 'error');
    }
});

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
    
    // Update form visibility
    const morningForm = document.getElementById('morning-form');
    const dayForm = document.getElementById('day-form');
    
    if (morningForm && dayForm) {
        if (shift === 'morning') {
            morningForm.style.display = 'block';
            dayForm.style.display = 'none';
        } else {
            morningForm.style.display = 'none';
            dayForm.style.display = 'block';
        }
    }
    
    // Reload data for the new shift
    loadData();
}

// Load initial data
async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        // Load morning shift data by default
        const [morningRoutes, dayRoutes, buses] = await Promise.all([
            window.electronAPI.getRoutes('morning'),
            window.electronAPI.getRoutes('day'),
            window.electronAPI.getActiveBuses()
        ]);
        
        console.log('Routes and buses loaded:', { morningRoutes, dayRoutes, buses });
        
        allRoutes = { morning: morningRoutes, day: dayRoutes };
        allBuses = buses;
        
        populateRouteSelects(morningRoutes, dayRoutes);
        populateBusSelects(buses);
        
        // Load assignments for both shifts
        console.log('Loading assignments...');
        await loadAssignments();
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showStatus('ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Populate route selects
function populateRouteSelects(morningRoutes, dayRoutes) {
    const morningSelect = document.getElementById('morning-route-select');
    const daySelect = document.getElementById('day-route-select');
    
    if (morningSelect) {
        morningSelect.innerHTML = '<option value="">রাস্তা নির্বাচন করুন</option>';
        morningRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            morningSelect.appendChild(option);
        });
    }
    
    if (daySelect) {
        daySelect.innerHTML = '<option value="">রাস্তা নির্বাচন করুন</option>';
        dayRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            daySelect.appendChild(option);
        });
    }
}

// Populate bus selects
function populateBusSelects(buses) {
    const boysBusSelect = document.getElementById('boys-bus-select');
    const girlsBusSelect = document.getElementById('girls-bus-select');
    
    if (boysBusSelect) {
        boysBusSelect.innerHTML = '<option value="">বাস নির্বাচন করুন</option>';
        buses.filter(bus => bus.type === 'boys' || bus.type === 'mixed').forEach(bus => {
            const option = document.createElement('option');
            option.value = bus.id;
            option.textContent = `${bus.number} (${bus.capacity} আসন)`;
            boysBusSelect.appendChild(option);
        });
    }
    
    if (girlsBusSelect) {
        girlsBusSelect.innerHTML = '<option value="">বাস নির্বাচন করুন</option>';
        buses.filter(bus => bus.type === 'girls' || bus.type === 'mixed').forEach(bus => {
            const option = document.createElement('option');
            option.value = bus.id;
            option.textContent = `${bus.number} (${bus.capacity} আসন)`;
            girlsBusSelect.appendChild(option);
        });
    }
}

// Load assignments
async function loadAssignments() {
    try {
        const [morningAssignments, dayAssignments] = await Promise.all([
            window.electronAPI.getAssignments('morning'),
            window.electronAPI.getAssignments('day')
        ]);
        
        populateAssignmentsTable(morningAssignments, 'morning');
        populateAssignmentsTable(dayAssignments, 'day');
    } catch (error) {
        console.error('Error loading assignments:', error);
        showStatus('নির্ধারণ লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Populate assignments table
function populateAssignmentsTable(assignments, shift) {
    const tableBody = document.getElementById(`${shift}-assignments-table`)?.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        
        const routeCell = document.createElement('td');
        routeCell.textContent = assignment.route_name;
        
        const boysBusCell = document.createElement('td');
        boysBusCell.textContent = assignment.boys_bus_number || '-';
        
        const girlsBusCell = document.createElement('td');
        girlsBusCell.textContent = assignment.girls_bus_number || '-';
        
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = 'মুছে ফেলুন';
        deleteBtn.onclick = () => deleteAssignment(assignment.id);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(routeCell);
        row.appendChild(boysBusCell);
        row.appendChild(girlsBusCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Save assignment
async function saveAssignment(shift) {
    try {
        const routeSelect = document.getElementById(`${shift}-route-select`);
        const boysBusSelect = document.getElementById('boys-bus-select');
        const girlsBusSelect = document.getElementById('girls-bus-select');
        
        if (!routeSelect.value) {
            showStatus('রাস্তা নির্বাচন করুন', 'error');
            return;
        }
        
        if (!boysBusSelect.value && !girlsBusSelect.value) {
            showStatus('কমপক্ষে একটি বাস নির্বাচন করুন', 'error');
            return;
        }
        
        const data = {
            routeId: parseInt(routeSelect.value),
            boysBusId: boysBusSelect.value ? parseInt(boysBusSelect.value) : null,
            girlsBusId: girlsBusSelect.value ? parseInt(girlsBusSelect.value) : null,
            shift: shift
        };
        
        await window.electronAPI.saveAssignment(data);
        showStatus('নির্ধারণ সফলভাবে সংরক্ষিত হয়েছে', 'success');
        
        // Reset form
        routeSelect.value = '';
        boysBusSelect.value = '';
        girlsBusSelect.value = '';
        
        // Reload assignments
        await loadAssignments();
    } catch (error) {
        console.error('Error saving assignment:', error);
        showStatus('নির্ধারণ সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    }
}

// Delete assignment
async function deleteAssignment(id) {
    try {
        await window.electronAPI.deleteAssignment(id);
        showStatus('নির্ধারণ সফলভাবে মুছে ফেলা হয়েছে', 'success');
        await loadAssignments();
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showStatus('নির্ধারণ মুছে ফেলতে সমস্যা হয়েছে', 'error');
    }
}

// Auto assign
async function autoAssign(shift) {
    try {
        await window.electronAPI.autoAssign(shift);
        showStatus('বাসগুলো সফলভাবে নির্ধারণ করা হয়েছে', 'success');
        await loadAssignments();
    } catch (error) {
        console.error('Error auto-assigning buses:', error);
        showStatus('বাস নির্ধারণ করতে সমস্যা হয়েছে', 'error');
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