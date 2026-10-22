from flask import Flask, request, jsonify
import os
import joblib
import pandas as pd
import numpy as np
import json

app = Flask(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Load Artifacts
model = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
feature_list = joblib.load(os.path.join(MODELS_DIR, 'feature_list.pkl'))

with open(os.path.join(MODELS_DIR, 'model_metadata.json'), 'r') as f:
    metadata = json.load(f)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "metadata": metadata})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    try:
        # Build dataframe row matching expected feature list
        input_df = pd.DataFrame([data])
        
        # Ensure all columns from feature_list are present
        for col in feature_list:
            if col not in input_df.columns:
                input_df[col] = 0.0 # Default fallback

        # Coerce every feature to numeric. Missing readings (e.g. lag values for
        # a station without enough history) must become NaN - pandas turns an
        # all-None column into object dtype, which XGBoost refuses to score.
        input_df = input_df[feature_list].apply(pd.to_numeric, errors="coerce")

        X = input_df
        
        # Scale if model requires it (Linear Regression does, XGBoost doesn't)
        if metadata.get("requires_scaling", False):
            X = scaler.transform(X)
            
        pred_water_level = float(model.predict(X)[0])
        
        # Risk assessment using station threshold passed in request
        threshold = float(data.get('flood_threshold_m', 4.5))
        if pred_water_level >= threshold:
            risk = "HIGH"
        elif pred_water_level >= (threshold * 0.85):
            risk = "MEDIUM"
        else:
            risk = "LOW"
            
        return jsonify({
            "predicted_water_level_m": round(pred_water_level, 3),
            "risk_level": risk,
            "threshold_m": threshold,
            "model_used": metadata["best_model"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/explainability', methods=['GET'])
def explainability():
    """Returns model metrics, feature importances, and metadata for the Explainable AI UI section."""
    importances = {}
    if hasattr(model, 'feature_importances_'):
        importances = dict(zip(feature_list, [float(v) for v in model.feature_importances_]))
        # Sort by importance
        importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))
        
    return jsonify({
        "metrics": metadata["metrics"],
        "tuning": metadata["tuning"],
        "feature_importances": importances,
        "best_model": metadata["best_model"],
        "train_rows": metadata["train_rows"],
        "test_rows": metadata["test_rows"]
    })

if __name__ == '__main__':
    # use_reloader=False: the reloader would load the model a second time in a
    # child process, which roughly doubles the memory footprint.
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)