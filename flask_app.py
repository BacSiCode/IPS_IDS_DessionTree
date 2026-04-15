from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Load model
print("Loading model...")
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
except:
    model = None
    print("Warning: model.pkl not found/failed to load. Please train first.")

# Store analysis logs
analysis_logs = []

def predict_single(features_dict):
    """Make prediction for single record with 14 features"""
    if model is None:
        return 0, 0.0
        
    expected_features = [
        'Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
        'Flow Bytes/s', 'Flow Packets/s', 'Packet Length Mean', 'Packet Length Std',
        'SYN Flag Count', 'ACK Flag Count', 'Average Packet Size', 'Init_Win_bytes_forward',
        'Active Mean', 'Idle Mean'
    ]
    
    default_values = {
        'Destination Port': 80,
        'Flow Duration': 500,
        'Total Fwd Packets': 2,
        'Total Backward Packets': 1,
        'Flow Bytes/s': 1000.0,
        'Flow Packets/s': 10.0,
        'Packet Length Mean': 60.0,
        'Packet Length Std': 20.0,
        'SYN Flag Count': 0,
        'ACK Flag Count': 1,
        'Average Packet Size': 60.0,
        'Init_Win_bytes_forward': 8192,
        'Active Mean': 0.0,
        'Idle Mean': 0.0
    }
    
    feature_arr = []
    for f in expected_features:
        val = features_dict.get(f)
        try:
            val_float = float(val) if val is not None else default_values[f]
        except:
            val_float = default_values[f]
        feature_arr.append(val_float)
        
    features = np.array([feature_arr])
    
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]
    confidence = float(max(probability)) * 100
    
    return int(prediction), confidence

@app.route('/api/options', methods=['GET'])
def get_options():
    return jsonify({'protocols': [], 'services': []})

@app.route('/', methods=['POST'])
def predict():
    try:
        data = request.form
        features_dict = {
            'Destination Port': data.get('f1'),
            'Flow Duration': data.get('f2'),
            'Total Fwd Packets': data.get('f3'),
            'Flow Bytes/s': data.get('f4'),
            'Packet Length Mean': data.get('f5')
        }
        
        prediction, confidence = predict_single(features_dict)
        
        if prediction == 1:
            status = "ATTACK_DETECTED"
            message = "Phát hiện tấn công"
        else:
            status = "NORMAL"
            message = "Bình thường"
            
        log_entry = {
            'timestamp': (datetime.utcnow() + timedelta(hours=7)).isoformat(),
            'port': features_dict['Destination Port'],
            'duration': features_dict['Flow Duration'],
            'fwd_packets': features_dict['Total Fwd Packets'],
            'src_bytes': features_dict['Flow Bytes/s'],
            'status': status,
            'confidence': round(confidence, 2)
        }
        analysis_logs.append(log_entry)
        if (len(analysis_logs) > 10000): analysis_logs.pop(0)
        
        return jsonify({
            'status': status,
            'message': message,
            'prediction': prediction,
            'confidence': round(confidence, 2)
        })
    except Exception as e:
        return jsonify({'status': 'ERROR', 'message': str(e)}), 500

@app.route('/api/logs', methods=['GET', 'POST', 'DELETE'])
def handle_logs():
    if request.method == 'GET':
        return jsonify({'logs': list(reversed(analysis_logs[-10000:]))})
        
    elif request.method == 'DELETE':
        analysis_logs.clear()
        return jsonify({'message': 'Logs cleared successfully'})
        
    elif request.method == 'POST':
        try:
            data = request.get_json() if request.is_json else request.form
            
            # Map features from SpiritAds sensor
            # We use defaults for missing values to ensure 14-feature compatibility
            features_dict = {
                'Destination Port':       data.get('port', 80),
                'Flow Duration':          data.get('duration', 500),
                'Total Fwd Packets':      data.get('fwd_packets', 2),
                'Total Backward Packets': data.get('bwd_packets', 1),
                'Flow Bytes/s':           float(data.get('src_bytes', 800)),
                'Flow Packets/s':         data.get('packets_per_sec', 50),
                'Packet Length Mean':     data.get('pkt_len_mean', 60),
                'Packet Length Std':      data.get('pkt_len_std', 20),
                'SYN Flag Count':         data.get('syn_count', 0),
                'ACK Flag Count':         data.get('ack_count', 1),
                'Average Packet Size':    data.get('avg_pkt_size', 60),
                'Init_Win_bytes_forward': data.get('win_bytes', 8192),
                'Active Mean':            0.0,
                'Idle Mean':              0.0
            }
            
            # THE AI DECIDES! 🧠
            prediction, confidence = predict_single(features_dict)
            
            # Differentiate based on AI Decision Tree
            status = "ATTACK_DETECTED" if prediction == 1 else "NORMAL"
            
            # Overwrite if it's a confirmed static threat (like Honeypot)
            external_status = data.get('status')
            if external_status == 'ATTACK_DETECTED' and confidence < 80:
                 status = "ATTACK_DETECTED" # Trust the sensor if it's a clear honeypot hit

            source_ip = data.get('ip') if 'ip' in data else 'Unknown'
            path = data.get('path') if 'path' in data else '/'

            log_entry = {
                'timestamp': (datetime.utcnow() + timedelta(hours=7)).isoformat(),
                'port': features_dict['Destination Port'],
                'duration': features_dict['Flow Duration'],
                'fwd_packets': features_dict['Total Fwd Packets'],
                'src_bytes': features_dict['Flow Bytes/s'],
                'status': status,
                'confidence': round(confidence, 2),
                'note': f"IP: {source_ip} | Path: {path}"
            }
            analysis_logs.append(log_entry)
            if (len(analysis_logs) > 10000): analysis_logs.pop(0)
                
            return jsonify({'success': True, 'status': status, 'prediction': prediction}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 400

@app.route('/api/batch', methods=['POST'])
def batch_predict():
    try:
        if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
        file = request.files['file']
        
        df = pd.read_csv(file)
        results = []
        attack_count = 0
        
        for _, row in df.iterrows():
            try:
                features_dict = row.to_dict()
                prediction, confidence = predict_single(features_dict)
                status = "ATTACK_DETECTED" if prediction == 1 else "NORMAL"
                if prediction == 1: attack_count += 1
                
                results.append({
                    'status': status,
                    'confidence': round(confidence, 2)
                })
            except:
                continue
                
        total = len(results)
        return jsonify({
            'total': total,
            'attacks': attack_count,
            'normal': total - attack_count,
            'attack_rate': round(attack_count / total * 100, 2) if total > 0 else 0,
            'results': results[:100]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
