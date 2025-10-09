import React, { useState } from 'react'
import { Layout, Menu, Button, Badge, Avatar, Space, Dropdown } from 'antd'
import { 
  VideoCameraOutlined, 
  UserOutlined, 
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  HomeOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import '../styles/MainLayout.css'

const { Header, Content, Sider } = Layout

interface MainLayoutProps {
  children: React.ReactNode
  currentPage: 'home' | 'user-center' | 'history'
  onPageChange: (page: 'home' | 'user-center' | 'history') => void
  onLogout?: () => void
  unreadNotifications?: number
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange,
  onLogout,
  unreadNotifications = 0 
}) => {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '视频制作',
      onClick: () => onPageChange('home')
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => onPageChange('history')
    },
    {
      key: 'user-center',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => onPageChange('user-center'),
      className: 'hidden-menu-item'
    }
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => onLogout?.()
    }
  ]

  return (
    <Layout className="main-layout">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        width={200}
        className="main-sider"
      >
        <div className="logo-container">
          <div className="logo-content">
            <div className="logo-icon">
              <VideoCameraOutlined />
            </div>
            {!collapsed && (
              <span className="logo-text">AI视频混剪</span>
            )}
          </div>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          className="main-menu"
        />
      </Sider>
      
      <Layout>
        <Header className="main-header">
          <div className="header-title-section">
            <h2 className="header-title">
              {currentPage === 'home' ? 'AI视频混剪工作台' : '个人中心'}
            </h2>
            {currentPage === 'home' && (
              <p className="header-subtitle">
                批量AI生成 | 原创视频制作 | 助力高效运营
              </p>
            )}
          </div>
          
          <div className="header-actions">
            <Badge count={unreadNotifications} size="small">
              <Button 
                className="notification-button"
                type="text" 
                icon={<BellOutlined />}
                onClick={() => onPageChange('user-center')}
              />
            </Badge>
            
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
            >
              <div className="user-dropdown">
                <Avatar 
                  size="small" 
                  icon={<UserOutlined />}
                  className="user-avatar"
                />
                <span className="user-name">用户</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
