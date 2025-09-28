import React, { useState } from 'react'
import { Button, Card, Collapse, Typography, Space, Tag } from 'antd'
import { BugOutlined, ReloadOutlined } from '@ant-design/icons'
import type { GenerationTask } from '../types'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface DebugPanelProps {
  task: GenerationTask | null
  onRefresh?: () => void
}

const DebugPanel: React.FC<DebugPanelProps> = ({ task, onRefresh }) => {
  const [visible, setVisible] = useState(false)

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'processing': return 'blue'
      case 'failed': return 'red'
      default: return 'default'
    }
  }

  const renderTaskDetails = () => {
    if (!task) {
      return (
        <Card title="任务状态" size="small">
          <Text type="warning">没有当前任务</Text>
        </Card>
      )
    }

    return (
      <Collapse size="small" ghost>
        <Panel header="基本信息" key="basic">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div><Text strong>任务ID:</Text> <Text code>{task.id}</Text></div>
            <div><Text strong>项目ID:</Text> <Text code>{task.projectId}</Text></div>
            <div><Text strong>状态:</Text> <Tag color={getStatusColor(task.status)}>{task.status}</Tag></div>
            <div><Text strong>进度:</Text> <Text>{task.progress}%</Text></div>
            <div><Text strong>创建时间:</Text> <Text>{new Date(task.createdAt).toLocaleString()}</Text></div>
            <div><Text strong>更新时间:</Text> <Text>{new Date(task.updatedAt).toLocaleString()}</Text></div>
          </Space>
        </Panel>
        
        <Panel header="结果数据" key="result">
          {task.result ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><Text strong>结果存在:</Text> <Tag color="green">是</Tag></div>
              <div><Text strong>视频数量:</Text> <Text>{task.result.videos?.length || 0}</Text></div>
              <div><Text strong>预览URL:</Text> <Text code>{task.result.previewUrl || '无'}</Text></div>
              
              {task.result.videos && task.result.videos.length > 0 && (
                <div>
                  <Text strong>视频列表:</Text>
                  {task.result.videos.map((url, index) => (
                    <div key={index} style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text>视频{index + 1}: </Text>
                      <Text code style={{ wordBreak: 'break-all' }}>{url}</Text>
                    </div>
                  ))}
                </div>
              )}
            </Space>
          ) : (
            <Text type="warning">没有结果数据</Text>
          )}
        </Panel>
        
        {task.generatedVideos && (
          <Panel header="详细视频信息" key="videos">
            <Space direction="vertical" style={{ width: '100%' }}>
              {task.generatedVideos.map((video, index) => (
                <Card key={video.id} size="small" title={`视频 ${index + 1}`}>
                  <div><Text strong>ID:</Text> <Text code>{video.id}</Text></div>
                  <div><Text strong>名称:</Text> <Text>{video.name}</Text></div>
                  <div><Text strong>URL:</Text> <Text code style={{ wordBreak: 'break-all' }}>{video.url}</Text></div>
                  <div><Text strong>大小:</Text> <Text>{(video.size / 1024 / 1024).toFixed(1)} MB</Text></div>
                  <div><Text strong>时长:</Text> <Text>{video.duration}秒</Text></div>
                </Card>
              ))}
            </Space>
          </Panel>
        )}
        
        {task.error && (
          <Panel header="错误信息" key="error">
            <Text type="danger">{task.error}</Text>
          </Panel>
        )}
        
        <Panel header="原始数据" key="raw">
          <Paragraph>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 4,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 300
            }}>
              {JSON.stringify(task, null, 2)}
            </pre>
          </Paragraph>
        </Panel>
      </Collapse>
    )
  }

  const checkConditions = () => {
    if (!task) return null

    const conditions = [
      {
        name: 'task存在',
        passed: !!task,
        value: !!task ? '是' : '否'
      },
      {
        name: 'status为completed',
        passed: task.status === 'completed',
        value: task.status
      },
      {
        name: 'result存在',
        passed: !!task.result,
        value: !!task.result ? '是' : '否'
      },
      {
        name: 'result.videos存在',
        passed: !!(task.result && task.result.videos),
        value: task.result?.videos ? `${task.result.videos.length}个` : '无'
      },
      {
        name: 'videos数组不为空',
        passed: !!(task.result && task.result.videos && task.result.videos.length > 0),
        value: task.result?.videos?.length || 0
      }
    ]

    return (
      <Card title="显示条件检查" size="small" style={{ marginTop: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {conditions.map((condition, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{condition.name}:</Text>
              <Space>
                <Text>{condition.value}</Text>
                <Tag color={condition.passed ? 'green' : 'red'}>
                  {condition.passed ? '✓' : '✗'}
                </Tag>
              </Space>
            </div>
          ))}
        </Space>
        
        <div style={{ marginTop: 12, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
          <Text strong>
            GenerationResult显示条件: task?.status === 'completed' && task.result
          </Text>
          <br />
          <Text type={
            task.status === 'completed' && task.result ? 'success' : 'danger'
          }>
            当前状态: {
              task.status === 'completed' && task.result ? '应该显示结果' : '不显示结果'
            }
          </Text>
        </div>
      </Card>
    )
  }

  if (!visible) {
    return (
      <div style={{ position: 'fixed', top: 100, right: 20, zIndex: 1000 }}>
        <Button
          type="primary"
          icon={<BugOutlined />}
          onClick={() => setVisible(true)}
          size="small"
        >
          调试
        </Button>
      </div>
    )
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      width: 400, 
      maxHeight: 'calc(100vh - 40px)',
      overflow: 'auto',
      zIndex: 1000,
      background: 'white',
      border: '1px solid #d9d9d9',
      borderRadius: 6,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <Card 
        title="任务调试面板" 
        size="small"
        extra={
          <Space>
            {onRefresh && (
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
              >
                刷新
              </Button>
            )}
            <Button 
              size="small" 
              onClick={() => setVisible(false)}
            >
              关闭
            </Button>
          </Space>
        }
      >
        {renderTaskDetails()}
        {checkConditions()}
        
        <div style={{ marginTop: 12, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
          <Text style={{ fontSize: 12 }}>
            💡 提示: 如果所有条件都满足但仍不显示结果，请检查浏览器控制台错误或清除缓存重试。
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default DebugPanel
