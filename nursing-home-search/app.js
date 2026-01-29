let facilities = [];

async function init() {
    try {
        const response = await fetch('facilities.json');
        facilities = await response.json();
        renderCountyList();
        setupSearch();
        setupClearButton();
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

function renderCountyList() {
    const countyList = document.getElementById('county-list');

    // Get unique counties with counts
    const countyCounts = {};
    facilities.forEach(f => {
        const county = f.county || 'Unknown';
        countyCounts[county] = (countyCounts[county] || 0) + 1;
    });

    // Sort counties alphabetically
    const sortedCounties = Object.keys(countyCounts).sort();

    countyList.innerHTML = sortedCounties.map(county => `
        <a href="#" class="county-link" data-county="${county}">
            ${county}
            <span class="county-count">(${countyCounts[county]})</span>
        </a>
    `).join('');

    // Add click handlers
    countyList.querySelectorAll('.county-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const county = e.currentTarget.dataset.county;
            showCountyFacilities(county);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = facilities.filter(f => {
            const name = (f.facility_name || '').toLowerCase();
            const town = (f.town || '').toLowerCase();
            return name.includes(query) || town.includes(query);
        }).slice(0, 10);

        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        } else {
            searchResults.innerHTML = matches.map(f => `
                <div class="search-result-item" data-license="${f.license_no}">
                    <div class="search-result-name">${f.facility_name || 'Unknown'}</div>
                    <div class="search-result-location">${f.town || ''}, ${f.county || ''} County</div>
                </div>
            `).join('');

            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const license = item.dataset.license;
                    const facility = facilities.find(f => f.license_no === license);
                    if (facility) {
                        showFacilityDetail(facility);
                        searchResults.classList.add('hidden');
                        searchInput.value = '';
                    }
                });
            });
        }

        searchResults.classList.remove('hidden');
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
}

function setupClearButton() {
    document.getElementById('clear-results').addEventListener('click', () => {
        document.getElementById('facility-list').classList.add('hidden');
    });
}

function showCountyFacilities(county) {
    const countyFacilities = facilities.filter(f => f.county === county);

    document.getElementById('results-title').textContent = `${county} County (${countyFacilities.length} facilities)`;

    const cardsContainer = document.getElementById('facility-cards');
    cardsContainer.innerHTML = countyFacilities.map(f => createFacilityCard(f)).join('');

    document.getElementById('facility-list').classList.remove('hidden');
    document.getElementById('facility-list').scrollIntoView({ behavior: 'smooth' });
}

function showFacilityDetail(facility) {
    document.getElementById('results-title').textContent = 'Search Result';

    const cardsContainer = document.getElementById('facility-cards');
    cardsContainer.innerHTML = createFacilityCard(facility);

    document.getElementById('facility-list').classList.remove('hidden');
    document.getElementById('facility-list').scrollIntoView({ behavior: 'smooth' });
}

function createFacilityCard(f) {
    const details = [
        { label: 'Address', value: f.address },
        { label: 'Town', value: f.town },
        { label: 'County', value: f.county },
        { label: 'Zip Code', value: f.zip_code },
        { label: 'Phone', value: f.phone },
        { label: 'Fax', value: f.fax },
        { label: 'License No', value: f.license_no },
        { label: 'Total Beds', value: f.total_beds },
        { label: 'Licensee', value: f.licensee },
        { label: 'Administrator', value: f.administrator },
        { label: 'Services', value: f.services },
        { label: 'Accreditation', value: f.accreditation }
    ].filter(d => d.value);

    return `
        <div class="facility-card">
            <div class="facility-name">${f.facility_name || 'Unknown Facility'}</div>
            <div class="facility-details">
                ${details.map(d => `
                    <div class="facility-detail">
                        <span class="facility-detail-label">${d.label}:</span>
                        <span class="facility-detail-value">${d.value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Initialize the app
init();
