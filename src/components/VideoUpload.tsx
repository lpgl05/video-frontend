import React, { useState } from 'react'
import { Upload, Button, List, Progress, message, Modal } from 'antd'
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import type { VideoFile } from '../types'
import { uploadVideo, uploadVideoWithProgress, deleteVideo, testDelete } from '../services/api'
import ReactPlayer from 'react-player'

interface VideoUploadProps {
  videos: VideoFile[]
  onVideosChange: (videos: VideoFile[]) => void
  maxCount?: number
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  videos, 
  onVideosChange, 
  maxCount = 20 
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewVideo, setPreviewVideo] = useState<string>('')

  const handleUpload = async (file: File, fileList: File[]) => {
    // 检查总文件数量限制
    if (videos.length + fileList.length > maxCount) {
      message.error(`最多只能上传${maxCount}个视频，当前已有${videos.length}个，本次选择${fileList.length}个`)
      return false
    }

    // 验证所有文件
    for (const f of fileList) {
      if (!f.type.startsWith('video/')) {
        message.error(`文件"${f.name}"不是视频文件`)
        return false
      }
      if (f.size > 500 * 1024 * 1024) { // 500MB
        message.error(`文件"${f.name}"大小不能超过500MB`)
        return false
      }
    }

    // 只处理第一个文件（当前文件），其他文件会在后续调用中处理
    if (file !== fileList[0]) {
      return false // 非第一个文件，跳过处理
    }

    // 开始批量上传处理
    await handleBatchUpload(fileList)
    return false
  }

  const handleBatchUpload = async (fileList: File[]) => {
    setUploading(true)
    setUploadProgress(0)
    setUploadingFileName(`批量上传 (0/${fileList.length})`)
    setUploadSpeed('')
    
    try {
      const uploadedVideos: VideoFile[] = []
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < fileList.length; i++) {
        const currentFile = fileList[i]
        setUploadingFileName(`正在上传: ${currentFile.name} (${i + 1}/${fileList.length})`)
        
        try {
          const videoFile = await uploadVideoWithProgress(currentFile, (progress, loaded, total, speed) => {
            // 计算总体进度：已完成文件 + 当前文件进度
            const totalProgress = ((i * 100) + progress) / fileList.length
            setUploadProgress(totalProgress)
            
            // 使用后端提供的速度信息
            if (typeof speed === 'string') {
              setUploadSpeed(speed)
            } else if (speed) {
              setUploadSpeed(`${speed} MB/s`)
            }
          })
          
          uploadedVideos.push(videoFile)
          successCount++
          
        } catch (error) {
          console.error(`Upload error for ${currentFile.name}:`, error)
          failedCount++
        }
      }

      // 更新视频列表
      if (uploadedVideos.length > 0) {
        onVideosChange([...videos, ...uploadedVideos])
      }

      // 显示结果消息
      if (failedCount === 0) {
        message.success(`成功上传 ${successCount} 个视频文件`)
      } else if (successCount === 0) {
        message.error(`上传失败，${failedCount} 个文件上传失败`)
      } else {
        message.warning(`上传完成：${successCount} 个成功，${failedCount} 个失败`)
      }
      
    } catch (error) {
      message.error('批量上传失败')
      console.error('Batch upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadingFileName('')
      setUploadSpeed('')
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      console.log('开始删除视频:', videoId)
      
      // 先尝试测试删除接口
      console.log('测试删除接口...')
      await testDelete(videoId)
      console.log('测试删除成功')
      
      // 找到要删除的视频，传递URL给后端
      const videoToDelete = videos.find(v => v.id === videoId)
      console.log('要删除的视频:', videoToDelete)
      
      console.log('调用正式删除接口...')
      await deleteVideo(videoId, videoToDelete?.url)
      console.log('正式删除成功')
      
      onVideosChange(videos.filter(v => v.id !== videoId))
      message.success('视频删除成功')
    } catch (error) {
      message.error('视频删除失败')
      console.error('Delete error:', error)
    }
  }

  const handlePreview = (url: string) => {
    setPreviewVideo(url)
    setPreviewVisible(true)
  }

  const uploadProps: UploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    accept: 'video/*',
    multiple: true,
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="section">
      <div className="section-title">
        <UploadOutlined />
        视频素材上传 ({videos.length}/{maxCount})
        <span style={{ color: '#ff4d4f', marginLeft: '8px', fontSize: '14px' }}>
          （建议上传的视频文件大小不要超过100MB）
        </span>
      </div>
      
      <div className="section-content">
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            disabled={videos.length >= maxCount}
          >
            选择视频文件（支持多选）
          </Button>
        </Upload>
        
        <div style={{ marginTop: '6px', fontSize: '12px', color: '#999', lineHeight: '1.4' }}>
          支持格式：MP4、AVI、MOV、WMV、FLV、MKV、3GP、WEBM等常见视频格式<br/>
          文件大小：单个文件不超过500MB
        </div>
        
        {uploading && (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ marginBottom: '6px', fontSize: '14px', color: '#666' }}>
              <span style={{ 
                maxWidth: '100%', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}>正在上传: {uploadingFileName}</span>
            </div>
            <Progress 
              percent={Math.round(uploadProgress * 10) / 10} 
              size="small"
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
              <span>上传进度: {uploadProgress.toFixed(1)}%</span>
              {uploadSpeed && <span>速度: {uploadSpeed}</span>}
            </div>
          </div>
        )}
        
        <div className="upload-list">
          {videos.map((video) => (
            <div key={video.id} className="upload-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>{video.name}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {formatFileSize(video.size)} • {formatDuration(video.duration)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handlePreview(video.url)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(video.id)}
                  />
                </div>
              </div>
              
              {video.thumbnail && (
                <div style={{ 
                  width: '100%', 
                  height: '100px', 
                  background: `url(${video.thumbnail}) center/cover`,
                  borderRadius: '4px',
                  marginTop: '6px'
                }} />
              )}
            </div>
          ))}
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
          url={previewVideo}
          controls
          width="100%"
          height="400px"
        />
      </Modal>
    </div>
  )
}

export default VideoUpload 