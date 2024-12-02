import React, { useState } from 'react';
import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FileOutlined,
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
const { Header, Content, Footer, Sider } = Layout;
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

// const roomItems = [
//   getItem(<Link to="controlPanel">控制面板</Link>, 'controlPanel', <FileOutlined />),
//   // getItem(<Link to="/controlPanel/2001">控制面板</Link>, 'controlPanel', <FileOutlined />),
//   // getItem(<Link to="feeDetails">费用明细</Link>, 'feeDetails', <FileOutlined />),
// ];
const receptManagerItems = [
  getItem(<Link to="home/profile">我的账号</Link>, 'profile', <UserOutlined />),
  getItem(<Link to="home/checkIn">办理入住</Link>, 'checkIn', <FileOutlined />),
];
const airConManagerItems = [
  getItem(<Link to="home/profile">我的账号</Link>, 'profile', <UserOutlined />),
  getItem(<Link to="home/centralControl">空调总控</Link>, 'centralControl', <GlobalOutlined />),

];
const managerItems = [
  getItem(<Link to="home/profile">我的账号</Link>, 'profile', <UserOutlined />),
  getItem(<Link to="home/checkIn">办理入住</Link>, 'checkIn', <FileOutlined />),
  getItem(<Link to="home/centralControl">空调总控</Link>, 'centralControl', <GlobalOutlined />),
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

  const navigate = useNavigate(); // 使用 useNavigate
  const location = useLocation(); // 用于检查当前路径

  // 检查是否是房间访问路径
  const isRoomAccess = location.pathname.startsWith('/room/');

  // 动态生成菜单项
  let menuItems = [];
  if (isRoomAccess) {
    // 如果是直接访问房间，只显示必要的菜单项
    menuItems = [];  // 可以为空，或者添加你想要显示的其他选项
  } else {
    // 正常的登录用户菜单
    switch (role) {
      // case 'room':
      //   menuItems = roomItems;
      //   break;
      case '前台服务':
        menuItems = receptManagerItems;
        break;
      case '空调管理':
        menuItems = airConManagerItems;
        break;
      case '酒店经理':
        menuItems = managerItems;
        break;
      default:
        menuItems = [];
        break;
    }
  }

  // 处理退出登录的函数
  const handleLogout = () => {
    if (!isRoomAccess) { // 只在非房间访问模式下显示登出功能
      localStorage.removeItem('role');
      localStorage.removeItem('language');
      navigate('/');
    }
  };

  // 在每次渲染时添加“退出登录”菜单项，确保不会重复添加
  // 只在非房间访问模式下添加登出按钮
  const finalMenuItems = isRoomAccess 
    ? menuItems 
    : [...menuItems, getItem('退出登录', 'logout', <LogoutOutlined />)];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          position: 'fixed',  // 使侧边栏固定在视口
          height: '100vh',    // 侧边栏的高度与视口高度一致
          left: 0,            // 侧边栏靠左对齐
          top: 0,             // 从顶部开始
          bottom: 0,          // 延伸到页面底部
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '85px' }}
          onClick={(item) => {
            if (item.key === 'logout') {
              handleLogout(); // 当点击的菜单项 key 为 'logout' 时调用 handleLogout
            }
          }}
          items={[
            ...menuItems,  // 其他菜单项
            {
              label: '退出登录',
              key: 'logout',
              icon: <LogoutOutlined />,
              style: { marginTop: 'auto' },  // 退出登录按钮推到最下方
            },
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header style={{ padding: '0 20px', background: colorBgContainer }}>
          <h1
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0,
            }}
          >
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