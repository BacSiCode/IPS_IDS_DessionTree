'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, Activity, Radio, Zap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Alert {
  id: string
  type: 'DoS' | 'Port Scan' | 'Brute Force' | 'Data Exfil'
  confidence: number
  timestamp: string
  severity: 'critical' | 'high' | 'medium'
}

interface TrafficLog {
  id: string
  time: string
  protocol: string
  service: string
  bytes: number
  status: 'normal' | 'attack'
}

interface ChartData {
  time: string
  normal: number
  attack: number
}

export function SOCDashboard() {
  const [isLive, setIsLive] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [trafficLogs, setTrafficLogs] = useState<TrafficLog[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [stats, setStats] = useState({
    totalTraffic: 1240,
    threatsDetected: 23,
    threatLevel: 'warning' as 'safe' | 'warning' | 'critical',
  })

  // Simulate live data updates
  useEffect(() => {
    if (!isLive) return

    const alertInterval = setInterval(() => {
      const alertTypes: Array<'DoS' | 'Port Scan' | 'Brute Force' | 'Data Exfil'> = [
        'DoS',
        'Port Scan',
        'Brute Force',
        'Data Exfil',
      ]
      const severities: Array<'critical' | 'high' | 'medium'> = ['critical', 'high', 'medium']

      if (Math.random() > 0.7) {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          confidence: Math.floor(Math.random() * 30) + 70,
          timestamp: new Date().toLocaleTimeString(),
          severity: severities[Math.floor(Math.random() * severities.length)],
        }
        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)])
        setStats((prev) => ({
          ...prev,
          threatsDetected: prev.threatsDetected + 1,
          threatLevel: 'critical',
        }))
      }
    }, 3000)

    return () => clearInterval(alertInterval)
  }, [isLive])

  // Simulate traffic log updates
  useEffect(() => {
    if (!isLive) return

    const logInterval = setInterval(() => {
      const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS']
      const services = ['http', 'https', 'ssh', 'ftp', 'dns', 'smtp']
      const isAttack = Math.random() > 0.85

      const newLog: TrafficLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        service: services[Math.floor(Math.random() * services.length)],
        bytes: Math.floor(Math.random() * 5000) + 100,
        status: isAttack ? 'attack' : 'normal',
      }
      setTrafficLogs((prev) => [newLog, ...prev.slice(0, 19)])
    }, 500)

    return () => clearInterval(logInterval)
  }, [isLive])

  // Simulate chart data updates
  useEffect(() => {
    if (!isLive) return

    const chartInterval = setInterval(() => {
      setChartData((prev) => {
        const newData: ChartData = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          normal: Math.floor(Math.random() * 800) + 200,
          attack: Math.floor(Math.random() * 300) + 50,
        }
        return [...prev.slice(-59), newData]
      })
    }, 1000)

    return () => clearInterval(chartInterval)
  }, [isLive])

  // Initialize with mock data
  useEffect(() => {
    const initialAlerts: Alert[] = Array.from({ length: 5 }, (_, i) => ({
      id: `init-alert-${i}`,
      type: ['DoS', 'Port Scan', 'Brute Force', 'Data Exfil'][i % 4] as any,
      confidence: 80 + Math.random() * 15,
      timestamp: new Date(Date.now() - i * 10000).toLocaleTimeString(),
      severity: i % 2 === 0 ? 'critical' : 'high',
    }))
    setAlerts(initialAlerts)

    const initialLogs: TrafficLog[] = Array.from({ length: 15 }, (_, i) => ({
      id: `init-log-${i}`,
      time: new Date(Date.now() - i * 2000).toLocaleTimeString(),
      protocol: ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 3)],
      service: ['http', 'https', 'ssh'][Math.floor(Math.random() * 3)],
      bytes: Math.floor(Math.random() * 5000) + 100,
      status: i % 12 === 0 ? 'attack' : 'normal',
    }))
    setTrafficLogs(initialLogs)

    const initialChart: ChartData[] = Array.from({ length: 30 }, (_, i) => ({
      time: `${(i - 29 + 60) % 60}s`,
      normal: 400 + Math.random() * 300,
      attack: 50 + Math.random() * 150,
    }))
    setChartData(initialChart)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full animate-pulse ${
                    isLive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                />
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border">
                  <Radio className={`w-5 h-5 ${isLive ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Live Network Monitoring</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time security operations center
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsLive(!isLive)}
              className={`px-6 ${
                isLive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isLive ? 'Stop Live Feed' : 'Start Live Feed'}
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Total Traffic</p>
                  <p className="text-3xl font-bold">{stats.totalTraffic}</p>
                  <p className="text-xs text-muted-foreground mt-2">Packets/sec</p>
                </div>
                <Activity className="w-8 h-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Threats Detected</p>
                  <p className="text-3xl font-bold text-red-500">{stats.threatsDetected}</p>
                  <p className="text-xs text-muted-foreground mt-2">Last 24 hours</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Current Threat Level</p>
                  <p
                    className={`text-3xl font-bold ${
                      stats.threatLevel === 'critical'
                        ? 'text-red-500'
                        : stats.threatLevel === 'warning'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                    }`}
                  >
                    {stats.threatLevel.charAt(0).toUpperCase() + stats.threatLevel.slice(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Real-time status</p>
                </div>
                <Zap
                  className={`w-8 h-8 opacity-60 ${
                    stats.threatLevel === 'critical'
                      ? 'text-red-500'
                      : stats.threatLevel === 'warning'
                        ? 'text-yellow-500'
                        : 'text-green-500'
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Threat Alerts */}
          <Card className="border-border bg-card/50 backdrop-blur overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Threat Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto space-y-2 p-4">
                {alerts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No threats detected</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border-l-4 border-red-500 bg-red-500/5 hover:bg-red-500/10 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-bold text-sm">{alert.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confidence Score</span>
                        <span className="font-bold text-red-500">{alert.confidence.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Traffic Logs */}
          <Card className="border-border bg-card/50 backdrop-blur overflow-hidden">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Live Traffic Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Time</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Protocol</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Service</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Bytes</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`border-b border-border/50 hover:bg-primary/5 transition ${
                          log.status === 'attack'
                            ? 'bg-red-500/10 font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <td className="p-3">{log.time}</td>
                        <td className="p-3">{log.protocol}</td>
                        <td className="p-3">{log.service}</td>
                        <td className="text-right p-3">{log.bytes}</td>
                        <td className="text-center p-3">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              log.status === 'attack' ? 'bg-red-500' : 'bg-green-500'
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="border-border bg-card/50 backdrop-blur">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Traffic Overview (Last 60 Seconds)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 15, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                />
                <Line
                  type="monotone"
                  dataKey="normal"
                  stroke="#22c55e"
                  dot={false}
                  strokeWidth={2}
                  name="Normal Traffic"
                />
                <Line
                  type="monotone"
                  dataKey="attack"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  name="Attack Traffic"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
