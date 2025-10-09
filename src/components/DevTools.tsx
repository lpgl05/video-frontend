import React, { useState } from 'react';
import { Button, Card, Switch, Space, message, Modal } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { FEATURE_FLAGS, toggleFeatureFlag, resetFeatureFlags } from '../config/featureFlags';

const DevTools: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [flags, setFlags] = useState(FEATURE_FLAGS);

  const handleToggle = (flagName: keyof typeof FEATURE_FLAGS, enabled: boolean) => {
    toggleFeatureFlag(flagName, enabled);
    setFlags(prev => ({ ...prev, [flagName]: enabled }));
    message.success(`已${enabled ? '启用' : '禁用'} ${flagName}`);
  };

  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置所有特性开关吗？页面将重新加载。',
      onOk: () => {
        resetFeatureFlags();
      }
    });
  };

  return (
    <>
      <Button
        type="text"
        icon={<SettingOutlined />}
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #d9d9d9'
        }}
      >
        开发者工具
      </Button>

      <Modal
        title="开发者工具 - 特性开关"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="reset" onClick={handleReset} icon={<ReloadOutlined />}>
            重置所有开关
          </Button>,
          <Button key="close" type="primary" onClick={() => setVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <Card size="small">
          <div style={{ marginBottom: 16 }}>
            <h4>新UI系统</h4>
            <Space>
              <Switch
                checked={flags.NEW_UI}
                onChange={(checked) => handleToggle('NEW_UI', checked)}
              />
              <span>启用新UI界面</span>
            </Space>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
              启用后将使用新的简化UI界面，包含模板系统和素材库管理
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4>OSS素材管理</h4>
            <Space>
              <Switch
                checked={flags.OSS_MATERIALS}
                onChange={(checked) => handleToggle('OSS_MATERIALS', checked)}
              />
              <span>启用OSS素材库</span>
            </Space>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
              启用后将从OSS获取素材列表，支持素材搜索和管理
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4>模板系统</h4>
            <Space>
              <Switch
                checked={flags.TEMPLATE_SYSTEM}
                onChange={(checked) => handleToggle('TEMPLATE_SYSTEM', checked)}
              />
              <span>启用模板系统</span>
            </Space>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>
              启用后将支持模板选择和自定义模板保存
            </p>
          </div>
        </Card>

        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <h5>当前状态：</h5>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>新UI: {flags.NEW_UI ? '✅ 已启用' : '❌ 已禁用'}</li>
            <li>OSS素材: {flags.OSS_MATERIALS ? '✅ 已启用' : '❌ 已禁用'}</li>
            <li>模板系统: {flags.TEMPLATE_SYSTEM ? '✅ 已启用' : '❌ 已禁用'}</li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default DevTools;
