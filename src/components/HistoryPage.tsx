import React from 'react'
import { 
  Card, 
  List, 
  Button, 
  Tag, 
  Space, 
  Empty,
  Avatar
} from 'antd'
import { 
  VideoCameraOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import type { ProjectHistory } from '../types'

interface HistoryPageProps {
  projectHistory?: ProjectHistory[]
  onViewProject?: (historyItem: ProjectHistory) => void
}

const HistoryPage: React.FC<HistoryPageProps> = ({ projectHistory = [], onViewProject }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'processing': return 'processing'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'processing': return '生成中'
      case 'failed': return '失败'
      default: return '未知'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />
      case 'processing': return <ClockCircleOutlined />
      case 'failed': return <ExclamationCircleOutlined />
      default: return null
    }
  }
  // 格式化耗时显示
  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes) return null
    
    const totalSeconds = Math.round(durationMinutes)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  }

  if (projectHistory.length === 0) {
    return (
      <Card>
        <Empty 
          description="暂无历史记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => window.location.reload()}>
            开始创建视频
          </Button>
        </Empty>
      </Card>
    )
  }
  console.log('projectHistory:', projectHistory);

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <VideoCameraOutlined />
            历史记录 ({projectHistory.length})
          </Space>
        }
        style={{ maxWidth: '100%' }}
      >
        <List
          itemLayout="horizontal"
          dataSource={projectHistory}
          renderItem={item => (
            <List.Item
              actions={[
                item.status === 'completed' && (
                  <Button 
                    type="link" 
                    icon={<EyeOutlined />}
                    onClick={() => onViewProject?.(item)}
                  >
                    查看
                  </Button>
                ),
                item.status === 'completed' && (
                  <Button type="link" icon={<DownloadOutlined />}>下载</Button>
                ),
                item.status === 'failed' && (
                  <Button type="link">重试</Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<VideoCameraOutlined />} />}
                title={
                  <Space>
                    {item.name}
                    <Tag color={getStatusColor(item.status)} icon={getStatusIcon(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <div>创建时间: {item.createdAt}</div>
                    {item.completedAt && <div>完成时间: {item.completedAt}</div>}
                    {(item.task?.result?.processing_time || item.task?.processing_time) && (
                      <div>
                        <span style={{ color: '#1890ff', fontWeight: '500' }}>
                          生成耗时: {formatDuration((item.task.result?.processing_time || item.task.processing_time))}
                        </span>
                      </div>
                    )}
                    <div>
                      <Space>
                        <span>视频数量: {item.videoCount}</span>
                        <span>时长: {item.duration}</span>
                      </Space>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default HistoryPage
