import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Slider, ColorPicker, Button, Space, Divider, Card, Row, Col, InputNumber, Switch } from 'antd';
import { CloseOutlined, FontSizeOutlined } from '@ant-design/icons';
import type { StyleConfig, TitleConfig, FontStyle } from '../../types';

interface TemplateParams {
  titleStyle?: string;
  fontSize?: number;
  fontColor?: string;
  voice?: string;
  voiceSpeed?: number;
  bgm?: string;
  duration?: number;
  resolution?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  bold?: boolean;
  italic?: boolean;
}

interface ParamsPanelProps {
  visible: boolean;
  template: any;
  params: TemplateParams;
  onParamsChange: (params: TemplateParams) => void;
  onClose: () => void;
  // 添加样式配置相关props
  style?: StyleConfig;
  setStyle?: (style: StyleConfig) => void;
  // 添加保存配置到后端的回调
  onSaveToBackend?: (config: { params: TemplateParams; style: StyleConfig }) => void;
}

const ParamsPanel: React.FC<ParamsPanelProps> = ({
  visible,
  template,
  params,
  onParamsChange,
  onClose,
  style,
  setStyle,
  onSaveToBackend
}) => {
  const [form] = Form.useForm();
  
  // 初始化默认样式配置 - 根据模板类型使用不同的默认值
  const [currentStyle, setCurrentStyle] = useState<StyleConfig>(() => {
    if (style) return style;
    
    // 根据模板类型返回不同的默认配置
    if (template?.id === 'template1') {
      // 模板一（横屏视频）默认配置
      return {
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
          fontSize: 12,  // ✅ 修复：横版模板字幕字体大小调整为12px
          fontFamily: 'SourceHanSansCN-Heavy',
          strokeWidth: 0,
          shadow: 0,  // ✅ 新增：字幕阴影设置，默认值为0
          background: {
            background_color: '#FFFFFF',
            background_opacity: 0
          }
        }
      };
    } else if (template?.id === 'template2') {
      // 模板二（竖屏视频）默认配置
      return {
        title: {
          position: 'top',
          alignment: 'center',
          spacing: 11,
          mainTitle: {
            text: '人工智能风潮正劲',
            fontSize: 120,
            color: '#ffffff',
            fontFamily: 'SourceHanSansCN-Heavy',
            strokeWidth: 0
          },
          subTitle: {
            text: '企业如何乘风破浪',
            fontSize: 120,
            color: '#ffff00',
            fontFamily: 'SourceHanSansCN-Heavy',
            strokeWidth: 0
          },
          background: {
            background_color: '#CEC970',
            background_opacity: 0
          }
        },
        subtitle: {
          color: '#ffffff',
          position: 'template2' as 'template1', // 类型兼容处理
          fontSize: 18,
          fontFamily: 'SourceHanSansCN-Heavy',
          strokeWidth: 0,
          shadow: 0,
          background: {
            background_color: '#FFFFFF',
            background_opacity: 0
          }
        }
      };
    } else {
      // 其他情况默认配置
      return {
        title: {
          position: 'top',
          alignment: 'center',
          spacing: 20,
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
    }
  });

  // 监听style和template prop的变化，同步更新currentStyle
  useEffect(() => {
    if (style) {
      setCurrentStyle(style);
    } else {
      // 如果没有传入style，则根据模板类型重置为默认配置
      if (template?.id === 'template1') {
        setCurrentStyle({
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
        });
      } else if (template?.id === 'template2') {
        setCurrentStyle({
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
            position: 'template2' as 'template1',
            fontSize: 80,
            fontFamily: 'SourceHanSansCN-Heavy',
            background: {
              background_color: '#FFFFFF',
              background_opacity: 0
            }
          }
        });
      }
    }
  }, [style, template]);



  // 更新样式配置
  const updateStyle = (newStyle: StyleConfig) => {
    setCurrentStyle(newStyle);
    if (setStyle) {
      setStyle(newStyle);
    }
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    onParamsChange(allValues);
  };

  const handleReset = () => {
    if (template?.params) {
      form.setFieldsValue(template.params);
      onParamsChange(template.params);
    }
  };

  const titleStyleOptions = [
    { label: '默认', value: 'default' },
    { label: '粗体', value: 'bold' },
    { label: '现代', value: 'modern' },
    { label: '科技', value: 'tech' },
    { label: '优雅', value: 'elegant' }
  ];

  const voiceOptions = [
    { label: '女声', value: 'female' },
    { label: '男声', value: 'male' },
    { label: '童声', value: 'child' }
  ];

  const bgmOptions = [
    { label: '无背景音乐', value: 'none' },
    { label: '商务风格', value: 'business' },
    { label: '时尚潮流', value: 'fashion' },
    { label: '科技感', value: 'tech' },
    { label: '轻松愉快', value: 'happy' },
    { label: '温馨浪漫', value: 'romantic' }
  ];

  const durationOptions = [
    { label: '15秒', value: 15 },
    { label: '30秒', value: 30 },
    { label: '45秒', value: 45 },
    { label: '60秒', value: 60 }
  ];

  const resolutionOptions = [
    { label: '1920x1080 (横屏)', value: '1920x1080' },
    { label: '1080x1920 (竖屏)', value: '1080x1920' },
    { label: '1280x720 (横屏)', value: '1280x720' },
    { label: '720x1280 (竖屏)', value: '720x1280' }
  ];

  // 渲染主副标题配置（从原来的ConfigSettings复制）
  const renderTitleConfig = (titleConfig: TitleConfig) => (
    <div style={{ 
      padding: '12px', 
      border: '2px solid #1890ff', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff',
      marginBottom: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 600,
          color: '#1890ff',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <FontSizeOutlined /> 主副标题样式设置
        </h4>
      </div>
      
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 整体配置 */}
        <Row gutter={12}>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>标题位置</label>
            <Select
              value={titleConfig.position}
              onChange={(position) => updateStyle({ ...currentStyle, title: { ...titleConfig, position } })}
              style={{ width: '100%', height: '32px' }}
            >
              <Select.Option value="top">顶部</Select.Option>
              <Select.Option value="center">中间</Select.Option>
              <Select.Option value="bottom">底部</Select.Option>
              <Select.Option value="template1">模板位置1</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>主副标题间距</label>
            <InputNumber
              value={titleConfig.spacing || 11}
              onChange={(spacing) => updateStyle({ ...currentStyle, title: { ...titleConfig, spacing: spacing || 11 } })}
              style={{ width: '100%', height: '32px' }}
              min={0}
              max={100}
              addonAfter="px"
            />
          </Col>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>对齐方式</label>
            <Select
              value={titleConfig.alignment || 'center'}
              onChange={(alignment) => updateStyle({ ...currentStyle, title: { ...titleConfig, alignment } })}
              style={{ width: '100%', height: '32px' }}
            >
              <Select.Option value="left">左对齐</Select.Option>
              <Select.Option value="center">居中</Select.Option>
              <Select.Option value="right">右对齐</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* 主标题配置 */}
        <div style={{ background: '#fafafa', padding: '12px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#1890ff' }}>主标题</label>
            <Switch
              checked={!!titleConfig.mainTitle && (titleConfig.mainTitle.fontSize > 0)}
              onChange={(checked) => {
                if (checked) {
                  // 根据模板类型设置不同的默认配置
                  if (template?.id === 'template2') {
                    updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { 
                          text: titleConfig.mainTitle?.text || '', 
                          fontSize: 80, 
                          color: '#ffffff',
                          fontFamily: 'SourceHanSansCN-Heavy'
                        }
                      }
                    });
                  } else {
                    updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { 
                          text: titleConfig.mainTitle?.text || '', 
                          fontSize: 64, 
                          color: '#ffffff',
                          fontFamily: 'SourceHanSansCN-Heavy'
                        }
                      }
                    });
                  }
                } else {
                  updateStyle({
                    ...currentStyle,
                    title: {
                      ...titleConfig,
                      mainTitle: { ...titleConfig.mainTitle, fontSize: 0 }
                    }
                  });
                }
              }}
              size="small"
            />
          </div>
          
          {titleConfig.mainTitle && titleConfig.mainTitle.fontSize > 0 && (
            <>
              <Row gutter={8} style={{ marginBottom: '8px' }}>
                <Col span={24}>
                  <Input
                    placeholder="输入主标题文本"
                    value={titleConfig.mainTitle.text || ''}
                    onChange={(e) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { ...titleConfig.mainTitle, text: e.target.value }
                      }
                    })}
                    style={{ height: '32px' }}
                  />
                </Col>
              </Row>
              
              <Row gutter={8}>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字间距</label>
                  <InputNumber
                    value={titleConfig.mainTitle.letterSpacing || -50}
                    onChange={(letterSpacing) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { ...titleConfig.mainTitle, letterSpacing: letterSpacing || -50 }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    min={-100}
                    max={100}
                    size="small"
                  />
                </Col>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体大小</label>
                  <InputNumber
                    value={titleConfig.mainTitle.fontSize}
                    onChange={(fontSize) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { ...titleConfig.mainTitle, fontSize: fontSize || 64 }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    min={12}
                    max={200}
                    size="small"
                  />
                </Col>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>颜色</label>
                  <ColorPicker
                    value={titleConfig.mainTitle.color}
                    onChange={(color) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { ...titleConfig.mainTitle, color: color.toHexString() }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  />
                </Col>
                <Col span={9}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体</label>
                  <Select
                    value={titleConfig.mainTitle.fontFamily || 'SourceHanSansCN-Heavy'}
                    onChange={(fontFamily) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        mainTitle: { 
                          ...titleConfig.mainTitle, 
                          fontFamily,
                          fontSize: titleConfig.mainTitle?.fontSize || 64,
                          color: titleConfig.mainTitle?.color || '#ffffff'
                        }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  >
                    <Select.Option value="SourceHanSansCN-Heavy">思源黑体Heavy</Select.Option>
                    <Select.Option value="LIULISONG">柳隶宋体</Select.Option>
                    <Select.Option value="妙笔段慕体">妙笔段慕体</Select.Option>
                    <Select.Option value="妙笔珺俐体">妙笔珺俐体</Select.Option>
                  </Select>
                </Col>
              </Row>
            </>
          )}
        </div>

        {/* 副标题配置 */}
        <div style={{ background: '#f0f8ff', padding: '12px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px', color: '#52c41a' }}>副标题</label>
            <Switch
              checked={!!titleConfig.subTitle && (titleConfig.subTitle.fontSize > 0)}
              onChange={(checked) => {
                if (checked) {
                  // 根据模板类型设置不同的默认配置
                  if (template?.id === 'template2') {
                    updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          text: '', 
                          fontSize: 80, 
                          color: '#ffff00',
                          fontFamily: 'SourceHanSansCN-Heavy'
                        }
                      }
                    });
                  } else {
                    updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          text: '', 
                          fontSize: 40, 
                          color: '#ffff00',
                          fontFamily: 'SourceHanSansCN-Heavy'
                        }
                      }
                    });
                  }
                } else {
                  updateStyle({
                    ...currentStyle,
                    title: {
                      ...titleConfig,
                      subTitle: { 
                        ...titleConfig.subTitle, 
                        fontSize: 0,
                        color: titleConfig.subTitle?.color || '#ffff00'
                      }
                    }
                  });
                }
              }}
              size="small"
            />
          </div>
          
          {titleConfig.subTitle && titleConfig.subTitle.fontSize > 0 && (
            <>
              <Row gutter={8} style={{ marginBottom: '8px' }}>
                <Col span={24}>
                  <Input
                    placeholder="输入副标题文本"
                    value={titleConfig.subTitle.text || ''}
                    onChange={(e) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          ...titleConfig.subTitle, 
                          text: e.target.value,
                          fontSize: titleConfig.subTitle?.fontSize || 40,
                          color: titleConfig.subTitle?.color || '#ffff00'
                        }
                      }
                    })}
                    style={{ height: '32px' }}
                  />
                </Col>
              </Row>
              
              <Row gutter={8}>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字间距</label>
                  <InputNumber
                    value={titleConfig.subTitle.letterSpacing || -50}
                    onChange={(letterSpacing) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { ...titleConfig.subTitle, letterSpacing: letterSpacing || -50 }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    min={-100}
                    max={100}
                    size="small"
                  />
                </Col>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体大小</label>
                  <InputNumber
                    value={titleConfig.subTitle.fontSize}
                    onChange={(fontSize) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          ...titleConfig.subTitle, 
                          fontSize: fontSize || 40,
                          color: titleConfig.subTitle?.color || '#ffff00'
                        }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    min={12}
                    max={120}
                    size="small"
                  />
                </Col>
                <Col span={5}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>颜色</label>
                  <ColorPicker
                    value={titleConfig.subTitle.color}
                    onChange={(color) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          ...titleConfig.subTitle, 
                          color: color.toHexString(),
                          fontSize: titleConfig.subTitle?.fontSize || 40
                        }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  />
                </Col>
                <Col span={9}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体</label>
                  <Select
                    value={titleConfig.subTitle.fontFamily || 'SourceHanSansCN-Heavy'}
                    onChange={(fontFamily) => updateStyle({
                      ...currentStyle,
                      title: {
                        ...titleConfig,
                        subTitle: { 
                          ...titleConfig.subTitle, 
                          fontFamily,
                          fontSize: titleConfig.subTitle?.fontSize || 40,
                          color: titleConfig.subTitle?.color || '#ffff00'
                        }
                      }
                    })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  >
                    <Select.Option value="SourceHanSansCN-Heavy">思源黑体Heavy</Select.Option>
                    <Select.Option value="LIULISONG">柳隶宋体</Select.Option>
                    <Select.Option value="妙笔段慕体">妙笔段慕体</Select.Option>
                    <Select.Option value="妙笔珺俐体">妙笔珺俐体</Select.Option>
                  </Select>
                </Col>
              </Row>
            </>
          )}
        </div>
      </Space>
    </div>
  );

  // 渲染字幕样式配置（从原来的ConfigSettings复制）
  const renderSubtitleConfig = (subtitleConfig: FontStyle) => (
    <div style={{ 
      padding: '12px', 
      border: '2px solid #52c41a', 
      borderRadius: '8px',
      backgroundColor: '#f6ffed',
      marginBottom: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 600,
          color: '#52c41a',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <FontSizeOutlined /> 字幕样式设置
        </h4>
      </div>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 基础配置 */}
        <Row gutter={12}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
              字幕颜色
            </label>
            <ColorPicker
              value={subtitleConfig.color}
              onChange={(color) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, color: color.toHexString(), fontSize: subtitleConfig.fontSize } })}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
              字幕位置
            </label>
            <Select
              value={subtitleConfig.position}
              onChange={(position) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, position, fontSize: subtitleConfig.fontSize, color: subtitleConfig.color } })}
              style={{ width: '100%', height: '32px' }}
            >
              <Select.Option value="top">顶部</Select.Option>
              <Select.Option value="center">中间</Select.Option>
              <Select.Option value="bottom">底部</Select.Option>
              <Select.Option value="template1">模板位置1（横屏视频）</Select.Option>
              <Select.Option value="template2">竖屏默认（上边距1372px）</Select.Option>
            </Select>
          </Col>
        </Row>
        
        {/* 第二行：字体大小和字体 */}
        <Row gutter={12}>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字体大小</label>
            <InputNumber
              min={0}
              max={120}
              value={subtitleConfig.fontSize}
              onChange={(fontSize) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, fontSize: fontSize || 60, color: subtitleConfig.color } })}
              style={{ width: '100%', height: '32px', lineHeight: '30px' }}
              addonAfter="px"
              placeholder="0=不显示"
            />
          </Col>
          <Col span={16}>
            <label style={{ fontSize: '12px', marginBottom: 4, display: 'block' }}>字体</label>
            <Select
              value={subtitleConfig.fontFamily}
              onChange={(fontFamily) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, fontFamily, fontSize: subtitleConfig.fontSize, color: subtitleConfig.color } })}
              style={{ width: '100%', height: '32px' }}
            >
              <Select.Option value="SourceHanSansCN-Heavy">思源黑体Heavy</Select.Option>
              <Select.Option value="LIULISONG">柳隶宋体</Select.Option>
              <Select.Option value="妙笔段慕体">妙笔段慕体</Select.Option>
              <Select.Option value="妙笔珺俐体">妙笔珺俐体</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* 第三行：描边设置 */}
        <Row gutter={12}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字体描边颜色</label>
            <ColorPicker
              value={subtitleConfig.strokeColor || '#000000'}
              onChange={(color) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, strokeColor: color.toHexString(), fontSize: subtitleConfig.fontSize, color: subtitleConfig.color } })}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字体描边宽度</label>
            <InputNumber
              min={0}
              max={10}
              value={subtitleConfig.strokeWidth !== undefined ? subtitleConfig.strokeWidth : 0}
              onChange={(strokeWidth) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, strokeWidth: strokeWidth || 0, fontSize: subtitleConfig.fontSize, color: subtitleConfig.color } })}
              style={{ width: '100%', height: '32px', lineHeight: '30px' }}
              addonAfter="px"
            />
          </Col>
        </Row>

        {/* 第四行：阴影设置 */}
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字幕阴影深度</label>
            <InputNumber
              min={0}
              max={10}
              value={subtitleConfig.shadow !== undefined ? subtitleConfig.shadow : 0}
              onChange={(shadow) => updateStyle({ ...currentStyle, subtitle: { ...subtitleConfig, shadow: shadow || 0, fontSize: subtitleConfig.fontSize, color: subtitleConfig.color } })}
              style={{ width: '100%', height: '32px', lineHeight: '30px' }}
              addonAfter="px"
              placeholder="0=无阴影"
            />
          </Col>
        </Row>

        {/* 背景颜色与透明度设置 */}
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字幕背景颜色</label>
            <ColorPicker
              value={subtitleConfig.background?.background_color || '#FFFFFF'}
              onChange={(color) => updateStyle({ 
                ...currentStyle, 
                subtitle: { 
                  ...subtitleConfig, 
                  fontSize: subtitleConfig.fontSize,
                  color: subtitleConfig.color,
                  background: { 
                    ...subtitleConfig.background, 
                    background_color: color.toHexString(),
                    background_opacity: subtitleConfig.background?.background_opacity || 0
                  } 
                } 
              })}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字幕背景透明度</label>
            <InputNumber
              min={0}
              max={255}
              value={subtitleConfig.background?.background_opacity ?? 0}
              onChange={(val) => {
                let opacity = typeof val === 'number' ? val : parseFloat(String(val) || '0')
                if (opacity <= 1) opacity = Math.round(opacity * 255)
                updateStyle({ 
                  ...currentStyle, 
                  subtitle: { 
                    ...subtitleConfig, 
                    fontSize: subtitleConfig.fontSize,
                    color: subtitleConfig.color,
                    background: { 
                      background_color: subtitleConfig.background?.background_color || '#FFFFFF',
                      background_opacity: Math.round(opacity)
                    } 
                  } 
                })
              }}
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
        </Row>
      </Space>
    </div>
  );

  // 保存配置到localStorage和后端
  const saveConfig = () => {
    const currentParams = form.getFieldsValue();
    const configToSave = {
      params: currentParams,
      style: currentStyle
    };
    
    // 保存到localStorage
    if (template?.id) {
      localStorage.setItem(`videoConfig_${template.id}`, JSON.stringify(configToSave));
      console.log('🎨 ParamsPanel保存配置:', configToSave);
    } else {
      console.error('Cannot save config: template id is missing');
    }
    
    // 通知父组件保存到后端
    if (onSaveToBackend) {
      onSaveToBackend(configToSave);
    }
  };

  // 处理最终确定按钮
  const handleConfirm = () => {
    saveConfig();
    onClose();
  };

  // 加载配置
  const loadConfig = () => {
    const savedConfig = localStorage.getItem(`videoConfig_${template?.id}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.params) {
          form.setFieldsValue(parsedConfig.params);
          onParamsChange(parsedConfig.params);
        }
        if (parsedConfig.style) {
          setCurrentStyle(parsedConfig.style);
          if (setStyle) {
            setStyle(parsedConfig.style);
          }
        }
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  };

  // 组件显示时加载配置
  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  return (
    <Modal
      title="参数配置"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="ok" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      ]}
      className="params-panel"
    >
      {/* 根据模板类型显示不同的配置内容 */}
      {template?.id === 'none' ? (
        // 不使用模板时，显示原来的样式设置块
        <div style={{ padding: '16px 0' }}>
          {renderTitleConfig(currentStyle.title)}
          {renderSubtitleConfig(currentStyle.subtitle)}
          
          <div className="params-actions" style={{ marginTop: '20px' }}>
            <Space>
              <Button type="primary" onClick={onClose}>
                确定
              </Button>
            </Space>
          </div>
        </div>
      ) : template?.id === 'template1' ? (
        // 模板一：横屏视频，现在也支持主副标题和字幕样式设置
        <div style={{ padding: '16px 0' }}>
          <Card title="模板（一）横屏视频配置" size="small">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              此模板支持主标题和副标题，可以自定义字体样式和字幕设置。
            </p>
            {renderTitleConfig(currentStyle.title)}
            <Divider />
            {renderSubtitleConfig(currentStyle.subtitle)}
          </Card>
        </div>
      ) : template?.id === 'template2' ? (
        // 模板二：竖屏视频，开启主副标题，字号80
        <div style={{ padding: '16px 0' }}>
          <Card title="模板（二）竖屏视频配置" size="small">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              此模板支持主标题和副标题，字号已设置为80。
            </p>
            {renderTitleConfig(currentStyle.title)}
            <Divider />
            {renderSubtitleConfig(currentStyle.subtitle)}
          </Card>
        </div>
      ) : template?.type === 'custom' ? (
        // 自定义模板：显示保存的样式配置
        <div style={{ padding: '16px 0' }}>
          <Card title={`自定义模板：${template.name}`} size="small">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              此模板包含您保存的样式配置。
            </p>
            {renderTitleConfig(currentStyle.title)}
            <Divider />
            {renderSubtitleConfig(currentStyle.subtitle)}
          </Card>
        </div>
      ) : (
        // 使用模板时，显示模板参数配置
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={params}
        >
          <div className="params-section">
            <h4>样式设置</h4>
            <Form.Item label="标题样式" name="titleStyle">
              <Select options={titleStyleOptions} />
            </Form.Item>
            
            <Form.Item label="字体大小" name="fontSize">
              <Slider
                min={12}
                max={72}
                marks={{
                  12: '12px',
                  24: '24px',
                  36: '36px',
                  48: '48px',
                  60: '60px',
                  72: '72px'
                }}
              />
            </Form.Item>
            
            <Form.Item label="字体颜色" name="fontColor">
              <ColorPicker showText />
            </Form.Item>
            
            <Form.Item label="描边颜色" name="strokeColor">
              <ColorPicker showText />
            </Form.Item>
            
            <Form.Item label="描边宽度" name="strokeWidth">
              <Slider min={0} max={5} />
            </Form.Item>
            
            <Form.Item label="阴影" name="shadow" valuePropName="checked">
              <Select>
                <Select.Option value={true}>开启</Select.Option>
                <Select.Option value={false}>关闭</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="阴影颜色" name="shadowColor">
              <ColorPicker showText />
            </Form.Item>
            
            <Form.Item label="粗体" name="bold" valuePropName="checked">
              <Select>
                <Select.Option value={true}>是</Select.Option>
                <Select.Option value={false}>否</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="斜体" name="italic" valuePropName="checked">
              <Select>
                <Select.Option value={true}>是</Select.Option>
                <Select.Option value={false}>否</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Divider />

          <div className="params-section">
            <h4>配音设置</h4>
            <Form.Item label="音色" name="voice">
              <Select options={voiceOptions} />
            </Form.Item>
            
            <Form.Item label="语速" name="voiceSpeed">
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                marks={{
                  0.5: '0.5x',
                  1.0: '1.0x',
                  1.5: '1.5x',
                  2.0: '2.0x'
                }}
              />
            </Form.Item>
          </div>

          <Divider />

          <div className="params-section">
            <h4>背景音乐</h4>
            <Form.Item label="背景音乐" name="bgm">
              <Select options={bgmOptions} />
            </Form.Item>
          </div>

          <Divider />

          <div className="params-section">
            <h4>视频设置</h4>
            <Form.Item label="视频时长" name="duration">
              <Select options={durationOptions} />
            </Form.Item>
            
            <Form.Item label="分辨率" name="resolution">
              <Select options={resolutionOptions} />
            </Form.Item>
          </div>

          <div className="params-actions">
            <Space>
              <Button onClick={handleReset}>
                重置为模板默认值
              </Button>
              <Button type="primary" onClick={onClose}>
                确定
              </Button>
            </Space>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default ParamsPanel;
