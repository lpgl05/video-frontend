import React from 'react';
import { Button, Progress, Card, Space, message } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';

interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  duration: number;
  size: number;
  createdAt: string;
}

interface GenerateControlProps {
  isGenerating: boolean;
  progress?: number;
  onGenerate: () => void;
  generatedVideo?: GeneratedVideo | null;
  canGenerate: boolean;
}

const GenerateControl: React.FC<GenerateControlProps> = ({
  isGenerating,
  progress = 0,
  onGenerate,
  generatedVideo,
  canGenerate
}) => {
  const handleDownload = (video: GeneratedVideo) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = video.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('开始下载视频');
  };

  const handleShare = (video: GeneratedVideo) => {
    if (navigator.share) {
      navigator.share({
        title: video.name,
        text: '看看我生成的视频！',
        url: video.url
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(video.url).then(() => {
        message.success('视频链接已复制到剪贴板');
      });
    }
  };

  const getProgressText = () => {
    if (progress <= 10) return '正在下载素材...';
    if (progress <= 30) return '正在剪辑视频...';
    if (progress <= 50) return '正在生成字幕...';
    if (progress <= 70) return '正在添加音频...';
    if (progress <= 90) return '正在上传视频...';
    return '即将完成...';
  };

  return (
    <div className="generate-control">
      {!generatedVideo ? (
        <div className="generate-section">
          <div className="generate-button-container">
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              loading={isGenerating}
              onClick={onGenerate}
              disabled={!canGenerate}
              className="generate-button"
            >
              {isGenerating ? '生成中...' : '🚀 开始生成视频'}
            </Button>
          </div>

          {isGenerating && (
            <div className="progress-section">
              <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <p className="progress-text">{getProgressText()}</p>
            </div>
          )}

          {!canGenerate && !isGenerating && (
            <div className="generate-tips">
              <p>请先完成以下步骤：</p>
              <ul>
                <li>输入项目名称</li>
                <li>选择至少一个视频素材</li>
                <li>输入或生成文案内容</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="generated-result">
          <Card className="result-card">
            <div className="result-header">
              <h3>🎉 生成完成！</h3>
              <p>您的视频已成功生成</p>
            </div>

            <div className="video-preview">
              <video
                src={generatedVideo.url}
                controls
                poster={generatedVideo.thumbnail}
                style={{ width: '100%', maxHeight: '400px' }}
              />
            </div>

            <div className="video-info">
              <h4>{generatedVideo.name}</h4>
              <div className="video-details">
                <span>时长：{generatedVideo.duration}秒</span>
                <span>大小：{(generatedVideo.size / 1024 / 1024).toFixed(2)}MB</span>
                <span>生成时间：{new Date(generatedVideo.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="result-actions">
              <Space size="middle">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(generatedVideo)}
                  size="large"
                >
                  下载视频
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => handleShare(generatedVideo)}
                  size="large"
                >
                  分享视频
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GenerateControl;
