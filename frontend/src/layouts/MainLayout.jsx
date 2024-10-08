import React, { useState } from 'react';
import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  FileOutlined,
  UserOutlined,
  TeamOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
const { Header,Content, Footer, Sider } = Layout;
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const roomItems = [
    getItem(<Link to="controlPanel">控制面板</Link>, 'controlPanel', <FileOutlined />),
    getItem(<Link to="feeDetails">费用明细</Link>, 'feeDetails', <FileOutlined />),
];
const receptManagerItems = [
    getItem(<Link to="profile">我的账号</Link>, 'profile', <UserOutlined />),  
    getItem(<Link to="checkIn">办理入住</Link>, 'checkIn', <FileOutlined />),
];
const airConManagerItems = [
  getItem(<Link to="profile">我的账号</Link>, 'profile', <UserOutlined />),  
  getItem(<Link to="centralControl">空调总控</Link>, 'centralControl', <GlobalOutlined />),
  
];
const managerItems = [
  getItem(<Link to="profile">我的账号</Link>, 'profile', <UserOutlined />),  
  getItem(<Link to="checkIn">办理入住</Link>, 'checkIn', <FileOutlined />),
  getItem(<Link to="centralControl">空调总控</Link>, 'centralControl', <GlobalOutlined />),
];
const MainLayout = () => {
    // 从 localStorage 获取语言，默认为英文
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'zh');

    // 使用 useEffect 监听 localStorage 的变化（可以在组件加载时获取最新的语言设置）
    useEffect(() => {
      const storedLanguage = localStorage.getItem('language');
      if (storedLanguage) {
        setLanguage(storedLanguage);
        console.log('storedLanguage:', storedLanguage);
      }
    }, []);
  
    const role = localStorage.getItem('role');
    const [collapsed, setCollapsed] = useState(false);
    const {
      token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    let items = [];
    switch(role) {
        case 'room':
      items = roomItems;
      break;
    case 'recept_manager':
      items = receptManagerItems;
      break;
    case 'airCon_manager':
      items = airConManagerItems;
      break;
    case 'manager':
      items = managerItems;
      break;
    default:
      items = []; // 处理没有角色的情况，比如返回一个空的菜单或提示无权限
      break;
}
return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark"  mode="inline" items={items} style={{ paddingTop: '85px' }} />
      </Sider>
      <Layout>
      <Header style={{ padding: '0 20px', background: colorBgContainer }}>
            <h1 style={{ 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#333', 
                margin: 0 
            }}>
                {language === 'en' ? 'BUPT Budget Hotel Air Conditioning Billing System' : '波普特廉价酒店空调计费系统'}
            </h1>
        </Header>
        <Content
          style={{
            margin: '0 16px',
          }}
        >
          <Outlet />

        </Content>
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
          BUPT
        </Footer>
      </Layout>
    </Layout>
  );
};
export default MainLayout;