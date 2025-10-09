import React, { useState, useEffect } from 'react'
import { Upload, Button, message, Modal, Progress, Switch, Card } from 'antd'
import { PictureOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload/interface'
import type { PosterFile } from '../types'
import { uploadPoster, uploadPosterWithProgress, deletePoster } from '../services/api'

interface PosterUploadProps {
  posters: PosterFile[]
  onPostersChange: (posters: PosterFile[]) => void
}

const PosterUpload: React.FC<PosterUploadProps> = ({ posters, onPostersChange }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [enablePoster, setEnablePoster] = useState(false)

  // 当有已上传的海报时，自动打开开关
  useEffect(() => {
    if (posters.length > 0) {
      setEnablePoster(true)
    }
  }, [posters.length])

  const handleUpload = async (file: File) => {
    // 检查是否已有海报（只允许一个）
    if (posters.length >= 1) {
      message.error('只能上传一个背景海报，请先删除现有海报！')
      return false
    }

    // 验证文件类型
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件！')
      return false
    }

    // 验证文件大小 (限制10MB)
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('图片大小不能超过10MB！')
      return false
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadingFileName(file.name)
    setUploadSpeed('')

    try {
      const posterFile = await uploadPosterWithProgress(file, (progress, loaded, total, speed) => {
        setUploadProgress(progress)

        // 使用后端提供的速度信息，或者显示状态信息
        if (typeof speed === 'string') {
          setUploadSpeed(speed)
        } else if (speed) {
          setUploadSpeed(`${speed} MB/s`)
        }
      })

      // 直接替换为新的海报（单张模式）
      onPostersChange([posterFile])
      message.success('海报上传成功')
    } catch (error) {
      message.error('海报上传失败')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadingFileName('')
      setUploadSpeed('')
    }

    return false // 阻止默认上传行为
  }

  const handleDelete = async (posterId: string) => {
    try {
      console.log('正在删除海报:', posterId)
      await deletePoster(posterId)
      console.log('删除API调用成功')
      
      // 更新状态
      const updatedPosters = posters.filter(poster => poster.id !== posterId)
      onPostersChange(updatedPosters)
      
      // 如果删除后没有海报了，可以选择性地关闭开关
      // if (updatedPosters.length === 0) {
      //   setEnablePoster(false)
      // }
      
      message.success('海报删除成功')
      console.log('海报删除完成')
    } catch (error) {
      console.error('删除海报失败:', error)
      message.error(`海报删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handlePreview = (posterUrl: string) => {
    setPreviewImage(posterUrl)
    setPreviewVisible(true)
  }

  const uploadProps: UploadProps = {
    accept: 'image/*',
    beforeUpload: handleUpload,
    disabled: uploading || !enablePoster || posters.length >= 1,
    showUploadList: false,
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="section">
      <div className="section-title">
        <PictureOutlined />
        背景海报上传 ({posters.length}/1)
      </div>

      <div className="section-content">
        <Card size="small" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Switch 
                checked={enablePoster}
                onChange={setEnablePoster}
                style={{ marginRight: '8px' }}
              />
              <span>启用背景海报 (选填)</span>
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>
              开启后可上传1张背景海报图片
            </span>
          </div>
        </Card>

        {enablePoster && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Upload {...uploadProps}>
                <Button 
                  icon={<PictureOutlined />} 
                  loading={uploading} 
                  disabled={!enablePoster || posters.length >= 1}
                >
                  {posters.length >= 1 ? '已上传海报' : '选择海报图片'}
                </Button>
              </Upload>
              {posters.length >= 1 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>💡 要更换海报，请先删除当前海报</span>
                </div>
              )}
            </div>

            {uploading && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fafafa',
                borderRadius: '6px'
              }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
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
                  status="active"
                  format={(percent) => `${percent?.toFixed(1)}%`}
                />
                {uploadSpeed && (
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                    {uploadSpeed}
                  </div>
                )}
              </div>
            )}

            <div className="upload-list">
              {posters.map((poster) => (
                <div key={poster.id} className="upload-item">
                  <div className="upload-item-content">
                    <div className="upload-item-preview">
                      <img 
                        src={poster.url}
                        alt={poster.name}
                        style={{ 
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div className="upload-item-info">
                      <div className="upload-item-name">{poster.name}</div>
                      <div className="upload-item-meta">
                        <span>大小: {formatFileSize(poster.size)}</span>
                        {poster.width && poster.height && (
                          <span> • 尺寸: {poster.width}x{poster.height}</span>
                        )}
                        <span> • {new Date(poster.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="upload-item-actions">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(poster.url)}
                      title="预览"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(poster.id)}
                      title="删除"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Modal
          open={previewVisible}
          title="海报预览"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          style={{ top: 20 }}
        >
          <img
            alt="海报预览"
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            src={previewImage}
          />
        </Modal>
      </div>
    </div>
  )
}

export default PosterUpload
