import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Select, Upload, message, Space, Modal, Progress, Empty } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined, CheckOutlined, HistoryOutlined, ClearOutlined } from '@ant-design/icons';
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
  referenceCount?: number; // 引用次数（用于历史素材去重显示）
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
  // 原有状态
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [stylePreviewVisible, setStylePreviewVisible] = useState(false);
  
  // 新增状态：历史素材管理
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentSessionMaterials, setCurrentSessionMaterials] = useState<Material[]>([]);
  const [historyModalType, setHistoryModalType] = useState<string>('video'); // 当前查看的历史素材类型
  
  // 各素材类型的搜索状态
  const [videoSearchKeyword, setVideoSearchKeyword] = useState('');
  const [audioSearchKeyword, setAudioSearchKeyword] = useState('');
  const [posterSearchKeyword, setPosterSearchKeyword] = useState('');
  
  // 强制重新渲染的状态
  const [forceRender, setForceRender] = useState(0);

  // 前端去重逻辑
  const deduplicateMaterials = (materials: Material[]): Material[] => {
    const seen = new Set<string>();
    const unique = new Map<string, Material>();
    
    materials.forEach(material => {
      // 使用文件名+大小作为去重键
      const key = `${material.name}_${material.size || 0}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.set(key, {
          ...material,
          referenceCount: 1
        });
      } else {
        // 增加引用计数
        const existing = unique.get(key);
        if (existing) {
          existing.referenceCount = (existing.referenceCount || 1) + 1;
        }
      }
    });
    
    return Array.from(unique.values());
  };

  // 按类型和搜索关键词过滤素材（只显示当前会话素材，不包括历史素材）
  const getFilteredMaterialsByType = (type: string, searchKeyword: string): Material[] => {
    // 只显示当前会话中的素材，不显示历史素材
    return currentSessionMaterials.filter(material => {
      const matchesType = material.type === type;
      const matchesKeyword = !searchKeyword || 
        material.name.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchesType && matchesKeyword;
    });
  };

  // 检查某类型是否有选中的素材
  const hasSelectedMaterialsByType = (type: string): boolean => {
    const typeMaterials = getFilteredMaterialsByType(type, 
      type === 'video' ? videoSearchKeyword : 
      type === 'audio' ? audioSearchKeyword : posterSearchKeyword
    );
    const selectedArray = selectedMaterials[type + 's' as keyof typeof selectedMaterials] as string[];
    return typeMaterials.some(material => selectedArray.includes(material.id));
  };

  // 处理全选/取消全选
  const handleSelectAllByType = (type: string) => {
    const typeMaterials = getFilteredMaterialsByType(type, 
      type === 'video' ? videoSearchKeyword : 
      type === 'audio' ? audioSearchKeyword : posterSearchKeyword
    );
    
    if (typeMaterials.length === 0) return;
    
    const selectedArray = selectedMaterials[type + 's' as keyof typeof selectedMaterials] as string[];
    const allSelected = typeMaterials.every(material => selectedArray.includes(material.id));
    
    if (allSelected) {
      // 取消全选
      const newSelectedArray = selectedArray.filter(id => 
        !typeMaterials.some(material => material.id === id)
      );
      onMaterialsChange({
        ...selectedMaterials,
        [type + 's']: newSelectedArray
      });
    } else {
      // 全选
      const newSelectedArray = [...selectedArray];
      typeMaterials.forEach(material => {
        if (!newSelectedArray.includes(material.id)) {
          newSelectedArray.push(material.id);
        }
      });
      onMaterialsChange({
        ...selectedMaterials,
        [type + 's']: newSelectedArray
      });
    }
  };

  // 处理删除选中素材
  const handleDeleteSelectedByType = (type: string) => {
    const typeMaterials = getFilteredMaterialsByType(type, 
      type === 'video' ? videoSearchKeyword : 
      type === 'audio' ? audioSearchKeyword : posterSearchKeyword
    );
    
    const selectedArray = selectedMaterials[type + 's' as keyof typeof selectedMaterials] as string[];
    const selectedIds = typeMaterials
      .filter(material => selectedArray.includes(material.id))
      .map(material => material.id);
    
    if (selectedIds.length === 0) {
      message.warning(`请先选择要删除的${type === 'video' ? '视频' : type === 'audio' ? '音频' : '海报'}素材`);
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} 个${type === 'video' ? '视频' : type === 'audio' ? '音频' : '海报'}素材吗？`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        const newMaterials = currentSessionMaterials.filter(
          material => !selectedIds.includes(material.id)
        );
        setCurrentSessionMaterials(newMaterials);
        
        const newSelectedArray = selectedArray.filter(id => !selectedIds.includes(id));
        onMaterialsChange({
          ...selectedMaterials,
          [type + 's']: newSelectedArray
        });
        
        message.success(`已删除 ${selectedIds.length} 个${type === 'video' ? '视频' : type === 'audio' ? '音频' : '海报'}素材`);
      }
    });
  };

  // 搜索过滤函数
  const filterMaterials = (materials: Material[], keyword: string, type: string): Material[] => {
    return materials.filter(material => {
      const matchesKeyword = !keyword || 
        material.name.toLowerCase().includes(keyword.toLowerCase());
      const matchesType = type === 'all' || material.type === type;
      
      return matchesKeyword && matchesType;
    });
  };

  // 获取去重后的历史素材
  const deduplicatedMaterials = useMemo(() => {
    return deduplicateMaterials(materials);
  }, [materials]);

  // 从OSS获取素材数据
  useEffect(() => {
    // 确保当前会话素材初始化为空
    setCurrentSessionMaterials([]);
    loadMaterials();
  }, []);

  // 重新加载素材列表（保持当前会话状态）
  const reloadMaterials = async () => {
    try {
      const response = await fetch('http://39.96.187.7:9999/api/materials');
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG reloadMaterials: Raw API response data:', data);
        console.log('DEBUG reloadMaterials: data type:', typeof data, 'isArray:', Array.isArray(data));
        
        // 处理不同的API响应格式
        let materialsArray = [];
        if (Array.isArray(data)) {
          // 直接返回数组格式
          materialsArray = data;
        } else if (data.materials && Array.isArray(data.materials)) {
          // 返回 {materials: [...]} 格式
          materialsArray = data.materials;
        } else {
          console.warn('API返回的数据格式不正确:', data);
          setMaterials([]);
          return;
        }
        
        if (materialsArray.length > 0) {
          const formattedMaterials = materialsArray.map((item: any) => {
            const url = item.file_url || item.url || '';
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
          console.log('重新加载素材列表:', formattedMaterials.length, '个素材');
          
          // 通知父组件素材数据已更新（传递所有素材数据供父组件使用）
          if (onMaterialsChange) {
            const materialsByType = {
              videos: formattedMaterials.filter(m => m.type === 'video'),
              audios: formattedMaterials.filter(m => m.type === 'audio'),
              posters: formattedMaterials.filter(m => m.type === 'poster')
            };
            onMaterialsChange(materialsByType);
          }
        } else {
          console.log('没有素材数据');
          setMaterials([]);
        }
      }
    } catch (error) {
      console.error('重新加载素材列表出错:', error);
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      let materialsUrl = 'http://39.96.187.7:9999/api/materials';
      // let materialsUrl = '/api/materials'
      // 调用真实的素材获取接口
      const response = await fetch(materialsUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG: Raw API response data:', data);
        console.log('DEBUG: data type:', typeof data, 'isArray:', Array.isArray(data));
        if (data.length > 0) {
          console.log('🔍 第一个素材原始数据:', data[0]);
          console.log('🔍 第一个素材的id字段:', data[0].id, '类型:', typeof data[0].id);
        }
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
        
        // 通知父组件素材数据已更新（传递所有素材数据供父组件使用）
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

  // 处理从历史素材选择
  const handleSelectFromHistory = (selectedMaterials: Material[]) => {
    setCurrentSessionMaterials(prev => {
      const newMaterials = [...prev];
      selectedMaterials.forEach(material => {
        // 检查是否已存在（避免重复添加）
        const exists = newMaterials.find(m => m.id === material.id);
        if (!exists) {
          newMaterials.push(material);
        }
      });
      
      // 在状态更新回调中通知父组件，确保使用最新的状态
      setTimeout(() => {
        if (onMaterialsChange) {
          const materialsByType = {
            videos: newMaterials.filter(m => m.type === 'video'),
            audios: newMaterials.filter(m => m.type === 'audio'),
            posters: newMaterials.filter(m => m.type === 'poster')
          };
          onMaterialsChange(materialsByType);
        }
      }, 0);
      
      return newMaterials;
    });
  };

  // 清空当前会话素材
  const handleClearCurrent = () => {
    setCurrentSessionMaterials([]);
    if (onMaterialsChange) {
      onMaterialsChange({
        videos: [],
        audios: [],
        posters: []
      });
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
          // 上传成功后，将新文件添加到当前会话
          console.log('✅ 上传成功，后端返回:', result);
          const materialData = result.data || result;
          const newMaterial = {
            id: materialData.id || result.id || String(Date.now()),  // 优先使用data.id
            name: file.name,
            url: materialData.url || result.file_url || result.url || '',
            type: type as 'video' | 'audio' | 'poster',
            uploadDate: materialData.uploadedAt || new Date().toISOString(),
            size: materialData.size || file.size,
            duration: materialData.duration || 0
          };
          console.log('📦 创建的素材对象:', newMaterial);
          
          // 先添加到当前会话
          setCurrentSessionMaterials(prev => {
            const exists = prev.find(m => m.id === newMaterial.id);
            if (exists) return prev;
            return [...prev, newMaterial];
          });
          
          // 延迟重新加载，确保状态更新完成
          setTimeout(async () => {
            await reloadMaterials();
            // 强制重新渲染
            setForceRender(prev => prev + 1);
          }, 100);
          
          // 上传后默认选中
          setTimeout(() => {
            try {
              onMaterialSelect(type, newMaterial.id, true);
            } catch (error) {
              console.warn('选择素材失败:', error);
            }
          }, 200);
          
          message.success('素材上传成功！');
        } else {
          message.error(result.error || '上传失败，请重试');
        }
      } else {
        message.error('上传失败，请重试');
      }
    } catch (error) {
      console.error('上传出错:', error);
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

  // 历史素材弹窗组件
  const HistoricalMaterialsModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onSelect: (materials: Material[]) => void;
    currentType: string; // 当前查看的素材类型
  }> = ({ visible, onClose, onSelect, currentType }) => {
    const [historySearchKeyword, setHistorySearchKeyword] = useState('');
    const [selectedHistoryMaterials, setSelectedHistoryMaterials] = useState<Material[]>([]);
    
    // 过滤后的历史素材（只显示当前类型的素材）
    const filteredHistoryMaterials = useMemo(() => {
      // 先按类型过滤，再按搜索关键词过滤
      const typeFiltered = deduplicatedMaterials.filter(material => material.type === currentType);
      return filterMaterials(typeFiltered, historySearchKeyword, currentType);
    }, [deduplicatedMaterials, historySearchKeyword, currentType]);
    
    const handleSelect = (material: Material) => {
      setSelectedHistoryMaterials(prev => {
        const exists = prev.find(m => m.id === material.id);
        if (exists) {
          return prev.filter(m => m.id !== material.id);
        } else {
          return [...prev, material];
        }
      });
    };
    
    const handleConfirm = () => {
      onSelect(selectedHistoryMaterials);
      setSelectedHistoryMaterials([]);
      onClose();
    };
    
    const handleCancel = () => {
      setSelectedHistoryMaterials([]);
      onClose();
    };
    
    // 获取类型的中文名称
    const getTypeDisplayName = (type: string) => {
      switch (type) {
        case 'video': return '视频';
        case 'audio': return '音频';
        case 'poster': return '海报';
        default: return '素材';
      }
    };

    return (
      <Modal
        title={`历史${getTypeDisplayName(currentType)}素材`}
        open={visible}
        onCancel={handleCancel}
        onOk={handleConfirm}
        width={1200}
        height={600}
        okText={`选择 ${selectedHistoryMaterials.length} 个素材`}
        cancelText="取消"
      >
        <div className="historical-materials-modal">
          {/* 搜索栏 */}
          <div className="search-controls" style={{ marginBottom: '16px' }}>
            <Input.Search
              placeholder={`搜索${getTypeDisplayName(currentType)}文件名...`}
              value={historySearchKeyword}
              onChange={(e) => setHistorySearchKeyword(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
          
          {/* 素材网格 */}
          <div className="materials-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {filteredHistoryMaterials.map(material => (
              <Card
                key={material.id}
                hoverable
                className={`material-card ${selectedHistoryMaterials.some(m => m.id === material.id) ? 'selected' : ''}`}
                onClick={() => handleSelect(material)}
                cover={
                  <div className="material-preview">
                    {material.type === 'poster' && material.url ? (
                      <img 
                        src={material.url} 
                        alt={material.name}
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div className="material-placeholder" style={{ 
                        height: '120px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5'
                      }}>
                        <div style={{ fontSize: '24px' }}>
                          {material.type === 'video' && '🎥'}
                          {material.type === 'audio' && '🎵'}
                          {material.type === 'poster' && '🖼️'}
                        </div>
                      </div>
                    )}
                  </div>
                }
              >
                <Card.Meta 
                  title={material.name}
                  description={
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {material.referenceCount && material.referenceCount > 1 && (
                          <div>引用次数: {material.referenceCount}</div>
                        )}
                        {material.size && <div>大小: {(material.size / 1024 / 1024).toFixed(2)}MB</div>}
                      </div>
                    </div>
                  }
                />
              </Card>
            ))}
            {filteredHistoryMaterials.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <Empty description="没有找到相关素材" />
              </div>
            )}
          </div>
        </div>
      </Modal>
    );
  };

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
        onClick={() => {
          console.log(`🎯 MaterialCard点击: type=${material.type}, id=${material.id}, name=${material.name}`);
          onMaterialSelect(material.type, material.id, !isSelected);
        }}
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
    // 由于分区内搜索已移至卡片头部，这里直接展示传入的列表
    const visibleMaterials = typeMaterials;
    
    // 调试信息
    console.log(`MaterialSection ${type}:`, {
      title,
      type,
      materialsLength: materials.length,
      typeMaterialsLength: typeMaterials.length,
      visibleMaterialsLength: visibleMaterials.length,
      currentUploadsLength: currentUploads.length
    });
    
    return (
      <div className="material-section">
        {/* 移除section-header，现在由卡片头部处理 */}
        
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
          {/* 上传加号矩形卡片 */}
          <Upload
            multiple
            accept={type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : 'image/*'}
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload(file, type);
              return false;
            }}
          >
            <div className="upload-tile">
              <div className="plus">+</div>
              <div className="hint">上传{title}</div>
            </div>
          </Upload>

          {visibleMaterials.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))}
          {visibleMaterials.length === 0 && currentUploads.length === 0 && (
            <div className="empty-materials" style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: '#999',
              fontSize: '14px'
            }}>
              <p>暂无{title}，请上传或从历史素材中选择</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 错误边界：如果状态异常，显示错误信息
  if (loading && !materials.length) {
    return (
      <div className="material-library" style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 调试信息
  console.log('MaterialLibrary render:', {
    materialsLength: materials.length,
    currentSessionLength: currentSessionMaterials.length,
    loading
  });

  return (
    <div className="material-library">
      <div className="library-header">
        <h3 className="section-title">📁 素材库管理</h3>
        <Space>
          <Button 
            icon={<ClearOutlined />}
            onClick={handleClearCurrent}
            disabled={currentSessionMaterials.length === 0}
          >
            清空当前
          </Button>
        </Space>
      </div>

      {/* 素材类型区域 - 始终显示 */}
      <div className="material-sections">
        <Card 
          className="giant-material-card" 
          title="🎥 视频素材" 
          bordered={false}
          extra={
            <Space size="small" className="card-header-actions">
              <Input.Search
                placeholder="搜索视频素材"
                size="small"
                style={{ width: 180 }}
                value={videoSearchKeyword}
                onChange={(e) => setVideoSearchKeyword(e.target.value)}
                allowClear
              />
              <Button 
                size="small"
                onClick={() => handleSelectAllByType('video')}
              >
                全选
              </Button>
              <Button 
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setHistoryModalType('video');
                  setShowHistoryModal(true);
                }}
              >
                历史视频素材
              </Button>
              {hasSelectedMaterialsByType('video') && (
                <Button 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSelectedByType('video')}
                >
                  删除
                </Button>
              )}
            </Space>
          }
        >
          <MaterialSection
            title="视频素材"
            type="video"
            materials={getFilteredMaterialsByType('video', videoSearchKeyword)}
          />
        </Card>
        
        <Card 
          className="giant-material-card" 
          title="🎵 音频素材" 
          bordered={false}
          extra={
            <Space size="small" className="card-header-actions">
              <Input.Search
                placeholder="搜索音频素材"
                size="small"
                style={{ width: 180 }}
                value={audioSearchKeyword}
                onChange={(e) => setAudioSearchKeyword(e.target.value)}
                allowClear
              />
              <Button 
                size="small"
                onClick={() => handleSelectAllByType('audio')}
              >
                全选
              </Button>
              <Button 
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setHistoryModalType('audio');
                  setShowHistoryModal(true);
                }}
              >
                历史音频素材
              </Button>
              {hasSelectedMaterialsByType('audio') && (
                <Button 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSelectedByType('audio')}
                >
                  删除
                </Button>
              )}
            </Space>
          }
        >
          <MaterialSection
            title="音频素材"
            type="audio"
            materials={getFilteredMaterialsByType('audio', audioSearchKeyword)}
          />
        </Card>
        
        <Card 
          className="giant-material-card" 
          title="🖼️ 海报素材" 
          bordered={false}
          extra={
            <Space size="small" className="card-header-actions">
              <Input.Search
                placeholder="搜索海报素材"
                size="small"
                style={{ width: 180 }}
                value={posterSearchKeyword}
                onChange={(e) => setPosterSearchKeyword(e.target.value)}
                allowClear
              />
              <Button 
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setHistoryModalType('poster');
                  setShowHistoryModal(true);
                }}
              >
                历史海报素材
              </Button>
              {hasSelectedMaterialsByType('poster') && (
                <Button 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSelectedByType('poster')}
                >
                  删除
                </Button>
              )}
            </Space>
          }
        >
          <MaterialSection
            title="海报素材"
            type="poster"
            materials={getFilteredMaterialsByType('poster', posterSearchKeyword)}
          />
        </Card>
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
      
      {/* 历史素材弹窗 */}
      <HistoricalMaterialsModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelect={handleSelectFromHistory}
        currentType={historyModalType}
      />
    </div>
  );
};

export default MaterialLibrary;
