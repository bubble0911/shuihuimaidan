import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import io
import json

class ShopperIntentionModel:
    def __init__(self):
        self.pipeline = None
        self.numeric_features = [
            'Administrative', 'Administrative_Duration', 'Informational',
            'Informational_Duration', 'ProductRelated', 'ProductRelated_Duration',
            'BounceRates', 'ExitRates', 'PageValues', 'SpecialDay'
        ]
        self.categorical_features = [
            'Month', 'OperatingSystems', 'Browser', 'Region', 
            'TrafficType', 'VisitorType', 'Weekend'
        ]

    def _clean_dataframe(self, df):
        df_clean = df.copy()
        for col in self.numeric_features:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0.0)
        
        for col in self.categorical_features:
            if col in df_clean.columns:
                if col == 'Weekend':
                    df_clean[col] = df_clean[col].astype(str).str.upper().map({
                        'TRUE': 'TRUE', '1': 'TRUE', 'FALSE': 'FALSE', '0': 'FALSE'
                    }).fillna('FALSE')
                else:
                    df_clean[col] = df_clean[col].astype(str)
        return df_clean

    def train(self, csv_data):
        try:
            print("Python: Training starting...")
            df_raw = pd.read_csv(io.StringIO(csv_data))
            self.df_stats = df_raw.copy() # Keep for dashboard
            
            # 统一目标变量为整数 0/1
            mapping = {'TRUE': 1, 'FALSE': 0, '1': 1, '0': 0}
            df_raw['target'] = df_raw['Revenue'].astype(str).str.upper().map(mapping).fillna(0).astype(int)

            X = self._clean_dataframe(df_raw[self.numeric_features + self.categorical_features])
            y = df_raw['target']

            # 构造流水线
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', StandardScaler(), self.numeric_features),
                    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), self.categorical_features)
                ])

            # Use 200 trees for better ensemble stabilization
            self.pipeline = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('classifier', RandomForestClassifier(
                    n_estimators=200, 
                    max_depth=12,
                    min_samples_split=5,
                    min_samples_leaf=2,
                    class_weight='balanced_subsample', # Better for random forest with imbalance
                    random_state=42,
                    n_jobs=1
                ))
            ])

            self.pipeline.fit(X, y)
            print(f"Python: Training finished. Score: {self.pipeline.score(X, y):.4f}")
            return float(self.pipeline.score(X, y))
        except Exception as e:
            print(f"Python: Training Error: {e}")
            return 0.0

    def get_stats(self):
        """Prepare summary statistics for the big data dashboard"""
        if not hasattr(self, 'df_stats'):
            return "{}"
        
        df = self.df_stats.copy()
        # Ensure Revenue is boolean for grouping
        df['Revenue'] = df['Revenue'].astype(str).str.upper().map({'TRUE': True, 'FALSE': False, '1': True, '0': False}).fillna(False)

        # 1. Monthly Conversion Rate
        monthly_stats = df.groupby('Month')['Revenue'].agg(['count', 'sum']).reset_index()
        monthly_stats.columns = ['month', 'total', 'converted']
        monthly_stats['rate'] = monthly_stats['converted'] / monthly_stats['total']
        
        # Sort months correctly
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_stats['month'] = pd.Categorical(monthly_stats['month'], categories=month_order, ordered=True)
        monthly_stats = monthly_stats.sort_values('month')
        
        # 2. Conversion by Traffic Type
        traffic_stats = df.groupby('TrafficType')['Revenue'].mean().reset_index()
        traffic_stats.columns = ['type', 'rate']
        
        # 3. Visitor Type Distribution
        visitor_stats = df.groupby('VisitorType')['Revenue'].agg(['count', 'mean']).reset_index()
        visitor_stats.columns = ['type', 'count', 'rate']

        # 4. Impact of SpecialDay
        special_day_stats = df.groupby('SpecialDay')['Revenue'].mean().reset_index()
        special_day_stats.columns = ['day', 'rate']

        result = {
            "monthly": monthly_stats.to_dict(orient='records'),
            "traffic": traffic_stats.to_dict(orient='records'),
            "visitor": visitor_stats.to_dict(orient='records'),
            "special": special_day_stats.to_dict(orient='records'),
            "total_samples": len(df),
            "total_revenue_events": int(df['Revenue'].sum())
        }
        return json.dumps(result)

    def predict(self, input_data):
        if not self.pipeline:
            return False, 0.0
        try:
            # 兼容处理 JS 传入的对象
            if hasattr(input_data, 'to_py'):
                input_dict = input_data.to_py()
            else:
                input_dict = json.loads(json.dumps(input_data.to_js())) if hasattr(input_data, 'to_js') else dict(input_data)

            # 数据清理与对齐
            df_input = self._clean_dataframe(pd.DataFrame([input_dict]))
            df_input = df_input[self.numeric_features + self.categorical_features]
            
            # 执行预测
            probs = self.pipeline.predict_proba(df_input)[0]
            classes = self.pipeline.classes_.tolist()
            
            # 寻找“成交(1)”的索引
            try:
                pos_idx = classes.index(1)
                prob_buy = float(probs[pos_idx])
            except:
                prob_buy = float(probs[1]) if len(probs) > 1 else 0.0

            # 决定最终结果：如果购买概率 > 0.5 则为 True
            result = prob_buy >= 0.5
            
            print(f"Python Predict: Prob={prob_buy:.4f}, Outcome={result}")
            return bool(result), prob_buy
        except Exception as e:
            print(f"Python: Predict Error: {e}")
            return False, 0.0

predictor = ShopperIntentionModel()
