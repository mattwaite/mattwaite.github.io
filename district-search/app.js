// Global state
let districtData = [];
let chartInstance = null;

// DOM Elements
const searchInput = document.getElementById('district-search');
const suggestionsBox = document.getElementById('search-suggestions');
const resultsSection = document.getElementById('results-section');
const districtNameHeading = document.getElementById('district-name');
const tableBody = document.getElementById('table-body');
const chartCanvas = document.getElementById('absenteeismChart');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupSearch();
});

function loadData() {
    Papa.parse('district_data.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically converts numbers
        complete: function(results) {
            districtData = results.data;
            console.log("Data loaded:", districtData.length, "districts");
        },
        error: function(error) {
            console.error("Error loading CSV:", error);
            alert("Failed to load data. Please try again later.");
        }
    });
}

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length < 2) {
            suggestionsBox.classList.remove('active');
            return;
        }

        const matches = districtData.filter(district => {
            return district.clean_name && 
                   district.clean_name.toLowerCase().includes(query);
        });

        renderSuggestions(matches);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.remove('active');
        }
    });
}

function renderSuggestions(matches) {
    suggestionsBox.innerHTML = '';
    
    if (matches.length === 0) {
        suggestionsBox.classList.remove('active');
        return;
    }

    matches.forEach(district => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = district.clean_name;
        div.addEventListener('click', () => {
            selectDistrict(district);
        });
        suggestionsBox.appendChild(div);
    });

    suggestionsBox.classList.add('active');
}

function selectDistrict(district) {
    searchInput.value = district.clean_name;
    suggestionsBox.classList.remove('active');
    
    renderDistrictData(district);
    
    // Show results with animation
    resultsSection.classList.remove('hidden');
    // Trigger reflow to restart css animation if needed (simple toggle here)
    setTimeout(() => {
        resultsSection.classList.add('visible');
    }, 10);
}

function renderDistrictData(district) {
    // Update Header
    districtNameHeading.textContent = district.clean_name;

    // Prepare Data for Chart and Table
    // Columns are specific years: 2024-2025, etc.
    // Based on CSV header: clean_name,20242025,20232024,20222023,20212022,20202021,20192020
    const years = ['2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021', '2019-2020'];
    const keys = ['20242025', '20232024', '20222023', '20212022', '20202021', '20192020'];
    
    // Extract values, handling "NA" string if dynamicTyping didn't catch it or if it's literally "NA" in text
    // Since dynamicTyping is on, numbers are numbers, but "NA" might be string "NA" or null depending on PapaParse
    
    const dataPoints = keys.map(key => {
        let val = district[key];
        // Handle various forms of missing data
        if (val === 'NA' || val === null || val === undefined || val === '') {
            return null;
        }
        return parseFloat(val);
    });

    // We want chronological order for the chart (left to right), so reverse lists
    // Current order is Newest -> Oldest. 
    // Chart: Oldest -> Newest usually looks better for trends.
    const chartLabels = [...years].reverse();
    const chartData = [...dataPoints].reverse();

    // Render Table (keep Newest -> Oldest as per CSV columns often preferred for viewing latest data first)
    renderTable(years, dataPoints);

    // Render Chart
    renderChart(district.clean_name, chartLabels, chartData);
}

function renderTable(years, values) {
    tableBody.innerHTML = '';
    
    years.forEach((year, index) => {
        const val = values[index];
        const row = document.createElement('tr');
        
        const yearCell = document.createElement('td');
        yearCell.textContent = year;
        
        const valCell = document.createElement('td');
        valCell.textContent = val !== null ? `${val}%` : 'N/A';
        
        row.appendChild(yearCell);
        row.appendChild(valCell);
        tableBody.appendChild(row);
    });
}

function renderChart(label, labels, data) {
    const ctx = chartCanvas.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chronic Absenteeism Rate (%)',
                data: data,
                borderColor: '#2563eb', // Primary color
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.3 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important for CSS grid layout
            plugins: {
                legend: {
                    display: false // Hide legend since we have one dataset clear from context
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}%`;
                        }
                    },
                    backgroundColor: '#1e293b',
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percent'
                    },
                    grid: {
                        color: '#e2e8f0',
                        borderDash: [5, 5]
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}
