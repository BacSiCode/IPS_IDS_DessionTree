import pandas as pd
import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import os

# Load data
print("Loading data...")
df = pd.read_csv('data.csv', header=None)
df.columns = ['duration', 'protocol', 'service', 'src_bytes', 'dst_bytes', 'label']

# Separate features and target
X = df[['duration', 'protocol', 'service', 'src_bytes', 'dst_bytes']]
y = df['label']

# Encode categorical features
print("Encoding categorical features...")
le_protocol = LabelEncoder()
le_service = LabelEncoder()

X['protocol'] = le_protocol.fit_transform(X['protocol'])
X['service'] = le_service.fit_transform(X['service'])

# Train Decision Tree
print("Training Decision Tree...")
model = DecisionTreeClassifier(max_depth=10, random_state=42)
model.fit(X, y)

# Save model and encoders
print("Saving model...")
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('encoder_protocol.pkl', 'wb') as f:
    pickle.dump(le_protocol, f)

with open('encoder_service.pkl', 'wb') as f:
    pickle.dump(le_service, f)

# Print accuracy
accuracy = model.score(X, y)
print(f"Model trained successfully! Accuracy: {accuracy:.2%}")
print("Files saved: model.pkl, encoder_protocol.pkl, encoder_service.pkl")