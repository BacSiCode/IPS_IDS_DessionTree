# Quick Start Guide

## Local Development (Máy Local)

```bash
# 1. Cài dependencies
pnpm install
pip install -r requirements.txt

# 2. Tạo .env.local
echo "NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000" > .env.local

# 3. Huấn luyện model
python train_model.py

# 4. Terminal 1 - Chạy Flask backend
python flask_app.py

# 5. Terminal 2 - Chạy Next.js frontend
pnpm dev

# 6. Mở browser
# http://localhost:3000
```

---

## Production Deployment (Lên Web)

### Step 1: Deploy Flask Backend (Railway)

```bash
# Push code lên GitHub
git add .
git commit -m "Deploy ready"
git push origin main

# Vào https://railway.app
# - New Project
# - Deploy from GitHub
# - Chọn repo
# - Copy Public URL (dạng: https://abc123.up.railway.app)
```

### Step 2: Cập Nhật Environment Variable (Vercel)

1. Vào Vercel Dashboard
2. Project > Settings > Environment Variables
3. Thêm:
   - **Name:** `NEXT_PUBLIC_FLASK_API_URL`
   - **Value:** `https://abc123.up.railway.app`
4. Redeploy

### Step 3: Done!

Frontend sẽ tự động kết nối đến Flask backend trên Railway.

---

## Kiểm Tra

### Local
```bash
curl http://localhost:5000/api/options
# Nếu nhận JSON = OK
```

### Production
```bash
curl https://abc123.up.railway.app/api/options
# Nếu nhận JSON = OK
```

---

## Troubleshooting

**Lỗi: "Lỗi kết nối. Vui lòng kiểm tra máy chủ Flask"**
- → Frontend không kết nối được backend
- → Kiểm tra `NEXT_PUBLIC_FLASK_API_URL` có đúng không
- → Kiểm tra Railway app có chạy không (vào Dashboard > Deployments)

**Lỗi: "model.pkl not found"**
- → Chạy `python train_model.py` ở local
- → Push .pkl files lên GitHub
- → Railway auto redeploy

**Lỗi: "data.csv not found"**
- → Đảm bảo data.csv trong root project
- → Push lên GitHub

---

## File Quan Trọng

| File | Mục đích |
|------|---------|
| `flask_app.py` | Flask backend API |
| `train_model.py` | Huấn luyện Decision Tree |
| `components/ids-detector.tsx` | Giao diện chính |
| `data.csv` | Dữ liệu huấn luyện |
| `.env.example` | Template environment |
| `DEPLOY_RAILWAY.md` | Chi tiết deployment |

---

**Xong! App sẽ chạy ở:**
- Local: `http://localhost:3000`
- Production: `https://yourapp.vercel.app`
