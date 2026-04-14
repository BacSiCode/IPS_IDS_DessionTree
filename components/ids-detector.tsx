'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Shield, Activity } from 'lucide-react'

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
      // Form data for submission to Flask backend
      const formPayload = new FormData()
      formPayload.append('f1', formData.duration)
      formPayload.append('f2', formData.protocol)
      formPayload.append('f3', formData.service)
      formPayload.append('f4', formData.src_bytes)
      formPayload.append('f5', formData.dst_bytes)

      // Submit to your Flask backend
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        body: formPayload,
      })

      // Parse the HTML response
      const html = await response.text()
      const isAttack = html.includes('⚠️ ATTACK DETECTED')
      const isError = html.includes('INPUT ERROR')

      if (isError) {
        setResult({
          status: 'ERROR',
          message: 'Invalid input. Please check your values.',
          timestamp: new Date().toLocaleTimeString(),
        })
      } else if (isAttack) {
        setResult({
          status: 'ATTACK_DETECTED',
          message: '⚠️ ATTACK DETECTED',
          timestamp: new Date().toLocaleTimeString(),
        })
      } else {
        setResult({
          status: 'NORMAL',
          message: '✓ NORMAL',
          timestamp: new Date().toLocaleTimeString(),
        })
      }
    } catch (error) {
      setResult({
        status: 'ERROR',
        message: 'Connection error. Make sure Flask server is running on localhost:5000',
        timestamp: new Date().toLocaleTimeString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">IDS</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Intrusion Detection System powered by Decision Tree ML
          </p>
          <p className="text-sm text-muted-foreground">
            Advanced network security threat detection and analysis
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Detection Card */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Network Analysis
                </CardTitle>
                <CardDescription>Enter network parameters for threat detection</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="duration" className="text-sm font-medium">
                        Duration (seconds)
                      </label>
                      <Input
                        id="duration"
                        placeholder="e.g., 1500"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        disabled={isLoading}
                        className="bg-input border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="protocol" className="text-sm font-medium">
                        Protocol
                      </label>
                      <Input
                        id="protocol"
                        placeholder="e.g., tcp"
                        value={formData.protocol}
                        onChange={(e) => handleInputChange('protocol', e.target.value)}
                        disabled={isLoading}
                        className="bg-input border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="service" className="text-sm font-medium">
                        Service
                      </label>
                      <Input
                        id="service"
                        placeholder="e.g., http"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                        disabled={isLoading}
                        className="bg-input border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="src_bytes" className="text-sm font-medium">
                        Source Bytes
                      </label>
                      <Input
                        id="src_bytes"
                        placeholder="e.g., 4000"
                        value={formData.src_bytes}
                        onChange={(e) => handleInputChange('src_bytes', e.target.value)}
                        disabled={isLoading}
                        className="bg-input border-border/50"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="dst_bytes" className="text-sm font-medium">
                        Destination Bytes
                      </label>
                      <Input
                        id="dst_bytes"
                        placeholder="e.g., 8000"
                        value={formData.dst_bytes}
                        onChange={(e) => handleInputChange('dst_bytes', e.target.value)}
                        disabled={isLoading}
                        className="bg-input border-border/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2"
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze Network'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">System Online</span>
                </div>
                <div className="h-px bg-border/50" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Last Analysis</p>
                  <p className="text-sm text-foreground">
                    {result?.timestamp || 'Awaiting input...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Result Alert */}
        {result && (
          <div
            className={`rounded-lg border p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 ${
              result.status === 'NORMAL'
                ? 'border-green-500/30 bg-green-500/5'
                : result.status === 'ATTACK_DETECTED'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-yellow-500/30 bg-yellow-500/5'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.status === 'NORMAL' ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-1 ${
                    result.status === 'NORMAL'
                      ? 'text-green-500'
                      : result.status === 'ATTACK_DETECTED'
                        ? 'text-destructive'
                        : 'text-yellow-500'
                  }`}
                >
                  {result.status === 'NORMAL'
                    ? 'Connection Secure'
                    : result.status === 'ATTACK_DETECTED'
                      ? 'Threat Detected'
                      : 'Error Processing'}
                </h3>
                <p className="text-sm text-foreground/90">{result.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              This IDS uses a Decision Tree machine learning model trained on network traffic patterns to detect potential
              security threats in real-time.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="font-medium text-foreground">Duration:</span> Connection duration in seconds
              </li>
              <li>
                <span className="font-medium text-foreground">Protocol:</span> Network protocol type (tcp, udp, icmp, etc.)
              </li>
              <li>
                <span className="font-medium text-foreground">Service:</span> Application service (http, ftp, ssh, etc.)
              </li>
              <li>
                <span className="font-medium text-foreground">Source/Destination Bytes:</span> Data transfer volume
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
