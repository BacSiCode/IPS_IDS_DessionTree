# Deploy Flask Backend lên Railway

Railway là dịch vụ cloud miễn phí rất phù hợp để deploy Flask app. Hướng dẫn chi tiết dưới đây.

## Bước 1: Tạo Tài Khoản Railway

1. Truy cập: https://railway.app
2. Click **"Sign Up"**
3. Đăng ký bằng GitHub (dễ nhất)
4. Xác nhận email

## Bước 2: Chuẩn Bị Flask Project

### 2.1 Thêm file `runtime.txt` (Chỉ định Python version)

Tạo file `runtime.txt` ở **root** của project:

```
python-3.11.7
```

### 2.2 Cập nhật `flask_app.py`

Thay đổi dòng cuối để lấy port từ environment variable:

```python
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
```

### 2.3 Tạo file `.env.example` (để reference)

```
# Flask Environment
FLASK_ENV=production

# Port (Railway sẽ auto set)
PORT=5000
```

## Bước 3: Push Code lên GitHub

```bash
git add .
git commit -m "Add Railway deployment files"
git push origin main
```

## Bước 4: Deploy lên Railway

### 4.1 Tạo Project trên Railway

1. Truy cập https://dashboard.railway.app
2. Click **"Create New Project"**
3. Click **"Deploy from GitHub repo"**
4. Chọn repository của bạn
5. Click **"Deploy"**

### 4.2 Chờ Deploy Hoàn Thành

- Railway sẽ tự động:
  - Clone code từ GitHub
  - Cài đặt dependencies từ `requirements.txt`
  - Chạy Flask app

- Thời gian: 2-5 phút

### 4.3 Lấy URL Backend

1. Vào **Dashboard > Your Project**
2. Click tab **"Deployments"**
3. Chọn deployment mới
4. Copy **"Public URL"** (dạng: `https://abc123.up.railway.app`)

## Bước 5: Cập Nhật Frontend (Vercel)

### 5.1 Cập nhật Environment Variable trên Vercel

1. Vào project Vercel của bạn
2. **Settings > Environment Variables**
3. Thêm biến mới:
   - **Name:** `NEXT_PUBLIC_FLASK_API_URL`
   - **Value:** `https://abc123.up.railway.app` (URL từ Railway)
   - Click **"Add"**

4. Redeploy Vercel:
   - Vào **Deployments**
   - Click **"Redeploy"** trên deployment mới nhất
   - Chờ hoàn thành

### 5.2 Local Testing

Nếu muốn test local với Railway backend:

Tạo file `.env.local`:

```
NEXT_PUBLIC_FLASK_API_URL=https://abc123.up.railway.app
```

Sau đó chạy:

```bash
pnpm dev
```

## Bước 6: Thêm Data.csv lên Railway

Railroad backend cần file `data.csv` để huấn luyện model. 

### Cách 1: Push vào GitHub (Nên làm)

```bash
git add data.csv
git commit -m "Add training data"
git push origin main
```

Railway sẽ tự động pull file này.

### Cách 2: Upload trực tiếp lên Railway

1. Vào **Dashboard > Project > Volumes**
2. Tạo Volume mới
3. Mount tại `/app`
4. Upload file lên

## Bước 7: Huấn Luyện Model trên Railway

Có 2 cách:

### Cách 1: Local, Push Model lên GitHub

1. Local, chạy: `python train_model.py`
2. Files được tạo: `model.pkl`, `encoder_protocol.pkl`, `encoder_service.pkl`
3. Push lên GitHub:
   ```bash
   git add *.pkl
   git commit -m "Add trained models"
   git push origin main
   ```
4. Railway sẽ pull files này tự động

### Cách 2: SSH vào Railway, Huấn Luyện

1. Vào **Dashboard > Project**
2. Tab **"Shell"**
3. Chạy: `python train_model.py`

## Bước 8: Kiểm Tra

### Test Backend

```bash
curl https://abc123.up.railway.app/api/options
```

Nếu nhận được JSON với protocols và services = Success ✓

### Test Frontend

Mở Vercel app của bạn, nó sẽ tự động kết nối đến Railway backend.

## Troubleshooting

### Lỗi "Cannot connect to Flask"

**Nguyên nhân:** 
- Railway app chưa fully deploy
- URL sai
- CORS issue

**Giải pháp:**
1. Kiểm tra Railway deployment status
2. Copy lại URL từ Railway
3. Cập nhật `NEXT_PUBLIC_FLASK_API_URL` trên Vercel
4. Redeploy Vercel

### Lỗi "model.pkl not found"

**Nguyên nhân:** Model chưa được huấn luyện

**Giải pháp:**
1. Local chạy: `python train_model.py`
2. Push .pkl files lên GitHub
3. Railway redeploy tự động

### Lỗi "data.csv not found"

**Nguyên nhân:** File không có trên Railway

**Giải pháp:**
1. Đảm bảo data.csv được push lên GitHub
2. Railway redeploy

### App timeout/crash

**Nguyên nhân:** Model quá lớn hoặc memory không đủ

**Giải pháp:**
1. Vào Railway > Project > Settings
2. Tăng **Memory** (nếu có)
3. Redeploy

## Summary Lệnh

```bash
# Local
python train_model.py
git add .
git commit -m "Add models"
git push origin main

# Wait for Railway auto-redeploy (2-5 min)

# Update Vercel env var
# NEXT_PUBLIC_FLASK_API_URL=https://xxx.up.railway.app

# Redeploy Vercel
# Done!
```

## Tài Liệu Tham Khảo

- Railway Docs: https://docs.railway.app
- Flask + Railway: https://docs.railway.app/getting-started
- Environment Variables: https://docs.railway.app/guides/variables

## Chi Phí

- **Railway:** Miễn phí tháng đầu, sau đó $5/tháng (credit lên đến $5)
- **Vercel:** Miễn phí cho Next.js apps
