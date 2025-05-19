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

// Function to create a symptom badge
function createSymptomBadge(text, containerId, tooltip = '') {
    const badge = document.createElement('div');
    badge.className = 'symptom-badge';
    badge.textContent = text;
    
    if (tooltip) {
        badge.title = tooltip;
    }
    
    // Add click handler to toggle selection
    badge.addEventListener('click', () => toggleSelectedSymptom(text));
    
    document.getElementById(containerId).appendChild(badge);
}

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
            badge.className = 'symptom-badge flex items-center';
            
            const text = document.createElement('span');
            text.textContent = symptom;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'ml-1.5 cursor-pointer text-xs opacity-70 hover:opacity-100';
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