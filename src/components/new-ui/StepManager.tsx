import React, { useState, useEffect } from 'react';
import { Button, Steps, message, Modal } from 'antd';
import { ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import ReactPlayer from 'react-player';
import ProjectConfig from './ProjectConfig';
import TemplateSelection from './TemplateSelection';
import ParamsPanel from './ParamsPanel';
import MaterialLibrary from './MaterialLibrary';
import { Template, TitleConfig, SubtitleConfig } from '../../types';
import { saveProject, startGeneration, getGenerationStatus } from '../../services/api';

const { Step } = Steps;

interface StepManagerProps {
  // 项目配置相关
  projectName: string;
  setProjectName: (name: string) => void;
  generateCount: number;
  setGenerateCount: (count: number) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  playbackSpeed?: number;
  setPlaybackSpeed?: (speed: number) => void;
  baseScript: string;
  setBaseScript: (script: string) => void;
  
  // 模板相关
  selectedTemplate: Template;
  onTemplateSelect: (template: Template) => void;
  customTemplates: Template[];
  onSaveTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
  
  // 样式配置相关
  styleConfig: {
    title: TitleConfig;
    subtitle: SubtitleConfig;
  };
  setStyleConfig: (config: any) => void;
  
  // 素材相关
  selectedMaterials: {
    videos: string[];
    audios: string[];
    posters: string[];
  };
  onMaterialSelect: (type: string, materialId: string, isSelected: boolean) => void;
  allMaterials?: {
    videos: any[];
    audios: any[];
    posters: any[];
  };
  onMaterialsChange?: (materials: { videos: any[]; audios: any[]; posters: any[] }) => void;
  
  // 文案相关
  scripts: any[];
  setScripts: (scripts: any[]) => void;
  
  // 生成相关
  onGenerate: () => void;
  generating: boolean;
  
  // 历史记录相关
  onAddToHistory?: (project: any, task: any) => void;
}

const StepManager: React.FC<StepManagerProps> = ({
  projectName,
  setProjectName,
  generateCount,
  setGenerateCount,
  videoDuration,
  setVideoDuration,
  playbackSpeed = 1.0,
  setPlaybackSpeed = () => {},
  baseScript,
  setBaseScript,
  selectedTemplate,
  onTemplateSelect,
  customTemplates,
  onSaveTemplate,
  onDeleteTemplate,
  styleConfig,
  setStyleConfig,
  selectedMaterials,
  onMaterialSelect,
  allMaterials,
  onMaterialsChange,
  scripts: externalScripts,
  setScripts: setExternalScripts,
  onGenerate,
  generating,
  onAddToHistory
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scripts, setScripts] = useState<any[]>(externalScripts || []);
  const [showParamsPanel, setShowParamsPanel] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string>('');
  const [totalGenerationTime, setTotalGenerationTime] = useState<number>(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  const steps = [
    {
      title: '模板配置',
      description: '选择模板和样式',
    },
    {
      title: '素材选择与生成',
      description: '选择素材并生成视频',
    },
    {
      title: '预览下载',
      description: '预览生成的视频并下载',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 获取完整素材数据的辅助函数
  const getMaterialData = async (type: string, ids: string[]) => {
    try {
      if (!allMaterials) {
        console.error('素材数据不可用');
        return [];
      }

      const materialMap = {
        videos: allMaterials.videos,
        audios: allMaterials.audios,
        posters: allMaterials.posters
      };

      const materials = materialMap[type as keyof typeof materialMap] || [];
      
      return ids.map(id => {
        // 从真实素材数据中查找对应的素材
        const material = materials.find(m => m.id === id);
        if (material) {
          // 使用真实的素材数据
          return {
            id: material.id,
            name: material.name,
            url: material.url,
            size: material.size || 0,
            duration: material.duration || 0,
            uploadedAt: material.uploadedAt || new Date().toISOString(),
            thumbnail: material.thumbnail || null
          };
        } else {
          console.warn(`未找到素材: ${type} - ${id}`);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('获取素材数据失败:', error);
      return [];
    }
  };

  // 生成视频并进入第三步
  const handleGenerateAndNext = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedVideos([]);
    setTotalGenerationTime(0);
    setGenerationStartTime(Date.now());
    
    try {
      // 1. 保存项目配置
      const selectedScripts = scripts.filter(s => s.selected);
      
      // 获取完整的素材数据
      const [videos, audios, posters] = await Promise.all([
        getMaterialData('videos', selectedMaterials.videos),
        getMaterialData('audios', selectedMaterials.audios),
        getMaterialData('posters', selectedMaterials.posters)
      ]);

      let style = localStorage.getItem(`videoConfig_${selectedTemplate.id}`)
      style = JSON.parse(style);
      // 构建符合ClipRequest接口的数据结构
      const project = {
        name: projectName,
        videos,
        audios,
        posters,
        scripts: selectedScripts.map(script => ({
          ...script,
          generatedAt: script.generatedAt instanceof Date ? script.generatedAt.toISOString() : script.generatedAt
        })),
        duration: videoDuration.toString(), // 后端期望字符串类型
        playbackSpeed: playbackSpeed.toString(), // 倍速
        videoCount: generateCount,
        voice: 'default' as const,
        // style: styleConfig,
        style: style
      };
      
      const savedProject = await saveProject(project);
      console.log('✅ 项目配置已保存:', savedProject);

      // 2. 启动生成任务
      const task = await startGeneration(savedProject.id);
      setCurrentTask(task);
      console.log('✅ 视频生成任务已启动:', task);
      
      // 3. 进入第三步
      setCurrentStep(2);
      
      // 4. 开始轮询任务状态
      startPolling(task.id);
      
      message.success('视频生成任务已启动，请稍候...');
      
    } catch (error) {
      console.error('生成视频失败:', error);
      console.error('错误详情:', {
        projectName,
        selectedMaterials,
        scripts: scripts.filter(s => s.selected),
        videoDuration,
        generateCount,
        styleConfig
      });
      
      // 显示更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`启动生成失败: ${errorMessage}`);
      
      // 如果生成失败，返回第二步
      setCurrentStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  // 开始轮询任务状态
  const startPolling = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const task = await getGenerationStatus(taskId);
        console.log('📊 任务状态更新:', task);
        
        // 更新进度
        if (task.progress !== undefined) {
          setGenerationProgress(task.progress);
        }
        
        // 如果有视频结果，开始渲染页面（检查两个可能的位置）
        if (task.result?.videos || task.videos) {
          // 检查是否有新视频生成完成
          const newVideos = task.result?.videos || task.videos || [];
          setGeneratedVideos(prevVideos => {
            // 合并新视频，避免重复
            const existingIds = new Set(prevVideos.map(v => v.id));
            const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
            
            if (uniqueNewVideos.length > 0) {
              // 仅更新已完成视频列表，不逐条弹出成功提示
            }
            
            return [...prevVideos, ...uniqueNewVideos];
          });
          
          // 如果同时满足任务完成且有视频结果，则停止渲染页面
          if (task.status === 'completed') {
            setGenerationProgress(100);
            clearInterval(interval);
            setPollingInterval(null);
            
            // 检查是否所有视频都完成了
            const totalVideos = scripts.filter(s => s.selected).length;
            if (newVideos.length >= totalVideos) {
              message.success('视频生成完成！');
              
              // 添加到历史记录
              if (onAddToHistory) {
                const projectConfig = {
                  name: projectName,
                  videoCount: generateCount,
                  duration: videoDuration,
                  baseScript: baseScript,
                  selectedTemplate: selectedTemplate,
                  styleConfig: styleConfig,
                  selectedMaterials: selectedMaterials
                };
                onAddToHistory(projectConfig, task);
              }
            }
          }
        } else if (task.status === 'completed') {
          // 任务完成但没有视频结果的情况
          setGenerationProgress(100);
          clearInterval(interval);
          setPollingInterval(null);
        }
        
        // 如果任务失败
        if (task.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          message.error('视频生成失败: ' + (task.error || '未知错误'));
          setCurrentStep(1); // 返回第二步
        }
        
      } catch (error) {
        console.error('轮询任务状态失败:', error);
      }
    }, 2000); // 每2秒轮询一次
    
    setPollingInterval(interval);
  };

  // 格式化时间为HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // 更新总耗时
  useEffect(() => {
    if (!generationStartTime) return;

    const interval = setInterval(() => {
      if (generationProgress < 100) {
        const elapsedSeconds = Math.floor((Date.now() - generationStartTime) / 1000);
        setTotalGenerationTime(elapsedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [generationStartTime, generationProgress]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <ProjectConfig
              projectName={projectName}
              setProjectName={setProjectName}
              videoCount={generateCount}
              setVideoCount={setGenerateCount}
              videoDuration={videoDuration}
              setVideoDuration={setVideoDuration}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              content={baseScript}
              setContent={setBaseScript}
              onAIGenerate={() => {}}
              scripts={scripts}
              setScripts={(newScripts) => {
                setScripts(newScripts);
                if (setExternalScripts) {
                  setExternalScripts(newScripts);
                }
              }}
            />
            
            <TemplateSelection
              selectedTemplate={selectedTemplate}
              onTemplateSelect={onTemplateSelect}
              customTemplates={customTemplates}
              onSaveTemplate={onSaveTemplate}
              onDeleteTemplate={onDeleteTemplate}
              currentStyleConfig={styleConfig}
              onShowParamsPanel={() => setShowParamsPanel(true)}
              onParamsChange={() => {}}
            />
            
            <ParamsPanel
              visible={showParamsPanel}
              onClose={() => setShowParamsPanel(false)}
              template={selectedTemplate}
              style={styleConfig}
              onStyleChange={setStyleConfig}
            />
          </div>
        );
      
      case 1:
        return (
          <div className="step-content">
            <MaterialLibrary
              selectedMaterials={selectedMaterials}
              onMaterialSelect={onMaterialSelect}
              currentStyleConfig={styleConfig}
              onMaterialsChange={onMaterialsChange}
            />
          </div>
        );
      
      case 2:
        return (
          <div className="step-content">
            <div className="video-preview-section">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
                📹 视频生成进度
              </h3>
              
              {/* 总耗时统计 */}
              {generationStartTime && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  backgroundColor: '#f0f5ff',
                  border: '1px solid #d6e4ff',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '500',
                    color: '#1d39c4'
                  }}>
                    🕒 总耗时: {formatTime(totalGenerationTime)}
                  </div>
                </div>
              )}

              {/* 进度条 */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    生成进度: {generationProgress}%
                  </span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {generatedVideos.length} / {scripts.filter(s => s.selected).length} 个视频
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${generationProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* 生成的视频列表 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                {generatedVideos.map((video, index) => (
                  <div key={video.id} style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* 完成状态指示器 */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#52c41a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                    }}>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                    </div>

                    {/* 视频信息 */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#262626',
                        lineHeight: '1.4'
                      }}>
                        {video.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', lineHeight: '1.5' }}>
                        <div>生成时间: {video.createdAt ? new Date(video.createdAt).toLocaleString() : '刚刚'}</div>
                        {video.duration && (
                          <div>视频时长: {Math.round(video.duration)}秒</div>
                        )}
                        {video.processing_time && (
                          <div className="result-meta" style={{ color: '#1890ff', fontWeight: '500' }}>
                            耗时: {formatDuration(video.processing_time)}
                          </div>
                        )}
                        {video.size && (
                          <div>文件大小: {(video.size / 1024 / 1024).toFixed(1)}MB</div>
                        )}
                      </div>
                    </div>
                    
                    {/* 视频预览区域 */}
                    <div style={{
                      width: '100%',
                      height: '140px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      border: '1px solid #e8e8e8',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => {
                      if (video.url) {
                        window.open(video.url, '_blank');
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1890ff';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                          <div style={{ color: '#8c8c8c', fontSize: '14px', fontWeight: '500' }}>
                            点击预览视频
                          </div>
                        </div>
                      )}
                      
                      {/* 播放按钮覆盖层 */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8,
                        transition: 'all 0.3s ease'
                      }}>
                        <span style={{ color: 'white', fontSize: '20px', marginLeft: '4px' }}>▶</span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px',
                      justifyContent: 'center'
                    }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (video.url) {
                            setPreviewVideo(video.url);
                            setPreviewVisible(true);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          border: '1px solid #1890ff',
                          borderRadius: '6px',
                          backgroundColor: '#1890ff',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#40a9ff';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(24, 144, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1890ff';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.2)';
                        }}
                      >
                        📺 预览
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (video.url) {
                            const link = document.createElement('a');
                            link.href = video.url;
                            link.download = `${video.name}.mp4`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          border: '1px solid #52c41a',
                          borderRadius: '6px',
                          backgroundColor: '#52c41a',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(82, 196, 26, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#73d13d';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(82, 196, 26, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#52c41a';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(82, 196, 26, 0.2)';
                        }}
                      >
                        📥 下载
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 完成状态 */}
              {generationProgress === 100 && generatedVideos.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                  <h3 style={{ margin: 0, color: '#52c41a', fontSize: '16px' }}>
                    所有视频生成完成！
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                    共生成 {generatedVideos.length} 个视频，您可以预览和下载
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="step-manager">
      <div className="step-header">
        <Steps current={currentStep} size="small">
          {steps.map((item, index) => (
            <Step key={index} title={item.title} description={item.description} />
          ))}
        </Steps>
      </div>
      
      <div className="step-body">
        {renderStepContent()}
      </div>
      
      <div className="step-footer">
        <div className="step-actions">
          {currentStep > 0 && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handlePrev}
              style={{ marginRight: '16px' }}
            >
              上一步
            </Button>
          )}
          
          {currentStep === 1 && (
            <Button
              type="primary"
              loading={isGenerating}
              onClick={handleGenerateAndNext}
              disabled={selectedMaterials.videos.length === 0 || selectedMaterials.audios.length === 0 || scripts.filter(s => s.selected).length === 0}
              style={{ 
                marginRight: '16px',
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                borderColor: '#52c41a',
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                fontWeight: '600'
              }}
            >
              {isGenerating ? '生成中...' : '🎬 生成视频'}
            </Button>
          )}
          
          {currentStep < steps.length - 1 && currentStep !== 1 && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleNext}
              style={{ 
                width: '120px', // 增加宽度
                height: '40px'  // 增加高度
              }}
            >
              下一步
            </Button>
          )}
          
          {currentStep === 2 && generationProgress === 100 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                onClick={() => {
                  generatedVideos.forEach((video, index) => {
                    setTimeout(() => {
                      if (video.url) {
                        const link = document.createElement('a');
                        link.href = video.url;
                        link.download = `${video.name}.mp4`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }, index * 500); // 每个文件延迟500ms下载
                  });
                  message.success('开始批量下载...');
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                  borderColor: 'transparent'
                }}
              >
                📥 批量下载
              </Button>
              <Button
                onClick={() => setCurrentStep(0)}
                style={{ 
                  borderColor: '#52c41a',
                  color: '#52c41a'
                }}
              >
                🔧 查看原配置
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setGeneratedVideos([]);
                  setGenerationProgress(0);
                }}
                style={{ 
                  borderColor: '#faad14',
                  color: '#faad14'
                }}
              >
                🔄 重新生成
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setCurrentStep(0);
                  setGeneratedVideos([]);
                  setGenerationProgress(0);
                  setScripts([]);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  borderColor: 'transparent'
                }}
              >
                ✨ 新创作
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 视频预览模态框 */}
      <Modal
        title="视频预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <ReactPlayer
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous",
                preload: "metadata"
              }
            }
          }}
          url={previewVideo}
          controls
          width="100%"
          height="400px"
        />
      </Modal>
    </div>
  );
};

export default StepManager;
