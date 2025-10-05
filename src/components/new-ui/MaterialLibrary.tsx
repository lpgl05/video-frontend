import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Upload, message, Space, Modal, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import StylePreview from '../StylePreview';

interface Material {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  type: 'video' | 'audio' | 'poster';
  uploadDate: string;
  size?: number;
  duration?: number;
}

interface MaterialLibraryProps {
  selectedMaterials: {
    videos: string[];
    audios: string[];
    posters: string[];
  };
  onMaterialSelect: (type: string, materialId: string, isSelected: boolean) => void;
  currentStyleConfig?: any; // 当前样式配置，用于预览
  onMaterialsChange?: (materials: { videos: any[]; audios: any[]; posters: any[] }) => void; // 新增：传递素材数据给父组件
}

const MaterialLibrary: React.FC<MaterialLibraryProps> = ({
  selectedMaterials,
  onMaterialSelect,
  currentStyleConfig,
  onMaterialsChange
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [stylePreviewVisible, setStylePreviewVisible] = useState(false);

  // 从OSS获取素材数据
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      let materialsUrl = 'http://39.96.187.7:9999/api/materials';
      // let materialsUrl = '/api/materials'
      // 调用真实的素材获取接口
      const response = await fetch(materialsUrl);
      if (response.ok) {
        const data = await response.json();
        // 转换后端数据格式为前端Material接口格式
        const formattedMaterials = data.map((item: any) => {
          const url: string = item.url || '';
          const fallbackName = url ? decodeURIComponent(url.split('/').pop() || '') : '';
          const name: string = item.name || fallbackName || '未命名素材';
          const uploadedAt: string = item.uploadedAt || item.createdAt || item.uploadDate || '';
          return {
            id: item.id,
            name,
            url,
            type: item.type,
            uploadDate: uploadedAt,
            size: item.size,
            duration: item.duration,
            thumbnail: item.thumbnail
          } as Material;
        });
        setMaterials(formattedMaterials);
        console.log('成功获取素材列表:', formattedMaterials.length, '个素材');
        
        // 通知父组件素材数据已更新
        if (onMaterialsChange) {
          const materialsByType = {
            videos: formattedMaterials.filter(m => m.type === 'video'),
            audios: formattedMaterials.filter(m => m.type === 'audio'),
            posters: formattedMaterials.filter(m => m.type === 'poster')
          };
          onMaterialsChange(materialsByType);
        }
      } else {
        console.error('获取素材列表失败:', response.status);
        setMaterials([]);
      }
    } catch (error) {
      console.error('获取素材列表出错:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };


  const handleUpload = async (file: File, type: string) => {
    const fileKey = `${type}_${file.name}_${Date.now()}`;
    
    // 设置上传状态
    setUploadingFiles(prev => ({ ...prev, [fileKey]: true }));
    setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

    const formData = new FormData();
    // 根据文件类型设置正确的字段名
    if (type === 'video') {
      formData.append('video', file);
    } else if (type === 'audio') {
      formData.append('audio', file);
    } else if (type === 'poster') {
      formData.append('poster', file);
    } else {
      message.error('不支持的文件类型');
      setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
      return;
    }

    try {
      // 根据文件类型选择正确的上传API
      let uploadEndpoint;
      if (type === 'video') {
        uploadEndpoint = '/api/upload/video';
      } else if (type === 'audio') {
        uploadEndpoint = '/api/upload/audio';
      } else if (type === 'poster') {
        uploadEndpoint = '/api/upload/poster';
      } else {
        message.error('不支持的文件类型');
        setUploadingFiles(prev => ({ ...prev, [fileKey]: false }));
        return;
      }
      uploadEndpoint = 'http://39.96.187.7:9999' + uploadEndpoint;

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileKey] || 0;
          if (currentProgress < 90) {
            return { ...prev, [fileKey]: currentProgress + Math.random() * 10 };
          }
          return prev;
        });
      }, 200);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重新加载素材列表以获取最新的素材
          await loadMaterials();
          // 上传后默认选中：优先使用返回的id，否则按文件名匹配
          try {
            if (result.id) {
              onMaterialSelect(type, String(result.id), true);
            } else {
              const uploadedName = file.name;
              const sameName = materials.find(m => m.type === type && (m.name === uploadedName || (m.url && decodeURIComponent(m.url.split('/').pop() || '') === uploadedName)));
              if (sameName) {
                onMaterialSelect(type, sameName.id, true);
              }
            }
          } catch (_) {}
          message.success('素材上传成功！');
        } else {
          message.error(result.error || '上传失败，请重试');
        }
      } else {
        message.error('上传失败，请重试');
      }
    } catch (error) {
      message.error('上传失败，请重试');
    } finally {
      // 清理上传状态
      setTimeout(() => {
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[fileKey];
          return newState;
        });
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[fileKey];
          return newState;
        });
      }, 1000);
    }
  };

  const handleDelete = async (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个素材吗？删除后无法恢复。',
      onOk: async () => {
        try {
          // 根据素材类型选择正确的删除API
          const deleteEndpoint = material.type === 'video' ? `/api/videos/${materialId}` : 
                                material.type === 'audio' ? `/api/audios/${materialId}` : 
                                `/api/upload/poster/${materialId}`;
          const response = await fetch(deleteEndpoint, {
            method: 'DELETE'
          });

          if (response.ok) {
            setMaterials(prev => prev.filter(m => m.id !== materialId));
            message.success('素材删除成功！');
          } else {
            message.error('删除失败，请重试');
          }
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
    setPreviewVisible(true);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || material.type === filterType;
    return matchesSearch && matchesType;
  });

  // 获取选中的海报用于预览
  const selectedPoster = materials.find(material => 
    material.type === 'poster' && selectedMaterials.posters.includes(material.id)
  );

  // 获取所有海报素材（用于预览选择）
  const posterMaterials = materials.filter(material => material.type === 'poster');

  const MaterialCard: React.FC<{ material: Material }> = ({ material }) => {
    const isSelected = selectedMaterials[material.type + 's' as keyof typeof selectedMaterials].includes(material.id);
    const uploadDateValid = !isNaN(Date.parse(material.uploadDate));
    const formattedUpload = uploadDateValid ? new Date(material.uploadDate).toLocaleString() : '-';
    
    return (
      <Card
        hoverable
        className={`material-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onMaterialSelect(material.type, material.id, !isSelected)}
        cover={
          <div className="material-preview" onClick={(e) => { e.stopPropagation(); handlePreview(material); }}>
            {material.type === 'poster' && material.url ? (
              // 海报显示缩略图
              <img 
                src={material.url} 
                alt={material.name}
                style={{ 
                  width: '100%', 
                  height: '120px', 
                  objectFit: 'cover',
                  borderRadius: '6px 6px 0 0'
                }}
                onError={(e) => {
                  // 如果图片加载失败，显示默认图标
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="material-placeholder">
                        <div class="material-icon">🖼️</div>
                      </div>
                      <div class="material-overlay">
                        <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                          <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 0 0 0 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"/>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              // 视频和音频显示图标
              <div className="material-placeholder">
                <div className="material-icon">
                  {material.type === 'video' && '🎥'}
                  {material.type === 'audio' && '🎵'}
                  {material.type === 'poster' && '🖼️'}
                </div>
              </div>
            )}
            <div className="material-overlay">
              <EyeOutlined />
            </div>
          </div>
        }
      >
        <Card.Meta 
          title={material.name}
          description={
            <div>
              {formattedUpload !== '-' && (
                <div>上传时间：{formattedUpload}</div>
              )}
              {typeof material.size === 'number' && material.size > 0 && (
                <div>大小：{(material.size / 1024 / 1024).toFixed(2)}MB</div>
              )}
              {material.duration ? <div>时长：{material.duration}秒</div> : null}
            </div>
          }
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px'
          }}
        >
          <div 
            onClick={() => onMaterialSelect(material.type, material.id, !isSelected)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            {isSelected ? (
              <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            ) : (
              <div style={{ width: '16px', height: '16px', border: '2px solid #d9d9d9', borderRadius: '2px', backgroundColor: 'white' }} />
            )}
            <span style={{ fontSize: '12px', color: '#595959' }}>{isSelected ? '已选择' : '选择'}</span>
          </div>
          <Button 
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); handleDelete(material.id); }}
            style={{ padding: '0 6px', height: '24px', fontSize: '12px' }}
          >删除</Button>
        </div>
      </Card>
    );
  };

  const MaterialSection: React.FC<{ 
    title: string; 
    type: string; 
    materials: Material[] 
  }> = ({ title, type, materials }) => {
    const typeMaterials = materials.filter(m => m.type === type);
    
    // 获取当前类型的上传进度
    const currentUploads = Object.keys(uploadingFiles).filter(key => key.startsWith(type));
    const allIds = typeMaterials.map(m => m.id);
    const selectedIds = selectedMaterials[type + 's' as keyof typeof selectedMaterials] as string[];
    const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
    const toggleSelectAll = () => {
      if (isAllSelected) {
        allIds.forEach(id => onMaterialSelect(type, id, false));
      } else {
        allIds.forEach(id => onMaterialSelect(type, id, true));
      }
    };
    
    return (
      <div className="material-section">
        <div className="section-header">
          <h4>{title}</h4>
          <Space>
            <Button 
              size="small"
              onClick={toggleSelectAll}
              style={{ height: '28px', fontSize: '12px' }}
            >
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
          <Upload
            multiple
            accept={type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : 'image/*'}
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload(file, type);
              return false;
            }}
          >
            <Button 
              icon={<PlusOutlined />} 
              size="small"
              style={{ 
                height: '28px',
                fontSize: '12px',
                padding: '0 12px'
              }}
            >
              上传{title}
            </Button>
          </Upload>
          </Space>
        </div>
        
        {/* 上传进度条 */}
        {currentUploads.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {currentUploads.map(fileKey => (
              <div key={fileKey} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  上传中: {fileKey.split('_').slice(1, -1).join('_')}
                </div>
                <Progress 
                  percent={Math.round(uploadProgress[fileKey] || 0)} 
                  size="small"
                  status={uploadProgress[fileKey] === 100 ? 'success' : 'active'}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="material-grid">
          {typeMaterials.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
          {typeMaterials.length === 0 && currentUploads.length === 0 && (
            <div className="empty-materials">
              <p>暂无{title}，点击上方按钮上传</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="material-library">
      <div className="library-header">
        <h3 className="section-title">📁 素材库管理</h3>
        <Space>
          <Input.Search
            placeholder="搜索素材"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            options={[
              { label: '全部', value: 'all' },
              { label: '视频', value: 'video' },
              { label: '音频', value: 'audio' },
              { label: '海报', value: 'poster' }
            ]}
          />
        </Space>
      </div>

      <div className="material-sections">
        <MaterialSection
          title="视频素材"
          type="video"
          materials={filteredMaterials}
        />
        
        <MaterialSection
          title="音频素材"
          type="audio"
          materials={filteredMaterials}
        />
        
        <MaterialSection
          title="海报素材"
          type="poster"
          materials={filteredMaterials}
        />
      </div>

      {/* 预览模态框 */}
      <Modal
        title="素材预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewMaterial && (
          <div className="material-preview-modal">
            {previewMaterial.type === 'video' && (
              <video
                src={previewMaterial.url}
                controls
                style={{ width: '100%', maxHeight: '400px' }}
              />
            )}
            {previewMaterial.type === 'audio' && (
              <audio
                src={previewMaterial.url}
                controls
                style={{ width: '100%' }}
              />
            )}
            {previewMaterial.type === 'poster' && (
              <img
                src={previewMaterial.url}
                alt={previewMaterial.name}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            )}
            <div className="preview-info">
              <h4>{previewMaterial.name}</h4>
              <p>类型：{previewMaterial.type}</p>
              <p>上传时间：{new Date(previewMaterial.uploadDate).toLocaleDateString()}</p>
              {previewMaterial.duration && <p>时长：{previewMaterial.duration}秒</p>}
            </div>
          </div>
        )}
      </Modal>
      {/* 样式预览：改为内嵌展示，无需按钮 */}
      <div style={{ marginTop: '24px' }}>
        <Card title="📱 手机预览效果" size="small">
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>预览效果 (270 × 480)</div>
            <StylePreview
              titleStyle={currentStyleConfig?.title || {
                mainTitle: { text: '示例标题', fontSize: 64, color: '#ffffff', fontFamily: 'SourceHanSansCN-Heavy' },
                subTitle: { text: '示例副标题', fontSize: 48, color: '#ffff00', fontFamily: 'SourceHanSansCN-Heavy' },
                spacing: 11
              }}
              subtitleStyle={currentStyleConfig?.subtitle || {
                fontSize: 40,
                color: '#ffffff',
                fontFamily: 'SourceHanSansCN-Heavy'
              }}
              posterUrl={selectedPoster?.url}
              width={270}
              height={480}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MaterialLibrary;
