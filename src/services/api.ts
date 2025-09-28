import axios from 'axios'
import type { 
  VideoFile, 
  AudioFile, 
  PosterFile,
  Script, 
  ProjectConfig, 
  GenerationTask,
  ApiResponse
} from '../types'

// 动态获取API基础URL
const getApiBaseUrl = () => {
  // 优先使用环境变量
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL
  }

  // 如果没有配置环境变量，根据当前主机动态生成
  const currentHost = window.location.hostname
  const port = '9999'
  const protocol = window.location.protocol

  return 'http://39.96.187.7:9999'
  // return `${protocol}//${currentHost}:${port}`
}

const api = axios.create({
  baseURL: getApiBaseUrl() + '/api',
  timeout: 1200000,
})

// 文件上传
export const uploadVideo = async (file: File): Promise<VideoFile> => {
  const formData = new FormData()
  formData.append('video', file)
  
  const response = await api.post<ApiResponse<VideoFile>>('/upload/video', formData)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '上传失败')
  }
  
  const video = response.data.data!
  // 修正 uploadedAt 字段类型
  return {
    ...video,
    uploadedAt: new Date(video.uploadedAt)
  };
}

// 获取上传进度
export const getUploadProgress = async (taskId: string) => {
  try {
    console.log('发送进度查询请求，URL:', `/upload/progress/${taskId}`)
    console.log('完整URL:', `${api.defaults.baseURL}/upload/progress/${taskId}`)
    const response = await api.get(`/upload/progress/${taskId}`)
    console.log('进度查询响应:', response.data)
    return response.data
  } catch (error: any) {
    console.error('getUploadProgress API调用失败:', error)
    console.error('请求配置:', error.config)
    console.error('响应状态:', error.response?.status)
    console.error('响应数据:', error.response?.data)
    throw error
  }
}

// 简化版本的文件上传 - 重写进度条逻辑
export const uploadVideoWithProgress = async (
  file: File, 
  onProgress?: (progress: number, loaded: number, total: number, speed?: string) => void
): Promise<VideoFile> => {
  const formData = new FormData()
  formData.append('video', file)
  
  console.log('开始上传文件:', file.name)
  
  if (onProgress) {
    onProgress(0, 0, file.size, "开始上传...")
  }

  try {
    // 使用模拟进度的方式，避免复杂的轮询逻辑
    let currentProgress = 0
    let progressInterval: number | null = null
    let isUploadComplete = false
    let startTime = Date.now()
    let lastUpdateTime = startTime
    let lastLoaded = 0
    
    // 计算实时上传速度
    const calculateSpeed = (loaded: number): string => {
      const currentTime = Date.now()
      const timeDiff = (currentTime - lastUpdateTime) / 1000 // 转换为秒
      const dataDiff = loaded - lastLoaded
      
      if (timeDiff <= 0 || dataDiff <= 0) {
        // 基于文件大小和网络状况生成合理的模拟速度
        const baseSpeed = file.size > 100 * 1024 * 1024 ? 2.5 : 4.0 // 大文件速度慢
        const fluctuation = 0.7 + Math.random() * 0.6 // 0.7-1.3倍波动
        return `${(baseSpeed * fluctuation).toFixed(1)} MB/s`
      }
      
      lastUpdateTime = currentTime
      lastLoaded = loaded
      
      const speedBytesPerSecond = dataDiff / timeDiff
      const speedMBPerSecond = speedBytesPerSecond / (1024 * 1024)
      
      // 添加一些波动让速度看起来更真实
      const fluctuation = 0.8 + Math.random() * 0.4 // 0.8-1.2倍波动
      const realSpeed = Math.max(0.1, speedMBPerSecond * fluctuation)
      
      return `${realSpeed.toFixed(1)} MB/s`
    }

    // 启动模拟进度更新
    const startProgressSimulation = () => {
      if (progressInterval) return
      
      progressInterval = setInterval(() => {
        if (isUploadComplete || currentProgress >= 95) {
          return // 不超过95%，等待真实完成
        }
        
        // 根据文件大小调整进度速度
        const increment = file.size > 100 * 1024 * 1024 ? 2 : 5 // 大文件慢一点
        currentProgress = Math.min(95, currentProgress + increment)
        
        if (onProgress) {
          const currentLoaded = (currentProgress / 100) * file.size
          const speed = calculateSpeed(currentLoaded)
          onProgress(currentProgress, currentLoaded, file.size, speed)
        }
      }, 500) // 每500ms更新一次，提升流畅度
    }
    
    // 开始上传请求
    const uploadPromise = api.post<ApiResponse<VideoFile>>('/upload/video', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const httpProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          
          if (httpProgress < 100) {
            // HTTP传输阶段：0-15%
            const displayProgress = Math.min(15, httpProgress * 0.15)
            onProgress(displayProgress, progressEvent.loaded, file.size, "传输到服务器...")
            currentProgress = displayProgress
          } else {
            // HTTP传输完成，开始模拟OSS上传进度
            if (currentProgress < 20) {
              currentProgress = 20
              if (onProgress) {
                onProgress(20, file.size * 0.2, file.size, "开始上传到云端...")
              }
            }
            // 启动模拟进度
            startProgressSimulation()
          }
        }
      }
    })

    // 等待上传完成
    const response = await uploadPromise
    
    // 清理进度模拟
    isUploadComplete = true
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    
    console.log('上传完成，响应:', response.data)

    if (!response.data.success) {
      throw new Error(response.data.error || '上传失败')
    }

    // 显示100%完成
    if (onProgress) {
      onProgress(100, file.size, file.size, "上传完成")
    }

    const video = response.data.data!
    return {
      ...video,
      uploadedAt: new Date(video.uploadedAt)
    }
    
  } catch (error) {
    console.error('上传失败:', error)
    throw error
  }
}

export const uploadAudio = async (file: File): Promise<AudioFile> => {
  const formData = new FormData()
  formData.append('audio', file)
  
  const response = await api.post<ApiResponse<AudioFile>>('/upload/audio', formData)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '上传失败')
  }
  
  return response.data.data!
}

// 简化版音频上传
export const uploadAudioWithProgress = async (
  file: File, 
  onProgress?: (progress: number, loaded: number, total: number, speed?: string) => void
): Promise<AudioFile> => {
  const formData = new FormData()
  formData.append('audio', file)
  
  console.log('开始上传音频文件:', file.name)
  
  if (onProgress) {
    onProgress(0, 0, file.size, "开始上传...")
  }

  try {
    // 简化的模拟进度逻辑
    let currentProgress = 0
    let progressInterval: number | null = null
    let isUploadComplete = false
    let startTime = Date.now()
    let lastUpdateTime = startTime
    let lastLoaded = 0
    
    // 计算音频上传速度
    const calculateAudioSpeed = (loaded: number): string => {
      const currentTime = Date.now()
      const timeDiff = (currentTime - lastUpdateTime) / 1000
      const dataDiff = loaded - lastLoaded
      
      if (timeDiff <= 0 || dataDiff <= 0) {
        // 音频文件通常上传速度比视频快
        const baseSpeed = file.size > 50 * 1024 * 1024 ? 3.0 : 5.0
        const fluctuation = 0.8 + Math.random() * 0.5 // 0.8-1.3倍波动
        return `${(baseSpeed * fluctuation).toFixed(1)} MB/s`
      }
      
      lastUpdateTime = currentTime
      lastLoaded = loaded
      
      const speedBytesPerSecond = dataDiff / timeDiff
      const speedMBPerSecond = speedBytesPerSecond / (1024 * 1024)
      
      // 音频上传速度波动
      const fluctuation = 0.9 + Math.random() * 0.3 // 0.9-1.2倍波动
      const realSpeed = Math.max(0.2, speedMBPerSecond * fluctuation)
      
      return `${realSpeed.toFixed(1)} MB/s`
    }

    const startProgressSimulation = () => {
      if (progressInterval) return
      
      progressInterval = setInterval(() => {
        if (isUploadComplete || currentProgress >= 95) {
          return
        }
        
        // 音频文件通常较小，进度更快一些
        const increment = file.size > 50 * 1024 * 1024 ? 3 : 8
        currentProgress = Math.min(95, currentProgress + increment)
        
        if (onProgress) {
          const currentLoaded = (currentProgress / 100) * file.size
          const speed = calculateAudioSpeed(currentLoaded)
          onProgress(currentProgress, currentLoaded, file.size, speed)
        }
      }, 400) // 音频上传更快，更频繁更新
    }
    
    // 启动上传请求
    const uploadPromise = api.post<ApiResponse<AudioFile>>('/upload/audio', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const httpProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          
          if (httpProgress < 100) {
            // HTTP传输阶段：0-15%
            const displayProgress = Math.min(15, httpProgress * 0.15)
            onProgress(displayProgress, progressEvent.loaded, file.size, "传输到服务器...")
            currentProgress = displayProgress
          } else {
            // HTTP传输完成，开始模拟OSS上传进度
            if (currentProgress < 20) {
              currentProgress = 20
              if (onProgress) {
                onProgress(20, file.size * 0.2, file.size, "开始上传到云端...")
              }
            }
            startProgressSimulation()
          }
        }
      }
    })

    // 等待上传完成
    const response = await uploadPromise
    
    // 清理进度模拟
    isUploadComplete = true
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    
    console.log('音频上传完成，响应:', response.data)

    if (!response.data.success) {
      throw new Error(response.data.error || '音频上传失败')
    }

    // 显示100%完成
    if (onProgress) {
      onProgress(100, file.size, file.size, "上传完成")
    }

    const audio = response.data.data!
    return {
      ...audio,
      uploadedAt: new Date(audio.uploadedAt)
    }
    
  } catch (error) {
    console.error('音频上传失败:', error)
    throw error
  }
}

// 海报上传
export const uploadPoster = async (file: File): Promise<PosterFile> => {
  const formData = new FormData()
  formData.append('poster', file)

  const response = await api.post<ApiResponse<PosterFile>>('/upload/poster', formData)

  if (!response.data.success) {
    throw new Error(response.data.error || '上传失败')
  }

  return response.data.data!
}

// 带进度监控的海报上传
export const uploadPosterWithProgress = async (
  file: File,
  onProgress?: (progress: number, loaded: number, total: number, speed?: string) => void
): Promise<PosterFile> => {
  const formData = new FormData()
  formData.append('poster', file)

  console.log('开始上传海报文件:', file.name)

  const response = await api.post<ApiResponse<PosterFile>>('/upload/poster', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress, progressEvent.loaded, progressEvent.total, "上传中...")
      }
    }
  })

  if (!response.data.success) {
    throw new Error(response.data.error || '上传失败')
  }

  console.log('海报上传完成')
  return response.data.data!
}

// 删除海报
export const deletePoster = async (posterId: string): Promise<void> => {
  const response = await api.delete<ApiResponse>(`/upload/poster/${posterId}`)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '删除失败')
  }
}

// AI文案生成
export const generateScripts = async (
  base_script: string,
  video_duration: number,
  video_count: number,
  playbackSpeed: number = 1.0,
  voiceType: string = 'female'
): Promise<Script[]> => {
  // 将视频时长乘以播放速度
  const adjustedDuration = video_duration * playbackSpeed;
  
  // 🚀 调试日志 - 检查API接收到的参数
  console.log('🔥 generateScripts API调用参数:', {
    base_script,
    video_duration: adjustedDuration,
    video_count,
    voice_type: voiceType
  });
  
  const response = await api.post<ApiResponse<Script[]>>('/ai/generate-scripts', {
    base_script,
    video_duration: adjustedDuration, // 传递调整后的时长
    video_count,
    voice_type: voiceType, // 添加语音类型参数
  })
  
  if (!response.data.success) {
    throw new Error(response.data.error || '生成失败')
  }
  
  return response.data.data!
}

// 项目配置
export const saveProject = async (
  config: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>, 
  voiceType?: string
): Promise<ProjectConfig> => {
  // 如果字幕位置选择了竖屏模板，则附带 portraitMode=true，后端据此避免模糊背景
  const body: any = { ...config }
  
  // 🚀 将voiceType赋值给voice字段
  if (voiceType) {
    body.voice = voiceType;
    console.log('🎙️ saveProject: 设置voice字段为:', voiceType);
  }
  
  try {
    const pos = config?.style?.subtitle?.position as any
    if (pos === 'template2') {
      body.portraitMode = true
    }
  } catch {}
  
  console.log('🚀 saveProject请求体:', body);
  
  const response = await api.post<ApiResponse<ProjectConfig>>('/projects', body)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '保存失败')
  }
  
  return response.data.data!
}

export const getProject = async (id: string): Promise<ProjectConfig> => {
  const response = await api.get<ApiResponse<ProjectConfig>>(`/projects/${id}`)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '获取失败')
  }
  
  return response.data.data!
}

// 视频生成
export const startGeneration = async (projectId: string): Promise<GenerationTask> => {
  console.log('🚀 发起视频生成请求:', projectId)
  
  const response = await api.post<ApiResponse<GenerationTask>>('/generation/start', {
    projectId,
  })
  
  if (!response.data.success) {
    throw new Error(response.data.error || '启动失败')
  }
  
  const task = response.data.data!
  console.log('✅ 视频生成任务已创建:', task)
  console.log('   任务状态:', task.status)
  console.log('   队列位置:', task.queuePosition)
  console.log('   预计等待:', task.estimatedWaitTime)
  
  return task
}

export const getGenerationStatus = async (taskId: string): Promise<GenerationTask> => {
  const response = await api.get<ApiResponse<GenerationTask>>(`/generation/status/${taskId}`)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '获取状态失败')
  }
  
  const task = response.data.data!
  
  // 🚀 调试日志 - 检查返回的状态
  console.log('📊 获取任务状态:', {
    taskId: task.id,
    status: task.status,
    progress: task.progress,
    queuePosition: task.queuePosition,
    queueSize: task.queueSize,
    estimatedWaitTime: task.estimatedWaitTime,
    message: task.message
  })
  
  return task
}

// 🚀 新增：获取队列状态
export const getQueueStatus = async () => {
  const response = await api.get<ApiResponse<any>>('/generation/queue/status')
  
  if (!response.data.success) {
    throw new Error(response.data.error || '获取队列状态失败')
  }
  
  return response.data.data!
}

// 文件删除
export const deleteVideo = async (id: string, url?: string): Promise<void> => {
  const params = url ? { file_url: url } : {}
  const response = await api.delete<ApiResponse<void>>(`/videos/${id}`, { params })
  
  if (!response.data.success) {
    throw new Error(response.data.error || '删除失败')
  }
}

export const deleteAudio = async (id: string, url?: string): Promise<void> => {
  const params = url ? { file_url: url } : {}
  const response = await api.delete<ApiResponse<void>>(`/audios/${id}`, { params })
  
  if (!response.data.success) {
    throw new Error(response.data.error || '删除失败')
  }
}

// 测试删除接口
export const testDelete = async (id: string): Promise<void> => {
  console.log('调用测试删除接口:', id)
  const response = await api.delete<ApiResponse<void>>(`/test/delete/${id}`)
  console.log('测试删除响应:', response.data)
  
  if (!response.data.success) {
    throw new Error(response.data.error || '测试删除失败')
  }
}

export default api