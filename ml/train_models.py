"""
LexiScreen — Multimodal Learning Difficulty ML Pipeline
Trains Logistic Regression, Decision Tree, and Random Forest models on multimodal features.
Calculates Accuracy, Precision, Recall, F1, Confusion Matrix, and Feature Importances.
Exports models and serialized JSON artifacts for inference.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
import joblib

# Import synthetic generator from same directory
from generate_dataset import generate_multimodal_dataset

FEATURE_COLS = [
    'reversal_error_rate',
    'wpm_deficit_ratio',
    'decoding_accuracy_pct',
    'pause_count',
    'silence_ratio',
    'avg_hesitation_ms',
    'handwriting_jitter',
    'handwriting_pen_lifts',
    'handwriting_velocity_cv',
    'handwriting_consistency'
]

TARGET_COL = 'risk_class'  # 0 = Low, 1 = Moderate, 2 = High
CLASS_NAMES = ['Low', 'Moderate', 'High']

def train_and_evaluate_pipeline():
    print("==================================================================")
    print("  LexiScreen Level 2 ML Pipeline — Training & Evaluation (2026)  ")
    print("==================================================================")
    
    # 1. Generate / Load Dataset
    df = generate_multimodal_dataset(n_samples=1500, random_seed=42)
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    
    print(f"Dataset shape: {X.shape}, Class counts:\n{y.value_counts().rename({0:'Low', 1:'Moderate', 2:'High'})}")
    
    # 2. Stratified Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # 3. Fit Standard Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 4. Model 1: Logistic Regression (L2 Regularized)
    lr_model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    lr_model.fit(X_train_scaled, y_train)
    y_pred_lr = lr_model.predict(X_test_scaled)
    y_prob_lr = lr_model.predict_proba(X_test_scaled)
    
    # 5. Model 2: Interpretable Decision Tree
    dt_model = DecisionTreeClassifier(max_depth=5, min_samples_split=10, min_samples_leaf=5, random_state=42)
    dt_model.fit(X_train, y_train)  # unscaled for easy rule extraction
    y_pred_dt = dt_model.predict(X_test)
    y_prob_dt = dt_model.predict_proba(X_test)
    
    # 6. Model 3: Random Forest Classifier
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)
    y_prob_rf = rf_model.predict_proba(X_test)
    
    # 7. Evaluate Metrics
    def compute_metrics(y_true, y_pred, y_prob):
        return {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision_macro': float(precision_score(y_true, y_pred, average='macro')),
            'recall_macro': float(recall_score(y_true, y_pred, average='macro')),
            'f1_macro': float(f1_score(y_true, y_pred, average='macro')),
            'f1_weighted': float(f1_score(y_true, y_pred, average='weighted')),
            'roc_auc_ovr': float(roc_auc_score(y_true, y_prob, multi_class='ovr')),
            'confusion_matrix': confusion_matrix(y_true, y_pred).tolist()
        }
    
    metrics_lr = compute_metrics(y_test, y_pred_lr, y_prob_lr)
    metrics_dt = compute_metrics(y_test, y_pred_dt, y_prob_dt)
    metrics_rf = compute_metrics(y_test, y_pred_rf, y_prob_rf)
    
    print("\n---------------- Model Performance Summary ----------------")
    print(f"Logistic Regression: Accuracy = {metrics_lr['accuracy']:.4f}, F1 (macro) = {metrics_lr['f1_macro']:.4f}, ROC-AUC = {metrics_lr['roc_auc_ovr']:.4f}")
    print(f"Decision Tree:       Accuracy = {metrics_dt['accuracy']:.4f}, F1 (macro) = {metrics_dt['f1_macro']:.4f}, ROC-AUC = {metrics_dt['roc_auc_ovr']:.4f}")
    print(f"Random Forest:       Accuracy = {metrics_rf['accuracy']:.4f}, F1 (macro) = {metrics_rf['f1_macro']:.4f}, ROC-AUC = {metrics_rf['roc_auc_ovr']:.4f}")
    
    # 8. Feature Importances (Random Forest & Logistic Regression)
    rf_importances = {
        feat: float(imp) for feat, imp in zip(FEATURE_COLS, rf_model.feature_importances_)
    }
    # Sort descending
    sorted_importances = dict(sorted(rf_importances.items(), key=lambda item: item[1], reverse=True))
    
    print("\n---------------- Feature Importance Ranking ----------------")
    for feat, imp in sorted_importances.items():
        print(f"  {feat:<28}: {imp*100:6.2f}%")
        
    # 9. Export Serialized Artifacts for Node.js / FastAPI Deployments
    os.makedirs('artifacts', exist_ok=True)
    os.makedirs('../backend/src/ml/models', exist_ok=True)
    
    # Save joblib models for Python FastAPI service
    joblib.dump(rf_model, 'artifacts/rf_model.joblib')
    joblib.dump(lr_model, 'artifacts/lr_model.joblib')
    joblib.dump(scaler, 'artifacts/scaler.joblib')
    
    # Export full JSON model bundle (includes scaler parameters, logistic regression coefficients, and RF feature importances)
    model_bundle = {
        'version': '2.1.0',
        'architecture': 'Ensemble Multimodal Screener (LogisticRegression + RandomForest)',
        'trainedDate': '2026-09-16T12:00:00Z',
        'features': FEATURE_COLS,
        'classes': CLASS_NAMES,
        'scaler': {
            'mean': scaler.mean_.tolist(),
            'scale': scaler.scale_.tolist(),
            'var': scaler.var_.tolist()
        },
        'logisticRegression': {
            'coef': lr_model.coef_.tolist(),
            'intercept': lr_model.intercept_.tolist(),
            'classes': [int(c) for c in lr_model.classes_]
        },
        'featureImportances': sorted_importances,
        'evaluationMetrics': {
            'randomForest': metrics_rf,
            'logisticRegression': metrics_lr,
            'decisionTree': metrics_dt
        },
        'confusionMatrix': {
            'labels': CLASS_NAMES,
            'matrix': metrics_rf['confusion_matrix']
        }
    }
    
    # Write to artifacts and backend
    with open('artifacts/trained_model.json', 'w') as f:
        json.dump(model_bundle, f, indent=2)
        
    with open('../backend/src/ml/models/trained_model.json', 'w') as f:
        json.dump(model_bundle, f, indent=2)
        
    print("\n✓ Model bundle exported to artifacts/trained_model.json and backend/src/ml/models/trained_model.json")
    return model_bundle

if __name__ == '__main__':
    train_and_evaluate_pipeline()
