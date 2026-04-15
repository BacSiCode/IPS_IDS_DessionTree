'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Shield, RotateCcw, Upload, Trash2 as Trash2Icon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  src_bytes?: number
  dst_bytes?: number
}

interface AlertItem {
  id: string
  time: string
  type: string
  confidence: number
}

interface TrafficDataPoint {
  time: string
  normal: number
  attack: number
}

export function ProfessionalSOCDashboard() {
  // Manual Analysis Tab State
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [protocols, setProtocols] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const [batchResult, setBatchResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    duration: '',
    protocol: '',
    service: '',
    src_bytes: '',
    dst_bytes: '',
  })

  // Live Monitoring Tab State
  const [isLiveMonitor, setIsLiveMonitor] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

  // Load dropdown options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch(`${FLASK_API_URL}/api/options`)
        const data = await response.json()
        setProtocols(data.protocols)
        setServices(data.services)
      } catch (error) {
        console.error('Failed to load options:', error)
      }
    }
    loadOptions()
  }, [])

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/api/logs`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  // Live monitoring - fetches real data from backend every 1500ms
  useEffect(() => {
    if (!isLiveMonitor) return

    fetchLogs()
    const interval = setInterval(fetchLogs, 1500)

    return () => clearInterval(interval)
  }, [isLiveMonitor])

  // Clear logs function
  const handleClearLogs = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/api/logs`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
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

      const response = await fetch(`${FLASK_API_URL}/`, {
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
      }
    } catch (error) {
      setResult({
        status: 'ERROR',
        message: 'Lỗi kết nối. Vui lòng kiểm tra máy chủ Flask.',
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

      const response = await fetch(`${FLASK_API_URL}/api/batch`, {
        method: 'POST',
        body: formPayload,
      })

      const data = await response.json()
      setBatchResult(data)
    } catch (error) {
      alert('Lỗi tải file. Vui lòng kiểm tra định dạng CSV.')
    } finally {
      setUploadingBatch(false)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold">Trung Tâm Giám Sát Bảo Mật</h1>
          </div>
          <p className="text-muted-foreground">Hệ thống phát hiện xâm nhập dựa trên học máy</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="manual" className="text-base">
              Phân tích thủ công
            </TabsTrigger>
            <TabsTrigger value="live" className="text-base">
              Giám sát trực tuyến
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Manual Analysis */}
          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Form */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle>Nhập Thông Số Mạng</CardTitle>
                  <CardDescription>Điền thông tin chi tiết về kết nối mạng</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Thời Lượng (giây)</label>
                      <Input
                        type="number"
                        placeholder="1500"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Giao Thức</label>
                      <select
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
                      <label className="block text-sm font-medium mb-2">Dịch Vụ</label>
                      <select
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
                      <label className="block text-sm font-medium mb-2">Byte Nguồn</label>
                      <Input
                        type="number"
                        placeholder="4000"
                        value={formData.src_bytes}
                        onChange={(e) => handleInputChange('src_bytes', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Byte Đích</label>
                      <Input
                        type="number"
                        placeholder="8000"
                        value={formData.dst_bytes}
                        onChange={(e) => handleInputChange('dst_bytes', e.target.value)}
                        disabled={isLoading}
                        className="border-border"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      >
                        {isLoading ? 'Đang phân tích...' : 'Phân Tích'}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReset}
                        disabled={isLoading}
                        variant="outline"
                        className="px-4"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Right: Result */}
              <div className="space-y-6">
                {result && (
                  <Card
                    className={`border-2 ${
                      result.status === 'NORMAL'
                        ? 'border-green-500/30 bg-green-500/5'
                        : result.status === 'ATTACK_DETECTED'
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-yellow-500/30 bg-yellow-500/5'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-3">
                        {result.status === 'NORMAL' ? (
                          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {result.status === 'NORMAL' ? 'Kết Nối An Toàn' : 'Phát Hiện Mối Đe Dọa'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.confidence !== undefined && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Độ tin cậy AI</span>
                            <span className="text-sm font-bold">{result.confidence}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                result.status === 'NORMAL' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${result.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Batch Upload */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle>Phân Tích Hàng Loạt (CSV)</CardTitle>
                <CardDescription>Tải lên file CSV để phân tích nhiều kết nối cùng lúc</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative mb-6">
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
                    className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">
                      {uploadingBatch ? 'Đang tải...' : 'Chọn file CSV hoặc kéo thả'}
                    </span>
                  </label>
                </div>

                {batchResult && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Tổng kết nối</p>
                      <p className="text-2xl font-bold">{batchResult.total}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Tấn công</p>
                      <p className="text-2xl font-bold text-red-500">{batchResult.attacks}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Bình thường</p>
                      <p className="text-2xl font-bold text-green-500">{batchResult.normal}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Live Monitoring */}
          <TabsContent value="live" className="space-y-6">
            {/* Live Radar Toggle Section */}
            <Card className="border-border shadow-sm bg-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Chế độ Radar (Live Monitoring)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tự động cập nhật bản ghi lưu lượng mạng thực tế bay qua Card mạng
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsLiveMonitor(!isLiveMonitor)}
                    variant={isLiveMonitor ? 'destructive' : 'default'}
                    className="whitespace-nowrap"
                  >
                    {isLiveMonitor ? '⏹ Dừng Giám Sát' : '▶ Bật Giám Sát Real-time'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table Section */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lịch Sử Phân Tích</CardTitle>
                  <CardDescription>Các phân tích thực tế từ backend</CardDescription>
                </div>
                <Button
                  onClick={handleClearLogs}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2Icon className="w-4 h-4" />
                  Xóa Lịch Sử
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {isLiveMonitor ? 'Chờ dữ liệu từ backend...' : 'Bật giám sát để xem dữ liệu'}
                  </p>
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
                        {logs.map((log, idx) => (
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
                                    ? 'bg-green-500/20 text-green-700'
                                    : 'bg-red-500/20 text-red-700'
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
