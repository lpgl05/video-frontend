import React, { useState, useEffect } from 'react';
import { message, Input, Progress, Checkbox, Space, Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import StepManager from './StepManager';
import ParamsPanel from './ParamsPanel';
import { ProjectHistory } from '../../types';
import './NewVideoGenerator.css';

const { TextArea } = Input;

interface Template {
  id: string;
  name: string;
  type: 'system' | 'custom';
  preview: string;
  params: any;
  createdAt?: string;
}

interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  duration: number;
  size: number;
  createdAt: string;
}

const NewVideoGenerator: React.FC = () => {
  // 项目基础配置状态
  const [projectName, setProjectName] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}项目`;
  });
  const [videoCount, setVideoCount] = useState(3);
  const [videoDuration, setVideoDuration] = useState(30); // 默认30秒
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 默认1.0倍速
  const [voiceType, setVoiceType] = useState('female'); // 默认女声
  const [baseScript, setBaseScript] = useState('');
  const [content, setContent] = useState('');
  
  // 文案生成相关状态
  const [scripts, setScripts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);

  // 模板相关状态
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>({
    id: 'none',
    name: '不使用模板',
    type: 'system',
    preview: '',
    params: {
      titleStyle: 'default',
      fontSize: 20,
      fontColor: '#000000',
      voice: 'female',
      voiceSpeed: 1.0,
      bgm: 'none',
      duration: 30,
      resolution: '1920x1080',
      requirePoster: false,
      enableTitle: false,
      enableSubtitle: false
    }
  });
  const [templateParams, setTemplateParams] = useState<any>({});
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  // 素材选择状态
  const [selectedMaterials, setSelectedMaterials] = useState({
    videos: [] as string[],
    audios: [] as string[],
    posters: [] as string[]
  });

  // 所有素材数据状态
  const [allMaterials, setAllMaterials] = useState<{
    videos: any[];
    audios: any[];
    posters: any[];
  }>({
    videos: [],
    audios: [],
    posters: []
  });

  // 历史记录状态
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>([]);

  // 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('projectHistory');
    if (savedHistory) {
      try {
        setProjectHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse project history:', error);
      }
    }
  }, []);

  // 保存历史记录到本地存储
  const saveHistoryToStorage = (history: ProjectHistory[]) => {
    localStorage.setItem('projectHistory', JSON.stringify(history));
  };

  // 添加历史记录
  const addToHistory = (project: any, task: any) => {
    const historyItem: ProjectHistory = {
      id: task.id,
      name: project.name,
      status: task.status,
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.status === 'completed' ? task.updatedAt : undefined,
      videoCount: project.videoCount,
      duration: project.duration,
      videos: task.result?.videos || undefined,
      project,
      task
    };

    const newHistory = [historyItem, ...projectHistory.filter(h => h.id !== task.id)];
    setProjectHistory(newHistory);
    saveHistoryToStorage(newHistory);
  };

  // 生成相关状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);

  // 界面状态
  const [showParamsPanel, setShowParamsPanel] = useState(false);
  
  // 配置存储和读取函数
  const saveConfigToStorage = (config: any, key: string) => {
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const loadConfigFromStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error('Failed to load config:', error);
      return defaultValue;
    }
  };

  // 样式配置状态 - 分别存储两种模板的配置
  const [template1Config, setTemplate1Config] = useState<StyleConfig>(() => {
    // 模板一（横屏视频）默认配置
    const defaultConfig = {
      title: {
        position: 'top',
        alignment: 'center',
        spacing: 11,
        mainTitle: {
          text: '',
          fontSize: 0,
          color: '#ffffff',
          fontFamily: 'SourceHanSansCN-Heavy'
        },
        subTitle: {
          text: '',
          fontSize: 0,
          color: '#ffff00',
          fontFamily: 'SourceHanSansCN-Heavy'
        },
        background: {
          background_color: '#CEC970',
          background_opacity: 0
        }
      },
      subtitle: {
        color: '#ffffff',
        position: 'template1',
        fontSize: 60,
        fontFamily: 'SourceHanSansCN-Heavy',
        background: {
          background_color: '#FFFFFF',
          background_opacity: 0
        }
      }
    };
    
    return loadConfigFromStorage('template1Config', defaultConfig);
  });
  
  const [template2Config, setTemplate2Config] = useState<StyleConfig>(() => {
    // 从localStorage加载模板二的配置，如果没有则使用默认值
    const savedConfig = localStorage.getItem('template2');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig) as StyleConfig;
      } catch (error) {
        console.error('Failed to parse template2:', error);
      }
    }
    
    // 模板二（竖屏视频）默认配置
    return {
      title: {
        position: 'top',
        alignment: 'center',
        spacing: 11,
        mainTitle: {
          text: '',
          fontSize: 80,
          color: '#ffffff',
          fontFamily: 'SourceHanSansCN-Heavy'
        },
        subTitle: {
          text: '',
          fontSize: 80,
          color: '#ffff00',
          fontFamily: 'SourceHanSansCN-Heavy'
        },
        background: {
          background_color: '#CEC970',
          background_opacity: 0
        }
      },
      subtitle: {
        color: '#ffffff',
        position: 'template2' as 'template1', // 类型兼容处理
        fontSize: 80,
        fontFamily: 'SourceHanSansCN-Heavy',
        background: {
          background_color: '#FFFFFF',
          background_opacity: 0
        }
      }
    };
  });
  
  // 当前使用的样式配置，根据选择的模板动态切换
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(template1Config);

  // AI生成文案 - 按照老UI的逻辑
  const handleAIGenerate = async () => {
    if (!baseScript.trim()) {
      message.error('请输入基础文案');
      return;
    }

    setGenerating(true);
    setGenerateProgress(0);
    
    // 模拟进度条 - 线性增长
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setGenerateProgress(prev => {
        currentProgress = prev;
        if (currentProgress >= 90) {
          return Math.min(currentProgress + 0.5, 95);
        }
        const increment = Math.random() * 3 + 1;
        return Math.min(currentProgress + increment, 90);
      });
    }, 200);

    try {
      // 使用原来的API接口和逻辑
      const { generateScripts } = await import('../../services/api');
      
      // 调用原来的AI生成文案接口
      const result = await generateScripts(baseScript, 30, videoCount, 1.0, voiceType);
      
      // 清除进度模拟，设置为100%
      clearInterval(progressInterval);
      setGenerateProgress(100);
      
      // 兼容后端返回字符串数组的情况
      const generatedScripts = Array.isArray(result)
        ? result.map((content: string) => ({
            id: `script_${Date.now()}_${Math.random()}`,
            content,
            selected: true, // 默认选中所有生成的文案
            generatedAt: new Date(),
          }))
        : result.map((script: any) => ({
            ...script,
            selected: true // 如果是对象数组，也默认选中
          }));
      
      console.log('NewVideoGenerator生成的文案状态:', generatedScripts.map(s => ({ id: s.id, selected: s.selected })));
      
      setScripts(generatedScripts);
      message.success('文案生成成功');
    } catch (error) {
      clearInterval(progressInterval);
      setGenerateProgress(0);
      message.error('文案生成失败');
      console.error('Generate error:', error);
    } finally {
      setGenerating(false);
      
      // 稍微延迟重置进度条，让用户看到100%
      setTimeout(() => {
        setGenerateProgress(0);
      }, 1000);
    }
  };

  // 文案选择处理
  const handleScriptToggle = (scriptId: string) => {
    const updatedScripts = scripts.map(script => 
      script.id === scriptId 
        ? { ...script, selected: !script.selected }
        : script
    );
    setScripts(updatedScripts);
  };

  const handleSelectAll = () => {
    const updatedScripts = scripts.map(script => ({ ...script, selected: true }));
    setScripts(updatedScripts);
  };

  const handleDeselectAll = () => {
    const updatedScripts = scripts.map(script => ({ ...script, selected: false }));
    setScripts(updatedScripts);
  };

  // 模板选择处理
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    
    // 更新模板参数
    if (template.params) {
      setTemplateParams(template.params);
    }
    
    // 从localStorage加载对应模板的配置
    const savedConfig = localStorage.getItem(`videoConfig_${template.id}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.style) {
          setStyleConfig(parsedConfig.style);
          return;
        }
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
    
    // 如果没有保存的配置，则使用默认配置
    if (template.id === 'template1') {
      setStyleConfig(template1Config);
    } else if (template.id === 'template2') {
      setStyleConfig(template2Config);
    } else if (template.type === 'custom' && template.params?.styleConfig) {
      setStyleConfig(template.params.styleConfig);
    } else {
      setStyleConfig({
        ...template1Config,
        title: {
          ...template1Config.title,
          mainTitle: { ...template1Config.title.mainTitle, fontSize: 0 },
          subTitle: { ...template1Config.title.subTitle, fontSize: 0 }
        }
      });
    }
  };

  // 参数变更处理
  const handleParamsChange = (params: any) => {
    setTemplateParams(params);
  };
  
  // 样式配置变更处理 - 根据当前模板保存到对应的配置中
  const handleStyleConfigChange = (newStyleConfig: StyleConfig) => {
    // 根据当前选择的模板，更新对应的配置并保存到localStorage
    if (selectedTemplate?.id === 'template1') {
      setTemplate1Config(newStyleConfig);
      saveConfigToStorage(newStyleConfig, 'template1Config');
    } else if (selectedTemplate?.id === 'template2') {
      setTemplate2Config(newStyleConfig);
      saveConfigToStorage(newStyleConfig, 'template2Config');
    }
    setStyleConfig(newStyleConfig);
  };

  // 素材选择处理
  const handleMaterialSelect = (type: string, materialId: string, isSelected: boolean) => {
    setSelectedMaterials(prev => {
      const newSelected = { ...prev };
      const key = (type + 's') as keyof typeof prev;
      
      if (isSelected) {
        newSelected[key] = [...newSelected[key], materialId];
      } else {
        newSelected[key] = newSelected[key].filter(id => id !== materialId);
      }
      
      return newSelected;
    });
  };

  // 模板保存处理
  const handleSaveTemplate = (template: Template) => {
    setCustomTemplates(prev => [...prev, template]);
    message.success(`模板 "${template.name}" 保存成功！`);
  };

  // 模板删除处理
  const handleDeleteTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(template => template.id !== id));
    message.success('模板删除成功！');
  };

  // 生成视频
  const handleGenerate = async () => {
    // 验证输入
    if (!projectName.trim()) {
      message.error('请输入项目名称');
      return;
    }

    if (selectedMaterials.videos.length === 0) {
      message.error('请至少选择一个视频素材');
      return;
    }

    // 检查是否有选中的生成文案
    const selectedScripts = scripts.filter(script => script.selected);
    if (selectedScripts.length === 0) {
      message.error('请先生成并选择文案内容');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);

    try {
      // 模拟生成过程
      const generateSteps = [
        { progress: 10, text: '正在下载素材...' },
        { progress: 30, text: '正在剪辑视频...' },
        { progress: 50, text: '正在生成字幕...' },
        { progress: 70, text: '正在添加音频...' },
        { progress: 90, text: '正在上传视频...' },
        { progress: 100, text: '生成完成！' }
      ];

      for (const step of generateSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(step.progress);
      }

      // 模拟生成结果
      const mockVideo: GeneratedVideo = {
        id: `video_${Date.now()}`,
        url: '/generated/video.mp4',
        thumbnail: '/generated/thumbnail.jpg',
        name: `${projectName}_${new Date().toLocaleString()}`,
        duration: 30,
        size: 1024 * 1024 * 5, // 5MB
        createdAt: new Date().toISOString()
      };

      setGeneratedVideo(mockVideo);
      message.success('视频生成完成！');
    } catch (error) {
      message.error('视频生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 检查是否可以生成
  const canGenerate = projectName.trim().length > 0 && 
    selectedMaterials.videos.length > 0 && 
    content.trim().length > 0 && 
    !isGenerating;

  return (
    <div className="new-video-generator" style={{ 
      position: 'relative',
      background: 'transparent',
      minHeight: 'auto'
    }}>
      <div className="generator-container">
        <StepManager
          projectName={projectName}
          setProjectName={setProjectName}
          generateCount={videoCount}
          setGenerateCount={setVideoCount}
          videoDuration={videoDuration}
          setVideoDuration={setVideoDuration}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          voiceType={voiceType}
          setVoiceType={setVoiceType}
          baseScript={baseScript}
          setBaseScript={setBaseScript}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          customTemplates={customTemplates}
          onSaveTemplate={handleSaveTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          styleConfig={styleConfig}
          setStyleConfig={handleStyleConfigChange}
          selectedMaterials={selectedMaterials}
          onMaterialSelect={handleMaterialSelect}
          scripts={scripts}
          setScripts={setScripts}
          allMaterials={allMaterials}
          onMaterialsChange={setAllMaterials}
          onGenerate={handleGenerate}
          generating={isGenerating}
          onAddToHistory={addToHistory}
        />
      </div>

      {/* 参数配置侧边栏 */}
      <ParamsPanel
        visible={showParamsPanel}
        template={selectedTemplate}
        params={templateParams}
        onParamsChange={handleParamsChange}
        onClose={() => setShowParamsPanel(false)}
        style={styleConfig}
        setStyle={handleStyleConfigChange}
      />
    </div>
  );
};

export default NewVideoGenerator;
