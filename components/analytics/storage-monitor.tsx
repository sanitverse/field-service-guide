'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText,
  Database,
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react'

interface StorageMetrics {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

interface StorageAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

export function StorageMonitor() {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null)
  const [alerts, setAlerts] = useState<StorageAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchStorageData()
    const interval = setInterval(fetchStorageData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStorageData = async () => {
    try {
      const response = await fetch('/api/analytics/storage-statistics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
        generateAlerts(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching storage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAlerts = (data: StorageMetrics) => {
    const newAlerts: StorageAlert[] = []

    // Check processing backlog
    if (data.unprocessed_files > 10) {
      newAlerts.push({
        id: 'processing-backlog',
        type: 'warning',
        title: 'Processing Backlog Detected',
        message: `${data.unprocessed_files} files are pending RAG processing. This may affect search functionality.`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Check storage usage (mock threshold)
    const storageUsageGB = data.total_size_bytes / (1024 * 1024 * 1024)
    if (storageUsageGB > 5) { // 5GB threshold
      newAlerts.push({
        id: 'storage-usage',
        type: 'info',
        title: 'Storage Usage Notice',
        message: `Storage usage is ${storageUsageGB.toFixed(2)}GB. Consider archiving older files.`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    // Check processing rate
    const processingRate = data.total_files > 0 ? (data.processed_files / data.total_files) * 100 : 100
    if (processingRate < 80) {
      newAlerts.push({
        id: 'processing-rate',
        type: 'warning',
        title: 'Low Processing Rate',
        message: `Only ${processingRate.toFixed(1)}% of files are processed for search. Check processing queue.`,
        timestamp: new Date().toISOString(),
        resolved: false
      })
    }

    setAlerts(newAlerts)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'gray' }
    
    const processingRate = metrics.total_files > 0 ? (metrics.processed_files / metrics.total_files) * 100 : 100
    const hasBacklog = metrics.unprocessed_files > 10
    
    if (processingRate >= 95 && !hasBacklog) {
      return { status: 'excellent', color: 'green' }
    } else if (processingRate >= 80 && metrics.unprocessed_files <= 10) {
      return { status: 'good', color: 'blue' }
    } else if (processingRate >= 60) {
      return { status: 'warning', color: 'yellow' }
    } else {
      return { status: 'critical', color: 'red' }
    }
  }

  const healthStatus = getHealthStatus()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load storage metrics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const processingRate = metrics.total_files > 0 ? (metrics.processed_files / metrics.total_files) * 100 : 100

  return (
    <div className="space-y-6">
      {/* Storage Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Health Monitor
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={`bg-${healthStatus.color}-100 text-${healthStatus.color}-800 border-${healthStatus.color}-200`}
              >
                {healthStatus.status}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchStorageData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time storage metrics and health monitoring
            <span className="ml-2 text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <Badge variant="secondary">{metrics.total_files}</Badge>
              </div>
              <div className="text-sm font-medium text-gray-700">Total Files</div>
              <div className="text-xs text-gray-500 mt-1">
                Avg: {metrics.avg_file_size_mb}MB
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Database className="h-5 w-5 text-green-500" />
                <Badge variant="secondary">{formatBytes(metrics.total_size_bytes)}</Badge>
              </div>
              <div className="text-sm font-medium text-gray-700">Storage Used</div>
              <div className="text-xs text-gray-500 mt-1">
                Total capacity
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <Badge variant="secondary">{metrics.processed_files}</Badge>
              </div>
              <div className="text-sm font-medium text-gray-700">Processed</div>
              <div className="text-xs text-gray-500 mt-1">
                {processingRate.toFixed(1)}% complete
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <Badge 
                  variant={metrics.unprocessed_files > 10 ? "destructive" : "secondary"}
                >
                  {metrics.unprocessed_files}
                </Badge>
              </div>
              <div className="text-sm font-medium text-gray-700">Pending</div>
              <div className="text-xs text-gray-500 mt-1">
                Processing queue
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Processing Status
          </CardTitle>
          <CardDescription>
            RAG processing progress for search functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing Progress</span>
              <span className="text-sm text-gray-600">
                {metrics.processed_files} of {metrics.total_files} files
              </span>
            </div>
            
            <Progress 
              value={processingRate} 
              className={`h-3 ${
                processingRate >= 95 ? 'bg-green-100' :
                processingRate >= 80 ? 'bg-blue-100' :
                processingRate >= 60 ? 'bg-yellow-100' :
                'bg-red-100'
              }`}
            />
            
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${
                processingRate >= 95 ? 'text-green-600' :
                processingRate >= 80 ? 'text-blue-600' :
                processingRate >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {processingRate.toFixed(1)}% Complete
              </span>
              <span className="text-gray-500">
                {metrics.unprocessed_files} remaining
              </span>
            </div>

            {metrics.unprocessed_files > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Processing in Progress
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {metrics.unprocessed_files} files are being processed for search functionality. 
                  This typically takes 1-2 minutes per file.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Storage Alerts
            </CardTitle>
            <CardDescription>
              Active alerts and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        alert.type === 'error' ? 'text-red-500' :
                        alert.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        {alert.type === 'error' ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          alert.type === 'error' ? 'text-red-800' :
                          alert.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {alert.title}
                        </div>
                        <div className={`text-sm mt-1 ${
                          alert.type === 'error' ? 'text-red-700' :
                          alert.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {alert.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={alert.type === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions to improve storage performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {processingRate >= 95 && metrics.unprocessed_files <= 5 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Optimal Performance</span>
                </div>
                <p className="text-sm text-green-700">
                  Storage system is performing excellently. All files are processed and ready for search.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Processing Optimization</span>
                </div>
                <p className="text-sm text-blue-700">
                  Consider increasing processing resources if the queue consistently grows above 10 files.
                </p>
              </div>
            )}

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Maintenance</span>
              </div>
              <p className="text-sm text-purple-700">
                Regular cleanup of unused files can help maintain optimal performance and reduce storage costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}