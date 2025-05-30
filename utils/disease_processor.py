# Disease Processing for the WebApp
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
    