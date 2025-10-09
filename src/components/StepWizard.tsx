import React, { useState } from 'react'
import { Steps, Card, Button, Space } from 'antd'
import '../styles/StepWizard.css'
import { 
  UploadOutlined, 
  FileTextOutlined, 
  SettingOutlined, 
  PlayCircleOutlined,
  UserOutlined 
} from '@ant-design/icons'
import type { 
  VideoFile, 
  AudioFile, 
  PosterFile,
  Script, 
  DurationOption,
  VoiceOption,
  StyleConfig 
} from '../types'
import VideoUpload from './VideoUpload'
import AudioUpload from './AudioUpload'
import PosterUpload from './PosterUpload'
import ScriptConfig from './ScriptConfig'
import ConfigSettings from './ConfigSettings'

interface StepWizardProps {
  projectName: string
  setProjectName: (name: string) => void
  videos: VideoFile[]
  setVideos: (videos: VideoFile[]) => void
  audios: AudioFile[]
  setAudios: (audios: AudioFile[]) => void
  posters: PosterFile[]
  setPosters: (posters: PosterFile[]) => void
  scripts: Script[]
  setScripts: (scripts: Script[]) => void
  baseScript: string
  setBaseScript: (script: string) => void
  duration: DurationOption
  setDuration: (duration: DurationOption) => void
  videoCount: number
  setVideoCount: (count: number) => void
  voice: VoiceOption
  setVoice: (voice: VoiceOption) => void
  style: StyleConfig
  setStyle: (style: StyleConfig) => void
  onGenerate: () => void
  generating: boolean
}

const StepWizard: React.FC<StepWizardProps> = ({
  projectName,
  setProjectName,
  videos,
  setVideos,
  audios,
  setAudios,
  posters,
  setPosters,
  scripts,
  setScripts,
  baseScript,
  setBaseScript,
  duration,
  setDuration,
  videoCount,
  setVideoCount,
  voice,
  setVoice,
  style,
  setStyle,
  onGenerate,
  generating
}) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: '项目配置',
      icon: <SettingOutlined />,
      content: 'project_config'
    },
    {
      title: 'AI文案与样式',
      icon: <FileTextOutlined />,
      content: 'script_style'
    },
    {
      title: '确认生成',
      icon: <PlayCircleOutlined />,
      content: 'generate'
    }
  ]

  // 验证当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 0: // 项目配置
        return projectName.trim().length > 0 && videos?.length || 0 > 0
      case 1: // AI文案与样式
        return scripts?.filter(s => s.selected).length || 0 > 0
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    const step = steps[currentStep]
    
    switch (step.content) {
      case 'project_config':
        return (
          <div className="step-content">
            <div className="step-section-wrapper">
              <div className="step-section-header">
                <span className="step-number">1</span>
                <h3 className="step-section-title">项目配置与素材上传</h3>
              </div>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {/* 项目基础配置 */}
                <Card 
                  title={
                    <div className="card-title-wrapper">
                      <div className="title-indicator"></div>
                      <span>项目基础配置</span>
                    </div>
                  } 
                  size="small"
                  className="upload-card"
                >
                  {(() => {
                    console.log('StepWizard - 传递给ConfigSettings的posters:', posters)
                    return (
                      <ConfigSettings
                        duration={duration}
                        setDuration={setDuration}
                        voice={voice}
                        setVoice={setVoice}
                        style={style}
                        setStyle={setStyle}
                        projectName={projectName}
                        setProjectName={setProjectName}
                        videoCount={videoCount}
                        setVideoCount={setVideoCount}
                        posters={posters}
                        setPosters={setPosters}
                      />
                    )
                  })()}
                </Card>

                {/* 素材上传 */}
                <Card 
                  title={
                    <div className="card-title-wrapper">
                      <div className="title-indicator"></div>
                      <span>视频素材</span>
                    </div>
                  } 
                  size="small"
                  className="upload-card"
                >
                  <VideoUpload 
                    videos={videos}
                    onVideosChange={setVideos}
                    maxCount={20}
                  />
                </Card>
                
                <Card 
                  title={
                    <div className="card-title-wrapper">
                      <div className="title-indicator"></div>
                      <span>背景音乐</span>
                    </div>
                  } 
                  size="small"
                  className="upload-card"
                >
                  <AudioUpload 
                    audios={audios}
                    onAudiosChange={setAudios}
                  />
                </Card>
                

              </Space>
            </div>
          </div>
        )
      
      case 'script_style':
        return (
          <div className="step-content">
            <div className="step-section-wrapper">
              <div className="step-section-header">
                <span className="step-number">2</span>
                <h3 className="step-section-title">AI文案生成与样式配置</h3>
              </div>
              <Card 
                title={
                  <div className="card-title-wrapper">
                    <div className="title-indicator"></div>
                    <span>AI文案生成</span>
                  </div>
                } 
                size="small"
                className="upload-card"
              >
                <ScriptConfig 
                  scripts={scripts}
                  onScriptsChange={setScripts}
                  baseScript={baseScript}
                  onBaseScriptChange={setBaseScript}
                  videoDuration={duration === '30s' ? 30 : duration === '60s' ? 60 : 90}
                  videoCount={videoCount}
                  onVideoCountChange={setVideoCount}
                  projectName={projectName}
                  onProjectNameChange={setProjectName}
                />
              </Card>
            </div>
          </div>
        )
      
      case 'generate':
        return (
          <div className="step-content">
            <div className="step-section-wrapper">
              <div className="step-section-header">
                <span className="step-number">3</span>
                <h3 className="step-section-title">确认生成</h3>
              </div>
              <Card 
                title={
                  <div className="card-title-wrapper">
                    <div className="title-indicator"></div>
                    <span>确认信息</span>
                  </div>
                } 
                size="small"
                className="upload-card"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div><strong>项目名称:</strong> {projectName}</div>
                  <div><strong>视频时长:</strong> {duration}</div>
                  <div><strong>生成数量:</strong> {videoCount} 个</div>
                  <div><strong>配音类型:</strong> {voice === 'male' ? '男声' : '女声'}</div>
                  <div><strong>视频素材:</strong> {videos?.length || 0} 个</div>
                  <div><strong>音频素材:</strong> {audios?.length || 0} 个</div>
                  <div><strong>海报素材:</strong> {posters?.length || 0} 个</div>
                  <div><strong>选中文案:</strong> {scripts?.filter(s => s.selected).length || 0} 个</div>
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 500, color: '#52c41a', marginBottom: '4px' }}>准备就绪</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      所有配置已完成，点击下方按钮开始生成视频
                    </div>
                  </div>
                </Space>
              </Card>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="step-wizard">
      <div className="modern-steps">
        {steps.map((step, index) => (
          <div key={index} className={`step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}>
            <div className="step-indicator">
              <div className="step-number">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">
                  {index === 0 && '项目设置与素材上传'}
                  {index === 1 && 'AI文案生成与样式配置'}
                  {index === 2 && '确认配置并生成视频'}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${index < currentStep ? 'completed' : ''}`}>
                <div className="connector-line"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="step-content-wrapper">
        {renderStepContent()}
      </div>
      
      <div className="step-actions" style={{ marginTop: 24, textAlign: 'center' }}>
        <Space>
          <Button 
            onClick={prevStep} 
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button 
              type="primary" 
              onClick={nextStep}
              disabled={!canProceed()}
            >
              下一步
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={onGenerate}
              loading={generating}
              disabled={!canProceed() || generating}
              size="large"
            >
              开始生成视频
            </Button>
          )}
        </Space>
      </div>
    </div>
  )
}

export default StepWizard
