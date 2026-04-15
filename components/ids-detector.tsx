'use client'

import { useState, FormEvent, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  Network,
  Eye,
  EyeOff,
  ServerCrash,
  Globe2,
  Lock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts'

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
  port?: number
  duration?: number
  fwd_packets?: number
  src_bytes?: number
  status: string
  confidence: number
  note?: string
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
  return `http://${host}:5000` // fallback for local deploy
}

const getStatusConfig = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s === 'BENIGN' || s === 'NORMAL' || s === 'PASS') {
      return { 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/20', 
        icon: <CheckCircle className="w-3 h-3" />, 
        label: 'PASS',
        isAttack: false
      };
    }
    if (s === 'DDOS') {
      return { 
        color: 'text-red-400', 
        bg: 'bg-red-500/20', 
        border: 'border-red-500/30', 
        icon: <ShieldAlert className="w-3 h-3" />, 
        label: 'DDOS ATTACK',
        isAttack: true
      };
    }
    if (s === 'PORTSCAN') {
      return { 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/20', 
        border: 'border-orange-500/30', 
        icon: <Zap className="w-3 h-3" />, 
        label: 'PORT SCAN',
        isAttack: true
      };
    }
    if (s === 'BOT') {
      return { 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/20', 
        border: 'border-purple-500/30', 
        icon: <Network className="w-3 h-3" />, 
        label: 'BOT ACTIVITY',
        isAttack: true
      };
    }
    return { 
      color: 'text-red-500', 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/30', 
      icon: <ShieldAlert className="w-3 h-3" />, 
      label: status,
      isAttack: true
    };
  };

// ──────────────────────────── Component ────────────────────────────
export function IDSDetector() {
  // ─── State ─────────────────────────
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const [isLiveMonitor, setIsLiveMonitor] = useState(true) // Auto start live monitor
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [formData, setFormData] = useState({
    f1: '80',       // Target Port
    f2: '500',      // Duration
    f3: '2',        // Fwd Packets
    f4: '1000',     // Flow Bytes/s
    f5: '500',      // Packet length mean
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

  // ─── Live Monitoring ────────────────
  useEffect(() => {
    if (isLiveMonitor) {
      fetchLogs()
      intervalRef.current = setInterval(() => {
        fetchLogs()
      }, 1500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLiveMonitor, fetchLogs])

  // ─── Handlers ──────────────────────
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFormData({ f1: '80', f2: '500', f3: '2', f4: '1000', f5: '500' })
    setResult(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const formPayload = new FormData()
      formPayload.append('f1', formData.f1)
      formPayload.append('f2', formData.f2)
      formPayload.append('f3', formData.f3)
      formPayload.append('f4', formData.f4)
      formPayload.append('f5', formData.f5)

      const response = await fetch(`${getApiBase()}/`, {
        method: 'POST',
        body: formPayload,
      })

      const data = await response.json()

      if (data.status === 'ERROR') {
        setResult({
          status: 'ERROR',
          message: data.message || 'Lỗi xử lý hệ thống',
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
        message: 'Lỗi kết nối tới Server AI.',
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
      alert('Lỗi tải file cấu trúc bị sai.')
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
      alert('Sever offline không thể xóa.')
    }
  }

  // ─── Stats & Data for Chart ─────────
  const totalLogs = logs.length
  const attackLogs = logs.filter((l) => getStatusConfig(l.status).isAttack).length
  const normalLogs = totalLogs - attackLogs

  const chartData = useMemo(() => {
    // Take the last 20 elements and map them for the chart
    return [...logs].reverse().slice(-20).map((log, i) => ({
      name: new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      confidence: getStatusConfig(log.status).isAttack ? log.confidence : 100 - log.confidence,
      type: log.status
    }))
  }, [logs])

  // ──────────────────────────── Render ────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans relative overflow-x-hidden">
      {/* ─── Background Ambient Effects ─── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[50%] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                Nexus NIDS
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium -mt-1">
                Tích Hợp SpiritAds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <div
                className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : connectionStatus === 'disconnected'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      : 'bg-amber-400 animate-pulse'
                  }`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {connectionStatus === 'connected'
                  ? 'Core Engine Online'
                  : connectionStatus === 'disconnected'
                    ? 'Core Offline'
                    : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── Metrics Grid ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Lưu lượng Scan</p>
                <div className="text-3xl font-bold text-white mt-1">{totalLogs.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Traffic Sạch</p>
                <div className="text-3xl font-bold text-emerald-400 mt-1">{normalLogs.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
                  <ServerCrash className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Tấn Công Chặn</p>
                <div className="text-3xl font-bold text-red-500 mt-1">{attackLogs.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Tỉ Lệ Đe Dọa</p>
                <div className="text-3xl font-bold text-amber-400 mt-1">
                  {totalLogs > 0 ? ((attackLogs / totalLogs) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Main Content Grid ─── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT COL: Live Traffic & Tools */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Chart Widget */}
            <Card className="border border-white/10 bg-[#0A0F1C]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.01] pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Biểu Đồ Sóng Live
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[220px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="none" tick={false} />
                      <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Area type="monotone" dataKey="confidence" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorConf)" animationDuration={300} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <Radio className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs">Đang chờ gói tin mạng...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tools Tabs */}
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 h-12">
                <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Kiểm Tra Ngay</TabsTrigger>
                <TabsTrigger value="batch" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">Batch CSV</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="mt-4">
                <Card className="border border-white/10 bg-[#0A0F1C]/80 backdrop-blur-2xl">
                  <form onSubmit={handleSubmit}>
                    <CardContent className="p-5 space-y-4">
                      <div>
                         <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Destination Port</label>
                         <Input disabled={isLoading} className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 h-10" value={formData.f1} onChange={e => handleInputChange('f1', e.target.value)} placeholder="VD: 80, 443" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Trạng Thái (ms)</label>
                           <Input disabled={isLoading} className="bg-slate-900/50 border-white/10 h-10 text-slate-200" value={formData.f2} onChange={e => handleInputChange('f2', e.target.value)} />
                        </div>
                        <div>
                           <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Fwd Packets</label>
                           <Input disabled={isLoading} className="bg-slate-900/50 border-white/10 h-10 text-slate-200" value={formData.f3} onChange={e => handleInputChange('f3', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Flow B/s</label>
                           <Input disabled={isLoading} className="bg-slate-900/50 border-white/10 h-10 text-slate-200" value={formData.f4} onChange={e => handleInputChange('f4', e.target.value)} />
                        </div>
                        <div>
                           <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Length Mean</label>
                           <Input disabled={isLoading} className="bg-slate-900/50 border-white/10 h-10 text-slate-200" value={formData.f5} onChange={e => handleInputChange('f5', e.target.value)} />
                        </div>
                      </div>
                      
                      {/* Prediction Result Block */}
                      {result && result.status !== 'ERROR' && (
                        <div className={`mt-4 p-4 rounded-xl border ${result.status === 'NORMAL' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} flex items-start gap-3 animate-fade-in`}>
                          {result.status === 'NORMAL' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-500" />}
                          <div className="flex-1 -mt-0.5">
                            <p className={`font-bold ${result.status === 'NORMAL' ? 'text-emerald-400' : 'text-red-500'}`}>{result.status === 'NORMAL' ? 'An Toàn' : 'Phát hiện Tấn Công'}</p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                               <Progress value={result.confidence} className={`h-1.5 flex-1 ${result.status === 'NORMAL' ? '[&>div]:bg-emerald-500' : '[&>div]:bg-red-500'}`} />
                               <span className="text-[10px] font-mono text-slate-300">{result.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-5 pt-0 grid grid-cols-4 gap-2">
                       <Button type="button" variant="outline" onClick={handleReset} className="col-span-1 border-white/10 hover:bg-white/5"><RotateCcw className="w-4 h-4" /></Button>
                       <Button type="submit" disabled={isLoading} className="col-span-3 bg-white text-slate-950 hover:bg-slate-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                         {isLoading ? 'Đang phân tích...' : 'Kiểm Định Ngay'}
                       </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="batch" className="mt-4">
                 <Card className="border border-white/10 bg-[#0A0F1C]/80 backdrop-blur-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
                   <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                     <Upload className="w-8 h-8 text-blue-400" />
                   </div>
                   <h3 className="text-white font-bold mb-2">Kiểm Tra Hàng Loạt</h3>
                   <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Tải lên file CSV chứa các giao thức mạng để hệ thống cào dữ liệu nhanh.</p>
                   <Input type="file" accept=".csv" onChange={handleBatchUpload} disabled={uploadingBatch} className="text-xs file:bg-white file:text-slate-900 file:border-0 file:rounded-full file:px-4 file:py-1 cursor-pointer bg-white/5 border-white/10" />
                 </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT COL: Radar Log Table */}
          <div className="lg:col-span-2 space-y-4 flex flex-col">
            <div className="flex items-center justify-between p-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                 <Globe2 className="w-6 h-6 text-cyan-400" />
                 Radar Log
              </h2>
              <div className="flex items-center gap-2">
                <Button variant={isLiveMonitor ? 'secondary' : 'default'} size="sm" onClick={() => setIsLiveMonitor(!isLiveMonitor)} className={`rounded-full shadow-lg ${isLiveMonitor ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'}`}>
                  {isLiveMonitor ? <><EyeOff className="w-4 h-4 mr-2"/> Tạm dừng</> : <><Eye className="w-4 h-4 mr-2"/> Bật Radar</>}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClearLogs} className="rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                   <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card className="border border-white/10 bg-[#0A0F1C]/80 backdrop-blur-2xl shadow-2xl flex-1 overflow-hidden flex flex-col min-h-[500px]">
              <Table className="flex-1">
                <TableHeader className="bg-slate-900/50 sticky top-0 z-10 backdrop-blur-xl">
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="w-[100px] text-xs uppercase tracking-wider text-slate-400">Time</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-400">Port</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-400">Ghi Chú IP</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-slate-400">Status</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wider text-slate-400">AI Trust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[400px] text-center">
                         <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Lock className="w-12 h-12 opacity-20" />
                            <p>Không có hoạt động đánh chặn nào.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    {logs.map((log, idx) => {
                      const cfg = getStatusConfig(log.status);
                      return (
                      <TableRow 
                        key={idx} 
                        className={`border-b border-white/5 transition-all ${cfg.isAttack ? 'bg-red-500/[0.03] hover:bg-red-500/[0.08]' : 'hover:bg-white/[0.02]'}`}
                      >
                        <TableCell className="font-mono text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-800/50 border-white/10 text-cyan-300 font-mono text-[10px]">
                            {log.port || 80}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 max-w-[200px] truncate">
                           {log.note || 'Internal'}
                        </TableCell>
                        <TableCell>
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color} text-[10px] font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
                             {cfg.icon} {cfg.label}
                           </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold text-slate-200">
                           {log.confidence}%
                        </TableCell>
                      </TableRow>
                    )})}

                  )}
                </TableBody>
              </Table>
            </Card>

          </div>
        </div>
      </main>
    </div>
  )
}
