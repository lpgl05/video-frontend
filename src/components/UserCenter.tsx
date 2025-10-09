import React, { useState, useEffect } from 'react'
import { 
  Card, 
  List, 
  Button, 
  Tag, 
  Space, 
  Statistic, 
  Row, 
  Col, 
  Badge, 
  Avatar,
  Tabs,
  Timeline,
  Empty,
  message
} from 'antd'
import { 
  UserOutlined, 
  VideoCameraOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  BellOutlined
} from '@ant-design/icons'
import type { GenerationTask, ProjectHistory } from '../types'

interface UserCenterProps {
  onBack: () => void
  projectHistory?: ProjectHistory[]
  onViewProject?: (historyItem: ProjectHistory) => void
}

interface NotificationItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  content: string
  createdAt: string
  read: boolean
}

const UserCenter: React.FC<UserCenterProps> = ({ onBack, projectHistory = [], onViewProject }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  // 模拟数据加载
  useEffect(() => {
    loadNotifications()
  }, [])

  // 移除loadProjectHistory，直接使用传入的projectHistory prop

  const loadNotifications = () => {
    // 模拟通知数据
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'success',
        title: '视频生成完成',
        content: '您的项目"旅游宣传片"已成功生成，点击查看结果。',
        createdAt: '2025-01-18 10:35:00',
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: '生成任务开始',
        content: '您的项目"产品介绍视频"已开始处理，预计需要5分钟。',
        createdAt: '2025-01-18 14:20:00',
        read: true
      },
      {
        id: '3',
        type: 'error',
        title: '生成失败',
        content: '项目"教育培训内容"生成失败，请检查素材后重试。',
        createdAt: '2025-01-18 09:20:00',
        read: false
      }
    ]
    setNotifications(mockNotifications)
  }

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

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const overviewContent = (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic 
            title="总项目数" 
            value={projectHistory.length} 
            prefix={<VideoCameraOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="已完成" 
            value={projectHistory.filter(p => p.status === 'completed').length}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="进行中" 
            value={projectHistory.filter(p => p.status === 'processing').length}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic 
            title="未读消息" 
            value={unreadCount}
            prefix={<BellOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  )

  const historyContent = (
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
                {item.task?.durationMinutes && (
                  <div>
                    <span style={{ color: '#1890ff', fontWeight: '500' }}>
                      生成耗时: {item.task.durationMinutes} 分钟
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
  )

  const notificationsContent = (
    <List
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={item => (
        <List.Item
          onClick={() => !item.read && markNotificationAsRead(item.id)}
          style={{ 
            cursor: 'pointer',
            backgroundColor: item.read ? 'transparent' : '#f6ffed'
          }}
        >
          <List.Item.Meta
            avatar={
              <Badge dot={!item.read}>
                <Avatar 
                  icon={<BellOutlined />}
                  style={{ 
                    backgroundColor: item.type === 'success' ? '#52c41a' : 
                                   item.type === 'error' ? '#ff4d4f' : '#1890ff'
                  }}
                />
              </Badge>
            }
            title={item.title}
            description={
              <Space direction="vertical" size="small">
                <div>{item.content}</div>
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {item.createdAt}
                </div>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  )

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: overviewContent
    },
    {
      key: 'history',
      label: '历史记录',
      children: historyContent
    },
    {
      key: 'notifications',
      label: (
        <Badge count={unreadCount} size="small">
          消息通知
        </Badge>
      ),
      children: notificationsContent
    }
  ]

  return (
    <div className="user-center">
      <Card 
        title={
          <Space>
            <Avatar size={32} icon={<UserOutlined />} />
            <span>个人中心</span>
          </Space>
        }
        extra={
          <Button onClick={onBack}>
            返回
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default UserCenter
