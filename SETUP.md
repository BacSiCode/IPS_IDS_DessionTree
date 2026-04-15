# Hệ Thống Phát Hiện Xâm Nhập (IDS)

## Cấu Trúc Dự Án

```
project-root/
├── app/                      # Next.js frontend
├── components/               # React components
├── public/                   
├── data.csv                  # Dữ liệu KDD (5 cột)
├── train_model.py           # Script huấn luyện model
├── flask_app.py             # Backend Flask
├── requirements.txt         # Python dependencies
├── package.json             
└── ...
```

## Cách Cài Đặt và Chạy

### 1. Clone và Cài Đặt Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd project-root

# Cài đặt Node.js dependencies
pnpm install

# Cài đặt Python dependencies
pip install -r requirements.txt
```

### 1.1 Cấu Hình Environment (Local)

Tạo file `.env.local` ở root project:

```
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000
```

Xem file `.env.example` để tham khảo các biến khác.

### 2. Chuẩn Bị Dữ Liệu

- Đặt file `data.csv` vào **root** của project
- Format CSV (5 cột): `duration,protocol,service,src_bytes,dst_bytes,label`
- Ví dụ:
  ```
  0,tcp,http,351,9114,0
  0,tcp,bgp,6,0,1
  2,tcp,ftp_data,2194619,0,0
  ```

### 3. Huấn Luyện Model

```bash
python train_model.py
```

**Output:**
- `model.pkl` - Decision Tree model
- `encoder_protocol.pkl` - Encoder cho protocol
- `encoder_service.pkl` - Encoder cho service

### 4. Chạy Ứng Dụng

**Terminal 1 - Flask Backend:**
```bash
python flask_app.py
```
- Backend chạy trên: `http://localhost:5000`

**Terminal 2 - Next.js Frontend:**
```bash
pnpm dev
```
- Frontend chạy trên: `http://localhost:3000`

### 5. Sử Dụng

1. Mở browser: `http://localhost:3000`
2. Nhập 5 thông số mạng (duration, protocol, service, src_bytes, dst_bytes)
3. Click "Phân Tích"
4. Xem kết quả: **Bình thường** hoặc **Phát hiện tấn công**

## File Quan Trọng

- **train_model.py**: Huấn luyện Decision Tree trên data.csv
- **flask_app.py**: API backend xử lý dự đoán
- **components/ids-detector.tsx**: Giao diện chính
- **requirements.txt**: Python packages cần thiết

## Troubleshooting

**Lỗi "data.csv not found":**
- Kiểm tra data.csv có ở root project không

**Lỗi "Connection refused":**
- Chắc chắn Flask backend đang chạy trên port 5000

**Lỗi "Unknown protocol/service":**
- Protocol/service trong input phải có trong data.csv
- Ví dụ: tcp, udp, http, ftp, ssh, etc.

## Deploy lên Production

Để deploy lên Vercel + Railway (recommended):

1. **Deploy Flask Backend lên Railway** - Xem file `DEPLOY_RAILWAY.md`
2. **Deploy Frontend lên Vercel** - Sử dụng GitHub connection tự động
3. **Cấu hình Environment Variable** - Thêm `NEXT_PUBLIC_FLASK_API_URL` trên Vercel

Chi tiết: Xem `DEPLOY_RAILWAY.md`

## Notes

- Model sử dụng Decision Tree Classifier
- Hỗ trợ phát hiện: Normal traffic vs Attack traffic
- Frontend giao diện Tiếng Việt, responsive trên mobile/desktop
- Backend URL có thể cấu hình qua environment variable `NEXT_PUBLIC_FLASK_API_URL`
