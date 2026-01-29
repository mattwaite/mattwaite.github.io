document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('resultsSection');
    const ctx = document.getElementById('countyChart').getContext('2d');

    let allFacilities = [];
    let countyChart = null;

    // Fetch Data
    fetch('facilities.json')
        .then(response => response.json())
        .then(data => {
            allFacilities = data;
            initializeChart(data);
            // Optionally render all or top results initially, or just wait for search
            // The prompt implies "display the results below the search" after searching. 
            // So we can leave it empty or show a "Search to see results" message. 
            // Let's show nothing initially or maybe top 10 just to show something works?
            // "people can search ... and display the results below" -> implies reactive. 
        })
        .catch(error => console.error('Error loading data:', error));

    // Search Event Listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        } else {
            // Live search
            performSearch();
        }
    });

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        resultsSection.innerHTML = '';

        if (!query) {
            // If empty, maybe clear results?
            return;
        }

        const filtered = allFacilities.filter(facility => {
            const town = (facility.town || '').toLowerCase();
            const county = (facility.county || '').toLowerCase();
            return town.includes(query) || county.includes(query);
        });

        displayResults(filtered);
    }

    function displayResults(facilities) {
        if (facilities.length === 0) {
            resultsSection.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-dim);">No facilities found.</p>';
            return;
        }

        facilities.forEach(facility => {
            // Create card
            const card = document.createElement('div');
            card.className = 'facility-card';

            // Icons (using simple SVG strings for portability)
            const mapPinIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>';
            const phoneIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>';
            const bedIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>';

            card.innerHTML = `
                <div class="facility-name">${facility.facility_name}</div>
                <div class="facility-location">${facility.town} · ${facility.county}</div>
                <div class="facility-detail">
                    ${mapPinIcon}
                    <span>${facility.address}</span>
                </div>
                <div class="facility-detail">
                    ${phoneIcon}
                    <span>${facility.phone}</span>
                </div>
                <div class="facility-detail">
                    ${bedIcon}
                    <span>${facility.total_beds} Beds</span>
                </div>
                <div class="facility-type-badge">${facility.facility_type}</div>
            `;
            resultsSection.appendChild(card);
        });
    }

    function initializeChart(data) {
        // Aggregate data by county
        const countyCounts = {};
        data.forEach(item => {
            if (item.county) {
                const county = item.county.toUpperCase();
                countyCounts[county] = (countyCounts[county] || 0) + 1;
            }
        });

        // Convert to arrays and sort
        const sortedCounties = Object.entries(countyCounts)
            .sort((a, b) => b[1] - a[1]) // Sort descending by count
            .slice(0, 15); // Top 15 for readability, or we could do all but it might be crowded

        const labels = sortedCounties.map(item => item[0]);
        const counts = sortedCounties.map(item => item[1]);

        // Create Chart
        countyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Facilities',
                    data: counts,
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: '#ec4899'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Top 15 Counties by Facility Count',
                        color: '#1e293b',
                        font: {
                            size: 16,
                            family: 'Outfit'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    }
});
