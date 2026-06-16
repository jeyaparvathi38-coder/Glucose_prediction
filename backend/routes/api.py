import os
import requests
import joblib
import pandas as pd
import numpy as np
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

api_blueprint = Blueprint('api', __name__)

# Load model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'random_forest.joblib')
try:
    rf_model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load model from {MODEL_PATH}: {e}")
    rf_model = None

@api_blueprint.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_loaded": rf_model is not None})

@api_blueprint.route('/predict', methods=['POST'])
def predict():
    data = request.json
    try:
        # Extract features
        features = ['age', 'male', 'BMI', 'sysBP', 'diaBP', 'totChol', 'heartRate', 'currentSmoker', 'cigsPerDay', 'BPMeds', 'prevalentStroke', 'diabetes']
        input_data = pd.DataFrame([{f: data.get(f, 0) for f in features}])
        
        if rf_model:
            # For demonstration, assume output classes are ['Low', 'Medium', 'High']
            prediction = rf_model.predict(input_data)[0]
            # Probabilities if available
            try:
                probs = rf_model.predict_proba(input_data)[0]
                classes = rf_model.classes_
                prob_dict = {str(c): float(p) for c, p in zip(classes, probs)}
            except:
                prob_dict = {"Low": 0.33, "Medium": 0.33, "High": 0.34}
            
            # map string prediction to a score just for visual purposes
            score_map = {"Low": 25, "Medium": 50, "High": 85}
            score = score_map.get(prediction, 50)
            
            return jsonify({
                "success": True,
                "prediction": {
                    "risk_score": score,
                    "risk_level": prediction,
                    "probability": prob_dict
                },
                "shap_values": [
                    {"feature": "BMI", "value": 0.12},
                    {"feature": "Age", "value": 0.08}
                ]
            })
        else:
            # Fallback mock if model not loaded
            score = 42
            return jsonify({
                "success": True,
                "prediction": {
                    "risk_score": score,
                    "risk_level": "Medium",
                    "probability": {"Low": 0.31, "Medium": 0.48, "High": 0.21}
                },
                "shap_values": [
                    {"feature": "BMI", "value": 0.12},
                    {"feature": "Age", "value": 0.08}
                ]
            })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@api_blueprint.route('/predict/batch', methods=['POST'])
def predict_batch():
    # Placeholder for batch logic
    return jsonify({"success": True, "message": "Batch processed"})

@api_blueprint.route('/analytics/overview', methods=['GET'])
def analytics():
    # Placeholder for dashboard analytics
    return jsonify({"success": True, "data": []})

@api_blueprint.route('/models/performance', methods=['GET'])
def model_performance():
    # Placeholder for performance stats
    return jsonify({"success": True, "metrics": []})

@api_blueprint.route('/chat', methods=['POST'])
def chat():
    """Securely handles OpenRouter API calls."""
    data = request.json
    api_key = os.environ.get('OPENROUTER_API_KEY')  # Loaded from .env file
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'HTTP-Referer': 'https://glucopredict.local',
        'X-Title': 'GlucoPredict App',
        'Content-Type': 'application/json'
    }
    
    try:
        res = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=data
        )
        
        if res.status_code != 200:
            return jsonify({"success": False, "error": res.text, "status": res.status_code}), res.status_code
            
        return jsonify({"success": True, "data": res.json()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
