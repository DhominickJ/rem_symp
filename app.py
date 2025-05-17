from flask import Flask, request, jsonify
import os
import json
from flask_cors import CORS

# Import modules
from utils.data_processing import DataProcessor
from models.symptom_similarity import SymptomSimilarity
from models.text_analyzer import TextAnalyzer

app = Flask(__name__)
CORS(app)

# Initialize data processor
data_path = os.path.join(os.path.dirname(__file__), 'dataset', 'dataset.csv')
data_processor = DataProcessor(data_path)

# Init NLP Models
symptom_similarity_model = SymptomSimilarity(data_processor.get_all_symptoms())
text_analyzer = TextAnalyzer(data_processor.get_all_symptoms())

@app.route('/api/related_symptoms', methods=['POST'])
def get_related_symptoms():
    """Get related symptoms"""
    data = request.json
    raw_symptom = data.get('symptom')
    symptom = raw_symptom.lower()

    if not symptom:
        return jsonify({'error': 'No Symptom Provided'}), 400
    
    # Get related symptom using both models
    cooccurence_symptoms = data_processor.get_related_symptoms(symptom, top_n=10)

    semantic_symptoms = []
    similar_symptoms = symptom_similarity_model.get_similar_symptoms(symptom, top_n=10)
    for symptom, score in similar_symptoms:
        semantic_symptoms.append({'symptom': symptom, 'score': float(score)})

    return jsonify({
        'symptom': symptom,
        'cooccurence_related': cooccurence_symptoms,
        'semantic_related': semantic_symptoms
    })

@app.route('/api/analyze_text', methods=['POST'])
def analyze_text():
    """Analyze user text and extract symptoms"""
    data = request.json
    text = data.get('text')

    if not text:
        return jsonify({'error': 'No TEXT provided'}), 400
    
    # Extract symptoms from text
    extracted_symptoms = text_analyzer.extract_symptoms(text, top_n=10)

    # Check for direct keywords
    direct_matches = text_analyzer.direct_keyword_match(text)

    # Comibne the results
    results = []
    for symptom, score in extracted_symptoms:
        result = {
            'symptom': symptom,
            'confidence': float(score),
            'is_direct_match': symptom in direct_matches
        }
        results.append(result)
    
    # If there are direct matches not in extracted symptoms
    for symptom in direct_matches:
        if symptom not in [r['symptom'] for r in results]:
            results.apend({
                'symptom': symptom,
                'confidence': 1.0,
                'is_direct_match': True
            })
    
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

@app.route('/api/test_get', methods=['GET'])
def test_get():
    return jsonify({"message": "GET request working"})

if __name__ == '__main__':
    app.run(debug=True)