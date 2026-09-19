class SentimentModel:
    def __init__(self):
        pass

    def infer(self, text):
        # Mock sentiment analysis
        if "good" in text.lower() or "great" in text.lower():
            return {"label": "positive", "polarity": 0.8}
        elif "bad" in text.lower() or "terrible" in text.lower():
            return {"label": "negative", "polarity": -0.6}
        else:
            return {"label": "neutral", "polarity": 0.0}