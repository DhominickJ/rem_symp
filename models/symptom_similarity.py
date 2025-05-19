# models/symptom_similarity.py
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import string

class SymptomSimilarity:
    def __init__(self, symptom_list):
        """Initialize the symptom similarity model with a list of symptoms."""
        self.symptom_list = symptom_list
        self.vectorizer = None
        self.symptom_vectors = None

        # Initialize NLTK resources
        try:
            nltk.data.find('corpora/stopwords')
            nltk.data.find('corpora/wordnet')
            nltk.data.find('taggers/averaged_perceptron_tagger_eng')
        except LookupError:
            nltk.download('averaged_perceptron_tagger_eng')
            nltk.download('stopwords')
            nltk.download('wordnet')
            nltk.download('punkt')

        self.stopwords = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()

        # Preprocess symptoms and create vectors
        self._preprocess_symptoms()

    def _preprocess_text(self, text):
        """Preprocess text by tokenizing, removing stopwords, and lemmatizing."""
        # Convert to lowercase and remove punctuation
        text = text.lower()
        text = [match.replace('_', ' ') for match in text]
        text = ''.join([char for char in text if char not in string.punctuation])

        # Tokenize and remove stopwords
        tokens = nltk.word_tokenize(text)
        tokens = [word for word in tokens if word not in self.stopwords]

        # Lemmatize
        lemmatized = [self.lemmatizer.lemmatize(word) for word in tokens]

        return ' '.join(lemmatized)

    def _preprocess_symptoms(self):
        """Preprocess all symptoms and vectorize them."""
        # Preprocess all symptoms
        processed_symptoms = [self._preprocess_text(symptom) for symptom in self.symptom_list]

        # Create TF-IDF vectors
        self.vectorizer = TfidfVectorizer()
        self.symptom_vectors = self.vectorizer.fit_transform(processed_symptoms)

    def find_similar_symptoms(self, input_text, top_n=5):
        """
        Find symptoms similar to input text.

        Args:
            input_text: User input text
            top_n: Number of similar symptoms to return

        Returns:
            List of similar symptoms
        """
        # Preprocess input text
        processed_text = self._preprocess_text(input_text)

        # Vectorize input text
        input_vector = self.vectorizer.transform([processed_text])

        # Calculate similarity
        similarities = cosine_similarity(input_vector, self.symptom_vectors)[0]

        # Get top similar symptoms
        top_indices = np.argsort(similarities)[::-1][:top_n]
        top_symptoms = [(self.symptom_list[i], similarities[i]) for i in top_indices if similarities[i] > 0]

        return top_symptoms

    def get_similar_symptoms(self, symptoms, top_n=5):
        if isinstance(symptoms, str):
            symptoms = [symptoms]

        # Find indices for valid symptoms in the list
        indices = [self.symptom_list.index(s) for s in symptoms if s in self.symptom_list]
        if not indices:
            return []

        # Sum the vectors for the given symptoms
        target_vector = np.sum(self.symptom_vectors[indices], axis=0)

        # Ensure target_vector is a 2D numpy array
        if hasattr(target_vector, "toarray"):
            target_vector = target_vector.toarray()
        else:
            target_vector = np.asarray(target_vector)
            if target_vector.ndim == 1:
                target_vector = target_vector.reshape(1, -1)

        # Calculate similarity with all symptoms
        similarities = cosine_similarity(target_vector, self.symptom_vectors)[0]

        # Exclude the input symptoms themselves
        exclude_set = set(symptoms)
        top_indices = np.argsort(similarities)[::-1]

        similar_symptoms = []
        for idx in top_indices:
            if self.symptom_list[idx] not in exclude_set and similarities[idx] > 0:
                similar_symptoms.append((self.symptom_list[idx], similarities[idx]))
                if len(similar_symptoms) >= top_n:
                    break

        return similar_symptoms
