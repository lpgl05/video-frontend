// 特性开关配置
export const FEATURE_FLAGS = {
  // 新UI开关 - 设置为 true 启用新UI
  NEW_UI: localStorage.getItem('NEW_UI') === 'true' || true, // 默认启用
  
  // OSS素材管理开关
  OSS_MATERIALS: localStorage.getItem('OSS_MATERIALS') === 'true' || false, // 默认关闭
  
  // 模板系统开关
  TEMPLATE_SYSTEM: localStorage.getItem('TEMPLATE_SYSTEM') === 'true' || false, // 默认关闭
};

// 动态切换特性开关的函数
export const toggleFeatureFlag = (flagName: keyof typeof FEATURE_FLAGS, enabled: boolean) => {
  localStorage.setItem(flagName, enabled.toString());
  // 刷新页面以应用更改
  window.location.reload();
};

// 获取所有特性开关状态
export const getAllFeatureFlags = () => {
  return { ...FEATURE_FLAGS };
};

// 重置所有特性开关
export const resetFeatureFlags = () => {
  Object.keys(FEATURE_FLAGS).forEach(flag => {
    localStorage.removeItem(flag);
  });
  window.location.reload();
};
