🛡️ **IPS/IDS Network Security with Decision Tree**

Dự án xây dựng **hệ thống Phát hiện Xâm nhập Mạng (IDS)** ứng dụng thuật
toán học máy **Decision Tree (Cây quyết định)**. Hệ thống cho phép giám sát
lưu lượng mạng theo thời gian thực và phân tích dữ liệu hàng loạt để
nhận diện các hành vi tấn công mạng dựa trên bộ dữ liệu huấn luyện
chuyên sâu.

------------------------------------------------------------------------

🚀 **Tính năng chính**

-   Phân tích Real-time: Nhập các thông số mạng (Duration, Protocol,
    Service, Bytes) để nhận kết quả cảnh báo ngay lập tức.
-   Thuật toán Decision Tree: Sử dụng mô hình Cây quyết định để phân
    loại chính xác các loại hình kết nối (Normal vs Attack).
-   Độ tin cậy AI (Confidence Score): Hiển thị trực quan mức độ tin
    tưởng của mô hình đối với mỗi dự đoán thông qua thanh Progress Bar.
-   Xử lý Hàng loạt (Batch Processing): Hỗ trợ tải lên file CSV để phân
    tích hàng ngàn dòng dữ liệu cùng lúc.
-   Nhật ký Hệ thống (Session Logs): Lưu trữ lịch sử các lần phân tích
    trong phiên làm việc để quản trị viên dễ dàng theo dõi.

------------------------------------------------------------------------

💻 **Công nghệ sử dụng**

Frontend: - Next.js (React) - shadcn/ui & Tailwind CSS - Lucide React -
Vercel

Backend: - Python - Flask & Flask-CORS - Scikit-learn, Numpy, Pandas -
Render / PythonAnywhere

------------------------------------------------------------------------

🛠️ **Hướng dẫn cài đặt**

**Backend:** cd backend pip install -r requirements.txt python flask_app.py

**Frontend:** npm install npm run dev

------------------------------------------------------------------------

⚙️ **Cấu hình API**
Mặc định hệ thống kết nối đến:

http://localhost:5000

Khi triển khai thực tế, hãy cập nhật URL trong file ids-detector.tsx trỏ về server Flask của bạn.

------------------------------------------------------------------------

👤 **Tác giả**

Lê Nguyễn Hồng Phúc (Phuc Le)

------------------------------------------------------------------------
