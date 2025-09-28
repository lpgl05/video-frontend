import React, { useState } from 'react'
import { Upload, Button, message, Modal, Progress } from 'antd'
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload/interface'
import type { AudioFile } from '../types'
import { uploadAudio, uploadAudioWithProgress, deleteAudio } from '../services/api'

interface AudioUploadProps {
  audios: AudioFile[]
  onAudiosChange: (audios: AudioFile[]) => void
}

const AudioUpload: React.FC<AudioUploadProps> = ({ audios, onAudiosChange }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [uploadSpeed, setUploadSpeed] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<string>('')

  const handleUpload = async (file: File, fileList: File[]) => {
    // 验证所有文件
    for (const f of fileList) {
      if (!f.type.startsWith('audio/')) {
        message.error(`文件"${f.name}"不是音频文件`)
        return false
      }
      if (f.size > 100 * 1024 * 1024) { // 100MB
        message.error(`文件"${f.name}"大小不能超过100MB`)
        return false
      }
    }

    // 只处理第一个文件，其他文件会在后续调用中处理
    if (file !== fileList[0]) {
      return false
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
      const uploadedAudios: AudioFile[] = []
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < fileList.length; i++) {
        const currentFile = fileList[i]
        setUploadingFileName(`正在上传: ${currentFile.name} (${i + 1}/${fileList.length})`)
        
        try {
          const audioFile = await uploadAudioWithProgress(currentFile, (progress, loaded, total, speed) => {
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
          
          uploadedAudios.push(audioFile)
          successCount++
          
        } catch (error) {
          console.error(`Upload error for ${currentFile.name}:`, error)
          failedCount++
        }
      }

      // 更新音频列表
      if (uploadedAudios.length > 0) {
        onAudiosChange([...audios, ...uploadedAudios])
      }

      // 显示结果消息
      if (failedCount === 0) {
        message.success(`成功上传 ${successCount} 个音频文件`)
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

  const handleDelete = async (audioId: string) => {
    try {
      // 找到要删除的音频，传递URL给后端
      const audioToDelete = audios.find(a => a.id === audioId)
      await deleteAudio(audioId, audioToDelete?.url)
      onAudiosChange(audios.filter(a => a.id !== audioId))
      message.success('音频删除成功')
    } catch (error) {
      message.error('音频删除失败')
      console.error('Delete error:', error)
    }
  }

  const handlePreview = (url: string) => {
    setPreviewAudio(url)
    setPreviewVisible(true)
  }

  const uploadProps: UploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    accept: 'audio/*',
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
        背景音乐上传 ({audios.length})
      </div>
      
      <div className="section-content">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploading}>
            选择音频文件（支持多选）
          </Button>
        </Upload>
        
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
          支持格式：MP3、WAV、AAC、FLAC、OGG、WMA、M4A等常见音频格式<br/>
          文件大小：单个文件不超过100MB
        </div>
        
        {uploading && (
          <div style={{ 
            marginTop: '16px', 
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
          {audios.map((audio) => (
            <div key={audio.id} className="upload-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>{audio.name}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {formatFileSize(audio.size)} • {formatDuration(audio.duration)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handlePreview(audio.url)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(audio.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title="音频预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <audio controls style={{ width: '100%' }}>
          <source src={previewAudio} type="audio/mpeg" />
          您的浏览器不支持音频播放
        </audio>
      </Modal>
    </div>
  )
}

export default AudioUpload 