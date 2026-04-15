'use client'

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  CheckCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Upload,
  Trash2,
  Activity,
  Radio,
  Zap,
  FileSearch,
  Network,
  Eye,
  EyeOff,
} from 'lucide-react'

// ──────────────────────────── Types ────────────────────────────
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

// ──────────────────────────── Helpers ────────────────────────────
function getApiBase() {
  if (process.env.NEXT_PUBLIC_NIDS_API_URL) {
    return process.env.NEXT_PUBLIC_NIDS_API_URL
  }
  if (typeof window === 'undefined') return 'http://localhost:5000'
  const host = window.location.hostname
  return `http://${host}:5000`
}

// ──────────────────────────── Component ────────────────────────────
export function IDSDetector() {
  // ─── State ─────────────────────────
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [protocols, setProtocols] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const [isLiveMonitor, setIsLiveMonitor] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [formData, setFormData] = useState({
    duration: '',
    protocol: '',
    service: '',
    src_bytes: '',
    dst_bytes: '',
  })

  // ─── Fetch Logs ─────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/logs`)
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setLogs(data.logs)
      setConnectionStatus('connected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }, [])

  // ─── Load Options on Mount ───────────
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch(`${getApiBase()}/api/options`)
        const data = await response.json()
        setProtocols(data.protocols)
        setServices(data.services)
        setConnectionStatus('connected')
      } catch {
        setConnectionStatus('disconnected')
      }
    }
    loadOptions()
    fetchLogs()
  }, [fetchLogs])

  // ─── Live Monitoring Interval ────────
  useEffect(() => {
    if (isLiveMonitor) {
      // Fetch immediately on enable
      fetchLogs()
      intervalRef.current = setInterval(() => {
        fetchLogs()
      }, 1500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isLiveMonitor, fetchLogs])

  // ─── Handlers ──────────────────────
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFormData({ duration: '', protocol: '', service: '', src_bytes: '', dst_bytes: '' })
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

      const response = await fetch(`${getApiBase()}/`, {
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
        setTimeout(fetchLogs, 500)
      }
    } catch {
      setResult({
        status: 'ERROR',
        message: 'Lỗi kết nối. Vui lòng kiểm tra máy chủ Flask đang chạy trên port 5000',
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

      const response = await fetch(`${getApiBase()}/api/batch`, {
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
      setTimeout(fetchLogs, 500)
    } catch {
      alert('Lỗi tải file. Vui lòng kiểm tra định dạng CSV.')
    } finally {
      setUploadingBatch(false)
      e.target.value = ''
    }
  }

  const handleClearLogs = async () => {
    try {
      await fetch(`${getApiBase()}/api/logs`, { method: 'DELETE' })
      setLogs([])
    } catch {
      alert('Không thể xóa lịch sử. Kiểm tra kết nối server.')
    }
  }

  // ─── Derived Stats ─────────────────
  const totalLogs = logs.length
  const attackLogs = logs.filter((l) => l.status === 'ATTACK_DETECTED').length
  const normalLogs = totalLogs - attackLogs

  // ──────────────────────────── Render ────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Top Navigation Bar ─── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-7 h-7 text-cyan-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text-cyber">
                NIDS Dashboard
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Network Intrusion Detection System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
              <div
                className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                    : connectionStatus === 'disconnected'
                      ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                      : 'bg-yellow-400 animate-pulse'
                  }`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {connectionStatus === 'connected'
                  ? 'API Online'
                  : connectionStatus === 'disconnected'
                    ? 'API Offline'
                    : 'Checking...'}
              </span>
            </div>

            {/* @By Nhóm 1 badge */}
            <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
              @By Nhóm 1
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: LIVE RADAR MODE
            ═══════════════════════════════════════════════════════════ */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden relative">
          {/* Animated border glow when live */}
          {isLiveMonitor && (
            <div className="absolute inset-0 rounded-lg pointer-events-none animate-glow-pulse" />
          )}

          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10">
                  {/* Radar background */}
                  <div className="absolute inset-0 rounded-full bg-cyan-500/10 border border-cyan-500/20" />
                  {isLiveMonitor && (
                    <>
                      <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-pulse-ring" />
                      <div className="absolute inset-[-4px] rounded-full border border-cyan-400/15 animate-pulse-ring [animation-delay:0.5s]" />
                    </>
                  )}
                  <Radio
                    className={`w-5 h-5 relative z-10 ${isLiveMonitor ? 'text-cyan-400' : 'text-muted-foreground'
                      }`}
                  />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Chế độ Radar (Live Monitoring)
                    {isLiveMonitor && (
                      <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0 h-5">
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Tự động cập nhật bản ghi lưu lượng mạng thực tế bay qua Card mạng.
                  </CardDescription>
                </div>
              </div>

              <Button
                id="live-monitor-toggle"
                onClick={() => setIsLiveMonitor((prev) => !prev)}
                variant={isLiveMonitor ? 'destructive' : 'default'}
                className={`min-w-[220px] h-10 font-semibold transition-all ${!isLiveMonitor
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : ''
                  }`}
              >
                {isLiveMonitor ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    ⏹ Dừng Giám Sát
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    ▶ Bật Giám Sát Real-time
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 pb-3">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-secondary/40 rounded-lg border border-border/40 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] text-muted-foreground font-medium">Tổng Bản Ghi</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{totalLogs}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg border border-border/40 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-muted-foreground font-medium">An Toàn</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{normalLogs}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg border border-border/40 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] text-muted-foreground font-medium">Tấn Công</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{attackLogs}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg border border-border/40 p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-muted-foreground font-medium">Tỷ Lệ Đe Dọa</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {totalLogs > 0 ? ((attackLogs / totalLogs) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: SESSION LOGS TABLE
            ═══════════════════════════════════════════════════════════ */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <CardTitle className="text-base">Lịch Sử Phiên Giám Sát</CardTitle>
                <Badge variant="secondary" className="text-[10px] ml-1 bg-secondary/60">
                  {logs.length} bản ghi
                </Badge>
              </div>
              <Button
                id="clear-logs-btn"
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 px-3 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Xóa Lịch Sử</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Network className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Chưa có bản ghi nào</p>
                <p className="text-xs mt-1 opacity-70">
                  Bật giám sát real-time hoặc phân tích thủ công để bắt đầu
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground font-semibold">
                        Thời Gian
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold">
                        Giao Thức
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold">
                        Dịch Vụ
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold">
                        Kết Quả
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold text-right">
                        Độ Tin Cậy
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, idx) => (
                      <TableRow
                        key={`${log.timestamp}-${idx}`}
                        className={`border-border/30 transition-colors animate-fade-up ${log.status === 'ATTACK_DETECTED'
                            ? 'bg-red-500/[0.04] hover:bg-red-500/[0.08]'
                            : 'hover:bg-secondary/30'
                          }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase border-border/50">
                            {log.protocol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.service}</TableCell>
                        <TableCell>
                          {log.status === 'NORMAL' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              An Toàn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                              <AlertCircle className="w-3 h-3" />
                              Tấn Công
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-xs font-bold ${log.confidence >= 90
                                ? 'text-cyan-400'
                                : log.confidence >= 70
                                  ? 'text-amber-400'
                                  : 'text-muted-foreground'
                              }`}
                          >
                            {log.confidence}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 & 4: MANUAL ANALYSIS + BATCH (TABS)
            ═══════════════════════════════════════════════════════════ */}
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border/40 h-10">
            <TabsTrigger value="manual" className="gap-1.5 text-xs data-[state=active]:bg-background">
              <FileSearch className="w-3.5 h-3.5" />
              Phân Tích Thủ Công
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-1.5 text-xs data-[state=active]:bg-background">
              <Upload className="w-3.5 h-3.5" />
              Phân Tích Hàng Loạt (CSV)
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Manual Analysis ─── */}
          <TabsContent value="manual">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Form */}
              <Card className="lg:col-span-3 border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-cyan-400" />
                    Nhập Thông Số Mạng
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Điền các thông tin chi tiết về kết nối mạng để phân tích
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Duration */}
                      <div className="space-y-1.5">
                        <label htmlFor="duration" className="text-xs font-medium text-muted-foreground">
                          Thời Lượng (giây)
                        </label>
                        <Input
                          id="duration"
                          type="number"
                          placeholder="0"
                          value={formData.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                          disabled={isLoading}
                          className="bg-secondary/30 border-border/50 h-9 text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>

                      {/* Protocol */}
                      <div className="space-y-1.5">
                        <label htmlFor="protocol-select" className="text-xs font-medium text-muted-foreground">
                          Giao Thức
                        </label>
                        <Select
                          value={formData.protocol}
                          onValueChange={(value) => handleInputChange('protocol', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="protocol-select" className="w-full bg-secondary/30 border-border/50 h-9 text-sm">
                            <SelectValue placeholder="Chọn giao thức..." />
                          </SelectTrigger>
                          <SelectContent>
                            {protocols.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Service */}
                      <div className="space-y-1.5">
                        <label htmlFor="service-select" className="text-xs font-medium text-muted-foreground">
                          Dịch Vụ
                        </label>
                        <Select
                          value={formData.service}
                          onValueChange={(value) => handleInputChange('service', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="service-select" className="w-full bg-secondary/30 border-border/50 h-9 text-sm">
                            <SelectValue placeholder="Chọn dịch vụ..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Src Bytes */}
                      <div className="space-y-1.5">
                        <label htmlFor="src_bytes" className="text-xs font-medium text-muted-foreground">
                          Byte Nguồn
                        </label>
                        <Input
                          id="src_bytes"
                          type="number"
                          placeholder="0"
                          value={formData.src_bytes}
                          onChange={(e) => handleInputChange('src_bytes', e.target.value)}
                          disabled={isLoading}
                          className="bg-secondary/30 border-border/50 h-9 text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>

                      {/* Dst Bytes */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label htmlFor="dst_bytes" className="text-xs font-medium text-muted-foreground">
                          Byte Đích
                        </label>
                        <Input
                          id="dst_bytes"
                          type="number"
                          placeholder="0"
                          value={formData.dst_bytes}
                          onChange={(e) => handleInputChange('dst_bytes', e.target.value)}
                          disabled={isLoading}
                          className="bg-secondary/30 border-border/50 h-9 text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        id="analyze-btn"
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-10 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-1" />
                            Phân Tích
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReset}
                        disabled={isLoading}
                        variant="outline"
                        className="h-10 px-4 border-border/50"
                        title="Xóa form"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Result Panel */}
              <div className="lg:col-span-2 space-y-4">
                {/* System Status */}
                <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Trạng Thái Hệ Thống</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                            : 'bg-red-400'
                          }`}
                      />
                      <span className="text-sm font-medium">
                        {connectionStatus === 'connected' ? 'Sẵn sàng phân tích' : 'Mất kết nối'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lần quét gần nhất:{' '}
                      <span className="font-medium text-foreground">
                        {result?.timestamp || 'Chưa có phân tích'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Result */}
                {result && result.status !== 'ERROR' && (
                  <div
                    className={`rounded-lg border p-4 animate-fade-up ${result.status === 'NORMAL'
                        ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                        : 'border-red-500/30 bg-red-500/[0.06]'
                      }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {result.status === 'NORMAL' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3
                          className={`font-semibold text-sm ${result.status === 'NORMAL' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                        >
                          {result.status === 'NORMAL' ? 'Kết Nối An Toàn' : 'Phát Hiện Mối Đe Dọa'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                      </div>
                    </div>

                    {result.confidence !== undefined && (
                      <div className="bg-background/40 rounded-md p-3 border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Độ Tin Cậy AI
                          </span>
                          <span
                            className={`text-sm font-bold ${result.status === 'NORMAL' ? 'text-emerald-400' : 'text-red-400'
                              }`}
                          >
                            {result.confidence}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(result.confidence, 100)}
                          className={`h-2 ${result.status === 'NORMAL'
                              ? '[&>[data-slot=progress-indicator]]:bg-emerald-500'
                              : '[&>[data-slot=progress-indicator]]:bg-red-500'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Error Result */}
                {result && result.status === 'ERROR' && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-4 animate-fade-up">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-amber-400">Lỗi Xử Lý</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ─── Tab 2: Batch CSV Analysis ─── */}
          <TabsContent value="batch">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upload */}
              <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Tải Lên File CSV
                  </CardTitle>
                  <CardDescription className="text-xs">
                    File CSV cần có các cột: duration, protocol, service, src_bytes, dst_bytes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
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
                      className="flex flex-col items-center justify-center gap-3 px-6 py-12 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:bg-secondary/30 hover:border-cyan-500/30 transition-all duration-200 group"
                    >
                      <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                        <Upload className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {uploadingBatch ? 'Đang xử lý...' : 'Kéo thả hoặc nhấn để chọn file CSV'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Hỗ trợ file .csv
                        </p>
                      </div>
                      {uploadingBatch && (
                        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Batch Result */}
              <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-base">Kết Quả Phân Tích Hàng Loạt</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  {batchResult ? (
                    <div className="space-y-4 animate-fade-up">
                      {/* Total Packets */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm text-muted-foreground">Tổng gói tin</span>
                        </div>
                        <span className="text-lg font-bold text-cyan-400">{batchResult.total}</span>
                      </div>

                      {/* Attacks */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/[0.05] border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-muted-foreground">Tấn công</span>
                        </div>
                        <span className="text-lg font-bold text-red-400">{batchResult.attacks}</span>
                      </div>

                      {/* Normal */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-muted-foreground">Bình thường</span>
                        </div>
                        <span className="text-lg font-bold text-emerald-400">{batchResult.normal}</span>
                      </div>

                      {/* Attack Rate */}
                      <div className="border-t border-border/30 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Tỷ lệ tấn công</span>
                          <span className="text-xl font-bold text-amber-400">{batchResult.attack_rate}%</span>
                        </div>
                        <Progress
                          value={batchResult.attack_rate}
                          className="h-2.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-500 [&>[data-slot=progress-indicator]]:to-red-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileSearch className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">Chưa có kết quả</p>
                      <p className="text-xs mt-1 opacity-70">Tải lên file CSV để bắt đầu phân tích</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Info Footer ─── */}
        <Card className="border-border/40 bg-card/30">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">Thời Lượng:</span> Thời gian kết nối (giây)
              </div>
              <div>
                <span className="font-semibold text-foreground">Giao Thức:</span> tcp, udp, icmp...
              </div>
              <div>
                <span className="font-semibold text-foreground">Dịch Vụ:</span> http, ftp, ssh...
              </div>
              <div>
                <span className="font-semibold text-foreground">Byte:</span> Khối lượng truyền dữ liệu
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Hệ Thống Phát Hiện Xâm Nhập Mạng · Decision Tree ML Model · <span className="font-medium">@By Nhóm 1</span>
          </p>
        </div>
      </div>
    </div>
  )
}
