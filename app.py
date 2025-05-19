from flask import Flask, request, jsonify, render_template
import os
from flask_cors import CORS

# Import modules
from utils.data_processing import DataProcessor
from utils.disease_processor import DiseaseProcessor
from models.symptom_similarity import SymptomSimilarity
from models.text_analyzer import TextAnalyzer
from utils.install import NLTKLoader

app = Flask(__name__)
CORS(app)

# Install NLTK requirements once and only ONCE!
NLTKLoader.setup_nltk_once()

# Initialize data processor
data_path = os.path.join(os.path.dirname(__file__), 'dataset', 'dataset.csv')
data_processor = DataProcessor(data_path)

data_path_diseases = os.path.join(os.path.dirname(__file__), 'dataset', 'diseases.csv')
disease_processor = DiseaseProcessor(data_path=data_path_diseases)

# Init NLP Models
symptom_similarity_model = SymptomSimilarity(data_processor.get_all_symptoms())
text_analyzer = TextAnalyzer(data_processor.get_all_symptoms())

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/all_symptoms', methods=['POST'])
def get_all_symptoms():
    all_symptoms = data_processor.get_all_symptoms()
    
    return jsonify({
        'all_symptoms' : all_symptoms
    })
    
@app.route('/api/diseases', methods=['POST'])
def get_diseases_w_description():
    all_diseases_w_descripton = disease_processor.get_all_disease()
    
    result = []
    for disease, description in all_diseases_w_descripton.items():
        result.append({"disease": disease,
                       "description": description})
    
    return jsonify(result)
    
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
    
    print(f"Analyzing text: {text}")

    if not text:
        return jsonify({'error': 'No TEXT provided'}), 400
    
    # Extract symptoms from text
    extracted_symptoms = text_analyzer.extract_symptoms(text, top_n=10)
    print(f"Extracted symptoms with scores: {extracted_symptoms}")

    # Check for direct keywords
    direct_matches = text_analyzer.direct_keyword_match(text)
    print(f"Direct matches: {direct_matches}")

    # Combine the results
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
            results.append({
                'symptom': symptom,
                'confidence': 1.0,
                'is_direct_match': True
            })
    
    print(f"Combined symptom results: {results}")
    
    possible_diseases = {}
    disease_details = []
    
    if results:
        # Get list of identified symptoms
        extracted_symptom_names = [r['symptom'] for r in results]
        
        print(f"Sending symptoms to get_possible_diseases: {extracted_symptom_names}")
        
        # Get possible diseases from data processor
        disease_scores = data_processor.get_possible_diseases(extracted_symptom_names)
        
        print(f"Received disease scores (percentages): {disease_scores}")
        
        # Get all disease descriptions
        all_diseases_with_descriptions = disease_processor.get_all_disease()
        
        # Process each disease with its score and add description
        for disease, percentage in disease_scores.items():
            possible_diseases[disease] = float(percentage)
            
            # Get description for this disease if available
            description = all_diseases_with_descriptions.get(disease, "No description available")
            
            # Format the percentage to 1 decimal place
            formatted_percentage = f"{percentage:.1f}%"
            
            disease_details.append({
                "disease": disease,
                "score": float(percentage),  # Raw score for sorting
                "score_display": formatted_percentage,  # Formatted for display
                "description": description
            })
        
        # Sort diseases by score in descending order
        disease_details = sorted(disease_details, key=lambda x: x["score"], reverse=True)
        
        print(f"Final disease details: {disease_details[:3]}...")  # Show first 3 for brevity

    return jsonify({
        'extracted_symptoms': results,
        'possible_diseases': possible_diseases,
        'disease_details': disease_details
    })

@app.route('/api/test_get', methods=['GET'])
def test_get():
    return jsonify({"message": "GET request working"})

if __name__ == '__main__':
    app.run(debug=True)