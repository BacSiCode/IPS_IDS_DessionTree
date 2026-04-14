from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

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

@app.route('/', methods=['POST'])
def predict():
    try:
        # Get form data
        duration = float(request.form.get('f1'))
        protocol = request.form.get('f2').strip().lower()
        service = request.form.get('f3').strip().lower()
        src_bytes = float(request.form.get('f4'))
        dst_bytes = float(request.form.get('f5'))
        
        # Encode categorical features
        try:
            protocol_encoded = encoder_protocol.transform([protocol])[0]
            service_encoded = encoder_service.transform([service])[0]
        except:
            # If unknown category, use a default value
            protocol_encoded = 0
            service_encoded = 0
        
        # Prepare features
        features = np.array([[duration, protocol_encoded, service_encoded, src_bytes, dst_bytes]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0]
        
        # Return result
        if prediction == 1:
            status = "ATTACK_DETECTED"
            message = "⚠️ ATTACK DETECTED"
        else:
            status = "NORMAL"
            message = "✓ NORMAL"
        
        return jsonify({
            'status': status,
            'message': message,
            'prediction': int(prediction),
            'confidence': float(max(probability))
        })
    
    except ValueError:
        return jsonify({
            'status': 'ERROR',
            'message': 'INPUT ERROR',
            'error': 'Invalid input values'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)