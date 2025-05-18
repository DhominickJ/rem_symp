# RELATIVE ENGINE FOR MEDICAL-SYMPTOMS (REM) 

### Submitted by with 🩵:
- Artacho, Cristopher Ian
- Billena, Dhominick John
- Galvez, Khee Jay
- Tacuel, Allan Andrews

### API Documentation

This document provides detailed information about the Medical Symptom API, including endpoints, request/response formats, and usage instructions for frontend integration.

## Overview

The API provides functionality to analyze medical symptoms, extract symptoms from text, and get information about possible related diseases. It uses both co-occurrence data and semantic similarity models to provide comprehensive symptom analysis.

## Base URL

```
http://localhost:5000
```

## API Endpoints

### 1. Get Related Symptoms

Finds related symptoms based on symptom co-occurrence data and semantic similarity.

**Endpoint:** `/api/related_symptoms`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Payload

```json
{
  "symptom": "string"  // The symptom to find related symptoms for
}
```

#### Response Format

```json
{
  "symptom": "string",  // The original symptom query (normalized to lowercase)
  "cooccurence_related": [
    {
      "symptom": "string",  // Related symptom name
      "score": number       // Co-occurrence score (0-1)
    }
  ],
  "semantic_related": [
    {
      "symptom": "string",  // Related symptom name
      "score": number       // Semantic similarity score (0-1)
    }
  ]
}
```

#### Example Request

```javascript
fetch('http://localhost:5000/api/related_symptoms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symptom: "headache"
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Example Response

```json
{
  "symptom": "headache",
  "cooccurence_related": [
    { "symptom": "nausea", "score": 0.85 },
    { "symptom": "dizziness", "score": 0.78 },
    { "symptom": "fever", "score": 0.72 }
  ],
  "semantic_related": [
    { "symptom": "migraine", "score": 0.92 },
    { "symptom": "pain in temples", "score": 0.87 },
    { "symptom": "pressure in head", "score": 0.76 }
  ]
}
```

### 2. Analyze Text for Symptoms

Extracts potential symptoms from free-text input and identifies possible diseases.

**Endpoint:** `/api/analyze_text`  
**Method:** `POST`  
**Content-Type:** `application/json`

#### Request Format

```json
{
  "text": "string"
}
```

#### Response Format

```json
{
  "extracted_symptoms": [
    {
      "symptom": "string",      // Extracted symptom name
      "confidence": number,     // Confidence score (0-1)
      "is_direct_match": boolean // Whether the symptom was directly mentioned
    }
  ],
  "possible_diseases": {
    "disease_name": number  // For each disease, a score indicating likelihood (0-1)
  }
}
```

#### Example Request

```javascript
fetch('http://localhost:5000/api/analyze_text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "I've been having a terrible headache and feeling nauseous for the past two days."
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Example Response

```json
{
  "extracted_symptoms": [
    { "symptom": "headache", "confidence": 0.95, "is_direct_match": true },
    { "symptom": "nausea", "confidence": 0.92, "is_direct_match": true },
    { "symptom": "fatigue", "confidence": 0.68, "is_direct_match": false }
  ],
  "possible_diseases": {
    "migraine": 0.87,
    "influenza": 0.65,
    "dehydration": 0.52
  }
}
```

### 3. Test Endpoint

Simple test endpoint to check if the API is working.

**Endpoint:** `/api/test_get`  
**Method:** `GET`

#### Response Format

```json
{
  "message": "GET request working"
}
```

## Frontend Integration Guidelines

### Setup

1. Make sure you have CORS enabled on both your frontend and backend.
2. The backend must be running on port 5000 for the API requests to work as documented.

### Working with the API

#### Error Handling

Both main endpoints will return a 400 status code if the required fields (`symptom` or `text`) are missing:

```json
{
  "error": "No Symptom Provided"
}
```

or

```json
{
  "error": "No TEXT provided"
}
```

You should handle these errors appropriately in your frontend code:

```javascript
fetch('http://localhost:5000/api/related_symptoms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symptom: userInput })
})
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => Promise.reject(err));
    }
    return response.json();
  })
  .then(data => {
    // Process successful response
  })
  .catch(error => {
    console.error('Error:', error);
    // Show user-friendly error message
  });
```

#### Displaying Related Symptoms

When displaying related symptoms, consider:

1. Showing co-occurrence and semantic results in separate sections
2. Sorting results by score in descending order
3. Potentially using a threshold value (e.g., only show symptoms with score > 0.3)

```javascript
function displayRelatedSymptoms(data) {
  // Display co-occurrence related symptoms
  const coOccurrenceList = document.getElementById('co-occurrence-list');
  coOccurrenceList.innerHTML = data.cooccurence_related
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0.3)
    .map(item => `<li>${item.symptom} (${(item.score * 100).toFixed(0)}%)</li>`)
    .join('');

  // Display semantic related symptoms
  const semanticList = document.getElementById('semantic-list');
  semanticList.innerHTML = data.semantic_related
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0.3)
    .map(item => `<li>${item.symptom} (${(item.score * 100).toFixed(0)}%)</li>`)
    .join('');
}
```

#### Working with Text Analysis

When handling text analysis results:

1. Highlight direct matches differently than inferred symptoms
2. Consider displaying confidence scores as percentages
3. Order possible diseases by likelihood

```javascript
function displayAnalysisResults(data) {
  // Display extracted symptoms
  const symptomsList = document.getElementById('symptoms-list');
  symptomsList.innerHTML = data.extracted_symptoms
    .sort((a, b) => b.confidence - a.confidence)
    .map(item => {
      const confidencePercent = (item.confidence * 100).toFixed(0);
      const className = item.is_direct_match ? 'direct-match' : 'inferred';
      return `<li class="${className}">${item.symptom} (${confidencePercent}%)</li>`;
    })
    .join('');

  // Display possible diseases
  const diseasesList = document.getElementById('diseases-list');
  diseasesList.innerHTML = Object.entries(data.possible_diseases)
    .sort((a, b) => b[1] - a[1])
    .map(([disease, score]) => {
      const scorePercent = (score * 100).toFixed(0);
      return `<li>${disease} (${scorePercent}%)</li>`;
    })
    .join('');
}
```

## Data Structures

### Symptoms
The API works with a set of predefined symptoms from the dataset. Each symptom is a string representing a medical symptom (e.g., "headache", "fever").

### Diseases
The API can identify potential diseases based on extracted symptoms. Each disease is returned with a score indicating the likelihood of the disease given the symptoms.

## Implementation Notes

1. The backend uses both co-occurrence data and semantic similarity to identify related symptoms.
2. When analyzing text, the system looks for direct keyword matches as well as semantic inferences.
3. Disease prediction is based on the symptoms extracted from text.

## Limitations

1. The API's accuracy depends on the quality and coverage of the underlying dataset.
2. The symptom extraction may miss complex or ambiguous symptom descriptions.
3. Disease predictions are probabilistic and should not be used for medical diagnosis without professional consultation.

## Debugging Tips

1. Use the `/api/test_get` endpoint to verify that the API is running and accessible.
2. Check for CORS issues if you encounter problems connecting from your frontend.
3. Inspect the `network` tab in your browser's developer tools to see the exact requests and responses.
