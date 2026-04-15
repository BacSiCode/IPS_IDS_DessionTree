from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load model and encoders
print("Loading model...")
with open('model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('encoder_protocol.pkl', 'rb') as f:
    encoder_protocol = pickle.load(f)

with open('encoder_service.pkl', 'rb') as f:
    encoder_service = pickle.load(f)

# Store analysis logs (in-memory, will reset on app restart)
analysis_logs = []

def predict_single(duration, protocol, service, src_bytes, dst_bytes):
    """Make prediction for single record"""
    # Encode categorical features
    try:
        protocol_encoded = encoder_protocol.transform([protocol.strip().lower()])[0]
        service_encoded = encoder_service.transform([service.strip().lower()])[0]
    except:
        protocol_encoded = 0
        service_encoded = 0
    
    # Prepare features
    features = np.array([[duration, protocol_encoded, service_encoded, src_bytes, dst_bytes]])
    
    # Make prediction
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]
    confidence = float(max(probability)) * 100
    
    return int(prediction), confidence

@app.route('/api/options', methods=['GET'])
def get_options():
    """Get dropdown options for protocols and services"""
    protocols = sorted(list(encoder_protocol.classes_))
    services = sorted(list(encoder_service.classes_))
    
    return jsonify({
        'protocols': protocols,
        'services': services
    })

@app.route('/', methods=['POST'])
def predict():
    try:
        # Get form data
        duration = float(request.form.get('f1'))
        protocol = request.form.get('f2').strip().lower()
        service = request.form.get('f3').strip().lower()
        src_bytes = float(request.form.get('f4'))
        dst_bytes = float(request.form.get('f5'))
        
        prediction, confidence = predict_single(duration, protocol, service, src_bytes, dst_bytes)
        
        # Determine status
        if prediction == 1:
            status = "ATTACK_DETECTED"
            message = "Phát hiện tấn công"
        else:
            status = "NORMAL"
            message = "Bình thường"
        
        # Log the analysis
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'duration': duration,
            'protocol': protocol,
            'service': service,
            'src_bytes': src_bytes,
            'dst_bytes': dst_bytes,
            'status': status,
            'confidence': round(confidence, 2)
        }
        analysis_logs.append(log_entry)
        # Keep only last 100 logs
        if len(analysis_logs) > 100:
            analysis_logs.pop(0)
        
        return jsonify({
            'status': status,
            'message': message,
            'prediction': prediction,
            'confidence': round(confidence, 2)
        })
    
    except ValueError:
        return jsonify({
            'status': 'ERROR',
            'message': 'Dữ liệu đầu vào không hợp lệ',
            'error': 'Invalid input values'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

@app.route('/api/logs', methods=['GET', 'DELETE'])
def get_logs():
    """Get or clear analysis logs"""
    if request.method == 'DELETE':
        analysis_logs.clear()
        return jsonify({'message': 'Logs cleared successfully'})
    
    return jsonify({
        'logs': list(reversed(analysis_logs[-50:]))  # Return last 50, reversed (newest first)
    })

@app.route('/api/batch', methods=['POST'])
def batch_predict():
    """Process CSV file for batch analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Invalid file format. Please upload CSV.'}), 400
        
        # Read CSV
        df = pd.read_csv(file)
        
        # Validate columns
        required_cols = ['duration', 'protocol', 'service', 'src_bytes', 'dst_bytes']
        if not all(col in df.columns for col in required_cols):
            return jsonify({
                'error': f'CSV must contain columns: {", ".join(required_cols)}'
            }), 400
        
        results = []
        attack_count = 0
        
        for _, row in df.iterrows():
            try:
                duration = float(row['duration'])
                protocol = str(row['protocol']).strip().lower()
                service = str(row['service']).strip().lower()
                src_bytes = float(row['src_bytes'])
                dst_bytes = float(row['dst_bytes'])
                
                prediction, confidence = predict_single(duration, protocol, service, src_bytes, dst_bytes)
                
                status = "ATTACK_DETECTED" if prediction == 1 else "NORMAL"
                if prediction == 1:
                    attack_count += 1
                
                results.append({
                    'duration': duration,
                    'protocol': protocol,
                    'service': service,
                    'status': status,
                    'confidence': round(confidence, 2)
                })
                
                # Log the analysis
                log_entry = {
                    'timestamp': datetime.now().isoformat(),
                    'duration': duration,
                    'protocol': protocol,
                    'service': service,
                    'src_bytes': src_bytes,
                    'dst_bytes': dst_bytes,
                    'status': status,
                    'confidence': round(confidence, 2)
                }
                analysis_logs.append(log_entry)
            except Exception as row_error:
                continue
        
        if len(analysis_logs) > 100:
            analysis_logs[:] = analysis_logs[-100:]
        
        total = len(results)
        normal_count = total - attack_count
        
        return jsonify({
            'total': total,
            'attacks': attack_count,
            'normal': normal_count,
            'attack_rate': round(attack_count / total * 100, 2) if total > 0 else 0,
            'results': results[:100]  # Return first 100 results
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
