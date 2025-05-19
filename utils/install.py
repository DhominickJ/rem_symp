import nltk

# try: 
#     nltk.data.find('corpora/stopwords')
#     nltk.data.find('corpora/wordnet')
#     nltk.data.find('taggers/averaged_perceptron_tagger_eng')
#     nltk.data.find('punkt_tab')

# except LookupError:
#     nltk.download('averaged_perceptron_tagger_eng')
#     nltk.download('stopwords')
#     nltk.download('wordnet')
#     nltk.download('punkt')
#     nltk.download('punkt_tab')

class NLTKLoader:
    def setup_nltk_once():
        resources = {
            "punkt": "tokenizers/punkt",
            "wordnet": "corpora/wordnet",
            "stopwords": "corpora/stopwords",
            "averaged_perceptron_tagger": "taggers/averaged_perceptron_tagger",
            "averaged_perceptron_tagger_eng": "taggers/averaged_perceptron_tagger_eng",
            "punkt_tab" : "tokenizers/punkt_tab"
        }

        for name, path in resources.items():
            try:
                nltk.data.find(path)
                print(f"NLTK resource '{name}' is already installed.")
            except LookupError:
                print(f"Downloading NLTK resource: {name}")
                nltk.download(name)