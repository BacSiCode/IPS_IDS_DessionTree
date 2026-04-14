import pandas as pd
import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder

# ===== 1. Đọc dữ liệu =====
print(" Đang tải dữ liệu...")
df = pd.read_csv('data.csv')  # ❗ bỏ header=None

# ===== 2. Tách dữ liệu =====
X = df[['duration', 'protocol', 'service', 'src_bytes', 'dst_bytes']]
y = df['label']

# ===== 3. Mã hóa dữ liệu dạng chữ =====
print(" Đang mã hóa dữ liệu (protocol, service)...")

le_protocol = LabelEncoder()
le_service = LabelEncoder()

X['protocol'] = le_protocol.fit_transform(X['protocol'])
X['service'] = le_service.fit_transform(X['service'])

# ===== 4. Huấn luyện mô hình =====
print(" Đang huấn luyện Decision Tree...")

model = DecisionTreeClassifier(max_depth=10, random_state=42)
model.fit(X, y)

# ===== 5. Lưu mô hình =====
print(" Đang lưu mô hình...")

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('encoder_protocol.pkl', 'wb') as f:
    pickle.dump(le_protocol, f)

with open('encoder_service.pkl', 'wb') as f:
    pickle.dump(le_service, f)

# ===== 6. Đánh giá =====
accuracy = model.score(X, y)

print(f" Huấn luyện thành công!")
print(f" Độ chính xác: {accuracy:.2%}")
print(" Đã lưu: model.pkl, encoder_protocol.pkl, encoder_service.pkl")