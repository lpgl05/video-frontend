import React from 'react'
import { 
  Card, 
  List, 
  Button, 
  Tag, 
  Space, 
  Empty,
  Avatar,
  message
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
  // 批量一键下载所有视频
  const handleBatchDownload = (historyItem: ProjectHistory) => {
    if (!historyItem.videos || historyItem.videos.length === 0) {
      message.warning('该记录没有可下载的视频');
      return;
    }

    historyItem.videos.forEach((video, index) => {
      setTimeout(() => {
        if (video.url) {
          const link = document.createElement('a');
          const downloadUrl = video.url.includes('oss-proxy') ? 
            video.url.replace(':8000', ':9999') + '&download=true' : 
            video.url;
          link.href = downloadUrl;
          link.download = `${historyItem.name}_视频${index + 1}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, index * 500);
    });

    message.success(`开始批量下载 ${historyItem.videos.length} 个视频文件`);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '未知'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分钟${remainingSeconds}秒`
  }

  if (!projectHistory || projectHistory.length === 0) {
    return (
      <Card title="历史记录">
        <Empty description="暂无历史记录" />
      </Card>
    )
  }

  return (
    <Card title={`历史记录 (${projectHistory.length})`}>
      <List
        dataSource={projectHistory}
        renderItem={(item) => (
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
                <Button 
                  type="link" 
                  icon={<DownloadOutlined />}
                  onClick={() => handleBatchDownload(item)}
                >
                  一键下载
                </Button>
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
                  <span>{item.name}</span>
                  <Tag color={getStatusColor(item.status)} icon={getStatusIcon(item.status)}>
                    {getStatusText(item.status)}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <div>创建时间: {formatDate(item.createdAt)}</div>
                  {item.completedAt && <div>完成时间: {formatDate(item.completedAt)}</div>}
                  {item.processingTime && <div>生成耗时: {formatDuration(item.processingTime)}</div>}
                  <div>视频数量: {item.videoCount} 时长: {item.duration}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default HistoryPage
