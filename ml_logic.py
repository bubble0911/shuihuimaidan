import csv
import math
import sys
import os
import json

class SimpleDecisionTree:
    def __init__(self, max_depth=5):
        self.max_depth = max_depth
        self.tree = None

    def calculate_entropy(self, y):
        if not y: return 0
        p1 = sum(y) / len(y)
        if p1 == 0 or p1 == 1: return 0
        p0 = 1 - p1
        return - (p0 * math.log2(p0) + p1 * math.log2(p1))

    def split_data(self, X, y, feature_idx, threshold):
        left_X, left_y, right_X, right_y = [], [], [], []
        for i in range(len(X)):
            if X[i][feature_idx] <= threshold:
                left_X.append(X[i])
                left_y.append(y[i])
            else:
                right_X.append(X[i])
                right_y.append(y[i])
        return left_X, left_y, right_X, right_y

    def find_best_split(self, X, y):
        best_gain = -1
        split_idx, split_thresh = None, None
        current_entropy = self.calculate_entropy(y)
        
        n_features = len(X[0])
        for feature_idx in range(n_features):
            thresholds = sorted(list(set([row[feature_idx] for row in X])))
            for threshold in thresholds:
                lx, ly, rx, ry = self.split_data(X, y, feature_idx, threshold)
                if not ly or not ry: continue
                
                gain = current_entropy - (len(ly)/len(y) * self.calculate_entropy(ly) + 
                                          len(ry)/len(y) * self.calculate_entropy(ry))
                if gain > best_gain:
                    best_gain = gain
                    split_idx = feature_idx
                    split_thresh = threshold
        return split_idx, split_thresh

    def build_tree(self, X, y, depth=0):
        if len(set(y)) == 1: return y[0]
        if depth >= self.max_depth or len(y) < 2:
            return 1 if sum(y)/len(y) >= 0.5 else 0
        
        idx, thresh = self.find_best_split(X, y)
        if idx is None: return 1 if sum(y)/len(y) >= 0.5 else 0
        
        lx, ly, rx, ry = self.split_data(X, y, idx, thresh)
        left = self.build_tree(lx, ly, depth + 1)
        right = self.build_tree(rx, ry, depth + 1)
        return {'idx': idx, 'thresh': thresh, 'left': left, 'right': right}

    def fit(self, X, y):
        self.tree = self.build_tree(X, y)

    def predict_one(self, tree, x):
        if not isinstance(tree, dict): return tree
        if x[tree['idx']] <= tree['thresh']:
            return self.predict_one(tree['left'], x)
        else:
            return self.predict_one(tree['right'], x)

    def predict(self, X):
        return [self.predict_one(self.tree, x) for x in X]

# Feature mapping
MONTHS = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'June': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12}
VISITOR_TYPES = {'Returning_Visitor': 0, 'New_Visitor': 1, 'Other': 2}

def load_data(filename):
    X, y = [], []
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                line = [
                    float(row['Administrative']),
                    float(row['Administrative_Duration']),
                    float(row['Informational']),
                    float(row['Informational_Duration']),
                    float(row['ProductRelated']),
                    float(row['ProductRelated_Duration']),
                    float(row['BounceRates']),
                    float(row['ExitRates']),
                    float(row['PageValues']),
                    float(row['SpecialDay']),
                    MONTHS.get(row['Month'], 0),
                    float(row['OperatingSystems']),
                    float(row['Browser']),
                    float(row['Region']),
                    float(row['TrafficType']),
                    VISITOR_TYPES.get(row['VisitorType'], 2),
                    1 if row['Weekend'] == 'TRUE' else 0
                ]
                X.append(line)
                y.append(1 if row['Revenue'] == 'TRUE' else 0)
            except Exception as e:
                continue
    return X, y

DT_MODEL = None

def train():
    X, y = load_data('data.csv')
    model = SimpleDecisionTree(max_depth=6)
    model.fit(X, y)
    
    # Save model as JSON
    with open('model.json', 'w') as f:
        json.dump(model.tree, f)
    print("Model trained and saved to model.json")

def predict(input_data):
    if not os.path.exists('model.json'):
        return {"error": "Model not trained"}
    
    with open('model.json', 'r') as f:
        tree = json.load(f)
    
    # input_data is a list of features
    model = SimpleDecisionTree()
    result = model.predict_one(tree, input_data)
    return {"prediction": "Will Buy" if result == 1 else "Will Not Buy", "revenue": result}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'train':
            train()
        elif sys.argv[1] == 'predict':
            # expects json string of feature list
            features = json.loads(sys.argv[2])
            print(json.dumps(predict(features)))
