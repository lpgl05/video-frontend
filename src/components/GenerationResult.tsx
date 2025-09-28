import React, { useState, useEffect } from 'react'
import { Progress, Button, message, Modal } from 'antd'
import { PlayCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import type { GenerationTask } from '../types'
import ReactPlayer from 'react-player'

interface GenerationResultProps {
  task: GenerationTask | null
  onReset: () => void
  onNewCreation: () => void
}

const GenerationResult: React.FC<GenerationResultProps> = ({ task, onReset, onNewCreation }) => {
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<string>('')
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // 进度条模拟和时间计算
  useEffect(() => {
    if (!task) {
      setSimulatedProgress(0)
      setElapsedTime(0)
      setStartTime(null)
      return
    }

    if (task.status === 'processing') {
      // 开始处理时记录开始时间
      if (!startTime) {
        setStartTime(Date.now())
      }

      // 模拟进度条平滑增长
      const progressInterval = setInterval(() => {
        setSimulatedProgress(prev => {
          const realProgress = task.progress || 0
          const targetProgress = Math.min(realProgress + 5, 95) // 总是比实际进度稍高一点，但不超过95%
          
          if (prev < targetProgress) {
            return Math.min(prev + 0.5, targetProgress) // 每次增长0.5%，慢一些
          }
          return prev
        })
      }, 300) // 每300ms更新一次

      // 计算已用时间
      const timeInterval = setInterval(() => {
        if (startTime) {
          const now = Date.now()
          const elapsed = Math.floor((now - startTime) / 1000)
          setElapsedTime(elapsed)
        }
      }, 1000)

      return () => {
        clearInterval(progressInterval)
        clearInterval(timeInterval)
      }
    } else if (task.status === 'completed') {
      // 完成时设置为100%
      setSimulatedProgress(100)
    } else if (task.status === 'failed') {
      // 失败时重置
      setSimulatedProgress(0)
    }
  }, [task, startTime])

  // 格式化时间显示
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}分${secs}秒`
    }
    return `${secs}秒`
  }

  const handlePreview = (url: string) => {
    setPreviewVideo(url)
    setPreviewVisible(true)
  }

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `混剪视频_${index + 1}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('开始下载')
  }

  // 格式化耗时显示
  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes) return null
    
    const totalSeconds = Math.round(durationMinutes * 60)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  }

  const getStatusText = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending':
        return '等待中'
      case 'processing':
        return '处理中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return '未知'
    }
  }

  const getStatusColor = (status: GenerationTask['status']) => {
    switch (status) {
      case 'pending':
        return '#faad14'
      case 'processing':
        return '#1890ff'
      case 'completed':
        return '#52c41a'
      case 'failed':
        return '#ff4d4f'
      default:
        return '#d9d9d9'
    }
  }

  if (!task) {
    return null
  }

  return (
    <div className="section">
      <div className="section-title">
        <PlayCircleOutlined />
        生成结果
      </div>
      
      <div className="section-content">
        <div className="generation-status">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span>状态: {getStatusText(task.status)}</span>
              {task.status === 'processing' && (
                <span style={{ color: '#666', fontSize: '12px' }}>
                  已用时: {formatElapsedTime(elapsedTime)}
                </span>
              )}
            </div>
            <Progress 
              percent={Math.round(simulatedProgress * 10) / 10} 
              status={task.status === 'failed' ? 'exception' : undefined}
              strokeColor={getStatusColor(task.status)}
              showInfo={false}
            />
            {/* 只在进度条下方显示一个百分比 */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: '4px', 
              fontSize: '12px',
              color: getStatusColor(task.status)
            }}>
              {simulatedProgress.toFixed(1)}%
            </div>
          </div>

          {task.error && (
            <div style={{ 
              background: '#fff2f0', 
              border: '1px solid #ffccc7', 
              borderRadius: '6px', 
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ color: '#ff4d4f', fontWeight: 500, marginBottom: '4px' }}>
                错误信息
              </div>
              <div style={{ color: '#666' }}>{task.error}</div>
            </div>
          )}

          {task.status === 'completed' && task.result && (
            <div>
              <div className="result-grid">
                {task.result.videos.map((video, index) => (
                  <div key={index} className="result-item">
                    <div style={{ 
                      width: '100%', 
                      height: '200px', 
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }} onClick={() => handlePreview(video.url)}>
                      <PlayCircleOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    </div>
                    <div className="result-info">
                      <div className="result-title">混剪视频 {index + 1}</div>
                      <div className="result-meta">
                        生成时间: {new Date(task.updatedAt).toLocaleString()}
                      </div>
                      {task.processing_time && (
                        <div className="result-meta" style={{ color: '#1890ff', fontWeight: '500' }}>
                          耗时: {formatDuration(task.processing_time)}
                        </div>
                      )}
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(video.url)}
                        >
                          预览
                        </Button>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(video, index)}
                        >
                          下载
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 按钮区域 */}
              <div style={{ 
                marginTop: '24px', 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <Button 
                  type="primary" 
                  onClick={onReset}
                  style={{ minWidth: '120px' }}
                >
                  查看原配置
                </Button>
                <Button 
                  onClick={onNewCreation}
                  style={{ minWidth: '120px' }}
                >
                  新创作
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="视频预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <ReactPlayer
          config={{            file: {              attributes: {                crossOrigin: "anonymous",                preload: "metadata"              }            }          }}
          url={previewVideo}
          controls
          width="100%"
          height="400px"
        />
      </Modal>
    </div>
  )
}

export default GenerationResult 