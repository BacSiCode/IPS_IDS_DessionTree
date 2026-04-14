'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Shield } from 'lucide-react'

interface DetectionResult {
  status: 'NORMAL' | 'ATTACK_DETECTED' | 'ERROR'
  message: string
  timestamp: string
}

export function IDSDetector() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [formData, setFormData] = useState({
    duration: '',
    protocol: '',
    service: '',
    src_bytes: '',
    dst_bytes: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const formPayload = new FormData()
      formPayload.append('f1', formData.duration)
      formPayload.append('f2', formData.protocol)
      formPayload.append('f3', formData.service)
      formPayload.append('f4', formData.src_bytes)
      formPayload.append('f5', formData.dst_bytes)

      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        body: formPayload,
      })

      const data = await response.json()
      const isAttack = data.status === 'ATTACK_DETECTED'
      const isError = data.status === 'ERROR'

      if (isError) {
        setResult({
          status: 'ERROR',
          message: 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra các giá trị.',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        })
      } else if (isAttack) {
        setResult({
          status: 'ATTACK_DETECTED',
          message: 'Phát hiện tấn công',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        })
      } else {
        setResult({
          status: 'NORMAL',
          message: 'Bình thường',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        })
      }
    } catch (error) {
      setResult({
        status: 'ERROR',
        message: 'Lỗi kết nối. Vui lòng kiểm tra máy chủ Flask đang chạy trên localhost:5000',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hệ Thống Phát Hiện Xâm Nhập</h1>
          </div>
          <p className="text-muted-foreground text-lg">
              Ứng dụng Decision Tree trong nhận diện mối đe dọa
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl">Nhập thông số mạng</CardTitle>
                <CardDescription>Điền các thông tin chi tiết về kết nối mạng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium mb-2">
                        Thời Lượng (giây)
                      </label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="1500"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div>
                      <label htmlFor="protocol" className="block text-sm font-medium mb-2">
                        Giao Thức
                      </label>
                      <Input
                        id="protocol"
                        placeholder="tcp"
                        value={formData.protocol}
                        onChange={(e) => handleInputChange('protocol', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium mb-2">
                        Dịch Vụ
                      </label>
                      <Input
                        id="service"
                        placeholder="http"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div>
                      <label htmlFor="src_bytes" className="block text-sm font-medium mb-2">
                        Byte Nguồn
                      </label>
                      <Input
                        id="src_bytes"
                        type="number"
                        placeholder="4000"
                        value={formData.src_bytes}
                        onChange={(e) => handleInputChange('src_bytes', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="dst_bytes" className="block text-sm font-medium mb-2">
                        Byte Đích
                      </label>
                      <Input
                        id="dst_bytes"
                        type="number"
                        placeholder="8000"
                        value={formData.dst_bytes}
                        onChange={(e) => handleInputChange('dst_bytes', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10"
                  >
                    {isLoading ? 'Đang phân tích...' : 'Phân Tích'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <div>
            <Card className="border-border shadow-sm h-full">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg">Trạng Thái Hệ Thống</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm font-medium">Hoạt Động</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Sẵn sàng phân tích</p>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Lần quét gần nhất</p>
                  <p className="text-sm font-medium">
                    {result?.timestamp || 'Chưa có phân tích'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Result Alert */}
        {result && (
          <div
            className={`mt-8 rounded-lg border p-6 animate-in fade-in slide-in-from-top-4 ${
              result.status === 'NORMAL'
                ? 'border-green-200 bg-green-50'
                : result.status === 'ATTACK_DETECTED'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.status === 'NORMAL' ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    result.status === 'NORMAL'
                      ? 'text-green-900'
                      : result.status === 'ATTACK_DETECTED'
                        ? 'text-red-900'
                        : 'text-yellow-900'
                  }`}
                >
                  {result.status === 'NORMAL'
                    ? 'Kết Nối An Toàn'
                    : result.status === 'ATTACK_DETECTED'
                      ? 'Phát Hiện Mối Đe Dọa'
                      : 'Lỗi Xử Lý'}
                </h3>
                <p className="text-sm text-foreground/80">{result.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Hoạt Động</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-foreground/80 mb-4">
                Hệ thống sử dụng mô hình học máy Decision Tree được huấn luyện từ các mẫu lưu lượng mạng để phát hiện các mối đe dọa an ninh tiềm ẩn.
              </p>
              <div className="space-y-3 text-sm text-foreground/80">
                <div>
                  <span className="font-medium text-foreground">Thời Lượng:</span> Thời gian kết nối tính bằng giây
                </div>
                <div>
                  <span className="font-medium text-foreground">Giao Thức:</span> Loại giao thức (tcp, udp, icmp, v.v.)
                </div>
                <div>
                  <span className="font-medium text-foreground">Dịch Vụ:</span> Ứng dụng dịch vụ (http, ftp, ssh, v.v.)
                </div>
                <div>
                  <span className="font-medium text-foreground">Byte Nguồn/Đích:</span> Khối lượng truyền dữ liệu
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            @By nhóm 1
          </p>
        </div>
      </div>
    </div>
  )
}
