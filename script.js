// Initialize Chart
let chart = null;

// Load data from localStorage
function loadData() {
    const data = localStorage.getItem('weightData');
    const goal = localStorage.getItem('goalWeight');
    return {
        entries: data ? JSON.parse(data) : [],
        goalWeight: goal ? parseFloat(goal) : null
    };
}

// Save data to localStorage
function saveData(entries, goalWeight) {
    localStorage.setItem('weightData', JSON.stringify(entries));
    if (goalWeight) {
        localStorage.setItem('goalWeight', goalWeight.toString());
    }
}

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Add weight entry
function addEntry() {
    const date = document.getElementById('date').value;
    const weight = parseFloat(document.getElementById('weight').value);

    if (!date || !weight || isNaN(weight)) {
        alert('Vul alsjeblieft een geldige datum en gewicht in.');
        return;
    }

    const { entries, goalWeight } = loadData();

    // Check if entry for this date already exists
    const existingIndex = entries.findIndex(e => e.date === date);
    if (existingIndex !== -1) {
        entries[existingIndex].weight = weight;
    } else {
        entries.push({ date, weight });
    }

    // Sort by date
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    saveData(entries, goalWeight);
    updateUI();

    // Clear input
    document.getElementById('weight').value = '';
    setTodayDate();
}

// Set goal weight
function setGoal() {
    const goal = parseFloat(document.getElementById('goalWeight').value);

    if (!goal || isNaN(goal)) {
        alert('Vul alsjeblieft een geldig doelgewicht in.');
        return;
    }

    const { entries } = loadData();
    saveData(entries, goal);
    updateUI();
}

// Delete entry
function deleteEntry(date) {
    if (confirm(`Weet je zeker dat je de meting van ${date} wilt verwijderen?`)) {
        const { entries, goalWeight } = loadData();
        const filtered = entries.filter(e => e.date !== date);
        saveData(filtered, goalWeight);
        updateUI();
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Weet je zeker dat je ALLE gegevens wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
        localStorage.clear();
        updateUI();
        setTodayDate();
    }
}

// Calculate statistics
function calculateStats() {
    const { entries, goalWeight } = loadData();

    if (entries.length === 0) {
        return {
            current: '-',
            totalLoss: '-',
            remaining: '-',
            weeklyAverage: '-'
        };
    }

    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstWeight = sorted[0].weight;
    const currentWeight = sorted[sorted.length - 1].weight;
    const totalLoss = (firstWeight - currentWeight).toFixed(1);

    let remaining = '-';
    if (goalWeight) {
        remaining = (currentWeight - goalWeight).toFixed(1);
        if (remaining < 0) {
            remaining = 'Je doelgewicht bereikt! 🎉';
        } else {
            remaining += ' kg';
        }
    }

    // Calculate weekly average
    let weeklyAverage = '-';
    if (sorted.length >= 2) {
        const firstDate = new Date(sorted[0].date);
        const lastDate = new Date(sorted[sorted.length - 1].date);
        const daysElapsed = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
        const weeksElapsed = daysElapsed / 7;

        if (weeksElapsed > 0) {
            weeklyAverage = (totalLoss / weeksElapsed).toFixed(2) + ' kg';
        }
    }

    return {
        current: currentWeight.toFixed(1),
        totalLoss: totalLoss,
        remaining,
        weeklyAverage
    };
}

// Update UI
function updateUI() {
    const { entries, goalWeight } = loadData();
    const stats = calculateStats();

    // Update statistics
    document.getElementById('currentWeight').textContent = stats.current + (stats.current !== '-' ? ' kg' : '');
    document.getElementById('totalLoss').textContent = stats.totalLoss + (stats.totalLoss !== '-' ? ' kg' : '');
    document.getElementById('remaining').textContent = stats.remaining;
    document.getElementById('weeklyAverage').textContent = stats.weeklyAverage;

    // Update goal display
    if (goalWeight) {
        document.getElementById('goalDisplay').textContent = `🎯 Doelgewicht: ${goalWeight} kg`;
    } else {
        document.getElementById('goalDisplay').textContent = 'Nog geen doelgewicht ingesteld';
    }

    // Update goal input
    document.getElementById('goalWeight').value = goalWeight || '';

    // Update data list
    updateDataList(entries);

    // Update chart
    updateChart(entries, goalWeight);
}

// Update data list
function updateDataList(entries) {
    const dataList = document.getElementById('dataList');

    if (entries.length === 0) {
        dataList.innerHTML = '<div class="empty-message">Nog geen metingen. Begin met het toevoegen van je huidige gewicht!</div>';
        return;
    }

    dataList.innerHTML = entries.map(entry => `
        <div class="data-item">
            <span class="data-item-date">${formatDate(entry.date)}</span>
            <span class="data-item-weight">${entry.weight} kg</span>
            <button class="data-item-delete" onclick="deleteEntry('${entry.date}')">Verwijderen</button>
        </div>
    `).reverse().join('');
}

// Format date
function formatDate(dateStr) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-NL', options);
}

// Update chart
function updateChart(entries, goalWeight) {
    const ctx = document.getElementById('weightChart').getContext('2d');

    const labels = entries.map(e => formatDate(e.date));
    const data = entries.map(e => e.weight);

    const chartConfig = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gewicht (kg)',
                    data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    };

    // Add goal line if set
    if (goalWeight && entries.length > 0) {
        chartConfig.data.datasets.push({
            label: 'Doelgewicht',
            data: Array(entries.length).fill(goalWeight),
            borderColor: '#ff6b6b',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0
        });
    }

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, chartConfig);
}

// Event listeners
document.getElementById('addBtn').addEventListener('click', addEntry);
document.getElementById('setGoalBtn').addEventListener('click', setGoal);
document.getElementById('clearBtn').addEventListener('click', clearAllData);

// Enter key support
document.getElementById('weight').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addEntry();
});

document.getElementById('goalWeight').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') setGoal();
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTodayDate();
    updateUI();
});
