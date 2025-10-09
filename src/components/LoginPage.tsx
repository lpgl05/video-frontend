import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Space } from 'antd'
import { UserOutlined, LockOutlined, VideoCameraOutlined } from '@ant-design/icons'
import '../styles/LoginPage.css'

interface LoginPageProps {
  onLogin: (userInfo: { phone: string; username: string }) => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // 自动填充账号密码
  useEffect(() => {
    form.setFieldsValue({
      phone: '18612345678',
      password: 'ceshi2025'
    })
  }, [form])

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true)
    
    try {
      // 模拟登录延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 验证固定账号密码
      if (values.phone === '18612345678' && values.password === 'ceshi2025') {
        // 先调用onLogin，成功后再显示消息
        onLogin({
          phone: values.phone,
          username: '用户' + values.phone.slice(-4)
        })
        message.success('登录成功！')
      } else {
        message.error('账号或密码错误')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-overlay"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>
      
      <div className="login-content">
        <Card className="login-card" variant="filled">
          <div className="login-header">
            <div className="logo-section">
              <div className="logo-icon">
                <VideoCameraOutlined />
              </div>
              <h1 className="app-title">AI视频混剪</h1>
            </div>
            <p className="app-subtitle">智能视频创作平台</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            className="login-form"
          >
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="手机号"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码"
                className="custom-input"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="login-button"
                block
              >
                {loading ? '登录中...' : '立即登录'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <Space split={<span className="divider">|</span>}>
              <a href="#" className="footer-link">忘记密码</a>
              <a href="#" className="footer-link">注册账号</a>
              <a href="#" className="footer-link">帮助中心</a>
            </Space>
          </div>
        </Card>


      </div>
    </div>
  )
}

export default LoginPage
