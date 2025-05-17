import nltk

try: 
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
    nltk.data.find('punkt_tab')

except LookupError:
    nltk.download('averaged_perceptron_tagger_eng')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('punkt')
    nltk.download('punkt_tab')