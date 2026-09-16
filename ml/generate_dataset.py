"""
LexiScreen — Multimodal Learning Difficulty Dataset Generator
Generates benchmark dataset for training and cross-validating Level 2 ML models.
"""

import numpy as np
import pandas as pd
import json
import os

def generate_multimodal_dataset(n_samples=1200, random_seed=42):
    np.random.seed(random_seed)
    
    # Class distribution: 55% Low Risk, 25% Moderate Risk, 20% High Risk
    classes = np.random.choice([0, 1, 2], size=n_samples, p=[0.55, 0.25, 0.20])
    
    grades = ['K', '1', '2', '3', '4', '5', '6']
    grade_targets = {'K': 35, '1': 55, '2': 85, '3': 110, '4': 130, '5': 145, '6': 160}
    
    data = []
    
    for i, c in enumerate(classes):
        grade = np.random.choice(grades)
        target_wpm = grade_targets[grade]
        grade_num = grades.index(grade)
        
        if c == 0:  # Low Risk
            reversal_rate = np.clip(np.random.normal(0.04, 0.04), 0.0, 0.20)
            wpm_deficit = np.clip(np.random.normal(-0.10, 0.15), -0.50, 0.15)
            decoding_acc = np.clip(np.random.normal(0.95, 0.04), 0.85, 1.0)
            pause_count = max(0, int(np.random.normal(1.2, 1.0)))
            pause_duration_ms = max(200, int(np.random.normal(1500, 800)))
            silence_ratio = np.clip(np.random.normal(0.10, 0.05), 0.02, 0.25)
            avg_hesitation_ms = max(300, int(np.random.normal(800, 300)))
            hw_jitter = np.clip(np.random.normal(0.35, 0.12), 0.15, 0.70)
            hw_pen_lifts = max(0, int(np.random.normal(1.2, 0.8)))
            hw_velocity_cv = np.clip(np.random.normal(0.40, 0.12), 0.20, 0.70)
            hw_consistency = np.clip(int(np.random.normal(88, 7)), 70, 100)
            continuous_score = np.clip(np.random.normal(18, 8), 2.0, 34.5)
        elif c == 1:  # Moderate Risk
            reversal_rate = np.clip(np.random.normal(0.28, 0.10), 0.12, 0.50)
            wpm_deficit = np.clip(np.random.normal(0.30, 0.15), 0.10, 0.60)
            decoding_acc = np.clip(np.random.normal(0.82, 0.06), 0.68, 0.92)
            pause_count = max(1, int(np.random.normal(4.0, 1.5)))
            pause_duration_ms = max(1000, int(np.random.normal(5500, 1800)))
            silence_ratio = np.clip(np.random.normal(0.28, 0.08), 0.15, 0.45)
            avg_hesitation_ms = max(800, int(np.random.normal(1800, 500)))
            hw_jitter = np.clip(np.random.normal(0.75, 0.18), 0.45, 1.10)
            hw_pen_lifts = max(1, int(np.random.normal(3.0, 1.2)))
            hw_velocity_cv = np.clip(np.random.normal(0.75, 0.15), 0.50, 1.05)
            hw_consistency = np.clip(int(np.random.normal(68, 8)), 50, 82)
            continuous_score = np.clip(np.random.normal(48, 8), 35.0, 64.5)
        else:  # High Risk
            reversal_rate = np.clip(np.random.normal(0.65, 0.15), 0.40, 1.0)
            wpm_deficit = np.clip(np.random.normal(0.65, 0.18), 0.35, 1.0)
            decoding_acc = np.clip(np.random.normal(0.62, 0.10), 0.35, 0.78)
            pause_count = max(3, int(np.random.normal(8.5, 2.5)))
            pause_duration_ms = max(3000, int(np.random.normal(14000, 4500)))
            silence_ratio = np.clip(np.random.normal(0.50, 0.12), 0.30, 0.85)
            avg_hesitation_ms = max(1500, int(np.random.normal(3200, 800)))
            hw_jitter = np.clip(np.random.normal(1.20, 0.25), 0.80, 1.80)
            hw_pen_lifts = max(2, int(np.random.normal(5.5, 1.8)))
            hw_velocity_cv = np.clip(np.random.normal(1.10, 0.20), 0.80, 1.60)
            hw_consistency = np.clip(int(np.random.normal(42, 10)), 15, 60)
            continuous_score = np.clip(np.random.normal(78, 9), 65.0, 98.5)
            
        calculated_wpm = max(5, int(target_wpm * (1.0 - wpm_deficit)))
        duration_sec = max(15, int(30 + (pause_count * 4) + (pause_duration_ms / 1000)))
        
        data.append({
            'sample_id': f'S_{i+1:04d}',
            'grade': grade,
            'grade_num': grade_num,
            'reversal_error_rate': round(float(reversal_rate), 3),
            'wpm_deficit_ratio': round(float(wpm_deficit), 3),
            'calculated_wpm': calculated_wpm,
            'target_wpm': target_wpm,
            'decoding_accuracy_pct': round(float(decoding_acc * 100), 1),
            'pause_count': pause_count,
            'total_pause_duration_ms': pause_duration_ms,
            'silence_ratio': round(float(silence_ratio), 3),
            'avg_hesitation_ms': avg_hesitation_ms,
            'handwriting_jitter': round(float(hw_jitter), 3),
            'handwriting_pen_lifts': hw_pen_lifts,
            'handwriting_velocity_cv': round(float(hw_velocity_cv), 3),
            'handwriting_consistency': hw_consistency,
            'duration_sec': duration_sec,
            'risk_class': int(c),
            'risk_category': 'Low' if c == 0 else ('Moderate' if c == 1 else 'High'),
            'continuous_score': round(float(continuous_score), 1)
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    df = generate_multimodal_dataset(1200)
    df.to_csv('data/screening_dataset.csv', index=False)
    print(f"Generated dataset with {len(df)} samples saved to data/screening_dataset.csv")
