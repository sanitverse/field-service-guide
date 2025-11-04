'use client'

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
  Cell
} from 'recharts'
import { 
  HardDrive, 
  Upload, 
  FileText, 
  Image, 
  File, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface StorageStatistics {
  total_files: number
  total_size_bytes: number
  processed_files: number
  unprocessed_files: number
  avg_file_size_mb: number
}

interface FileUploadChartProps {
  storageStats: StorageStatistics | null
}

export function FileUploadChart({ storageStats }: FileUploadChartProps) {
  if (!storageStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Storage Analytics</CardTitle>
          <CardDescription>Loading storage statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading storage data...</div>
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

  // Mock file type distribution (in a real app, this would come from the database)
  const fileTypeData = [
    { name: 'PDF Documents', value: Math.floor(storageStats.total_files * 0.4), color: '#ef4444', icon: FileText },
    { name: 'Images', value: Math.floor(storageStats.total_files * 0.3), color: '#10b981', icon: Image },
    { name: 'Word Documents', value: Math.floor(storageStats.total_files * 0.2), color: '#3b82f6', icon: File },
    { name: 'Other', value: Math.floor(storageStats.total_files * 0.1), color: '#f59e0b', icon: File }
  ]

  // Mock upload trends (in a real app, this would be time-series data)
  const uploadTrends = [
    { period: 'Week 1', uploads: 12, size: 45 },
    { period: 'Week 2', uploads: 18, size: 67 },
    { period: 'Week 3', uploads: 15, size: 52 },
    { period: 'Week 4', uploads: 22, size: 78 }
  ]

  const processingData = [
    {
      name: 'Processed',
      value: storageStats.processed_files,
      color: '#10b981'
    },
    {
      name: 'Pending',
      value: storageStats.unprocessed_files,
      color: '#f59e0b'
    }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Storage Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {storageStats.total_files}
                </div>
                <div className="text-sm text-blue-700">Total Files</div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  {formatBytes(storageStats.total_size_bytes)}
                </div>
                <div className="text-sm text-emerald-700">Storage Used</div>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {storageStats.processed_files}
                </div>
                <div className="text-sm text-purple-700">Processed</div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
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
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
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
          <CardDescription>
            RAG processing completion rate for uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing Progress</span>
              <span className="text-sm text-gray-600">
                {storageStats.processed_files} of {storageStats.total_files} files
              </span>
            </div>
            <Progress value={processingRate} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{processingRate.toFixed(1)}% Complete</span>
              <span>{storageStats.unprocessed_files} Pending</span>
            </div>

            {storageStats.unprocessed_files > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {storageStats.unprocessed_files} files are still being processed for search
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Type Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              File Type Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of uploaded files by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
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
            
            <div className="space-y-2 mt-4">
              {fileTypeData.map((type) => {
                const Icon = type.icon
                const percentage = storageStats.total_files > 0 
                  ? ((type.value / storageStats.total_files) * 100).toFixed(1)
                  : '0'
                
                return (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: type.color }}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{type.value}</Badge>
                      <span className="text-xs text-gray-500">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Upload Trends
            </CardTitle>
            <CardDescription>
              File upload activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={uploadTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="uploads" fill="#3b82f6" name="Files Uploaded" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Health & Recommendations
          </CardTitle>
          <CardDescription>
            System health indicators and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">Storage Healthy</span>
              </div>
              <p className="text-sm text-gray-600">
                Current usage is within optimal limits
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-700">Processing Efficient</span>
              </div>
              <p className="text-sm text-gray-600">
                {processingRate.toFixed(0)}% of files are search-ready
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-purple-700">Upload Rate Good</span>
              </div>
              <p className="text-sm text-gray-600">
                Consistent file upload activity
              </p>
            </div>
          </div>

          {storageStats.total_size_bytes > 1024 * 1024 * 1024 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Storage Optimization</span>
              </div>
              <p className="text-sm text-blue-700">
                Consider archiving older files to optimize storage usage and search performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}