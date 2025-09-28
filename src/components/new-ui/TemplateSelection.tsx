import React, { useState } from 'react';
import { Button, Card, Space, Modal, Input, message } from 'antd';
import { PlusOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';

interface Template {
  id: string;
  name: string;
  type: 'system' | 'custom';
  preview: string;
  params: any;
  createdAt?: string;
}

interface TemplateSelectionProps {
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  onParamsChange: (params: any) => void;
  onShowParamsPanel: () => void;
  onSaveTemplate: (template: Template) => void;
  customTemplates: Template[];
  onDeleteTemplate: (templateId: string) => void;
  // 添加当前样式配置
  currentStyleConfig?: any;
}

const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onParamsChange,
  onShowParamsPanel,
  onSaveTemplate,
  customTemplates,
  onDeleteTemplate,
  currentStyleConfig
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  // const [showParamsPanel, setShowParamsPanel] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // 系统模板数据
  const systemTemplates: Template[] = [
    {
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
    },
    {
      id: 'template1',
      name: '模板（一）横屏视频',
      type: 'system',
      preview: '',
      params: {
        titleStyle: 'template1',
        fontSize: 20,
        fontColor: '#000000',
        voice: 'female',
        voiceSpeed: 1.0,
        bgm: 'none',
        duration: 30,
        resolution: '1920x1080',
        requirePoster: true,
        enableTitle: false,
        enableSubtitle: false
      }
    },
    {
      id: 'template2',
      name: '模板（二）竖屏视频',
      type: 'system',
      preview: '',
      params: {
        titleStyle: 'template2',
        fontSize: 80,
        fontColor: '#000000',
        voice: 'female',
        voiceSpeed: 1.0,
        bgm: 'none',
        duration: 30,
        resolution: '1080x1920',
        requirePoster: false,
        enableTitle: true,
        enableSubtitle: true
      }
    }
  ];

  // customTemplates 现在通过 props 传递，不需要本地状态

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    if (template.params) {
      onParamsChange(template.params);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      message.error('请输入模板名称');
      return;
    }

    const currentParams = getCurrentTemplateParams(); // 获取当前配置参数
    const newTemplate: Template = {
      id: `custom_${Date.now()}`,
      name: templateName,
      type: 'custom',
      preview: generatePreview(currentParams),
      params: currentParams,
      createdAt: new Date().toISOString()
    };

    // 调用父组件的保存函数
    onSaveTemplate(newTemplate);
    setShowSaveDialog(false);
    setTemplateName('');
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？删除后无法恢复。',
      onOk: () => {
        onDeleteTemplate(templateId);
        message.success('模板删除成功！');
      }
    });
  };

  // 获取当前模板参数 - 包含样式配置
  const getCurrentTemplateParams = () => {
    // 如果有当前样式配置，则使用它；否则使用选中模板的参数
    if (currentStyleConfig) {
      return {
        ...selectedTemplate?.params,
        styleConfig: currentStyleConfig
      };
    }
    return selectedTemplate?.params || {};
  };

  const generatePreview = (_params: any) => {
    return '/templates/custom.jpg';
  };

  const TemplateCard: React.FC<{ template: Template; isSelected: boolean }> = ({ 
    template, 
    isSelected 
  }) => {
    const getTemplateIcon = (templateId: string) => {
      switch (templateId) {
        case 'none':
          return (
            <div className="template-icon none-icon">
              <div className="icon-circle">
                <span className="icon-text">无</span>
              </div>
            </div>
          );
        case 'template1':
          return (
            <div className="template-icon template1-icon">
              <div className="icon-circle">
                <span className="icon-text">横</span>
              </div>
            </div>
          );
        case 'template2':
          return (
            <div className="template-icon template2-icon">
              <div className="icon-circle">
                <span className="icon-text">竖</span>
              </div>
            </div>
          );
        default:
          return (
            <div className="template-icon custom-icon">
              <div className="icon-circle">
                <span className="icon-text">自</span>
              </div>
            </div>
          );
      }
    };

    return (
      <Card
        hoverable
        className={`template-card ${isSelected ? 'selected' : ''}`}
        cover={
          <div className="template-preview">
            {getTemplateIcon(template.id)}
            {isSelected && (
              <div className="selected-indicator">
                <div className="checkmark">✓</div>
              </div>
            )}
          </div>
        }
        onClick={() => handleTemplateSelect(template)}
        actions={template.type === 'custom' ? [
          <Button 
            key="delete" 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTemplate(template.id);
            }}
          />
        ] : undefined}
      >
        <Card.Meta title={template.name} />
      </Card>
    );
  };

  return (
    <div className="template-selection">
      <div className="template-header">
        <h3 className="section-title">🎨 模板选择</h3>
        <Space>
          <Button 
            icon={<SettingOutlined />}
            onClick={onShowParamsPanel}
          >
            参数配置
          </Button>
          <Button 
            onClick={() => setShowManageDialog(true)}
          >
            管理模板
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowSaveDialog(true)}
          >
            保存当前配置
          </Button>
        </Space>
      </div>

      <div className="template-sections">
        <div className="template-section">
          <h4>系统模板</h4>
          <div className="template-grid">
            {systemTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
              />
            ))}
          </div>
        </div>

        <div className="template-section">
          <h4>我的模板</h4>
          <div className="template-grid">
            {customTemplates.length > 0 ? (
              customTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                />
              ))
            ) : (
              <div className="empty-templates">
                <p>暂无自定义模板，点击"保存当前配置"创建模板</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 保存模板对话框 */}
      <Modal
        title="保存自定义模板"
        open={showSaveDialog}
        onOk={handleSaveTemplate}
        onCancel={() => {
          setShowSaveDialog(false);
          setTemplateName('');
        }}
      >
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="请输入模板名称"
        />
      </Modal>

      {/* 模板管理对话框 */}
      <Modal
        title="管理我的模板"
        open={showManageDialog}
        onCancel={() => setShowManageDialog(false)}
        footer={[
          <Button key="close" onClick={() => setShowManageDialog(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div className="template-list">
          {customTemplates.map(template => (
            <div key={template.id} className="template-item">
              <div className="template-info">
                <img src={template.preview} alt={template.name} />
                <div className="template-details">
                  <h4>{template.name}</h4>
                  <p>创建时间：{new Date(template.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
              <div className="template-actions">
                <Button 
                  type="primary" 
                  onClick={() => handleTemplateSelect(template)}
                >
                  使用
                </Button>
                <Button 
                  danger 
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TemplateSelection;
