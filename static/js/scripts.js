// Load all symptoms into the dropdown when page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch all symptoms from your backend using the new endpoint
        const response = await fetch('/api/all_symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}) // Empty body for POST request
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if the API returned the expected data structure
        if (data && data.all_symptoms && Array.isArray(data.all_symptoms)) {
            populateSymptomDropdown(data.all_symptoms);
            console.log('Symptom dropdown populated with data from API');
        } else {
            throw new Error('Invalid data structure received from API');
        }
        
    } catch (error) {
        console.error('Error loading symptoms:', error);
        // If API fails, populate with sample symptoms as fallback
        const fallbackSymptoms = ['Headache', 'Fever', 'Fatigue', 'Cough', 'Nausea'];
        populateSymptomDropdown(fallbackSymptoms);
        console.warn('Using fallback symptoms due to API error');
    }
    
    // Also fetch diseases data and populate the diseases tab
    try {
        const diseasesResponse = await fetch('/api/diseases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}) // Empty body for POST request
        });
        
        if (diseasesResponse.ok) {
            const diseasesData = await diseasesResponse.json();
            // Store diseases data for later use if needed
            window.allDiseases = diseasesData;
            console.log('Diseases data loaded successfully');
            
            // Populate the diseases tab with the fetched data
            populateDiseasesList(diseasesData);
        }
    } catch (error) {
        console.error('Error loading diseases data:', error);
    }
});

// Function to populate the diseases list in the diseases tab
function populateDiseasesList(diseases) {
    const diseasesContainer = document.getElementById('diseasesContainer');
    
    // Clear any existing content
    diseasesContainer.innerHTML = '';
    
    if (!diseases || diseases.length === 0) {
        diseasesContainer.innerHTML = '<p class="bg-dark3 text-gray-400 text-center py-8">No diseases information available.</p>';
        return;
    }
    
    // Sort diseases alphabetically for better usability
    diseases.sort((a, b) => a.disease.localeCompare(b.disease));
    
    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'mb-4';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search diseases...';
    searchInput.className = 'w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary';
    searchInput.addEventListener('input', function() {
        filterDiseases(this.value.toLowerCase(), diseases);
    });
    
    searchContainer.appendChild(searchInput);
    diseasesContainer.appendChild(searchContainer);
    
    // Create diseases list container
    const diseasesList = document.createElement('div');
    diseasesList.id = 'diseasesList';
    diseasesList.className = 'space-y-4';
    
    // Add each disease to the list
    diseases.forEach(disease => {
        const diseaseCard = createDiseaseCard(disease);
        diseasesList.appendChild(diseaseCard);
    });
    
    diseasesContainer.appendChild(diseasesList);
}

// Function to create a disease card
function createDiseaseCard(disease) {
    const card = document.createElement('div');
    card.className = 'disease-card bg-dark3 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200';
    card.dataset.disease = disease.disease.toLowerCase();
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center cursor-pointer';
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-primary';
    title.textContent = disease.disease;
    
    const expandIcon = document.createElement('div');
    expandIcon.className = 'text-gray-500';
    expandIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
    
    header.appendChild(title);
    header.appendChild(expandIcon);
    
    const content = document.createElement('div');
    content.className = 'disease-content mt-2 text-white p-2 text-sm hidden';
    content.textContent = disease.description || 'No description available.';
    
    // Toggle content visibility on header click
    header.addEventListener('click', () => {
        content.classList.toggle('hidden');
        expandIcon.innerHTML = content.classList.contains('hidden') ? 
            '<i class="fas fa-chevron-down"></i>' : 
            '<i class="fas fa-chevron-up"></i>';
    });
    
    card.appendChild(header);
    card.appendChild(content);
    
    return card;
}

// Function to filter diseases based on search input
function filterDiseases(searchText, originalDiseases) {
    const diseasesList = document.getElementById('diseasesList');
    const cards = diseasesList.querySelectorAll('.disease-card');
    
    if (!searchText) {
        // Show all cards if search is empty
        cards.forEach(card => {
            card.classList.remove('hidden');
        });
        return;
    }
    
    // Hide/show cards based on search
    cards.forEach(card => {
        const diseaseName = card.dataset.disease;
        if (diseaseName.includes(searchText)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Check if there are any visible cards
    const visibleCards = diseasesList.querySelectorAll('.disease-card:not(.hidden)');
    if (visibleCards.length === 0) {
        // If no results found, show a message
        const noResults = document.createElement('div');
        noResults.id = 'noResults';
        noResults.className = 'text-center text-gray-400 py-4';
        noResults.textContent = 'No diseases found matching your search.';
        
        // Remove any existing no results message
        const existingNoResults = diseasesList.querySelector('#noResults');
        if (existingNoResults) {
            existingNoResults.remove();
        }
        
        diseasesList.appendChild(noResults);
    } else {
        // Remove the no results message if it exists
        const existingNoResults = diseasesList.querySelector('#noResults');
        if (existingNoResults) {
            existingNoResults.remove();
        }
    }
}

function populateSymptomDropdown(symptoms) {
    const select = document.getElementById('symptomSelect');
    
    // Keep the default option
    const defaultOption = select.querySelector('option');
    
    // Clear other options if any
    select.innerHTML = '';
    select.appendChild(defaultOption);
    
    // Sort symptoms alphabetically for better usability
    symptoms.sort();
    
    // Add symptoms as options
    symptoms.forEach(symptom => {
        const option = document.createElement('option');
        option.value = symptom;
        option.textContent = symptom;
        select.appendChild(option);
    });
}

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.querySelector('i').classList.remove('text-primary');
            btn.querySelector('i').classList.add('text-gray-400');
            btn.querySelector('span').classList.remove('text-primary');
            btn.querySelector('span').classList.add('text-gray-400');
            btn.querySelector('div:last-child').classList.remove('bg-primary');
            btn.querySelector('div:last-child').classList.add('bg-transparent');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        button.querySelector('i').classList.remove('text-gray-400');
        button.querySelector('i').classList.add('text-primary');
        button.querySelector('span').classList.remove('text-gray-400');
        button.querySelector('span').classList.add('text-primary');
        button.querySelector('div:last-child').classList.remove('bg-transparent');
        button.querySelector('div:last-child').classList.add('bg-primary');
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active', 'fade-in');
        });
        
        // Show the selected tab content
        const tabId = button.getAttribute('data-tab');
        const tab = document.getElementById(tabId);
        tab.classList.add('active');
        setTimeout(() => tab.classList.add('fade-in'), 10);
    });
});

// Store selected symptoms
const selectedSymptoms = new Set();

// Event listener for finding related symptoms
document.getElementById('findRelatedBtn').addEventListener('click', async function() {
    const symptom = document.getElementById('symptomSelect').value;
    if (!symptom) {
        alert('Please select a symptom first.');
        return;
    }
    
    // Show loading state
    const button = this;
    button.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i> Finding...';
    button.disabled = true;
    
    try {
        // Make actual API call to Flask backend
        const response = await fetch('/api/related_symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symptom: symptom })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display results using the API response
        displayRelatedSymptoms(symptom, data);
    } catch (error) {
        console.error('Error fetching related symptoms:', error);
        alert('Failed to fetch related symptoms. Please try again.');
    } finally {
        // Reset button state
        button.innerHTML = 'Find Related Symptoms';
        button.disabled = false;
    }
});

// Event listener for analyzing text
document.getElementById('analyzeTextBtn').addEventListener('click', async function() {
    const text = document.getElementById('symptomsText').value.trim();
    if (!text) {
        alert('Please describe your symptoms first.');
        return;
    }
    
    // Show loading state
    const button = this;
    button.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i> Analyzing...';
    button.disabled = true;
    
    try {
        // Make actual API call to Flask backend
        const response = await fetch('/api/analyze_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display results using the API response
        displayExtractedSymptoms(data);
    } catch (error) {
        console.error('Error analyzing symptoms text:', error);
        alert('Failed to analyze symptoms. Please try again.');
    } finally {
        // Reset button state
        button.innerHTML = 'Analyze My Symptoms';
        button.disabled = false;
    }
});

// Event listener for analyzing selected symptoms
document.getElementById('analyzeSelectedBtn').addEventListener('click', async function() {
    if (selectedSymptoms.size === 0) {
        alert('Please select at least one symptom first.');
        return;
    }
    
    // Show loading state
    const button = this;
    button.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i> Analyzing...';
    button.disabled = true;
    
    try {
        // For the selected symptoms analysis, we'll use the analyze_text endpoint
        // We're just sending the symptoms as a comma-separated string
        const symptomsText = Array.from(selectedSymptoms).join(', ');
        
        const response = await fetch('/api/analyze_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: symptomsText })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display analysis results
        displaySelectedAnalysisResults(data);
    } catch (error) {
        console.error('Error analyzing selected symptoms:', error);
        alert('Failed to analyze selected symptoms. Please try again.');
    } finally {
        // Reset button state
        button.innerHTML = 'Analyze Selected';
        button.disabled = false;
    }
});

// Event listener for clearing selected symptoms
document.getElementById('clearSelectedBtn').addEventListener('click', function() {
    selectedSymptoms.clear();
    updateSelectedSymptomsUI();
});

// Function to display related symptoms from API response
function displayRelatedSymptoms(symptom, apiData) {
    // Clear previous results
    document.getElementById('cooccurrenceSymptoms').innerHTML = '';
    document.getElementById('semanticSymptoms').innerHTML = '';
    
    // Check if we have data to display
    if (apiData) {
        // Display co-occurrence related symptoms
        if (apiData.cooccurence_related && apiData.cooccurence_related.length > 0) {
            apiData.cooccurence_related.forEach(symptom => {
                createSymptomBadge(symptom, 'cooccurrenceSymptoms', 'related');
            });
            document.getElementById('noCooccurrence').classList.add('hidden');
        } else {
            document.getElementById('noCooccurrence').classList.remove('hidden');
        }
        
        // Display semantically related symptoms
        if (apiData.semantic_related && apiData.semantic_related.length > 0) {
            apiData.semantic_related.forEach(item => {
                createSymptomBadge(item.symptom, 'semanticSymptoms', 'related', `Similarity: ${(item.score * 100).toFixed(0)}%`);
            });
            document.getElementById('noSemantic').classList.add('hidden');
        } else {
            document.getElementById('noSemantic').classList.remove('hidden');
        }
        
        document.getElementById('relatedSymptomsContainer').classList.remove('hidden');
        document.getElementById('noRelatedFound').classList.add('hidden');
    } else {
        document.getElementById('relatedSymptomsContainer').classList.add('hidden');
        document.getElementById('noRelatedFound').classList.remove('hidden');
    }
    
    // Show result container
    document.getElementById('relatedSymptomsResult').classList.remove('hidden');
}

// Function to display extracted symptoms from text analysis API response
function displayExtractedSymptoms(apiData) {
    // Clear previous results
    document.getElementById('extractedSymptoms').innerHTML = '';
    document.getElementById('possibleDiseases').innerHTML = '';
    
    if (apiData && apiData.extracted_symptoms && apiData.extracted_symptoms.length > 0) {
        // Display extracted symptoms
        apiData.extracted_symptoms.forEach(item => {
            createSymptomBadge(
                item.symptom, 
                'extractedSymptoms', 
                'extracted', 
                `Confidence: ${(item.confidence * 100).toFixed(0)}%`
            );
        });
        
        // Display possible diseases if any
        if (apiData.possible_diseases && Object.keys(apiData.possible_diseases).length > 0) {
            displayPossibleDiseases(apiData.possible_diseases, 'possibleDiseases');
        } else {
            document.getElementById('possibleDiseases').innerHTML = '<p class="text-gray-400 text-sm">No associated conditions found.</p>';
        }
        
        document.getElementById('extractedSymptomsContainer').classList.remove('hidden');
        document.getElementById('noSymptomsFound').classList.add('hidden');
    } else {
        document.getElementById('extractedSymptomsContainer').classList.add('hidden');
        document.getElementById('noSymptomsFound').classList.remove('hidden');
    }
    
    // Show result container
    document.getElementById('textAnalysisResult').classList.remove('hidden');
}

// Function to display selected symptoms analysis from API response
function displaySelectedAnalysisResults(apiData) {
    // Clear previous results
    document.getElementById('selectedPossibleDiseases').innerHTML = '';
    
    if (apiData && apiData.possible_diseases && Object.keys(apiData.possible_diseases).length > 0) {
        displayPossibleDiseases(apiData.possible_diseases, 'selectedPossibleDiseases');
    } else {
        document.getElementById('selectedPossibleDiseases').innerHTML = '<p class="text-gray-400 text-sm">No associated conditions found.</p>';
    }
    
    // Show results container
    document.getElementById('selectedAnalysisResults').classList.remove('hidden');
}

// Function to display possible diseases
function displayPossibleDiseases(diseases, containerId) {
    // Sort diseases by score
    const sorted = Object.entries(diseases).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        return;
    }
    
    const maxScore = sorted[0][1];
    
    // Display each disease
    sorted.forEach(([disease, score]) => {
        const normalized = (score / maxScore) * 100;
        
        const item = document.createElement('div');
        item.className = 'disease-item';
        
        const name = document.createElement('div');
        name.className = 'font-medium mb-1.5';
        name.textContent = disease;
        
        const scoreBar = document.createElement('div');
        scoreBar.className = 'flex items-center';
        
        const scoreText = document.createElement('span');
        scoreText.className = 'text-xs text-gray-400 w-8 text-right mr-2';
        scoreText.textContent = score.toFixed(1);
        
        const barContainer = document.createElement('div');
        barContainer.className = 'flex-1 bg-dark3 rounded-full h-2 overflow-hidden';
        
        const barFill = document.createElement('div');
        barFill.className = 'confidence-bar-fill h-full';
        barFill.style.width = `${normalized}%`;
        barFill.style.background = `linear-gradient(90deg, #05a8f7, #02567b)`;
        
        barContainer.appendChild(barFill);
        scoreBar.appendChild(scoreText);
        scoreBar.appendChild(barContainer);
        
        item.appendChild(name);
        item.appendChild(scoreBar);
        
        document.getElementById(containerId).appendChild(item);
    });
}

// Function to create a symptom badge
function createSymptomBadge(text, containerId, type, tooltip = '') {
    const badge = document.createElement('div');
    
    // Apply different styling based on the type
    if (type === 'related') {
        // Bubble-like design with primary background and white text for related symptoms
        badge.className = 'symptom-badge bg-primary text-white rounded-full px-4 py-2 m-1 inline-block cursor-pointer transition-transform hover:scale-105';
    } else {
        // Keep the original styling for other types
        badge.className = 'symptom-badge';
    }
    
    badge.textContent = text;
    
    if (tooltip) {
        badge.title = tooltip;
    }
    
    // Add click handler to toggle selection
    badge.addEventListener('click', () => toggleSelectedSymptom(text));
    
    document.getElementById(containerId).appendChild(badge);
}

// Function to toggle a symptom in selected list
function toggleSelectedSymptom(symptom) {
    if (selectedSymptoms.has(symptom)) {
        selectedSymptoms.delete(symptom);
    } else {
        selectedSymptoms.add(symptom);
    }
    updateSelectedSymptomsUI();
}

// Function to update selected symptoms UI
function updateSelectedSymptomsUI() {
    const container = document.getElementById('selectedSymptoms');
    container.innerHTML = '';
    
    if (selectedSymptoms.size > 0) {
        selectedSymptoms.forEach(symptom => {
            const badge = document.createElement('div');
            // Use the same bubble-like design for selected symptoms
            badge.className = 'symptom-badge bg-primary text-white rounded-full px-4 py-2 m-1 inline-block flex items-center';
            
            const text = document.createElement('span');
            text.textContent = symptom;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'ml-1.5 cursor-pointer text-xs text-white hover:text-gray-200';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedSymptoms.delete(symptom);
                updateSelectedSymptomsUI();
            });
            
            badge.appendChild(text);
            badge.appendChild(removeBtn);
            container.appendChild(badge);
        });
        
        document.getElementById('selectedSymptomsActions').classList.remove('hidden');
        document.getElementById('noSelectedSymptoms').classList.add('hidden');
        document.getElementById('selectedAnalysisResults').classList.add('hidden');
    } else {
        document.getElementById('selectedSymptomsActions').classList.add('hidden');
        document.getElementById('noSelectedSymptoms').classList.remove('hidden');
        document.getElementById('selectedAnalysisResults').classList.add('hidden');
    }
}