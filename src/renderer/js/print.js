// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Print page loaded');
    try {
        // Add event listener for print button
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Load print data
        await loadPrintData();
        
        console.log('Print page initialized successfully');
    } catch (error) {
        console.error('Error initializing print page:', error);
        showStatus('প্রিন্ট পেজ শুরু করতে সমস্যা হয়েছে', 'error');
    }
});

// Load print data
async function loadPrintData() {
    try {
        console.log('Loading print data...');
        const printData = await window.electronAPI.getPrintData();
        console.log('Print data loaded:', printData);
        
        populatePrintData(printData);
        
        console.log('Print data loaded successfully');
    } catch (error) {
        console.error('Error loading print data:', error);
        showStatus('প্রিন্ট ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Populate print data
function populatePrintData(data) {
    const morningContainer = document.getElementById('morning-assignments');
    const dayContainer = document.getElementById('day-assignments');
    
    if (morningContainer) {
        morningContainer.innerHTML = '';
        if (data.morning.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'no-data';
            noData.textContent = 'কোনো নির্ধারণ নেই';
            morningContainer.appendChild(noData);
        } else {
            data.morning.forEach(assignment => {
                const row = document.createElement('tr');
                
                const routeCell = document.createElement('td');
                routeCell.textContent = assignment.route_name;
                
                const boysBusCell = document.createElement('td');
                boysBusCell.textContent = assignment.boys_bus_number || '-';
                
                const girlsBusCell = document.createElement('td');
                girlsBusCell.textContent = assignment.girls_bus_number || '-';
                
                row.appendChild(routeCell);
                row.appendChild(boysBusCell);
                row.appendChild(girlsBusCell);
                
                morningContainer.appendChild(row);
            });
        }
    }
    
    if (dayContainer) {
        dayContainer.innerHTML = '';
        if (data.day.length === 0) {
            const noData = document.createElement('div');
            noData.className = 'no-data';
            noData.textContent = 'কোনো নির্ধারণ নেই';
            dayContainer.appendChild(noData);
        } else {
            data.day.forEach(assignment => {
                const row = document.createElement('tr');
                
                const routeCell = document.createElement('td');
                routeCell.textContent = assignment.route_name;
                
                const boysBusCell = document.createElement('td');
                boysBusCell.textContent = assignment.boys_bus_number || '-';
                
                const girlsBusCell = document.createElement('td');
                girlsBusCell.textContent = assignment.girls_bus_number || '-';
                
                row.appendChild(routeCell);
                row.appendChild(boysBusCell);
                row.appendChild(girlsBusCell);
                
                dayContainer.appendChild(row);
            });
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
    await loadPrintData();
    showStatus('ডেটা রিফ্রেশ করা হয়েছে', 'success');
}); 