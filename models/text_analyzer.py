# models/text_analyzer.py
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
import string
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class TextAnalyzer:
    def __init__(self, symptom_list):
        """Initialize the text analyzer with a list of symptoms."""
        self.symptom_list = symptom_list
        self.stopwords = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        
        # Common symptom-related keywords
        self.symptom_keywords = [
            'feel', 'pain', 'ache', 'sore', 'hurt', 'discomfort', 'uncomfortable',
            'symptom', 'suffering', 'experiencing', 'problem', 'issue',
            'chronic', 'acute', 'severe', 'mild', 'moderate', 'intense',
            'constant', 'intermittent', 'occasional', 'frequent', 'persistent'
        ]
        
        self._prepare_symptom_vectors()
    
    def _prepare_symptom_vectors(self):
        """Create TF-IDF vectors for all symptoms."""
        processed_symptoms = [self._preprocess_text(symptom) for symptom in self.symptom_list]
        
        # Create vectorizer and fit to symptom list
        self.vectorizer = TfidfVectorizer()
        self.symptom_vectors = self.vectorizer.fit_transform(processed_symptoms)
    
    def _preprocess_text(self, text):
        """Preprocess text by tokenizing, removing stopwords, and lemmatizing."""
        text = text.lower()
        text = [match.replace('_', ' ') for match in text]
        text = ''.join([char for char in text if char not in string.punctuation])
        
        # Tokenize and remove stopwords
        tokens = word_tokenize(text)
        tokens = [word for word in tokens if word not in self.stopwords]
        
        # Lemmatize
        lemmatized = [self.lemmatizer.lemmatize(word) for word in tokens]

        return ' '.join(lemmatized)
    
    def _extract_potential_symptoms(self, text):
        """Extract potential symptom phrases from text."""
        # Preprocess text
        text = text.lower()
        
        # Split into sentences
        sentences = sent_tokenize(text)
        potential_symptoms = []
        
        for sentence in sentences:
            # Look for symptom-related phrases
            for keyword in self.symptom_keywords:
                if keyword in sentence:
                    # Extract phrases around the keyword
                    pattern = r'(?:(?:\w+\s+){0,3})' + keyword + r'(?:\s+\w+){0,5}'
                    matches = re.findall(pattern, sentence)
                    potential_symptoms.extend(matches)
            
            # Also extract noun phrases as potential symptoms
            words = word_tokenize(sentence)
            tagged = nltk.pos_tag(words)
            
            # Simple noun phrase extraction
            i = 0
            while i < len(tagged):
                if tagged[i][1].startswith('JJ'):  # Adjective
                    phrase = [tagged[i][0]]
                    j = i + 1
                    while j < len(tagged) and tagged[j][1].startswith('NN'):  # Followed by nouns
                        phrase.append(tagged[j][0])
                        j += 1
                    if j > i + 1:  # If phrase contains at least one noun
                        potential_symptoms.append(' '.join(phrase))
                    i = j
                elif tagged[i][1].startswith('NN'):  # Noun
                    phrase = [tagged[i][0]]
                    j = i + 1
                    while j < len(tagged) and tagged[j][1].startswith('NN'):  # More nouns
                        phrase.append(tagged[j][0])
                        j += 1
                    if phrase:
                        potential_symptoms.append(' '.join(phrase))
                    i = j
                else:
                    i += 1
        
        return list(set(potential_symptoms))
    
    def match_symptoms(self, potential_symptoms, threshold=0.3):
        matched_symptoms = []
        
        for phrase in potential_symptoms:
            processed_phrase = self._preprocess_text(phrase)
            
            # Skip very short phrases
            if len(processed_phrase.split()) < 2 and len(processed_phrase) < 5:
                continue
            
            phrase_vector = self.vectorizer.transform([processed_phrase])
            
            # Calculate similarity with all symptoms
            similarities = cosine_similarity(phrase_vector, self.symptom_vectors)[0]
            
            # Find the most similar symptom
            max_idx = np.argmax(similarities)
            max_similarity = similarities[max_idx]
            
            if max_similarity >= threshold:
                matched_symptoms.append((self.symptom_list[max_idx], max_similarity))
        
        # Sort by similarity score and remove duplicates
        matched_symptoms = sorted(list(set(matched_symptoms)), key=lambda x: x[1], reverse=True)
        
        return matched_symptoms
    
    def extract_symptoms(self, text, top_n=5):
        """
        Extract symptoms from user text.
        
        Args:
            text: User input text
            top_n: Maximum number of symptoms to return
            
        Returns:
            List of extracted symptoms with confidence scores
        """
        potential_symptoms = self._extract_potential_symptoms(text)
        matched_symptoms = self.match_symptoms(potential_symptoms)
        
        # Return top N symptoms
        return matched_symptoms[:top_n]
    
    def direct_keyword_match(self, text):
        """
        Directly check if any symptoms from the list appear in the text.
        
        Args:
            text: User input text
            
        Returns:
            List of directly matched symptoms
        """
        text = text.lower()
        direct_matches = []
        
        for symptom in self.symptom_list:
            if symptom.lower() in text:
                direct_matches.append(symptom)
        
        return direct_matches