# Data Processing for NLP Models

#Importing pre-processing tools
import pandas as pd
import numpy as np
from collections import defaultdict
import os
import re

class DataProcessor:
    def __init__(self, data_path):
        # Initialize the important data with the path to the dataset file
        self.data_path = data_path  
        self.df = None
        self.symptom_list = []
        self.disease_symptom_map = {}
        self.symptom_disease_map = defaultdict(list)
        self.symptom_cooccurence = None
        self.load_and_process_data()
        
    def load_and_process_data(self):
        """Preprocess the dataset"""
    
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
        
        self.df = pd.read_csv(self.data_path)
        
        #Containers for the data
        all_symptom = []
        cleaned_dataframe = []
        
        #Extracting unique symptoms for preprocessing
        symptom_columns = [col for col in self.df.columns if col.startswith('Symptom_')]

        
        # Cleaning the symptoms from the dreaded '_'
        for _, row in self.df.iterrows():
            symptoms = [row[col] for col in symptom_columns if pd.notna(row[col])]
            precleaned_symptoms = [symptom.replace('_', ' ') for symptom in symptoms]
            cleaned_symptoms = [re.sub(r'^\s+', '', precleaned).lower() for precleaned in precleaned_symptoms]
            cleaned_dataframe.append(cleaned_symptoms)
        
        cleaned_df = self.df.copy() # Retain original

        for idx, col in enumerate(symptom_columns):
            cleaned_df[col] = [cleaned_dataframe[i][idx] if idx < len(cleaned_dataframe[i]) else None for i in range(len(cleaned_dataframe))]

        self.df = cleaned_df
        print(self.df.head())
                
        for col in symptom_columns:
            symptoms = self.df[col].dropna().unique()
            all_symptom.extend(symptoms)
            
        self.symptom_list = sorted(list(set(all_symptom)))
        
        # Mapping the diseases to symptoms and symptoms to diseases
        for _, row in self.df.iterrows():
            disease = row['Disease']
            symptoms = [row[col] for col in symptom_columns if pd.notna(row[col])]
            
            self.disease_symptom_map[disease] = symptoms
            
            # Create symptoms-disease mapping for each symptom in this row
            for symptom in symptoms:
                if symptom not in self.symptom_disease_map[symptom]:
                    self.symptom_disease_map[symptom].append(disease)
        
        # Debug output to verify mappings
        print(f"Total unique symptoms: {len(self.symptom_list)}")
        print(f"Total diseases mapped: {len(self.disease_symptom_map)}")
        print(f"Total symptoms with disease mappings: {len(self.symptom_disease_map)}")
        
        self._create_cooccurence_matrix()
    
    def _create_cooccurence_matrix(self):
        """Create a co-occurence matrix of symptoms"""
        n = len(self.symptom_list)
        symptom_index = {symptom: i for i, symptom in enumerate(self.symptom_list)}
        
        # Initialize a co-occurence matrix
        self.symptom_cooccurence = np.zeros((n, n))
        
        # Fill the co-occurence matrix
        for disease, symptoms in self.disease_symptom_map.items():
            for i, symptom1 in enumerate(symptoms):
                idx1 = symptom_index.get(symptom1)
                if idx1 is not None: # Ensuring symptom is within the list
                    for symptom2 in symptoms:
                        if symptom1 != symptom2:
                            idx2 = symptom_index.get(symptom2)
                            if idx2 is not None:
                                self.symptom_cooccurence[idx1, idx2] += 1
    
    def get_related_symptoms(self, symptom, top_n = 10):
        """
        Get related symptoms for a given symptoms based on its co-occurence.
        
        Args:
            symptom: the symptom to find related symptoms for
            top_n: Number of related symptoms to return
        Returns: 
            List of related symptoms
        """ 
        
        try:
            symptom_index = {s: i for i, s, in enumerate(self.symptom_list)}
            idx = symptom_index[symptom]
            
            # Get co-occurence scores
            scores = self.symptom_cooccurence[idx]
            
            # Get top related symptoms
            top_indices = np.argsort(scores)[::-1][:top_n]
            related_symptoms = [self.symptom_list[i] for i in top_indices if scores[i] > 0]
            
            return related_symptoms
        except KeyError:
            # If symptom is not found in the dataset
            return []
    
    def get_possible_diseases(self, symptoms, limit=8):
        """
        Get possible diseases based on a list of symptoms.
        
        Args:
            symptoms: list of symptoms
            
        Returns:
            Dictionary of diseases and their match scores
        """
        
        disease_scores = defaultdict(int)
        matched_symptoms_per_disease = defaultdict(list)
        
        for symptom in symptoms:
            # Debug: print symptom and any diseases it maps to
            diseases_for_symptom = self.symptom_disease_map.get(symptom, [])
            # print(f"Symptom '{symptom}' maps to {len(diseases_for_symptom)} diseases: {diseases_for_symptom[:3]}...")
            
            for disease in diseases_for_symptom:
                disease_scores[disease] += 1
                matched_symptoms_per_disease[disease].append(symptom)
                
                # Bonus points if the disease has most of these symptoms
                disease_symptoms = self.disease_symptom_map.get(disease, [])
                match_ratio = len(set(symptoms).intersection(disease_symptoms)) / len(disease_symptoms) if disease_symptoms else 0
                disease_scores[disease] += match_ratio
        
        #Sort by scores
        sorted_diseases = sorted(disease_scores.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_diseases[:limit])
    
    def get_all_symptoms(self):
        """As the name implies"""
        return self.symptom_list