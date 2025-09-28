import React, { useState, useEffect } from 'react'
import { Card, Input, Select, Row, Col, Space, ColorPicker, Switch, InputNumber, Button, Modal, Upload } from 'antd'
import { UploadOutlined, FontSizeOutlined } from '@ant-design/icons'
import type { DurationOption, VoiceOption, StyleConfig, FontStyle, TitleConfig, PosterFile, AdvancedConfig } from '../types'
import StylePreview from './StylePreview'
import PosterUpload from './PosterUpload'
import '../styles/FontStyles.css'

interface ConfigSettingsProps {
  duration: DurationOption
  setDuration: (duration: DurationOption) => void
  voice: VoiceOption
  setVoice: (voice: VoiceOption) => void
  style: StyleConfig
  setStyle: (style: StyleConfig) => void
  projectName?: string
  setProjectName?: (name: string) => void
  videoCount?: number
  setVideoCount?: (count: number) => void
  posters?: PosterFile[] // 海报数组
  setPosters?: (posters: PosterFile[]) => void // 海报设置函数
}

const ConfigSettings: React.FC<ConfigSettingsProps> = ({
  duration,
  setDuration,
  voice,
  setVoice,
  style,
  setStyle,
  projectName,
  setProjectName,
  videoCount,
  setVideoCount,
  posters,
  setPosters
}) => {
  const [fontModalVisible, setFontModalVisible] = useState(false)
  const [currentEditingFont, setCurrentEditingFont] = useState<'title' | 'subtitle'>('title')
  
  // 仅测试环境(前端端口4000)使用更大的默认字号
  const isTestEnv = typeof window !== 'undefined' && window.location && window.location.port === '4000'
  const TEST_DEFAULT_FONT_SIZE = isTestEnv ? 80 : undefined

  // 预设字体选项
  const presetFonts = [
    { label: '系统默认', value: 'Arial, sans-serif', needsLicense: false },
    { label: '微软雅黑', value: 'Microsoft YaHei, sans-serif', needsLicense: false },
    { label: '宋体', value: 'SimSun, serif', needsLicense: false },
    { label: '黑体', value: 'SimHei, sans-serif', needsLicense: false },
    { label: '楷体', value: 'KaiTi, serif', needsLicense: false },
    { 
      label: '柳隶宋体', 
      value: 'LIULISONG', 
      fontUrl: '/fonts/LIULISONG.ttf',
      needsLicense: true
    },
    { 
      label: '妙笔珺俐体', 
      value: 'MiaobiJunli', 
      fontUrl: '/fonts/妙笔珺俐体.ttf',
      needsLicense: true
    },
    { 
      label: '妙笔段慕体', 
      value: 'MiaobiDuanmu', 
      fontUrl: '/fonts/妙笔段慕体.ttf',
      needsLicense: true
    },
    { 
      label: '思源黑体Heavy', 
      value: 'SourceHanSansCN-Heavy', 
      fontUrl: '/fonts/SourceHanSansCN-Heavy.otf',
      needsLicense: true
    }
  ]

  // 在组件加载时应用默认值
  useEffect(() => {
    // 确保当前style应用了所有默认值
    const normalized = normalizeStyle(style)
    if (JSON.stringify(normalized) !== JSON.stringify(style)) {
      setStyle(normalized)
    }
  }, []) // 只在组件首次加载时执行

  // 新增：统一规范化 style，确保 title/subtitle 都有默认值，支持主副标题
  const normalizeStyle = (rawStyle: any) => {
    const s = { ...(rawStyle || {}) }
    
    // 处理 title 配置（支持主副标题）
    const titleSection = (s.title && { ...s.title }) || {}
    
    // 向后兼容：如果 title 是旧的 FontStyle 格式，将其转换为主标题
    if (titleSection.color && titleSection.fontSize !== undefined && !titleSection.mainTitle && !titleSection.subTitle) {
      titleSection.mainTitle = {
        text: '',
        fontSize: titleSection.fontSize || 0,  // 主标题默认关闭
        color: titleSection.color || '#ffffff',  // 主标题默认白色
        fontFamily: titleSection.fontFamily || 'SourceHanSansCN-Heavy'  // 默认思源黑体Heavy
      }
    }
    
    // 确保主标题默认值（默认关闭）
    if (!titleSection.mainTitle) {
      titleSection.mainTitle = {
        text: '',
        fontSize: 0,  // 主标题默认关闭
        color: '#ffffff',  // 主标题默认白色
        fontFamily: 'SourceHanSansCN-Heavy'  // 默认思源黑体Heavy
      }
    }
    
    // 确保副标题默认值（默认关闭）
    if (!titleSection.subTitle) {
      titleSection.subTitle = {
        text: '',
        fontSize: 0,  // 副标题默认关闭
        color: '#ffff00',  // 副标题默认黄色
        fontFamily: 'SourceHanSansCN-Heavy'  // 默认思源黑体Heavy
      }
    }
    
    // 确保整体位置默认值
    titleSection.position = titleSection.position || 'top'
    titleSection.spacing = titleSection.spacing ?? 20
    titleSection.alignment = titleSection.alignment || 'center'
    
    // 处理背景配置
    const bgObj = (titleSection.background && typeof titleSection.background === 'object') ? { ...titleSection.background } : {}
    if (!bgObj.background_color && titleSection.background_color) bgObj.background_color = titleSection.background_color
    if (bgObj.background_opacity === undefined && titleSection.background_opacity !== undefined) bgObj.background_opacity = titleSection.background_opacity
    if (!bgObj.background_color) bgObj.background_color = '#CEC970'
    if (bgObj.background_opacity === undefined) bgObj.background_opacity = 0
    titleSection.background = bgObj
    titleSection.background_color = titleSection.background_color || bgObj.background_color
    titleSection.background_opacity = titleSection.background_opacity ?? bgObj.background_opacity
    
    s.title = titleSection
    
    // 处理 subtitle 配置（保持原有逻辑）
    const subtitleSection = (s.subtitle && { ...s.subtitle }) || {}
    const subBgObj = (subtitleSection.background && typeof subtitleSection.background === 'object') ? { ...subtitleSection.background } : {}
    if (!subBgObj.background_color && subtitleSection.background_color) subBgObj.background_color = subtitleSection.background_color
    if (subBgObj.background_opacity === undefined && subtitleSection.background_opacity !== undefined) subBgObj.background_opacity = subtitleSection.background_opacity
    if (!subBgObj.background_color) subBgObj.background_color = '#FFFFFF'
    if (subBgObj.background_opacity === undefined) subBgObj.background_opacity = 0
    subtitleSection.background = subBgObj
    subtitleSection.background_color = subtitleSection.background_color || subBgObj.background_color
    subtitleSection.background_opacity = subtitleSection.background_opacity ?? subBgObj.background_opacity
    subtitleSection.color = subtitleSection.color || '#ffffff'  // 字幕默认白色
    subtitleSection.position = subtitleSection.position || 'template1'  // 默认模板位置1（横屏视频）
    subtitleSection.fontSize = subtitleSection.fontSize ?? 60
    subtitleSection.fontFamily = subtitleSection.fontFamily || 'SourceHanSansCN-Heavy'
    s.subtitle = subtitleSection
    
    return s
  }

  // 更新标题整体配置
  const updateTitleStyle = (updates: Partial<TitleConfig>) => {
    const newStyle = {
      ...style,
      title: { ...style.title, ...updates } as TitleConfig
    } as StyleConfig;
    setStyle(newStyle);
  }

  // 更新主标题配置
  const updateMainTitleStyle = (updates: any) => {
    const newStyle = {
      ...style,
      title: {
        ...style.title,
        mainTitle: { ...style.title?.mainTitle, ...updates }
      } as TitleConfig
    } as StyleConfig;
    setStyle(newStyle);
  }

  // 更新副标题配置
  const updateSubTitleStyle = (updates: any) => {
    const newStyle = {
      ...style,
      title: {
        ...style.title,
        subTitle: { ...style.title?.subTitle, ...updates }
      } as TitleConfig
    } as StyleConfig;
    setStyle(newStyle);
  }

  // 更新字体样式的辅助函数（保持原有逻辑，只用于 subtitle）
  const updateFontStyle = (type: 'subtitle', updates: Partial<FontStyle>) => {
		const prev = (style && style[type]) || {}
		const merged: any = { ...prev, ...updates }

		// 处理 background 字段优先级：支持 object/string/flat fields
		if (merged.background) {
			const bg = merged.background
			if (typeof bg === 'string') {
				merged.background_color = merged.background_color || bg
			} else if (typeof bg === 'object') {
				if (bg.background_color) merged.background_color = bg.background_color
				if (bg.background_opacity !== undefined) merged.background_opacity = bg.background_opacity
				if (bg.color) merged.background_color = merged.background_color || bg.color
				if (bg.opacity !== undefined) merged.background_opacity = merged.background_opacity ?? bg.opacity
			}
		}

		// 如果设置了平铺字段，确保 background 对象也同步存在
		if ((merged.background_color || merged.background_opacity !== undefined) && !merged.background) {
			merged.background = {
				background_color: merged.background_color || '#FFFFFF',
				background_opacity: merged.background_opacity !== undefined ? merged.background_opacity : 0
			}
		} else if (merged.background && (!merged.background.background_color && merged.background_color)) {
			merged.background.background_color = merged.background_color
			merged.background.background_opacity = merged.background_opacity ?? merged.background.background_opacity
		}

		// 先合并到现有 style，然后规范化整个 style（保证 title/subtitle 都有 background）
		const newStyle = {
			...style,
			[type]: merged
		}
		setStyle(normalizeStyle(newStyle))
	}

	// 新增：获取当前 background（若无则返回空对象）
	const getCurrentBackground = (type: 'title' | 'subtitle') => {
		return (style && style[type] && (style[type] as any).background) ? (style[type] as any).background : {}
	}

  // 处理自定义字体上传
  const handleFontUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '')
    
    updateFontStyle('subtitle', {
      fontFamily: fontName,
      fontUrl: url
    })
    
    return false // 阻止默认上传行为
  }

  // 渲染主副标题配置
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
          <FontSizeOutlined /> 标题样式
        </h4>
      </div>
      
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 整体配置 */}
        <Row gutter={12}>
          <Col span={8}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>标题位置</label>
            <Select
              value={titleConfig.position}
              onChange={(position) => updateTitleStyle({ position })}
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
              value={titleConfig.spacing || 20}
              onChange={(spacing) => updateTitleStyle({ spacing: spacing || 20 })}
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
              onChange={(alignment) => updateTitleStyle({ alignment })}
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
                  updateMainTitleStyle({ 
                    text: titleConfig.mainTitle?.text || '', 
                    fontSize: (TEST_DEFAULT_FONT_SIZE ?? 64), 
                    color: '#ffffff',  // 主标题默认白色
                    fontFamily: 'SourceHanSansCN-Heavy'
                  });
                } else {
                  updateMainTitleStyle({ fontSize: 0 });
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
                    onChange={(e) => updateMainTitleStyle({ text: e.target.value })}
                    style={{ height: '32px' }}
                  />
                </Col>
              </Row>
              
              <Row gutter={8}>
                <Col span={6}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体大小</label>
                  <InputNumber
                    value={titleConfig.mainTitle.fontSize}
                    onChange={(fontSize) => updateMainTitleStyle({ fontSize: fontSize || (TEST_DEFAULT_FONT_SIZE ?? 64) })}
                    style={{ width: '100%', height: '28px' }}
                    min={12}
                    max={200}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>颜色</label>
                  <ColorPicker
                    value={titleConfig.mainTitle.color}
                    onChange={(color) => updateMainTitleStyle({ color: color.toHexString() })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体</label>
                  <Select
                    value={titleConfig.mainTitle.fontFamily || 'SourceHanSansCN-Heavy'}
                    onChange={(fontFamily) => updateMainTitleStyle({ fontFamily })}
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
                  updateSubTitleStyle({ 
                    text: '', 
                    fontSize: (TEST_DEFAULT_FONT_SIZE ?? 40), 
                    color: '#ffff00',  // 副标题默认黄色
                    fontFamily: 'SourceHanSansCN-Heavy'
                  });
                } else {
                  updateSubTitleStyle({ fontSize: 0 });  // 关闭时设置fontSize为0，而不是删除整个subTitle
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
                    onChange={(e) => updateSubTitleStyle({ text: e.target.value })}
                    style={{ height: '32px' }}
                  />
                </Col>
              </Row>
              
              <Row gutter={8}>
                <Col span={6}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体大小</label>
                  <InputNumber
                    value={titleConfig.subTitle.fontSize}
                    onChange={(fontSize) => updateSubTitleStyle({ fontSize: fontSize || (TEST_DEFAULT_FONT_SIZE ?? 40) })}
                    style={{ width: '100%', height: '28px' }}
                    min={12}
                    max={120}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>颜色</label>
                  <ColorPicker
                    value={titleConfig.subTitle.color}
                    onChange={(color) => updateSubTitleStyle({ color: color.toHexString() })}
                    style={{ width: '100%', height: '28px' }}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <label style={{ fontSize: '10px', display: 'block', marginBottom: 2 }}>字体</label>
                  <Select
                    value={titleConfig.subTitle.fontFamily || 'SourceHanSansCN-Heavy'}
                    onChange={(fontFamily) => updateSubTitleStyle({ fontFamily })}
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

        {/* 背景配置 */}
        <Row gutter={12}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>标题背景颜色</label>
            <ColorPicker
              value={ (getCurrentBackground('title').background_color) || '#CEC970' }
              onChange={(color) => {
                const curBg = getCurrentBackground('title')
                const newBg = { ...curBg, background_color: color.toHexString() }
                updateTitleStyle({ background: newBg })
              }}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>标题背景透明度</label>
            <InputNumber
              min={0}
              max={255}
              value={ getCurrentBackground('title').background_opacity ?? 0 }
              onChange={(val) => {
                const curBg = getCurrentBackground('title')
                let opacity = typeof val === 'number' ? val : parseFloat(String(val) || '0')
                if (opacity <= 1) opacity = Math.round(opacity * 255)
                const newBg = { ...curBg, background_opacity: Math.round(opacity) }
                updateTitleStyle({ background: newBg })
              }}
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
        </Row>
      </Space>
    </div>
  )
  
  // 渲染字幕样式配置（保持原有逻辑）
  const renderFontStyleConfig = (type: 'subtitle', label: string, fontStyle: FontStyle) => (
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
          <FontSizeOutlined /> {label}
        </h4>
        <Button 
          type="link" 
          size="small" 
          onClick={() => {
            setCurrentEditingFont('subtitle')
            setFontModalVisible(true)
          }}
          style={{ fontSize: '12px', height: 'auto', padding: '2px 8px' }}
        >
          高级设置
        </Button>
      </div>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 基础配置 */}
        <Row gutter={12}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
              字幕颜色
            </label>
            <ColorPicker
              value={fontStyle.color}
              onChange={(color) => updateFontStyle(type, { color: color.toHexString() })}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
              字幕位置
            </label>
            <Select
              value={fontStyle.position}
              onChange={(position) => {
                // 根据模板位置联动控制主副标题开关
                if (position === 'template1') {
                  // 模板位置1（横屏视频）：自动关闭主副标题开关
                  const newStyle = {
                    ...style,
                    subtitle: {
                      ...style.subtitle,
                      position: position
                    },
                    title: {
                      ...style.title,
                      mainTitle: { 
                        ...style.title?.mainTitle,
                        text: style.title?.mainTitle?.text || '', 
                        fontSize: 0,  // 关闭主标题
                        color: style.title?.mainTitle?.color || '#ffffff',
                        fontFamily: style.title?.mainTitle?.fontFamily || 'SourceHanSansCN-Heavy'
                      },
                      subTitle: { 
                        ...style.title?.subTitle,
                        text: style.title?.subTitle?.text || '', 
                        fontSize: 0,  // 关闭副标题
                        color: style.title?.subTitle?.color || '#ffff00',
                        fontFamily: style.title?.subTitle?.fontFamily || 'SourceHanSansCN-Heavy'
                      }
                    }
                  };
                  setStyle(normalizeStyle(newStyle));
                } else if (position === 'template2') {
                  // 模板位置2（竖屏视频）：自动打开主副标题开关，字号保持80
                  const newStyle = {
                    ...style,
                    subtitle: {
                      ...style.subtitle,
                      position: position
                    },
                    title: {
                      ...style.title,
                      mainTitle: { 
                        ...style.title?.mainTitle,
                        text: style.title?.mainTitle?.text || '', 
                        fontSize: 80,  // 打开主标题，字号80
                        color: style.title?.mainTitle?.color || '#ffffff',
                        fontFamily: style.title?.mainTitle?.fontFamily || 'SourceHanSansCN-Heavy'
                      },
                      subTitle: { 
                        ...style.title?.subTitle,
                        text: style.title?.subTitle?.text || '', 
                        fontSize: 80,  // 打开副标题，字号80
                        color: style.title?.subTitle?.color || '#ffff00',
                        fontFamily: style.title?.subTitle?.fontFamily || 'SourceHanSansCN-Heavy'
                      }
                    }
                  };
                  setStyle(normalizeStyle(newStyle));
                } else {
                  // 其他位置选项，只更新字幕位置
                  updateFontStyle(type, { position });
                }
              }}
              style={{ width: '100%', height: '32px' }}
            >
              <Select.Option value="top">顶部</Select.Option>
              <Select.Option value="center">中间</Select.Option>
              <Select.Option value="bottom">底部</Select.Option>
              <Select.Option value="template1">模板位置1（横屏视频）</Select.Option>
              <Select.Option value="template2">默认模板2（竖屏视频）</Select.Option>
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
              value={fontStyle.fontSize}
              onChange={(fontSize) => updateFontStyle(type, { fontSize: fontSize || 0 })}
              style={{ width: '100%', height: '32px', lineHeight: '30px' }}
              addonAfter="px"
              placeholder="0=不显示"
            />
          </Col>
          <Col span={16}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: '12px', marginRight: 8 }}>字体</label>
              {/* 版权提示放在标题后面 */}
              {(() => {
                const selectedFont = presetFonts.find(f => f.value === fontStyle.fontFamily)
                return selectedFont?.needsLicense && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#ff4d4f',
                    fontStyle: 'italic',
                    marginLeft: 'auto'
                  }}>
                    该字体仅供演示，商用需联系授权
                  </span>
                )
              })()}
            </div>
            <Select
              value={fontStyle.fontFamily}
              onChange={(fontFamily) => {
                const selectedFont = presetFonts.find(f => f.value === fontFamily)
                updateFontStyle(type, { 
                  fontFamily,
                  fontUrl: selectedFont?.fontUrl || undefined
                })
              }}
              style={{ width: '100%', height: '32px' }}
            >
              {presetFonts.map(font => (
                <Select.Option key={font.value} value={font.value}>
                  {font.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 第三行：描边设置 */}
        <Row gutter={12}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字体描边颜色</label>
            <ColorPicker
              value={fontStyle.strokeColor || '#000000'}
              onChange={(color) => updateFontStyle(type, { strokeColor: color.toHexString() })}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字体描边宽度</label>
            <InputNumber
              min={0}
              max={10}
              value={fontStyle.strokeWidth || 1}
              onChange={(strokeWidth) => updateFontStyle(type, { strokeWidth: strokeWidth || 0 })}
              style={{ width: '100%', height: '32px', lineHeight: '30px' }}
              addonAfter="px"
            />
          </Col>
        </Row>

        {/* 新增：背景颜色与透明度设置 */}
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字幕背景颜色</label>
            <ColorPicker
              value={ (getCurrentBackground(type).background_color) || '#FFFFFF' }
              onChange={(color) => {
                const curBg = getCurrentBackground(type)
                const newBg = { ...curBg, background_color: color.toHexString() }
                updateFontStyle(type, { background: newBg } as any)
              }}
              showText
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
          <Col span={12}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>字幕背景透明度</label>
            <InputNumber
              min={0}
              max={255}
              value={ getCurrentBackground(type).background_opacity ?? getCurrentBackground(type).opacity ?? 0 }
              onChange={(val) => {
                const curBg = getCurrentBackground(type)
                let opacity = typeof val === 'number' ? val : parseFloat(String(val) || '0')
                if (opacity <= 1) opacity = Math.round(opacity * 255)
                const newBg = { ...curBg, background_opacity: Math.round(opacity) }
                updateFontStyle(type, { background: newBg } as any)
              }}
              style={{ width: '100%', height: '32px' }}
            />
          </Col>
        </Row>
      </Space>
    </div>
  )
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* 基础配置 */}
      <Card title="基础设置" size="small">
        <Row gutter={[16, 12]}>
          {/* 创作模式已统一为团队协作模式 */}

          {/* 项目名称和视频生成数量 */}
          {(projectName !== undefined && setProjectName) && (
            <>
              <Col span={12}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>项目名称</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="请输入项目名称"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      height: '32px'
                    }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>视频生成数量</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={videoCount}
                    onChange={(e) => setVideoCount && setVideoCount(parseInt(e.target.value) || 1)}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      height: '32px'
                    }}
                  />
                </div>
              </Col>
            </>
          )}
          
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>视频时长</label>
              <Select
                value={duration}
                onChange={setDuration}
                style={{ width: '100%', height: '32px' }}
              >
                <Select.Option value="30s">30秒</Select.Option>
                <Select.Option value="60s">60秒</Select.Option>
                <Select.Option value="90s">90秒</Select.Option>
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>配音类型</label>
              <Select
                value={voice}
                onChange={setVoice}
                style={{ width: '100%', height: '32px' }}
              >
                <Select.Option value="male">男声</Select.Option>
                <Select.Option value="female">女声</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 样式配置 */}
      <Card title="样式设置" size="small">
        <Row gutter={[16, 12]}>
          <Col span={12}>
            {renderTitleConfig(style.title)}
          </Col>
          
          <Col span={12}>
            {renderFontStyleConfig('subtitle', '字幕样式', style.subtitle)}
          </Col>
        </Row>
      </Card>

             {/* 海报背景设置 */}
       {setPosters && (
         <Card title="背景海报设置" size="small">
           <PosterUpload 
             posters={posters || []}
             onPostersChange={setPosters}
           />
         </Card>
       )}

      {/* 样式预览 */}
      {(() => {
        const posterUrl = posters && posters.length > 0 ? posters[0].url : undefined
        console.log('ConfigSettings - posters:', posters)
        console.log('ConfigSettings - posterUrl:', posterUrl)
        return (
          <StylePreview 
            titleStyle={style.title}
            subtitleStyle={style.subtitle}
            width={270}
            height={480}
            posterUrl={posterUrl}
          />
        )
      })()}

      {/* 高级字体设置模态框 */}
      <Modal
        title={`${currentEditingFont === 'title' ? '标题' : '字幕'}高级字体设置`}
        open={fontModalVisible}
        onCancel={() => setFontModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFontModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 字体样式选项 */}
          <Card title="字体样式" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <label style={{ display: 'block', marginBottom: 8 }}>加粗</label>
                <Switch
                  checked={style[currentEditingFont].bold || false}
                  onChange={(bold) => updateFontStyle('subtitle', { bold })}
                />
              </Col>
              <Col span={8}>
                <label style={{ display: 'block', marginBottom: 8 }}>斜体</label>
                <Switch
                  checked={style[currentEditingFont].italic || false}
                  onChange={(italic) => updateFontStyle('subtitle', { italic })}
                />
              </Col>
              <Col span={8}>
                <label style={{ display: 'block', marginBottom: 8 }}>阴影</label>
                <Switch
                  checked={style[currentEditingFont].shadow || false}
                  onChange={(shadow) => updateFontStyle('subtitle', { shadow })}
                />
              </Col>
            </Row>
          </Card>

          {/* 阴影设置 */}
          {style[currentEditingFont].shadow && (
            <Card title="阴影设置" size="small">
              <label style={{ display: 'block', marginBottom: 8 }}>阴影颜色</label>
              <ColorPicker
                value={style[currentEditingFont].shadowColor || '#000000'}
                onChange={(color) => updateFontStyle('subtitle', { shadowColor: color.toHexString() })}
              />
            </Card>
          )}

          {/* 自定义字体上传 */}
          <Card title="自定义字体" size="small">
            <Upload
              beforeUpload={handleFontUpload}
              accept=".ttf,.otf,.woff,.woff2"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                上传字体文件 (TTF/OTF/WOFF)
              </Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              当前字体: {style[currentEditingFont].fontFamily}
            </div>
          </Card>

          {/* 字体URL输入 */}
          <Card title="字体链接" size="small">
            <Input
              placeholder="输入字体文件URL (如: https://example.com/font.ttf)"
              value={style[currentEditingFont].fontUrl || ''}
              onChange={(e) => {
                const fontUrl = e.target.value
                const fontName = fontUrl.split('/').pop()?.replace(/\.(ttf|otf|woff|woff2)$/i, '') || 'CustomFont'
                updateFontStyle('subtitle', { 
                  fontUrl,
                  fontFamily: fontName
                })
              }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              <div style={{ marginBottom: 8 }}>推荐字体：</div>
              <Space wrap>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    updateFontStyle('subtitle', {
                      fontFamily: 'LIULISONG',
                      fontUrl: '/fonts/LIULISONG.ttf'
                    })
                  }}
                >
                  柳隶宋体
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    updateFontStyle('subtitle', {
                      fontFamily: 'MiaobiJunli',
                      fontUrl: '/fonts/妙笔珺俐体.ttf'
                    })
                  }}
                >
                  妙笔珺俐体
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    updateFontStyle('subtitle', {
                      fontFamily: 'MiaobiDuanmu',
                      fontUrl: '/fonts/妙笔段慕体.ttf'
                    })
                  }}
                >
                  妙笔段慕体
                </Button>
              </Space>
              <div style={{ marginTop: 4, fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                以上字体仅供演示，商用需联系授权
              </div>
            </div>
          </Card>
        </Space>
      </Modal>
    </Space>
  )
}

export default ConfigSettings