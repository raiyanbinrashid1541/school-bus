// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Display page loaded');
    try {
        // Load initial data
        await loadInitialData();
        
        // Set up auto-refresh
        setInterval(loadInitialData, 30000); // Refresh every 30 seconds
        
        console.log('Display page initialized successfully');
    } catch (error) {
        console.error('Error initializing display page:', error);
        showStatus('ডিসপ্লে পেজ শুরু করতে সমস্যা হয়েছে', 'error');
    }
});

// Load initial data
async function loadInitialData() {
    try {
        console.log('Loading initial data...');
        const [morningAssignments, dayAssignments] = await Promise.all([
            window.electronAPI.getAssignments('morning'),
            window.electronAPI.getAssignments('day')
        ]);
        
        console.log('Assignments loaded:', { morningAssignments, dayAssignments });
        
        populateAssignments(morningAssignments, 'morning');
        populateAssignments(dayAssignments, 'day');
        
        // Update current shift display
        updateCurrentShift();
        
        console.log('Initial data loaded successfully');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showStatus('ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Populate assignments
function populateAssignments(assignments, shift) {
    const container = document.getElementById(`${shift}-assignments`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (assignments.length === 0) {
        const noData = document.createElement('div');
        noData.className = 'no-data';
        noData.textContent = 'কোনো নির্ধারণ নেই';
        container.appendChild(noData);
        return;
    }
    
    assignments.forEach(assignment => {
        const card = document.createElement('div');
        card.className = 'assignment-card';
        
        const routeName = document.createElement('h3');
        routeName.textContent = assignment.route_name;
        card.appendChild(routeName);
        
        if (assignment.boys_bus_number) {
            const boysBus = document.createElement('div');
            boysBus.className = 'bus-info';
            boysBus.innerHTML = `
                <span class="bus-label">ছেলেদের বাস:</span>
                <span class="bus-number">${assignment.boys_bus_number}</span>
            `;
            card.appendChild(boysBus);
        }
        
        if (assignment.girls_bus_number) {
            const girlsBus = document.createElement('div');
            girlsBus.className = 'bus-info';
            girlsBus.innerHTML = `
                <span class="bus-label">মেয়েদের বাস:</span>
                <span class="bus-number">${assignment.girls_bus_number}</span>
            `;
            card.appendChild(girlsBus);
        }
        
        if (assignment.audio_path) {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = assignment.audio_path;
            card.appendChild(audio);
        }
        
        container.appendChild(card);
    });
}

// Update current shift display
function updateCurrentShift() {
    const now = new Date();
    const hour = now.getHours();
    const currentShift = hour < 12 ? 'morning' : 'day';
    
    const morningSection = document.getElementById('morning-section');
    const daySection = document.getElementById('day-section');
    
    if (morningSection && daySection) {
        if (currentShift === 'morning') {
            morningSection.style.display = 'block';
            daySection.style.display = 'none';
        } else {
            morningSection.style.display = 'none';
            daySection.style.display = 'block';
        }
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