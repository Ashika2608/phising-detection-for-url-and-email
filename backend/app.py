import os
import whois
import cv2
import numpy as np
import io
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import google.generativeai as genai

app = Flask(__name__)

# --- CORS FIX ---
CORS(app, resources={r"/*": {"origins": "*"}})

# --- AI CONFIG ---
GOOGLE_API_KEY = "AIzaSyC-H0yUNq-gEq9UGZ3PjGmFTsxELGkrMCE" 
genai.configure(api_key=GOOGLE_API_KEY)
model_ai = genai.GenerativeModel('gemini-1.5-flash')

# --- DATABASE SETUP ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///phishing_vfinal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class PredictionHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    content = db.Column(db.String(500))
    result = db.Column(db.String(50))
    score = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# --- CORS HELPERS ---
def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response

def _corsify(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# --- ROUTES ---

@app.route("/predict", methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS': return _build_cors_preflight_response()
    data = request.json
    mode = data.get('mode', 'URL')
    content = data.get('content', '')
    
    result_label = "Safe"
    risk_score = 15
    if any(k in content.lower() for k in ["http://", "free", "win", "login", "verify", "bit.ly"]):
        result_label = "Phishing"
        risk_score = 85

    try:
        new_entry = PredictionHistory(type=mode, content=content, result=result_label, score=risk_score)
        db.session.add(new_entry)
        db.session.commit()
    except:
        db.session.rollback()

    return _corsify(jsonify({'result': result_label, 'risk_score': risk_score}))

@app.route("/history", methods=['GET'])
def get_history():
    history = PredictionHistory.query.order_by(PredictionHistory.timestamp.desc()).all()
    return _corsify(jsonify([
        {
            'id': h.id, 
            'type': h.type, 
            'content': h.content, 
            'result': h.result, 
            'score': h.score, 
            'timestamp': h.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        } for h in history
    ]))

@app.route("/scan_qr", methods=['POST', 'OPTIONS'])
def scan_qr():
    if request.method == 'OPTIONS': return _build_cors_preflight_response()
    if 'image' not in request.files:
        return _corsify(jsonify({'error': 'No image uploaded'})), 400
        
    try:
        file = request.files['image']
        data = np.frombuffer(file.read(), dtype=np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        
        detector = cv2.QRCodeDetector()
        val, pts, st_code = detector.detectAndDecode(img)
        
        if val:
            return _corsify(jsonify({'url': val}))
        return _corsify(jsonify({'error': 'No QR code found. Clear-aa photo edunga!'})), 400
    except Exception as e:
        return _corsify(jsonify({'error': str(e)})), 500

@app.route("/chat", methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS': return _build_cors_preflight_response()
    data = request.json
    user_query = data.get('message', '')
    try:
        response = model_ai.generate_content(user_query)
        return _corsify(jsonify({'reply': response.text}))
    except:
        return _corsify(jsonify({'reply': "AI busy-aa irukku!"}))

if __name__ == "__main__":
    app.run(port=5000, debug=True)