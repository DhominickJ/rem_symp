# utils/data_processing.py
import pandas as pd
import numpy as np
from collections import defaultdict
import os

class DataProcessor:
    def __init__(self, data_path):
        """Initialize the data processor with the path to the dataset."""
        self.data_path = data_path
        self.df = None
        self.symptom_list = []
        self.disease_symptom_map = {}
        self.symptom_disease_map = defaultdict(list)
        self.symptom_cooccurrence = None
        self.load_and_process_data()

    def load_and_process_data(self):
        """Load and process the dataset."""
        # Load the dataset
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")

        self.df = pd.read_csv(self.data_path)
        self.df.head()

        # Extract unique symptoms
        symptom_columns = [col for col in self.df.columns if col.startswith('Symptom_')]
        all_symptoms = []

        for col in symptom_columns:
            symptoms = self.df[col].dropna().unique()
            # Replace underscores with spaces in symptoms
            cleaned_symptoms = [symptom.replace('_', ' ') for symptom in symptoms]
            all_symptoms.extend(cleaned_symptoms)

        self.symptom_list = sorted(list(set(all_symptoms)))

        # Create disease-symptom mapping
        for _, row in self.df.iterrows():
            disease = row['Disease']
            symptoms = [row[col] for col in symptom_columns if pd.notna(row[col])]

            # Clean symptoms by replacing underscores with spaces
            symptoms = [symptom.replace('_', ' ') for symptom in symptoms]
            self.disease_symptom_map[disease] = symptoms

            # Create symptom-disease mapping
            for symptom in symptoms:
                self.symptom_disease_map[symptom].append(disease)

        # Create symptom co-occurrence matrix
        self._create_cooccurrence_matrix()

    def _create_cooccurrence_matrix(self):
        """Create a co-occurrence matrix of symptoms."""
        n = len(self.symptom_list)
        symptom_index = {symptom: i for i, symptom in enumerate(self.symptom_list)}

        # Initialize co-occurrence matrix
        self.symptom_cooccurrence = np.zeros((n, n))

        # Fill the co-occurrence matrix
        for disease, symptoms in self.disease_symptom_map.items():
            for i, symptom1 in enumerate(symptoms):
                idx1 = symptom_index.get(symptom1)
                if idx1 is not None:  # Ensure symptom is in our list
                    for symptom2 in symptoms:
                        if symptom1 != symptom2:
                            idx2 = symptom_index.get(symptom2)
                            if idx2 is not None:
                                self.symptom_cooccurrence[idx1, idx2] += 1

    def get_related_symptoms(self, symptoms, top_n=5):
        if not symptoms:
            return []

        symptom_index = {s: i for i, s in enumerate(self.symptom_list)}
        indices = [symptom_index[s] for s in symptoms if s in symptom_index]

        if not indices:
            return []

        # Sum co-occurrence scores for all given symptoms
        scores = np.sum(self.symptom_cooccurrence[indices, :], axis=0)

        # Zero out the input symptoms themselves
        for idx in indices:
            scores[idx] = 0

        # Get top related symptoms
        top_indices = np.argsort(scores)[::-1][:top_n]
        related_symptoms = [self.symptom_list[i] for i in top_indices if scores[i] > 0]

        return related_symptoms

    def get_possible_diseases(self, symptoms):
        """
        Get possible diseases based on a list of symptoms.

        Args:
            symptoms: List of symptoms

        Returns:
            Dictionary of diseases and their match scores
        """
        disease_scores = defaultdict(int)

        for symptom in symptoms:
            for disease in self.symptom_disease_map.get(symptom, []):
                # Increase score for each matching symptom
                disease_scores[disease] += 1

                # Bonus points if the disease has most of these symptoms
                disease_symptoms = self.disease_symptom_map.get(disease, [])
                match_ratio = len(set(symptoms).intersection(disease_symptoms)) / len(disease_symptoms) if disease_symptoms else 0
                disease_scores[disease] += match_ratio

        # Sort by score
        sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_diseases[:10])  # Return top 10 possible diseases

    def get_all_symptoms(self):
        """Get the list of all symptoms."""
        return self.symptom_list
