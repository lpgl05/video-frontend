import React, { useState } from 'react';
import { Input, Select, Button, Progress, Space, message, InputNumber } from 'antd';
import { RobotOutlined, CheckOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface Script {
  id: string;
  content: string;
  selected: boolean;
  generatedAt: Date;
}

interface ProjectConfigProps {
  projectName: string;
  setProjectName: (name: string) => void;
  videoCount: number;
  setVideoCount: (count: number) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  playbackSpeed?: number;
  setPlaybackSpeed?: (speed: number) => void;
  voiceType?: string;
  setVoiceType?: (type: string) => void;
  content: string;
  setContent: (content: string) => void;
  onAIGenerate: () => void;
  scripts?: Script[];
  setScripts?: (scripts: Script[]) => void;
}

const ProjectConfig: React.FC<ProjectConfigProps> = ({
  projectName,
  setProjectName,
  videoCount,
  setVideoCount,
  videoDuration,
  setVideoDuration,
  playbackSpeed = 1.0,
  setPlaybackSpeed = () => {},
  voiceType = 'female',
  setVoiceType = () => {},
  content: _content,
  setContent: _setContent,
  onAIGenerate: _onAIGenerate,
  scripts: externalScripts,
  setScripts: setExternalScripts
}) => {
  const [baseScript, setBaseScript] = useState('');
  const [scripts, setScripts] = useState<Script[]>(externalScripts || []);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);

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
      
      // 调用原来的AI生成文案接口，传递语音类型参数
      const result = await generateScripts(baseScript, videoDuration, videoCount, playbackSpeed, voiceType);
      
      // 清除进度模拟，设置为100%
      clearInterval(progressInterval);
      setGenerateProgress(100);
      
      // 兼容后端返回字符串数组的情况
      const generatedScripts = Array.isArray(result)
        ? result.map((content: any, index: number) => {
            // 如果是字符串，转换为Script对象
            if (typeof content === 'string') {
              return {
                id: `script_${Date.now()}_${index}`,
                content,
                selected: true,
                generatedAt: new Date(),
              };
            }
            // 如果是对象，确保包含必要字段
            return {
              id: content.id || `script_${Date.now()}_${index}`,
              content: content.content || content,
              selected: true,
              generatedAt: new Date(content.generatedAt || Date.now()),
            };
          })
        : [];
      
      console.log('生成的文案状态:', generatedScripts.map((s: Script) => ({ id: s.id, selected: s.selected })));
      
      setScripts(generatedScripts);
      if (setExternalScripts) {
        setExternalScripts(generatedScripts);
      }
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
    if (setExternalScripts) {
      setExternalScripts(updatedScripts);
    }
  };

  const handleSelectAll = () => {
    const updatedScripts = scripts.map(script => ({ ...script, selected: true }));
    setScripts(updatedScripts);
    if (setExternalScripts) {
      setExternalScripts(updatedScripts);
    }
  };

  const handleDeselectAll = () => {
    const updatedScripts = scripts.map(script => ({ ...script, selected: false }));
    setScripts(updatedScripts);
    if (setExternalScripts) {
      setExternalScripts(updatedScripts);
    }
  };

  return (
    <div className="project-config">
      <div className="config-header">
        <h3 className="section-title">📋 项目基础配置</h3>
      </div>
      
      <div className="config-content">
        <div
          className="config-row"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            width: '100%'
          }}
        >
          <div className="config-item" style={{ flex: '0 0 240px', minWidth: 180 }}>
            <label>项目名称</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="请输入项目名称"
              size="large"
            />
          </div>

          <div className="config-item" style={{ flex: '0 0 140px', minWidth: 120 }}>
            <label>生成数量</label>
            <Select
              value={videoCount}
              onChange={setVideoCount}
              size="large"
              style={{ width: '100%' }}
              options={[
                { label: '1个视频', value: 1 },
                { label: '2个视频', value: 2 },
                { label: '3个视频', value: 3 },
                { label: '5个视频', value: 5 },
                { label: '10个视频', value: 10 }
              ]}
            />
          </div>
          <div className="config-item" style={{ flex: '0 0 180px', minWidth: 140 }}>
            <label>生成视频的时长</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <Select
                  value={videoDuration}
                  onChange={setVideoDuration}
                  size="large"
                  style={{ width: '100%' }}
                  options={[
                    { label: '30秒', value: 30 },
                    { label: '60秒', value: 60 },
                    { label: '90秒', value: 90 },
                    { label: '120秒', value: 120 }
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="config-item" style={{ flex: '0 0 120px', minWidth: 110 }}>
            <label>倍速</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <InputNumber
                  min={0.8}
                  max={2.0}
                  step={0.1}
                  value={playbackSpeed}
                  onChange={(value) => setPlaybackSpeed?.(value as number)}
                  size="large"
                  style={{ width: '100%' }}
                  precision={1}
                />
              </div>
            </div>
          </div>

          <div className="config-item" style={{ flex: '0 0 140px', minWidth: 120 }}>
            <label>配音类型</label>
            <Select
              value={voiceType}
              onChange={(value: string) => {
                setVoiceType(value);
                message.info(`已选择: ${value === 'male' ? '男声' : '女声'}`);
              }}
              size="large"
              style={{ width: '100%' }}
              options={[
                { label: '男声', value: 'male' },
                { label: '女声', value: 'female' }
              ]}
            />
          </div>
        </div>
        
        <div className="config-item">
          <label>基础文案</label>
          <div style={{ position: 'relative' }}>
            <TextArea
              value={baseScript}
              onChange={(e) => setBaseScript(e.target.value)}
              placeholder="请输入基础文案，AI将基于此生成多个变体..."
              rows={4}
              size="large"
              style={{ marginBottom: '12px', paddingRight: '120px' }} // 从60px增加到120px，加大一倍
            />
            {/* 案例链接 */}
            <div style={{ 
              position: 'absolute', 
              top: '8px', 
              right: '8px',
              zIndex: 10
            }}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setBaseScript(`各位企业家老板们，您是不是愁好赛道难寻？怕投错项目打水漂？手里有人脉却变不了现？​
别犯难！咱大会全国多城轮着开，不管您在北上广还是新一线，就近就能参会，场次根本不用等；AI 教育、智能硬件、新消费这些当下火的热门赛道全涵盖，还有上百个经过市场验证的优质项目任您挑，不用您熬夜踩坑试错！​想解决项目投资、盘活人脉？点击下方链接，免费参会资格直接领，名额有限先到先得！​`);
                }}
                style={{ 
                  fontSize: '12px', 
                  color: '#1890ff',
                  textDecoration: 'none'
                }}
              >
                案例
              </a>
            </div>
            {/* AI生成文案按钮 - 放在文本框内右下角 */}
            <div style={{ 
              position: 'absolute', 
              bottom: '20px', 
              right: '8px',
              zIndex: 10
            }}>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                loading={generating}
                onClick={handleAIGenerate}
                disabled={!baseScript.trim()}
                size="small"
                style={{ 
                  fontSize: '12px',
                  height: '29px', // 增加5px (24px + 5px = 29px)
                  padding: '0 12px', // 增加宽度1/3 (8px * 1.33 ≈ 12px)
                  minWidth: '100px' // 增加最小宽度以容纳"AI生成文案"
                }}
              >
                AI生成文案
              </Button>
            </div>
          </div>
          
          {/* AI生成进度条 */}
          {generating && generateProgress > 0 && (
            <div 
              className="ai-generation-progress"
              style={{ 
                marginTop: '10px', // 从16px缩短到10px，减少1/3
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center' // 整体居中
              }}>
              <div style={{ 
                marginBottom: '6px', // 从8px缩短到6px
                fontSize: '14px', 
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '400px' // 限制最大宽度，实现居中效果
              }}>
                <span>AI正在生成文案...</span>
                <span>{Math.min(generateProgress, 100).toFixed(1)}%</span>
              </div>
              <Progress
                percent={Math.min(Math.round(generateProgress * 10) / 10, 100)}
                format={(percent) => `${percent?.toFixed(1)}%`}
                status={generateProgress >= 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#1890ff',
                  '50%': '#722ed1',
                  '100%': '#52c41a'
                }}
                size={10}
                showInfo={false}
                style={{ 
                  width: '100%', 
                  maxWidth: '400px' // 限制最大宽度，实现居中效果
                }}
              />
            </div>
          )}
        </div>

        {/* 生成的文案列表 */}
        {scripts.length > 0 && (
          <div className="config-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label>生成的文案 ({scripts.filter(s => s.selected).length}/{scripts.length} 已选择)</label>
              <Space>
                <Button size="small" onClick={handleSelectAll}>
                  全选
                </Button>
                <Button size="small" onClick={handleDeselectAll}>
                  取消全选
                </Button>
              </Space>
            </div>
            
            <div className="script-list">
              {scripts.map((script) => (
                <div 
                  key={script.id} 
                  className={`script-item ${script.selected ? 'selected' : ''}`}
                  onClick={() => handleScriptToggle(script.id)}
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    backgroundColor: script.selected ? '#f0f8ff' : '#fff',
                    borderColor: script.selected ? '#1890ff' : '#d9d9d9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div 
                      style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScriptToggle(script.id);
                      }}
                    >
                      {script.selected ? (
                        <CheckOutlined 
                          style={{ 
                            color: '#52c41a', 
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }} 
                        />
                      ) : (
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #d9d9d9',
                            borderRadius: '2px',
                            backgroundColor: 'white'
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.5',
                        color: '#333',
                        marginBottom: '4px'
                      }}>
                        {script.content}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999'
                      }}>
                        生成时间: {new Date(script.generatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectConfig;
