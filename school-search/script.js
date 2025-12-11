document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'district_data.csv';
    let districtData = [];
    const searchInput = document.getElementById('district-search');
    const searchResults = document.getElementById('search-results');
    const dataDisplay = document.getElementById('data-display');
    const districtNameHeader = document.getElementById('district-name');
    const dataTableBody = document.querySelector('#data-table tbody');
    let chartInstance = null;

    // Fetch and parse CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            districtData = results.data;
            console.log('Data loaded:', districtData.length, 'records');
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        const filtered = districtData.filter(row => 
            row.clean_name && row.clean_name.toLowerCase().includes(query)
        );

        displaySearchResults(filtered);
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.classList.remove('active');
            return;
        }

        results.forEach(district => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.textContent = district.clean_name;
            div.addEventListener('click', () => {
                selectDistrict(district);
                searchInput.value = district.clean_name;
                searchResults.classList.remove('active');
            });
            searchResults.appendChild(div);
        });

        searchResults.classList.add('active');
    }

    function selectDistrict(district) {
        // Show the display area
        dataDisplay.classList.remove('hidden');
        // Small timeout to allow the remove hidden to apply before adding visible for transition
        setTimeout(() => {
            dataDisplay.classList.add('visible');
        }, 10);

        districtNameHeader.textContent = district.clean_name;

        // Prepare data for chart and table
        // The CSV columns are years: 20242025, 20232024, etc.
        // We want to extract these.
        const years = ['20192020', '20202021', '20212022', '20222023', '20232024', '20242025'];
        const formattedYears = years.map(y => y.substring(0, 4) + '-' + y.substring(4));
        
        const values = years.map(year => {
            const val = district[year];
            return (val === 'NA' || val === '' || val === undefined) ? null : parseFloat(val);
        });

        updateTable(formattedYears, values);
        updateChart(district.clean_name, formattedYears, values);
    }

    function updateTable(years, values) {
        dataTableBody.innerHTML = '';
        
        // Display in reverse chronological order for the table (newest first)
        for (let i = years.length - 1; i >= 0; i--) {
            const row = document.createElement('tr');
            const yearCell = document.createElement('td');
            const valueCell = document.createElement('td');
            
            yearCell.textContent = years[i];
            valueCell.textContent = values[i] !== null ? values[i] + '%' : 'N/A';
            
            row.appendChild(yearCell);
            row.appendChild(valueCell);
            dataTableBody.appendChild(row);
        }
    }

    function updateChart(label, labels, data) {
        const ctx = document.getElementById('absenteeismChart').getContext('2d');

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
                    borderColor: '#2563eb', // Primary blue
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.3 // Smooth curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            family: "'Inter', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            family: "'Inter', sans-serif"
                        },
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif"
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif"
                            }
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
});
