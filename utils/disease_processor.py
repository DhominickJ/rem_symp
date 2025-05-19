# Disease Processing for the WebApp

# Importing pre-processing tools
import pandas as pd
import numpy as np
import os
import re

class DiseaseProcessor:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.disease_dict = {}
        self.load_and_process_data()
    
    def load_and_process_data(self):
        """Load the dataset"""
        
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f'Dataset not Found Lol')
        
        self.df = pd.read_csv(self.data_path)
        
        disease_columns = [col for col in self.df.columns]
        name, desc = disease_columns
        
        for _, row in self.df.iterrows():
            self.disease_dict[row[name]] = row[desc]

    def get_all_disease(self):
        return self.disease_dict
    
data_path = os.path.join('dataset', 'diseases.csv')
full_path = os.path.abspath(data_path)
print(full_path)
diseaseprocessor = DiseaseProcessor(data_path)
print(diseaseprocessor.load_and_process_data())
disease = diseaseprocessor.get_all_disease()

for disease, descrtiption in disease.items():
    print(f"{disease} : {descrtiption}")