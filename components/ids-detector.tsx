'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Shield, RotateCcw, Upload } from 'lucide-react'

interface DetectionResult {
  status: 'NORMAL' | 'ATTACK_DETECTED' | 'ERROR'
  message: string
  timestamp: string
  confidence?: number
  prediction?: number
}

interface LogEntry {
  timestamp: string
  protocol: string
  service: string
  status: string
  confidence: number
  duration?: number
  src_bytes?: number
  dst_bytes?: number
}

interface BatchResult {
  total: number
  attacks: number
  normal: number
  attack_rate: number
}

export function IDSDetector() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [protocols, setProtocols] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const [showLogs, setShowLogs] = useState(true)

  const [formData, setFormData] = useState({
    duration: '',
    protocol: '',
    service: '',
    src_bytes: '',
    dst_bytes: '',
  })

  // Load dropdown options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/options')
        const data = await response.json()
        setProtocols(data.protocols)
        setServices(data.services)
      } catch (error) {
        console.error('Failed to load options:', error)
      }
    }
    loadOptions()
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logs')
      const data = await response.json()
      setLogs(data.logs)
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleReset = () => {
    setFormData({
      duration: '',
      protocol: '',
      service: '',
      src_bytes: '',
      dst_bytes: '',
    })
    setResult(null)
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

      if (data.status === 'ERROR') {
        setResult({
          status: 'ERROR',
          message: data.message || 'Lỗi xử lý',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        })
      } else {
        setResult({
          status: data.status,
          message: data.message,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          confidence: data.confidence,
          prediction: data.prediction,
        })
        // Refresh logs after analysis
        setTimeout(fetchLogs, 500)
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

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBatch(true)
    setBatchResult(null)

    try {
      const formPayload = new FormData()
      formPayload.append('file', file)

      const response = await fetch('http://localhost:5000/api/batch', {
        method: 'POST',
        body: formPayload,
      })

      const data = await response.json()
      setBatchResult({
        total: data.total,
        attacks: data.attacks,
        normal: data.normal,
        attack_rate: data.attack_rate,
      })
      // Refresh logs after batch processing
      setTimeout(fetchLogs, 500)
    } catch (error) {
      alert('Lỗi tải file. Vui lòng kiểm tra định dạng CSV.')
    } finally {
      setUploadingBatch(false)
      // Reset file input
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hệ Thống Phát Hiện Xâm Nhập</h1>
          </div>
          <p className="text-muted-foreground text-lg">
           Ứng dụng Dession Tree trong nhận diện mối đe dọa xâm nhập mạng
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-xl">Nhập Thông Số Mạng</CardTitle>
                <CardDescription>Điền các thông tin chi tiết về kết nối mạng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <select
                        id="protocol"
                        value={formData.protocol}
                        onChange={(e) => handleInputChange('protocol', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                      >
                        <option value="">Chọn giao thức...</option>
                        {protocols.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium mb-2">
                        Dịch Vụ
                      </label>
                      <select
                        id="service"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                      >
                        <option value="">Chọn dịch vụ...</option>
                        {services.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10"
                    >
                      {isLoading ? 'Đang phân tích...' : 'Phân Tích'}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleReset}
                      disabled={isLoading}
                      variant="outline"
                      className="h-10 px-4"
                      title="Xóa form"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </form>

                {/* Batch Upload */}
                <div className="mt-6 pt-6 border-t border-border">
                  <label className="block text-sm font-medium mb-3">Phân Tích Hàng Loạt</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBatchUpload}
                      disabled={uploadingBatch}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-secondary/50 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {uploadingBatch ? 'Đang tải...' : 'Chọn file CSV'}
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Batch Results */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm">
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

            {/* Single Analysis Result with Confidence */}
            {result && result.status !== 'ERROR' && (
              <div
                className={`rounded-lg border p-5 animate-in fade-in ${
                  result.status === 'NORMAL'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {result.status === 'NORMAL' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-sm ${
                        result.status === 'NORMAL' ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {result.status === 'NORMAL' ? 'Kết Nối An Toàn' : 'Phát Hiện Mối Đe Dọa'}
                    </h3>
                    <p className="text-xs text-foreground/80 mt-1">{result.message}</p>
                  </div>
                </div>

                {/* Confidence Score */}
                {result.confidence !== undefined && (
                  <div className="bg-white/50 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Độ Tin Cậy AI</span>
                      <span className="text-sm font-bold">{result.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          result.status === 'NORMAL' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(result.confidence, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Result */}
            {result && result.status === 'ERROR' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-yellow-900">Lỗi Xử Lý</h3>
                    <p className="text-xs text-foreground/80 mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Analysis Result */}
            {batchResult && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 animate-in fade-in">
                <h3 className="font-semibold text-sm text-blue-900 mb-4">Kết Quả Phân Tích Hàng Loạt</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">Tổng kết nối:</span>
                    <span className="font-bold">{batchResult.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">Tấn công:</span>
                    <span className="font-bold text-red-600">{batchResult.attacks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/70">Bình thường:</span>
                    <span className="font-bold text-green-600">{batchResult.normal}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                    <span className="text-foreground/70">Tỷ lệ tấn công:</span>
                    <span className="font-bold text-lg">{batchResult.attack_rate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logs Table */}
        {showLogs && (
          <div className="mt-10">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lịch Sử Phân Tích</CardTitle>
                  <CardDescription>Các phân tích gần đây nhất</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có phân tích nào</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr>
                          <th className="text-left py-3 px-2 font-medium">Thời Gian</th>
                          <th className="text-left py-3 px-2 font-medium">Giao Thức</th>
                          <th className="text-left py-3 px-2 font-medium">Dịch Vụ</th>
                          <th className="text-left py-3 px-2 font-medium">Kết Quả</th>
                          <th className="text-left py-3 px-2 font-medium">Độ Tin Cậy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 20).map((log, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-3 px-2 text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-3 px-2 text-xs">{log.protocol}</td>
                            <td className="py-3 px-2 text-xs">{log.service}</td>
                            <td className="py-3 px-2">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded ${
                                  log.status === 'NORMAL'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {log.status === 'NORMAL' ? 'An Toàn' : 'Tấn Công'}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-xs font-bold">{log.confidence}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-10">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">Hoạt Động</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-foreground/80 mb-4">
                Hệ thống sử dụng mô hình học máy Decision Tree được huấn luyện từ các mẫu lưu lượng mạng để phát hiện các mối đe dọa an ninh tiềm ẩn.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground/80">
                <div>
                  <span className="font-medium text-foreground">Thời Lượng:</span> Thời gian kết nối tính bằng giây
                </div>
                <div>
                  <span className="font-medium text-foreground">Giao Thức:</span> Loại giao thức (tcp, udp, icmp...)
                </div>
                <div>
                  <span className="font-medium text-foreground">Dịch Vụ:</span> Ứng dụng dịch vụ (http, ftp, ssh...)
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
            @By Nhóm 1
          </p>
        </div>
      </div>
    </div>
  )
}
