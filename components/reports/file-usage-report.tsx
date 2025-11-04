'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  HardDrive, 
  FileText, 
  Image, 
  File, 
  Upload,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Download
} from 'lucide-react'
import { DateRange } from 'react-day-picker'

interface FileUsageReportProps {
  dateRange: DateRange | undefined
}

interface StorageStats {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

export function FileUsageReport({ dateRange }: FileUsageReportProps) {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFileData()
  }, [dateRange])

  const fetchFileData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/storage-statistics')
      
      if (response.ok) {
        const data = await response.json()
        setStorageStats(data)
      }
    } catch (error) {
      console.error('Error fetching file data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Usage Report</CardTitle>
          <CardDescription>Loading file usage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading report data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!storageStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Usage Report</CardTitle>
          <CardDescription>No file data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-gray-500">No file usage data found</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const processingRate = storageStats.total_files > 0 
    ? (storageStats.processed_files / storageStats.total_files) * 100 
    : 0

  // Mock file type data (in a real app, this would come from the database)
  const fileTypeData = [
    { 
      name: 'PDF Documents', 
      value: Math.floor(storageStats.total_files * 0.4), 
      size: Math.floor(storageStats.total_size_bytes * 0.5),
      color: '#ef4444',
      icon: FileText 
    },
    { 
      name: 'Images', 
      value: Math.floor(storageStats.total_files * 0.3), 
      size: Math.floor(storageStats.total_size_bytes * 0.3),
      color: '#10b981',
      icon: Image 
    },
    { 
      name: 'Word Documents', 
      value: Math.floor(storageStats.total_files * 0.2), 
      size: Math.floor(storageStats.total_size_bytes * 0.15),
      color: '#3b82f6',
      icon: File 
    },
    { 
      name: 'Other', 
      value: Math.floor(storageStats.total_files * 0.1), 
      size: Math.floor(storageStats.total_size_bytes * 0.05),
      color: '#f59e0b',
      icon: File 
    }
  ]

  // Mock upload trends (in a real app, this would be time-series data)
  const uploadTrends = [
    { period: 'Week 1', files: 12, size: 45, searches: 28 },
    { period: 'Week 2', files: 18, size: 67, searches: 42 },
    { period: 'Week 3', files: 15, size: 52, searches: 35 },
    { period: 'Week 4', files: 22, size: 78, searches: 56 }
  ]

  // Mock popular files data
  const popularFiles = [
    { name: 'HVAC_Manual_2024.pdf', downloads: 45, searches: 23, size: '2.4 MB' },
    { name: 'Safety_Procedures.docx', downloads: 38, searches: 19, size: '512 KB' },
    { name: 'Equipment_Specs.pdf', downloads: 32, searches: 16, size: '1.8 MB' },
    { name: 'Installation_Guide.pdf', downloads: 28, searches: 14, size: '3.2 MB' },
    { name: 'Troubleshooting.docx', downloads: 25, searches: 12, size: '756 KB' }
  ]

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{storageStats.total_files}</div>
                <div className="text-sm text-blue-700">Total Files</div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {formatBytes(storageStats.total_size_bytes)}
                </div>
                <div className="text-sm text-green-700">Storage Used</div>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">{storageStats.processed_files}</div>
                <div className="text-sm text-purple-700">Processed</div>
                <div className="text-xs text-purple-600">{processingRate.toFixed(1)}%</div>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {storageStats.avg_file_size_mb}MB
                </div>
                <div className="text-sm text-orange-700">Avg Size</div>
              </div>
              <Upload className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Type Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Type Distribution</CardTitle>
            <CardDescription>Breakdown by file type and storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fileTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fileTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Files']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {fileTypeData.map((type) => {
                const Icon = type.icon
                const percentage = storageStats.total_files > 0 
                  ? ((type.value / storageStats.total_files) * 100).toFixed(1)
                  : '0'
                
                return (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: type.color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{type.value} files</Badge>
                      <span className="text-sm text-gray-500">{formatBytes(type.size)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload & Usage Trends</CardTitle>
            <CardDescription>File activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uploadTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="files" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Files Uploaded"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="searches" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Search Queries"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            File Processing Status
          </CardTitle>
          <CardDescription>RAG processing completion for search functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Processing Progress</span>
                <span className="text-sm text-gray-600">
                  {storageStats.processed_files} of {storageStats.total_files} files
                </span>
              </div>
              <Progress value={processingRate} className="h-4" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{processingRate.toFixed(1)}% Complete</span>
                <span>{storageStats.unprocessed_files} Pending</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Processed Files</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {storageStats.processed_files}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Pending Processing</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {storageStats.unprocessed_files}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Most Popular Files
          </CardTitle>
          <CardDescription>Files with highest download and search activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularFiles.map((file, index) => (
              <div key={file.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-400 w-8">#{index + 1}</div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-600">{file.size}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{file.downloads}</div>
                    <div className="text-gray-500">Downloads</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{file.searches}</div>
                    <div className="text-gray-500">Searches</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Optimization Recommendations
          </CardTitle>
          <CardDescription>Suggestions to improve storage efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Processing Health</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{processingRate.toFixed(0)}%</div>
              <p className="text-sm text-blue-700 mt-1">
                Files ready for search
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Usage Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {Math.round((popularFiles.reduce((sum, f) => sum + f.searches, 0) / storageStats.total_files) * 100)}%
              </div>
              <p className="text-sm text-green-700 mt-1">
                Average file utilization
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Search Ready</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{storageStats.processed_files}</div>
              <p className="text-sm text-purple-700 mt-1">
                Files in search index
              </p>
            </div>
          </div>

          {storageStats.unprocessed_files > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Action Required</span>
              </div>
              <p className="text-sm text-yellow-700">
                {storageStats.unprocessed_files} files are still being processed for search functionality. 
                Consider checking the processing queue if this number remains high.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}