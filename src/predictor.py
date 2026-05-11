
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import io
import json

class ShopperIntentionModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.label_encoders = {}
        self.features = [
            'Administrative', 'Administrative_Duration', 'Informational',
            'Informational_Duration', 'ProductRelated', 'ProductRelated_Duration',
            'BounceRates', 'ExitRates', 'PageValues', 'SpecialDay',
            'Month', 'OperatingSystems', 'Browser', 'Region', 'TrafficType',
            'VisitorType', 'Weekend'
        ]

    def preprocess(self, df):
        df_processed = df.copy()
        categorical_cols = ['Month', 'VisitorType', 'Weekend']
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df_processed[col] = self.label_encoders[col].fit_transform(df_processed[col])
            else:
                df_processed[col] = self.label_encoders[col].transform(df_processed[col])
        return df_processed

    def train(self, csv_data):
        df = pd.read_csv(io.StringIO(csv_data))
        df_processed = self.preprocess(df)

        X = df_processed[self.features]
        y = df_processed['Revenue']

        self.model.fit(X, y)
        return self.model.score(X, y)

    def predict(self, input_data):
        # input_data is a dict
        df_input = pd.DataFrame([input_data])
        df_processed = self.preprocess(df_input)
        prediction = self.model.predict(df_processed[self.features])[0]
        probability = self.model.predict_proba(df_processed[self.features])[0][1]
        return bool(prediction), float(probability)

# Global instances for Pyodide
predictor = ShopperIntentionModel()
