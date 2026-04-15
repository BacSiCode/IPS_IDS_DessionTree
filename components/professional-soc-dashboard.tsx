'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Shield, RotateCcw, Upload, Activity, AlertTriangle, TrendingUp } from 'lucide-react'
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
  const [liveActive, setLiveActive] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([])
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([])
  const [totalTraffic, setTotalTraffic] = useState(0)
  const [attackCount, setAttackCount] = useState(0)
  const [threatLevel, setThreatLevel] = useState<'safe' | 'warning' | 'critical'>('safe')

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

  // Simulate live monitoring data
  useEffect(() => {
    if (!liveActive) return

    const interval = setInterval(() => {
      const isAttack = Math.random() > 0.8
      const newTraffic = Math.floor(Math.random() * 1000) + 100

      // Update metrics
      setTotalTraffic((prev) => prev + newTraffic)
      if (isAttack) {
        setAttackCount((prev) => prev + 1)
      }

      // Add to live logs
      const protocols = ['tcp', 'udp', 'icmp']
      const services = ['http', 'https', 'ssh', 'ftp', 'dns', 'smtp']
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        service: services[Math.floor(Math.random() * services.length)],
        status: isAttack ? 'ATTACK_DETECTED' : 'NORMAL',
        confidence: Math.floor(Math.random() * 40 + 60),
        src_bytes: Math.floor(Math.random() * 5000),
        dst_bytes: Math.floor(Math.random() * 5000),
      }
      setLiveLogs((prev) => [newLog, ...prev.slice(0, 29)])

      // Add alert if attack
      if (isAttack) {
        const attackTypes = ['DoS', 'Port Scan', 'Brute Force', 'Data Exfil', 'Malware']
        const newAlert: AlertItem = {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString('vi-VN'),
          type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
          confidence: Math.floor(Math.random() * 40 + 60),
        }
        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)])
      }

      // Update chart data
      setTrafficData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            normal: Math.floor(Math.random() * 800) + 100,
            attack: isAttack ? Math.floor(Math.random() * 400) + 50 : 0,
          },
        ]
        return newData.slice(-20)
      })

      // Update threat level
      const attackRate = attackCount / (totalTraffic + 1)
      if (attackRate > 0.3) {
        setThreatLevel('critical')
      } else if (attackRate > 0.1) {
        setThreatLevel('warning')
      } else {
        setThreatLevel('safe')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [liveActive, attackCount, totalTraffic])

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

  const getThreatLevelColor = () => {
    if (threatLevel === 'critical') return 'text-red-500'
    if (threatLevel === 'warning') return 'text-yellow-500'
    return 'text-green-500'
  }

  const getThreatLevelBg = () => {
    if (threatLevel === 'critical') return 'bg-red-500/10'
    if (threatLevel === 'warning') return 'bg-yellow-500/10'
    return 'bg-green-500/10'
  }

  const getThreatLevelText = () => {
    if (threatLevel === 'critical') return 'Nguy Hiểm'
    if (threatLevel === 'warning') return 'Cảnh Báo'
    return 'An Toàn'
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
            {/* Toggle & Metrics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      liveActive ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                  <span className="font-medium">
                    {liveActive ? 'Giám sát Active' : 'Giám sát Inactive'}
                  </span>
                </div>
                <Button
                  onClick={() => setLiveActive(!liveActive)}
                  className={liveActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {liveActive ? 'Tắt Giám Sát' : 'Bật Giám Sát Real-time'}
                </Button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tổng Lưu Lượng</p>
                        <p className="text-2xl font-bold">{totalTraffic}</p>
                      </div>
                      <Activity className="w-8 h-8 text-primary opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm border-red-500/30 bg-red-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Số Vụ Tấn Công</p>
                        <p className="text-2xl font-bold text-red-500">{attackCount}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-border shadow-sm ${getThreatLevelBg()}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Mức Độ Đe Dọa</p>
                        <p className={`text-2xl font-bold ${getThreatLevelColor()}`}>
                          {getThreatLevelText()}
                        </p>
                      </div>
                      <TrendingUp className={`w-8 h-8 ${getThreatLevelColor()} opacity-50`} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Split View: Alerts & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Alerts */}
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="border-b border-red-500/30">
                  <CardTitle className="text-red-500">Cảnh Báo Đe Dọa</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Không có cảnh báo
                      </p>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-3 p-3 rounded border border-red-500/20 bg-red-500/10"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5 animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-500">{alert.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                            <p className="text-xs text-foreground/70 mt-1">
                              Độ tin cậy: <span className="font-bold">{alert.confidence}%</span>
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Live Logs */}
              <Card className="border-border shadow-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle>Nhật Ký Hệ Thống Live</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-1 text-xs">
                      {liveLogs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Bắt đầu giám sát để xem nhật ký
                        </p>
                      ) : (
                        liveLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`grid grid-cols-5 gap-2 p-2 rounded ${
                              log.status === 'ATTACK_DETECTED'
                                ? 'bg-red-500/10 border-l-2 border-red-500'
                                : 'hover:bg-secondary/30'
                            }`}
                          >
                            <div className="text-muted-foreground">{log.timestamp}</div>
                            <div>{log.protocol.toUpperCase()}</div>
                            <div>{log.service}</div>
                            <div className="text-right">{log.src_bytes}</div>
                            <div className="text-right">
                              <span
                                className={
                                  log.status === 'ATTACK_DETECTED'
                                    ? 'text-red-500 font-bold'
                                    : 'text-green-500'
                                }
                              >
                                {log.status === 'ATTACK_DETECTED' ? '⚠️' : '✓'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle>Biểu Đồ Lưu Lượng</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {trafficData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Bắt đầu giám sát để xem biểu đồ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#666" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="normal"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Bình thường"
                      />
                      <Line
                        type="monotone"
                        dataKey="attack"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        name="Tấn công"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
