import pandas as pd
import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder

# ===== 1. Đọc dữ liệu =====
print("Reading data for Multi-class training...")
df = pd.read_csv('data.csv')

# Làm sạch dữ liệu
df.replace([float('inf'), float('-inf')], pd.NA, inplace=True)
df.fillna(0, inplace=True)
df.columns = df.columns.str.strip()

# ===== 2. Chuẩn bị Feature & Target =====
features = [
    'Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
    'Flow Bytes/s', 'Flow Packets/s', 'Packet Length Mean', 'Packet Length Std',
    'SYN Flag Count', 'ACK Flag Count', 'Average Packet Size', 'Init_Win_bytes_forward',
    'Active Mean', 'Idle Mean'
]

X = df[features]

# Xử lý nhãn đa lớp (Multi-class)
print("Encoding labels (DDoS, Bot, PortScan, Benign...)...")
le = LabelEncoder()
y = le.fit_transform(df['Label'].str.strip())

# Lưu Label Encoder để API có thể giải mã sau này
with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

# ===== 3. Huấn luyện mô hình =====
print("Training Multi-class Decision Tree...")
# Tăng max_depth lên một chút để phân tách tốt hơn các lớp tấn công khác nhau
model = DecisionTreeClassifier(max_depth=15, random_state=42)
model.fit(X, y)

# ===== 4. Lưu mô hình =====
print("Saving model...")
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# ===== 5. Đánh giá =====
accuracy = model.score(X, y)
classes = le.classes_

print(f"\nTraining SUCCESS!")
print(f"Accuracy: {accuracy:.2%}")
print(f"Classes detected: {list(classes)}")
print("--------------------------------------------------")
print("AI is now ready for multi-class classification.")