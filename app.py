# app.py
from flask import Flask, render_template, request, jsonify
import os
import json
from flask_cors import CORS

# Import our modules
from utils.data_processing import DataProcessor
from models.symptom_similarity import SymptomSimilarity
from models.text_analyzer import TextAnalyzer

app = Flask(__name__)
CORS(app)


# Initialize data processor
data_path = os.path.join(os.path.dirname(__file__), 'dataset', 'dataset.csv')
data_processor = DataProcessor(data_path)

# Initialize NLP models
symptom_similarity_model = SymptomSimilarity(data_processor.get_all_symptoms())
text_analyzer = TextAnalyzer(data_processor.get_all_symptoms())

@app.route('/')
def index():
    """Render the main page."""
    # Get all symptoms for dropdown
    all_symptoms = data_processor.get_all_symptoms()
    return render_template('index.html', symptoms=all_symptoms)

@app.route('/api/symptoms', methods=['GET'])
def get_symptoms():
    """Get all symptoms."""
    # Get all symptoms from the data processor
    all_symptoms = data_processor.get_all_symptoms()
    return jsonify(all_symptoms)

@app.route('/api/related_symptoms', methods=['POST'])
def get_related_symptoms():
    """Get related symptoms for a given list of symptoms."""
    data = request.json
    raw_symptoms = data.get('symptoms')

    if not raw_symptoms or not isinstance(raw_symptoms, list):
        return jsonify({'error': 'No symptoms provided or invalid format'}), 400

    # Lowercase and clean up symptoms
    symptoms = [s.lower() for s in raw_symptoms if isinstance(s, str)]

    # Get related symptoms using both models
    cooccurrence_symptoms = data_processor.get_related_symptoms(symptoms, top_n=5)

    # Get semantic related symptoms for the group
    semantic_symptoms = []
    similar_symptoms = symptom_similarity_model.get_similar_symptoms(symptoms, top_n=5)
    for symptom, score in similar_symptoms:
        semantic_symptoms.append({'symptom': symptom, 'score': float(score)})

    return jsonify({
        'symptoms': symptoms,
        'cooccurrence_related': cooccurrence_symptoms,
        'semantic_related': semantic_symptoms
    })

@app.route('/api/analyze_text', methods=['POST'])
def analyze_text():
    """Analyze user text and extract symptoms."""
    data = request.json
    text = data.get('text')

    print(text)

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Extract symptoms from text
    extracted_symptoms = text_analyzer.extract_symptoms(text, top_n=7)

    # Also check for direct keyword matches
    direct_matches = text_analyzer.direct_keyword_match(text)
    # Clean up direct matches by removing underscores
    direct_matches = [match.replace('_', ' ') for match in direct_matches]

    # Combine results
    results = []
    for symptom, score in extracted_symptoms:
        result = {
            'symptom': symptom,
            'confidence': float(score),
            'is_direct_match': symptom in direct_matches
        }
        results.append(result)

    # If there are direct matches not in extracted symptoms, add them
    for symptom in direct_matches:
        if symptom not in [r['symptom'] for r in results]:
            results.append({
                'symptom': symptom,
                'confidence': 1.0,
                'is_direct_match': True
            })

    # Get possible diseases based on extracted symptoms
    possible_diseases = {}
    if results:
        extracted_symptom_names = [r['symptom'] for r in results]
        disease_scores = data_processor.get_possible_diseases(extracted_symptom_names)
        for disease, score in disease_scores.items():
            possible_diseases[disease] = float(score)

    return jsonify({
        'extracted_symptoms': results,
        'possible_diseases': possible_diseases
    })

@app.route('/api/get', methods=['get'])
def textMessage():
    return jsonify({'message': 'Hello, request ok'}), 200

if __name__ == '__main__':
    app.run(debug=True)
