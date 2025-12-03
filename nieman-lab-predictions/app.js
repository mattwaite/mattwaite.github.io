document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('resultsArea');

    let data = null;

    // Fetch the data
    fetch('data.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            console.log('Data loaded:', data.stories.length, 'stories');
        })
        .catch(error => {
            console.error('Error loading data:', error);
            resultsArea.innerHTML = '<p class="empty-state" style="color: #ef4444;">Error loading data. Please try refreshing the page.</p>';
        });

    // Search handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (!data) return;

        if (query.length === 0) {
            resultsArea.innerHTML = '<div class="empty-state"><p>Type a word above to explore the predictions.</p></div>';
            return;
        }

        // Simple single-word search for now as per requirements ("search for a non stopword")
        // We can split by space and take the last word or first word, but let's assume single word input or handle the whole string if it matches a token.
        // The requirement says "search for a non stopword", implying a single word.
        // Let's try to find the exact match in the index.

        const word = query.split(/\s+/)[0]; // Take the first token if multiple

        if (!word) return;

        const result = data.index[word];

        if (result) {
            renderResults(word, result);
        } else {
            resultsArea.innerHTML = `<div class="empty-state"><p>No stories found containing "${word}". Try another word.</p></div>`;
        }
    });

    function renderResults(word, result) {
        const count = result.count;
        const storyIds = result.ids;

        let html = `
            <div class="result-count">
                Found <span class="highlight">${count}</span> occurrences of "<span class="highlight">${word}</span>"
            </div>
        `;

        storyIds.forEach(id => {
            const story = data.stories[id];
            html += `
                <div class="story-card">
                    <h2 class="story-title">
                        <a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a>
                    </h2>
                    <p class="story-author">
                        By <a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.author}</a>
                    </p>
                </div>
            `;
        });

        resultsArea.innerHTML = html;
    }
});
