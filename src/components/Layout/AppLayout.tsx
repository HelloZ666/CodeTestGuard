import React from 'react';
import { Layout, Typography, Menu } from 'antd';
import {
  SafetyCertificateOutlined,
  ProjectOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <SafetyCertificateOutlined />,
      label: '案例质检',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 24px',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginRight: 40,
          background: 'rgba(255,255,255,0.1)',
          padding: '4px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <SafetyCertificateOutlined style={{ fontSize: 20, color: '#4facfe', marginRight: 8 }} />
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18, fontWeight: 700 }}>
            AI案例质检助手
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, borderBottom: 'none', fontSize: 15, fontWeight: 500 }}
        />
      </Header>
      <Content style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center', color: '#666', background: 'transparent', padding: '24px 0 40px' }}>
        <div style={{ opacity: 0.6, fontSize: 13 }}>
          AI案例质检助手 ©{new Date().getFullYear()} | Powered by DeepSeek & AST Analysis
        </div>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
