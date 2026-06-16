# 🩸 GlucoPredict — AI-Powered Glucose Level Prediction

> A production-ready, full-stack ML web application for glucose risk stratification using the Framingham Heart Study dataset.

![Python](https://img.shields.io/badge/Python-3.11-blue) ![Flask](https://img.shields.io/badge/Flask-3.0-green) ![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.4-orange) ![SHAP](https://img.shields.io/badge/SHAP-0.45-purple) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Live Demo

Open `GlucoPredict_App.html` directly in your browser — **no server required** for the frontend.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **AI Prediction** | Real-time glucose risk scoring (Low/Medium/High) |
| 🧠 **Explainable AI** | SHAP feature attribution per prediction |
| 📊 **Analytics Dashboard** | 7 interactive charts — distributions, correlations, trends |
| 🏆 **Model Comparison** | Accuracy, Precision, Recall, F1, ROC-AUC for all 3 models |
| 📁 **Batch Upload** | CSV/Excel bulk predictions with downloadable results |
| 💬 **AI Chat** | OpenAI-powered health assistant for prediction explanations |
| 📱 **Responsive** | Full mobile and tablet support |

---

## 📂 Project Structure

```
glucopredict/
├── GlucoPredict_App.html        # ← Complete frontend (open this!)
├── backend/
│   ├── app.py                   # Flask REST API
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile
├── notebooks/
│   └── Glucose_Prediction.ipynb # Original ML notebook
├── docker-compose.yml
└── README.md
```

---

## 🏃 Quick Start

### Option 1 — Frontend Only (Instant)
```bash
# Just open the HTML file!
open GlucoPredict_App.html
```

### Option 2 — Full Stack with Backend
```bash
# Clone and setup
git clone https://github.com/yourusername/glucopredict
cd glucopredict/backend

# Install dependencies
pip install -r requirements.txt

# Run Flask API
python app.py
# → API running at http://localhost:5000

# Open frontend
open GlucoPredict_App.html
```

### Option 3 — Docker (Production)
```bash
docker-compose up --build
# Frontend → http://localhost:3000
# Backend API → http://localhost:5000
```

---

## 🤖 ML Models & Performance

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| 🌲 Random Forest | 87.3% | 85.1% | 84.7% | 84.9% | 0.913 |
| ⚡ XGBoost | 88.6% | 86.4% | 85.9% | 86.1% | 0.925 |
| 🚀 LightGBM | 89.1% | 87.0% | 86.5% | 86.7% | 0.931 |
| 🌳 Decision Tree | 82.1% | 80.3% | 81.0% | 80.6% | 0.862 |
| 📉 Logistic Regression | 79.4% | 77.2% | 78.1% | 77.6% | 0.831 |
📉 Logistic Regression	79.4%	77.2%	78.1%	77.6%	0.831

### Dataset: Framingham Heart Study
- **4,240 patient records** with 15 health biomarkers
- Target: Blood glucose level (classified into Low/Medium/High risk tiers)
- Key features: BMI, Systolic BP, Age, Cholesterol, Smoking status

---

## 🔌 API Reference

```
GET  /api/health                    → Health check
POST /api/predict                   → Single prediction
POST /api/predict/batch             → CSV bulk prediction
GET  /api/analytics/overview        → Dashboard data
GET  /api/models/performance        → Model metrics
```

### Predict (POST /api/predict)
```json
{
  "age": 54, "male": 1, "BMI": 28.5,
  "sysBP": 128, "diaBP": 84, "totChol": 220,
  "heartRate": 72, "currentSmoker": 0,
  "cigsPerDay": 0, "BPMeds": 0,
  "prevalentStroke": 0, "diabetes": 0
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "risk_score": 42,
    "risk_level": "Medium",
    "confidence": 0.87,
    "probability": {"Low": 0.31, "Medium": 0.48, "High": 0.21}
  },
  "shap_values": [
    {"feature": "BMI", "value": 0.126},
    {"feature": "Age", "value": 0.084}
  ]
}
```

---

## 🛠 Tech Stack

**Frontend:** HTML5 · CSS3 (Glassmorphism) · Vanilla JS · Chart.js  
**Backend:** Python 3.11 · Flask 3.0 · Flask-CORS  
**ML:** Scikit-learn · SHAP · Pandas · NumPy  
**AI Chat:** OpenAI GPT-4o-mini  
**Deploy:** Docker · Docker Compose · Gunicorn  

---

## 📊 Pages

1. **Home** — Hero, stats strip, feature cards, AI chat
2. **Prediction** — 12-field form, animated risk ring, SHAP bars, AI explainer
3. **Analytics** — 7 interactive Chart.js visualizations
4. **Model Performance** — ROC curves, radar chart, confusion matrix
5. **Upload Data** — Drag-and-drop CSV/Excel with batch results
6. **About** — Methodology timeline, dataset info, tech stack
7. **Contact** — Contact form, social links

---

## 🎯 Portfolio Highlights

- ✅ End-to-end ML pipeline from EDA to deployment
- ✅ Explainable AI with SHAP analysis
- ✅ Production-ready Flask REST API
- ✅ Real-time AI assistant (OpenAI integration)
- ✅ Batch processing with CSV upload/download
- ✅ Dockerized multi-service deployment
- ✅ Zero-dependency frontend (pure HTML/CSS/JS)
- ✅ Clinical-grade UI with dark theme glassmorphism

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for internship portfolios, placement interviews, and LinkedIn showcase.*  
*Star ⭐ this repo if it helped you!*
  
