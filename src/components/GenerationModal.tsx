import React, { useEffect, useState } from 'react'
import { Modal, Space, Button, Typography } from 'antd'
import { 
  VideoCameraOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LoadingOutlined,
  CloseOutlined,
  ClockCircleOutlined  // 🚀 新增队列图标
} from '@ant-design/icons'
import type { GenerationTask } from '../types'
import '../styles/GenerationModal.css'

const { Title, Text } = Typography

interface GenerationModalProps {
  visible: boolean
  task: GenerationTask | null
  onClose: () => void
  onComplete: () => void
  onRetry?: () => void
}

const GenerationModal: React.FC<GenerationModalProps> = ({
  visible,
  task,
  onClose,
  onComplete,
  onRetry
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)

  // 计算已用时间 - 只在 processing 状态时计时
  useEffect(() => {
    if (!task || task.status !== 'processing') {
      setElapsedTime(0)
      return
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [task?.status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusInfo = () => {
    if (!task) return { title: '准备中...', description: '正在初始化任务' }

    switch (task.status) {
      // 🚀 新增队列状态处理
      case 'queued':
        const queuePosition = task.queuePosition || 0
        const queueMessage = queuePosition > 1 
          ? `前面还有 ${queuePosition - 1} 个任务` 
          : '即将开始处理'
        
        return {
          title: '正在排队',
          description: `${queueMessage}${task.estimatedWaitTime ? `，${task.estimatedWaitTime}` : ''}`,
          icon: <ClockCircleOutlined spin style={{ color: '#faad14' }} />
        }
        
      case 'processing':
        // 根据已用时间动态调整预计时间
        const getEstimatedDescription = () => {
          if (elapsedTime < 60) {
            return '预计3-5分钟，正在初始化AI引擎...'
          } else if (elapsedTime < 120) {
            return '预计还需2-3分钟，正在分析内容...'
          } else if (elapsedTime < 180) {
            return '预计还需1-2分钟，正在合成视频...'
          } else if (elapsedTime < 240) {
            return '即将完成，正在优化输出...'
          } else {
            return '正在进行最终处理，请稍候...'
          }
        }
        
        return {
          title: 'AI正在合成中',
          description: getEstimatedDescription(),
          icon: <LoadingOutlined spin style={{ color: '#1890ff' }} />
        }
        
      case 'completed':
        return {
          title: '生成完成！',
          description: '您的视频已成功生成，可以查看和下载了',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        }
        
      case 'failed':
        return {
          title: '生成失败',
          description: task.error || '视频生成过程中出现错误，请重试',
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
        }
        
      default:
        return {
          title: '准备中...',
          description: '正在初始化任务',
          icon: <LoadingOutlined spin style={{ color: '#1890ff' }} />
        }
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Modal
      open={visible}
      title={null}
      footer={null}
      onCancel={onClose}
      width={520}
      centered
      className="generation-modal"
      maskClosable={false}
      closeIcon={
        task?.status === 'completed' || task?.status === 'failed' ? (
          <CloseOutlined />
        ) : null
      }
    >
      <div className="modal-content">
        {/* 头部图标和标题 */}
        <div className="modal-header">
          <div className="header-icon">
            <VideoCameraOutlined />
          </div>
          <Title level={3} className="modal-title">
            AI视频生成
          </Title>
        </div>

        {/* 状态显示 */}
        <div className="status-section">
          <div className="status-icon">
            {statusInfo.icon}
          </div>
          <div className="status-info">
            <Title level={4} className="status-title">
              {statusInfo.title}
            </Title>
            <Text className="status-description">
              {statusInfo.description}
            </Text>
          </div>
        </div>

        {/* 🚀 队列状态显示 */}
        {task?.status === 'queued' && (
          <div className="queue-section" style={{ 
            textAlign: 'center', 
            padding: '20px 0', 
            borderTop: '1px solid #f0f0f0',
            borderBottom: '1px solid #f0f0f0',
            background: '#fffbe6'  // 淡黄色背景
          }}>
            <div style={{ marginBottom: '12px' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                队列位置: {task.queuePosition || 0} / {task.queueSize || 0}
              </Text>
            </div>
            {task.estimatedWaitTime && (
              <Text style={{ color: '#faad14', fontWeight: 500 }}>
                {task.estimatedWaitTime}
              </Text>
            )}
          </div>
        )}

        {/* 已用时间显示 - 只在处理中显示 */}
        {task?.status === 'processing' && (
          <div className="time-section" style={{ 
            textAlign: 'center', 
            padding: '20px 0', 
            borderTop: '1px solid #f0f0f0',
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              已用时: {formatTime(elapsedTime)}
            </Text>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="modal-footer">
          {/* 🚀 队列状态按钮 */}
          {task?.status === 'queued' && (
            <div style={{ textAlign: 'center' }}>
              <Button onClick={onClose} type="default">
                后台排队
              </Button>
            </div>
          )}
          
          {task?.status === 'processing' && (
            <div style={{ textAlign: 'center' }}>
              <Button onClick={onClose} type="primary">
                后台运行
              </Button>
            </div>
          )}
          
          {task?.status === 'completed' && (
            <Space>
              <Button onClick={onClose}>
                关闭
              </Button>
              <Button type="primary" onClick={onComplete}>
                查看结果
              </Button>
            </Space>
          )}
          
          {task?.status === 'failed' && (
            <Space>
              <Button onClick={onClose}>
                关闭
              </Button>
              <Button type="primary" danger onClick={handleRetry}>
                重新生成
              </Button>
            </Space>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default GenerationModal
