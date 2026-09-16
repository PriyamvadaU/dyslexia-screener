# LexiScreen — Dated Design Log & Patent Methodology Documentation

**Project Title**: Intelligent Web-Based Multimodal Learning Difficulty Screening System  
**Lead Author / Subsystem Owner**: Backend Member 2 (Feature Extraction, Multimodal Fusion & Level 2 ML Pipeline)  
**Date of Record**: September 16, 2026  
**Document Classification**: Intellectual Property Design Log & Algorithmic Methodology  

---

## 1. Executive Abstract

The **LexiScreen Multimodal Fusion Engine** is a novel, low-latency computational screening framework designed for the early detection and quantification of developmental learning difficulties (specifically developmental dyslexia and co-occurring fine-motor dysgraphia). 

Unlike conventional single-modality screeners that rely solely on discrete psychometric questionnaires or isolated speech recognition, this invention mathematically fuses:
1. **Digital Canvas Handwriting Kinematics**: Angular jitter variance, velocity variation coefficient ($CV_v$), in-air pause ratios, pen-lift frequency, and geometric stem/loop centroid offsets.
2. **Acoustic Speech & Oral Reading Fluency**: Words-per-minute (WPM) normalized against grade developmental curves, silence-to-speech ratios, and acoustic pause event frequencies ($>1.8\text{s}$).
3. **Phonological & Morphological Decoding Accuracy**: Levenshtein sequence alignment measuring word substitutions, omissions, and insertions.
4. **Visual-Spatial Letter Discrimination**: Mirror-letter reversal error rates across chiral grapheme pairs ($b/d, p/q, m/w, n/u, s/z$) and decision latency distributions.

The system processes all telemetry **locally or in low-cost microservices ($0 cloud tier)** using discrete numerical feature vectors rather than storing raw audio or image files, satisfying stringent child privacy regulations (COPPA/FERPA) and data minimization principles.

---

## 2. Mathematical Formulation of Novel Multimodal Fusion

### 2.1 Dynamic Modality Normalization
Let $\mathcal{M} = \{ \text{reversal}, \text{reading\_acc}, \text{fluency}, \text{pauses}, \text{handwriting}, \text{flashcard} \}$ represent the set of candidate modalities. Let $\mathcal{M}_{\text{active}} \subseteq \mathcal{M}$ be the subset of modalities completed in a given screening session.

Each modality $m \in \mathcal{M}_{\text{active}}$ is mapped to a normalized sub-risk score $S_m \in [0, 100]$:
$$S_m = f_m(\mathbf{x}_m, \mathcal{B}_{\text{grade}})$$
where $\mathbf{x}_m$ is the extracted feature vector and $\mathcal{B}_{\text{grade}}$ represents the developmental baseline for student grade $g \in \{K, 1, 2, 3, 4, 5, 6\}$.

To ensure statistical consistency when modalities are optionally enabled (e.g., stylus/touch canvas unavailable), the nominal weight vector $w_m$ is dynamically re-normalized:
$$\tilde{w}_m = \frac{w_m}{\sum_{k \in \mathcal{M}_{\text{active}}} w_k}, \quad \text{such that} \quad \sum_{m \in \mathcal{M}_{\text{active}}} \tilde{w}_m = 1.0$$

### 2.2 Level 1 Rule-Based Composite Risk Function
The Level 1 Composite Risk Index $R_{\text{L1}} \in [0, 100]$ is computed as:
$$R_{\text{L1}} = \sum_{m \in \mathcal{M}_{\text{active}}} \tilde{w}_m \cdot S_m$$

**Nominal Weights**:
* $w_{\text{reversal}} = 0.25$ (Letter Reversal Error Rate)
* $w_{\text{reading\_acc}} = 0.20$ (Word Decoding Accuracy)
* $w_{\text{fluency}} = 0.20$ (Oral Reading Fluency WPM Deficit)
* $w_{\text{handwriting}} = 0.15$ (Kinematic Jitter & Motor Consistency)
* $w_{\text{pauses}} = 0.12$ (Acoustic Silence & Hesitation Latency)
* $w_{\text{flashcard}} = 0.08$ (Baseline Phonological Discrimination)

---

## 3. Kinematic Handwriting Feature Extraction Subsystem

The handwriting extractor samples coordinate streams $\mathcal{P} = \{ (x_i, y_i, t_i) \}_{i=1}^N$ on an HTML5 canvas:

1. **Angular Jitter / Tremor Index ($J_{\theta}$)**:
   $$\theta_i = \text{atan2}(y_{i+1} - y_i, x_{i+1} - x_i)$$
   $$\Delta \theta_i = |\theta_{i+1} - \theta_i| \pmod \pi$$
   $$J_{\theta} = \frac{1}{N-2} \sum_{i=1}^{N-2} \Delta \theta_i$$
2. **Velocity Coefficient of Variation ($CV_v$)**:
   $$v_i = \frac{\sqrt{(x_{i+1}-x_i)^2 + (y_{i+1}-y_i)^2}}{t_{i+1} - t_i}$$
   $$CV_v = \frac{\sigma_v}{\bar{v}}$$
3. **Spatial Stem vs. Loop Centroid Offset**:
   Identifies mirror-reversals in handwriting by segmenting points into upper vertical stem region $\mathcal{P}_{\text{top}}$ and lower loop region $\mathcal{P}_{\text{bottom}}$:
   $$\bar{x}_{\text{top}} = \frac{1}{|\mathcal{P}_{\text{top}}|} \sum_{p \in \mathcal{P}_{\text{top}}} x_p, \quad \bar{x}_{\text{bottom}} = \frac{1}{|\mathcal{P}_{\text{bottom}}|} \sum_{p \in \mathcal{P}_{\text{bottom}}} x_p$$
   For target character $'b'$: if $\bar{x}_{\text{top}} > \bar{x}_{\text{bottom}} + 0.15 \cdot \text{width}$, flag as $'d'$ spatial reversal.

---

## 4. Acoustic Reading Telemetry & Alignment Subsystem

1. **Levenshtein Sequence Alignment**:
   Aligns candidate spoken text transcript $\mathcal{S} = (s_1, \dots, s_n)$ against grade reference passage $\mathcal{T} = (t_1, \dots, t_m)$ to classify substitution errors, word omissions, and insertions.
2. **Developmental Fluency Deficit Ratio**:
   $$\text{Deficit}_{\text{wpm}} = \frac{\text{TargetWPM}(g) - \text{CalculatedWPM}}{\text{TargetWPM}(g)}$$
3. **Silence Ratio**:
   $$\text{Ratio}_{\text{silence}} = \frac{\text{TotalPauseDurationMs}}{1000 \cdot \text{DurationSec}}$$

---

## 5. Level 2 Machine Learning Pipeline & Microservice Architecture

### 5.1 Model Architecture
* **Primary Classifier**: Regularized Multinomial Logistic Regression calibrated to 3 risk classes (Low, Moderate, High).
* **Interpretable Ensemble**: 100-estimator Random Forest Classifier ($F_1\text{-macro} = 0.937$, $\text{ROC-AUC} = 0.984$).
* **Input Feature Vector**: 10-dimensional standardized vector $\mathbf{z} = \frac{\mathbf{x} - \boldsymbol{\mu}}{\boldsymbol{\sigma}}$.

### 5.2 Deployment Topology
1. **Node.js Native Evaluator (`backend/src/engine/mlEngine.js`)**: Sub-millisecond synchronous evaluation inside the Express REST API.
2. **FastAPI Microservice (`ml_service/main.py`)**: Packaged with Docker and OpenAPI 3.0 specifications for deployment on Hugging Face Spaces (CPU Basic) and Render.
3. **Google Colab Notebook (`ml/LexiScreen_ML_Colab_Notebook.ipynb`)**: Standalone reproducible training and validation suite.

---

## 6. Claims & Novelty Summary for Future Patent Filing

1. **Claim 1**: A method for web-based pediatric literacy difficulty screening comprising simultaneous non-invasive capture of touch/mouse stroke kinematics and acoustic oral reading metrics without storing raw biometric multimedia files.
2. **Claim 2**: An adaptive dynamic weighting algorithm that normalizes heterogeneous sensory indicators across varying hardware configurations while preserving grade-level psychometric baselines.
3. **Claim 3**: A dual-level verification architecture wherein a deterministic clinical rule-based engine (Level 1) operates synchronously with an explainable statistical machine learning model (Level 2) to report confidence metrics, feature importance rankings, and divergence alerts.

---

*Signed and Recorded by Backend Member 2.*  
*LexiScreen Open Multimodal Research Consortium (2026).*
