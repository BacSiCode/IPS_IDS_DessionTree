import pandas as pd
import pickle
from sklearn.tree import DecisionTreeClassifier

# ===== 1. Đọc dữ liệu =====
print(" Đang tải dữ liệu Friday_selected_features_c45.csv...")
df = pd.read_csv('data.csv')

# Điền các giá trị thiếu hoặc vô hạn nếu có
df.replace([float('inf'), float('-inf')], pd.NA, inplace=True)
df.fillna(0, inplace=True)

# Lọc trùng tên cột nếu data.csv có khoản trống
df.columns = df.columns.str.strip()

# ===== 2. Tách dữ liệu =====
features = [
    'Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
    'Flow Bytes/s', 'Flow Packets/s', 'Packet Length Mean', 'Packet Length Std',
    'SYN Flag Count', 'ACK Flag Count', 'Average Packet Size', 'Init_Win_bytes_forward',
    'Active Mean', 'Idle Mean'
]

X = df[features]

# Khởi tạo target: BENIGN = 0, còn lại = 1 (Tấn công)
y = df['Label'].apply(lambda x: 0 if str(x).strip().upper() == 'BENIGN' else 1)

# ===== 3. Huấn luyện mô hình =====
print(" Đang huấn luyện Decision Tree với 14 lớp tính năng mạng...")
model = DecisionTreeClassifier(max_depth=10, random_state=42)
model.fit(X, y)

# ===== 4. Lưu mô hình =====
print(" Đang lưu mô hình...")
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

# ===== 5. Đánh giá =====
accuracy = model.score(X, y)

print(f" Huấn luyện thành công!")
print(f" Độ chính xác: {accuracy:.2%}")
print(" Đã lưu: model.pkl duy nhất (không cần encoder vì toàn bộ 14 tính năng là số thực)")